import type { Metadata } from "next";

import { ManualFoodForm } from "@/components/manual-food-form";
import { requireUserId } from "@/lib/auth";
import { isValidDayKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Add food" };
export const dynamic = "force-dynamic";

const MEALS = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
type MealType = (typeof MEALS)[number];

export default async function ManualAddPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; meal?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const day =
    params.d && isValidDayKey(params.d) ? params.d : new Date().toISOString().slice(0, 10);
  const meal = MEALS.includes(params.meal as MealType)
    ? (params.meal as MealType)
    : guessMeal();

  const recent = await prisma.savedFood.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { lastUsedAt: "desc" }],
    take: 8,
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Add food</h1>
        <p className="mt-1 text-sm text-muted">
          Search what you have saved, or type the numbers off the packet.
        </p>
      </header>

      <ManualFoodForm day={day} initialMeal={meal} recent={recent} />
    </div>
  );
}

function guessMeal(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "BREAKFAST";
  if (hour < 15) return "LUNCH";
  if (hour < 21) return "DINNER";
  return "SNACK";
}
