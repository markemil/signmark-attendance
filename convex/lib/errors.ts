import { ConvexError } from "convex/values";

/** Throw a plain-string ConvexError — a regular `Error` gets redacted to a
 * generic message on the client in production; ConvexError's `.data`
 * reliably carries the real message through. */
export function userError(message: string): never {
  throw new ConvexError(message);
}
