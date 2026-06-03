import { useState } from "react";
import { Icon } from "./Icon";
import type { FeedbackKind } from "../lib/feedback";

type TrackTone = "hp" | "interest" | "patience";

const feedbackByTone: Record<TrackTone, { up: FeedbackKind; down: FeedbackKind }> = {
  hp: { up: "hpUp", down: "hpDown" },
  interest: { up: "interestUp", down: "interestDown" },
  patience: { up: "patienceUp", down: "patienceDown" },
};

interface TrackProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  note?: string;
  tone?: TrackTone;
  onFeedback?: (kind: FeedbackKind) => void;
  onChange: (value: number) => void;
}

export function Track({ label, value, min = 0, max, note, tone = "hp", onFeedback, onChange }: TrackProps) {
  const [flash, setFlash] = useState<{ index: number; nonce: number } | null>(null);
  const clamped = Math.min(max, Math.max(min, value));
  const pipCount = Math.max(0, max - min);

  function commit(nextValue: number, flashIndex?: number) {
    const next = Math.min(max, Math.max(min, nextValue));
    if (next !== clamped) {
      onFeedback?.(next > clamped ? feedbackByTone[tone].up : feedbackByTone[tone].down);
    }
    if (flashIndex !== undefined) {
      const nonce = Date.now();
      setFlash({ index: flashIndex, nonce });
      window.setTimeout(() => {
        setFlash((previous) => (previous?.nonce === nonce ? null : previous));
      }, 460);
    }
    onChange(next);
  }

  return (
    <div className={`track-control pip-track is-${tone}`} data-feedback="manual">
      <div className="track-control__top">
        <span>{label}</span>
        <strong className="numeric">
          {clamped}/{max}
        </strong>
      </div>
      <div className="track-pips" role="group" aria-label={label}>
        {Array.from({ length: pipCount }, (_, index) => {
          const valueAtPip = min + index + 1;
          const filled = valueAtPip <= clamped;
          const nextValue = clamped === valueAtPip ? valueAtPip - 1 : valueAtPip;
          const ariaLabel = clamped === valueAtPip ? `Turn ${label} down to ${nextValue}` : `Set ${label} to ${valueAtPip}`;
          return (
            <button
              type="button"
              key={`${index}-${flash?.index === index ? flash.nonce : 0}`}
              className={`track-pip ${filled ? "is-filled" : ""} ${flash?.index === index ? "is-flickering" : ""}`}
              aria-pressed={filled}
              aria-label={ariaLabel}
              onClick={() => commit(nextValue, index)}
            />
          );
        })}
      </div>
      <div className="track-actions">
        {note ? <span>{note}</span> : <span />}
        <span>
          <button type="button" className="small-button" disabled={clamped <= min} aria-label={`Decrease ${label}`} onClick={() => commit(clamped - 1, Math.max(0, clamped - min - 1))}>
            <Icon name="minus" />
          </button>
          <button type="button" className="small-button" disabled={clamped >= max} aria-label={`Increase ${label}`} onClick={() => commit(clamped + 1, Math.min(pipCount - 1, clamped - min))}>
            <Icon name="plus" />
          </button>
        </span>
      </div>
    </div>
  );
}
