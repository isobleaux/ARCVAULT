import { fail, ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { dayKeyToDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import {
  ACTIVITY_BY_KEY,
  estimateActivity,
  estimateVo2Max,
  ageFrom,
  substrateSplit,
} from "@/lib/energy";
import { createActivitySchema } from "@/modules/diary/validations";

export const POST = route(async (request: Request) => {
  const userId = await requireUserId();
  const body = createActivitySchema.parse(await request.json());

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return fail("Finish onboarding before logging activity.", 409);

  const definition = ACTIVITY_BY_KEY.get(body.activityKey);
  if (!definition) return fail("Unknown activity.", 400);

  const vo2Max = estimateVo2Max({
    sex: profile.sex,
    age: ageFrom(profile.birthDate),
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    activityLevel: profile.activityLevel,
  });

  const estimate = estimateActivity({
    activityKey: body.activityKey,
    intensity: body.intensity,
    minutes: body.durationMin,
    weightKg: profile.weightKg,
    vo2Max,
  });

  // A hand-edited calorie figure keeps the same fuel mix, rescaled.
  const calories = body.caloriesOverride ?? estimate.caloriesBurned;
  const split =
    body.caloriesOverride === undefined
      ? estimate.substrate
      : substrateSplit({
          kcal: calories,
          met: estimate.met,
          vo2Max,
          minutes: body.durationMin,
          endurance: definition.endurance,
        });

  const activity = await prisma.activityLog.create({
    data: {
      userId,
      performedOn: dayKeyToDate(body.day),
      activityKey: definition.key,
      name: body.name?.trim() || definition.name,
      intensity: body.intensity,
      durationMin: body.durationMin,
      met: estimate.met,
      distanceKm: body.distanceKm,
      steps: body.steps,
      caloriesBurned: calories,
      carbsBurnedG: split.carbsG,
      fatBurnedG: split.fatG,
      proteinBurnedG: split.proteinG,
      notes: body.notes,
    },
  });

  return ok({ activity }, 201);
});
