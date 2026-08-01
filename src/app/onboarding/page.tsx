import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";

import { ProfileForm } from "@/components/profile-form";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/modules/profile/service";

export const metadata: Metadata = { title: "Set up" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfile(user.id);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 md:py-14">
      <header className="mb-8 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-ink">
          <Camera className="size-4" aria-hidden />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">MacroSnap</span>
      </header>

      <ProfileForm
        mode="onboarding"
        initial={
          profile
            ? {
                sex: profile.sex,
                birthDate: profile.birthDate.toISOString().slice(0, 10),
                heightCm: profile.heightCm,
                weightKg: profile.weightKg,
                activityLevel: profile.activityLevel,
                goal: profile.goal,
                weeklyRateKg: profile.weeklyRateKg,
                unitSystem: profile.unitSystem,
                addExerciseToTarget: profile.addExerciseToTarget,
              }
            : undefined
        }
      />
    </main>
  );
}
