# PLC Ladder Programming Learning Platform — Build Plan

> **Status:** Phase 1 MVP is built and running (see [README.md](./README.md)).
> Simulator engine, ladder editor, live sim, auto-grader, and 8 graded exercises
> across 3 tiers are done and verified. Remaining tiers/features below are the
> roadmap.


A web platform to learn PLC programming with Ladder Logic, from beginner to
professional, with graded exercises, reference solutions, and an in-browser
simulator that auto-checks the learner's work.

---

## 1. Landscape — existing tools (learn from, don't reinvent)

| Platform | Strength | Gap we fill |
|---|---|---|
| [PLC Fiddle](https://www.plcfiddle.com/) | Clean in-browser editor + live sim, sharing | No structured curriculum |
| [rungs.dev](https://rungs.dev/) | Ladder + Structured Text sim, AI assistant | Not a guided course |
| [MechSimulator](https://mechsimulator.com/tools/plc-ladder-logic/) | Free IEC 61131-3 trainer, Simulate/Practice/Quiz modes | Good UX model to emulate |
| [plcsimulator.online](https://plcsimulator.online/) | Browser sim, **open-sourced** — study the code | — |
| [OpenPLC Editor](https://mdcplus.fi/blog/top-free-plc-programming-tools-simulation/) | Full open-source IEC 61131-3 runtime | Desktop, not web-guided |
| [sidneyhori/ladder-logic-simulator](https://github.com/sidneyhori/ladder-logic-simulator) | Open-source JS ladder **renderer** (rails, contacts, coils, TON, CTU) | Reusable starting point |
| [codingplc conveyor sim](https://app2.codingplc.com/) | Animated process (conveyor) tied to ladder | Inspiration for capstones |

**Differentiator:** most of these are *sandboxes*. Few combine a real simulator
with a **structured, graded, professional-grade curriculum** that auto-checks
solutions. That is our target.

---

## 2. Content & exercise sources (seed material)

Copy the *format and problem ideas*, write our own statements/solutions to avoid
copyright issues.

- [PLC Programming Examples and Solutions](https://plcsimulationsoftware.com/blog/plc-programming-examples-and-solutions) — 8 worked examples (motor seal-in, timers, counters, traffic light, tank, star-delta) with I/O list + ladder + explanation. **Ideal exercise format to copy.**
- [Top 100 PLC Programming Exercises](https://ladderlogicai.com/pages/blog/top-100-plc-programming-exercises-for-beginners-students-professionals/) — graded beginner → professional.
- [PLC Practice Problems](https://plcsimulationsoftware.com/plc-practice-problems) — online problem bank.
- [PLC Applications Workbook (Dayanand/Ricky)](https://www.scribd.com/document/500284230/PLC-Applications-Workbook-Dayanand-Ricky) — 15 exercises with I/O lists, wiring, solutions.
- [ASEE: Teaching Novices how to Program PLCs](https://peer.asee.org/teaching-novices-how-to-program-plc-s.pdf) — pedagogy on sequencing.
- [Ladder Logic Tutorial (symbols/reference)](https://controlsystemguide.com/plc-ladder-logic-tutorial/) and [MyPLCTraining Part 4](https://www.myplctraining.com/blog/beginners-free-plc-training-part-4) — lesson reference content.

---

## 3. Curriculum — beginner to professional

Each module = short lesson + worked example + graded exercises. Each exercise
carries: `title, difficulty, I/O list, problem statement, starter rungs,
reference solution, auto-grader test cases, hints`.

### Tier 1 — Fundamentals (Beginner)
1. Scan cycle, power rails, rungs
2. NO / NC contacts, output coil (OTE)
3. Boolean logic: AND / OR / NOT / XOR in ladder
4. Latching: Set/Reset (OTL/OTU), seal-in

### Tier 2 — Core Instructions (Intermediate)
5. Timers: TON, TOF, TP (retentive vs non-retentive)
6. Counters: CTU, CTD, CTUD, reset logic
7. Interlocks: forward/reverse, safety interlocks
8. Compare & math: EQU/GEQ/LEQ, ADD/SUB/MUL/DIV
9. One-shots (ONS), rising/falling edge detection

### Tier 3 — Applied Control (Advanced)
10. Sequential state machines (step sequencer)
11. Analog I/O: scaling raw counts to engineering units
12. PID control basics (setpoint, PV, CV)
13. Move/Copy, indirect addressing, data tables/arrays
14. FIFO/LIFO, shift registers (BSL/BSR)

### Tier 4 — Professional / Industrial
15. Full traffic-light intersection with pedestrian crossing
16. Batch process with recipes and phase control
17. Alarm handling, first-out annunciation, latching alarms
18. Motor control center: star-delta, soft-start sequencing, run-hours logging
19. Conveyor sorting with diverters and product tracking
20. Elevator / lift controller (multi-floor, call queue, direction logic)
21. Tank farm: level control, pump lead/lag/standby rotation
22. Traffic-based fault diagnostics & watchdog timers
23. Safety logic: E-stop chains, guard monitoring, reset/restart interlock
24. Communication concepts: Modbus register mapping (conceptual)
25. **Capstone:** car wash / bottling line / packaging machine full program

### Professional add-ons (differentiators)
- **Structured Text (ST) track** alongside ladder — same problem, both languages.
- **Timing-diagram challenges** — given a timing diagram, produce the ladder.
- **Debug challenges** — fix a broken program to pass the grader.
- **Optimization challenges** — solve a rung in the fewest instructions.
- **Certification-style timed exams** per tier with a completion certificate.

---

## 4. Technical architecture

### Frontend
- **React + TypeScript + Vite**
- **Ladder editor/renderer:** SVG grid (rails, rungs, drag-drop contacts/coils).
  Fork/study [sidneyhori's renderer](https://github.com/sidneyhori/ladder-logic-simulator).
- **State:** Zustand (rung model + I/O tag table).
- **Monaco editor** for the Structured Text track.

### Simulation engine (core IP) — pure TS, framework-agnostic
- Program = list of rungs → network of contacts/coils/timers/counters.
- **Scan-cycle loop:** read inputs → solve rungs → write outputs, every ~100 ms.
- Instruction set: NO/NC contact, OTE/OTL/OTU, TON/TOF/TP, CTU/CTD/CTUD, ONS,
  compare, math, MOV/COP, shift registers, and (advanced) PID/analog blocks.
- State = tag table `{ I0.0: bool, T1.acc: int, N7.0: int, ... }`.

### Auto-grader (makes it a *course*, not a sandbox)
- Each exercise defines **input stimulus sequences** + expected **output timelines**.
- Run learner's program through the engine, assert outputs match → pass/fail +
  which case failed + hint. Supports timing tolerances for timer-based problems.

### Backend (start static, grow later)
- **Supabase** (Postgres + Auth) — users, progress, saved programs, XP/badges.
- Lesson/exercise content as **MDX/JSON in the repo** first (no CMS).

### Motivation / retention
- Per-user progress, XP, badges, streaks.
- Solution reveal after N attempts; hints ladder.
- Optional leaderboards; per-tier certificates.

---

## 5. Build phases

- **Phase 0 — Spike (1 wk):** prove the sim engine — hardcode a seal-in rung, run
  scan loop, toggle inputs, watch coil. No UI polish. *Highest-risk piece first.*
- **Phase 1 — MVP (3–4 wks):** SVG editor (contacts, coils, 1 timer), live sim,
  5 exercises + auto-grader, static content, no login. Deploy to Vercel/Netlify.
- **Phase 2 — Course (4–6 wks):** Tiers 1–2 curriculum, accounts + progress
  (Supabase), solution reveal, hints.
- **Phase 3 — Advanced content:** Tiers 3–4, counters/compare/math/PID,
  gamification, capstones, shareable programs.
- **Phase 4 — Professional track:** Structured Text view, debug/optimization
  challenges, animated process visuals, timed certification exams, AI hints.

---

## 6. Key risks

- **Simulator engine is ~70% of the work** — build & validate in Phase 0 before
  any curriculum work.
- **Ladder editor UX** (drag-drop on SVG) is fiddly — start with an
  "insert element" palette before full drag-drop.
- **Auto-grading** needs well-designed stimuli — hand-design a few before
  generalizing; add timing tolerances for timer/counter problems.

---

## 7. Suggested tech stack summary

```
Frontend:  React + TypeScript + Vite, SVG ladder renderer, Zustand, Monaco (ST)
Engine:    pure-TS scan-cycle simulator + auto-grader module
Content:   MDX/JSON exercises in repo
Backend:   Supabase (Postgres + Auth) for users/progress
Deploy:    Vercel or Netlify
```
