import type { DmTrackerState, RuleTable } from "../types";
import { images } from "../data/images";
import { argumentTable, negotiationEndTable, negotiationHookCards, negotiationRunSteps } from "../data/rules";
import { Track } from "../components/Track";
import type { FeedbackKind } from "../lib/feedback";

interface DmViewProps {
  dm: DmTrackerState;
  onDm: (updates: Partial<DmTrackerState>) => void;
  onFeedback: (kind: FeedbackKind) => void;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function Field({
  id,
  label,
  value,
  onChange,
  textarea = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {textarea ? (
        <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function NumberField({
  id,
  label,
  value,
  min = 0,
  max = 99,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        className="numeric"
        type="number"
        min={min}
        max={max}
        value={clampNumber(value, min, max)}
        onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
      />
    </label>
  );
}

function RulesTable({ table }: { table: RuleTable }) {
  return (
    <div className="rule-table-block">
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
  );
}

export function DmView({ dm, onDm, onFeedback }: DmViewProps) {
  return (
    <div className="view dm-view">
      <section className="view-header">
        <div>
          <h1>DM Tracker</h1>
          <p>One creature or NPC. Combat pressure and negotiation pressure in the same place.</p>
        </div>
        <img src={images.dm} alt="Pixel art Candle-Jaw Bailiff creature portrait" />
      </section>

      <section className="form-grid">
        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Creature</h2>
              <p>Local notes for the current table problem.</p>
            </div>
          </div>
          <div className="field-grid">
            <Field id="dm-name" label="Name" value={dm.name} onChange={(name) => onDm({ name })} />
            <Field id="dm-role" label="Role" value={dm.role} onChange={(role) => onDm({ role })} />
            <NumberField id="dm-defense" label="Defense" value={dm.defense} min={1} max={30} onChange={(defense) => onDm({ defense })} />
            <Field id="dm-status" label="Status" value={dm.status} onChange={(status) => onDm({ status })} />
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Tracks</h2>
              <p>Stop when HP hits 0, Interest hits 5, or Patience hits 0.</p>
            </div>
          </div>
          <Track label="HP" value={dm.hp} max={dm.hpMax} onFeedback={onFeedback} onChange={(hp) => onDm({ hp })} />
          <div className="field-grid compact-fields">
            <NumberField id="dm-hp-max" label="Max HP" value={dm.hpMax} min={1} max={40} onChange={(hpMax) => onDm({ hpMax, hp: Math.min(dm.hp, hpMax) })} />
          </div>
          <Track
            label="Interest"
            value={dm.interest}
            max={5}
            note="How close they are to saying yes."
            tone="interest"
            onFeedback={onFeedback}
            onChange={(interest) => onDm({ interest })}
          />
          <Track
            label="Patience"
            value={dm.patience}
            max={5}
            note="How much room is left before they leave or turn hostile."
            tone="patience"
            onFeedback={onFeedback}
            onChange={(patience) => onDm({ patience })}
          />
        </div>
      </section>

      <section className="form-grid">
        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Threat</h2>
              <p>What happens if talking fails.</p>
            </div>
          </div>
          <div className="field-grid">
            <Field id="dm-combat-goal" label="Combat goal" value={dm.combatGoal} onChange={(combatGoal) => onDm({ combatGoal })} />
            <Field id="dm-attack" label="Attack" value={dm.attack} onChange={(attack) => onDm({ attack })} />
            <Field id="dm-damage" label="Damage" value={dm.damage} onChange={(damage) => onDm({ damage })} />
            <Field id="dm-special" label="Special move" value={dm.special} textarea onChange={(special) => onDm({ special })} />
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Negotiation</h2>
              <p>Make the social exit playable.</p>
            </div>
          </div>
          <div className="field-grid">
            <Field id="dm-social-goal" label="Social goal" value={dm.socialGoal} onChange={(socialGoal) => onDm({ socialGoal })} />
            <Field id="dm-motivation-one" label="Motivation 1" value={dm.motivationOne} onChange={(motivationOne) => onDm({ motivationOne })} />
            <Field id="dm-motivation-two" label="Motivation 2" value={dm.motivationTwo} onChange={(motivationTwo) => onDm({ motivationTwo })} />
            <Field id="dm-pitfall" label="Pitfall" value={dm.pitfall} onChange={(pitfall) => onDm({ pitfall })} />
            <Field id="dm-leverage" label="Leverage" value={dm.leverage} onChange={(leverage) => onDm({ leverage })} />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>Negotiation Rules</h2>
            <p>Use this while running the NPC. Hooks change the roll before the tracks move.</p>
          </div>
        </div>
        <ol className="step-list negotiation-steps">
          {negotiationRunSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="summary-grid negotiation-hooks">
          {negotiationHookCards.map((card) => (
            <article className="summary-tile" key={card.title}>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
        <RulesTable table={argumentTable} />
        <RulesTable table={negotiationEndTable} />
        <label className="field full-field" htmlFor="dm-notes">
          <span>Notes</span>
          <textarea id="dm-notes" value={dm.notes} onChange={(event) => onDm({ notes: event.target.value })} />
        </label>
      </section>
    </div>
  );
}
