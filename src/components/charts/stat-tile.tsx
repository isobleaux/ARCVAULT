import { cn, formatNumber } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  /** Signed change; rendered with an arrow and a status colour. */
  delta?: { value: number; unit?: string; goodWhen?: "up" | "down" };
  accent?: string;
  className?: string;
}

/**
 * A headline number. Per the form heuristic a single current value is a stat
 * tile, not a one-bar chart — the number is the mark.
 */
export function StatTile({
  label,
  value,
  unit,
  detail,
  delta,
  accent,
  className,
}: StatTileProps) {
  const deltaTone =
    delta && delta.value !== 0
      ? (delta.value > 0 ? "up" : "down") === (delta.goodWhen ?? "up")
        ? "text-good"
        : "text-danger"
      : "text-faint";

  return (
    <div className={cn("card p-4", className)}>
      <div className="flex items-center gap-1.5">
        {accent && (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
        )}
        <p className="text-[0.6875rem] font-medium tracking-wider text-faint uppercase">
          {label}
        </p>
      </div>
      <p className="tabular mt-2 font-display text-2xl leading-none font-semibold">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted">{unit}</span>}
      </p>
      {delta && (
        <p className={cn("tabular mt-1.5 text-xs font-medium", deltaTone)}>
          {delta.value > 0 ? "▲" : delta.value < 0 ? "▼" : "—"}{" "}
          {formatNumber(Math.abs(delta.value), 1)}
          {delta.unit}
        </p>
      )}
      {detail && <p className="mt-1.5 text-xs leading-snug text-faint">{detail}</p>}
    </div>
  );
}
