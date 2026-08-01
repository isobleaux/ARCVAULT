import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ActivityForm } from "@/components/activity-form";
import { requireUserId } from "@/lib/auth";
import { isValidDayKey } from "@/lib/dates";
import { getProfile, snapshotOf } from "@/modules/profile/service";

export const metadata: Metadata = { title: "Log activity" };
export const dynamic = "force-dynamic";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const userId = await requireUserId();
  const profile = await getProfile(userId);
  if (!profile) redirect("/onboarding");

  const params = await searchParams;
  const day =
    params.d && isValidDayKey(params.d) ? params.d : new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Log activity</h1>
        <p className="mt-1 text-sm text-muted">
          See the calories and the fuel before you commit it.
        </p>
      </header>

      <ActivityForm day={day} profile={snapshotOf(profile)} />
    </div>
  );
}
