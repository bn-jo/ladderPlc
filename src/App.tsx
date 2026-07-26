import { useEffect, useMemo, useRef, useState } from "react";
import LadderCanvas, { type DropTarget } from "./components/LadderCanvas";
import { Simulator } from "./engine/simulator";
import { grade, type GradeReport } from "./engine/grader";
import {
  EXERCISES,
  availableAddresses,
  exerciseById,
  type Exercise,
} from "./data/exercises";
import {
  isContact,
  makeElement,
  makeRung,
  type ElementType,
  type LadderElement,
  type Program,
  type Rung,
} from "./engine/types";

// Palette of draggable elements shown above the ladder.
const PALETTE: { type: ElementType; label: string; glyph: string }[] = [
  { type: "NO", label: "NO contact", glyph: "─┤ ├─" },
  { type: "NC", label: "NC contact", glyph: "─┤/├─" },
  { type: "COIL", label: "Coil", glyph: "─( )─" },
  { type: "SET", label: "Set / latch", glyph: "─(S)─" },
  { type: "RST", label: "Reset", glyph: "─(R)─" },
  { type: "TON", label: "On-delay timer", glyph: "TON" },
  { type: "CTU", label: "Count-up", glyph: "CTU" },
];

function starterProgram(): Program {
  return { rungs: [makeRung()] };
}

function contactAddresses(ex: Exercise): { group: string; items: string[] }[] {
  const a = availableAddresses(ex);
  return [
    { group: "Inputs", items: a.inputs.map((t) => t.address) },
    { group: "Outputs", items: a.outputs.map((t) => t.address) },
    { group: "Memory", items: a.memory },
    { group: "Timers", items: a.timers },
    { group: "Counters", items: a.counters },
  ];
}

function outputAddresses(ex: Exercise): { group: string; items: string[] }[] {
  const a = availableAddresses(ex);
  return [
    { group: "Outputs", items: a.outputs.map((t) => t.address) },
    { group: "Memory", items: a.memory },
    { group: "Timers", items: a.timers },
    { group: "Counters", items: a.counters },
  ];
}

function AddressSelect({
  groups,
  value,
  onChange,
}: {
  groups: { group: string; items: string[] }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">address…</option>
      {groups.map((g) => (
        <optgroup key={g.group} label={g.group}>
          {g.items.map((it) => (
            <option key={it} value={it}>
              {it}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export default function App() {
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const ex = exerciseById(exerciseId);

  const [program, setProgram] = useState<Program>(starterProgram);
  const [selectedRungId, setSelectedRungId] = useState<string | null>(
    program.rungs[0]?.id ?? null,
  );
  const [inputValues, setInputValues] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [, setTick] = useState(0);
  const [report, setReport] = useState<GradeReport | null>(null);
  const [showHints, setShowHints] = useState(false);

  // Editor: which element is selected, and whether a palette drag is active.
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Tap-to-place tool (works on touch devices where HTML5 drag doesn't fire).
  const [placingTool, setPlacingTool] = useState<ElementType | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showSolution, setShowSolution] = useState(false);

  const simRef = useRef<Simulator>(new Simulator(program));
  // A separate simulator runs the reference solution so it can animate
  // side-by-side with the learner's build under the same inputs.
  const solSimRef = useRef<Simulator>(new Simulator(EXERCISES[0].solution));

  // Reset everything when switching exercises.
  useEffect(() => {
    const p = starterProgram();
    setProgram(p);
    setSelectedRungId(p.rungs[0]?.id ?? null);
    setInputValues({});
    setRunning(false);
    setReport(null);
    setShowHints(false);
    setSelectedElementId(null);
    setDragging(false);
    setPlacingTool(null);
    setShowSolution(false);
    solSimRef.current = new Simulator(structuredClone(ex.solution));
    solSimRef.current.scan(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  // Rebuild the simulator whenever the program changes; settle outputs once.
  useEffect(() => {
    const sim = new Simulator(program);
    Object.entries(inputValues).forEach(([k, v]) => sim.setInput(k, v));
    sim.scan(0);
    simRef.current = sim;
    setTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program]);

  // Live scan loop.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const sim = simRef.current;
      const sol = solSimRef.current;
      Object.entries(inputValues).forEach(([k, v]) => {
        sim.setInput(k, v);
        sol.setInput(k, v);
      });
      sim.scan(100);
      sol.scan(100);
      setTick((t) => t + 1);
    }, 100);
    return () => window.clearInterval(id);
  }, [running, inputValues]);

  const values = simRef.current.tags;

  // ---- program editing helpers -------------------------------------------
  function modifyRung(id: string, fn: (r: Rung) => void) {
    setProgram((p) => {
      const np: Program = structuredClone(p);
      const r = np.rungs.find((r) => r.id === id);
      if (r) fn(r);
      return np;
    });
  }

  const selectedRung = program.rungs.find((r) => r.id === selectedRungId) ?? null;

  // ---- element-level editing ---------------------------------------------
  function findElement(id: string): LadderElement | null {
    for (const r of program.rungs) {
      for (const g of r.groups) {
        const e = g.find((x) => x.id === id);
        if (e) return e;
      }
      if (r.output?.id === id) return r.output;
    }
    return null;
  }

  function updateElement(id: string, patch: Partial<LadderElement>) {
    setProgram((p) => {
      const np: Program = structuredClone(p);
      for (const r of np.rungs) {
        for (const g of r.groups) {
          const e = g.find((x) => x.id === id);
          if (e) {
            Object.assign(e, patch);
            return np;
          }
        }
        if (r.output?.id === id) {
          Object.assign(r.output, patch);
          return np;
        }
      }
      return np;
    });
  }

  function deleteElement(id: string) {
    setProgram((p) => {
      const np: Program = structuredClone(p);
      for (const r of np.rungs) {
        for (let gi = 0; gi < r.groups.length; gi++) {
          const idx = r.groups[gi].findIndex((x) => x.id === id);
          if (idx >= 0) {
            r.groups[gi].splice(idx, 1);
            if (r.groups[gi].length === 0) r.groups.splice(gi, 1);
            return np;
          }
        }
        if (r.output?.id === id) {
          r.output = null;
          return np;
        }
      }
      return np;
    });
    setSelectedElementId(null);
  }

  function toggleContact(id: string) {
    const e = findElement(id);
    if (e && isContact(e.type)) {
      updateElement(id, { type: e.type === "NO" ? "NC" : "NO" });
    }
  }

  function defaultAddress(type: ElementType): string {
    const a = availableAddresses(ex);
    if (type === "NO" || type === "NC") return a.inputs[0]?.address ?? a.memory[0];
    if (type === "TON") return a.timers[0];
    if (type === "CTU") return a.counters[0];
    return a.outputs[0]?.address ?? a.memory[0]; // coil / set / reset
  }

  function handleDrop(rungId: string, target: DropTarget, type: ElementType) {
    const contact = isContact(type);
    // Contacts go on the ladder logic; coils/timers/counters go in the output slot.
    if ((target.kind === "parallel" || target.kind === "series-append") && !contact) return;
    if (target.kind === "output" && contact) return;

    const preset = type === "TON" ? 3000 : type === "CTU" ? 5 : undefined;
    const el = makeElement(type, defaultAddress(type), preset);

    modifyRung(rungId, (r) => {
      if (target.kind === "parallel") {
        if (r.groups[target.groupIndex]) r.groups[target.groupIndex].push(el);
      } else if (target.kind === "series-append") {
        r.groups.push([el]);
      } else {
        r.output = el;
      }
    });
    // Just place it — the inline editor opens only when the element is tapped.
    setSelectedRungId(rungId);
    setSelectedElementId(null);
  }

  // Touch/click placement: an armed palette tool is dropped by tapping a zone.
  function onZoneTap(rungId: string, target: DropTarget) {
    if (placingTool) handleDrop(rungId, target, placingTool);
  }

  function clearRung() {
    if (!selectedRung) return;
    modifyRung(selectedRung.id, (r) => {
      r.groups = [];
      r.output = null;
    });
    setSelectedElementId(null);
  }
  function addRung() {
    const r = makeRung();
    setProgram((p) => ({ rungs: [...p.rungs, r] }));
    setSelectedRungId(r.id);
    setSelectedElementId(null);
  }
  function deleteRung() {
    if (!selectedRung) return;
    setProgram((p) => ({ rungs: p.rungs.filter((r) => r.id !== selectedRung.id) }));
    setSelectedRungId(program.rungs[0]?.id ?? null);
    setSelectedElementId(null);
  }

  function toggleInput(addr: string) {
    setInputValues((prev) => {
      const next = { ...prev, [addr]: !prev[addr] };
      const sim = simRef.current;
      const sol = solSimRef.current;
      sim.setInput(addr, next[addr]);
      sol.setInput(addr, next[addr]);
      if (!running) {
        sim.scan(0);
        sol.scan(0);
        setTick((t) => t + 1);
      }
      return next;
    });
  }

  function resetSim() {
    simRef.current = new Simulator(program);
    solSimRef.current = new Simulator(structuredClone(ex.solution));
    setInputValues({});
    setRunning(false);
    setTick((t) => t + 1);
  }

  function checkSolution() {
    setReport(grade(program, ex.tests));
  }

  // Show the reference solution alongside the learner's build (does not replace it).
  function toggleSolution() {
    setShowSolution((s) => {
      const next = !s;
      if (next) {
        // Sync the solution sim to the current inputs so both animate together.
        const sol = solSimRef.current;
        Object.entries(inputValues).forEach(([k, v]) => sol.setInput(k, v));
        sol.scan(0);
      }
      return next;
    });
  }

  const selectedElement = selectedElementId ? findElement(selectedElementId) : null;
  const selUsesPreset =
    selectedElement?.type === "TON" || selectedElement?.type === "CTU";

  // Group exercises by tier for the sidebar.
  const tiers = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const e of EXERCISES) {
      if (!map.has(e.tier)) map.set(e.tier, []);
      map.get(e.tier)!.push(e);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⎓</span> Ladder PLC Academy
        </div>
        <div className="tagline">Learn PLC ladder logic — build, simulate, get graded</div>
      </header>

      <div className="layout">
        {/* -------------------------------------------------- curriculum */}
        <aside className="sidebar">
          <h2>Curriculum</h2>
          {tiers.map(([tier, list]) => (
            <div key={tier} className="tier">
              <div className="tier-name">{tier}</div>
              {list.map((e) => (
                <button
                  key={e.id}
                  className={`lesson ${e.id === exerciseId ? "active" : ""}`}
                  onClick={() => setExerciseId(e.id)}
                >
                  <span className="lesson-title">{e.title}</span>
                  <span className={`badge ${e.difficulty.toLowerCase()}`}>
                    {e.difficulty}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* -------------------------------------------------- workspace */}
        <main className="workspace">
          <section className="problem">
            <h1>{ex.title}</h1>
            <p>{ex.description}</p>
            <button className="link" onClick={() => setShowHints((s) => !s)}>
              {showHints ? "Hide hints" : "Show hints"}
            </button>
            {showHints && (
              <ol className="hints">
                {ex.hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            )}
          </section>

          <section className="canvas-area">
            <div className="canvas-wrap">
            <div className="canvas-toolbar">
              <span className="col-title">Your build</span>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
                Show tag names
              </label>
            </div>
            <LadderCanvas
              program={program}
              values={values}
              labels={showLabels ? Object.fromEntries(ex.io.map((t) => [t.address, t.label])) : {}}
              selectedRungId={selectedRungId}
              onSelectRung={(id) => {
                setSelectedRungId(id);
                setSelectedElementId(null);
              }}
              selectedElementId={selectedElementId}
              onPickElement={(rungId, elId) => {
                setSelectedRungId(rungId);
                setSelectedElementId(elId);
              }}
              dragging={dragging}
              placing={placingTool !== null}
              onZoneTap={onZoneTap}
              onDropElement={handleDrop}
              contactGroups={contactAddresses(ex)}
              outputGroups={outputAddresses(ex)}
              onChangeAddress={(id, address) => updateElement(id, { address })}
              onToggleContact={toggleContact}
              onChangePreset={(id, preset) => updateElement(id, { preset })}
              onDeleteElement={deleteElement}
            />
            </div>

            {showSolution && (
              <div className="canvas-wrap solution">
                <div className="canvas-toolbar">
                  <span className="col-title solution-title">Reference solution</span>
                </div>
                <LadderCanvas
                  program={ex.solution}
                  values={solSimRef.current.tags}
                  labels={showLabels ? Object.fromEntries(ex.io.map((t) => [t.address, t.label])) : {}}
                  selectedRungId={null}
                  onSelectRung={() => {}}
                  selectedElementId={null}
                  onPickElement={() => {}}
                  dragging={false}
                  placing={false}
                  onZoneTap={() => {}}
                  onDropElement={() => {}}
                  contactGroups={[]}
                  outputGroups={[]}
                  onChangeAddress={() => {}}
                  onToggleContact={() => {}}
                  onChangePreset={() => {}}
                  onDeleteElement={() => {}}
                />
              </div>
            )}
          </section>

          {/* ---------------------------------------------- editor */}
          <section className="editor">
            <div className="editor-row">
              <strong>Rungs:</strong>
              <button onClick={addRung}>+ Add rung</button>
              <button onClick={deleteRung} disabled={!selectedRung}>
                Delete rung
              </button>
              <button onClick={clearRung} disabled={!selectedRung}>
                Clear rung
              </button>
              <span className="muted">
                {selectedRung
                  ? `Rung ${program.rungs.indexOf(selectedRung) + 1} selected`
                  : "Select a rung"}
              </span>
            </div>

            <div className="editor-row palette-row">
              <strong>Palette:</strong>
              <div className="palette">
                {PALETTE.map((p) => (
                  <div
                    key={p.type}
                    className={`chip ${placingTool === p.type ? "active" : ""}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", p.type);
                      e.dataTransfer.effectAllowed = "copy";
                      setDragging(true);
                    }}
                    onDragEnd={() => setDragging(false)}
                    onClick={() =>
                      setPlacingTool((t) => (t === p.type ? null : p.type))
                    }
                    title={`Tap to arm, then tap a zone — or drag "${p.label}" (desktop)`}
                  >
                    <span className="chip-glyph">{p.glyph}</span>
                    {p.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="drag-hint muted">
              {placingTool ? (
                <span className="placing-hint">
                  Placing <b>{PALETTE.find((p) => p.type === placingTool)?.label}</b> — tap a
                  highlighted zone on the ladder. Tap the tool again to cancel.
                </span>
              ) : (
                <>
                  <b>Tap</b> a tool then tap a <b>+ series</b> (AND) / <b>OR</b> zone for
                  contacts, or the <b>output</b> zone for a coil/timer/counter. On desktop you
                  can also <b>drag</b> a tool onto a zone.
                </>
              )}
            </div>

            {/* per-element editor */}
            {selectedElement ? (
              <div className="editor-row element-editor">
                <strong>Element:</strong>
                <span className="tag">{selectedElement.type}</span>
                {isContact(selectedElement.type) && (
                  <button className="toggle" onClick={() => toggleContact(selectedElement.id)}>
                    Toggle NO / NC
                  </button>
                )}
                <label className="preset">
                  Address
                  <AddressSelect
                    groups={
                      isContact(selectedElement.type)
                        ? contactAddresses(ex)
                        : outputAddresses(ex)
                    }
                    value={selectedElement.address}
                    onChange={(v) => updateElement(selectedElement.id, { address: v })}
                  />
                </label>
                {selUsesPreset && (
                  <label className="preset">
                    {selectedElement.type === "TON" ? "Preset (ms)" : "Preset (count)"}
                    <input
                      type="number"
                      min={1}
                      value={selectedElement.preset ?? 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { preset: Number(e.target.value) })
                      }
                    />
                  </label>
                )}
                <button className="danger" onClick={() => deleteElement(selectedElement.id)}>
                  Delete
                </button>
              </div>
            ) : (
              <div className="editor-row">
                <span className="muted">
                  Click any element on the ladder to set its address, toggle NO/NC, or delete it.
                </span>
              </div>
            )}
          </section>
        </main>

        {/* -------------------------------------------------- runtime */}
        <aside className="runtime">
          <h2>Simulate</h2>
          <div className="run-controls">
            <button className={running ? "stop" : "run"} onClick={() => setRunning((r) => !r)}>
              {running ? "■ Stop" : "▶ Run"}
            </button>
            <button onClick={resetSim}>Reset</button>
          </div>

          <h3>Inputs</h3>
          <div className="io-list">
            {ex.io
              .filter((t) => t.kind === "input")
              .map((t) => (
                <button
                  key={t.address}
                  className={`io-btn ${inputValues[t.address] ? "on" : ""}`}
                  onClick={() => toggleInput(t.address)}
                >
                  <span className="io-dot" />
                  {t.label} <span className="io-addr">{t.address}</span>
                </button>
              ))}
          </div>

          <h3>Outputs</h3>
          <div className="io-list">
            {ex.io
              .filter((t) => t.kind === "output")
              .map((t) => (
                <div key={t.address} className={`io-lamp ${values[t.address] ? "on" : ""}`}>
                  <span className="io-dot" />
                  {t.label} <span className="io-addr">{t.address}</span>
                </div>
              ))}
          </div>

          <h2 className="mt">Grade</h2>
          <div className="run-controls">
            <button className="check" onClick={checkSolution}>
              ✓ Check solution
            </button>
            <button className={showSolution ? "stop" : ""} onClick={toggleSolution}>
              {showSolution ? "Hide solution" : "Compare solution"}
            </button>
          </div>

          {report && (
            <div className={`report ${report.passed ? "pass" : "fail"}`}>
              <div className="report-head">
                {report.passed ? "✅ All tests passed!" : "❌ Not passing yet"}
              </div>
              {report.results.map((r) => (
                <div key={r.name} className={`case ${r.ok ? "ok" : "bad"}`}>
                  <span>{r.ok ? "✓" : "✗"}</span> {r.name}
                  {!r.ok && <div className="case-detail">{r.detail}</div>}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
