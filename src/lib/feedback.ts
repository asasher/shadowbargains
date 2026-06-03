import { zzfx } from "zzfx";
import { WebHaptics, type HapticInput } from "web-haptics";

export type FeedbackKind =
  | "tap"
  | "select"
  | "success"
  | "error"
  | "roll"
  | "hpUp"
  | "hpDown"
  | "homeExplosion"
  | "homeImpact"
  | "interestUp"
  | "interestDown"
  | "patienceUp"
  | "patienceDown";

const soundPresets: Record<FeedbackKind, Parameters<typeof zzfx>> = {
  tap: [0.35, 0.05, 220, 0.01, 0.02, 0.05, 1, 1.2, 0, 0, 0, 0, 0, 0, 0, 0, 0.02],
  select: [0.4, 0.04, 360, 0.01, 0.03, 0.07, 1, 1.5, 0, 0, 20, 0, 0, 0, 0, 0, 0.01],
  success: [0.45, 0.05, 520, 0.02, 0.05, 0.12, 1, 1.8, 0, 0, 60, 0, 0, 0, 0, 0, 0.02],
  error: [0.45, 0.07, 120, 0.01, 0.06, 0.1, 2, 0.8, 0, 0, -30, 0, 0, 0, 0, 0, 0.03],
  roll: [0.55, 0.04, 160, 0.01, 0.08, 0.18, 4, 1.15, 0, 0, 90, 0.05, 0.02, 0, 0, 0, 0.04],
  hpUp: [0.45, 0.05, 320, 0.01, 0.04, 0.1, 1, 1.4, 0, 0, 55, 0, 0, 0, 0, 0, 0.02],
  hpDown: [0.45, 0.06, 170, 0.01, 0.06, 0.12, 2, 0.85, 0, 0, -55, 0, 0, 0, 0, 0, 0.03],
  homeExplosion: [0.85, 0.09, 76, 0.01, 0.14, 0.44, 4, 1.65, 0, 0, -64, 0.06, 0.08, 0.2, 0.04, 0.06, 0.05],
  homeImpact: [0.72, 0.04, 112, 0.01, 0.03, 0.16, 3, 1.05, 0, 0, -42, 0.01, 0.02, 0.08, 0, 0.02, 0.025],
  interestUp: [0.42, 0.04, 620, 0.01, 0.04, 0.11, 1, 1.7, 0, 0, 90, 0, 0, 0, 0, 0, 0.015],
  interestDown: [0.45, 0.05, 260, 0.01, 0.06, 0.12, 2, 0.75, 0, 0, -80, 0, 0, 0, 0, 0, 0.03],
  patienceUp: [0.4, 0.04, 420, 0.01, 0.05, 0.11, 1, 1.25, 0, 0, 45, 0, 0, 0, 0, 0, 0.02],
  patienceDown: [0.5, 0.05, 110, 0.01, 0.05, 0.14, 3, 0.7, 0, 0, -25, 0, 0.02, 0, 0, 0, 0.035],
};

const layeredSoundPresets: Partial<Record<FeedbackKind, Array<Parameters<typeof zzfx>>>> = {
  homeExplosion: [
    [0.9, 0.05, 58, 0, 0.1, 0.38, 4, 1.9, 0, 0, -72, 0.05, 0.09, 0.24, 0.08, 0.08, 0.055],
    [0.52, 0.18, 420, 0, 0.025, 0.22, 3, 1.2, -180, 0, -240, 0.02, 0.02, 0.6, 0.12, 0.08, 0.04],
  ],
  homeImpact: [
    [0.76, 0.04, 104, 0, 0.025, 0.13, 3, 1.05, 0, 0, -36, 0.01, 0.02, 0.08, 0, 0.02, 0.018],
    [0.34, 0.03, 580, 0, 0.01, 0.045, 2, 1.7, -90, 0, -120, 0.01, 0, 0.12, 0, 0, 0.01],
  ],
};

const hapticPresets: Partial<Record<FeedbackKind, HapticInput>> = {
  homeExplosion: {
    pattern: [
      { duration: 95, intensity: 1 },
      { delay: 35, duration: 140, intensity: 0.9 },
      { delay: 45, duration: 75, intensity: 0.6 },
    ],
  },
  homeImpact: {
    pattern: [
      { duration: 55, intensity: 1 },
      { delay: 38, duration: 45, intensity: 0.65 },
    ],
  },
};

const vibrateFallbacks: Partial<Record<FeedbackKind, number | number[]>> = {
  homeExplosion: [95, 35, 140, 45, 75],
  homeImpact: [55, 38, 45],
  roll: [30, 30, 40],
};

let haptics: WebHaptics | null = null;

function getHaptics() {
  if (!haptics) haptics = new WebHaptics();
  return haptics;
}

export function fireFeedback(kind: FeedbackKind, options: { sound: boolean; haptics: boolean }) {
  if (options.sound) {
    try {
      const layers = layeredSoundPresets[kind] ?? [soundPresets[kind]];
      for (const layer of layers) zzfx(...layer);
    } catch {
      // Sound is strictly optional.
    }
  }

  if (options.haptics) {
    try {
      const customPattern = hapticPresets[kind];
      if (customPattern) {
        void getHaptics().trigger(customPattern);
        return;
      }

      const negative = kind === "error" || kind === "hpDown" || kind === "interestDown" || kind === "patienceDown";
      const positive = kind === "success" || kind === "hpUp" || kind === "interestUp" || kind === "patienceUp";
      const pattern = negative ? "error" : positive ? "success" : kind === "roll" ? "nudge" : 35;
      void getHaptics().trigger(pattern);
    } catch {
      if ("vibrate" in navigator) navigator.vibrate(vibrateFallbacks[kind] ?? 25);
    }
  }
}
