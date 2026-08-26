type Json = Record<string, unknown>;

export function deepSet(obj: Json | null | undefined, path: string[], value: unknown): Json {
  const clone: Json = structuredClone(obj ?? {});
  let cursor: Json = clone;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const next = cursor[key];
    if (typeof next !== "object" || next === null) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Json;
  }
  cursor[path[path.length - 1]] = value;
  return clone;
}

export function deepGet(obj: Json | null | undefined, path: string[]): unknown {
  let cursor: unknown = obj ?? {};
  for (const key of path) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Json)[key];
  }
  return cursor;
}
