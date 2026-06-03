import type { AppState } from "../types";
import { Icon } from "../components/Icon";

interface SettingsViewProps {
  state: AppState;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onClearCharacter: () => void;
  onClearDm: () => void;
  onClearAll: () => void;
}

export function SettingsView({
  state,
  onToggleSound,
  onToggleHaptics,
  onClearCharacter,
  onClearDm,
  onClearAll,
}: SettingsViewProps) {
  return (
    <div className="view settings-view">
      <section className="view-header compact">
        <div>
          <h1>Settings</h1>
          <p>Feedback is opt-in. Data stays in this browser only.</p>
        </div>
      </section>

      <section className="panel settings-panel">
        <div className="panel__head">
          <div>
            <h2>Feedback</h2>
            <p>Short opt-in sounds and haptics for controls, rolls, track changes, and clears.</p>
          </div>
        </div>
        <div className="settings-list">
          <button type="button" aria-pressed={state.soundEnabled} data-feedback="manual" onClick={onToggleSound}>
            <Icon name={state.soundEnabled ? "volume" : "bell-off"} />
            <span>
              <strong>Sound</strong>
              <em>{state.soundEnabled ? "On. Rolls and table controls make short sounds." : "Off. Rolls and table controls are muted."}</em>
            </span>
          </button>
          <button type="button" aria-pressed={state.hapticsEnabled} data-feedback="manual" onClick={onToggleHaptics}>
            <Icon name="zap" />
            <span>
              <strong>Haptics</strong>
              <em>{state.hapticsEnabled ? "On. Supported devices vibrate on interaction." : "Off. Supported devices stay silent."}</em>
            </span>
          </button>
        </div>
      </section>

      <section className="panel settings-panel">
        <div className="panel__head">
          <div>
            <h2>Local Data</h2>
            <p>Storage key: shadow-bargains:v1</p>
          </div>
        </div>
        <div className="danger-list">
          <button type="button" data-feedback="manual" onClick={onClearCharacter}>
            <Icon name="trash" /> Clear Character
          </button>
          <button type="button" data-feedback="manual" onClick={onClearDm}>
            <Icon name="trash" /> Clear DM Tracker
          </button>
          <button type="button" className="danger-action" data-feedback="manual" onClick={onClearAll}>
            <Icon name="trash" /> Clear All Local App Data
          </button>
        </div>
      </section>
    </div>
  );
}
