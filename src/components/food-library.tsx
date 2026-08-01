"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SavedFood } from "@prisma/client";
import { Search, Star, Trash2 } from "lucide-react";

import { MacroSplitBar } from "@/components/charts/macros";
import { useToast } from "@/components/ui/toast";
import { cn, formatNumber } from "@/lib/utils";

export function FoodLibrary({ foods }: { foods: SavedFood[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return foods;
    return foods.filter(
      (food) =>
        food.name.toLowerCase().includes(needle) ||
        food.brand?.toLowerCase().includes(needle),
    );
  }, [foods, query]);

  async function toggleFavorite(food: SavedFood) {
    setBusy(food.id);
    try {
      const response = await fetch(`/api/saved-foods/${food.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isFavorite: !food.isFavorite }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update that.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(food: SavedFood) {
    setBusy(food.id);
    try {
      const response = await fetch(`/api/saved-foods/${food.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success(`Removed ${food.name}`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove that.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint"
          aria-hidden
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your foods"
          aria-label="Search your foods"
          className="w-full rounded-xl border border-line bg-raised py-2.5 pr-3.5 pl-10 placeholder:text-faint focus:border-accent/60 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-faint">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((food) => (
            <li key={food.id} className="card p-3.5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{food.name}</p>
                  <p className="tabular mt-0.5 text-xs text-faint">
                    {formatNumber(food.calories)} kcal per {food.servingUnit}
                    {food.brand ? ` · ${food.brand}` : ""}
                    {food.timesUsed > 0 ? ` · used ${food.timesUsed}×` : ""}
                  </p>
                  <MacroSplitBar
                    className="mt-2 max-w-56"
                    proteinG={food.proteinG}
                    carbsG={food.carbsG}
                    fatG={food.fatG}
                    labels
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(food)}
                    disabled={busy === food.id}
                    aria-label={
                      food.isFavorite
                        ? `Unfavourite ${food.name}`
                        : `Favourite ${food.name}`
                    }
                    aria-pressed={food.isFavorite}
                    className={cn(
                      "rounded-lg p-1.5 transition disabled:opacity-40",
                      food.isFavorite
                        ? "text-accent"
                        : "text-faint hover:text-muted",
                    )}
                  >
                    <Star
                      className={cn("size-4", food.isFavorite && "fill-current")}
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(food)}
                    disabled={busy === food.id}
                    aria-label={`Delete ${food.name}`}
                    className="rounded-lg p-1.5 text-faint transition hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="pt-1 text-center text-xs text-faint">
        Need something new?{" "}
        <Link href="/add" className="text-accent underline underline-offset-2">
          Snap it
        </Link>{" "}
        or{" "}
        <Link href="/add/manual" className="text-accent underline underline-offset-2">
          type it in
        </Link>
        .
      </p>
    </div>
  );
}
