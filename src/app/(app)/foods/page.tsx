import type { Metadata } from "next";
import Link from "next/link";
import { Utensils } from "lucide-react";

import { FoodLibrary } from "@/components/food-library";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Food library" };
export const dynamic = "force-dynamic";

export default async function FoodsPage() {
  const userId = await requireUserId();
  const foods = await prisma.savedFood.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { timesUsed: "desc" }, { name: "asc" }],
    take: 200,
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Food library</h1>
        <p className="mt-1 text-sm text-muted">
          Everything you have saved, ready to re-add in two taps.
        </p>
      </header>

      {foods.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <Utensils className="size-8 text-faint" aria-hidden />
          <div>
            <p className="text-sm font-medium">Nothing saved yet</p>
            <p className="mt-1 max-w-64 text-xs leading-relaxed text-faint">
              Tick &ldquo;save to my library&rdquo; when you log a meal and the things you
              eat often will collect here.
            </p>
          </div>
          <Link
            href="/add"
            className="text-sm font-medium text-accent underline underline-offset-4"
          >
            Snap a meal
          </Link>
        </div>
      ) : (
        <FoodLibrary foods={foods} />
      )}
    </div>
  );
}
