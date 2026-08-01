/**
 * Seeds a demo account with three weeks of plausible history.
 *
 * Run with `npm run db:seed`. Safe to re-run — it clears the demo user's own
 * rows first and leaves every other account alone.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  ageFrom,
  computeTargets,
  estimateActivity,
  estimateVo2Max,
  round,
  type Intensity,
} from "../src/lib/energy";

const prisma = new PrismaClient();

const EMAIL = "demo@macrosnap.app";
const PASSWORD = "macrosnap123";
const DAYS = 21;

const BREAKFASTS = [
  { name: "Greek yoghurt, 2% fat", quantity: 200, unit: "g", calories: 146, proteinG: 20, carbsG: 8, fatG: 4, fiberG: 0 },
  { name: "Blueberries", quantity: 80, unit: "g", calories: 46, proteinG: 1, carbsG: 11, fatG: 0, fiberG: 2 },
  { name: "Scrambled eggs (3)", quantity: 3, unit: "egg", calories: 273, proteinG: 20, carbsG: 2, fatG: 21, fiberG: 0 },
  { name: "Sourdough toast", quantity: 2, unit: "slice", calories: 190, proteinG: 7, carbsG: 36, fatG: 1, fiberG: 3 },
  { name: "Porridge with oat milk", quantity: 1, unit: "bowl", calories: 320, proteinG: 11, carbsG: 52, fatG: 7, fiberG: 6 },
  { name: "Flat white", quantity: 1, unit: "cup", calories: 120, proteinG: 7, carbsG: 10, fatG: 6, fiberG: 0 },
];

const LUNCHES = [
  { name: "Chicken burrito bowl", quantity: 1, unit: "bowl", calories: 685, proteinG: 48, carbsG: 72, fatG: 22, fiberG: 11 },
  { name: "Tuna salad sandwich", quantity: 1, unit: "sandwich", calories: 470, proteinG: 29, carbsG: 45, fatG: 19, fiberG: 4 },
  { name: "Salmon poke bowl", quantity: 1, unit: "bowl", calories: 610, proteinG: 38, carbsG: 65, fatG: 21, fiberG: 6 },
  { name: "Lentil soup", quantity: 400, unit: "g", calories: 310, proteinG: 18, carbsG: 44, fatG: 6, fiberG: 12 },
  { name: "Halloumi wrap", quantity: 1, unit: "wrap", calories: 590, proteinG: 26, carbsG: 51, fatG: 31, fiberG: 5 },
];

const DINNERS = [
  { name: "Grilled chicken thigh", quantity: 180, unit: "g", calories: 380, proteinG: 44, carbsG: 0, fatG: 22, fiberG: 0 },
  { name: "Jasmine rice, cooked", quantity: 220, unit: "g", calories: 286, proteinG: 6, carbsG: 62, fatG: 1, fiberG: 1 },
  { name: "Roasted broccoli", quantity: 150, unit: "g", calories: 92, proteinG: 5, carbsG: 10, fatG: 4, fiberG: 5 },
  { name: "Olive oil, cooking", quantity: 1, unit: "tbsp", calories: 119, proteinG: 0, carbsG: 0, fatG: 14, fiberG: 0 },
  { name: "Beef bolognese", quantity: 1, unit: "portion", calories: 620, proteinG: 38, carbsG: 58, fatG: 25, fiberG: 7 },
  { name: "Baked cod", quantity: 200, unit: "g", calories: 210, proteinG: 44, carbsG: 0, fatG: 3, fiberG: 0 },
  { name: "Sweet potato mash", quantity: 250, unit: "g", calories: 268, proteinG: 4, carbsG: 55, fatG: 4, fiberG: 8 },
];

const SNACKS = [
  { name: "Whey protein shake", quantity: 1, unit: "scoop", calories: 128, proteinG: 25, carbsG: 3, fatG: 2, fiberG: 1 },
  { name: "Banana", quantity: 1, unit: "medium", calories: 105, proteinG: 1, carbsG: 27, fatG: 0, fiberG: 3 },
  { name: "Almonds", quantity: 30, unit: "g", calories: 174, proteinG: 6, carbsG: 6, fatG: 15, fiberG: 4 },
  { name: "Dark chocolate, 70%", quantity: 25, unit: "g", calories: 148, proteinG: 2, carbsG: 11, fatG: 11, fiberG: 3 },
];

const SESSIONS: Array<{ key: string; intensity: Intensity; minutes: number }> = [
  { key: "running", intensity: "MODERATE", minutes: 42 },
  { key: "weights", intensity: "VIGOROUS", minutes: 55 },
  { key: "cycling", intensity: "MODERATE", minutes: 70 },
  { key: "hiit", intensity: "VIGOROUS", minutes: 25 },
  { key: "walking", intensity: "LIGHT", minutes: 50 },
  { key: "swimming", intensity: "MODERATE", minutes: 35 },
];

/** Deterministic pseudo-random so re-seeding gives the same history. */
function rng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

function utcDay(offsetFromToday: number): Date {
  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  day.setUTCDate(day.getUTCDate() + offsetFromToday);
  return day;
}

function pick<T>(items: T[], random: () => number, count: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return out;
}

async function main() {
  const random = rng(20260801);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: {
      email: EMAIL,
      name: "Demo",
      passwordHash: await bcrypt.hash(PASSWORD, 12),
    },
    update: {},
  });

  // Idempotent: wipe only this user's history.
  await prisma.$transaction([
    prisma.foodLog.deleteMany({ where: { userId: user.id } }),
    prisma.activityLog.deleteMany({ where: { userId: user.id } }),
    prisma.weightLog.deleteMany({ where: { userId: user.id } }),
    prisma.savedFood.deleteMany({ where: { userId: user.id } }),
    prisma.mealPhoto.deleteMany({ where: { userId: user.id } }),
  ]);

  const birthDate = new Date("1994-06-12");
  const startWeight = 84.2;

  const targets = computeTargets({
    sex: "MALE",
    birthDate,
    heightCm: 181,
    weightKg: startWeight,
    activityLevel: "LIGHTLY_ACTIVE",
    goal: "LOSE",
    weeklyRateKg: 0.5,
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      sex: "MALE",
      birthDate,
      heightCm: 181,
      weightKg: startWeight,
      activityLevel: "LIGHTLY_ACTIVE",
      goal: "LOSE",
      weeklyRateKg: 0.5,
      bmr: targets.bmr,
      tdee: targets.tdee,
      calorieTarget: targets.calorieTarget,
      proteinTarget: targets.proteinTarget,
      carbTarget: targets.carbTarget,
      fatTarget: targets.fatTarget,
      fiberTarget: targets.fiberTarget,
      onboardedAt: new Date(),
    },
    update: { onboardedAt: new Date() },
  });

  const vo2Max = estimateVo2Max({
    sex: "MALE",
    age: ageFrom(birthDate),
    weightKg: startWeight,
    heightCm: 181,
    activityLevel: "LIGHTLY_ACTIVE",
  });

  let foodRows = 0;
  let activityRows = 0;

  for (let offset = -(DAYS - 1); offset <= 0; offset += 1) {
    const day = utcDay(offset);

    // A couple of skipped days makes the trends page honest.
    if (random() < 0.1 && offset < -1) continue;

    const meals: Array<[typeof BREAKFASTS, "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK", number, number]> = [
      [BREAKFASTS, "BREAKFAST", 2, 8],
      [LUNCHES, "LUNCH", 1, 13],
      [DINNERS, "DINNER", 3, 19],
      [SNACKS, "SNACK", 1, 16],
    ];

    for (const [source, mealType, count, hour] of meals) {
      const chosen = pick(source, random, count);
      for (const item of chosen) {
        // ±12% day-to-day variation in portion size.
        const scale = 0.88 + random() * 0.24;
        const loggedAt = new Date(day);
        loggedAt.setUTCHours(hour, Math.floor(random() * 55));

        await prisma.foodLog.create({
          data: {
            userId: user.id,
            loggedOn: day,
            loggedAt,
            mealType,
            name: item.name,
            quantity: round(item.quantity * scale, 2),
            unit: item.unit,
            calories: round(item.calories * scale),
            proteinG: round(item.proteinG * scale, 1),
            carbsG: round(item.carbsG * scale, 1),
            fatG: round(item.fatG * scale, 1),
            fiberG: round(item.fiberG * scale, 1),
            source: random() < 0.55 ? "PHOTO" : "MANUAL",
            confidence: random() < 0.6 ? "HIGH" : random() < 0.85 ? "MEDIUM" : "LOW",
          },
        });
        foodRows += 1;
      }
    }

    // Training four days out of seven.
    if (random() < 0.58) {
      const session = SESSIONS[Math.floor(random() * SESSIONS.length)];
      const estimate = estimateActivity({
        activityKey: session.key,
        intensity: session.intensity,
        minutes: session.minutes,
        weightKg: startWeight,
        vo2Max,
      });
      const performedAt = new Date(day);
      performedAt.setUTCHours(18, Math.floor(random() * 50));

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          performedOn: day,
          performedAt,
          activityKey: estimate.activityKey,
          name: estimate.name,
          intensity: session.intensity,
          durationMin: session.minutes,
          met: estimate.met,
          caloriesBurned: estimate.caloriesBurned,
          carbsBurnedG: estimate.carbsBurnedG,
          fatBurnedG: estimate.fatBurnedG,
          proteinBurnedG: estimate.proteinBurnedG,
        },
      });
      activityRows += 1;
    }

    // Weigh in most mornings; trend down with day-to-day water noise.
    if (random() < 0.8) {
      const trend = startWeight - ((DAYS - 1 + offset) / 7) * 0.5;
      await prisma.weightLog.create({
        data: {
          userId: user.id,
          recordedOn: day,
          weightKg: round(trend + (random() - 0.5) * 0.7, 1),
        },
      });
    }
  }

  await prisma.savedFood.createMany({
    data: [
      { userId: user.id, name: "Whey protein shake", servingUnit: "scoop", calories: 128, proteinG: 25, carbsG: 3, fatG: 2, fiberG: 1, isFavorite: true, timesUsed: 14 },
      { userId: user.id, name: "Greek yoghurt, 2% fat", servingUnit: "100g", calories: 73, proteinG: 10, carbsG: 4, fatG: 2, isFavorite: true, timesUsed: 11 },
      { userId: user.id, name: "Jasmine rice, cooked", servingUnit: "100g", calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4, timesUsed: 9 },
      { userId: user.id, name: "Olive oil", servingUnit: "tbsp", calories: 119, fatG: 14, timesUsed: 8 },
      { userId: user.id, name: "Chicken breast, grilled", servingUnit: "100g", calories: 165, proteinG: 31, fatG: 3.6, timesUsed: 7 },
    ],
    skipDuplicates: true,
  });

  const latest = await prisma.weightLog.findFirst({
    where: { userId: user.id },
    orderBy: { recordedOn: "desc" },
  });
  if (latest) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { weightKg: latest.weightKg },
    });
  }

  console.log(`Seeded ${EMAIL} / ${PASSWORD}`);
  console.log(`  ${foodRows} food entries, ${activityRows} workouts across ${DAYS} days`);
  console.log(`  Target ${targets.calorieTarget} kcal · ${targets.proteinTarget}P / ${targets.carbTarget}C / ${targets.fatTarget}F`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
