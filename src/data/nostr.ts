import { SimplePool } from "nostr-tools/pool";
import { finalizeEvent, verifyEvent } from "nostr-tools/pure";
import * as nip44 from "nostr-tools/nip44";
import type { SaveData } from "../core/types";
import { current, secretKey } from "./account";

/**
 * NOSTR sync for the save blob.
 *
 * The whole SaveData is stored as one addressable (replaceable) event per
 * account: kind 30078 with a fixed `d` tag, so each new publish replaces the
 * previous one on relays. The content is NIP-44 encrypted to the account's
 * own pubkey, so only the key holder can read it.
 */

export const SAVE_KIND = 30078;
export const SAVE_D_TAG = "word-vista-save";

export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://nostr.mom",
];

const pool = new SimplePool();

function conversationKey(): Uint8Array {
  const sk = secretKey();
  const pubkey = current();
  if (!sk || !pubkey) throw new Error("Log in to sync your progress.");
  return nip44.getConversationKey(sk, pubkey);
}

/** The encrypted payload: the save plus the moment it was written. */
interface SaveEnvelope {
  updatedAt: number;
  save: SaveData;
}

export interface RemoteSave {
  save: SaveData;
  updatedAt: number;
}

/** Publishes the save to every reachable relay. Returns how many accepted it. */
export async function publishSave(save: SaveData, updatedAt: number): Promise<number> {
  const sk = secretKey();
  const pubkey = current();
  if (!sk || !pubkey) return 0;

  const envelope: SaveEnvelope = { updatedAt, save };
  const content = nip44.encrypt(JSON.stringify(envelope), conversationKey());
  // created_at must increase monotonically so relays replace the old event.
  const created_at = Math.max(Math.floor(Date.now() / 1000), Math.floor(updatedAt / 1000));
  const event = finalizeEvent(
    {
      kind: SAVE_KIND,
      created_at,
      tags: [["d", SAVE_D_TAG]],
      content,
    },
    sk,
  );

  const results = await Promise.allSettled(pool.publish(DEFAULT_RELAYS, event));
  let accepted = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      accepted += 1;
    } else {
      console.warn(`NOSTR publish to ${DEFAULT_RELAYS[i]} failed`, r.reason);
    }
  });
  console.log(`NOSTR: published save (level ${save.currentLevel}) to ${accepted}/${DEFAULT_RELAYS.length} relays`);
  return accepted;
}

/**
 * Fetches the newest save event for the logged-in account, or null when the
 * account has nothing on the relays (or they can't be reached).
 */
export async function fetchRemoteSave(): Promise<RemoteSave | null> {
  const pubkey = current();
  if (!pubkey || !secretKey()) return null;

  const filter = { authors: [pubkey], kinds: [SAVE_KIND], "#d": [SAVE_D_TAG] };
  let events;
  try {
    events = await pool.querySync(DEFAULT_RELAYS, filter, { maxWait: 8000 });
  } catch (err) {
    console.warn("NOSTR fetch failed", err);
    return null;
  }

  let newest = null as null | (typeof events)[number];
  for (const ev of events) {
    if (ev.pubkey !== pubkey || !verifyEvent(ev)) continue;
    if (!newest || ev.created_at > newest.created_at) newest = ev;
  }
  if (!newest) {
    console.log("NOSTR: no remote save found for this account");
    return null;
  }

  try {
    const env = JSON.parse(nip44.decrypt(newest.content, conversationKey())) as SaveEnvelope;
    console.log(`NOSTR: fetched remote save (level ${env.save.currentLevel}, updated ${new Date(env.updatedAt).toISOString()})`);
    return { save: env.save, updatedAt: env.updatedAt };
  } catch (err) {
    console.warn("NOSTR: could not decrypt remote save", err);
    return null;
  }
}
