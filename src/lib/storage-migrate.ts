/**
 * Storage keys were originally prefixed `confuzzled-` from an earlier name for
 * the product. The product is Confuzzle, so the keys are too — but anyone with
 * saved work keeps it, because the old keys are copied across once.
 */

export type MigratableStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const LEGACY_KEY_RENAMES: readonly (readonly [legacy: string, current: string])[] = [
  ["confuzzled-profile", "confuzzle-profile"],
  ["confuzzled-history", "confuzzle-history"],
  ["confuzzled-draft", "confuzzle-draft"],
  ["confuzzled-theme", "confuzzle-theme"],
] as const;

export function migrateLegacyStorage(store: MigratableStore): number {
  let moved = 0;
  for (const [legacy, current] of LEGACY_KEY_RENAMES) {
    try {
      if (store.getItem(current) !== null) {
        store.removeItem(legacy);
        continue;
      }
      const value = store.getItem(legacy);
      if (value === null) {
        continue;
      }
      store.setItem(current, value);
      store.removeItem(legacy);
      moved += 1;
    } catch {
      /* private mode or quota — keep the old key rather than lose it */
    }
  }
  return moved;
}
