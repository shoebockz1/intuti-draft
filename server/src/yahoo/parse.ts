// Yahoo's JSON responses represent collections as objects keyed "0", "1", ...,
// "count" rather than real arrays, and "meta" records as arrays of single-key
// objects rather than one merged object. These helpers unwrap both shapes so
// the rest of the code can work with normal arrays/objects.

/* eslint-disable @typescript-eslint/no-explicit-any */

export function collectionValues<T = any>(obj: any): T[] {
  if (!obj || typeof obj !== "object") return [];
  const count = typeof obj.count === "number" ? obj.count : Object.keys(obj).length;
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const value = obj[String(i)];
    if (value !== undefined) out.push(value);
  }
  return out;
}

/** Merges an array of single-key objects (Yahoo's "meta array" shape) into one object. */
export function flattenMeta(arr: any): Record<string, any> {
  if (!Array.isArray(arr)) return {};
  return arr.reduce((acc, item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      Object.assign(acc, item);
    }
    return acc;
  }, {} as Record<string, any>);
}
