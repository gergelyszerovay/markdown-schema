import type { z } from "zod";

/**
 * Cross-section invariants for `component.template.md`.
 *
 * Three rules enforced here (matching the `refines` block in the template):
 *
 * 1. **View rule** — a component with `Type: View` must not have Internal State.
 * 2. **Event reference rule** — every event name appearing in a Visual State's
 *    `Visuals:` line must be declared in the Outputs table.
 * 3. **Source rule** — the `Source` classification field is only permitted when
 *    `Type` is `Primitive`.
 */
export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  const classification = d["classification"] as Record<
    string,
    string | undefined
  >;

  // Rule 1: View components must not have internal state.
  if (
    classification["Type"] === "View" &&
    Array.isArray(d["internalState"]) &&
    (d["internalState"] as unknown[]).length > 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["internalState"],
      message: "View components must not have internal state",
    });
  }

  // Rule 2: Every event referenced in a Visuals: line must appear in Outputs.
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

  // Rule 3: Source is only allowed for Primitive components.
  if (classification["Source"] && classification["Type"] !== "Primitive") {
    ctx.addIssue({
      code: "custom",
      path: ["classification"],
      message: "Source is only allowed for Primitive components",
    });
  }
};
