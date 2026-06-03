import type { ViewId } from "../types";
import { images } from "../data/images";
import { Icon } from "../components/Icon";

interface HomeViewProps {
  characterReady: boolean;
  onView: (view: ViewId) => void;
}

export function HomeView({ characterReady, onView }: HomeViewProps) {
  const characterView = characterReady ? "play" : "build";

  return (
    <div className="view home-view">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <h1 id="home-title">Shadow Bargains</h1>
          <p>
            One night, one bargain. Take a gift, carry a curse, and get to the fight before the
            candle burns down.
          </p>
          <div className="action-row home-actions">
            <button type="button" className="primary-action" onClick={() => onView(characterView)}>
              <Icon name={characterReady ? "play" : "user"} /> {characterReady ? "Play Character" : "Start Character"}
            </button>
            <button type="button" onClick={() => onView("dm")}>
              <Icon name="dm" /> DM Tracker
            </button>
            <button type="button" onClick={() => onView("reference")}>
              <Icon name="book" /> Reference
            </button>
          </div>
        </div>
        <figure className="hero-art">
          <img src={images.home} alt="Pixel art cavern table with cursed tokens and alchemical glow" />
        </figure>
      </section>
    </div>
  );
}
