import type { ElementType, LadderElement, Program } from "../engine/types";

// Renders a ladder Program as an authentic SVG ladder diagram. Contacts and
// coils are clickable (to select for editing) and, while an element is being
// dragged from the palette, drop zones appear for building the rung.

export type DropTarget =
  | { kind: "parallel"; groupIndex: number }
  | { kind: "series-append" }
  | { kind: "output" };

export type AddrGroups = { group: string; items: string[] }[];

interface Props {
  program: Program;
  values: Record<string, boolean>;
  labels: Record<string, string>; // address -> friendly tag name
  selectedRungId: string | null;
  onSelectRung: (id: string) => void;
  selectedElementId: string | null;
  onPickElement: (rungId: string, elementId: string) => void;
  dragging: boolean;
  onDropElement: (rungId: string, target: DropTarget, type: ElementType) => void;
  // Tap-to-place (touch-friendly): show zones and place on tap.
  placing: boolean;
  onZoneTap: (rungId: string, target: DropTarget) => void;
  // Inline element editing (popover on the ladder).
  contactGroups: AddrGroups;
  outputGroups: AddrGroups;
  onChangeAddress: (id: string, address: string) => void;
  onToggleContact: (id: string) => void;
  onChangePreset: (id: string, preset: number) => void;
  onDeleteElement: (id: string) => void;
}

const POP_W = 224;
const POP_H = 132;

type Anchor = { el: LadderElement; cx: number; cy: number };

const RAIL_LEFT = 34;
const COL_W = 116;
const BRANCH_GAP = 50;
const RUNG_TOP_PAD = 38;
const RUNG_BOTTOM_PAD = 26;
const OUTPUT_W = 120;
const ON = "#22c55e";
const OFF = "#64748b";
const RAIL = "#94a3b8";
const SEL = "#38bdf8";

function conducts(el: LadderElement, values: Record<string, boolean>): boolean {
  const v = values[el.address] ?? false;
  if (el.type === "NC") return !v;
  if (el.type === "NO") return v;
  return v;
}

function branchCount(groups: LadderElement[][]): number {
  return groups.reduce((m, g) => Math.max(m, g.length), 1);
}

function TagText({ address, name, cx, cy }: { address: string; name?: string; cx: number; cy: number }) {
  // Address on top; friendly tag name below it (e.g. "I0.0" / "Fwd").
  if (name) {
    return (
      <>
        <text x={cx} y={cy - 31} textAnchor="middle" className="addr">
          {address}
        </text>
        <text x={cx} y={cy - 20} textAnchor="middle" className="tag-name">
          {name}
        </text>
      </>
    );
  }
  return (
    <text x={cx} y={cy - 20} textAnchor="middle" className="addr">
      {address}
    </text>
  );
}

function Contact({
  el,
  cx,
  cy,
  live,
  selected,
  name,
  onClick,
}: {
  el: LadderElement;
  cx: number;
  cy: number;
  live: boolean;
  selected: boolean;
  name?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const color = live ? ON : OFF;
  const half = 9;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {selected && (
        <rect x={cx - 40} y={cy - 36} width={80} height={62} rx={7} fill="rgba(56,189,248,0.12)" stroke={SEL} strokeWidth={1.5} />
      )}
      <TagText address={el.address} name={name} cx={cx} cy={cy} />
      <line x1={cx - 34} y1={cy} x2={cx - half} y2={cy} stroke={color} strokeWidth={2} />
      <line x1={cx + half} y1={cy} x2={cx + 34} y2={cy} stroke={color} strokeWidth={2} />
      <line x1={cx - half} y1={cy - 12} x2={cx - half} y2={cy + 12} stroke={color} strokeWidth={2.5} />
      <line x1={cx + half} y1={cy - 12} x2={cx + half} y2={cy + 12} stroke={color} strokeWidth={2.5} />
      {el.type === "NC" && (
        <line x1={cx - half - 3} y1={cy + 12} x2={cx + half + 3} y2={cy - 12} stroke={color} strokeWidth={2} />
      )}
    </g>
  );
}

function Output({
  el,
  cx,
  cy,
  live,
  selected,
  name,
  onClick,
}: {
  el: LadderElement;
  cx: number;
  cy: number;
  live: boolean;
  selected: boolean;
  name?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const color = live ? ON : OFF;
  const isCoil = el.type === "COIL" || el.type === "SET" || el.type === "RST";
  const inner = el.type === "SET" ? "S" : el.type === "RST" ? "R" : "";
  if (isCoil) {
    return (
      <g onClick={onClick} style={{ cursor: "pointer" }}>
        {selected && (
          <rect x={cx - 40} y={cy - 36} width={80} height={62} rx={7} fill="rgba(56,189,248,0.12)" stroke={SEL} strokeWidth={1.5} />
        )}
        <TagText address={el.address} name={name} cx={cx} cy={cy} />
        <line x1={cx - 40} y1={cy} x2={cx - 12} y2={cy} stroke={color} strokeWidth={2} />
        <line x1={cx + 12} y1={cy} x2={cx + 40} y2={cy} stroke={color} strokeWidth={2} />
        <path d={`M ${cx - 12} ${cy - 12} A 16 16 0 0 0 ${cx - 12} ${cy + 12}`} fill="none" stroke={color} strokeWidth={2.5} />
        <path d={`M ${cx + 12} ${cy - 12} A 16 16 0 0 1 ${cx + 12} ${cy + 12}`} fill="none" stroke={color} strokeWidth={2.5} />
        {inner && (
          <text x={cx} y={cy + 5} textAnchor="middle" className="coil-letter" fill={color}>
            {inner}
          </text>
        )}
      </g>
    );
  }
  const label = el.type === "TON" ? "TON" : "CTU";
  const presetLabel = el.type === "TON" ? `PT ${el.preset ?? 0}ms` : `PV ${el.preset ?? 0}`;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {selected && (
        <rect x={cx - 36} y={cy - 28} width={72} height={56} rx={7} fill="rgba(56,189,248,0.12)" stroke={SEL} strokeWidth={1.5} />
      )}
      <line x1={cx - 60} y1={cy} x2={cx - 30} y2={cy} stroke={color} strokeWidth={2} />
      <rect x={cx - 30} y={cy - 22} width={60} height={44} rx={4} fill="#0f172a" stroke={color} strokeWidth={2} />
      <text x={cx} y={cy - 8} textAnchor="middle" className="blk-type">
        {label}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" className="blk-addr">
        {el.address}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="blk-pt">
        {presetLabel}
      </text>
    </g>
  );
}

function DropZone({
  x,
  y,
  w,
  h,
  label,
  onDrop,
  onClick,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  onDrop: (e: React.DragEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <g
      className="dropzone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <rect x={x} y={y} width={w} height={h} rx={6} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" className="dz-label">
        {label}
      </text>
    </g>
  );
}

// Inline editor rendered on the ladder, anchored to the selected element.
function Popover({
  el,
  cx,
  cy,
  width,
  contactGroups,
  outputGroups,
  onChangeAddress,
  onToggleContact,
  onChangePreset,
  onDeleteElement,
}: {
  el: LadderElement;
  cx: number;
  cy: number;
  width: number;
  contactGroups: AddrGroups;
  outputGroups: AddrGroups;
  onChangeAddress: (id: string, address: string) => void;
  onToggleContact: (id: string) => void;
  onChangePreset: (id: string, preset: number) => void;
  onDeleteElement: (id: string) => void;
}) {
  const isC = el.type === "NO" || el.type === "NC";
  const usesPreset = el.type === "TON" || el.type === "CTU";
  const groups = isC ? contactGroups : outputGroups;
  const px = Math.min(Math.max(cx - POP_W / 2, 4), width - POP_W - 4);
  const py = cy + 20;
  const h = usesPreset ? POP_H + 34 : POP_H;

  return (
    <foreignObject x={px} y={py} width={POP_W} height={h} style={{ overflow: "visible" }}>
      <div className="el-popover" onClick={(e) => e.stopPropagation()}>
        <div className="pop-head">
          <span className="pop-type">{el.type}</span>
          {isC && (
            <button className="pop-toggle" onClick={() => onToggleContact(el.id)}>
              ⇄ NO / NC
            </button>
          )}
        </div>
        <label className="pop-field">
          Address
          <select
            value={el.address}
            onChange={(e) => onChangeAddress(el.id, e.target.value)}
          >
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
        </label>
        {usesPreset && (
          <label className="pop-field">
            {el.type === "TON" ? "Preset (ms)" : "Preset (count)"}
            <input
              type="number"
              min={1}
              value={el.preset ?? 0}
              onChange={(e) => onChangePreset(el.id, Number(e.target.value))}
            />
          </label>
        )}
        <button className="pop-delete" onClick={() => onDeleteElement(el.id)}>
          Delete element
        </button>
      </div>
    </foreignObject>
  );
}

function Rung({
  rung,
  values,
  labels,
  baseY,
  width,
  selected,
  selectedElementId,
  onSelectRung,
  onPickElement,
  dragging,
  placing,
  onZoneTap,
  onDropElement,
}: {
  rung: Program["rungs"][number];
  values: Record<string, boolean>;
  labels: Record<string, string>;
  baseY: number;
  width: number;
  selected: boolean;
  selectedElementId: string | null;
  onSelectRung: (id: string) => void;
  onPickElement: (rungId: string, elementId: string) => void;
  dragging: boolean;
  placing: boolean;
  onZoneTap: (rungId: string, target: DropTarget) => void;
  onDropElement: (rungId: string, target: DropTarget, type: ElementType) => void;
}) {
  const wires: JSX.Element[] = [];
  const parts: JSX.Element[] = [];
  const groups = rung.groups;

  groups.forEach((group, gi) => {
    const cellX0 = RAIL_LEFT + gi * COL_W;
    const cellX1 = cellX0 + COL_W;
    const cx = cellX0 + COL_W / 2;
    const live = group.some((el) => conducts(el, values));

    wires.push(
      <line key={`base-${gi}`} x1={cellX0} y1={baseY} x2={cellX1} y2={baseY} stroke={live ? ON : OFF} strokeWidth={2} />,
    );
    if (group.length > 1) {
      const lastY = baseY + (group.length - 1) * BRANCH_GAP;
      wires.push(
        <line key={`vl-${gi}`} x1={cellX0} y1={baseY} x2={cellX0} y2={lastY} stroke={OFF} strokeWidth={2} />,
        <line key={`vr-${gi}`} x1={cellX1} y1={baseY} x2={cellX1} y2={lastY} stroke={OFF} strokeWidth={2} />,
      );
    }
    group.forEach((el, bi) => {
      const cy = baseY + bi * BRANCH_GAP;
      if (bi > 0) {
        wires.push(
          <line key={`bl-${gi}-${bi}`} x1={cellX0} y1={cy} x2={cellX1} y2={cy} stroke={conducts(el, values) ? ON : OFF} strokeWidth={2} />,
        );
      }
      parts.push(
        <Contact
          key={el.id}
          el={el}
          cx={cx}
          cy={cy}
          live={conducts(el, values)}
          selected={el.id === selectedElementId}
          name={labels[el.address]}
          onClick={(e) => {
            e.stopPropagation();
            onPickElement(rung.id, el.id);
          }}
        />,
      );
    });
  });

  const cursorX = RAIL_LEFT + groups.length * COL_W;
  const outX = Math.max(cursorX + OUTPUT_W / 2, width - RAIL_LEFT - OUTPUT_W / 2);

  if (rung.output) {
    const live = conducts(rung.output, values);
    wires.push(
      <line key="out-lead" x1={cursorX} y1={baseY} x2={outX - 60} y2={baseY} stroke={live ? ON : OFF} strokeWidth={2} />,
      <line key="out-tail" x1={outX + 40} y1={baseY} x2={width - RAIL_LEFT} y2={baseY} stroke={live ? ON : OFF} strokeWidth={2} />,
    );
    parts.push(
      <Output
        key={rung.output.id}
        el={rung.output}
        cx={outX}
        cy={baseY}
        live={live}
        selected={rung.output.id === selectedElementId}
        name={labels[rung.output.address]}
        onClick={(e) => {
          e.stopPropagation();
          onPickElement(rung.id, rung.output!.id);
        }}
      />,
    );
  } else {
    wires.push(
      <line key="empty" x1={cursorX} y1={baseY} x2={width - RAIL_LEFT} y2={baseY} stroke={OFF} strokeWidth={2} strokeDasharray="4 4" />,
    );
  }

  const rowH = RUNG_TOP_PAD + (branchCount(groups) - 1) * BRANCH_GAP + RUNG_BOTTOM_PAD;

  const handleDrop = (target: DropTarget) => (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain") as ElementType;
    if (type) onDropElement(rung.id, target, type);
  };
  const handleTap = (target: DropTarget) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onZoneTap(rung.id, target);
  };

  const zones: JSX.Element[] = [];
  if (dragging || placing) {
    groups.forEach((group, gi) => {
      const x = RAIL_LEFT + gi * COL_W + 3;
      const h = Math.max(1, group.length) * BRANCH_GAP + 8;
      zones.push(
        <DropZone
          key={`pz-${gi}`}
          x={x}
          y={baseY - 18}
          w={COL_W - 6}
          h={h}
          label="OR"
          onDrop={handleDrop({ kind: "parallel", groupIndex: gi })}
          onClick={handleTap({ kind: "parallel", groupIndex: gi })}
        />,
      );
    });
    const seriesX = cursorX + 4;
    const seriesW = Math.max(70, outX - 70 - seriesX);
    zones.push(
      <DropZone
        key="sz"
        x={seriesX}
        y={baseY - 18}
        w={seriesW}
        h={36}
        label="+ series"
        onDrop={handleDrop({ kind: "series-append" })}
        onClick={handleTap({ kind: "series-append" })}
      />,
    );
    zones.push(
      <DropZone
        key="oz"
        x={outX - 50}
        y={baseY - 18}
        w={100}
        h={36}
        label="output"
        onDrop={handleDrop({ kind: "output" })}
        onClick={handleTap({ kind: "output" })}
      />,
    );
  }

  return (
    <g>
      <rect
        x={2}
        y={baseY - RUNG_TOP_PAD + 4}
        width={width - 4}
        height={rowH}
        fill={selected ? "rgba(56,189,248,0.06)" : "transparent"}
        stroke={selected ? SEL : "transparent"}
        strokeWidth={1}
        rx={6}
        onClick={() => onSelectRung(rung.id)}
        style={{ cursor: "pointer" }}
      />
      {wires}
      {parts}
      {zones}
    </g>
  );
}

export default function LadderCanvas(props: Props) {
  const {
    program,
    values,
    labels,
    selectedRungId,
    onSelectRung,
    selectedElementId,
    onPickElement,
    dragging,
    placing,
    onZoneTap,
    onDropElement,
    contactGroups,
    outputGroups,
    onChangeAddress,
    onToggleContact,
    onChangePreset,
    onDeleteElement,
  } = props;
  const width = 780;
  let y = 8; // top margin so the first rung's address line isn't clipped
  const rungEls: JSX.Element[] = [];
  let popAnchor: Anchor | null = null;

  // A plain for-of (not forEach) so control-flow analysis tracks popAnchor.
  for (const rung of program.rungs) {
    const baseY = y + RUNG_TOP_PAD;

    // Locate the selected element so its editor popover can be drawn on top.
    if (selectedElementId && !dragging) {
      for (let gi = 0; gi < rung.groups.length; gi++) {
        const group = rung.groups[gi];
        for (let bi = 0; bi < group.length; bi++) {
          if (group[bi].id === selectedElementId)
            popAnchor = { el: group[bi], cx: RAIL_LEFT + gi * COL_W + COL_W / 2, cy: baseY + bi * BRANCH_GAP };
        }
      }
      if (rung.output?.id === selectedElementId) {
        const cursorX = RAIL_LEFT + rung.groups.length * COL_W;
        const outX = Math.max(cursorX + OUTPUT_W / 2, width - RAIL_LEFT - OUTPUT_W / 2);
        popAnchor = { el: rung.output, cx: outX, cy: baseY };
      }
    }

    rungEls.push(
      <Rung
        key={rung.id}
        rung={rung}
        values={values}
        labels={labels}
        baseY={baseY}
        width={width}
        selected={rung.id === selectedRungId}
        selectedElementId={selectedElementId}
        onSelectRung={onSelectRung}
        onPickElement={onPickElement}
        dragging={dragging}
        placing={placing}
        onZoneTap={onZoneTap}
        onDropElement={onDropElement}
      />,
    );
    y += RUNG_TOP_PAD + (branchCount(rung.groups) - 1) * BRANCH_GAP + RUNG_BOTTOM_PAD;
  }

  // Reserve room so an open editor popover isn't clipped on the last rung.
  const height = Math.max(y + 10, 120) + (selectedElementId && !dragging ? POP_H + 50 : 0);

  return (
    <svg className={`ladder ${dragging ? "dragging" : ""}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line x1={RAIL_LEFT} y1={0} x2={RAIL_LEFT} y2={height} stroke={RAIL} strokeWidth={3} />
      <line x1={width - RAIL_LEFT} y1={0} x2={width - RAIL_LEFT} y2={height} stroke={RAIL} strokeWidth={3} />
      {rungEls}
      {popAnchor && (
        <Popover
          el={popAnchor.el}
          cx={popAnchor.cx}
          cy={popAnchor.cy}
          width={width}
          contactGroups={contactGroups}
          outputGroups={outputGroups}
          onChangeAddress={onChangeAddress}
          onToggleContact={onToggleContact}
          onChangePreset={onChangePreset}
          onDeleteElement={onDeleteElement}
        />
      )}
      {program.rungs.length === 0 && (
        <text x={width / 2} y={60} textAnchor="middle" className="empty-hint">
          Add a rung, then drag elements from the palette.
        </text>
      )}
    </svg>
  );
}
