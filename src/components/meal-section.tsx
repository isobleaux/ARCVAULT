"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FoodLog, MealType } from "@prisma/client";
import { Camera, Plus, Sparkles, Trash2 } from "lucide-react";

import { MacroSplitBar } from "@/components/charts/macros";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/utils";
import type { MacroTotals } from "@/modules/diary/service";

interface MealSectionProps {
  day: string;
  meal: { mealType: MealType; label: string; logs: FoodLog[]; totals: MacroTotals };
}

export function MealSection({ day, meal }: MealSectionProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(log: FoodLog) {
    setRemoving(log.id);
    try {
      const response = await fetch(`/api/food/${log.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success(`Removed ${log.name}`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove that.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <h3 className="text-sm font-semibold">{meal.label}</h3>
        <div className="flex items-center gap-3">
          {meal.logs.length > 0 && (
            <span className="tabular text-sm text-muted">
              {formatNumber(meal.totals.calories)}
              <span className="text-faint"> kcal</span>
            </span>
          )}
          <Link
            href={`/add/manual?d=${day}&meal=${meal.mealType}`}
            aria-label={`Add food to ${meal.label}`}
            className="flex size-7 items-center justify-center rounded-lg bg-raised text-muted transition hover:text-accent"
          >
            <Plus className="size-4" aria-hidden />
          </Link>
        </div>
      </header>

      {meal.logs.length === 0 ? (
        <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-faint">
          <Camera className="size-3.5" aria-hidden />
          Nothing logged yet
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {meal.logs.map((log) => (
            <li key={log.id} className="group flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="truncate text-sm font-medium">{log.name}</p>
                  {log.source === "PHOTO" && (
                    <Sparkles
                      className="size-3 shrink-0 text-accent"
                      aria-label="Estimated from a photo"
                    />
                  )}
                </div>
                <p className="tabular mt-0.5 text-xs text-faint">
                  {formatNumber(log.quantity, log.quantity >= 10 ? 0 : 1)} {log.unit}
                  {log.brand ? ` · ${log.brand}` : ""}
                  {log.confidence === "LOW" ? " · low confidence" : ""}
                </p>
                <MacroSplitBar
                  className="mt-2 max-w-45"
                  proteinG={log.proteinG}
                  carbsG={log.carbsG}
                  fatG={log.fatG}
                />
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="tabular text-sm font-medium">
                  {formatNumber(log.calories)}
                </span>
                <button
                  type="button"
                  onClick={() => remove(log)}
                  disabled={removing === log.id || pending}
                  aria-label={`Remove ${log.name}`}
                  className="rounded-lg p-1 text-faint transition hover:text-danger disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
