import { describe, expect, it } from 'vitest';
import { makeTextFilesFake } from '../../testing/text-files.fake.ts';
import { makeEmitTemplateSchema } from './emit-template-schema.use-case.ts';

const template = `# Doc

> <!-- TEMPLATE-ONLY: string; required; regex \`^[^\\n]{10,200}$\` -->

## Scope

<!-- TEMPLATE-ONLY: freetext -->

Text.
`;

describe('makeEmitTemplateSchema', () => {
  it(
    'reads the template and emits its JSON Schema as serialized JSON',
    {
      tags: ['scenario'],
      meta: {
        spec: 'emit-template-schema-emits-the-shape-schema',
        arrange: 'a readable template with a summary directive and one freetext section',
        act: 'the use case runs on that template',
        assert: 'the result is the serialized draft 2020-12 schema of the template',
      },
    },
    async () => {
      let result: Awaited<ReturnType<ReturnType<typeof makeEmitTemplateSchema>>>;
      const textFiles = makeTextFilesFake({ 't.template.md': template });
      const emit = makeEmitTemplateSchema({ textFiles });
      act: {
        result = await emit({ templatePath: 't.template.md' });
      }
      assert: {
        if (result.kind !== 'emitted') throw new Error(`expected emitted, got ${result.kind}`);
        const schema = JSON.parse(result.json) as Record<string, unknown>;
        expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
        expect(schema.required).toEqual(['title', 'summary', 'scope']);
      }
    },
  );

  it(
    'reports an unreadable or invalid template as its own outcome, without rejecting',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'emit-template-schema-template-failures-are-outcomes',
        arrange: 'a missing template path and a template with an unknown directive',
        act: 'the use case runs on each',
        assert: 'the results are template-unreadable and template-invalid',
      },
    },
    async () => {
      const textFiles = makeTextFilesFake({
        'bad.template.md': '# Doc\n\n## S\n\n<!-- TEMPLATE-ONLY: nonsense -->\n',
      });
      const emit = makeEmitTemplateSchema({ textFiles });
      const missing = await emit({ templatePath: 'absent.template.md' });
      expect(missing.kind).toBe('template-unreadable');
      const invalid = await emit({ templatePath: 'bad.template.md' });
      expect(invalid.kind).toBe('template-invalid');
    },
  );
});
