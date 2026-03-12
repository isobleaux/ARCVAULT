"use client";

import { TrackRow } from "@/components/music/TrackRow";

interface Track {
  id: string;
  title: string;
  duration: number | null;
  coverUrl: string | null;
  genre: string | null;
  playCount: number;
  isPublished: boolean;
}

interface ArtistTrackListProps {
  tracks: Track[];
  artistName: string;
  artistSlug: string;
}

export function ArtistTrackList({
  tracks,
  artistName,
  artistSlug,
}: ArtistTrackListProps) {
  return (
    <div className="space-y-1">
      {tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          artistName={artistName}
          artistSlug={artistSlug}
        />
      ))}
    </div>
  );
}
