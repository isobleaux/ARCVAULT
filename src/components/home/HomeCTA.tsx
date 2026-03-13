"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function HomeCTA() {
  const { data: session, status } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;

  // Hide CTA for artists, and while loading to prevent flash
  if (status === "loading" || user?.artistId) return null;

  return (
    <section className="py-20 border-t border-neutral-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold">Ready to share your music?</h2>
        <p className="mt-4 text-neutral-400 max-w-md mx-auto">
          Join {APP_NAME} today and start uploading tracks, selling products,
          and building your fanbase.
        </p>
        <Link
          href={user ? "/onboarding" : "/sign-up"}
          className="inline-flex items-center gap-2 mt-8 rounded-lg bg-amber-500 px-8 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          {user ? "Complete Your Profile" : "Create Your Artist Profile"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
