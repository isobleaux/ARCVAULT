"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { kgToLb, lbToKg, round } from "@/lib/energy";

interface WeightCardProps {
  day: string;
  weightKg: number | null;
  unitSystem: "METRIC" | "IMPERIAL";
}

export function WeightCard({ day, weightKg, unitSystem }: WeightCardProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const imperial = unitSystem === "IMPERIAL";
  const unit = imperial ? "lb" : "kg";
  const display = weightKg === null ? "" : String(round(imperial ? kgToLb(weightKg) : weightKg, 1));
  const [value, setValue] = useState(display);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter a weight first.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/weight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          day,
          weightKg: imperial ? lbToKg(parsed) : parsed,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success("Weight saved");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card flex flex-wrap items-center gap-3 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
        <Scale className="size-5" aria-hidden />
      </span>
      <div className="min-w-32 flex-1">
        <label htmlFor="weight-today" className="block text-sm font-medium">
          Weigh-in
        </label>
        <p className="text-xs leading-snug text-faint">
          Keeps your targets anchored to your current weight
        </p>
      </div>
      <div className="relative w-24 shrink-0">
        <input
          id="weight-today"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="—"
          className="tabular w-full rounded-xl border border-line bg-raised py-2 pr-8 pl-3 text-right text-body placeholder:text-faint focus:border-accent/60 focus:outline-none"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-faint">
          {unit}
        </span>
      </div>
      <Button type="submit" size="sm" loading={saving || pending}>
        Save
      </Button>
    </form>
  );
}
