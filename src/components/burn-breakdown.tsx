import { Info } from "lucide-react";

import { macroColor } from "@/components/charts/macros";
import type { DailyBurn } from "@/lib/energy";
import { formatGrams, formatNumber } from "@/lib/utils";

/**
 * Where the day's expenditure came from, and what fuel it used.
 *
 * The stacked bar is part-to-whole across three sources of the same measure
 * (kcal), so it is one chart with three segments and a legend, not three
 * charts. Segments carry a 2px gap; every segment is also directly labelled
 * underneath.
 */
export function BurnBreakdown({ burn }: { burn: DailyBurn }) {
  const parts = [
    {
      key: "resting",
      label: "Resting",
      value: burn.restingKcal,
      color: "var(--color-energy)",
      opacity: 0.35,
      detail: "Keeping you alive",
    },
    {
      key: "daily",
      label: "Daily movement",
      value: burn.baselineActivityKcal,
      color: "var(--color-energy)",
      opacity: 0.65,
      detail: "Walking, chores, fidgeting",
    },
    {
      key: "exercise",
      label: "Workouts",
      value: burn.exerciseKcal,
      color: "var(--color-energy)",
      opacity: 1,
      detail: "Above resting",
    },
  ];
  const total = Math.max(1, burn.totalKcal);

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">Burned today</h3>
        <p className="tabular font-display text-xl font-semibold text-energy">
          {formatNumber(burn.totalKcal)}
          <span className="ml-1 text-xs font-normal text-muted">kcal</span>
        </p>
      </div>

      <div
        className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-raised"
        role="img"
        aria-label={parts
          .map((p) => `${p.label} ${formatNumber(p.value)} kcal`)
          .join(", ")}
      >
        {parts.map((part) => (
          <div
            key={part.key}
            style={{
              width: `${(part.value / total) * 100}%`,
              background: part.color,
              opacity: part.opacity,
            }}
            className="first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>

      <dl className="mt-3 space-y-1.5">
        {parts.map((part) => (
          <div key={part.key} className="flex items-baseline gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: part.color, opacity: part.opacity }}
              aria-hidden
            />
            <dt className="text-muted">{part.label}</dt>
            <span className="min-w-0 flex-1 truncate text-faint">{part.detail}</span>
            <dd className="tabular font-medium">{formatNumber(part.value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 border-t border-line pt-3">
        <p className="text-[0.6875rem] font-medium tracking-wider text-faint uppercase">
          Fuel oxidised
        </p>
        <div className="tabular mt-2 grid grid-cols-3 gap-2">
          {[
            { label: "Carbs", value: burn.carbsBurnedG, macro: "carbs" as const },
            { label: "Fat", value: burn.fatBurnedG, macro: "fat" as const },
            { label: "Protein", value: burn.proteinBurnedG, macro: "protein" as const },
          ].map((row) => (
            <div key={row.label}>
              <p className="flex items-center gap-1.5 text-[0.6875rem] text-muted">
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: macroColor(row.macro) }}
                  aria-hidden
                />
                {row.label}
              </p>
              <p className="mt-0.5 font-display text-base font-semibold">
                {formatGrams(row.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[0.6875rem] leading-relaxed text-faint">
        <Info className="mt-px size-3 shrink-0" aria-hidden />
        <span>
          Fuel mix is estimated from exercise intensity via the respiratory exchange
          ratio. Harder efforts burn proportionally more carbohydrate, easier ones more
          fat. This is what your body <em>used</em>, not what you should eat.
        </span>
      </p>
    </section>
  );
}
