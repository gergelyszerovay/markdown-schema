import type { z } from "zod";

/**
 * Cross-section invariant for `component.template.md`, matching the opening
 * guide block of the template:
 *
 * - **Event reference rule** — every event name appearing in a Visual State's
 *   `Visuals:` line must be declared in the Outputs table.
 *
 * The other conditional rules of the template need no code: `remove-if Type=View`
 * on Internal State and `only-if Type=Primitive` on Source are directives.
 * The rule reads only `doc`, so it runs in Node and in a browser alike.
 */
export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  // Every event referenced in a Visuals: line must appear in Outputs.
  const eventNames = new Set(
    (d["outputs"] as Array<Record<string, string>>).map((o) => o["Event Name"]),
  );
  (d["visualStates"] as Array<{ heading: string; items: string[] }>).forEach(
    (state, si) => {
      const visLine = state.items.find((l) => l.startsWith("Visuals:")) ?? "";
      // bulletList strips backtick markup via mdast-util-to-string, so match
      // bare onXxx words.
      const refs = [...visLine.matchAll(/\b(on[A-Z][a-zA-Z0-9]*)\b/g)].map(
        (m) => m[1],
      );
      refs.forEach((ref) => {
        if (!eventNames.has(ref)) {
          ctx.addIssue({
            code: "custom",
            path: ["visualStates", si, "items"],
            message: `event "${ref}" is not declared in Outputs`,
          });
        }
      });
    },
  );
};
