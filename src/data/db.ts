import { openDB, deleteDB } from 'idb';

let sharedDb;
const accountDbs = new Map();

/**
 * Shared database for global data like accounts.
 */
export function sharedDB() {
  sharedDb ??= openDB('word-vista', 1, {
    upgrade(db) {
      db.createObjectStore('accounts', { keyPath: 'pubkey' });
      db.createObjectStore('prefs');
    },
  });
  return sharedDb;
}

/**
 * Per-account database for user-specific data like saves and settings.
 */
export function accountDB(pubkey: string) {
  if (!pubkey) throw new Error('No account selected');
  if (!accountDbs.has(pubkey)) {
    accountDbs.set(
      pubkey,
      openDB(`word-vista-${pubkey}`, 1, {
        upgrade(db) {
          db.createObjectStore('saves', { keyPath: 'key' });
          db.createObjectStore('settings');
        },
      }),
    );
  }
  return accountDbs.get(pubkey);
}

/**
 * Deletes the per-account database.
 */
export async function deleteAccountDB(pubkey: string) {
  const db = accountDbs.get(pubkey);
  if (db) (await db).close();
  accountDbs.delete(pubkey);
  await deleteDB(`word-vista-${pubkey}`);
}

/**
 * Get a preference from the shared database.
 */
export async function getPref(key: string, fallback: unknown): Promise<unknown> {
  return (await (await sharedDB()).get('prefs', key)) ?? fallback;
}

/**
 * Set a preference in the shared database.
 */
export async function setPref(key: string, value: unknown): Promise<void> {
  await (await sharedDB()).put('prefs', value, key);
}
