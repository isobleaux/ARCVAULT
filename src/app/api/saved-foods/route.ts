import { ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savedFoodSchema } from "@/modules/diary/validations";

export const GET = route(async (request: Request) => {
  const userId = await requireUserId();
  const query = new URL(request.url).searchParams.get("q")?.trim();

  const foods = await prisma.savedFood.findMany({
    where: {
      userId,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { brand: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ isFavorite: "desc" }, { lastUsedAt: "desc" }, { name: "asc" }],
    take: 50,
  });

  return ok({ foods });
});

export const POST = route(async (request: Request) => {
  const userId = await requireUserId();
  const body = savedFoodSchema.parse(await request.json());

  const food = await prisma.savedFood.upsert({
    where: {
      userId_name_brand: { userId, name: body.name, brand: body.brand ?? "" },
    },
    create: { userId, ...body, brand: body.brand ?? "" },
    update: { ...body, brand: body.brand ?? "" },
  });

  return ok({ food }, 201);
});
