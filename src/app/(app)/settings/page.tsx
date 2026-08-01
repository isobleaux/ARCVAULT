import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/modules/profile/service";
import { hasApiKey } from "@/modules/vision/analyze";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getProfile(user.id);
  if (!profile) redirect("/onboarding");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user.name ?? user.email}
        </p>
      </header>

      <ProfileForm
        mode="settings"
        initial={{
          sex: profile.sex,
          birthDate: profile.birthDate.toISOString().slice(0, 10),
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          activityLevel: profile.activityLevel,
          goal: profile.goal,
          weeklyRateKg: profile.weeklyRateKg,
          unitSystem: profile.unitSystem,
          addExerciseToTarget: profile.addExerciseToTarget,
        }}
      />

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Photo analysis</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {hasApiKey()
            ? "Connected. Meal photos are sent to the Claude API for analysis and the image is stored on this server."
            : "Not configured. Set ANTHROPIC_API_KEY in your environment to turn on photo analysis; manual entry works without it."}
        </p>
      </section>

      <SignOutButton />
    </div>
  );
}
