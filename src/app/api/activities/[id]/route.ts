import { fail, ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export const DELETE = route(async (_request: Request, context: Context) => {
  const userId = await requireUserId();
  const { id } = await context.params;

  const { count } = await prisma.activityLog.deleteMany({ where: { id, userId } });
  if (count === 0) return fail("That activity no longer exists.", 404);

  return ok({ deleted: id });
});
