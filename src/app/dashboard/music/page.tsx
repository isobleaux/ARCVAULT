"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrackRow } from "@/components/music/TrackRow";
import { Button } from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Track {
  id: string;
  title: string;
  slug: string;
  duration: number | null;
  coverUrl: string | null;
  genre: string | null;
  playCount: number;
  isPublished: boolean;
  createdAt: string;
  album?: { id: string; title: string } | null;
}

export default function MusicPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const artistName =
    (session?.user as Record<string, unknown> | undefined)?.artistName as
      | string
      | undefined;
  const artistSlug =
    (session?.user as Record<string, unknown> | undefined)?.artistSlug as
      | string
      | undefined;

  useEffect(() => {
    async function fetchTracks() {
      try {
        const res = await fetch("/api/tracks");
        if (res.ok) {
          const data = await res.json();
          setTracks(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchTracks();
  }, []);

  async function handleDelete(trackId: string) {
    if (!confirm("Are you sure you want to delete this track?")) return;
    const res = await fetch(`/api/tracks/${trackId}`, { method: "DELETE" });
    if (res.ok) {
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
    }
  }

  async function handleTogglePublish(trackId: string, isPublished: boolean) {
    const res = await fetch(`/api/tracks/${trackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    if (res.ok) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId ? { ...t, isPublished: !isPublished } : t
        )
      );
    }
  }

  const filtered = tracks.filter((t) => {
    if (filter === "published" && !t.isPublished) return false;
    if (filter === "draft" && t.isPublished) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Music</h1>
        <Button onClick={() => router.push("/dashboard/music/upload")}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Track
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors ${
                filter === f
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-neutral-500 text-sm py-12 text-center">
          Loading tracks...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500 text-sm">
            {tracks.length === 0
              ? "No tracks yet. Upload your first track!"
              : "No tracks match your search."}
          </p>
          {tracks.length === 0 && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/music/upload")}
            >
              Upload Track
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((track) => (
            <div key={track.id} className="relative group/row">
              <TrackRow
                track={track}
                artistName={artistName || ""}
                artistSlug={artistSlug || ""}
                showControls
                onEdit={() =>
                  router.push(`/dashboard/music/${track.id}/edit`)
                }
                onDelete={() => handleDelete(track.id)}
                onTogglePublish={() =>
                  handleTogglePublish(track.id, track.isPublished)
                }
              />
              <button
                onClick={() =>
                  router.push(`/dashboard/music/${track.id}/splits`)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-neutral-600 hover:text-amber-400 transition-colors opacity-0 group-hover/row:opacity-100"
                title="Manage royalty splits"
              >
                <Users className="h-3.5 w-3.5" />
                Splits
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
