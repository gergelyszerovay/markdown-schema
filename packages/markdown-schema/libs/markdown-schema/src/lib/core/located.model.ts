/** What `DirectoryPort.locate` made of the root and the paths a command was given. */
export type Located =
  | {
      kind: 'located';
      /** The root, as the port names it (absolute for the node gateway). */
      root: string;
      /** The requested paths as root-relative POSIX paths; `.` is the root itself. */
      paths: string[];
    }
  | { kind: 'refused'; message: string };
