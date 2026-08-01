"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Minus, Plus, Sparkles, Trash2, TriangleAlert } from "lucide-react";

import { MacroSplitBar } from "@/components/charts/macros";
import { Button } from "@/components/ui/button";
import { Segmented, Toggle } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn, formatNumber } from "@/lib/utils";
import type { AnalyzedItem, MealAnalysis } from "@/modules/vision/schema";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

interface AnalysisReviewProps {
  day: string;
  photoId: string;
  photoUrl: string;
  analysis: MealAnalysis;
  onDiscard: () => void;
  onSaved: () => void;
}

/** An item plus the multiplier the user has dialled it to. */
interface Draft extends AnalyzedItem {
  id: string;
  scale: number;
  removed: boolean;
}

const CONFIDENCE_COPY: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High confidence", className: "text-good" },
  MEDIUM: { label: "Medium confidence", className: "text-warning" },
  LOW: { label: "Low confidence", className: "text-danger" },
};

export function AnalysisReview({
  day,
  photoId,
  photoUrl,
  analysis,
  onDiscard,
  onSaved,
}: AnalysisReviewProps) {
  const toast = useToast();
  const [mealType, setMealType] = useState<MealType>(analysis.mealType);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    analysis.items.map((item, index) => ({
      ...item,
      id: `${index}-${item.name}`,
      scale: 1,
      removed: false,
    })),
  );

  const kept = drafts.filter((draft) => !draft.removed);

  const totals = useMemo(
    () =>
      kept.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories * item.scale,
          proteinG: acc.proteinG + item.proteinG * item.scale,
          carbsG: acc.carbsG + item.carbsG * item.scale,
          fatG: acc.fatG + item.fatG * item.scale,
          fiberG: acc.fiberG + item.fiberG * item.scale,
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      ),
    [kept],
  );

  function update(id: string, patch: Partial<Draft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    );
  }

  async function save() {
    if (kept.length === 0) {
      toast.error("Keep at least one item, or discard the photo.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/food", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          day,
          mealType,
          source: "PHOTO",
          photoId,
          saveToLibrary,
          entries: kept.map((item) => ({
            name: item.name,
            brand: item.brand || undefined,
            quantity: Number((item.quantity * item.scale).toFixed(3)) || 1,
            unit: item.unit,
            grams: item.grams * item.scale || undefined,
            calories: item.calories * item.scale,
            proteinG: item.proteinG * item.scale,
            carbsG: item.carbsG * item.scale,
            fatG: item.fatG * item.scale,
            fiberG: item.fiberG * item.scale,
            sugarG: item.sugarG * item.scale,
            satFatG: item.satFatG * item.scale,
            sodiumMg: item.sodiumMg * item.scale,
            confidence: item.confidence,
            assumptions: item.assumptions || undefined,
          })),
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that meal.");
    } finally {
      setSaving(false);
    }
  }

  const confidence = CONFIDENCE_COPY[analysis.overallConfidence];

  return (
    <div className="rise space-y-4">
      <div className="card overflow-hidden">
        <div className="relative aspect-2/1">
          <Image
            src={photoUrl}
            alt={analysis.mealName || "The meal you photographed"}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-semibold">
                {analysis.mealName || "Your meal"}
              </h2>
              <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs", confidence.className)}>
                <Sparkles className="size-3" aria-hidden />
                {confidence.label}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular font-display text-2xl leading-none font-semibold">
                {formatNumber(totals.calories)}
              </p>
              <p className="text-xs text-faint">kcal</p>
            </div>
          </div>

          <MacroSplitBar
            className="mt-3"
            proteinG={totals.proteinG}
            carbsG={totals.carbsG}
            fatG={totals.fatG}
            labels
          />

          {analysis.notes && (
            <p className="mt-3 text-xs leading-relaxed text-muted">{analysis.notes}</p>
          )}

          {analysis.warnings.length > 0 && (
            <ul className="mt-3 space-y-1">
              {analysis.warnings.map((warning) => (
                <li
                  key={warning}
                  className="flex items-start gap-1.5 text-xs leading-relaxed text-warning"
                >
                  <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">
            {kept.length} item{kept.length === 1 ? "" : "s"}
          </h3>
          <p className="text-xs text-faint">Tap a row to see the assumptions</p>
        </div>

        {drafts.map((draft) => {
          const open = expanded === draft.id;
          const itemConfidence = CONFIDENCE_COPY[draft.confidence];
          return (
            <div
              key={draft.id}
              className={cn(
                "card overflow-hidden transition",
                draft.removed && "opacity-40",
              )}
            >
              <div className="flex items-start gap-3 p-3.5">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : draft.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={open}
                >
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {draft.name}
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 text-faint transition",
                        open && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </p>
                  <p className="tabular mt-0.5 text-xs text-faint">
                    {formatNumber(draft.quantity * draft.scale, 2)} {draft.unit}
                    {draft.grams > 0 ? ` · ${formatNumber(draft.grams * draft.scale)}g` : ""}
                    {" · "}
                    <span className={itemConfidence.className}>
                      {draft.confidence.toLowerCase()}
                    </span>
                  </p>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      update(draft.id, { scale: Math.max(0.25, draft.scale - 0.25) })
                    }
                    disabled={draft.removed}
                    aria-label={`Less ${draft.name}`}
                    className="flex size-7 items-center justify-center rounded-lg bg-raised text-muted transition hover:text-body disabled:opacity-40"
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="tabular w-9 text-center text-xs font-medium">
                    {draft.scale}×
                  </span>
                  <button
                    type="button"
                    onClick={() => update(draft.id, { scale: draft.scale + 0.25 })}
                    disabled={draft.removed}
                    aria-label={`More ${draft.name}`}
                    className="flex size-7 items-center justify-center rounded-lg bg-raised text-muted transition hover:text-body disabled:opacity-40"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </div>

                <div className="w-14 shrink-0 text-right">
                  <p className="tabular text-sm font-medium">
                    {formatNumber(draft.calories * draft.scale)}
                  </p>
                  <button
                    type="button"
                    onClick={() => update(draft.id, { removed: !draft.removed })}
                    className="mt-0.5 text-[0.6875rem] text-faint transition hover:text-danger"
                  >
                    {draft.removed ? (
                      "undo"
                    ) : (
                      <span className="flex items-center justify-end gap-1">
                        <Trash2 className="size-3" aria-hidden />
                        remove
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {open && (
                <div className="space-y-2 border-t border-line bg-raised/40 px-3.5 py-3">
                  <div className="tabular grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Protein", value: draft.proteinG * draft.scale },
                      { label: "Carbs", value: draft.carbsG * draft.scale },
                      { label: "Fat", value: draft.fatG * draft.scale },
                      { label: "Fibre", value: draft.fiberG * draft.scale },
                    ].map((macro) => (
                      <div key={macro.label}>
                        <p className="text-[0.625rem] tracking-wide text-faint uppercase">
                          {macro.label}
                        </p>
                        <p className="text-sm font-medium">
                          {formatNumber(macro.value, 1)}g
                        </p>
                      </div>
                    ))}
                  </div>
                  {draft.assumptions && (
                    <p className="text-xs leading-relaxed text-muted">
                      <span className="text-faint">Assumed: </span>
                      {draft.assumptions}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <Toggle
        label="Save these to my food library"
        hint="Re-add them later without another photo"
        checked={saveToLibrary}
        onChange={setSaveToLibrary}
      />

      <div className="sticky bottom-24 z-10 grid grid-cols-[auto_1fr] gap-2.5 md:bottom-4">
        <Button variant="secondary" size="lg" onClick={onDiscard} disabled={saving}>
          Discard
        </Button>
        <Button size="lg" onClick={save} loading={saving}>
          Log {formatNumber(totals.calories)} kcal
        </Button>
      </div>
    </div>
  );
}
