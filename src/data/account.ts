import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';
import { sharedDB, deleteAccountDB } from './db';
import { emit } from './bus';

const session = { pubkey: null as string | null, sk: null as Uint8Array | null };

export const current = () => session.pubkey;
export const canEdit = () => session.sk != null;
export const secretKey = () => session.sk;

export const npub = (pubkey: string) => nip19.npubEncode(pubkey);
export const shortNpub = (pubkey: string) => {
  const n = npub(pubkey);
  return `${n.slice(0, 10)}…${n.slice(-6)}`;
};
export const nsec = (sk: Uint8Array) => nip19.nsecEncode(sk);
export const pubkeyOf = (sk: Uint8Array) => getPublicKey(sk);

// The key sits after '#', which browsers never send to the server.
export const loginLink = (sk: Uint8Array) => `${location.origin}/#/welcome?key=${nip19.nsecEncode(sk)}`;

export function newSecretKey(): Uint8Array {
  return generateSecretKey();
}

export function parseSecret(input: string): Uint8Array {
  const text = input.trim();
  if (text.startsWith('nsec1')) {
    try {
      const decoded = nip19.decode(text);
      if (decoded.type === 'nsec') return decoded.data;
    } catch {
      /* fall through */
    }
  }
  throw new Error('That doesn’t look like a valid nsec1… key.');
}

export interface AccountRecord {
  pubkey: string;
  nsec: string | null;
  lastUsedAt: number;
}

export async function listAccounts(): Promise<AccountRecord[]> {
  const all = (await (await sharedDB()).getAll('accounts')) as AccountRecord[];
  return all.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

function start(pubkey: string, sk: Uint8Array, extra = {}) {
  session.pubkey = pubkey;
  session.sk = sk;
  emit('account', { pubkey, unlocked: true, ...extra });
}

/** remember: keep the nsec on this device so the app opens logged in; otherwise it lasts for this tab only. */
export async function login(sk: Uint8Array, { remember }: { remember: boolean }) {
  const pubkey = getPublicKey(sk);
  const db = await sharedDB();
  const existing = await db.get('accounts', pubkey);
  await db.put('accounts', { pubkey, nsec: remember ? nip19.nsecEncode(sk) : null, lastUsedAt: Date.now() });
  start(pubkey, sk, { isNew: !existing, loggedIn: true });
  return pubkey;
}

/** Logs back into the most recently used remembered account, if any. */
export async function restore() {
  if (session.pubkey) return true;
  for (const rec of await listAccounts()) {
    if (!rec.nsec) continue;
    try {
      const sk = parseSecret(rec.nsec);
      if (getPublicKey(sk) !== rec.pubkey) continue;
      start(rec.pubkey, sk);
      return true;
    } catch {
      /* skip a damaged record */
    }
  }
  return false;
}

export async function isRemembered() {
  return !!(await (await sharedDB()).get('accounts', session.pubkey))?.nsec;
}

export async function setRemembered(remember: boolean) {
  if (!session.sk) return;
  const db = await sharedDB();
  const rec = (await db.get('accounts', session.pubkey)) ?? { pubkey: session.pubkey, lastUsedAt: Date.now() };
  await db.put('accounts', { ...rec, nsec: remember ? nip19.nsecEncode(session.sk) : null });
}

export async function logout({ deleteData }: { deleteData: boolean }) {
  const pubkey = session.pubkey;
  session.pubkey = null;
  session.sk = null;
  if (pubkey) {
    await (await sharedDB()).delete('accounts', pubkey);
    if (deleteData) await deleteAccountDB(pubkey);
  }
  emit('account', { pubkey: null, unlocked: false });
}
