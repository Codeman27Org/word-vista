export type SfxName = "found" | "bonus" | "invalid" | "hint" | "coin" | "complete" | "shuffle";

export interface Sfx {
  unlock(): void;
  select(index: number): void;
  play(name: SfxName): void;
  setEnabled(on: boolean): void;
}

export function createSfx(enabled: boolean): Sfx {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let on = enabled;

  function ensureCtx(): void {
    if (!ctx) {
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.15;
      masterGain.connect(ctx.destination);
    }
  }

  function tone(
    freq: number,
    startOffset: number,
    duration: number,
    type: OscillatorType = "sine",
    gainMul = 1,
    glideTo?: number,
  ): void {
    if (!ctx || !masterGain) return;
    const t0 = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gainMul, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    if (glideTo) {
      osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
    }
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function playFound(): void {
    tone(1047, 0, 0.09);
    tone(1319, 0.07, 0.09);
  }

  function playBonus(): void {
    tone(660, 0, 0.18, "triangle", 1, 1320);
  }

  function playInvalid(): void {
    tone(140, 0, 0.12, "square", 0.5);
  }

  function playHint(): void {
    tone(880, 0, 0.08);
    tone(1175, 0.08, 0.08);
  }

  function playCoin(): void {
    tone(1568, 0, 0.05, "square", 0.4);
    tone(2093, 0.05, 0.08, "square", 0.4);
  }

  function playComplete(): void {
    tone(523, 0, 0.12);
    tone(659, 0.1, 0.12);
    tone(784, 0.2, 0.12);
    tone(1047, 0.3, 0.12);
  }

  function playShuffle(): void {
    tone(500, 0, 0.04, "triangle");
    tone(600, 0.045, 0.04, "triangle");
    tone(700, 0.09, 0.04, "triangle");
  }

  const dispatchers: Record<SfxName, () => void> = {
    found: playFound,
    bonus: playBonus,
    invalid: playInvalid,
    hint: playHint,
    coin: playCoin,
    complete: playComplete,
    shuffle: playShuffle,
  };

  return {
    unlock() {
      try {
        ensureCtx();
        if (ctx && ctx.state === "suspended") {
          ctx.resume();
        }
      } catch {
        // Audio unavailable — no-op
      }
    },

    select(index: number): void {
      if (!on || !ctx || !masterGain) return;
      const freq = 440 * Math.pow(2, (index * 2) / 12);
      tone(freq, 0, 0.07);
    },

    play(name: SfxName): void {
      if (!on || !ctx || !masterGain) return;
      const fn = dispatchers[name];
      if (fn) fn();
    },

    setEnabled(onVal: boolean): void {
      on = onVal;
    },
  };
}
