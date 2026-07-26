// Core data model for the ladder program and the simulator.
//
// A rung uses a "series of parallel groups" model:
//   groups = elements in SERIES  (logical AND between groups)
//   each group = elements in PARALLEL (logical OR within a group)
// This cleanly expresses AND / OR / seal-in / interlock logic, which covers the
// large majority of ladder exercises, while staying simple to edit and render.

export type ElementType = "NO" | "NC" | "COIL" | "SET" | "RST" | "TON" | "CTU";

export interface LadderElement {
  id: string;
  type: ElementType;
  address: string; // tag name, e.g. "I0.0", "O0.0", "M0", "T1", "C1"
  preset?: number; // TON: milliseconds. CTU: count target.
}

export interface Rung {
  id: string;
  groups: LadderElement[][]; // series of parallel contact groups
  output: LadderElement | null; // coil / timer / counter driven by the rung
}

export interface Program {
  rungs: Rung[];
}

export type IOKind = "input" | "output";

export interface IOTag {
  address: string;
  label: string;
  kind: IOKind;
}

let counter = 0;
export function newId(prefix = "el"): string {
  counter += 1;
  return `${prefix}_${counter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function makeElement(
  type: ElementType,
  address: string,
  preset?: number,
): LadderElement {
  return { id: newId(), type, address, preset };
}

export function makeRung(): Rung {
  return { id: newId("rung"), groups: [], output: null };
}

export function isContact(type: ElementType): boolean {
  return type === "NO" || type === "NC";
}

export function isOutput(type: ElementType): boolean {
  return !isContact(type);
}
