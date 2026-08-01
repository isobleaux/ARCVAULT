import { z } from "zod";

/**
 * The JSON Schema handed to Claude via `output_config.format`.
 *
 * Structured outputs are strict about what they accept: every object needs
 * `additionalProperties: false` and every property listed in `required`.
 * Numeric constraints (`minimum`, `maximum`) and nullable unions are not
 * supported, so unknown strings use `""` and unknown numbers use `0`.
 */
export const MEAL_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "containsFood",
    "mealName",
    "mealType",
    "overallConfidence",
    "items",
    "notes",
    "warnings",
  ],
  properties: {
    containsFood: {
      type: "boolean",
      description: "False if the photo shows no identifiable food or drink.",
    },
    mealName: {
      type: "string",
      description:
        "Short name for the whole plate, e.g. 'Chicken burrito bowl'. Empty string if no food.",
    },
    mealType: {
      type: "string",
      enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"],
      description: "Best guess at which meal this is, from the food itself.",
    },
    overallConfidence: {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"],
      description:
        "HIGH when items and portions are clearly identifiable; LOW when heavily obscured, mixed, or ambiguous.",
    },
    items: {
      type: "array",
      description: "One entry per distinct component of the meal.",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "brand",
          "quantity",
          "unit",
          "grams",
          "calories",
          "proteinG",
          "carbsG",
          "fatG",
          "fiberG",
          "sugarG",
          "satFatG",
          "sodiumMg",
          "confidence",
          "assumptions",
        ],
        properties: {
          name: { type: "string", description: "e.g. 'Grilled chicken thigh'" },
          brand: {
            type: "string",
            description:
              "Brand if clearly visible on packaging, otherwise an empty string.",
          },
          quantity: {
            type: "number",
            description: "Number of units, e.g. 2 for two eggs.",
          },
          unit: {
            type: "string",
            description:
              "Unit for quantity: g, ml, piece, slice, cup, tbsp, serving, etc.",
          },
          grams: {
            type: "number",
            description: "Estimated total edible weight of this item in grams.",
          },
          calories: { type: "number", description: "kcal for the full quantity" },
          proteinG: { type: "number" },
          carbsG: { type: "number", description: "Total carbohydrate in grams" },
          fatG: { type: "number" },
          fiberG: { type: "number" },
          sugarG: { type: "number" },
          satFatG: { type: "number", description: "Saturated fat in grams" },
          sodiumMg: { type: "number" },
          confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
          assumptions: {
            type: "string",
            description:
              "What you had to assume — cooking method, oil used, hidden ingredients, portion reference. One or two sentences.",
          },
        },
      },
    },
    notes: {
      type: "string",
      description:
        "One or two sentences for the user about what you saw and how you sized the portions.",
    },
    warnings: {
      type: "array",
      description:
        "Things that could make this estimate wrong, e.g. 'sauce quantity is hidden under the rice'.",
      items: { type: "string" },
    },
  },
} as const;

/** Runtime validation of whatever comes back, independent of the schema above. */
export const analyzedItemSchema = z.object({
  name: z.string().min(1),
  brand: z.string().default(""),
  quantity: z.number().finite().nonnegative().default(1),
  unit: z.string().default("serving"),
  grams: z.number().finite().nonnegative().default(0),
  calories: z.number().finite().nonnegative(),
  proteinG: z.number().finite().nonnegative().default(0),
  carbsG: z.number().finite().nonnegative().default(0),
  fatG: z.number().finite().nonnegative().default(0),
  fiberG: z.number().finite().nonnegative().default(0),
  sugarG: z.number().finite().nonnegative().default(0),
  satFatG: z.number().finite().nonnegative().default(0),
  sodiumMg: z.number().finite().nonnegative().default(0),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  assumptions: z.string().default(""),
});

export const mealAnalysisSchema = z.object({
  containsFood: z.boolean(),
  mealName: z.string().default(""),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).default("SNACK"),
  overallConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  items: z.array(analyzedItemSchema).default([]),
  notes: z.string().default(""),
  warnings: z.array(z.string()).default([]),
});

export type AnalyzedItem = z.infer<typeof analyzedItemSchema>;
export type MealAnalysis = z.infer<typeof mealAnalysisSchema>;

export function totalsFor(items: AnalyzedItem[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      proteinG: acc.proteinG + item.proteinG,
      carbsG: acc.carbsG + item.carbsG,
      fatG: acc.fatG + item.fatG,
      fiberG: acc.fiberG + item.fiberG,
      sugarG: acc.sugarG + item.sugarG,
      satFatG: acc.satFatG + item.satFatG,
      sodiumMg: acc.sodiumMg + item.sodiumMg,
    }),
    {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      sugarG: 0,
      satFatG: 0,
      sodiumMg: 0,
    },
  );
}
