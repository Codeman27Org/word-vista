import { describe, it, expect } from "vitest";
import { hexToRgb, rgbToHex, mix } from "../../src/ui/color";

describe("hexToRgb", () => {
  it('converts "#ff8000" to [255, 128, 0]', () => {
    expect(hexToRgb("#ff8000")).toEqual([255, 128, 0]);
  });
});

describe("rgbToHex", () => {
  it('converts [255, 128, 0] to "#ff8000"', () => {
    expect(rgbToHex([255, 128, 0])).toBe("#ff8000");
  });

  it("clamps and rounds: [300, -5, 12.6] → '#ff000d'", () => {
    expect(rgbToHex([300, -5, 12.6])).toBe("#ff000d");
  });
});

describe("mix", () => {
  it("mixes #000000 and #ffffff at t=0.5 → #808080", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("t=0 returns a", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
  });

  it("t=1 returns b", () => {
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
  });
});
