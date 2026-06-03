import { zzfx } from "zzfx";
import { WebHaptics } from "web-haptics";

export type FeedbackKind =
  | "tap"
  | "select"
  | "success"
  | "error"
  | "roll"
  | "hpUp"
  | "hpDown"
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
  interestUp: [0.42, 0.04, 620, 0.01, 0.04, 0.11, 1, 1.7, 0, 0, 90, 0, 0, 0, 0, 0, 0.015],
  interestDown: [0.45, 0.05, 260, 0.01, 0.06, 0.12, 2, 0.75, 0, 0, -80, 0, 0, 0, 0, 0, 0.03],
  patienceUp: [0.4, 0.04, 420, 0.01, 0.05, 0.11, 1, 1.25, 0, 0, 45, 0, 0, 0, 0, 0, 0.02],
  patienceDown: [0.5, 0.05, 110, 0.01, 0.05, 0.14, 3, 0.7, 0, 0, -25, 0, 0.02, 0, 0, 0, 0.035],
};

let haptics: WebHaptics | null = null;

function getHaptics() {
  if (!haptics) haptics = new WebHaptics();
  return haptics;
}

export function fireFeedback(kind: FeedbackKind, options: { sound: boolean; haptics: boolean }) {
  if (options.sound) {
    try {
      zzfx(...soundPresets[kind]);
    } catch {
      // Sound is strictly optional.
    }
  }

  if (options.haptics) {
    try {
      const negative = kind === "error" || kind === "hpDown" || kind === "interestDown" || kind === "patienceDown";
      const positive = kind === "success" || kind === "hpUp" || kind === "interestUp" || kind === "patienceUp";
      const pattern = negative ? "error" : positive ? "success" : kind === "roll" ? "nudge" : 35;
      void getHaptics().trigger(pattern);
    } catch {
      if ("vibrate" in navigator) navigator.vibrate(kind === "roll" ? [30, 30, 40] : 25);
    }
  }
}
