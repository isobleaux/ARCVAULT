import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatTile } from "@/components/charts/stat-tile";
import { TrendCharts } from "@/components/charts/trend-charts";
import { requireUserId } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";
import { getTrends } from "@/modules/diary/service";
import { getProfile } from "@/modules/profile/service";

export const metadata: Metadata = { title: "Trends" };
export const dynamic = "force-dynamic";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
];

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const userId = await requireUserId();
  const profile = await getProfile(userId);
  if (!profile) redirect("/onboarding");

  const params = await searchParams;
  const range = RANGES.find((r) => String(r.days) === params.range)?.days ?? 14;
  const today = new Date().toISOString().slice(0, 10);
  const trends = await getTrends(userId, profile, today, range);

  const unit = profile.unitSystem === "IMPERIAL" ? "lb" : "kg";
  const vsTarget = trends.averages.netKcal - trends.targets.calories;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Trends</h1>
        <p className="mt-1 text-sm text-muted">
          {trends.averages.daysLogged} of the last {range} days logged.
        </p>
      </header>

      <nav aria-label="Time range" className="flex gap-1.5">
        {RANGES.map((option) => (
          <Link
            key={option.days}
            href={`/trends?range=${option.days}`}
            aria-current={option.days === range ? "page" : undefined}
            className={
              option.days === range
                ? "rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink"
                : "rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-muted transition hover:text-body"
            }
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-2.5">
        <StatTile
          label="Avg eaten"
          value={formatNumber(trends.averages.calories)}
          unit="kcal"
          accent="var(--color-energy)"
          detail={
            vsTarget === 0
              ? "On target"
              : `${vsTarget > 0 ? "+" : ""}${formatNumber(vsTarget)} vs target, net of exercise`
          }
        />
        <StatTile
          label="Avg burned"
          value={formatNumber(trends.averages.burnKcal)}
          unit="kcal"
          accent="var(--color-energy)"
          detail="Resting + movement + workouts"
        />
        <StatTile
          label="Avg protein"
          value={formatNumber(trends.averages.proteinG)}
          unit="g"
          accent="var(--color-protein)"
          detail={`Target ${formatNumber(trends.targets.proteinG)}g`}
        />
        <StatTile
          label="Weight change"
          value={
            trends.weightChangeKg === null
              ? "—"
              : `${trends.weightChangeKg > 0 ? "+" : ""}${formatNumber(trends.weightChangeKg, 1)}`
          }
          unit={trends.weightChangeKg === null ? undefined : unit}
          detail={
            trends.weightChangeKg === null
              ? "Needs two weigh-ins"
              : `Across the last ${range} days`
          }
        />
      </div>

      {trends.averages.daysLogged === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-muted">Nothing logged in this window yet.</p>
          <Link
            href="/add"
            className="mt-2 inline-block text-sm font-medium text-accent underline underline-offset-4"
          >
            Snap your first meal
          </Link>
        </div>
      ) : (
        <TrendCharts trends={trends} unit={unit} />
      )}
    </div>
  );
}
