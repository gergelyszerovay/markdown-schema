import { bindDocuments } from '../binding/bind-documents.rules.ts';
import { cleanFileSet } from '../binding/clean-file-set.rules.ts';
import { cleanPath } from '../binding/clean-path.rules.ts';
import { compareText } from '../binding/compare-text.rules.ts';
import { listFilePaths } from '../binding/list-file-paths.rules.ts';
import { listTemplates } from '../binding/list-templates.rules.ts';
import { listUnreadTemplateLinks } from '../binding/list-unread-template-links.rules.ts';
import { parentDir } from '../binding/parent-dir.rules.ts';
import { templateFoldersAbove } from '../binding/template-folders-above.rules.ts';
import type { DirectoryPort } from '../directory.port.ts';
import { outcomeOfError } from '../document-failure.rules.ts';
import { errorMessage } from '../error-message.rules.ts';
import type { RefineLoader } from '../refine-loader.port.ts';
import { parseTemplate } from '../template/parse-template.rules.ts';
import type { TextFiles } from '../text-files.port.ts';
import type { ValidateTreeInput } from './validate-tree.input.ts';
import type {
  AmbiguousDocument,
  TemplateFailure,
  TreeDocument,
  TreeOutcome,
  ValidateTreeResult,
} from './validate-tree.result.ts';

/** Validates every bound document under some paths and reports what became of each. */
export type ValidateTree = (input: ValidateTreeInput) => Promise<ValidateTreeResult>;

/** Directory names never entered: version control, dependencies and build output. */
const builtInSkippedDirNames: readonly string[] = ['.git', 'node_modules', 'dist'];

/** How many documents are read at a time. */
const batchSize = 16;

/** The part of a compiled template that validates a document's text. */
type Schema = { parse(raw: string): unknown };

/**
 * Splits `--ignore` values into directory names and root-relative paths. A value with a `/`
 * is a path; any other is a directory name that is skipped wherever it sits.
 * @param ignore - The values as the caller wrote them.
 * @returns The names and the cleaned paths.
 */
function splitIgnores(ignore: readonly string[]): { names: string[]; paths: string[] } {
  const names: string[] = [];
  const paths: string[] = [];
  for (const value of ignore) {
    const segments = cleanPath(value);
    if (segments === null) continue;
    if (segments.length === 1) names.push(segments[0] ?? '');
    else paths.push(segments.join('/'));
  }
  return { names, paths };
}

/**
 * Creates the use case behind `validate-md <path>`: lists the requested paths and the templates
 * folders above them once (the whole root through Git when a path is the root), builds the
 * catalog, binds every Markdown file listed, compiles each template that a document is bound
 * to once, and validates each bound document against its template, reading documents in
 * batches. A file in a template's own `examples/` folder is validated against that template.
 * @param deps - The ports the use case works through: `directory` finds the root and lists
 *   what the paths can bind to, `textFiles` reads the templates and the documents, and
 *   `loadRefine` finds a template's `refine` companion.
 * @returns The use case.
 * @failure A root or path the directory port refuses ends the run with `refused`; a tree that
 * cannot be listed ends it with `unreadable`. A template that cannot be read or compiled is
 * one `templateErrors` entry and its documents are `not-validated`. A document that cannot be
 * read or fails its schema gets its own outcome and the run continues. A `refine` companion
 * that fails to load makes its template a `templateErrors` entry.
 */
export function makeValidateTree({
  directory,
  textFiles,
  loadRefine,
}: {
  directory: DirectoryPort;
  textFiles: TextFiles;
  loadRefine: RefineLoader;
}): ValidateTree {
  return async (input) => {
    const located = await directory.locate({ root: input.root, paths: input.paths });
    if (located.kind === 'refused') return { kind: 'refused', message: located.message };
    const { root } = located;
    const at = (path: string): string =>
      root.endsWith('/') ? `${root}${path}` : `${root}/${path}`;

    const ignores = splitIgnores(input.ignore);
    const ignoredDirNames = [...builtInSkippedDirNames, ...ignores.names];
    let entries;
    try {
      entries = await directory.listScope(root, {
        paths: located.paths,
        templateFolders: templateFoldersAbove(located.paths),
        skipDirNames: ignoredDirNames,
      });
    } catch (error) {
      return { kind: 'unreadable', message: errorMessage(error) };
    }
    const files = [
      ...cleanFileSet(
        listFilePaths(entries).filter(
          (path) => !ignores.paths.some((skipped) => path.startsWith(`${skipped}/`)),
        ),
      ),
    ];

    const bindings = bindDocuments({ paths: files, ignoredDirNames }).documents;

    // The listing also holds the templates folders above the paths; only the paths report.
    const inScope = (path: string): boolean =>
      located.paths.some(
        (scope) => scope === '.' || path === scope || path.startsWith(`${scope}/`),
      );
    const scoped = bindings.filter((binding) => inScope(binding.path));

    const exampleDirs = listTemplates({ paths: files, ignoredDirNames }).templates.map(
      (template) => ({
        prefix: `${parentDir(template.path)}/examples/`,
        templatePath: template.path,
      }),
    );
    const targets: { path: string; templatePath: string }[] = [];
    const ambiguous: AmbiguousDocument[] = [];
    const unbound: string[] = [];
    for (const binding of scoped) {
      if (binding.status === 'bound' && binding.templatePath !== null) {
        targets.push({ path: binding.path, templatePath: binding.templatePath });
      } else if (binding.status === 'ambiguous') {
        ambiguous.push({ path: binding.path, candidates: binding.candidates });
      } else if (binding.status === 'unbound') {
        unbound.push(binding.path);
      } else if (binding.status === 'template') {
        const example = exampleDirs.find((dir) => binding.path.startsWith(dir.prefix));
        if (example !== undefined)
          targets.push({ path: binding.path, templatePath: example.templatePath });
      }
    }

    // Each template is read and compiled once, however many documents are bound to it.
    const schemas = new Map<string, Schema | TemplateFailure>();
    for (const templatePath of [...new Set(targets.map((target) => target.templatePath))]) {
      try {
        const raw = await textFiles.read(at(templatePath));
        const refine = input.noRefine ? undefined : await loadRefine(at(templatePath));
        schemas.set(templatePath, parseTemplate(raw, { refine }));
      } catch (error) {
        schemas.set(templatePath, { templatePath, message: errorMessage(error) });
      }
    }

    const validateOne = async (target: {
      path: string;
      templatePath: string;
    }): Promise<TreeDocument> => {
      const schema = schemas.get(target.templatePath);
      const outcome = async (): Promise<TreeOutcome> => {
        if (schema === undefined || !('parse' in schema)) {
          return {
            kind: 'not-validated',
            path: target.path,
            message: `its template ${target.templatePath} did not compile`,
          };
        }
        try {
          schema.parse(await textFiles.read(at(target.path)));
          return { kind: 'valid', path: target.path, wrote: undefined };
        } catch (error) {
          return outcomeOfError(target.path, error);
        }
      };
      return { path: target.path, templatePath: target.templatePath, outcome: await outcome() };
    };

    const documents: TreeDocument[] = [];
    for (let start = 0; start < targets.length; start += batchSize) {
      documents.push(
        ...(await Promise.all(targets.slice(start, start + batchSize).map(validateOne))),
      );
    }
    documents.sort((left, right) => compareText(left.path, right.path));

    const templateErrors = [...schemas.values()].filter(
      (schema): schema is TemplateFailure => !('parse' in schema),
    );
    const ok = documents.filter((document) => document.outcome.kind === 'valid').length;
    return {
      kind: 'validated',
      root,
      documents,
      ambiguous,
      unbound,
      templateErrors,
      unreadTemplateLinks: listUnreadTemplateLinks(entries),
      summary: {
        documents: documents.length,
        ok,
        failed: documents.length - ok,
        ambiguous: ambiguous.length,
        unbound: unbound.length,
        templateErrors: templateErrors.length,
      },
    };
  };
}
