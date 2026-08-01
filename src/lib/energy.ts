/**
 * Energy expenditure and substrate oxidation model.
 *
 * Everything here is deterministic and unit-tested by construction: no I/O, no
 * database, no model calls. The UI and the API both derive their numbers from
 * these functions so a target shown on the dashboard always matches the target
 * stored on the profile.
 *
 * References
 *  - BMR: Mifflin MD, St Jeor ST, et al. Am J Clin Nutr. 1990;51(2):241-7.
 *  - MET values: 2011 Compendium of Physical Activities (Ainsworth et al.).
 *  - VO2max estimate: Jackson AS, et al. Med Sci Sports Exerc. 1990 (non-exercise model).
 *  - Substrate split: respiratory exchange ratio table, Péronnet & Massicotte 1991.
 */

export type BiologicalSex = "MALE" | "FEMALE";
export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE"
  | "EXTRA_ACTIVE";
export type Goal = "LOSE" | "MAINTAIN" | "GAIN" | "RECOMP";
export type Intensity = "LIGHT" | "MODERATE" | "VIGOROUS" | "MAX";

export const KCAL_PER_KG_FAT = 7700;
export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_FAT = 9;

/**
 * Baseline activity multipliers, deliberately lower than the textbook
 * Harris-Benedict set (1.2 / 1.375 / 1.55 / 1.725 / 1.9).
 *
 * The classic multipliers bake planned exercise into the number. MacroSnap logs
 * workouts separately and adds them on top, so using the classic values would
 * count every gym session twice. These describe daily movement *excluding*
 * anything you log as an activity.
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.325,
  MODERATELY_ACTIVE: 1.45,
  VERY_ACTIVE: 1.6,
  EXTRA_ACTIVE: 1.75,
};

export const ACTIVITY_LEVEL_LABELS: Record<
  ActivityLevel,
  { title: string; detail: string }
> = {
  SEDENTARY: {
    title: "Sedentary",
    detail: "Desk job, little walking, mostly seated day",
  },
  LIGHTLY_ACTIVE: {
    title: "Lightly active",
    detail: "Some walking, light chores, on your feet part of the day",
  },
  MODERATELY_ACTIVE: {
    title: "Moderately active",
    detail: "On your feet most of the day, plenty of walking",
  },
  VERY_ACTIVE: {
    title: "Very active",
    detail: "Physical job — retail, nursing, trades, warehouse",
  },
  EXTRA_ACTIVE: {
    title: "Extremely active",
    detail: "Heavy manual labour all day",
  },
};

/** Jackson non-exercise VO2max model input: a 0-7 physical activity rating. */
const PA_RATING: Record<ActivityLevel, number> = {
  SEDENTARY: 1,
  LIGHTLY_ACTIVE: 3,
  MODERATELY_ACTIVE: 4,
  VERY_ACTIVE: 5.5,
  EXTRA_ACTIVE: 7,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, places = 0): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function ageFrom(birthDate: Date, on: Date = new Date()): number {
  let age = on.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = on.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && on.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return clamp(age, 13, 100);
}

// ─── Resting and total daily energy expenditure ──────────────────────────

export function mifflinStJeorBmr(input: {
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return base + (input.sex === "MALE" ? 5 : -161);
}

/**
 * Total daily energy expenditure *excluding* logged workouts. Logged activities
 * are added on top of this by {@link dailyEnergyBudget}.
 */
export function baselineTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function estimateVo2Max(input: {
  sex: BiologicalSex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
}): number {
  const heightM = input.heightCm / 100;
  const bmi = input.weightKg / (heightM * heightM);
  const estimate =
    56.363 +
    1.921 * PA_RATING[input.activityLevel] -
    0.381 * input.age -
    0.754 * bmi +
    10.987 * (input.sex === "MALE" ? 1 : 0);
  return clamp(estimate, 18, 80);
}

// ─── Targets ─────────────────────────────────────────────────────────────

export interface TargetInput {
  sex: BiologicalSex;
  birthDate: Date;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  /** Desired weight change per week, kg. Negative loses. Ignored when MAINTAIN/RECOMP. */
  weeklyRateKg: number;
}

export interface Targets {
  age: number;
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  fiberTarget: number;
  /** True when the requested rate was clipped by the safe-floor guard. */
  floored: boolean;
  dailyDelta: number;
}

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  LOSE: 2.0,
  MAINTAIN: 1.6,
  GAIN: 1.8,
  RECOMP: 2.2,
};

const FAT_FRACTION: Record<Goal, number> = {
  LOSE: 0.25,
  MAINTAIN: 0.28,
  GAIN: 0.25,
  RECOMP: 0.25,
};

/** Absolute floor on a calorie target, regardless of how aggressive the goal is. */
function calorieFloor(sex: BiologicalSex, bmr: number): number {
  return Math.max(sex === "MALE" ? 1500 : 1200, bmr * 1.05);
}

export function computeTargets(input: TargetInput): Targets {
  const age = ageFrom(input.birthDate);
  const bmr = mifflinStJeorBmr({
    sex: input.sex,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age,
  });
  const tdee = baselineTdee(bmr, input.activityLevel);

  const rate =
    input.goal === "MAINTAIN" || input.goal === "RECOMP"
      ? 0
      : input.goal === "LOSE"
        ? -Math.abs(input.weeklyRateKg)
        : Math.abs(input.weeklyRateKg);

  const dailyDelta = (rate * KCAL_PER_KG_FAT) / 7;
  const floor = calorieFloor(input.sex, bmr);
  const uncapped = tdee + dailyDelta;
  const calorieTarget = Math.max(floor, uncapped);
  const floored = calorieTarget > uncapped + 1;

  // Protein is anchored to bodyweight, then capped so it can never crowd out
  // the rest of the diet on a very low calorie target.
  const proteinFromWeight = PROTEIN_G_PER_KG[input.goal] * input.weightKg;
  const proteinCap = (calorieTarget * 0.4) / KCAL_PER_G_PROTEIN;
  const proteinTarget = Math.min(proteinFromWeight, proteinCap);

  // Fat gets a share of total calories with a hormonal-health floor of
  // 0.6 g/kg bodyweight.
  const fatFromFraction = (calorieTarget * FAT_FRACTION[input.goal]) / KCAL_PER_G_FAT;
  const fatFloor = 0.6 * input.weightKg;
  const fatTarget = Math.max(fatFromFraction, fatFloor);

  const remainingKcal =
    calorieTarget - proteinTarget * KCAL_PER_G_PROTEIN - fatTarget * KCAL_PER_G_FAT;
  const carbTarget = Math.max(0, remainingKcal / KCAL_PER_G_CARB);

  // 14 g of fibre per 1000 kcal, per the Dietary Guidelines.
  const fiberTarget = (calorieTarget / 1000) * 14;

  return {
    age,
    bmr: round(bmr),
    tdee: round(tdee),
    calorieTarget: round(calorieTarget),
    proteinTarget: round(proteinTarget),
    carbTarget: round(carbTarget),
    fatTarget: round(fatTarget),
    fiberTarget: round(fiberTarget),
    floored,
    dailyDelta: round(dailyDelta),
  };
}

// ─── Activities ──────────────────────────────────────────────────────────

export interface ActivityDefinition {
  key: string;
  name: string;
  group: "Cardio" | "Strength" | "Sport" | "Studio" | "Daily life";
  /** MET by intensity. Values from the 2011 Compendium. */
  met: Record<Intensity, number>;
  /** Distance is meaningful and worth prompting for. */
  tracksDistance?: boolean;
  /** Long steady-state work — shifts substrate use toward fat and protein. */
  endurance?: boolean;
}

export const ACTIVITIES: ActivityDefinition[] = [
  // Cardio
  { key: "walking", name: "Walking", group: "Cardio", met: { LIGHT: 2.8, MODERATE: 3.5, VIGOROUS: 4.3, MAX: 5.0 }, tracksDistance: true, endurance: true },
  { key: "running", name: "Running", group: "Cardio", met: { LIGHT: 7.0, MODERATE: 9.8, VIGOROUS: 11.8, MAX: 14.5 }, tracksDistance: true, endurance: true },
  { key: "cycling", name: "Cycling", group: "Cardio", met: { LIGHT: 4.0, MODERATE: 6.8, VIGOROUS: 10.0, MAX: 14.0 }, tracksDistance: true, endurance: true },
  { key: "swimming", name: "Swimming", group: "Cardio", met: { LIGHT: 5.0, MODERATE: 7.0, VIGOROUS: 9.8, MAX: 11.0 }, tracksDistance: true, endurance: true },
  { key: "rowing", name: "Rowing machine", group: "Cardio", met: { LIGHT: 4.8, MODERATE: 7.0, VIGOROUS: 8.5, MAX: 12.0 }, tracksDistance: true, endurance: true },
  { key: "elliptical", name: "Elliptical", group: "Cardio", met: { LIGHT: 4.6, MODERATE: 5.5, VIGOROUS: 7.5, MAX: 9.0 }, endurance: true },
  { key: "stairs", name: "Stair climber", group: "Cardio", met: { LIGHT: 4.0, MODERATE: 6.5, VIGOROUS: 8.8, MAX: 11.0 } },
  { key: "jump_rope", name: "Jump rope", group: "Cardio", met: { LIGHT: 8.8, MODERATE: 11.0, VIGOROUS: 12.3, MAX: 14.0 } },
  { key: "hiking", name: "Hiking", group: "Cardio", met: { LIGHT: 4.5, MODERATE: 6.0, VIGOROUS: 7.8, MAX: 9.5 }, tracksDistance: true, endurance: true },
  { key: "hiit", name: "HIIT / circuits", group: "Cardio", met: { LIGHT: 6.0, MODERATE: 8.0, VIGOROUS: 10.0, MAX: 12.0 } },

  // Strength
  { key: "weights", name: "Weight training", group: "Strength", met: { LIGHT: 3.5, MODERATE: 5.0, VIGOROUS: 6.0, MAX: 8.0 } },
  { key: "bodyweight", name: "Bodyweight training", group: "Strength", met: { LIGHT: 3.0, MODERATE: 4.3, VIGOROUS: 6.0, MAX: 8.0 } },
  { key: "crossfit", name: "CrossFit / WOD", group: "Strength", met: { LIGHT: 5.0, MODERATE: 7.5, VIGOROUS: 9.5, MAX: 12.0 } },
  { key: "kettlebell", name: "Kettlebells", group: "Strength", met: { LIGHT: 5.0, MODERATE: 6.5, VIGOROUS: 8.0, MAX: 9.8 } },

  // Sport
  { key: "basketball", name: "Basketball", group: "Sport", met: { LIGHT: 4.5, MODERATE: 6.5, VIGOROUS: 8.0, MAX: 10.0 } },
  { key: "soccer", name: "Soccer", group: "Sport", met: { LIGHT: 5.0, MODERATE: 7.0, VIGOROUS: 10.0, MAX: 12.0 }, endurance: true },
  { key: "tennis", name: "Tennis", group: "Sport", met: { LIGHT: 5.0, MODERATE: 7.3, VIGOROUS: 8.0, MAX: 10.0 } },
  { key: "boxing", name: "Boxing / martial arts", group: "Sport", met: { LIGHT: 5.5, MODERATE: 7.8, VIGOROUS: 10.3, MAX: 12.8 } },
  { key: "climbing", name: "Climbing", group: "Sport", met: { LIGHT: 5.0, MODERATE: 7.5, VIGOROUS: 9.0, MAX: 11.0 } },
  { key: "golf", name: "Golf", group: "Sport", met: { LIGHT: 3.5, MODERATE: 4.8, VIGOROUS: 5.3, MAX: 6.0 }, endurance: true },

  // Studio
  { key: "yoga", name: "Yoga", group: "Studio", met: { LIGHT: 2.3, MODERATE: 3.0, VIGOROUS: 4.0, MAX: 5.0 } },
  { key: "pilates", name: "Pilates", group: "Studio", met: { LIGHT: 2.8, MODERATE: 3.8, VIGOROUS: 5.0, MAX: 6.0 } },
  { key: "dance", name: "Dance", group: "Studio", met: { LIGHT: 3.5, MODERATE: 5.0, VIGOROUS: 7.3, MAX: 8.5 } },
  { key: "spin", name: "Spin class", group: "Studio", met: { LIGHT: 5.5, MODERATE: 8.5, VIGOROUS: 10.5, MAX: 14.0 } },

  // Daily life
  { key: "housework", name: "Housework", group: "Daily life", met: { LIGHT: 2.5, MODERATE: 3.3, VIGOROUS: 4.0, MAX: 5.0 } },
  { key: "gardening", name: "Gardening / yard work", group: "Daily life", met: { LIGHT: 3.0, MODERATE: 4.0, VIGOROUS: 5.5, MAX: 6.3 } },
  { key: "manual_labour", name: "Manual labour", group: "Daily life", met: { LIGHT: 3.5, MODERATE: 5.5, VIGOROUS: 7.5, MAX: 9.0 } },
  { key: "other", name: "Other activity", group: "Daily life", met: { LIGHT: 3.0, MODERATE: 5.0, VIGOROUS: 7.0, MAX: 9.0 } },
];

export const ACTIVITY_BY_KEY = new Map(ACTIVITIES.map((a) => [a.key, a]));

export const INTENSITY_LABELS: Record<Intensity, string> = {
  LIGHT: "Easy",
  MODERATE: "Moderate",
  VIGOROUS: "Hard",
  MAX: "All out",
};

/**
 * Gross energy cost of a session, in kcal.
 * kcal/min = MET × 3.5 ml/kg/min × kg ÷ 1000 L × 5 kcal/L  ⇒  MET × 3.5 × kg / 200
 */
export function grossCalories(met: number, weightKg: number, minutes: number): number {
  return (met * 3.5 * weightKg * minutes) / 200;
}

/**
 * Energy cost *above* what you would have burned lying still for the same
 * period. This is the number that may be added to the day's eating target,
 * because resting expenditure is already inside TDEE.
 */
export function netCalories(met: number, weightKg: number, minutes: number): number {
  return (Math.max(0, met - 1) * 3.5 * weightKg * minutes) / 200;
}

// ─── Substrate oxidation ─────────────────────────────────────────────────

export interface SubstrateSplit {
  /** Respiratory exchange ratio the split was derived from. */
  rer: number;
  /** Fraction of VO2max the session was performed at, 0-1. */
  intensityFraction: number;
  carbsG: number;
  fatG: number;
  proteinG: number;
  carbFraction: number;
  fatFraction: number;
  proteinFraction: number;
}

/**
 * Respiratory exchange ratio as a function of relative exercise intensity.
 *
 * At rest and very light effort the body runs mostly on fat (RER ≈ 0.75); as
 * intensity rises the mix shifts to carbohydrate until it is essentially all
 * carbohydrate at maximum (RER ≈ 1.00).
 */
export function rerFromIntensity(intensityFraction: number): number {
  return clamp(0.7 + 0.32 * intensityFraction, 0.71, 1.0);
}

/** Share of energy coming from carbohydrate at a given RER (non-protein RQ). */
export function carbFractionFromRer(rer: number): number {
  return clamp((rer - 0.707) / (1.0 - 0.707), 0, 1);
}

/**
 * Protein's share of exercise energy. Small at rest and in short sessions,
 * rising with duration as glycogen depletes. Caps at 8%.
 */
function proteinFractionFor(minutes: number, endurance: boolean): number {
  if (!endurance) return 0.02;
  if (minutes <= 60) return 0.02;
  if (minutes >= 180) return 0.08;
  return 0.02 + ((minutes - 60) / 120) * 0.06;
}

/**
 * Split a session's energy cost into grams of carbohydrate, fat and protein
 * oxidised.
 *
 * Note: this is fuel *used during the session*, not a prescription for what to
 * eat. It is an estimate from population averages — real substrate use varies
 * with training status, diet, and how recently you last ate.
 */
export function substrateSplit(input: {
  kcal: number;
  met: number;
  vo2Max: number;
  minutes: number;
  endurance?: boolean;
}): SubstrateSplit {
  const intensityFraction = clamp((input.met * 3.5) / input.vo2Max, 0.1, 1);
  const rer = rerFromIntensity(intensityFraction);

  const proteinFraction = proteinFractionFor(input.minutes, input.endurance ?? false);
  const nonProtein = 1 - proteinFraction;
  const carbFraction = carbFractionFromRer(rer) * nonProtein;
  const fatFraction = nonProtein - carbFraction;

  return {
    rer: round(rer, 3),
    intensityFraction: round(intensityFraction, 3),
    carbsG: round((input.kcal * carbFraction) / KCAL_PER_G_CARB, 1),
    fatG: round((input.kcal * fatFraction) / KCAL_PER_G_FAT, 1),
    proteinG: round((input.kcal * proteinFraction) / KCAL_PER_G_PROTEIN, 1),
    carbFraction: round(carbFraction, 3),
    fatFraction: round(fatFraction, 3),
    proteinFraction: round(proteinFraction, 3),
  };
}

export interface ActivityEstimate {
  activityKey: string;
  name: string;
  met: number;
  minutes: number;
  /** Total energy cost of the session. */
  caloriesBurned: number;
  /** Energy cost above resting — the amount safe to add to an eating target. */
  netCaloriesBurned: number;
  carbsBurnedG: number;
  fatBurnedG: number;
  proteinBurnedG: number;
  substrate: SubstrateSplit;
}

/** Full estimate for one logged session. */
export function estimateActivity(input: {
  activityKey: string;
  intensity: Intensity;
  minutes: number;
  weightKg: number;
  vo2Max: number;
  metOverride?: number;
}): ActivityEstimate {
  const definition = ACTIVITY_BY_KEY.get(input.activityKey) ?? ACTIVITY_BY_KEY.get("other")!;
  const met = input.metOverride ?? definition.met[input.intensity];
  const minutes = Math.max(0, input.minutes);

  const gross = grossCalories(met, input.weightKg, minutes);
  const net = netCalories(met, input.weightKg, minutes);
  const substrate = substrateSplit({
    kcal: gross,
    met,
    vo2Max: input.vo2Max,
    minutes,
    endurance: definition.endurance,
  });

  return {
    activityKey: definition.key,
    name: definition.name,
    met,
    minutes,
    caloriesBurned: round(gross),
    netCaloriesBurned: round(net),
    carbsBurnedG: substrate.carbsG,
    fatBurnedG: substrate.fatG,
    proteinBurnedG: substrate.proteinG,
    substrate,
  };
}

/**
 * Resting and everyday-movement fuel mix. A mixed Western diet sits around
 * RER 0.83 at rest, which is roughly 40% carbohydrate / 60% fat.
 */
const RESTING_RER = 0.83;

export function restingSubstrate(kcal: number): { carbsG: number; fatG: number } {
  const carbFraction = carbFractionFromRer(RESTING_RER);
  return {
    carbsG: round((kcal * carbFraction) / KCAL_PER_G_CARB, 1),
    fatG: round((kcal * (1 - carbFraction)) / KCAL_PER_G_FAT, 1),
  };
}

export interface DailyBurn {
  /** Basal metabolic rate for the whole day. */
  restingKcal: number;
  /** Everyday movement that is not a logged workout (TDEE − BMR). */
  baselineActivityKcal: number;
  /** Above-resting cost of logged workouts. */
  exerciseKcal: number;
  /** Gross calories shown against workouts in the UI. */
  exerciseGrossKcal: number;
  totalKcal: number;
  carbsBurnedG: number;
  fatBurnedG: number;
  proteinBurnedG: number;
}

/**
 * Roll a day's expenditure into one object.
 *
 * Total burn = BMR + non-exercise movement + the above-resting cost of every
 * logged workout. Workouts contribute their *net* cost so the resting hours
 * they overlap are not counted twice.
 */
export function dailyEnergyBudget(input: {
  bmr: number;
  tdee: number;
  activities: Array<{
    met: number;
    durationMin: number;
    caloriesBurned: number;
    carbsBurnedG: number;
    fatBurnedG: number;
    proteinBurnedG: number;
  }>;
}): DailyBurn {
  const baselineActivityKcal = Math.max(0, input.tdee - input.bmr);
  const nonExercise = restingSubstrate(input.bmr + baselineActivityKcal);

  let exerciseGross = 0;
  let exerciseNet = 0;
  let carbs = nonExercise.carbsG;
  let fat = nonExercise.fatG;
  let protein = 0;

  for (const activity of input.activities) {
    exerciseGross += activity.caloriesBurned;
    // Recover the net portion from the stored MET so the arithmetic stays
    // consistent even if the user hand-edited the calorie figure.
    const netShare = activity.met > 0 ? Math.max(0, activity.met - 1) / activity.met : 0;
    exerciseNet += activity.caloriesBurned * netShare;
    carbs += activity.carbsBurnedG;
    fat += activity.fatBurnedG;
    protein += activity.proteinBurnedG;
  }

  return {
    restingKcal: round(input.bmr),
    baselineActivityKcal: round(baselineActivityKcal),
    exerciseKcal: round(exerciseNet),
    exerciseGrossKcal: round(exerciseGross),
    totalKcal: round(input.bmr + baselineActivityKcal + exerciseNet),
    carbsBurnedG: round(carbs, 1),
    fatBurnedG: round(fat, 1),
    proteinBurnedG: round(protein, 1),
  };
}

// ─── Units ───────────────────────────────────────────────────────────────

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const inToCm = (inches: number) => inches * CM_PER_IN;
export const cmToIn = (cm: number) => cm / CM_PER_IN;

export function feetInchesToCm(feet: number, inches: number): number {
  return inToCm(feet * 12 + inches);
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cmToIn(cm));
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
