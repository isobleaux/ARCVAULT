"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

interface TrackData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  genre: string | null;
  tags: string[];
  lyrics: string | null;
  coverUrl: string | null;
  isPublished: boolean;
  isDownloadable: boolean;
  price: number | null;
}

export default function EditTrackPage() {
  const router = useRouter();
  const { trackId } = useParams<{ trackId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    genre: "",
    tags: "",
    lyrics: "",
    isPublished: false,
    isDownloadable: false,
    price: "",
  });

  useEffect(() => {
    async function fetchTrack() {
      try {
        const res = await fetch(`/api/tracks/${trackId}`);
        if (!res.ok) {
          setError("Track not found");
          return;
        }
        const track: TrackData = await res.json();
        setForm({
          title: track.title,
          slug: track.slug,
          description: track.description || "",
          genre: track.genre || "",
          tags: track.tags.join(", "),
          lyrics: track.lyrics || "",
          isPublished: track.isPublished,
          isDownloadable: track.isDownloadable,
          price: track.price ? String(track.price) : "",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchTrack();
  }, [trackId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/tracks/${trackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description || undefined,
          genre: form.genre || undefined,
          tags: form.tags
            ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          lyrics: form.lyrics || undefined,
          isPublished: form.isPublished,
          isDownloadable: form.isDownloadable,
          price: form.price ? parseFloat(form.price) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      router.push("/dashboard/music");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-neutral-500 text-sm py-12 text-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/music")}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Music
      </button>

      <h1 className="text-2xl font-bold mb-6">Edit Track</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardTitle className="mb-4">Track Details</CardTitle>
          <CardContent className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              label="URL Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Genre"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              />
              <Input
                label="Tags (comma-separated)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <Textarea
              label="Lyrics"
              value={form.lyrics}
              onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
              rows={4}
            />
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Leave empty for free"
            />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                  className="rounded border-neutral-700 bg-neutral-800"
                />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isDownloadable}
                  onChange={(e) =>
                    setForm({ ...form, isDownloadable: e.target.checked })
                  }
                  className="rounded border-neutral-700 bg-neutral-800"
                />
                Downloadable
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button type="submit" isLoading={saving}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/music")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
