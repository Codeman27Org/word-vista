import type { AppContext, Route, Screen } from "./appTypes";
import type { LevelIndex, SaveData } from "../core/types";
import type { LevelRepo } from "../data/levelRepo";
import { createScene } from "./scene";
import { createSfx } from "./sfx";
import { clear, play } from "./dom";
import { writeSave } from "../data/storage";
import { createHomeScreen } from "./screens/homeScreen";
import { createGameScreen } from "./screens/gameScreen";
import { createMapScreen } from "./screens/mapScreen";

export function createApp(
  root: HTMLElement,
  deps: { index: LevelIndex; repo: LevelRepo; save: SaveData },
): AppContext {
  const { index, repo, save: initialSave } = deps;

  const scene = createScene();
  root.appendChild(scene.el);

  const screenHost = document.createElement("div");
  screenHost.className = "screen-host";
  root.appendChild(screenHost);

  const overlayHost = document.createElement("div");
  overlayHost.className = "overlay-host";
  root.appendChild(overlayHost);

  let current: Screen | null = null;
  let sfx = createSfx(initialSave.settings.sound);
  let save = initialSave;

  // Unlock audio on first interaction
  function unlockAudio(): void {
    sfx.unlock();
  }
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });

  function getSave(): SaveData {
    return save;
  }

  function setSave(next: SaveData): void {
    save = next;
    writeSave(save);
  }

  function navigate(route: Route): void {
    // Clear overlays
    clear(overlayHost);

    // Destroy current screen
    if (current) {
      current.destroy();
      current = null;
    }

    // Remove old screen element
    while (screenHost.firstChild) {
      screenHost.removeChild(screenHost.firstChild);
    }

    // Build new screen
    let screen: Screen;
    switch (route.name) {
      case "home":
        screen = createHomeScreen(ctx);
        break;
      case "map":
        screen = createMapScreen(ctx);
        break;
      case "game":
        screen = createGameScreen(ctx, route.levelId);
        break;
      default:
        throw new Error(`Unknown route: ${route}`);
    }

    screenHost.appendChild(screen.el);
    current = screen;

    // Fade in
    void play(screen.el, [
      { opacity: 0 },
      { opacity: 1 },
    ], { duration: 200 });
  }

  const ctx: AppContext = {
    index,
    repo,
    getSave,
    setSave,
    navigate,
    scene,
    sfx,
    overlayHost,
  };

  return ctx;
}
