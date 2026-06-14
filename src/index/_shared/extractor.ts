import type { RootContent } from "mdast";
import type { ExtractCtx } from "./extractor/extract-ctx";

/**
 * A function that lifts a typed value out of a list of mdast nodes for one
 * document section.
 *
 * @param nodes - The mdast nodes belonging to the section body.
 * @param ctx - Context carrying the current section heading for error messages.
 * @returns The extracted value of type `T`.
 */
export type Extractor<T> = (nodes: RootContent[], ctx: ExtractCtx) => T;
