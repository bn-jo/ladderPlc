import type { LadderElement, Program } from "./types";

// A soft PLC that runs a classic scan cycle:
//   1. inputs are already latched into the tag table (set by the user/grader)
//   2. every rung is solved top-to-bottom
//   3. outputs (coils/timers/counters) are written back to the tag table
// State persists between scans, which is what makes seal-in and timers work.

interface TimerState {
  acc: number; // accumulated milliseconds
}

interface CounterState {
  count: number;
  prev: boolean; // previous rung state, for rising-edge detection
}

export class Simulator {
  program: Program;
  tags: Record<string, boolean> = {};
  timerAcc: Record<string, number> = {};
  private timers: Record<string, TimerState> = {};
  private counters: Record<string, CounterState> = {};

  constructor(program: Program) {
    this.program = program;
    this.reset();
  }

  reset(): void {
    this.tags = {};
    this.timerAcc = {};
    this.timers = {};
    this.counters = {};
  }

  get(address: string): boolean {
    return this.tags[address] ?? false;
  }

  setInput(address: string, value: boolean): void {
    this.tags[address] = value;
  }

  // Value seen by a contact (NC inverts).
  private contactValue(el: LadderElement): boolean {
    const v = this.get(el.address);
    return el.type === "NC" ? !v : v;
  }

  // AND across series groups; OR within each parallel group.
  // An empty group is a solid wire (passes power through).
  private solveGroups(groups: LadderElement[][]): boolean {
    return groups.every((group) =>
      group.length === 0
        ? true
        : group.some((el) => this.contactValue(el)),
    );
  }

  private driveOutput(
    out: LadderElement,
    powered: boolean,
    dtMs: number,
  ): void {
    switch (out.type) {
      case "COIL":
        this.tags[out.address] = powered;
        break;
      case "SET":
        if (powered) this.tags[out.address] = true;
        break;
      case "RST":
        if (powered) this.tags[out.address] = false;
        break;
      case "TON": {
        const preset = out.preset ?? 1000;
        if (powered) {
          const acc = Math.min(preset, (this.timers[out.address]?.acc ?? 0) + dtMs);
          this.timers[out.address] = { acc };
          this.timerAcc[out.address] = acc;
          this.tags[out.address] = acc >= preset;
        } else {
          this.timers[out.address] = { acc: 0 };
          this.timerAcc[out.address] = 0;
          this.tags[out.address] = false;
        }
        break;
      }
      case "CTU": {
        const preset = out.preset ?? 1;
        const state = this.counters[out.address] ?? { count: 0, prev: false };
        if (powered && !state.prev) state.count += 1; // rising edge
        state.prev = powered;
        this.counters[out.address] = state;
        this.tags[out.address] = state.count >= preset;
        break;
      }
      default:
        break;
    }
  }

  scan(dtMs: number): void {
    for (const rung of this.program.rungs) {
      const powered = this.solveGroups(rung.groups);
      if (rung.output) this.driveOutput(rung.output, powered, dtMs);
    }
  }
}
