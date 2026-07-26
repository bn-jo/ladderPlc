import { Simulator } from "./simulator";
import type { Program } from "./types";

// An exercise is graded by driving the learner's program through scripted input
// sequences and asserting the resulting outputs, over simulated time.

export interface GradeStep {
  label: string;
  set?: Record<string, boolean>; // inputs to apply before waiting
  waitMs: number; // simulated time to advance
  expect?: Record<string, boolean>; // outputs asserted after waiting
}

export interface TestCase {
  name: string;
  steps: GradeStep[];
}

export interface TestResult {
  name: string;
  ok: boolean;
  detail: string;
}

export interface GradeReport {
  passed: boolean;
  results: TestResult[];
}

const DT = 100; // ms per scan while grading

export function grade(program: Program, tests: TestCase[]): GradeReport {
  const results: TestResult[] = tests.map((tc) => {
    const sim = new Simulator(structuredClone(program));
    let ok = true;
    let detail = "Passed";

    outer: for (const step of tc.steps) {
      if (step.set) {
        for (const [k, v] of Object.entries(step.set)) sim.setInput(k, v);
      }
      const scans = Math.max(1, Math.ceil(step.waitMs / DT));
      for (let i = 0; i < scans; i++) sim.scan(DT);

      if (step.expect) {
        for (const [k, v] of Object.entries(step.expect)) {
          if (sim.get(k) !== v) {
            ok = false;
            detail = `"${step.label}" — expected ${k}=${v ? "ON" : "OFF"}, got ${
              sim.get(k) ? "ON" : "OFF"
            }`;
            break outer;
          }
        }
      }
    }

    return { name: tc.name, ok, detail };
  });

  return { passed: results.every((r) => r.ok), results };
}
