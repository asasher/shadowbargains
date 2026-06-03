import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { HomeView } from "./views/HomeView";
import { BuildView } from "./views/BuildView";
import { PlayView } from "./views/PlayView";
import { DmView } from "./views/DmView";
import { ReferenceView } from "./views/ReferenceView";
import { SettingsView } from "./views/SettingsView";
import type { AppState, CharacterState, DmTrackerState, ViewId } from "./types";
import { clearStoredState, defaultCharacter, defaultDm, loadState, saveState } from "./lib/storage";
import { fireFeedback, type FeedbackKind } from "./lib/feedback";
import { isCharacterReadyForPlay } from "./lib/character";

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());

  function commit(updater: (state: AppState) => AppState) {
    setState((previous) => saveState(updater(previous)));
  }

  function feedback(kind: FeedbackKind, overrides?: Partial<{ sound: boolean; haptics: boolean }>) {
    fireFeedback(kind, {
      sound: overrides?.sound ?? state.soundEnabled,
      haptics: overrides?.haptics ?? state.hapticsEnabled,
    });
  }

  function setView(view: ViewId) {
    commit((previous) => ({ ...previous, view }));
  }

  function updateCharacter(updates: Partial<CharacterState>) {
    commit((previous) => ({ ...previous, character: { ...previous.character, ...updates } }));
  }

  function updateDm(updates: Partial<DmTrackerState>) {
    commit((previous) => ({ ...previous, dm: { ...previous.dm, ...updates } }));
  }

  function updateSceneUsedIds(sceneUsedIds: string[]) {
    commit((previous) => ({ ...previous, sceneUsedIds }));
  }

  function toggleSound() {
    const next = !state.soundEnabled;
    commit((previous) => ({ ...previous, soundEnabled: next }));
    feedback("select", { sound: state.soundEnabled || next });
  }

  function toggleHaptics() {
    const next = !state.hapticsEnabled;
    commit((previous) => ({ ...previous, hapticsEnabled: next }));
    feedback("select", { haptics: state.hapticsEnabled || next });
  }

  function clearCharacter() {
    if (!window.confirm("Clear the saved character from this browser?")) return;
    commit((previous) => ({ ...previous, character: defaultCharacter, lastRoll: null, sceneUsedIds: [] }));
    feedback("success");
  }

  function clearDm() {
    if (!window.confirm("Clear the DM tracker from this browser?")) return;
    commit((previous) => ({ ...previous, dm: defaultDm }));
    feedback("success");
  }

  function clearAll() {
    if (!window.confirm("Clear all Shadow Bargains local app data from this browser?")) return;
    clearStoredState();
    const reset = { ...loadState(), savedAt: new Date().toISOString() };
    setState(reset);
    feedback("success");
  }

  const view = state.view;
  const characterReady = isCharacterReadyForPlay(state.character);

  return (
    <AppShell
      view={view}
      characterReady={characterReady}
      soundEnabled={state.soundEnabled}
      hapticsEnabled={state.hapticsEnabled}
      onFeedback={feedback}
      onView={setView}
      onToggleSound={toggleSound}
      onToggleHaptics={toggleHaptics}
    >
      {view === "home" ? <HomeView characterReady={characterReady} onView={setView} /> : null}
      {view === "build" ? (
        <BuildView character={state.character} onCharacter={updateCharacter} onPlay={() => setView("play")} />
      ) : null}
      {view === "play" ? (
        <PlayView
          character={state.character}
          sceneUsedIds={state.sceneUsedIds}
          onFeedback={feedback}
          onCharacter={updateCharacter}
          onSceneUsedIds={updateSceneUsedIds}
          onBuild={() => setView("build")}
        />
      ) : null}
      {view === "dm" ? <DmView dm={state.dm} onDm={updateDm} onFeedback={feedback} /> : null}
      {view === "reference" ? <ReferenceView /> : null}
      {view === "settings" ? (
        <SettingsView
          state={state}
          onToggleSound={toggleSound}
          onToggleHaptics={toggleHaptics}
          onClearCharacter={clearCharacter}
          onClearDm={clearDm}
          onClearAll={clearAll}
        />
      ) : null}
    </AppShell>
  );
}
