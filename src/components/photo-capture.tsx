"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ImageIcon,
  PencilLine,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { AnalysisReview } from "@/components/analysis-review";
import { Button, ButtonLink } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { prepareImage } from "@/lib/image";
import type { MealAnalysis } from "@/modules/vision/schema";

type Stage = "idle" | "analysing" | "review" | "error";

interface PhotoCaptureProps {
  day: string;
  visionEnabled: boolean;
}

interface AnalysisPayload {
  photoId: string;
  photoUrl: string;
  analysis: MealAnalysis;
}

export function PhotoCapture({ day, visionEnabled }: PhotoCaptureProps) {
  const router = useRouter();
  const toast = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setStage("analysing");
    setError(null);

    try {
      const prepared = await prepareImage(file);

      const body = new FormData();
      body.append("image", prepared);
      if (hint.trim()) body.append("hint", hint.trim());
      body.append(
        "localTime",
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );

      const response = await fetch("/api/photos/analyze", { method: "POST", body });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "That did not work.");
        setStage("error");
        return;
      }

      setResult(payload as AnalysisPayload);
      setStage("review");
    } catch {
      setError("Upload failed. Check your connection and try again.");
      setStage("error");
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setError(null);
    setHint("");
    setStage("idle");
  }

  if (stage === "review" && result) {
    return (
      <AnalysisReview
        day={day}
        photoId={result.photoId}
        photoUrl={result.photoUrl}
        analysis={result.analysis}
        onDiscard={reset}
        onSaved={() => {
          toast.success("Meal logged");
          router.push(`/today?d=${day}`);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {!visionEnabled && (
        <div className="card flex items-start gap-3 border-warning/30 bg-warning/8 p-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div className="text-sm">
            <p className="font-medium">Photo analysis is switched off</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Set <code className="rounded bg-raised px-1 py-0.5">ANTHROPIC_API_KEY</code>{" "}
              in your environment to enable it. Manual entry works either way.
            </p>
          </div>
        </div>
      )}

      <div className="card relative aspect-4/3 overflow-hidden">
        {preview ? (
          <Image
            src={preview}
            alt="The meal you are logging"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Camera className="size-9 text-faint" aria-hidden />
            <p className="text-sm text-muted">Get the whole plate in frame</p>
            <p className="max-w-60 text-xs leading-relaxed text-faint">
              Shoot from slightly above at an angle. Leaving a fork or your hand in
              shot gives the model a size reference.
            </p>
          </div>
        )}

        {stage === "analysing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/80 backdrop-blur-sm">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/15">
              <Sparkles className="size-6 animate-pulse text-accent" aria-hidden />
            </div>
            <p className="text-sm font-medium">Reading your plate…</p>
            <p className="max-w-56 text-center text-xs text-faint">
              Identifying each component and sizing the portions. This takes a few
              seconds.
            </p>
          </div>
        )}
      </div>

      {stage === "error" && error && (
        <div className="card flex items-start gap-3 border-danger/30 bg-danger/8 p-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">Could not read that photo</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{error}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={reset}>
                <RotateCcw className="size-3.5" aria-hidden />
                Try another
              </Button>
              <ButtonLink size="sm" variant="secondary" href={`/add/manual?d=${day}`}>
                Enter by hand
              </ButtonLink>
            </div>
          </div>
        </div>
      )}

      {stage !== "analysing" && (
        <>
          <div>
            <label
              htmlFor="hint"
              className="mb-1.5 block text-sm font-medium text-muted"
            >
              Anything the photo won&rsquo;t show?
            </label>
            <input
              id="hint"
              value={hint}
              onChange={(event) => setHint(event.target.value)}
              placeholder="e.g. cooked in a tbsp of olive oil, 200g of rice"
              className="w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 placeholder:text-faint focus:border-accent/60 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-faint">
              Portion sizes and hidden ingredients are where estimates go wrong. What
              you type here overrides what the model thinks it sees.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Button
              size="lg"
              full
              onClick={() => cameraRef.current?.click()}
              disabled={!visionEnabled}
            >
              <Camera className="size-4.5" aria-hidden />
              Take a photo
            </Button>
            <Button
              size="lg"
              variant="secondary"
              full
              onClick={() => libraryRef.current?.click()}
              disabled={!visionEnabled}
            >
              <ImageIcon className="size-4.5" aria-hidden />
              Choose from library
            </Button>
          </div>

          <Link
            href={`/add/manual?d=${day}`}
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted transition hover:text-body"
          >
            <PencilLine className="size-4" aria-hidden />
            Enter a meal by hand instead
          </Link>
        </>
      )}
    </div>
  );
}
