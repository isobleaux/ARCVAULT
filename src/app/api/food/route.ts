import { ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { dayKeyToDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createFoodLogsSchema } from "@/modules/diary/validations";

export const POST = route(async (request: Request) => {
  const userId = await requireUserId();
  const body = createFoodLogsSchema.parse(await request.json());
  const loggedOn = dayKeyToDate(body.day);

  // Never let a client attach someone else's photo to their diary.
  if (body.photoId) {
    const photo = await prisma.mealPhoto.findFirst({
      where: { id: body.photoId, userId },
      select: { id: true },
    });
    if (!photo) return ok({ error: "Unknown photo." }, 404);
  }

  const created = await prisma.$transaction(async (tx) => {
    const logs = await Promise.all(
      body.entries.map((entry) =>
        tx.foodLog.create({
          data: {
            userId,
            photoId: body.photoId,
            loggedOn,
            mealType: body.mealType,
            source: body.source,
            name: entry.name,
            brand: entry.brand || null,
            quantity: entry.quantity,
            unit: entry.unit,
            servingLabel: entry.servingLabel || null,
            grams: entry.grams,
            calories: entry.calories,
            proteinG: entry.proteinG,
            carbsG: entry.carbsG,
            fatG: entry.fatG,
            fiberG: entry.fiberG,
            sugarG: entry.sugarG,
            satFatG: entry.satFatG,
            sodiumMg: entry.sodiumMg,
            confidence: entry.confidence,
            assumptions: entry.assumptions,
            notes: entry.notes,
          },
        }),
      ),
    );

    if (body.saveToLibrary) {
      for (const entry of body.entries) {
        const perServing = entry.quantity > 0 ? entry.quantity : 1;
        await tx.savedFood.upsert({
          where: {
            userId_name_brand: { userId, name: entry.name, brand: entry.brand ?? "" },
          },
          create: {
            userId,
            name: entry.name,
            brand: entry.brand ?? "",
            servingSize: 1,
            servingUnit: entry.unit,
            servingLabel: entry.servingLabel || null,
            calories: entry.calories / perServing,
            proteinG: entry.proteinG / perServing,
            carbsG: entry.carbsG / perServing,
            fatG: entry.fatG / perServing,
            fiberG: entry.fiberG / perServing,
            sugarG: entry.sugarG / perServing,
            satFatG: entry.satFatG / perServing,
            sodiumMg: entry.sodiumMg / perServing,
            timesUsed: 1,
            lastUsedAt: new Date(),
          },
          update: { timesUsed: { increment: 1 }, lastUsedAt: new Date() },
        });
      }
    }

    return logs;
  });

  return ok({ logs: created }, 201);
});
