import type { ActivityLog, FoodLog, MealType, Profile, WeightLog } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { dailyEnergyBudget, round, type DailyBurn } from "@/lib/energy";
import { dateToDayKey, dayKeyToDate, lastNDays } from "@/lib/dates";

export const MEAL_ORDER: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snacks",
};

export interface MacroTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  satFatG: number;
  sodiumMg: number;
}

export const EMPTY_TOTALS: MacroTotals = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sugarG: 0,
  satFatG: 0,
  sodiumMg: 0,
};

export function sumFood(logs: Pick<FoodLog, keyof MacroTotals>[]): MacroTotals {
  return logs.reduce<MacroTotals>(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      proteinG: acc.proteinG + log.proteinG,
      carbsG: acc.carbsG + log.carbsG,
      fatG: acc.fatG + log.fatG,
      fiberG: acc.fiberG + log.fiberG,
      sugarG: acc.sugarG + log.sugarG,
      satFatG: acc.satFatG + log.satFatG,
      sodiumMg: acc.sodiumMg + log.sodiumMg,
    }),
    { ...EMPTY_TOTALS },
  );
}

export interface DayTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  /** Calories added on top of the base target because of logged workouts. */
  exerciseBonus: number;
  baseCalories: number;
}

export interface DaySummary {
  day: string;
  meals: Array<{ mealType: MealType; label: string; logs: FoodLog[]; totals: MacroTotals }>;
  activities: ActivityLog[];
  weight: WeightLog | null;
  consumed: MacroTotals;
  burn: DailyBurn;
  targets: DayTargets;
  remaining: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  /** consumed − exercise. What the "net calories" figure on the ring shows. */
  netCalories: number;
}

/**
 * Everything the dashboard needs for one day, in one place, so the API and the
 * server components never disagree about the arithmetic.
 */
export async function getDaySummary(
  userId: string,
  profile: Profile,
  day: string,
): Promise<DaySummary> {
  const on = dayKeyToDate(day);

  const [logs, activities, weight] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId, loggedOn: on },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.activityLog.findMany({
      where: { userId, performedOn: on },
      orderBy: { performedAt: "asc" },
    }),
    prisma.weightLog.findUnique({
      where: { userId_recordedOn: { userId, recordedOn: on } },
    }),
  ]);

  const meals = MEAL_ORDER.map((mealType) => {
    const mealLogs = logs.filter((log) => log.mealType === mealType);
    return {
      mealType,
      label: MEAL_LABELS[mealType],
      logs: mealLogs,
      totals: sumFood(mealLogs),
    };
  });

  const consumed = sumFood(logs);
  const burn = dailyEnergyBudget({ bmr: profile.bmr, tdee: profile.tdee, activities });

  const exerciseBonus = profile.addExerciseToTarget ? burn.exerciseKcal : 0;
  const targets: DayTargets = {
    baseCalories: profile.calorieTarget,
    exerciseBonus,
    calories: profile.calorieTarget + exerciseBonus,
    proteinG: profile.proteinTarget,
    carbsG: profile.carbTarget,
    fatG: profile.fatTarget,
    fiberG: profile.fiberTarget,
  };

  return {
    day,
    meals,
    activities,
    weight,
    consumed,
    burn,
    targets,
    remaining: {
      calories: round(targets.calories - consumed.calories),
      proteinG: round(targets.proteinG - consumed.proteinG),
      carbsG: round(targets.carbsG - consumed.carbsG),
      fatG: round(targets.fatG - consumed.fatG),
      fiberG: round(targets.fiberG - consumed.fiberG),
    },
    netCalories: round(consumed.calories - burn.exerciseKcal),
  };
}

export interface TrendDay {
  day: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  burnKcal: number;
  exerciseKcal: number;
  exerciseMinutes: number;
  weightKg: number | null;
  logged: boolean;
}

export interface Trends {
  days: TrendDay[];
  targets: { calories: number; proteinG: number; carbsG: number; fatG: number };
  averages: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    burnKcal: number;
    netKcal: number;
    /** Days with at least one food entry. */
    daysLogged: number;
  };
  weightChangeKg: number | null;
}

/** Daily rollups for the last `count` days, ending on `endDay` inclusive. */
export async function getTrends(
  userId: string,
  profile: Profile,
  endDay: string,
  count: number,
): Promise<Trends> {
  const days = lastNDays(endDay, count);
  const from = dayKeyToDate(days[0]);
  const to = dayKeyToDate(endDay);

  const [logs, activities, weights] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId, loggedOn: { gte: from, lte: to } },
      select: {
        loggedOn: true,
        calories: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        fiberG: true,
      },
    }),
    prisma.activityLog.findMany({
      where: { userId, performedOn: { gte: from, lte: to } },
      select: {
        performedOn: true,
        met: true,
        durationMin: true,
        caloriesBurned: true,
        carbsBurnedG: true,
        fatBurnedG: true,
        proteinBurnedG: true,
      },
    }),
    prisma.weightLog.findMany({
      where: { userId, recordedOn: { gte: from, lte: to } },
      orderBy: { recordedOn: "asc" },
    }),
  ]);

  const byDay = new Map<string, TrendDay>(
    days.map((day) => [
      day,
      {
        day,
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        burnKcal: 0,
        exerciseKcal: 0,
        exerciseMinutes: 0,
        weightKg: null,
        logged: false,
      },
    ]),
  );

  for (const log of logs) {
    const entry = byDay.get(dateToDayKey(log.loggedOn));
    if (!entry) continue;
    entry.calories += log.calories;
    entry.proteinG += log.proteinG;
    entry.carbsG += log.carbsG;
    entry.fatG += log.fatG;
    entry.fiberG += log.fiberG;
    entry.logged = true;
  }

  const activityByDay = new Map<string, typeof activities>();
  for (const activity of activities) {
    const key = dateToDayKey(activity.performedOn);
    const list = activityByDay.get(key) ?? [];
    list.push(activity);
    activityByDay.set(key, list);
  }

  for (const day of days) {
    const entry = byDay.get(day)!;
    const dayActivities = activityByDay.get(day) ?? [];
    const burn = dailyEnergyBudget({
      bmr: profile.bmr,
      tdee: profile.tdee,
      activities: dayActivities,
    });
    entry.burnKcal = burn.totalKcal;
    entry.exerciseKcal = burn.exerciseKcal;
    entry.exerciseMinutes = dayActivities.reduce((sum, a) => sum + a.durationMin, 0);
  }

  for (const weight of weights) {
    const entry = byDay.get(dateToDayKey(weight.recordedOn));
    if (entry) entry.weightKg = weight.weightKg;
  }

  const series = days.map((day) => byDay.get(day)!);
  const loggedDays = series.filter((d) => d.logged);
  const divisor = Math.max(1, loggedDays.length);
  const average = (pick: (d: TrendDay) => number) =>
    round(loggedDays.reduce((sum, d) => sum + pick(d), 0) / divisor);

  return {
    days: series,
    targets: {
      calories: profile.calorieTarget,
      proteinG: profile.proteinTarget,
      carbsG: profile.carbTarget,
      fatG: profile.fatTarget,
    },
    averages: {
      calories: average((d) => d.calories),
      proteinG: average((d) => d.proteinG),
      carbsG: average((d) => d.carbsG),
      fatG: average((d) => d.fatG),
      burnKcal: average((d) => d.burnKcal),
      netKcal: average((d) => d.calories - d.exerciseKcal),
      daysLogged: loggedDays.length,
    },
    weightChangeKg:
      weights.length >= 2
        ? round(weights[weights.length - 1].weightKg - weights[0].weightKg, 1)
        : null,
  };
}
