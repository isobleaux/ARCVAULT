import { fail, ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { dayKeyToDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { updateFoodLogSchema } from "@/modules/diary/validations";

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, context: Context) => {
  const userId = await requireUserId();
  const { id } = await context.params;
  const body = updateFoodLogSchema.parse(await request.json());

  const existing = await prisma.foodLog.findFirst({ where: { id, userId } });
  if (!existing) return fail("That entry no longer exists.", 404);

  const { day, brand, servingLabel, ...rest } = body;
  const log = await prisma.foodLog.update({
    where: { id },
    data: {
      ...rest,
      ...(brand !== undefined ? { brand: brand || null } : {}),
      ...(servingLabel !== undefined ? { servingLabel: servingLabel || null } : {}),
      ...(day ? { loggedOn: dayKeyToDate(day) } : {}),
    },
  });

  return ok({ log });
});

export const DELETE = route(async (_request: Request, context: Context) => {
  const userId = await requireUserId();
  const { id } = await context.params;

  const { count } = await prisma.foodLog.deleteMany({ where: { id, userId } });
  if (count === 0) return fail("That entry no longer exists.", 404);

  return ok({ deleted: id });
});
