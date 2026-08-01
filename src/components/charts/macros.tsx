import { cn, formatGrams, formatNumber } from "@/lib/utils";

/**
 * The four macro slots, in the fixed order they are always assigned in.
 * The order is the CVD-safety mechanism — do not reorder or cycle it.
 */
export const MACRO_SLOTS = [
  { key: "protein", label: "Protein", varName: "--color-protein" },
  { key: "carbs", label: "Carbs", varName: "--color-carbs" },
  { key: "fat", label: "Fat", varName: "--color-fat" },
  { key: "fiber", label: "Fibre", varName: "--color-fiber" },
] as const;

export type MacroKey = (typeof MACRO_SLOTS)[number]["key"];

export const macroColor = (key: MacroKey) => `var(--color-${key})`;

// ─── Calorie ring ────────────────────────────────────────────────────────

interface CalorieRingProps {
  consumed: number;
  target: number;
  /** Above-resting calories from logged workouts. */
  burned: number;
  size?: number;
}

/**
 * The dashboard's hero figure: a single ratio against a limit, so a meter
 * rather than a chart. The track is the same hue at low opacity; the number in
 * the middle is the actual answer and the ring is the at-a-glance version of it.
 */
export function CalorieRing({ consumed, target, burned, size = 188 }: CalorieRingProps) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? consumed / target : 0;
  const swept = Math.min(1, Math.max(0, ratio));
  const over = ratio > 1;
  const remaining = Math.round(target - consumed);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${formatNumber(consumed)} of ${formatNumber(target)} calories eaten, ${
          over ? `${formatNumber(-remaining)} over` : `${formatNumber(remaining)} left`
        }`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-energy)"
          strokeOpacity={0.16}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? "var(--color-danger)" : "var(--color-energy)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - swept)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[0.6875rem] font-medium tracking-widest text-faint uppercase">
          {over ? "Over by" : "Remaining"}
        </span>
        <span className="tabular font-display text-[2.75rem] leading-none font-semibold">
          {formatNumber(Math.abs(remaining))}
        </span>
        <span className="mt-1 text-xs text-muted">kcal</span>
        <span className="tabular mt-2 text-[0.6875rem] text-faint">
          {formatNumber(consumed)} in
          {burned > 0 ? ` · ${formatNumber(burned)} out` : ""}
        </span>
      </div>
    </div>
  );
}

// ─── Macro meters ────────────────────────────────────────────────────────

interface MacroMeterProps {
  macro: MacroKey;
  label: string;
  value: number;
  target: number;
  unit?: string;
}

/**
 * A macro against its target. The numeric label is not decoration — in light
 * mode carbs and fat sit under 3:1 against the card, and the visible value is
 * the required relief channel.
 */
export function MacroMeter({ macro, label, value, target, unit = "g" }: MacroMeterProps) {
  const ratio = target > 0 ? value / target : 0;
  const width = Math.min(100, Math.max(0, ratio * 100));
  const over = ratio > 1.05;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <span
            className="size-2 rounded-full"
            style={{ background: macroColor(macro) }}
            aria-hidden
          />
          {label}
        </span>
        <span className="tabular text-xs">
          <span className="font-medium">{formatNumber(value)}</span>
          <span className="text-faint">
            {" / "}
            {formatNumber(target)}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${width}%`,
            background: over ? "var(--color-danger)" : macroColor(macro),
          }}
        />
      </div>
    </div>
  );
}

interface MacroRowProps {
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  targets: { proteinG: number; carbsG: number; fatG: number; fiberG: number };
  showFiber?: boolean;
}

export function MacroMeterGroup({
  protein,
  carbs,
  fat,
  fiber = 0,
  targets,
  showFiber = true,
}: MacroRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MacroMeter macro="protein" label="Protein" value={protein} target={targets.proteinG} />
      <MacroMeter macro="carbs" label="Carbs" value={carbs} target={targets.carbsG} />
      <MacroMeter macro="fat" label="Fat" value={fat} target={targets.fatG} />
      {showFiber && (
        <MacroMeter macro="fiber" label="Fibre" value={fiber} target={targets.fiberG} />
      )}
    </div>
  );
}

// ─── Macro split bar ─────────────────────────────────────────────────────

interface MacroSplitProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  className?: string;
  /** Render the gram labels under the bar. */
  labels?: boolean;
}

/**
 * Part-to-whole of a single meal's calories. Segments carry a 2px surface gap
 * so adjacent fills never touch — that gap is the secondary encoding the CVD
 * check leans on.
 */
export function MacroSplitBar({
  proteinG,
  carbsG,
  fatG,
  className,
  labels = false,
}: MacroSplitProps) {
  const parts = [
    { key: "protein" as const, kcal: proteinG * 4, grams: proteinG, label: "P" },
    { key: "carbs" as const, kcal: carbsG * 4, grams: carbsG, label: "C" },
    { key: "fat" as const, kcal: fatG * 9, grams: fatG, label: "F" },
  ];
  const total = parts.reduce((sum, part) => sum + part.kcal, 0);

  if (total <= 0) {
    return <div className={cn("h-1.5 rounded-full bg-raised", className)} />;
  }

  return (
    <div className={className}>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {parts.map((part) => (
          <div
            key={part.key}
            style={{
              width: `${(part.kcal / total) * 100}%`,
              background: macroColor(part.key),
            }}
            className="first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>
      {labels && (
        <div className="tabular mt-1.5 flex gap-3 text-[0.6875rem] text-faint">
          {parts.map((part) => (
            <span key={part.key} className="flex items-center gap-1">
              <span
                className="size-1.5 rounded-full"
                style={{ background: macroColor(part.key) }}
                aria-hidden
              />
              {part.label} {formatGrams(part.grams)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function MacroLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted", className)}>
      {MACRO_SLOTS.map((slot) => (
        <li key={slot.key} className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ background: `var(${slot.varName})` }}
            aria-hidden
          />
          {slot.label}
        </li>
      ))}
    </ul>
  );
}
