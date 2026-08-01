import { fail, ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, context: Context) => {
  const userId = await requireUserId();
  const { id } = await context.params;
  const body = (await request.json()) as { isFavorite?: boolean };

  const { count } = await prisma.savedFood.updateMany({
    where: { id, userId },
    data: { isFavorite: Boolean(body.isFavorite) },
  });
  if (count === 0) return fail("That food is no longer saved.", 404);

  return ok({ id, isFavorite: Boolean(body.isFavorite) });
});

export const DELETE = route(async (_request: Request, context: Context) => {
  const userId = await requireUserId();
  const { id } = await context.params;

  const { count } = await prisma.savedFood.deleteMany({ where: { id, userId } });
  if (count === 0) return fail("That food is no longer saved.", 404);

  return ok({ deleted: id });
});
