import type { Metadata } from "next";

import { PhotoCapture } from "@/components/photo-capture";
import { isValidDayKey } from "@/lib/dates";
import { hasApiKey } from "@/modules/vision/analyze";

export const metadata: Metadata = { title: "Snap a meal" };
export const dynamic = "force-dynamic";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const params = await searchParams;
  const day =
    params.d && isValidDayKey(params.d) ? params.d : new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Snap a meal</h1>
        <p className="mt-1 text-sm text-muted">
          One photo, every component broken out with its macros.
        </p>
      </header>

      <PhotoCapture day={day} visionEnabled={hasApiKey()} />
    </div>
  );
}
