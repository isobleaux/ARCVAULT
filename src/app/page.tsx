import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, Flame, LineChart } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Camera,
    title: "Photograph the plate",
    body: "Every component broken out separately — the chicken, the rice, the oil it was cooked in — with the assumptions behind each number shown, so you can correct them.",
  },
  {
    icon: Flame,
    title: "Both sides of the ledger",
    body: "Log a session and see not just the calories but the fuel: how much came from carbohydrate, how much from fat, how much from protein.",
  },
  {
    icon: LineChart,
    title: "Trends that mean something",
    body: "Targets built from your own resting rate, and weekly charts that show what you actually ate against what you actually burned.",
  },
];

export default async function LandingPage() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/today");

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 md:py-24">
      <header className="mb-12 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-ink">
          <Camera className="size-4.5" aria-hidden />
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">MacroSnap</span>
      </header>

      <h1 className="font-display text-4xl leading-[1.05] font-semibold md:text-6xl">
        Point your camera at dinner.
        <br />
        <span className="text-accent">Get the macros.</span>
      </h1>

      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
        A macro tracker that reads your food from a photo and works out what your
        training burned — carbohydrate, fat and protein, not just calories.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/sign-up" size="lg">
          Get started
        </ButtonLink>
        <ButtonLink href="/sign-in" size="lg" variant="secondary">
          Sign in
        </ButtonLink>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <section key={feature.title} className="card p-5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <feature.icon className="size-4.5" aria-hidden />
            </span>
            <h2 className="mt-3.5 text-base font-semibold">{feature.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-14 max-w-xl text-xs leading-relaxed text-faint">
        Photo estimates and burn figures come from population-average models. They are
        good enough to steer a diet by, and not a substitute for a food scale, a lab, or
        medical advice.{" "}
        <Link href="/sign-up" className="text-accent underline underline-offset-2">
          Start tracking
        </Link>
        .
      </p>
    </main>
  );
}
