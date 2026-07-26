# Ladder PLC Academy

A web platform to learn **PLC programming with ladder logic** — build ladder
diagrams in the browser, run them on a real scan-cycle simulator, and get your
solution **auto-graded** against test cases. Beginner → advanced curriculum.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

> Node is provided via nvm here — if `node` isn't found, run
> `export PATH="$HOME/.nvm/versions/node/v24.12.0/bin:$PATH"` first.

## What it does

- **Curriculum sidebar** — lessons grouped by tier (Fundamentals → Core
  Instructions → Applied Control), each tagged by difficulty.
- **Visual ladder editor** — build rungs from a palette: NO/NC contacts in
  series (AND) or parallel (OR), and outputs (coil, set/latch, reset, on-delay
  timer TON, count-up counter CTU).
- **Live simulator** — Run to execute a 100 ms scan loop; toggle inputs and
  watch conducting rails, energised coils, and output lamps light up green.
- **Auto-grader** — "Check solution" drives your program through scripted
  input/output timelines and reports pass/fail per test, with the failing step.
- **Hints & reveal** — staged hints per exercise, plus a reference solution.

## How it's built

```
src/
  engine/
    types.ts       data model (rung = series of parallel groups)
    simulator.ts   soft-PLC scan cycle: contacts, coils, SET/RST, TON, CTU
    grader.ts      runs input sequences over simulated time, asserts outputs
  data/
    exercises.ts   the seeded curriculum (problem, I/O, hints, solution, tests)
  components/
    LadderCanvas.tsx  SVG ladder renderer with live energisation highlighting
  App.tsx          workspace: curriculum + editor + runtime panels
```

**Rung model.** Each rung is a series of *groups*; each group is a set of
parallel elements. Series = AND, parallel within a group = OR. This "series of
parallel groups" form cleanly expresses AND/OR/seal-in/interlock logic while
staying simple to edit, render, and evaluate.

**Simulator.** Classic scan cycle — inputs are latched into a tag table, every
rung is solved top-to-bottom, outputs are written back. State persists between
scans, which is what makes seal-in latches, timers, and counters behave
correctly.

**Grader.** Every exercise ships test cases: scripted `set → wait → expect`
steps run against a fresh simulator over simulated time (100 ms/scan). All 14
seeded reference solutions are verified to pass their own graders.

**Curriculum (14 exercises).**

- *Tier 1 · Fundamentals* — lamp control, AND, OR
- *Tier 2 · Core Instructions* — motor seal-in, on-delay timer, count-up counter
- *Tier 3 · Applied Control* — forward/reverse interlock, timed lamp sequence,
  tank level control (hysteresis)
- *Tier 4 · Professional* — E-stop safety chain with reset, star–delta starter,
  latching alarm with acknowledge, conveyor jam detection, batch sequencer
  (fill · mix · drain)

## Adding an exercise

Append to `EXERCISES` in `src/data/exercises.ts` with: `io` (input/output tags),
a `description`, `hints`, a reference `solution` (a `Program`), and `tests`
(scripted timelines). It appears in the sidebar automatically under its `tier`.

## Roadmap

See [PLAN.md](./PLAN.md) — Tiers 3–4 professional content (batch/recipe,
MCC/star-delta, elevator, tank-farm lead/lag, alarms, safety/E-stop), a
Structured Text track, debug/optimization challenges, user accounts + progress
(Supabase), and timed certification exams.

## Status

MVP (Phase 1 of PLAN.md) complete: simulator engine, ladder editor, live sim,
auto-grader, and 8 graded exercises across 3 tiers. Build + typecheck green.
