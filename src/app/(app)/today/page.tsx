import { redirect } from "next/navigation";
import Link from "next/link";
import { Camera, Flame, Plus, Scale } from "lucide-react";

import { CalorieRing, MacroMeterGroup } from "@/components/charts/macros";
import { DayNav } from "@/components/day-nav";
import { MealSection } from "@/components/meal-section";
import { ActivityList } from "@/components/activity-list";
import { BurnBreakdown } from "@/components/burn-breakdown";
import { WeightCard } from "@/components/weight-card";
import { requireUserId } from "@/lib/auth";
import { isValidDayKey } from "@/lib/dates";
import { formatNumber } from "@/lib/utils";
import { getDaySummary } from "@/modules/diary/service";
import { getProfile, snapshotOf } from "@/modules/profile/service";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ d?: string }>;
}

export default async function TodayPage({ searchParams }: PageProps) {
  const userId = await requireUserId();
  const profile = await getProfile(userId);
  if (!profile) redirect("/onboarding");

  const params = await searchParams;
  // The client sets ?d= from the browser's clock; without it we fall back to
  // the server's idea of today.
  const day =
    params.d && isValidDayKey(params.d)
      ? params.d
      : new Date().toISOString().slice(0, 10);

  const summary = await getDaySummary(userId, profile, day);
  const snapshot = snapshotOf(profile);

  return (
    <div className="space-y-5">
      <DayNav day={day} />

      <section className="card rise p-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
          <CalorieRing
            consumed={summary.consumed.calories}
            target={summary.targets.calories}
            burned={summary.burn.exerciseKcal}
          />

          <div className="w-full flex-1 space-y-4">
            <div className="tabular grid grid-cols-3 gap-2 text-center sm:text-left">
              <Figure label="Target" value={formatNumber(summary.targets.baseCalories)} />
              <Figure
                label="Exercise"
                value={`+${formatNumber(summary.targets.exerciseBonus)}`}
                tone={summary.targets.exerciseBonus > 0 ? "energy" : undefined}
              />
              <Figure label="Eaten" value={formatNumber(summary.consumed.calories)} />
            </div>
            <MacroMeterGroup
              protein={summary.consumed.proteinG}
              carbs={summary.consumed.carbsG}
              fat={summary.consumed.fatG}
              fiber={summary.consumed.fiberG}
              targets={summary.targets}
            />
          </div>
        </div>

        {!profile.addExerciseToTarget && summary.burn.exerciseKcal > 0 && (
          <p className="mt-4 border-t border-line pt-3 text-xs text-faint">
            You burned {formatNumber(summary.burn.exerciseKcal)} kcal training today.
            Exercise calories are not being added to your target — change that in{" "}
            <Link href="/settings" className="text-accent underline underline-offset-2">
              settings
            </Link>
            .
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href={`/add?d=${day}`}
          className="card flex items-center gap-3 p-4 transition hover:border-accent/40"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Camera className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">Snap a meal</span>
            <span className="block truncate text-xs text-faint">Photo → macros</span>
          </span>
        </Link>
        <Link
          href={`/activity?d=${day}`}
          className="card flex items-center gap-3 p-4 transition hover:border-energy/40"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-energy/12 text-energy">
            <Flame className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">Log a workout</span>
            <span className="block truncate text-xs text-faint">Calories + fuel used</span>
          </span>
        </Link>
      </div>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Diary</h2>
          <Link
            href={`/add/manual?d=${day}`}
            className="flex items-center gap-1 text-sm font-medium text-accent"
          >
            <Plus className="size-4" aria-hidden />
            Add food
          </Link>
        </div>
        {summary.meals.map((meal) => (
          <MealSection key={meal.mealType} day={day} meal={meal} />
        ))}
      </section>

      <ActivityList day={day} activities={summary.activities} />

      <BurnBreakdown burn={summary.burn} />

      <WeightCard
        day={day}
        weightKg={summary.weight?.weightKg ?? null}
        unitSystem={snapshot.unitSystem}
      />

      <p className="flex items-start gap-2 px-1 pb-2 text-xs leading-relaxed text-faint">
        <Scale className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Photo macros and burn figures are estimates from population averages. Use them
        for trends, not as clinical measurements.
      </p>
    </div>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "energy";
}) {
  return (
    <div>
      <p className="text-[0.625rem] font-medium tracking-wider text-faint uppercase">
        {label}
      </p>
      <p
        className={`mt-0.5 font-display text-lg font-semibold ${
          tone === "energy" ? "text-energy" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
