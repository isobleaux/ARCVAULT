"use client";

import { useState } from "react";
import { usePlayer } from "./PlayerContext";
import { QueueDrawer } from "./QueueDrawer";
import { formatDuration } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
} from "lucide-react";

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    shuffleMode,
    repeatMode,
    pause,
    resume,
    seek,
    setVolume,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const [queueOpen, setQueueOpen] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      <QueueDrawer isOpen={queueOpen} onClose={() => setQueueOpen(false)} />

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
        {/* Progress bar - clickable */}
        <div
          className="h-1 w-full bg-neutral-800 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            seek(percent * duration);
          }}
        >
          <div
            className="h-full bg-amber-500 transition-all group-hover:bg-amber-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Track info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-neutral-800 flex items-center justify-center">
                  <Play className="h-4 w-4 text-neutral-500" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-neutral-400 truncate">
                  {currentTrack.artistName}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleShuffle}
                className={`hidden sm:block p-1.5 transition-colors ${
                  shuffleMode
                    ? "text-amber-400"
                    : "text-neutral-500 hover:text-white"
                }`}
                title={shuffleMode ? "Shuffle on" : "Shuffle off"}
              >
                <Shuffle className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={previous}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={isPlaying ? pause : resume}
                className="h-9 w-9 rounded-full bg-white flex items-center justify-center hover:bg-neutral-200 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-black" />
                ) : (
                  <Play className="h-4 w-4 text-black ml-0.5" />
                )}
              </button>
              <button
                onClick={next}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <button
                onClick={cycleRepeat}
                className={`hidden sm:block p-1.5 transition-colors ${
                  repeatMode !== "off"
                    ? "text-amber-400"
                    : "text-neutral-500 hover:text-white"
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="h-3.5 w-3.5" />
                ) : (
                  <Repeat className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Time, Volume & Queue */}
            <div className="hidden sm:flex items-center gap-3 flex-1 justify-end">
              <span className="text-xs text-neutral-500 tabular-nums">
                {formatDuration(Math.floor(progress))} /{" "}
                {formatDuration(Math.floor(duration))}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 accent-amber-500"
                />
              </div>
              <button
                onClick={() => setQueueOpen(!queueOpen)}
                className={`p-1.5 transition-colors ${
                  queueOpen
                    ? "text-amber-400"
                    : "text-neutral-500 hover:text-white"
                }`}
                title="Queue"
              >
                <ListMusic className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
