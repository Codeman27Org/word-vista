import { SimplePool } from "nostr-tools/pool";
import { finalizeEvent, verifyEvent } from "nostr-tools/pure";
import type { Event } from "nostr-tools/pure";
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

// Highest created_at we have published or seen, so the next publish always
// supersedes it on relays even if another device's clock runs ahead.
let lastCreatedAt = 0;

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

/**
 * Orders saves by progress: the higher level wins, and only on the same level
 * does the newer write win. Levels only ever go up, so a stale device (or a
 * skewed clock) can never pull progress backwards. Positive when a is ahead.
 */
export function compareSaves(a: RemoteSave, b: RemoteSave): number {
  if (a.save.currentLevel !== b.save.currentLevel) return a.save.currentLevel - b.save.currentLevel;
  return a.updatedAt - b.updatedAt;
}

/** Publishes the save to every reachable relay. Returns how many accepted it. */
export async function publishSave(save: SaveData, updatedAt: number): Promise<number> {
  const sk = secretKey();
  const pubkey = current();
  if (!sk || !pubkey) return 0;

  const envelope: SaveEnvelope = { updatedAt, save };
  const content = nip44.encrypt(JSON.stringify(envelope), conversationKey());
  // created_at must increase monotonically so relays replace the old event.
  const created_at = Math.max(Math.floor(Date.now() / 1000), Math.floor(updatedAt / 1000), lastCreatedAt + 1);
  lastCreatedAt = created_at;
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

const EOSE_REASON = "closed automatically on eose";

/** Queries every relay; `reachable` counts relays that connected and answered. */
function queryRelays(pubkey: string): Promise<{ events: Event[]; reachable: number }> {
  const filter = { authors: [pubkey], kinds: [SAVE_KIND], "#d": [SAVE_D_TAG] };
  return new Promise((resolve) => {
    const events: Event[] = [];
    pool.subscribeEose(DEFAULT_RELAYS, filter, {
      maxWait: 8000,
      onevent(ev) {
        events.push(ev);
      },
      onclose(reasons) {
        resolve({ events, reachable: reasons.filter((r) => r.reason === EOSE_REASON).length });
      },
    });
  });
}

/**
 * Fetches the most advanced save for the logged-in account across all relays
 * (relays can hold different versions). Returns null when the account has
 * nothing on the relays; throws when no relay could be reached or no event
 * could be read, so callers never mistake an outage for "no save".
 */
export async function fetchRemoteSave(): Promise<RemoteSave | null> {
  const pubkey = current();
  if (!pubkey || !secretKey()) return null;

  const { events, reachable } = await queryRelays(pubkey);
  if (reachable === 0) throw new Error("No NOSTR relay could be reached.");

  let best: RemoteSave | null = null;
  let valid = 0;
  for (const ev of events) {
    if (ev.pubkey !== pubkey || !verifyEvent(ev)) continue;
    valid += 1;
    lastCreatedAt = Math.max(lastCreatedAt, ev.created_at);
    try {
      const env = JSON.parse(nip44.decrypt(ev.content, conversationKey())) as SaveEnvelope;
      if (typeof env.updatedAt !== "number" || typeof env.save?.currentLevel !== "number") continue;
      const candidate: RemoteSave = { save: env.save, updatedAt: env.updatedAt };
      if (!best || compareSaves(candidate, best) > 0) best = candidate;
    } catch (err) {
      console.warn("NOSTR: could not decrypt a remote save", err);
    }
  }

  if (!best) {
    if (valid > 0) throw new Error("Could not read the save stored on NOSTR relays.");
    console.log(`NOSTR: no remote save found for this account (${reachable}/${DEFAULT_RELAYS.length} relays answered)`);
    return null;
  }
  console.log(
    `NOSTR: fetched remote save (level ${best.save.currentLevel}, updated ${new Date(best.updatedAt).toISOString()}) from ${valid} event(s), ${reachable}/${DEFAULT_RELAYS.length} relays answered`,
  );
  return best;
}
