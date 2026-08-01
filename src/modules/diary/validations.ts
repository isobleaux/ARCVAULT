import { z } from "zod";

import { isValidDayKey } from "@/lib/dates";

export const dayKeySchema = z
  .string()
  .refine(isValidDayKey, { message: "Expected a YYYY-MM-DD date" });

export const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);
export const confidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const intensitySchema = z.enum(["LIGHT", "MODERATE", "VIGOROUS", "MAX"]);
export const sourceSchema = z.enum(["PHOTO", "MANUAL", "SAVED", "QUICK_ADD"]);

const nonNegative = z.number().finite().nonnegative();

export const foodEntrySchema = z.object({
  name: z.string().trim().min(1, "Give the food a name").max(120),
  brand: z.string().trim().max(80).optional(),
  quantity: z.number().finite().positive().max(10_000).default(1),
  unit: z.string().trim().min(1).max(24).default("serving"),
  servingLabel: z.string().trim().max(80).optional(),
  grams: nonNegative.max(20_000).optional(),
  calories: nonNegative.max(30_000),
  proteinG: nonNegative.max(3_000).default(0),
  carbsG: nonNegative.max(3_000).default(0),
  fatG: nonNegative.max(3_000).default(0),
  fiberG: nonNegative.max(1_000).default(0),
  sugarG: nonNegative.max(3_000).default(0),
  satFatG: nonNegative.max(3_000).default(0),
  sodiumMg: nonNegative.max(200_000).default(0),
  confidence: confidenceSchema.optional(),
  assumptions: z.string().trim().max(1_000).optional(),
  notes: z.string().trim().max(1_000).optional(),
});

export const createFoodLogsSchema = z.object({
  day: dayKeySchema,
  mealType: mealTypeSchema,
  source: sourceSchema.default("MANUAL"),
  photoId: z.string().cuid().optional(),
  saveToLibrary: z.boolean().default(false),
  entries: z.array(foodEntrySchema).min(1, "Add at least one item").max(40),
});

export const updateFoodLogSchema = foodEntrySchema.partial().extend({
  day: dayKeySchema.optional(),
  mealType: mealTypeSchema.optional(),
});

export const createActivitySchema = z.object({
  day: dayKeySchema,
  activityKey: z.string().trim().min(1).max(48),
  name: z.string().trim().max(80).optional(),
  intensity: intensitySchema.default("MODERATE"),
  durationMin: z.number().finite().positive().max(1_440),
  distanceKm: z.number().finite().nonnegative().max(1_000).optional(),
  steps: z.number().int().nonnegative().max(500_000).optional(),
  /** Overrides the computed burn when the user edits it by hand. */
  caloriesOverride: nonNegative.max(20_000).optional(),
  notes: z.string().trim().max(1_000).optional(),
});

export const createWeightSchema = z.object({
  day: dayKeySchema,
  weightKg: z.number().finite().min(20).max(400),
  bodyFatPct: z.number().finite().min(1).max(70).optional(),
  notes: z.string().trim().max(280).optional(),
});

export const savedFoodSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(80).optional(),
  servingSize: z.number().finite().positive().max(10_000).default(1),
  servingUnit: z.string().trim().min(1).max(24).default("serving"),
  servingLabel: z.string().trim().max(80).optional(),
  calories: nonNegative.max(30_000),
  proteinG: nonNegative.max(3_000).default(0),
  carbsG: nonNegative.max(3_000).default(0),
  fatG: nonNegative.max(3_000).default(0),
  fiberG: nonNegative.max(1_000).default(0),
  sugarG: nonNegative.max(3_000).default(0),
  satFatG: nonNegative.max(3_000).default(0),
  sodiumMg: nonNegative.max(200_000).default(0),
});

export const profileSchema = z.object({
  sex: z.enum(["MALE", "FEMALE"]),
  birthDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Enter a valid date of birth",
  }),
  heightCm: z.number().finite().min(90).max(250),
  weightKg: z.number().finite().min(25).max(400),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHTLY_ACTIVE",
    "MODERATELY_ACTIVE",
    "VERY_ACTIVE",
    "EXTRA_ACTIVE",
  ]),
  goal: z.enum(["LOSE", "MAINTAIN", "GAIN", "RECOMP"]),
  weeklyRateKg: z.number().finite().min(-1.5).max(1.5).default(0),
  unitSystem: z.enum(["METRIC", "IMPERIAL"]).default("METRIC"),
  addExerciseToTarget: z.boolean().default(true),
  /** Present only when the user has overridden the computed targets. */
  manualTargets: z
    .object({
      calorieTarget: z.number().finite().min(800).max(15_000),
      proteinTarget: nonNegative.max(600),
      carbTarget: nonNegative.max(2_000),
      fatTarget: nonNegative.max(600),
      fiberTarget: nonNegative.max(200),
    })
    .optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(80),
  email: z.email("Enter a valid email address").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});
