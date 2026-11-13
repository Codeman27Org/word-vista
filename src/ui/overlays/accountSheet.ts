import type { AppContext } from "../appTypes";
import type { OverlayHandle } from "./overlay";
import { el, clear } from "../dom";
import { openOverlay } from "./overlay";
import * as account from "../../data/account";
import { syncSaveFromNostr } from "../../data/storage";
import type { Loader } from "../loader";
import { createLoader } from "../loader";

/**
 * Account sheet: create a key, log in with an nsec, see the logged-in npub,
 * or log out. Progress syncs through NOSTR relays once logged in.
 */
export function openAccountSheet(ctx: AppContext): OverlayHandle {
  const card = el("div", "card");
  const handle = openOverlay(ctx.overlayHost, card, { dismissOnScrim: true });

  function showError(message: string): void {
    let err = card.querySelector(".account-error") as HTMLElement | null;
    if (!err) {
      err = el("p", "account-error");
      err.style.color = "var(--danger)";
      err.style.fontWeight = "800";
      err.style.fontSize = "13px";
      card.appendChild(err);
    }
    err.textContent = message;
  }

  function showLoading(title: string): Loader {
    clear(card);
    const loader = createLoader(title, [
      "Unlocking your key…",
      "Pinging the relays…",
      "Fetching your progress…",
      "Vibing with NOSTR…",
      "Almost there…",
    ]);
    card.appendChild(loader.el);
    return loader;
  }

  async function afterLogin(loader: Loader): Promise<void> {
    const applied = await syncSaveFromNostr().catch(() => null);
    if (applied) {
      // A newer save came down from relays; reload so the app boots with it.
      loader.setMessage("Progress synced! Reloading…");
      location.reload();
      return;
    }
    loader.destroy();
    handle.close();
    ctx.navigate({ name: "home" });
  }

  function showLoggedIn(pubkey: string): void {
    clear(card);
    card.appendChild(el("h2", "", "ACCOUNT"));
    const row = el("div", "row");
    row.appendChild(el("span", "", "Logged in as"));
    row.appendChild(el("span", "", account.shortNpub(pubkey)));
    card.appendChild(row);

    const note = el("p", "credits", "Your progress syncs to NOSTR relays with this key.");
    card.appendChild(note);

    const syncBtn = el("button", "pill-btn", "SYNC NOW");
    syncBtn.type = "button";
    syncBtn.addEventListener("click", () => {
      syncBtn.textContent = "SYNCING…";
      void (async () => {
        // Pull remote first; if local is newer, syncSaveFromNostr will push it.
        let failed = false;
        const applied = await syncSaveFromNostr().catch(() => {
          failed = true;
          return null;
        });
        if (applied) {
          syncBtn.textContent = "SYNCED — RELOADING";
          location.reload();
          return;
        }
        syncBtn.textContent = failed ? "SYNC FAILED" : "SYNCED";
        setTimeout(() => (syncBtn.textContent = "SYNC NOW"), 2000);
      })();
    });
    card.appendChild(syncBtn);

    const logoutBtn = el("button", "pill-btn secondary", "LOG OUT");
    logoutBtn.type = "button";
    logoutBtn.addEventListener("click", () => {
      void account.logout({ deleteData: false }).then(() => {
        handle.close();
        ctx.navigate({ name: "home" });
      });
    });
    card.appendChild(logoutBtn);

    const closeBtn = el("button", "pill-btn secondary", "CLOSE");
    closeBtn.type = "button";
    closeBtn.style.marginTop = "10px";
    closeBtn.addEventListener("click", () => void handle.close());
    card.appendChild(closeBtn);
  }

  function showLogin(): void {
    clear(card);
    card.appendChild(el("h2", "", "LOG IN"));

    const input = document.createElement("input");
    input.type = "password";
    input.placeholder = "nsec1…";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.style.width = "100%";
    input.style.padding = "10px";
    input.style.borderRadius = "12px";
    input.style.border = "0";
    input.style.font = "inherit";
    input.style.marginBottom = "12px";
    card.appendChild(input);

    const rememberRow = el("label", "row");
    const remember = document.createElement("input");
    remember.type = "checkbox";
    remember.checked = true;
    rememberRow.appendChild(remember);
    rememberRow.appendChild(el("span", "", " Remember me on this device"));
    card.appendChild(rememberRow);

    const loginBtn = el("button", "pill-btn", "LOG IN");
    loginBtn.type = "button";
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginBtn.click();
    });
    loginBtn.addEventListener("click", () => {
      try {
        const sk = account.parseSecret(input.value);
        input.value = "";
        const rememberMe = remember.checked;
        const loader = showLoading("LOGGING IN");
        void account.login(sk, { remember: rememberMe }).then(() => afterLogin(loader)).catch((e: unknown) => {
          loader.destroy();
          showLogin();
          showError(e instanceof Error ? e.message : "Login failed. Please try again.");
        });
      } catch (e) {
        showError(e instanceof Error ? e.message : "Invalid key.");
      }
    });
    card.appendChild(loginBtn);

    const createBtn = el("button", "pill-btn secondary", "CREATE NEW ACCOUNT");
    createBtn.type = "button";
    createBtn.style.marginTop = "10px";
    createBtn.addEventListener("click", showCreate);
    card.appendChild(createBtn);

    const closeBtn = el("button", "pill-btn secondary", "CLOSE");
    closeBtn.type = "button";
    closeBtn.style.marginTop = "10px";
    closeBtn.addEventListener("click", () => void handle.close());
    card.appendChild(closeBtn);
  }

  function showCreate(): void {
    clear(card);
    card.appendChild(el("h2", "", "CREATE ACCOUNT"));

    const sk = account.newSecretKey();
    const nsec = account.nsec(sk);

    const secretBox = el("code", "secret", nsec);
    secretBox.style.display = "block";
    secretBox.style.wordBreak = "break-all";
    secretBox.style.padding = "10px";
    secretBox.style.background = "rgba(0,0,0,.1)";
    secretBox.style.borderRadius = "12px";
    secretBox.style.marginBottom = "12px";
    card.appendChild(secretBox);

    const copyBtn = el("button", "pill-btn secondary", "COPY KEY");
    copyBtn.type = "button";
    copyBtn.addEventListener("click", () => {
      void navigator.clipboard.writeText(nsec).then(() => {
        copyBtn.textContent = "COPIED!";
        setTimeout(() => (copyBtn.textContent = "COPY KEY"), 2000);
      });
    });
    card.appendChild(copyBtn);

    const savedRow = el("label", "row");
    const saved = document.createElement("input");
    saved.type = "checkbox";
    savedRow.appendChild(saved);
    savedRow.appendChild(el("span", "", " I saved my key somewhere safe"));
    card.appendChild(savedRow);

    const rememberRow = el("label", "row");
    const remember = document.createElement("input");
    remember.type = "checkbox";
    remember.checked = true;
    rememberRow.appendChild(remember);
    rememberRow.appendChild(el("span", "", " Remember me on this device"));
    card.appendChild(rememberRow);

    const createBtn = el("button", "pill-btn", "CREATE ACCOUNT");
    createBtn.type = "button";
    createBtn.addEventListener("click", () => {
      if (!saved.checked) {
        showError("Please confirm you saved your key first.");
        return;
      }
      const rememberMe = remember.checked;
      const loader = showLoading("CREATING ACCOUNT");
      void account.login(sk, { remember: rememberMe }).then(() => afterLogin(loader)).catch((e: unknown) => {
        loader.destroy();
        showLogin();
        showError(e instanceof Error ? e.message : "Account creation failed. Please try again.");
      });
    });
    card.appendChild(createBtn);

    const backBtn = el("button", "pill-btn secondary", "BACK");
    backBtn.type = "button";
    backBtn.style.marginTop = "10px";
    backBtn.addEventListener("click", showLogin);
    card.appendChild(backBtn);
  }

  const pubkey = account.current();
  if (pubkey) {
    showLoggedIn(pubkey);
  } else {
    showLogin();
  }

  return handle;
}
