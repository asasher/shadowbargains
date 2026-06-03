import { useMemo, useState } from "react";
import { archetypes, movementSummary } from "../data/archetypes";
import { images } from "../data/images";
import { powers } from "../data/powers";
import { weapons } from "../data/weapons";
import { referenceSections } from "../data/rules";
import { Icon } from "../components/Icon";
import { PowerToken } from "../components/PowerToken";
import type { ReferenceSection, RuleTable, StatKey } from "../types";

const filters = [
  { id: "all", label: "All" },
  { id: "rule", label: "Rules" },
  { id: "combat", label: "Combat" },
  { id: "negotiation", label: "Negotiation" },
  { id: "archetype", label: "Classes" },
  { id: "weapon", label: "Weapons" },
  { id: "boon", label: "Boons" },
  { id: "bane", label: "Banes" },
];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function matches(query: string, filter: string, kind: string, text: string) {
  const kindMatches = filter === "all" || filter === kind || (filter === "rule" && kind === "reference");
  return kindMatches && (query === "" || normalize(text).includes(query));
}

const statLabels: Record<StatKey, string> = {
  might: "Might",
  guile: "Guile",
  will: "Will",
};

function powerNames(ids: string[]) {
  return ids
    .map((id) => powers.find((power) => power.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

function weaponNames(ids: string[]) {
  return ids
    .map((id) => weapons.find((weapon) => weapon.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

function classNames(ids: string[]) {
  return ids
    .map((id) => archetypes.find((archetype) => archetype.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

function sectionKinds(section: ReferenceSection) {
  const kinds = new Set(["reference", section.id]);
  if (section.table) kinds.add(section.table.kind);
  section.tables?.forEach((table) => kinds.add(table.kind));
  return kinds;
}

function sectionMatches(query: string, filter: string, section: ReferenceSection) {
  const kinds = sectionKinds(section);
  const kindMatches =
    filter === "all" ||
    kinds.has(filter) ||
    (filter === "rule" && (kinds.has("rule") || kinds.has("reference")));
  return kindMatches && (query === "" || normalize(`${section.title} ${section.summary} ${JSON.stringify(section)}`).includes(query));
}

function sectionTables(section: ReferenceSection) {
  return [section.table, ...(section.tables ?? [])].filter((table): table is RuleTable => Boolean(table));
}

export function ReferenceView() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const normalizedQuery = normalize(query);

  const visibleSections = useMemo(
    () => referenceSections.filter((section) => sectionMatches(normalizedQuery, filter, section)),
    [filter, normalizedQuery],
  );
  const visibleArchetypes = useMemo(
    () => archetypes.filter((archetype) =>
      matches(
        normalizedQuery,
        filter,
        "archetype",
        `${archetype.name} ${archetype.role} ${statLabels[archetype.requiredStat]} ${archetype.talent} ${archetype.classFeatures.map((feature) => `${feature.name} ${feature.text}`).join(" ")} ${archetype.gear} ${movementSummary(archetype)} ${archetype.movement.feature} ${weaponNames(archetype.weaponIds)} ${powerNames(archetype.boonIds)} ${powerNames(archetype.baneIds)}`,
      ),
    ),
    [filter, normalizedQuery],
  );
  const visibleWeapons = useMemo(
    () => weapons.filter((weapon) =>
      matches(normalizedQuery, filter, "weapon", `${weapon.name} ${classNames(weapon.classIds)} ${weapon.attack} ${weapon.damage} ${weapon.range} ${weapon.text}`),
    ),
    [filter, normalizedQuery],
  );
  const visiblePowers = useMemo(
    () => powers.filter((power) =>
      matches(normalizedQuery, filter, power.kind, `${power.name} ${power.summary} ${power.text}`),
    ),
    [filter, normalizedQuery],
  );
  const visibleCounts = visibleSections.length + visibleArchetypes.length + visibleWeapons.length + visiblePowers.length;

  return (
    <div className="view reference-view">
      <section className="view-header">
        <div>
          <h1>Reference</h1>
          <p>Quick rules first, then details, classes, weapons, Boons, Banes, combat, and negotiation.</p>
        </div>
        <img src={images.rules} alt="Pixel art rules cave alcove with dice and alchemical light" />
      </section>

      <section className="panel search-panel">
        <label className="search-box" htmlFor="reference-search">
          <Icon name="search" />
          <input
            id="reference-search"
            type="search"
            value={query}
            placeholder="Search Pitfall, Motivation, Defense, Stalker, Heavy Blade"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="filters" role="group" aria-label="Reference filters">
          {filters.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="quiet" aria-live="polite">{visibleCounts} matching entries</p>
      </section>

      <section className="reference-stack">
        {visibleSections.map((section) => {
          const tables = sectionTables(section);

          return (
            <article className="panel" key={section.id}>
              <div className="panel__head">
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.summary}</p>
                </div>
              </div>
              {section.bullets ? (
                <ol className="step-list">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ol>
              ) : null}
              {section.cards ? (
                <div className="summary-grid">
                  {section.cards.map((card) => (
                    <article className="summary-tile" key={card.title}>
                      <strong>{card.title}</strong>
                      <p>{card.text}</p>
                    </article>
                  ))}
                </div>
              ) : null}
              {tables.map((table) => (
                <div className="rule-table-block" key={table.title}>
                  <div className="table-caption">
                    <strong>{table.title}</strong>
                    {table.note ? <p>{table.note}</p> : null}
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>{table.columns.map((column) => <th key={column}>{column}</th>)}</tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row) => (
                          <tr key={row.join("-")}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </article>
          );
        })}
      </section>

      {visibleArchetypes.length > 0 ? (
        <section className="panel">
          <div className="panel__head">
            <div>
              <h2>Classes</h2>
              <p>Fast one-shot roles, features, weapons, and gated bargain picks.</p>
            </div>
          </div>
          <div className="reference-card-grid">
            {visibleArchetypes.map((archetype) => (
              <article className="reference-card" key={archetype.id}>
                <img src={archetype.image} alt="" />
                <div>
                  <h3>{archetype.name}</h3>
                  <p>{archetype.role}</p>
                  <dl>
                    <dt>Requirement</dt><dd>{statLabels[archetype.requiredStat]} +1 or better</dd>
                    <dt>Movement</dt><dd>{movementSummary(archetype)}. {archetype.movement.feature}</dd>
                    <dt>Class Features</dt><dd>{[archetype.talent, ...archetype.classFeatures.map((feature) => `${feature.name}: ${feature.text}`)].join(" ")}</dd>
                    <dt>Weapons</dt><dd>{weaponNames(archetype.weaponIds) || "Spell Attack only"}</dd>
                    <dt>Gear</dt><dd>{archetype.gear}</dd>
                    <dt>Boons</dt><dd>{powerNames(archetype.boonIds)}</dd>
                    <dt>Banes</dt><dd>{powerNames(archetype.baneIds)}</dd>
                  </dl>
                  <ul>{archetype.questions.map((question) => <li key={question}>{question}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {visibleWeapons.length > 0 ? (
        <section className="panel">
          <div className="panel__head">
            <div>
              <h2>Weapons</h2>
              <p>Choose one from your class list during character creation.</p>
            </div>
          </div>
          <div className="weapon-reference-grid">
            {visibleWeapons.map((weapon) => (
              <article className="weapon-reference" key={weapon.id}>
                <div>
                  <h3>{weapon.name}</h3>
                  <p>{classNames(weapon.classIds)} · {weapon.range} · {weapon.attack} · {weapon.damage}</p>
                </div>
                <p>{weapon.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {visiblePowers.length > 0 ? (
        <section className="panel">
          <div className="panel__head">
            <div>
              <h2>Boons And Banes</h2>
              <p>Boon means 2d20 keep higher. Bane means 2d20 keep lower. They cancel one for one before rolling.</p>
            </div>
          </div>
          <div className="power-reference-grid">
            {visiblePowers.map((power) => (
              <article className={power.kind === "bane" ? "power-reference is-bane" : "power-reference"} key={power.id}>
                <PowerToken power={power} />
                <div>
                  <span>{power.kind === "bane" ? "Bane" : "Boon"}</span>
                  <h3>{power.name}</h3>
                  <p>{power.summary}</p>
                  <p>{power.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
