import Anthropic from "@anthropic-ai/sdk";

import {
  MEAL_ANALYSIS_JSON_SCHEMA,
  mealAnalysisSchema,
  type MealAnalysis,
} from "./schema";

export const DEFAULT_MODEL = "claude-opus-5";

/** Largest image we will send. Clients downscale before upload; this is a guard. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export function isSupportedMimeType(value: string): value is SupportedMimeType {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(value);
}

export type AnalyzeFailureReason =
  | "no_api_key"
  | "refused"
  | "no_food"
  | "bad_response"
  | "rate_limited"
  | "upstream_error";

export type AnalyzeResult =
  | { ok: true; analysis: MealAnalysis; model: string; usage: UsageSummary }
  | { ok: false; reason: AnalyzeFailureReason; message: string };

export interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

let cachedClient: Anthropic | null = null;

function client(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

const SYSTEM_PROMPT = `You are the food-recognition engine behind a macro tracking app. You look at a photo of a meal and return a structured breakdown of what is in it.

How to estimate portions
- Size everything against visible references: a dinner plate is ~27cm, a side plate ~20cm, a fork ~19cm, a standard mug ~350ml, a chicken breast ~170g, a slice of sandwich bread ~35g, a closed fist ~1 cup.
- If the user tells you the portion or the food, trust them over your own read of the picture.
- Break the meal into the components a person would think of separately: protein, starch, vegetables, sauce, dressing, oil, garnish, drink. Sauces, dressings and cooking oil carry real calories — include them as their own items rather than folding them in silently.
- When packaging or a menu item is visible and identifiable, use that product's published nutrition rather than estimating from appearance.

Accuracy over false precision
- Give the most likely single estimate, not a conservative low-ball and not a worst case. Users correct these numbers, so a good central estimate is more useful than a hedge.
- Round to sensible resolution: calories to the nearest 5, macros to the nearest gram.
- Macros must be self-consistent: protein x 4 + carbs x 4 + fat x 9 should land within about 10% of the calorie figure for each item. Check this before you answer.
- Fibre and sugar are subsets of carbohydrate; saturated fat is a subset of fat. Never let a subset exceed its parent.
- Set confidence honestly per item. LOW is the right answer for a mixed stew, a sauce of unknown composition, or anything mostly hidden.
- Put what you had to assume in the item's assumptions field — cooking method, oil, hidden butter, dressing volume. That is what lets the user fix your estimate.

If the photo has no identifiable food or drink in it, set containsFood to false, return an empty items array, and say what you see instead in notes.`;

interface AnalyzeInput {
  /** Raw image bytes. */
  data: Buffer;
  mimeType: SupportedMimeType;
  /** Optional free-text from the user: "the bowl is 400g", "no oil", etc. */
  hint?: string;
  /** Local time of day, used only to bias the meal-type guess. */
  localTime?: string;
  model?: string;
}

export async function analyzeMealPhoto(input: AnalyzeInput): Promise<AnalyzeResult> {
  if (!hasApiKey()) {
    return {
      ok: false,
      reason: "no_api_key",
      message:
        "Photo analysis needs an ANTHROPIC_API_KEY. Add one to .env, or log this meal by hand.",
    };
  }

  const model = input.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const promptParts = [
    "Break down everything in this photo and return the macros.",
  ];
  if (input.localTime) {
    promptParts.push(`The photo was taken at about ${input.localTime} local time.`);
  }
  if (input.hint?.trim()) {
    promptParts.push(
      `The user added this context, which overrides your own reading of the picture where they conflict: "${input.hint.trim()}"`,
    );
  }

  try {
    const response = await client().beta.messages.create({
      model,
      max_tokens: 8000,
      // Opus 5 thinks by default; medium effort is plenty for portion
      // estimation and keeps the round trip inside a web request.
      output_config: {
        effort: "medium",
        format: {
          type: "json_schema",
          schema: MEAL_ANALYSIS_JSON_SCHEMA,
        },
      },
      // Safety classifiers can decline a request outright. `default` re-runs it
      // on Anthropic's recommended fallback model instead of returning nothing.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.mimeType,
                data: input.data.toString("base64"),
              },
            },
            { type: "text", text: promptParts.join(" ") },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return {
        ok: false,
        reason: "refused",
        message:
          "Claude declined to analyse this image. Try a different photo, or add the meal by hand.",
      };
    }

    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    if (!text.trim()) {
      return {
        ok: false,
        reason: "bad_response",
        message: "The analysis came back empty. Try again or add the meal by hand.",
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ok: false,
        reason: "bad_response",
        message: "Could not read the analysis. Try again or add the meal by hand.",
      };
    }

    const validated = mealAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        ok: false,
        reason: "bad_response",
        message: "The analysis was missing fields. Try again or add the meal by hand.",
      };
    }

    const analysis = reconcile(validated.data);

    if (!analysis.containsFood || analysis.items.length === 0) {
      return {
        ok: false,
        reason: "no_food",
        message:
          analysis.notes.trim() ||
          "No food found in that photo. Try again with the plate in frame.",
      };
    }

    return {
      ok: true,
      analysis,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return {
        ok: false,
        reason: "rate_limited",
        message: "Too many photos at once. Wait a moment and try again.",
      };
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return {
        ok: false,
        reason: "no_api_key",
        message: "The ANTHROPIC_API_KEY was rejected. Check the key in .env.",
      };
    }
    console.error("[vision] analysis failed", error);
    return {
      ok: false,
      reason: "upstream_error",
      message: "Photo analysis is unavailable right now. You can still log by hand.",
    };
  }
}

/**
 * Repair the two inconsistencies the model can still produce despite the
 * prompt: a subset larger than its parent, and macros that do not add up to
 * the stated calories.
 */
function reconcile(analysis: MealAnalysis): MealAnalysis {
  return {
    ...analysis,
    items: analysis.items.map((item) => {
      const carbsG = Math.max(0, item.carbsG);
      const fatG = Math.max(0, item.fatG);
      const fiberG = Math.min(item.fiberG, carbsG);
      const sugarG = Math.min(item.sugarG, carbsG);
      const satFatG = Math.min(item.satFatG, fatG);

      const fromMacros = item.proteinG * 4 + carbsG * 4 + fatG * 9;
      // Trust the macro breakdown when the stated calories are absent or
      // wildly out of line with it; otherwise keep what the model reported.
      const calories =
        item.calories <= 0 || (fromMacros > 0 && Math.abs(item.calories - fromMacros) / fromMacros > 0.35)
          ? fromMacros
          : item.calories;

      return { ...item, carbsG, fatG, fiberG, sugarG, satFatG, calories: Math.round(calories) };
    }),
  };
}
