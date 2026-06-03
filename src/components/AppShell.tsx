import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import type { ViewId } from "../types";
import { Icon, type IconName } from "./Icon";
import type { FeedbackKind } from "../lib/feedback";

interface NavItem {
  id: ViewId;
  label: string;
  icon: IconName;
}

interface AppShellProps {
  view: ViewId;
  characterReady: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onFeedback: (kind: FeedbackKind) => void;
  onView: (view: ViewId) => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  children: ReactNode;
}

const feedbackTargetSelector = [
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "[role='button']",
  "[role='radio']",
  "[role='tab']",
  "[role='switch']",
].join(",");

function isDisabledControl(element: Element) {
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.disabled;
  }
  return element.getAttribute("aria-disabled") === "true";
}

export function AppShell({
  view,
  characterReady,
  soundEnabled,
  hapticsEnabled,
  onFeedback,
  onView,
  onToggleSound,
  onToggleHaptics,
  children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [view, characterReady]);

  function handleInteractionFeedback(event: ReactMouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest(feedbackTargetSelector);
    if (!control || control.closest("[data-feedback='manual'], [data-feedback='none']") || isDisabledControl(control)) return;
    onFeedback("tap");
  }

  const quickNavItems: NavItem[] = [
    characterReady
      ? { id: "play", label: "Play Character", icon: "play" }
      : { id: "build", label: "Start Character", icon: "user" },
    { id: "dm", label: "DM Tracker", icon: "dm" },
    { id: "reference", label: "Reference", icon: "book" },
  ];

  function goToView(nextView: ViewId) {
    setMenuOpen(false);
    onView(nextView);
  }

  return (
    <div className="app-shell" onClickCapture={handleInteractionFeedback}>
      <div className="app-main">
        <header className="topbar">
          <button className="brand-lockup topbar__brand" type="button" onClick={() => goToView("home")} aria-label="Go to Home">
            <span className="brand-mark">SB</span>
            <span>
              <strong>Shadow Bargains</strong>
              <em>Home</em>
            </span>
          </button>

          {view === "home" ? (
            <span className="topbar__spacer" aria-hidden="true" />
          ) : (
            <div className="topbar__menu">
              <button
                type="button"
                className="icon-button topbar__menu-toggle"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-controls="desktop-navigation-menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                title="Menu"
              >
                <Icon name={menuOpen ? "close" : "menu"} />
              </button>
              {menuOpen ? (
                <nav className="topbar__menu-list" id="desktop-navigation-menu" aria-label="Quick navigation">
                  {quickNavItems.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={view === item.id ? "is-active" : ""}
                      onClick={() => goToView(item.id)}
                      aria-current={view === item.id ? "page" : undefined}
                    >
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              ) : null}
            </div>
          )}

          <div className="topbar__actions" aria-label="Feedback controls">
            <button
              type="button"
              className="icon-button"
              aria-label="Open settings"
              aria-pressed={view === "settings"}
              onClick={() => onView("settings")}
              title="Settings"
            >
              <Icon name="settings" />
            </button>
            <button
              type="button"
              className="feedback-toggle"
              aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
              aria-pressed={soundEnabled}
              data-feedback="manual"
              onClick={onToggleSound}
              title="Sound"
            >
              <Icon name={soundEnabled ? "volume" : "bell-off"} />
              <span>Sound {soundEnabled ? "On" : "Off"}</span>
            </button>
            <button
              type="button"
              className="feedback-toggle"
              aria-label={hapticsEnabled ? "Turn haptics off" : "Turn haptics on"}
              aria-pressed={hapticsEnabled}
              data-feedback="manual"
              onClick={onToggleHaptics}
              title="Haptics"
            >
              <Icon name="zap" />
              <span>Haptics {hapticsEnabled ? "On" : "Off"}</span>
            </button>
          </div>
        </header>

        <main>{children}</main>
      </div>

      {view === "home" ? null : (
        <nav className="bottom-nav" aria-label="Quick navigation">
          {quickNavItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={view === item.id ? "is-active" : ""}
              onClick={() => goToView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
