"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivityLog } from "@prisma/client";
import { Flame, Plus, Trash2 } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { INTENSITY_LABELS } from "@/lib/energy";
import { formatDuration, formatGrams, formatNumber } from "@/lib/utils";

export function ActivityList({ day, activities }: { day: string; activities: ActivityLog[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  const totals = activities.reduce(
    (acc, a) => ({
      kcal: acc.kcal + a.caloriesBurned,
      minutes: acc.minutes + a.durationMin,
      carbs: acc.carbs + a.carbsBurnedG,
      fat: acc.fat + a.fatBurnedG,
      protein: acc.protein + a.proteinBurnedG,
    }),
    { kcal: 0, minutes: 0, carbs: 0, fat: 0, protein: 0 },
  );

  async function remove(activity: ActivityLog) {
    setRemoving(activity.id);
    try {
      const response = await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success(`Removed ${activity.name}`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove that.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="size-4 text-energy" aria-hidden />
          Activity
        </h3>
        <div className="flex items-center gap-3">
          {activities.length > 0 && (
            <span className="tabular text-sm text-muted">
              {formatNumber(totals.kcal)}
              <span className="text-faint"> kcal</span>
            </span>
          )}
          <Link
            href={`/activity?d=${day}`}
            aria-label="Log an activity"
            className="flex size-7 items-center justify-center rounded-lg bg-raised text-muted transition hover:text-energy"
          >
            <Plus className="size-4" aria-hidden />
          </Link>
        </div>
      </header>

      {activities.length === 0 ? (
        <p className="border-t border-line px-4 py-3 text-xs text-faint">
          No workouts logged. Anything you add here raises your burn and, if you have it
          switched on, your eating target.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-line border-t border-line">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activity.name}</p>
                  <p className="tabular mt-0.5 text-xs text-faint">
                    {formatDuration(activity.durationMin)} ·{" "}
                    {INTENSITY_LABELS[activity.intensity]} · {activity.met.toFixed(1)} MET
                  </p>
                  <p className="tabular mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.6875rem] text-muted">
                    <span>
                      <span className="text-faint">carbs</span>{" "}
                      {formatGrams(activity.carbsBurnedG)}
                    </span>
                    <span>
                      <span className="text-faint">fat</span>{" "}
                      {formatGrams(activity.fatBurnedG)}
                    </span>
                    <span>
                      <span className="text-faint">protein</span>{" "}
                      {formatGrams(activity.proteinBurnedG)}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="tabular text-sm font-medium text-energy">
                    {formatNumber(activity.caloriesBurned)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(activity)}
                    disabled={removing === activity.id || pending}
                    aria-label={`Remove ${activity.name}`}
                    className="rounded-lg p-1 text-faint transition hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="tabular border-t border-line bg-raised/40 px-4 py-2.5 text-xs text-muted">
            {formatDuration(totals.minutes)} of training burned{" "}
            <span className="font-medium text-energy">{formatNumber(totals.kcal)} kcal</span> —
            roughly {formatGrams(totals.carbs)} carbs, {formatGrams(totals.fat)} fat and{" "}
            {formatGrams(totals.protein)} protein oxidised.
          </p>
        </>
      )}
    </section>
  );
}
