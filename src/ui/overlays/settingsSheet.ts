import type { AppContext } from "../appTypes";
import type { OverlayHandle } from "./overlay";
import { el } from "../dom";
import { createNewSave } from "../../core/economy";
import { openOverlay } from "./overlay";
import { openAccountSheet } from "./accountSheet";
import * as account from "../../data/account";

let resetTimer: ReturnType<typeof setTimeout> | null = null;

export function openSettingsSheet(ctx: AppContext): OverlayHandle {
  const card = el("div", "card");

  // Title
  const title = el("h2", "", "SETTINGS");
  card.appendChild(title);

  const save = ctx.getSave();

  // Sound toggle
  const soundRow = el("div", "row");
  const soundLabel = el("span", "", "Sound");
  const toggleBtn = document.createElement("button") as HTMLButtonElement;
  toggleBtn.type = "button";
  toggleBtn.className = `toggle${save.settings.sound ? " on" : ""}`;
  toggleBtn.setAttribute("aria-pressed", String(save.settings.sound));
  soundRow.appendChild(soundLabel);
  soundRow.appendChild(toggleBtn);
  card.appendChild(soundRow);

  toggleBtn.addEventListener("click", () => {
    const currentSave = ctx.getSave();
    const newSound = !currentSave.settings.sound;
    ctx.setSave({
      ...currentSave,
      settings: { ...currentSave.settings, sound: newSound },
    });
    ctx.sfx.setEnabled(newSound);
    toggleBtn.className = `toggle${newSound ? " on" : ""}`;
    toggleBtn.setAttribute("aria-pressed", String(newSound));
  });

  // Account
  const accountRow = el("div", "row");
  const accountLabel = el("span", "", "Account");
  const accountBtn = document.createElement("button") as HTMLButtonElement;
  accountBtn.type = "button";
  accountBtn.className = "pill-btn secondary";
  accountBtn.style.marginTop = "0";
  accountBtn.style.padding = "6px 14px";
  accountBtn.style.fontSize = "14px";
  const pubkey = account.current();
  accountBtn.textContent = pubkey ? account.shortNpub(pubkey) : "Log in";
  accountRow.appendChild(accountLabel);
  accountRow.appendChild(accountBtn);
  card.appendChild(accountRow);

  accountBtn.addEventListener("click", () => {
    handle.close();
    openAccountSheet(ctx);
  });

  // Reset progress
  const resetRow = el("div", "row");
  const resetLabel = el("span", "", "Reset progress");
  const resetBtn = document.createElement("button") as HTMLButtonElement;
  resetBtn.type = "button";
  resetBtn.className = "danger";
  resetBtn.textContent = "Reset";
  resetRow.appendChild(resetLabel);
  resetRow.appendChild(resetBtn);
  card.appendChild(resetRow);

  let confirmed = false;
  resetBtn.addEventListener("click", () => {
    if (confirmed) {
      ctx.setSave(createNewSave());
      handle.close();
      ctx.navigate({ name: "home" });
      return;
    }
    confirmed = true;
    resetBtn.textContent = "Tap again to confirm";
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      resetBtn.textContent = "Reset";
      confirmed = false;
    }, 3000);
  });

  // Credits
  const credits = el("div", "credits", "Word lists: SCOWL © Kevin Atkinson; ENABLE (public domain). Font: Nunito (SIL OFL).");
  card.appendChild(credits);

  // Close button
  const closeBtn = el("button", "pill-btn secondary", "CLOSE");
  closeBtn.type = "button";
  closeBtn.addEventListener("click", () => {
    handle.close();
  });
  card.appendChild(closeBtn);

  const handle = openOverlay(ctx.overlayHost, card, { dismissOnScrim: true });
  return handle;
}
