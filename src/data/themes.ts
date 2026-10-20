import type { TimeOfDay } from "../core/types";

export type LayerShape =
  | "hills"
  | "dunes"
  | "pines"
  | "water"
  | "mountains"
  | "mesas";

export interface AreaTheme {
  id: string;
  name: string;
  accent: string;
  shapes: [LayerShape, LayerShape, LayerShape];
  colors: [string, string, string];
}

export interface SkyTheme {
  top: string;
  bottom: string;
  body: "sun" | "moon";
  bodyColor: string;
  x: number;
  y: number;
  r: number;
  darkness: number;
}

const LAYER_BASE = [520, 600, 690] as const;
const LAYER_AMP = [110, 80, 55] as const;
const LAYER_HAZE = [0.35, 0.15, 0] as const;
const NIGHT_INK = "#0b1026";

export const AREAS: Record<string, AreaTheme> = {
  meadow: {
    id: "meadow",
    name: "Meadow",
    accent: "#2e9e5b",
    shapes: ["hills", "hills", "hills"],
    colors: ["#9cc9b0", "#6dae7f", "#3f8a57"],
  },
  canyon: {
    id: "canyon",
    name: "Canyon",
    accent: "#d0602a",
    shapes: ["mesas", "mesas", "dunes"],
    colors: ["#e3b48c", "#cf8558", "#a2552f"],
  },
  forest: {
    id: "forest",
    name: "Forest",
    accent: "#1f7a5c",
    shapes: ["mountains", "pines", "pines"],
    colors: ["#8fb5b0", "#4f8574", "#2c5e4a"],
  },
  lagoon: {
    id: "lagoon",
    name: "Lagoon",
    accent: "#1a8fb5",
    shapes: ["mountains", "hills", "water"],
    colors: ["#93b9c9", "#5e9e8c", "#3c8db0"],
  },
  highlands: {
    id: "highlands",
    name: "Highlands",
    accent: "#6a5acd",
    shapes: ["mountains", "mountains", "hills"],
    colors: ["#a9a6d6", "#7d78b8", "#57508f"],
  },
  desert: {
    id: "desert",
    name: "Desert",
    accent: "#c2701c",
    shapes: ["dunes", "dunes", "dunes"],
    colors: ["#f0cf9a", "#e2ae6c", "#c98842"],
  },
  coast: {
    id: "coast",
    name: "Coast",
    accent: "#2d6fd2",
    shapes: ["hills", "mesas", "water"],
    colors: ["#9db8cf", "#6f93b0", "#2f6fa8"],
  },
  glacier: {
    id: "glacier",
    name: "Glacier",
    accent: "#2f8fc0",
    shapes: ["mountains", "mountains", "water"],
    colors: ["#d3e6f2", "#a7cbe0", "#6fa6c8"],
  },
  bamboo: {
    id: "bamboo",
    name: "Bamboo",
    accent: "#4e8f25",
    shapes: ["hills", "pines", "hills"],
    colors: ["#a8cf8e", "#6fa552", "#417a2e"],
  },
  summit: {
    id: "summit",
    name: "Summit",
    accent: "#c2416b",
    shapes: ["mountains", "mountains", "mountains"],
    colors: ["#c9b4c9", "#9c7fa0", "#6b4e74"],
  },
};

export const SKIES: Record<TimeOfDay, SkyTheme> = {
  dawn: {
    top: "#6c7bd0",
    bottom: "#ffc1a1",
    body: "sun",
    bodyColor: "#ffe2a8",
    x: 300,
    y: 430,
    r: 46,
    darkness: 0.08,
  },
  day: {
    top: "#3e8edb",
    bottom: "#cdebff",
    body: "sun",
    bodyColor: "#fff4c9",
    x: 310,
    y: 160,
    r: 40,
    darkness: 0,
  },
  dusk: {
    top: "#40306e",
    bottom: "#ff8c66",
    body: "sun",
    bodyColor: "#ffb070",
    x: 110,
    y: 440,
    r: 50,
    darkness: 0.22,
  },
  night: {
    top: "#0c1638",
    bottom: "#34497f",
    body: "moon",
    bodyColor: "#f1f3ff",
    x: 90,
    y: 140,
    r: 30,
    darkness: 0.55,
  },
};

export function getAreaTheme(areaId: string): AreaTheme {
  return AREAS[areaId] ?? AREAS.meadow;
}

export { LAYER_BASE, LAYER_AMP, LAYER_HAZE, NIGHT_INK };
