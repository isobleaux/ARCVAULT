"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDays, humanDay, localDayKey, shortDate } from "@/lib/dates";

export function DayNav({ day }: { day: string }) {
  const router = useRouter();
  const today = localDayKey();

  // The server guesses "today" from its own clock. Once we know the browser's,
  // correct the URL so a user east or west of the server sees their own day.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.get("d") && today !== day) {
      router.replace(`/today?d=${today}`);
    }
  }, [day, today, router]);

  const go = (target: string) => router.push(`/today?d=${target}`);
  const isFuture = day >= today;

  return (
    <header className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => go(addDays(day, -1))}
        aria-label="Previous day"
        className="flex size-10 items-center justify-center rounded-xl border border-line text-muted transition hover:text-body"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>

      <div className="text-center">
        <h1 className="font-display text-xl leading-tight font-semibold">
          {humanDay(day, today)}
        </h1>
        <p className="text-xs text-faint">{shortDate(day)}</p>
      </div>

      <button
        type="button"
        onClick={() => go(addDays(day, 1))}
        disabled={isFuture}
        aria-label="Next day"
        className="flex size-10 items-center justify-center rounded-xl border border-line text-muted transition hover:text-body disabled:opacity-30"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </header>
  );
}
