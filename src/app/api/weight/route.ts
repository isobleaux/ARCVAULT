import { ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { dayKeyToDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createWeightSchema } from "@/modules/diary/validations";

export const POST = route(async (request: Request) => {
  const userId = await requireUserId();
  const body = createWeightSchema.parse(await request.json());
  const recordedOn = dayKeyToDate(body.day);

  const entry = await prisma.weightLog.upsert({
    where: { userId_recordedOn: { userId, recordedOn } },
    create: {
      userId,
      recordedOn,
      weightKg: body.weightKg,
      bodyFatPct: body.bodyFatPct,
      notes: body.notes,
    },
    update: {
      weightKg: body.weightKg,
      bodyFatPct: body.bodyFatPct,
      notes: body.notes,
    },
  });

  // Targets are anchored to bodyweight, so keep the profile in step.
  await prisma.profile.updateMany({
    where: { userId },
    data: { weightKg: body.weightKg },
  });

  return ok({ entry }, 201);
});
