"use client";

import { usePlayer, PlayerTrack } from "@/components/player/PlayerContext";
import { formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Play, Pause, Music } from "lucide-react";

interface TrackRowProps {
  track: {
    id: string;
    title: string;
    duration?: number | null;
    coverUrl?: string | null;
    genre?: string | null;
    playCount: number;
    isPublished: boolean;
  };
  artistName: string;
  artistSlug: string;
  showControls?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePublish?: () => void;
}

export function TrackRow({
  track,
  artistName,
  artistSlug,
  showControls,
  onEdit,
  onDelete,
  onTogglePublish,
}: TrackRowProps) {
  const { currentTrack, isPlaying, play, pause, resume } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;

  const playerTrack: PlayerTrack = {
    id: track.id,
    title: track.title,
    artistName,
    artistSlug,
    coverUrl: track.coverUrl,
    duration: track.duration,
  };

  function handlePlayClick() {
    if (isCurrentTrack && isPlaying) {
      pause();
    } else if (isCurrentTrack) {
      resume();
    } else {
      play(playerTrack);
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors group">
      <button
        onClick={handlePlayClick}
        className="h-10 w-10 rounded flex-shrink-0 flex items-center justify-center bg-neutral-800 group-hover:bg-amber-500 transition-colors"
      >
        {isCurrentTrack && isPlaying ? (
          <Pause className="h-4 w-4 text-white group-hover:text-black" />
        ) : (
          <Play className="h-4 w-4 text-white group-hover:text-black ml-0.5" />
        )}
      </button>

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
            isCurrentTrack ? "text-amber-400" : "text-white"
          }`}
        >
          {track.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {track.genre && <span>{track.genre}</span>}
          <span>{track.playCount} plays</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showControls && (
          <>
            <Badge variant={track.isPublished ? "success" : "default"}>
              {track.isPublished ? "Published" : "Draft"}
            </Badge>
            {onTogglePublish && (
              <button
                onClick={onTogglePublish}
                className="text-xs text-neutral-500 hover:text-white transition-colors"
              >
                {track.isPublished ? "Unpublish" : "Publish"}
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-neutral-500 hover:text-white transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            )}
          </>
        )}
        {track.duration && (
          <span className="text-xs text-neutral-500 tabular-nums">
            {formatDuration(track.duration)}
          </span>
        )}
      </div>
    </div>
  );
}
