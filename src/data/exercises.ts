import type { IOTag, Program } from "../engine/types";
import { makeElement } from "../engine/types";
import type { TestCase } from "../engine/grader";

export interface Exercise {
  id: string;
  tier: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  brief: string; // one line
  description: string; // full problem statement (markdown-ish plain text)
  io: IOTag[];
  hints: string[];
  solution: Program;
  tests: TestCase[];
}

// Small builders to keep solutions readable.
const NO = (a: string) => makeElement("NO", a);
const NC = (a: string) => makeElement("NC", a);
const COIL = (a: string) => makeElement("COIL", a);
const SET = (a: string) => makeElement("SET", a);
const RST = (a: string) => makeElement("RST", a);
const TON = (a: string, ms: number) => makeElement("TON", a, ms);
const CTU = (a: string, n: number) => makeElement("CTU", a, n);

export const EXERCISES: Exercise[] = [
  // ---------------------------------------------------------------- Tier 1
  {
    id: "lamp",
    tier: "Tier 1 · Fundamentals",
    title: "Lamp control",
    difficulty: "Beginner",
    brief: "A single button turns a lamp on and off.",
    description:
      "Wire a normally-open contact from push button I0.0 to drive lamp output O0.0. When the button is pressed the lamp is ON; when released it is OFF.",
    io: [
      { address: "I0.0", label: "Button", kind: "input" },
      { address: "O0.0", label: "Lamp", kind: "output" },
    ],
    hints: [
      "Add one series contact of type NO on address I0.0.",
      "Set the rung output to a COIL on O0.0.",
    ],
    solution: {
      rungs: [{ id: "r1", groups: [[NO("I0.0")]], output: COIL("O0.0") }],
    },
    tests: [
      {
        name: "Button drives lamp",
        steps: [
          { label: "idle", set: { "I0.0": false }, waitMs: 100, expect: { "O0.0": false } },
          { label: "press", set: { "I0.0": true }, waitMs: 100, expect: { "O0.0": true } },
          { label: "release", set: { "I0.0": false }, waitMs: 100, expect: { "O0.0": false } },
        ],
      },
    ],
  },
  {
    id: "and",
    tier: "Tier 1 · Fundamentals",
    title: "AND logic",
    difficulty: "Beginner",
    brief: "Output only when both inputs are on.",
    description:
      "Energise lamp O0.0 only when BOTH I0.0 and I0.1 are on. This is two contacts in series.",
    io: [
      { address: "I0.0", label: "Input A", kind: "input" },
      { address: "I0.1", label: "Input B", kind: "input" },
      { address: "O0.0", label: "Lamp", kind: "output" },
    ],
    hints: ["Two NO contacts, each in its own series group (AND)."],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.0")], [NO("I0.1")]], output: COIL("O0.0") },
      ],
    },
    tests: [
      {
        name: "AND truth table",
        steps: [
          { label: "0,0", set: { "I0.0": false, "I0.1": false }, waitMs: 100, expect: { "O0.0": false } },
          { label: "1,0", set: { "I0.0": true, "I0.1": false }, waitMs: 100, expect: { "O0.0": false } },
          { label: "0,1", set: { "I0.0": false, "I0.1": true }, waitMs: 100, expect: { "O0.0": false } },
          { label: "1,1", set: { "I0.0": true, "I0.1": true }, waitMs: 100, expect: { "O0.0": true } },
        ],
      },
    ],
  },
  {
    id: "or",
    tier: "Tier 1 · Fundamentals",
    title: "OR logic",
    difficulty: "Beginner",
    brief: "Output when either input is on.",
    description:
      "Energise lamp O0.0 when EITHER I0.0 OR I0.1 is on. This is two contacts in parallel (one group with two branches).",
    io: [
      { address: "I0.0", label: "Input A", kind: "input" },
      { address: "I0.1", label: "Input B", kind: "input" },
      { address: "O0.0", label: "Lamp", kind: "output" },
    ],
    hints: ["Put both NO contacts in the SAME group (parallel = OR)."],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.0"), NO("I0.1")]], output: COIL("O0.0") },
      ],
    },
    tests: [
      {
        name: "OR truth table",
        steps: [
          { label: "0,0", set: { "I0.0": false, "I0.1": false }, waitMs: 100, expect: { "O0.0": false } },
          { label: "1,0", set: { "I0.0": true, "I0.1": false }, waitMs: 100, expect: { "O0.0": true } },
          { label: "0,1", set: { "I0.0": false, "I0.1": true }, waitMs: 100, expect: { "O0.0": true } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Tier 2
  {
    id: "seal-in",
    tier: "Tier 2 · Core Instructions",
    title: "Motor start / stop (seal-in)",
    difficulty: "Intermediate",
    brief: "Latch a motor with a start button; a stop button drops it out.",
    description:
      "Classic seal-in. START (I0.0, NO) latches motor O0.0 which stays running after the button is released. STOP (I0.1) breaks the rung when pressed. Build (START OR MOTOR) in series with a NC contact of STOP.",
    io: [
      { address: "I0.0", label: "Start", kind: "input" },
      { address: "I0.1", label: "Stop", kind: "input" },
      { address: "O0.0", label: "Motor", kind: "output" },
    ],
    hints: [
      "Group 1 is parallel: NO of Start OR NO of the motor output O0.0 (the seal-in branch).",
      "Group 2 in series is a NC contact of Stop.",
      "Output is a COIL on O0.0.",
    ],
    solution: {
      rungs: [
        {
          id: "r1",
          groups: [[NO("I0.0"), NO("O0.0")], [NC("I0.1")]],
          output: COIL("O0.0"),
        },
      ],
    },
    tests: [
      {
        name: "Latch and unlatch",
        steps: [
          { label: "idle", set: { "I0.0": false, "I0.1": false }, waitMs: 100, expect: { "O0.0": false } },
          { label: "press start", set: { "I0.0": true }, waitMs: 100, expect: { "O0.0": true } },
          { label: "release start (sealed)", set: { "I0.0": false }, waitMs: 100, expect: { "O0.0": true } },
          { label: "press stop", set: { "I0.1": true }, waitMs: 100, expect: { "O0.0": false } },
          { label: "release stop (stays off)", set: { "I0.1": false }, waitMs: 100, expect: { "O0.0": false } },
        ],
      },
    ],
  },
  {
    id: "on-delay",
    tier: "Tier 2 · Core Instructions",
    title: "On-delay timer",
    difficulty: "Intermediate",
    brief: "Lamp turns on 3 seconds after the switch.",
    description:
      "When switch I0.0 is held on, start an on-delay timer (TON, preset 3000 ms). When the timer reaches preset, its done bit turns on lamp O0.0. Releasing the switch resets the timer and the lamp.",
    io: [
      { address: "I0.0", label: "Switch", kind: "input" },
      { address: "O0.0", label: "Lamp", kind: "output" },
    ],
    hints: [
      "Rung 1: NO of I0.0 drives a TON output on address T1 with preset 3000.",
      "Rung 2: NO of T1 (the timer done bit) drives COIL O0.0.",
    ],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.0")]], output: TON("T1", 3000) },
        { id: "r2", groups: [[NO("T1")]], output: COIL("O0.0") },
      ],
    },
    tests: [
      {
        name: "Delays then turns on",
        steps: [
          { label: "switch on, before preset", set: { "I0.0": true }, waitMs: 2000, expect: { "O0.0": false } },
          { label: "past preset", set: { "I0.0": true }, waitMs: 1500, expect: { "O0.0": true } },
          { label: "switch off resets", set: { "I0.0": false }, waitMs: 200, expect: { "O0.0": false } },
        ],
      },
    ],
  },
  {
    id: "count-up",
    tier: "Tier 2 · Core Instructions",
    title: "Count-up counter",
    difficulty: "Intermediate",
    brief: "Turn on an output after 5 parts pass a sensor.",
    description:
      "Each rising edge of sensor I0.0 increments a count-up counter (CTU on C1, preset 5). When 5 counts are reached, its done bit turns on output O0.0.",
    io: [
      { address: "I0.0", label: "Sensor", kind: "input" },
      { address: "O0.0", label: "Full", kind: "output" },
    ],
    hints: [
      "Rung 1: NO of I0.0 drives a CTU output on address C1 with preset 5.",
      "Rung 2: NO of C1 (counter done) drives COIL O0.0.",
    ],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.0")]], output: CTU("C1", 5) },
        { id: "r2", groups: [[NO("C1")]], output: COIL("O0.0") },
      ],
    },
    tests: [
      {
        name: "Counts to five",
        steps: [
          { label: "p1↑", set: { "I0.0": true }, waitMs: 100 },
          { label: "p1↓", set: { "I0.0": false }, waitMs: 100 },
          { label: "p2↑", set: { "I0.0": true }, waitMs: 100 },
          { label: "p2↓", set: { "I0.0": false }, waitMs: 100 },
          { label: "p3↑", set: { "I0.0": true }, waitMs: 100 },
          { label: "p3↓", set: { "I0.0": false }, waitMs: 100 },
          { label: "p4↑", set: { "I0.0": true }, waitMs: 100 },
          { label: "p4↓", set: { "I0.0": false }, waitMs: 100, expect: { "O0.0": false } },
          { label: "p5↑", set: { "I0.0": true }, waitMs: 100, expect: { "O0.0": true } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Tier 3
  {
    id: "interlock",
    tier: "Tier 3 · Applied Control",
    title: "Forward / reverse interlock",
    difficulty: "Advanced",
    brief: "A motor can run forward or reverse, but never both.",
    description:
      "FWD button I0.0 latches output O0.0; REV button I0.1 latches output O0.1. STOP I0.2 drops both. Each direction is interlocked by a NC contact of the opposite output so they can never be energised together.",
    io: [
      { address: "I0.0", label: "Fwd", kind: "input" },
      { address: "I0.1", label: "Rev", kind: "input" },
      { address: "I0.2", label: "Stop", kind: "input" },
      { address: "O0.0", label: "Forward", kind: "output" },
      { address: "O0.1", label: "Reverse", kind: "output" },
    ],
    hints: [
      "Forward rung: (Fwd OR Forward) AND NC(Stop) AND NC(Reverse) → COIL Forward.",
      "Reverse rung mirrors it with the opposite interlock.",
    ],
    solution: {
      rungs: [
        {
          id: "r1",
          groups: [[NO("I0.0"), NO("O0.0")], [NC("I0.2")], [NC("O0.1")]],
          output: COIL("O0.0"),
        },
        {
          id: "r2",
          groups: [[NO("I0.1"), NO("O0.1")], [NC("I0.2")], [NC("O0.0")]],
          output: COIL("O0.1"),
        },
      ],
    },
    tests: [
      {
        name: "Interlock holds",
        steps: [
          { label: "start fwd", set: { "I0.0": true }, waitMs: 100, expect: { "O0.0": true, "O0.1": false } },
          { label: "release fwd (sealed)", set: { "I0.0": false }, waitMs: 100, expect: { "O0.0": true } },
          { label: "try rev while fwd runs", set: { "I0.1": true }, waitMs: 100, expect: { "O0.0": true, "O0.1": false } },
          { label: "release rev", set: { "I0.1": false }, waitMs: 100, expect: { "O0.1": false } },
          { label: "stop", set: { "I0.2": true }, waitMs: 100, expect: { "O0.0": false, "O0.1": false } },
          { label: "release stop, now rev", set: { "I0.2": false, "I0.1": true }, waitMs: 100, expect: { "O0.1": true, "O0.0": false } },
        ],
      },
    ],
  },
  {
    id: "traffic",
    tier: "Tier 3 · Applied Control",
    title: "Timed lamp sequence",
    difficulty: "Advanced",
    brief: "Two lamps alternate on a timed cycle.",
    description:
      "While RUN I0.0 is on, lamp O0.0 (green) is on for the first 3 seconds, then lamp O0.1 (red) turns on after 3 seconds. Use a TON. Green = NOT timer-done AND run; Red = timer-done. When RUN is off, both are off and the timer resets.",
    io: [
      { address: "I0.0", label: "Run", kind: "input" },
      { address: "O0.0", label: "Green", kind: "output" },
      { address: "O0.1", label: "Red", kind: "output" },
    ],
    hints: [
      "Rung 1: NO(Run) → TON T1 preset 3000.",
      "Rung 2: NO(Run) AND NC(T1) → COIL Green.",
      "Rung 3: NO(T1) → COIL Red.",
    ],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.0")]], output: TON("T1", 3000) },
        { id: "r2", groups: [[NO("I0.0")], [NC("T1")]], output: COIL("O0.0") },
        { id: "r3", groups: [[NO("T1")]], output: COIL("O0.1") },
      ],
    },
    tests: [
      {
        name: "Green then red",
        steps: [
          { label: "run, first phase", set: { "I0.0": true }, waitMs: 1000, expect: { "O0.0": true, "O0.1": false } },
          { label: "after 3s", set: { "I0.0": true }, waitMs: 2500, expect: { "O0.0": false, "O0.1": true } },
          { label: "stop resets", set: { "I0.0": false }, waitMs: 200, expect: { "O0.0": false, "O0.1": false } },
        ],
      },
    ],
  },
  {
    id: "tank-level",
    tier: "Tier 3 · Applied Control",
    title: "Tank level control (hysteresis)",
    difficulty: "Advanced",
    brief: "Pump keeps a tank full between low and high level sensors.",
    description:
      "In AUTO (I0.0), a fill pump O0.0 starts when the LOW sensor I0.2 is reached and keeps running (seal-in) until the HIGH sensor I0.1 is reached, then stops. It restarts only when LOW is reached again — two-point hysteresis, not chattering at a single level.",
    io: [
      { address: "I0.0", label: "Auto", kind: "input" },
      { address: "I0.1", label: "High level", kind: "input" },
      { address: "I0.2", label: "Low level", kind: "input" },
      { address: "O0.0", label: "Pump", kind: "output" },
    ],
    hints: [
      "Group 1 (parallel): NO(Low) OR NO(Pump) — the seal-in branch.",
      "Then in series: NC(High) to stop at the top, and NO(Auto) to enable.",
    ],
    solution: {
      rungs: [
        {
          id: "r1",
          groups: [[NO("I0.2"), NO("O0.0")], [NC("I0.1")], [NO("I0.0")]],
          output: COIL("O0.0"),
        },
      ],
    },
    tests: [
      {
        name: "Hysteresis cycle",
        steps: [
          { label: "auto off", set: { "I0.0": false, "I0.1": false, "I0.2": true }, waitMs: 100, expect: { "O0.0": false } },
          { label: "auto on at low", set: { "I0.0": true, "I0.2": true, "I0.1": false }, waitMs: 100, expect: { "O0.0": true } },
          { label: "filling (seal-in)", set: { "I0.2": false, "I0.1": false }, waitMs: 100, expect: { "O0.0": true } },
          { label: "reach high", set: { "I0.1": true }, waitMs: 100, expect: { "O0.0": false } },
          { label: "draining, still off", set: { "I0.1": false, "I0.2": false }, waitMs: 100, expect: { "O0.0": false } },
          { label: "reach low again", set: { "I0.2": true }, waitMs: 100, expect: { "O0.0": true } },
          { label: "auto off stops", set: { "I0.0": false }, waitMs: 100, expect: { "O0.0": false } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Tier 4
  {
    id: "estop-chain",
    tier: "Tier 4 · Professional",
    title: "E-stop safety chain with reset",
    difficulty: "Advanced",
    brief: "A safety relay must be reset after an E-stop before the motor can run.",
    description:
      "Emergency stop I0.0 drops a safety relay O0.0. The relay is armed by a momentary RESET I0.1 and seals in. The motor O0.1 is a start/stop seal-in (START I0.2, STOP I0.3) that is only permitted while the safety relay is healthy. After an E-stop you must press RESET again — clearing the E-stop alone is not enough.",
    io: [
      { address: "I0.0", label: "E-stop", kind: "input" },
      { address: "I0.1", label: "Reset", kind: "input" },
      { address: "I0.2", label: "Start", kind: "input" },
      { address: "I0.3", label: "Stop", kind: "input" },
      { address: "O0.0", label: "Safety OK", kind: "output" },
      { address: "O0.1", label: "Motor", kind: "output" },
    ],
    hints: [
      "Safety rung: (Reset OR SafetyOK) AND NC(E-stop) → COIL SafetyOK.",
      "Motor rung: (Start OR Motor) AND NC(Stop) AND NO(SafetyOK) → COIL Motor.",
    ],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.1"), NO("O0.0")], [NC("I0.0")]], output: COIL("O0.0") },
        {
          id: "r2",
          groups: [[NO("I0.2"), NO("O0.1")], [NC("I0.3")], [NO("O0.0")]],
          output: COIL("O0.1"),
        },
      ],
    },
    tests: [
      {
        name: "Arm, run, trip, re-arm",
        steps: [
          { label: "idle", set: { "I0.0": false, "I0.1": false, "I0.2": false, "I0.3": false }, waitMs: 100, expect: { "O0.0": false, "O0.1": false } },
          { label: "reset arms safety", set: { "I0.1": true }, waitMs: 100, expect: { "O0.0": true } },
          { label: "release reset (sealed)", set: { "I0.1": false }, waitMs: 100, expect: { "O0.0": true } },
          { label: "start motor", set: { "I0.2": true }, waitMs: 100, expect: { "O0.1": true } },
          { label: "release start (sealed)", set: { "I0.2": false }, waitMs: 100, expect: { "O0.1": true } },
          { label: "e-stop drops all", set: { "I0.0": true }, waitMs: 100, expect: { "O0.0": false, "O0.1": false } },
          { label: "clear e-stop, still off", set: { "I0.0": false }, waitMs: 100, expect: { "O0.0": false, "O0.1": false } },
          { label: "re-arm with reset", set: { "I0.1": true }, waitMs: 100, expect: { "O0.0": true } },
          { label: "restart motor", set: { "I0.1": false, "I0.2": true }, waitMs: 100, expect: { "O0.1": true } },
        ],
      },
    ],
  },
  {
    id: "star-delta",
    tier: "Tier 4 · Professional",
    title: "Star–delta motor starter",
    difficulty: "Advanced",
    brief: "Start a large motor in star, then transition to delta after a timer.",
    description:
      "START I0.0 / STOP I0.1 latch the main contactor O0.0. On start the STAR contactor O0.1 energises immediately for reduced-voltage starting. After a 3 s transition timer, the controller drops STAR and pulls in the DELTA contactor O0.2 for full-speed running. STAR and DELTA are interlocked so they can never be closed together.",
    io: [
      { address: "I0.0", label: "Start", kind: "input" },
      { address: "I0.1", label: "Stop", kind: "input" },
      { address: "O0.0", label: "Main", kind: "output" },
      { address: "O0.1", label: "Star", kind: "output" },
      { address: "O0.2", label: "Delta", kind: "output" },
    ],
    hints: [
      "Main: (Start OR Main) AND NC(Stop) → COIL Main.",
      "Timer: NO(Main) → TON T1 preset 3000.",
      "Star: NO(Main) AND NC(T1) AND NC(Delta) → COIL Star.",
      "Delta: NO(Main) AND NO(T1) AND NC(Star) → COIL Delta.",
    ],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.0"), NO("O0.0")], [NC("I0.1")]], output: COIL("O0.0") },
        { id: "r2", groups: [[NO("O0.0")]], output: TON("T1", 3000) },
        { id: "r3", groups: [[NO("O0.0")], [NC("T1")], [NC("O0.2")]], output: COIL("O0.1") },
        { id: "r4", groups: [[NO("O0.0")], [NO("T1")], [NC("O0.1")]], output: COIL("O0.2") },
      ],
    },
    tests: [
      {
        name: "Star then delta",
        steps: [
          { label: "start → star", set: { "I0.0": true, "I0.1": false }, waitMs: 100, expect: { "O0.0": true, "O0.1": true, "O0.2": false } },
          { label: "release start, still star", set: { "I0.0": false }, waitMs: 1000, expect: { "O0.0": true, "O0.1": true, "O0.2": false } },
          { label: "after 3 s → delta", set: {}, waitMs: 2500, expect: { "O0.1": false, "O0.2": true, "O0.0": true } },
          { label: "stop → all off", set: { "I0.1": true }, waitMs: 100, expect: { "O0.0": false, "O0.1": false, "O0.2": false } },
        ],
      },
    ],
  },
  {
    id: "alarm-ack",
    tier: "Tier 4 · Professional",
    title: "Alarm with acknowledge",
    difficulty: "Advanced",
    brief: "Latching alarm — horn silences on ACK, light holds until the fault clears.",
    description:
      "A fault I0.0 latches the alarm LIGHT O0.1 and sounds the HORN O0.0. Pressing ACK I0.1 silences the horn but the light stays on while the fault persists. The alarm only fully clears (light off) when the fault is gone AND ACK is pressed. Once acknowledged, the horn stays silent until the whole alarm resets.",
    io: [
      { address: "I0.0", label: "Fault", kind: "input" },
      { address: "I0.1", label: "Ack", kind: "input" },
      { address: "O0.0", label: "Horn", kind: "output" },
      { address: "O0.1", label: "Light", kind: "output" },
    ],
    hints: [
      "NO(Fault) → SET Light. NO(Ack) AND NC(Fault) → RST Light.",
      "Track 'acknowledged' in M0: NO(Ack) → SET M0; NC(Light) → RST M0.",
      "Horn = NO(Light) AND NC(M0) → COIL Horn.",
    ],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.0")]], output: SET("O0.1") },
        { id: "r2", groups: [[NO("I0.1")], [NC("I0.0")]], output: RST("O0.1") },
        { id: "r3", groups: [[NO("I0.1")]], output: SET("M0") },
        { id: "r4", groups: [[NC("O0.1")]], output: RST("M0") },
        { id: "r5", groups: [[NO("O0.1")], [NC("M0")]], output: COIL("O0.0") },
      ],
    },
    tests: [
      {
        name: "Latch, acknowledge, clear",
        steps: [
          { label: "fault raises alarm", set: { "I0.0": true, "I0.1": false }, waitMs: 100, expect: { "O0.1": true, "O0.0": true } },
          { label: "ack silences horn", set: { "I0.1": true }, waitMs: 100, expect: { "O0.0": false, "O0.1": true } },
          { label: "release ack, still silent", set: { "I0.1": false }, waitMs: 100, expect: { "O0.0": false, "O0.1": true } },
          { label: "fault clears + ack resets", set: { "I0.0": false, "I0.1": true }, waitMs: 100, expect: { "O0.1": false, "O0.0": false } },
          { label: "release ack", set: { "I0.1": false }, waitMs: 100, expect: { "O0.1": false, "O0.0": false } },
        ],
      },
    ],
  },
  {
    id: "conveyor-jam",
    tier: "Tier 4 · Professional",
    title: "Conveyor with jam detection",
    difficulty: "Advanced",
    brief: "Stop the conveyor and raise a fault if no part is seen for 2 seconds.",
    description:
      "START I0.0 / STOP I0.1 run conveyor motor O0.0. A photo-eye I0.2 pulses as parts pass. A jam timer measures time since the last part while the motor runs; if a part is not detected for 2 s, a FAULT O0.1 latches and stops the motor. Pressing STOP clears the fault.",
    io: [
      { address: "I0.0", label: "Start", kind: "input" },
      { address: "I0.1", label: "Stop", kind: "input" },
      { address: "I0.2", label: "Part sensor", kind: "input" },
      { address: "O0.0", label: "Motor", kind: "output" },
      { address: "O0.1", label: "Fault", kind: "output" },
    ],
    hints: [
      "Jam timer: NO(Motor) AND NC(Part) → TON T1 2000 (a part resets it).",
      "NO(T1) → SET Fault.",
      "Motor: (Start OR Motor) AND NC(Stop) AND NC(Fault) → COIL Motor.",
      "NO(Stop) → RST Fault.",
    ],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("O0.0")], [NC("I0.2")]], output: TON("T1", 2000) },
        { id: "r2", groups: [[NO("T1")]], output: SET("O0.1") },
        {
          id: "r3",
          groups: [[NO("I0.0"), NO("O0.0")], [NC("I0.1")], [NC("O0.1")]],
          output: COIL("O0.0"),
        },
        { id: "r4", groups: [[NO("I0.1")]], output: RST("O0.1") },
      ],
    },
    tests: [
      {
        name: "Runs, jams, recovers",
        steps: [
          { label: "start (part present)", set: { "I0.0": true, "I0.1": false, "I0.2": true }, waitMs: 200, expect: { "O0.0": true, "O0.1": false } },
          { label: "parts keep passing", set: { "I0.0": false, "I0.2": true }, waitMs: 2500, expect: { "O0.0": true, "O0.1": false } },
          { label: "jam — no part 2 s", set: { "I0.2": false }, waitMs: 2500, expect: { "O0.1": true, "O0.0": false } },
          { label: "stop clears fault", set: { "I0.1": true }, waitMs: 200, expect: { "O0.1": false, "O0.0": false } },
          { label: "restart", set: { "I0.1": false, "I0.0": true, "I0.2": true }, waitMs: 200, expect: { "O0.0": true, "O0.1": false } },
        ],
      },
    ],
  },
  {
    id: "batch-seq",
    tier: "Tier 4 · Professional",
    title: "Batch sequencer (fill · mix · drain)",
    difficulty: "Advanced",
    brief: "A step sequencer runs fill → mix → drain using latched step bits.",
    description:
      "A batch process with three sequential steps latched in memory. START I0.0 opens the FILL valve O0.0. When HIGH level I0.1 is reached, fill stops and the MIXER O0.1 runs for a 4 s timer. When mixing finishes, the DRAIN valve O0.2 opens until the LOW level I0.2 is reached, ending the batch. Each step is a latch (SET/RST) so only one step is active at a time.",
    io: [
      { address: "I0.0", label: "Start", kind: "input" },
      { address: "I0.1", label: "High level", kind: "input" },
      { address: "I0.2", label: "Low level", kind: "input" },
      { address: "O0.0", label: "Fill valve", kind: "output" },
      { address: "O0.1", label: "Mixer", kind: "output" },
      { address: "O0.2", label: "Drain valve", kind: "output" },
    ],
    hints: [
      "Step bits: M1 = fill, M2 = mix, M3 = drain.",
      "Start → SET M1. High AND M1 → SET M2, then M2 → RST M1.",
      "M2 → TON T1 4000. T1 done → SET M3, then M3 → RST M2. Low AND M3 → RST M3.",
      "Outputs: Fill = M1, Mixer = M2, Drain = M3.",
    ],
    solution: {
      rungs: [
        { id: "r1", groups: [[NO("I0.0")]], output: SET("M1") },
        { id: "r2", groups: [[NO("I0.1")], [NO("M1")]], output: SET("M2") },
        { id: "r3", groups: [[NO("M2")]], output: RST("M1") },
        { id: "r4", groups: [[NO("M2")]], output: TON("T1", 4000) },
        { id: "r5", groups: [[NO("T1")]], output: SET("M3") },
        { id: "r6", groups: [[NO("M3")]], output: RST("M2") },
        { id: "r7", groups: [[NO("I0.2")], [NO("M3")]], output: RST("M3") },
        { id: "r8", groups: [[NO("M1")]], output: COIL("O0.0") },
        { id: "r9", groups: [[NO("M2")]], output: COIL("O0.1") },
        { id: "r10", groups: [[NO("M3")]], output: COIL("O0.2") },
      ],
    },
    tests: [
      {
        name: "Full batch cycle",
        steps: [
          { label: "start → fill", set: { "I0.0": true, "I0.1": false, "I0.2": true }, waitMs: 200, expect: { "O0.0": true, "O0.1": false, "O0.2": false } },
          { label: "reach high → mix", set: { "I0.0": false, "I0.1": true, "I0.2": false }, waitMs: 200, expect: { "O0.0": false, "O0.1": true, "O0.2": false } },
          { label: "still mixing", set: { "I0.1": false }, waitMs: 3000, expect: { "O0.1": true, "O0.0": false, "O0.2": false } },
          { label: "mix done → drain", set: {}, waitMs: 1500, expect: { "O0.1": false, "O0.2": true, "O0.0": false } },
          { label: "reach low → done", set: { "I0.2": true }, waitMs: 300, expect: { "O0.2": false, "O0.1": false, "O0.0": false } },
        ],
      },
    ],
  },
];

export function exerciseById(id: string): Exercise {
  return EXERCISES.find((e) => e.id === id) ?? EXERCISES[0];
}

// Tags a learner can reference from the element palette for a given exercise:
// the exercise I/O plus scratch memory, timers and counters.
export function availableAddresses(ex: Exercise): {
  inputs: IOTag[];
  outputs: IOTag[];
  memory: string[];
  timers: string[];
  counters: string[];
} {
  return {
    inputs: ex.io.filter((t) => t.kind === "input"),
    outputs: ex.io.filter((t) => t.kind === "output"),
    memory: ["M0", "M1", "M2", "M3"],
    timers: ["T1", "T2", "T3"],
    counters: ["C1", "C2", "C3"],
  };
}
