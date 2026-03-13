"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";

export function HeroActions() {
  const { data: session, status } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;

  // Don't flash wrong state while loading
  if (status === "loading") {
    return (
      <div className="mt-8 flex gap-4">
        <div className="h-12 w-44 rounded-lg bg-neutral-800 animate-pulse" />
        <div className="h-12 w-36 rounded-lg bg-neutral-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-8 flex gap-4">
      {user?.artistId ? (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : user ? (
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Complete Your Profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Get Started Free
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
      >
        Explore Artists
      </Link>
    </div>
  );
}
