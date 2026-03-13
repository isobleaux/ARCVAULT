"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePlayer, PlayerTrack } from "@/components/player/PlayerContext";
import { formatDuration } from "@/lib/utils";
import { Play, Pause, Radio, Music } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RadioTrack {
  id: string;
  title: string;
  duration: number | null;
  coverUrl: string | null;
  genre: string | null;
  playCount: number;
  artist: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
  };
}

interface Genre {
  name: string;
  trackCount: number;
}

export default function RadioPage() {
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, play, pause, resume, playQueue, toggleShuffle } = usePlayer();

  useEffect(() => {
    fetch("/api/radio/genres")
      .then((r) => r.json())
      .then((data) => setGenres(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedGenre
      ? `/api/radio?genre=${encodeURIComponent(selectedGenre)}`
      : "/api/radio";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setTracks(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedGenre]);

  function handlePlayRadio() {
    if (tracks.length === 0) return;
    const playerTracks: PlayerTrack[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artistName: t.artist.name,
      artistSlug: t.artist.slug,
      coverUrl: t.coverUrl,
      duration: t.duration,
    }));
    playQueue(playerTracks, 0);
    toggleShuffle();
  }

  function handlePlayTrack(track: RadioTrack, index: number) {
    const playerTracks: PlayerTrack[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artistName: t.artist.name,
      artistSlug: t.artist.slug,
      coverUrl: t.coverUrl,
      duration: t.duration,
    }));
    playQueue(playerTracks, index);
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/15 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Radio className="h-8 w-8 text-amber-500" />
            <h1 className="text-4xl font-bold">Radio</h1>
          </div>
          <p className="text-neutral-400 max-w-lg mb-8">
            Continuous playback of tracks from our catalog. Pick a genre or
            listen to everything on shuffle.
          </p>

          {/* Genre Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedGenre
                  ? "bg-amber-500 text-black"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              All Genres
            </button>
            {genres.map((genre) => (
              <button
                key={genre.name}
                onClick={() => setSelectedGenre(genre.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedGenre === genre.name
                    ? "bg-amber-500 text-black"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {genre.name}
                <span className="ml-1.5 text-xs opacity-60">
                  {genre.trackCount}
                </span>
              </button>
            ))}
          </div>

          <Button
            onClick={handlePlayRadio}
            disabled={tracks.length === 0}
            className="gap-2"
          >
            <Play className="h-5 w-5" />
            Play Radio{selectedGenre ? ` — ${selectedGenre}` : ""}
            {tracks.length > 0 && (
              <span className="text-xs opacity-70">
                ({tracks.length} tracks)
              </span>
            )}
          </Button>
        </div>
      </section>

      <section className="py-8 border-t border-neutral-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-neutral-500 text-sm py-12 text-center">
              Loading tracks...
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">
                No tracks available{selectedGenre ? ` for "${selectedGenre}"` : ""}.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {tracks.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    <div className="w-8 text-center text-xs text-neutral-500 tabular-nums">
                      {isCurrent && isPlaying ? (
                        <div className="flex gap-0.5 items-end h-4 justify-center">
                          <div className="w-0.5 h-1 bg-amber-500 animate-pulse" />
                          <div className="w-0.5 h-2.5 bg-amber-500 animate-pulse [animation-delay:150ms]" />
                          <div className="w-0.5 h-4 bg-amber-500 animate-pulse [animation-delay:300ms]" />
                        </div>
                      ) : (
                        <span className="group-hover:hidden">{index + 1}</span>
                      )}
                      {!(isCurrent && isPlaying) && (
                        <Play className="h-4 w-4 hidden group-hover:block mx-auto text-white" />
                      )}
                    </div>

                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt=""
                        className="h-10 w-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <Music className="h-4 w-4 text-neutral-500" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isCurrent ? "text-amber-400" : "text-white"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {track.artist.name}
                      </p>
                    </div>

                    {track.genre && (
                      <span className="text-xs text-neutral-600 hidden sm:block">
                        {track.genre}
                      </span>
                    )}

                    <span className="text-xs text-neutral-500 tabular-nums">
                      {track.duration ? formatDuration(track.duration) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
