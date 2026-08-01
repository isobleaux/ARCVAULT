"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";

import { macroColor } from "@/components/charts/macros";
import { Button } from "@/components/ui/button";
import { Segmented, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  ACTIVITIES,
  ACTIVITY_BY_KEY,
  INTENSITY_LABELS,
  estimateActivity,
  type Intensity,
} from "@/lib/energy";
import { cn, formatGrams, formatNumber } from "@/lib/utils";
import type { ProfileSnapshot } from "@/modules/profile/service";

const GROUPS = ["Cardio", "Strength", "Sport", "Studio", "Daily life"] as const;
const DURATION_PRESETS = [15, 30, 45, 60, 90];

export function ActivityForm({
  day,
  profile,
}: {
  day: string;
  profile: ProfileSnapshot;
}) {
  const router = useRouter();
  const toast = useToast();

  const [group, setGroup] = useState<(typeof GROUPS)[number]>("Cardio");
  const [activityKey, setActivityKey] = useState("running");
  const [intensity, setIntensity] = useState<Intensity>("MODERATE");
  const [minutes, setMinutes] = useState("30");
  const [saving, setSaving] = useState(false);

  const duration = Number(minutes) || 0;

  // The estimate is computed with the same pure functions the server uses, so
  // the preview and the saved row can never disagree.
  const estimate = useMemo(
    () =>
      estimateActivity({
        activityKey,
        intensity,
        minutes: duration,
        weightKg: profile.weightKg,
        vo2Max: profile.vo2Max,
      }),
    [activityKey, intensity, duration, profile.weightKg, profile.vo2Max],
  );

  const definition = ACTIVITY_BY_KEY.get(activityKey);
  const fuel = [
    { label: "Carbs", value: estimate.carbsBurnedG, macro: "carbs" as const },
    { label: "Fat", value: estimate.fatBurnedG, macro: "fat" as const },
    { label: "Protein", value: estimate.proteinBurnedG, macro: "protein" as const },
  ];
  const fuelTotal = Math.max(
    1,
    estimate.carbsBurnedG * 4 + estimate.fatBurnedG * 9 + estimate.proteinBurnedG * 4,
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (duration <= 0) return toast.error("How long did you train for?");

    setSaving(true);
    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day, activityKey, intensity, durationMin: duration }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success(`Logged ${definition?.name ?? "activity"}`);
      router.push(`/today?d=${day}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="scroll-x no-scrollbar -mx-4 px-4">
        <div className="flex gap-1.5">
          {GROUPS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setGroup(name);
                const first = ACTIVITIES.find((a) => a.group === name);
                if (first) setActivityKey(first.key);
              }}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                group === name
                  ? "bg-accent text-accent-ink"
                  : "border border-line bg-surface text-muted hover:text-body",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACTIVITIES.filter((a) => a.group === group).map((activity) => (
          <button
            key={activity.key}
            type="button"
            onClick={() => setActivityKey(activity.key)}
            aria-pressed={activityKey === activity.key}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
              activityKey === activity.key
                ? "border-accent bg-accent-soft text-accent"
                : "border-line bg-surface text-muted hover:text-body",
            )}
          >
            {activity.name}
          </button>
        ))}
      </div>

      <Segmented
        label="How hard?"
        value={intensity}
        onChange={setIntensity}
        options={(["LIGHT", "MODERATE", "VIGOROUS", "MAX"] as Intensity[]).map((value) => ({
          value,
          label: INTENSITY_LABELS[value],
        }))}
        columns={4}
      />

      <div>
        <TextField
          label="Duration"
          type="number"
          inputMode="numeric"
          min="1"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          suffix="min"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMinutes(String(preset))}
              className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-muted transition hover:text-body"
            >
              {preset}m
            </button>
          ))}
        </div>
      </div>

      <section className="card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Flame className="size-4 text-energy" aria-hidden />
            Estimated burn
          </p>
          <p className="tabular font-display text-2xl leading-none font-semibold text-energy">
            {formatNumber(estimate.caloriesBurned)}
            <span className="ml-1 text-xs font-normal text-muted">kcal</span>
          </p>
        </div>

        <p className="tabular mt-1 text-xs text-faint">
          {estimate.met.toFixed(1)} MET · about{" "}
          {Math.round(estimate.substrate.intensityFraction * 100)}% of your estimated
          VO₂max · {formatNumber(estimate.netCaloriesBurned)} kcal above resting
        </p>

        <div className="mt-4">
          <p className="text-[0.6875rem] font-medium tracking-wider text-faint uppercase">
            Fuel mix
          </p>
          <div
            className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-raised"
            role="img"
            aria-label={fuel
              .map((f) => `${f.label} ${formatGrams(f.value)}`)
              .join(", ")}
          >
            {fuel.map((row) => {
              const kcal = row.value * (row.macro === "fat" ? 9 : 4);
              return (
                <div
                  key={row.label}
                  style={{
                    width: `${(kcal / fuelTotal) * 100}%`,
                    background: macroColor(row.macro),
                  }}
                  className="first:rounded-l-full last:rounded-r-full"
                />
              );
            })}
          </div>
          <div className="tabular mt-2.5 grid grid-cols-3 gap-2">
            {fuel.map((row) => (
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
                  {formatGrams(row.value, 1)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-[0.6875rem] leading-relaxed text-faint">
          Harder efforts shift the mix toward carbohydrate; long easy sessions burn
          proportionally more fat and start drawing on protein. Estimated from the
          respiratory exchange ratio at this intensity.
        </p>
      </section>

      <Button type="submit" size="lg" full loading={saving}>
        Log this session
      </Button>
    </form>
  );
}
