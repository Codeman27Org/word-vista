import type { LevelIndex, SaveData } from "../core/types";
import type { LevelRepo } from "../data/levelRepo";
import type { Scene } from "./scene";
import type { Sfx } from "./sfx";

export type Route =
  | { name: "home" }
  | { name: "map" }
  | { name: "game"; levelId: number };

export interface Screen {
  el: HTMLElement;
  destroy(): void;
}

export interface AppContext {
  index: LevelIndex;
  repo: LevelRepo;
  getSave(): SaveData;
  setSave(next: SaveData): void;
  navigate(route: Route): void;
  scene: Scene;
  sfx: Sfx;
  overlayHost: HTMLElement;
}
