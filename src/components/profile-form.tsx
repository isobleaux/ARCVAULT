"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { macroColor } from "@/components/charts/macros";
import { Button } from "@/components/ui/button";
import { Segmented, TextField, Toggle } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  ACTIVITY_LEVEL_LABELS,
  cmToFeetInches,
  computeTargets,
  feetInchesToCm,
  kgToLb,
  lbToKg,
  round,
  type ActivityLevel,
  type BiologicalSex,
  type Goal,
} from "@/lib/energy";
import { cn, formatNumber } from "@/lib/utils";

export interface ProfileFormValues {
  sex: BiologicalSex;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  weeklyRateKg: number;
  unitSystem: "METRIC" | "IMPERIAL";
  addExerciseToTarget: boolean;
}

const DEFAULTS: ProfileFormValues = {
  sex: "MALE",
  birthDate: "1995-01-01",
  heightCm: 178,
  weightKg: 80,
  activityLevel: "LIGHTLY_ACTIVE",
  goal: "MAINTAIN",
  weeklyRateKg: 0,
  unitSystem: "METRIC",
  addExerciseToTarget: true,
};

const GOAL_COPY: Record<Goal, { title: string; detail: string }> = {
  LOSE: { title: "Lose fat", detail: "Eat below what you burn" },
  MAINTAIN: { title: "Maintain", detail: "Hold your current weight" },
  GAIN: { title: "Build", detail: "Eat above what you burn" },
  RECOMP: { title: "Recomp", detail: "Maintain calories, high protein" },
};

const RATE_OPTIONS = [0.25, 0.5, 0.75, 1];

export function ProfileForm({
  initial,
  mode,
}: {
  initial?: Partial<ProfileFormValues>;
  mode: "onboarding" | "settings";
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<ProfileFormValues>({ ...DEFAULTS, ...initial });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const imperial = values.unitSystem === "IMPERIAL";

  const targets = useMemo(() => {
    try {
      return computeTargets({
        sex: values.sex,
        birthDate: new Date(values.birthDate),
        heightCm: values.heightCm,
        weightKg: values.weightKg,
        activityLevel: values.activityLevel,
        goal: values.goal,
        weeklyRateKg: values.weeklyRateKg,
      });
    } catch {
      return null;
    }
  }, [values]);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success(mode === "onboarding" ? "You're all set" : "Targets updated");
      router.push("/today");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  // ── Sections ──────────────────────────────────────────────────────────

  const aboutYou = (
    <section className="space-y-4">
      <SectionHeading
        title="About you"
        detail="Your resting burn is calculated from these four numbers."
      />

      <Segmented
        label="Units"
        value={values.unitSystem}
        onChange={(value) => set("unitSystem", value)}
        options={[
          { value: "METRIC", label: "kg / cm" },
          { value: "IMPERIAL", label: "lb / ft" },
        ]}
      />

      <Segmented
        label="Sex at birth"
        value={values.sex}
        onChange={(value) => set("sex", value)}
        options={[
          { value: "MALE", label: "Male" },
          { value: "FEMALE", label: "Female" },
        ]}
      />
      <p className="-mt-2 text-xs text-faint">
        The Mifflin-St Jeor equation uses this to estimate lean mass. It only affects
        the calorie maths.
      </p>

      <TextField
        label="Date of birth"
        type="date"
        value={values.birthDate}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(event) => set("birthDate", event.target.value)}
      />

      {imperial ? (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Height"
            type="number"
            inputMode="numeric"
            value={cmToFeetInches(values.heightCm).feet}
            onChange={(event) =>
              set(
                "heightCm",
                feetInchesToCm(
                  Number(event.target.value) || 0,
                  cmToFeetInches(values.heightCm).inches,
                ),
              )
            }
            suffix="ft"
          />
          <TextField
            label="&nbsp;"
            type="number"
            inputMode="numeric"
            value={cmToFeetInches(values.heightCm).inches}
            onChange={(event) =>
              set(
                "heightCm",
                feetInchesToCm(
                  cmToFeetInches(values.heightCm).feet,
                  Number(event.target.value) || 0,
                ),
              )
            }
            suffix="in"
          />
        </div>
      ) : (
        <TextField
          label="Height"
          type="number"
          inputMode="numeric"
          value={round(values.heightCm)}
          onChange={(event) => set("heightCm", Number(event.target.value) || 0)}
          suffix="cm"
        />
      )}

      <TextField
        label="Weight"
        type="number"
        inputMode="decimal"
        step="0.1"
        value={round(imperial ? kgToLb(values.weightKg) : values.weightKg, 1)}
        onChange={(event) => {
          const parsed = Number(event.target.value) || 0;
          set("weightKg", imperial ? lbToKg(parsed) : parsed);
        }}
        suffix={imperial ? "lb" : "kg"}
      />
    </section>
  );

  const movement = (
    <section className="space-y-4">
      <SectionHeading
        title="Daily movement"
        detail="Not counting workouts — you log those separately so they are never counted twice."
      />

      <div className="space-y-2">
        {(Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]).map((level) => {
          const active = values.activityLevel === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => set("activityLevel", level)}
              aria-pressed={active}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
                active
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface hover:border-muted/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-accent bg-accent" : "border-line",
                )}
              >
                {active && <Check className="size-2.5 text-accent-ink" aria-hidden />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    active && "text-accent",
                  )}
                >
                  {ACTIVITY_LEVEL_LABELS[level].title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-faint">
                  {ACTIVITY_LEVEL_LABELS[level].detail}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Toggle
        label="Add workout calories to my target"
        hint="Train harder, eat more that day. Switch off to keep a flat target."
        checked={values.addExerciseToTarget}
        onChange={(value) => set("addExerciseToTarget", value)}
      />
    </section>
  );

  const goal = (
    <section className="space-y-4">
      <SectionHeading title="Your goal" detail="This sets the gap between eating and burning." />

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(GOAL_COPY) as Goal[]).map((option) => {
          const active = values.goal === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                set("goal", option);
                if (option === "MAINTAIN" || option === "RECOMP") set("weeklyRateKg", 0);
                else if (values.weeklyRateKg === 0) set("weeklyRateKg", 0.5);
              }}
              aria-pressed={active}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition",
                active
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface hover:border-muted/40",
              )}
            >
              <span className={cn("block text-sm font-medium", active && "text-accent")}>
                {GOAL_COPY[option].title}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-faint">
                {GOAL_COPY[option].detail}
              </span>
            </button>
          );
        })}
      </div>

      {(values.goal === "LOSE" || values.goal === "GAIN") && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">
            How fast? ({imperial ? "lb" : "kg"} per week)
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {RATE_OPTIONS.map((rate) => {
              const active = Math.abs(values.weeklyRateKg) === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => set("weeklyRateKg", rate)}
                  aria-pressed={active}
                  className={cn(
                    "tabular rounded-xl border py-2.5 text-sm font-medium transition",
                    active
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line bg-surface text-muted hover:text-body",
                  )}
                >
                  {imperial ? round(kgToLb(rate), 1) : rate}
                </button>
              );
            })}
          </div>
          {Math.abs(values.weeklyRateKg) >= 0.75 && (
            <p className="mt-2 text-xs leading-relaxed text-warning">
              That is an aggressive rate. Sustained deficits this large are hard to hold
              and cost lean mass — 0.25–0.5 {imperial ? "lb" : "kg"} a week is the usual
              recommendation.
            </p>
          )}
        </div>
      )}
    </section>
  );

  const review = targets && (
    <section className="space-y-4">
      <SectionHeading
        title="Your targets"
        detail="Computed from everything above. You can change any of it later."
      />

      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-muted">Daily calories</p>
          <p className="tabular font-display text-3xl font-semibold">
            {formatNumber(targets.calorieTarget)}
          </p>
        </div>

        <dl className="tabular mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <Row label="Resting burn (BMR)" value={`${formatNumber(targets.bmr)} kcal`} />
          <Row
            label="With daily movement"
            value={`${formatNumber(targets.tdee)} kcal`}
          />
          <Row
            label={targets.dailyDelta < 0 ? "Daily deficit" : "Daily surplus"}
            value={`${targets.dailyDelta > 0 ? "+" : ""}${formatNumber(targets.dailyDelta)} kcal`}
            muted={targets.dailyDelta === 0}
          />
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
          {[
            { label: "Protein", value: targets.proteinTarget, macro: "protein" as const },
            { label: "Carbs", value: targets.carbTarget, macro: "carbs" as const },
            { label: "Fat", value: targets.fatTarget, macro: "fat" as const },
            { label: "Fibre", value: targets.fiberTarget, macro: "fiber" as const },
          ].map((row) => (
            <div key={row.label}>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  className="size-2 rounded-full"
                  style={{ background: macroColor(row.macro) }}
                  aria-hidden
                />
                {row.label}
              </p>
              <p className="tabular mt-0.5 font-display text-lg font-semibold">
                {formatNumber(row.value)}
                <span className="ml-0.5 text-xs font-normal text-muted">g</span>
              </p>
            </div>
          ))}
        </div>

        {targets.floored && (
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-warning">
            Your requested rate would have put you below a safe intake, so the target has
            been raised to {formatNumber(targets.calorieTarget)} kcal. Pick a slower rate
            to hit the number you asked for.
          </p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-faint">
        These are population-average estimates. Track for two or three weeks and adjust
        against what the scale actually does — real-world burn varies by 10–15% between
        people of identical size.
      </p>
    </section>
  );

  // ── Layout ────────────────────────────────────────────────────────────

  if (mode === "settings") {
    return (
      <div className="space-y-8">
        {aboutYou}
        {movement}
        {goal}
        {review}
        <Button size="lg" full onClick={save} loading={saving}>
          Save changes
        </Button>
      </div>
    );
  }

  const steps = [aboutYou, movement, goal, review];
  const isLast = step === steps.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        {steps.map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              index <= step ? "bg-accent" : "bg-line",
            )}
          />
        ))}
      </div>

      <div className="rise" key={step}>
        {steps[step]}
      </div>

      <div className="flex gap-2.5">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
        )}
        <Button
          size="lg"
          full
          loading={saving}
          onClick={() => (isLast ? save() : setStep(step + 1))}
        >
          {isLast ? "Start tracking" : "Continue"}
          {!isLast && <ArrowRight className="size-4" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{detail}</p>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("font-medium", muted && "text-faint")}>{value}</dd>
    </div>
  );
}
