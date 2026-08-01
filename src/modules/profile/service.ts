import type { Profile } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { computeTargets, estimateVo2Max, ageFrom, type Targets } from "@/lib/energy";
import type { profileSchema } from "@/modules/diary/validations";
import type { z } from "zod";

export type ProfileInput = z.infer<typeof profileSchema>;

export async function getProfile(userId: string): Promise<Profile | null> {
  return prisma.profile.findUnique({ where: { userId } });
}

/** Everything the client needs to compute burn previews without a round trip. */
export interface ProfileSnapshot {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "MALE" | "FEMALE";
  activityLevel: Profile["activityLevel"];
  vo2Max: number;
  bmr: number;
  tdee: number;
  unitSystem: Profile["unitSystem"];
  addExerciseToTarget: boolean;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  fiberTarget: number;
}

export function snapshotOf(profile: Profile): ProfileSnapshot {
  return {
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: ageFrom(profile.birthDate),
    sex: profile.sex,
    activityLevel: profile.activityLevel,
    vo2Max: estimateVo2Max({
      sex: profile.sex,
      age: ageFrom(profile.birthDate),
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      activityLevel: profile.activityLevel,
    }),
    bmr: profile.bmr,
    tdee: profile.tdee,
    unitSystem: profile.unitSystem,
    addExerciseToTarget: profile.addExerciseToTarget,
    calorieTarget: profile.calorieTarget,
    proteinTarget: profile.proteinTarget,
    carbTarget: profile.carbTarget,
    fatTarget: profile.fatTarget,
    fiberTarget: profile.fiberTarget,
  };
}

export function targetsFor(input: ProfileInput): Targets {
  return computeTargets({
    sex: input.sex,
    birthDate: new Date(input.birthDate),
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    goal: input.goal,
    weeklyRateKg: input.weeklyRateKg,
  });
}

/**
 * Create or replace a user's profile.
 *
 * Targets are recomputed from the inputs unless the user supplied their own,
 * in which case `targetMode` flips to MANUAL and the computed numbers are kept
 * only as the BMR/TDEE reference the dashboard shows.
 */
export async function saveProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const computed = targetsFor(input);
  const manual = input.manualTargets;

  const data = {
    sex: input.sex,
    birthDate: new Date(input.birthDate),
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    goal: input.goal,
    weeklyRateKg: input.weeklyRateKg,
    unitSystem: input.unitSystem,
    addExerciseToTarget: input.addExerciseToTarget,
    bmr: computed.bmr,
    tdee: computed.tdee,
    targetMode: manual ? ("MANUAL" as const) : ("AUTO" as const),
    calorieTarget: manual?.calorieTarget ?? computed.calorieTarget,
    proteinTarget: manual?.proteinTarget ?? computed.proteinTarget,
    carbTarget: manual?.carbTarget ?? computed.carbTarget,
    fatTarget: manual?.fatTarget ?? computed.fatTarget,
    fiberTarget: manual?.fiberTarget ?? computed.fiberTarget,
    onboardedAt: new Date(),
  };

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  // Keep the weight chart in step with the profile weight.
  const today = new Date();
  const day = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  await prisma.weightLog.upsert({
    where: { userId_recordedOn: { userId, recordedOn: day } },
    create: { userId, recordedOn: day, weightKg: input.weightKg },
    update: { weightKg: input.weightKg },
  });

  return profile;
}
