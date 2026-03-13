"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Music, ArrowRight } from "lucide-react";
import { slugify } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const GENRES = [
  "Hip Hop",
  "R&B",
  "Pop",
  "Rock",
  "Electronic",
  "Jazz",
  "Classical",
  "Country",
  "Latin",
  "Afrobeats",
  "Reggae",
  "Folk",
  "Metal",
  "Indie",
  "Other",
];

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState("");
  const [location, setLocation] = useState("");

  // Redirect if user already has an artist profile
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/sign-in";
      return;
    }
    if (status === "authenticated") {
      const artistId = (session?.user as Record<string, unknown>)?.artistId;
      if (artistId) {
        window.location.href = "/dashboard";
      }
    }
  }, [status, session]);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  async function handleSubmit() {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, bio, genre, location }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      const artist = await res.json();

      // Update session with new artist info
      await update({
        role: "ARTIST",
        artistId: artist.id,
        artistName: artist.name,
        artistSlug: artist.slug,
      });

      // Hard navigation to ensure server reads the fresh JWT cookie
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Music className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold">Set up your artist profile</h1>
          <p className="text-neutral-400 mt-2">
            Step {step} of 2 — {step === 1 ? "Basic Info" : "About You"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-amber-500" />
          <div
            className={`h-1 flex-1 rounded-full ${
              step >= 2 ? "bg-amber-500" : "bg-neutral-800"
            }`}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Input
              id="name"
              label="Artist / Band Name"
              placeholder="e.g. The Cosmic Waves"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />

            <Input
              id="slug"
              label="Profile URL"
              placeholder="the-cosmic-waves"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <p className="text-xs text-neutral-500 -mt-2">
              Your profile will be at: /{slug || "your-name"}
            </p>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-300">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select a genre</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
              size="lg"
              disabled={!name || !slug}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Textarea
              id="bio"
              label="Bio"
              placeholder="Tell fans about yourself and your music..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />

            <Input
              id="location"
              label="Location"
              placeholder="e.g. Los Angeles, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                size="lg"
                isLoading={isLoading}
              >
                Launch Profile
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
