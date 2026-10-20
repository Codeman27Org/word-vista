import { el, play, clear, SHAKE_KEYFRAMES } from "../dom";

export interface PreviewView {
  el: HTMLElement;
  show(word: string): void;
  hide(): Promise<void>;
  shake(): Promise<void>;
  letterRects(): DOMRect[];
  rect(): DOMRect;
}

export function createPreviewView(): PreviewView {
  const pill = el("div", "preview");
  const row = el("div", "preview-row");
  row.appendChild(pill);

  let counter = 0;

  function show(word: string): void {
    ++counter;
    clear(pill);
    pill.classList.remove("hidden");
    if (word) {
      pill.classList.add("visible");
      for (const ch of word) {
        const span = el("span", "preview-letter", ch);
        pill.appendChild(span);
      }
    } else {
      pill.classList.remove("visible");
    }
    // Cancel any pending hide
    pill.style.transition = "";
  }

  function hide(): Promise<void> {
    return new Promise<void>((resolve) => {
      const gen = ++counter;
      pill.style.transition = "opacity 150ms";
      pill.classList.remove("visible");
      setTimeout(() => {
        if (counter !== gen) {
          resolve();
          return;
        }
        clear(pill);
        pill.classList.add("hidden");
        pill.style.transition = "";
        resolve();
      }, 150);
    });
  }

  function shake(): Promise<void> {
    return new Promise<void>((resolve) => {
      pill.classList.add("bad");
      void play(pill, SHAKE_KEYFRAMES, { duration: 320, easing: "ease" }).then(() => {
        pill.classList.remove("bad");
        void hide().then(() => resolve());
      });
    });
  }

  function letterRects(): DOMRect[] {
    return Array.from(pill.querySelectorAll(".preview-letter")).map(
      (el) => el.getBoundingClientRect(),
    );
  }

  function rect(): DOMRect {
    return pill.getBoundingClientRect();
  }

  return { el: row, show, hide, shake, letterRects, rect };
}
