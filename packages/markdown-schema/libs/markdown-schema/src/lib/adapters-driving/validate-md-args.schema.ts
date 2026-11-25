/** The `validate-md` command line in directory mode, parsed. */
export type ValidateTreeArgs = Extract<ValidateMdArgs, { kind: 'validate-tree' }>;

/** The parsed `validate-md` command line. */
export type ValidateMdArgs =
  | {
      kind: 'validate';
      templatePath: string;
      documentPaths: string[];
      emitJsonPath: string | undefined;
      noRefine: boolean;
    }
  | {
      /** `--template <file> --emit-schema`: print the template's JSON Schema. */
      kind: 'emit-schema';
      templatePath: string;
    }
  | {
      kind: 'validate-tree';
      /** The files and directories to validate; `.` when none was given. */
      paths: string[];
      root: string | undefined;
      ignore: string[];
      noRefine: boolean;
      json: boolean;
      verbose: boolean;
    }
  | { kind: 'help' }
  | {
      kind: 'usage-error';
      /** The error to print first; absent when the command line was empty. */
      message: string | undefined;
      /** Whether the usage line follows the message. */
      showUsage: boolean;
    };
