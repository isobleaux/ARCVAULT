import { redirect } from "next/navigation";

import { BottomNav, SideNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/modules/profile/service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Nothing in the app means anything without targets, so onboarding is a gate.
  const profile = await getProfile(user.id);
  if (!profile?.onboardedAt) redirect("/onboarding");

  return (
    <div className="flex min-h-dvh">
      <SideNav name={user.name ?? user.email} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-2xl px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
