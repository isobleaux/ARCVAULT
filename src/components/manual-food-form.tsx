"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedFood } from "@prisma/client";
import { Search, Star } from "lucide-react";

import { MacroSplitBar } from "@/components/charts/macros";
import { Button } from "@/components/ui/button";
import { Segmented, TextField, Toggle } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/utils";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const BLANK = {
  name: "",
  brand: "",
  quantity: "1",
  unit: "serving",
  calories: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
  fiberG: "",
};

export function ManualFoodForm({
  day,
  initialMeal,
  recent,
}: {
  day: string;
  initialMeal: MealType;
  recent: SavedFood[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [mealType, setMealType] = useState<MealType>(initialMeal);
  const [form, setForm] = useState(BLANK);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SavedFood[]>(recent);

  const set = (key: keyof typeof BLANK) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  // Debounced library search; empty query falls back to the recent list.
  useEffect(() => {
    if (!query.trim()) {
      setResults(recent);
      return;
    }
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/saved-foods?q=${encodeURIComponent(query)}`);
      if (response.ok) setResults((await response.json()).foods);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, recent]);

  const quantity = Number(form.quantity) || 0;
  const preview = useMemo(
    () => ({
      calories: (Number(form.calories) || 0) * quantity,
      proteinG: (Number(form.proteinG) || 0) * quantity,
      carbsG: (Number(form.carbsG) || 0) * quantity,
      fatG: (Number(form.fatG) || 0) * quantity,
    }),
    [form, quantity],
  );

  // Macros and calories should agree; flag it rather than silently "fixing" it.
  const impliedKcal =
    preview.proteinG * 4 + preview.carbsG * 4 + preview.fatG * 9;
  const mismatch =
    preview.calories > 0 &&
    impliedKcal > 0 &&
    Math.abs(preview.calories - impliedKcal) / preview.calories > 0.2;

  function applySaved(food: SavedFood) {
    setForm({
      name: food.name,
      brand: food.brand ?? "",
      quantity: "1",
      unit: food.servingUnit,
      calories: String(Math.round(food.calories)),
      proteinG: String(Math.round(food.proteinG)),
      carbsG: String(Math.round(food.carbsG)),
      fatG: String(Math.round(food.fatG)),
      fiberG: String(Math.round(food.fiberG)),
    });
    setQuery("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Give the food a name.");
    if (!form.calories) return toast.error("Calories are required.");

    setSaving(true);
    try {
      const response = await fetch("/api/food", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          day,
          mealType,
          source: "MANUAL",
          saveToLibrary,
          entries: [
            {
              name: form.name.trim(),
              brand: form.brand.trim() || undefined,
              quantity: quantity || 1,
              unit: form.unit.trim() || "serving",
              calories: preview.calories,
              proteinG: preview.proteinG,
              carbsG: preview.carbsG,
              fatG: preview.fatG,
              fiberG: (Number(form.fiberG) || 0) * quantity,
            },
          ],
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success(`Added ${form.name.trim()}`);
      router.push(`/today?d=${day}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Segmented
        label="Meal"
        value={mealType}
        onChange={setMealType}
        options={[
          { value: "BREAKFAST", label: "Breakfast" },
          { value: "LUNCH", label: "Lunch" },
          { value: "DINNER", label: "Dinner" },
          { value: "SNACK", label: "Snack" },
        ]}
        columns={4}
      />

      <div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your saved foods"
            aria-label="Search your saved foods"
            className="w-full rounded-xl border border-line bg-raised py-2.5 pr-3.5 pl-10 placeholder:text-faint focus:border-accent/60 focus:outline-none"
          />
        </div>
        {results.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {results.slice(0, 6).map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() => applySaved(food)}
                  className="card flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:border-accent/40"
                >
                  {food.isFavorite && (
                    <Star className="size-3.5 shrink-0 fill-current text-accent" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{food.name}</span>
                    <span className="block truncate text-xs text-faint">
                      {formatNumber(food.calories)} kcal per {food.servingUnit}
                      {food.brand ? ` · ${food.brand}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3.5">
        <TextField
          label="Food"
          value={form.name}
          onChange={set("name")}
          placeholder="Greek yoghurt"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Quantity"
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0"
            value={form.quantity}
            onChange={set("quantity")}
          />
          <TextField
            label="Unit"
            value={form.unit}
            onChange={set("unit")}
            placeholder="serving"
          />
        </div>

        <p className="pt-1 text-xs text-faint">
          Enter the numbers for <strong className="text-muted">one</strong> {form.unit || "serving"} —
          the quantity above multiplies them.
        </p>

        <TextField
          label="Calories"
          type="number"
          inputMode="numeric"
          min="0"
          value={form.calories}
          onChange={set("calories")}
          suffix="kcal"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Protein"
            type="number"
            inputMode="decimal"
            min="0"
            value={form.proteinG}
            onChange={set("proteinG")}
            suffix="g"
          />
          <TextField
            label="Carbs"
            type="number"
            inputMode="decimal"
            min="0"
            value={form.carbsG}
            onChange={set("carbsG")}
            suffix="g"
          />
          <TextField
            label="Fat"
            type="number"
            inputMode="decimal"
            min="0"
            value={form.fatG}
            onChange={set("fatG")}
            suffix="g"
          />
          <TextField
            label="Fibre"
            type="number"
            inputMode="decimal"
            min="0"
            value={form.fiberG}
            onChange={set("fiberG")}
            suffix="g"
          />
        </div>
      </div>

      {preview.calories > 0 && (
        <div className="card p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">This entry</p>
            <p className="tabular font-display text-xl font-semibold">
              {formatNumber(preview.calories)}
              <span className="ml-1 text-xs font-normal text-muted">kcal</span>
            </p>
          </div>
          <MacroSplitBar
            className="mt-3"
            proteinG={preview.proteinG}
            carbsG={preview.carbsG}
            fatG={preview.fatG}
            labels
          />
          {mismatch && (
            <p className="mt-3 text-xs leading-relaxed text-warning">
              Those macros work out to about {formatNumber(impliedKcal)} kcal, not{" "}
              {formatNumber(preview.calories)}. Worth a second look — one of the numbers
              is probably off.
            </p>
          )}
        </div>
      )}

      <Toggle
        label="Save to my food library"
        hint="So you can add it again in two taps"
        checked={saveToLibrary}
        onChange={setSaveToLibrary}
      />

      <Button type="submit" size="lg" full loading={saving}>
        Add to diary
      </Button>
    </form>
  );
}
