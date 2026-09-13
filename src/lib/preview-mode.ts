/** Computed by next.config.ts, then inlined identically in server and browser bundles. Not a user-configured variable. */
export function isV0Preview(): boolean {
  return process.env.MOVIETABLE_V0_PREVIEW === "true";
}

export function tasteStorageKey(): string {
  return isV0Preview() ? "movietable.v0-preview.taste.v1" : "movietable.taste.v1";
}
