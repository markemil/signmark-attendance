import { ConvexError } from "convex/values";

/** Convex redacts plain `Error` messages to a generic string in production —
 * only `ConvexError`'s `.data` reliably carries a message through. Backend
 * mutations throw via `userError()` (convex/lib/errors.ts) for exactly this
 * reason, so this is the one place the client should read an error message. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ConvexError && typeof err.data === "string") {
    return err.data;
  }
  return fallback;
}
