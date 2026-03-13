"use client";

import { usePlayer, PlayerTrack } from "./PlayerContext";
import { cn } from "@/lib/utils";
import { X, Music } from "lucide-react";

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QueueDrawer({ isOpen, onClose }: QueueDrawerProps) {
  const { queue, currentTrack, isPlaying, play } = usePlayer();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80 bg-neutral-900 border-l border-neutral-800 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-sm font-semibold">Queue ({queue.length})</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-57px-80px)] p-2">
          {queue.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              Queue is empty
            </p>
          ) : (
            <div className="space-y-0.5">
              {queue.map((track: PlayerTrack, index: number) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <button
                    key={`${track.id}-${index}`}
                    onClick={() => play(track)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                      isCurrent
                        ? "bg-amber-500/10 border border-amber-500/20"
                        : "hover:bg-neutral-800/50"
                    )}
                  >
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt=""
                        className="h-8 w-8 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <Music className="h-3 w-3 text-neutral-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-medium truncate",
                          isCurrent ? "text-amber-400" : "text-white"
                        )}
                      >
                        {track.title}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {track.artistName}
                      </p>
                    </div>
                    {isCurrent && isPlaying && (
                      <div className="flex gap-0.5 items-end h-3">
                        <div className="w-0.5 h-1 bg-amber-500 animate-pulse" />
                        <div className="w-0.5 h-2 bg-amber-500 animate-pulse [animation-delay:150ms]" />
                        <div className="w-0.5 h-3 bg-amber-500 animate-pulse [animation-delay:300ms]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
