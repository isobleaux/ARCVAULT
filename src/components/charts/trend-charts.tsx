"use client";

import { useState } from "react";
import { Table2 } from "lucide-react";

import { MACRO_SLOTS, macroColor } from "@/components/charts/macros";
import { shortDate, shortDay } from "@/lib/dates";
import { cn, formatNumber } from "@/lib/utils";
import type { TrendDay, Trends } from "@/modules/diary/service";

const PLOT_HEIGHT = 152;
const AXIS_HEIGHT = 22;
const PAD_TOP = 12;

/**
 * Fit a fortnight inside a phone-width card without scrolling; longer ranges
 * narrow the columns and then scroll horizontally inside their own box.
 */
function columnWidth(count: number): number {
  return Math.max(16, Math.min(34, Math.floor(320 / Math.max(1, count))));
}

/** Shared frame: a scrollable plot area with a hover column overlay. */
function ChartFrame({
  days,
  hovered,
  onHover,
  children,
  tooltip,
  label,
}: {
  days: TrendDay[];
  hovered: number | null;
  onHover: (index: number | null) => void;
  children: React.ReactNode;
  tooltip: (day: TrendDay) => React.ReactNode;
  label: string;
}) {
  const col = columnWidth(days.length);
  const width = days.length * col;
  const height = PLOT_HEIGHT + AXIS_HEIGHT + PAD_TOP;

  return (
    <div className="relative">
      <div className="scroll-x no-scrollbar -mx-1 px-1">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label}
          onPointerLeave={() => onHover(null)}
          className="block"
        >
          {children}

          {/* Hit targets are the full column, always wider than the mark. */}
          {days.map((day, index) => (
            <rect
              key={day.day}
              x={index * col}
              y={0}
              width={col}
              height={height}
              fill="transparent"
              onPointerEnter={() => onHover(index)}
            />
          ))}

          {hovered !== null && (
            <line
              x1={hovered * col + col / 2}
              x2={hovered * col + col / 2}
              y1={PAD_TOP}
              y2={PAD_TOP + PLOT_HEIGHT}
              stroke="var(--color-axis)"
              strokeWidth={1}
            />
          )}

          {days.map((day, index) =>
            index % Math.ceil(days.length / 7) === 0 ? (
              <text
                key={`x-${day.day}`}
                x={index * col + col / 2}
                y={PAD_TOP + PLOT_HEIGHT + 15}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-faint)"
              >
                {days.length > 10 ? shortDate(day.day).split(" ")[0] : shortDay(day.day)}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {hovered !== null && days[hovered] && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 right-0 rounded-xl border border-line bg-raised/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
        >
          <p className="mb-1 font-medium">{shortDate(days[hovered].day)}</p>
          {tooltip(days[hovered])}
        </div>
      )}
    </div>
  );
}

/**
 * Energy: one series (calories eaten net of exercise) against a target line.
 *
 * A single series is the point here, so this is emphasis, not a categorical
 * chart — no legend, one hue, and the reference line carries the comparison.
 */
function EnergyChart({ trends }: { trends: Trends }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { days, targets } = trends;

  const col = columnWidth(days.length);
  const max = Math.max(
    targets.calories * 1.25,
    ...days.map((d) => Math.max(d.calories, d.burnKcal)),
  );
  const y = (value: number) => PAD_TOP + PLOT_HEIGHT * (1 - value / max);
  const targetY = y(targets.calories);

  return (
    <ChartFrame
      days={days}
      hovered={hovered}
      onHover={setHovered}
      label={`Calories eaten each day against a target of ${formatNumber(targets.calories)} kcal`}
      tooltip={(day) => (
        <div className="tabular space-y-0.5">
          <p>
            <span className="text-faint">Eaten </span>
            {formatNumber(day.calories)} kcal
          </p>
          <p>
            <span className="text-faint">Burned </span>
            {formatNumber(day.burnKcal)} kcal
          </p>
          <p>
            <span className="text-faint">Net vs target </span>
            {day.calories - day.exerciseKcal - targets.calories > 0 ? "+" : ""}
            {formatNumber(day.calories - day.exerciseKcal - targets.calories)}
          </p>
        </div>
      )}
    >
      {[0.25, 0.5, 0.75, 1].map((fraction) => (
        <line
          key={fraction}
          x1={0}
          x2={days.length * col}
          y1={PAD_TOP + PLOT_HEIGHT * (1 - fraction)}
          y2={PAD_TOP + PLOT_HEIGHT * (1 - fraction)}
          stroke="var(--color-grid)"
          strokeWidth={1}
        />
      ))}

      {days.map((day, index) => {
        const net = Math.max(0, day.calories - day.exerciseKcal);
        if (net <= 0) return null;
        const top = y(net);
        const barHeight = PAD_TOP + PLOT_HEIGHT - top;
        return (
          <rect
            key={day.day}
            x={index * col + Math.max(2, col * 0.2)}
            y={top}
            width={col - Math.max(4, col * 0.4)}
            height={Math.max(2, barHeight)}
            rx={4}
            fill="var(--color-energy)"
            opacity={hovered === null || hovered === index ? 1 : 0.45}
          />
        );
      })}

      <line
        x1={0}
        x2={days.length * col}
        y1={targetY}
        y2={targetY}
        stroke="var(--color-body)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        opacity={0.7}
      />
      <text x={4} y={targetY - 5} fontSize={10} fill="var(--color-muted)">
        target {formatNumber(targets.calories)}
      </text>

      <line
        x1={0}
        x2={days.length * col}
        y1={PAD_TOP + PLOT_HEIGHT}
        y2={PAD_TOP + PLOT_HEIGHT}
        stroke="var(--color-axis)"
        strokeWidth={1}
      />
    </ChartFrame>
  );
}

/**
 * Macro split: a stacked bar of each day's calories by macro.
 *
 * Stacked on an absolute scale rather than normalised to 100%, so the bar
 * carries both the composition and the size of the day — a normalised version
 * makes every column the same height and throws away half the story.
 * Categorical slots in their fixed order, 2px gap between segments, legend
 * above.
 */
function MacroChart({ trends }: { trends: Trends }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { days } = trends;

  const col = columnWidth(days.length);
  const dayKcal = (day: TrendDay) => day.proteinG * 4 + day.carbsG * 4 + day.fatG * 9;
  const max = Math.max(1, ...days.map(dayKcal));

  return (
    <ChartFrame
      days={days}
      hovered={hovered}
      onHover={setHovered}
      label="Each day's calories broken down into protein, carbohydrate and fat"
      tooltip={(day) => (
        <div className="tabular space-y-0.5">
          {[
            { label: "Protein", value: day.proteinG, key: "protein" as const },
            { label: "Carbs", value: day.carbsG, key: "carbs" as const },
            { label: "Fat", value: day.fatG, key: "fat" as const },
          ].map((row) => (
            <p key={row.label} className="flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ background: macroColor(row.key) }}
                aria-hidden
              />
              <span className="text-faint">{row.label} </span>
              {formatNumber(row.value)}g
            </p>
          ))}
        </div>
      )}
    >
      {[0.5, 1].map((fraction) => (
        <line
          key={fraction}
          x1={0}
          x2={days.length * col}
          y1={PAD_TOP + PLOT_HEIGHT * (1 - fraction)}
          y2={PAD_TOP + PLOT_HEIGHT * (1 - fraction)}
          stroke="var(--color-grid)"
          strokeWidth={1}
        />
      ))}

      <line
        x1={0}
        x2={days.length * col}
        y1={PAD_TOP + PLOT_HEIGHT}
        y2={PAD_TOP + PLOT_HEIGHT}
        stroke="var(--color-axis)"
        strokeWidth={1}
      />

      {days.map((day, index) => {
        const parts = [
          { key: "protein" as const, kcal: day.proteinG * 4 },
          { key: "carbs" as const, kcal: day.carbsG * 4 },
          { key: "fat" as const, kcal: day.fatG * 9 },
        ];
        const total = dayKcal(day);
        if (total <= 0) return null;

        const barHeight = (total / max) * PLOT_HEIGHT;
        let offset = 0;
        return (
          <g key={day.day} opacity={hovered === null || hovered === index ? 1 : 0.45}>
            {parts.map((part) => {
              const segment = (part.kcal / total) * barHeight;
              const top = PAD_TOP + PLOT_HEIGHT - offset - segment;
              offset += segment;
              return (
                <rect
                  key={part.key}
                  x={index * col + Math.max(2, col * 0.2)}
                  // 2px gap so adjacent stacked fills never touch — the
                  // secondary encoding the CVD check leans on.
                  y={top + 1}
                  width={col - Math.max(4, col * 0.4)}
                  height={Math.max(0, segment - 2)}
                  rx={2}
                  fill={macroColor(part.key)}
                />
              );
            })}
          </g>
        );
      })}
    </ChartFrame>
  );
}

/** Weight: a single line series, so no legend — the heading names it. */
function WeightChart({ trends, unit }: { trends: Trends; unit: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const points = trends.days
    .map((day, index) => ({ day, index }))
    .filter((entry) => entry.day.weightKg !== null);

  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-faint">
        Log at least two weigh-ins to see a trend.
      </p>
    );
  }

  const values = points.map((p) => p.day.weightKg!);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.6, max - min);
  const y = (value: number) =>
    PAD_TOP + PLOT_HEIGHT * (1 - (value - (min - span * 0.15)) / (span * 1.3));
  const col = columnWidth(trends.days.length);
  const x = (index: number) => index * col + col / 2;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.index)} ${y(p.day.weightKg!)}`)
    .join(" ");

  return (
    <ChartFrame
      days={trends.days}
      hovered={hovered}
      onHover={setHovered}
      label="Body weight over the selected period"
      tooltip={(day) =>
        day.weightKg === null ? (
          <p className="text-faint">No weigh-in</p>
        ) : (
          <p className="tabular">
            {formatNumber(day.weightKg, 1)} {unit}
          </p>
        )
      }
    >
      <path d={path} fill="none" stroke="var(--color-protein)" strokeWidth={2} />
      {points.map((p) => (
        <circle
          key={p.day.day}
          cx={x(p.index)}
          cy={y(p.day.weightKg!)}
          r={hovered === p.index ? 5 : 4}
          fill="var(--color-protein)"
          stroke="var(--color-surface)"
          strokeWidth={2}
        />
      ))}
    </ChartFrame>
  );
}

// ─── Page-level shell ────────────────────────────────────────────────────

export function TrendCharts({ trends, unit }: { trends: Trends; unit: string }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Calories eaten, net of exercise</h2>
          <span className="tabular text-xs text-faint">
            avg {formatNumber(trends.averages.netKcal)}
          </span>
        </div>
        <div className="mt-3">
          <EnergyChart trends={trends} />
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Where the calories came from</h2>
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {MACRO_SLOTS.slice(0, 3).map((slot) => (
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
        <div className="mt-3">
          <MacroChart trends={trends} />
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Body weight</h2>
          {trends.weightChangeKg !== null && (
            <span
              className={cn(
                "tabular text-xs font-medium",
                trends.weightChangeKg < 0 ? "text-good" : "text-muted",
              )}
            >
              {trends.weightChangeKg > 0 ? "+" : ""}
              {formatNumber(trends.weightChangeKg, 1)} kg
            </span>
          )}
        </div>
        <div className="mt-3">
          <WeightChart trends={trends} unit={unit} />
        </div>
      </section>

      <div>
        <button
          type="button"
          onClick={() => setShowTable((current) => !current)}
          aria-expanded={showTable}
          className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-body"
        >
          <Table2 className="size-4" aria-hidden />
          {showTable ? "Hide" : "Show"} the numbers
        </button>

        {showTable && (
          <div className="card scroll-x mt-3">
            <table className="tabular w-full min-w-125 text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-faint">
                  <th className="px-3 py-2 font-medium">Day</th>
                  <th className="px-3 py-2 text-right font-medium">Eaten</th>
                  <th className="px-3 py-2 text-right font-medium">Burned</th>
                  <th className="px-3 py-2 text-right font-medium">Protein</th>
                  <th className="px-3 py-2 text-right font-medium">Carbs</th>
                  <th className="px-3 py-2 text-right font-medium">Fat</th>
                  <th className="px-3 py-2 text-right font-medium">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {trends.days.map((day) => (
                  <tr key={day.day} className={cn(!day.logged && "text-faint")}>
                    <td className="px-3 py-2 whitespace-nowrap">{shortDate(day.day)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(day.calories)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(day.burnKcal)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(day.proteinG)}g</td>
                    <td className="px-3 py-2 text-right">{formatNumber(day.carbsG)}g</td>
                    <td className="px-3 py-2 text-right">{formatNumber(day.fatG)}g</td>
                    <td className="px-3 py-2 text-right">
                      {day.weightKg === null ? "—" : formatNumber(day.weightKg, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
