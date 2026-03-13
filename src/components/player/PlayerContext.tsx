"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export interface PlayerTrack {
  id: string;
  title: string;
  artistName: string;
  artistSlug: string;
  coverUrl?: string | null;
  duration?: number | null;
}

export type RepeatMode = "off" | "all" | "one";

interface PlayerContextType {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: PlayerTrack[];
  shuffleMode: boolean;
  repeatMode: RepeatMode;
  play: (track: PlayerTrack) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  queue: [],
  shuffleMode: false,
  repeatMode: "off",
  play: () => {},
  pause: () => {},
  resume: () => {},
  seek: () => {},
  setVolume: () => {},
  playQueue: () => {},
  next: () => {},
  previous: () => {},
  toggleShuffle: () => {},
  cycleRepeat: () => {},
});

export function usePlayer() {
  return useContext(PlayerContext);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.8;
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);

      // Repeat one: replay current track
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
        return;
      }

      // Determine next index
      let nextIdx: number;
      if (shuffleMode) {
        if (queue.length <= 1) {
          nextIdx = 0;
        } else {
          do {
            nextIdx = Math.floor(Math.random() * queue.length);
          } while (nextIdx === queueIndex && queue.length > 1);
        }
      } else {
        nextIdx = queueIndex + 1;
      }

      if (nextIdx < queue.length) {
        setQueueIndex(nextIdx);
        loadAndPlay(queue[nextIdx]);
      } else if (repeatMode === "all" && queue.length > 0) {
        setQueueIndex(0);
        loadAndPlay(queue[0]);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [queue, queueIndex, shuffleMode, repeatMode]);

  const loadAndPlay = useCallback(
    (track: PlayerTrack) => {
      const audio = audioRef.current!;
      audio.src = `/api/tracks/${track.id}/stream`;
      audio.play();
      setCurrentTrack(track);
      setIsPlaying(true);
      reportedRef.current = false;

      setTimeout(() => {
        if (!reportedRef.current) {
          reportedRef.current = true;
          fetch(`/api/tracks/${track.id}/plays`, { method: "POST" }).catch(
            () => {}
          );
        }
      }, 3000);
    },
    []
  );

  const play = useCallback(
    (track: PlayerTrack) => {
      setQueue([track]);
      setQueueIndex(0);
      loadAndPlay(track);
    },
    [loadAndPlay]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setVolumeState(vol);
  }, []);

  const playQueue = useCallback(
    (tracks: PlayerTrack[], startIndex = 0) => {
      setQueue(tracks);
      setQueueIndex(startIndex);
      if (tracks[startIndex]) {
        loadAndPlay(tracks[startIndex]);
      }
    },
    [loadAndPlay]
  );

  const next = useCallback(() => {
    if (shuffleMode) {
      if (queue.length <= 1) return;
      let nextIdx: number;
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === queueIndex && queue.length > 1);
      setQueueIndex(nextIdx);
      loadAndPlay(queue[nextIdx]);
    } else if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      loadAndPlay(queue[nextIdx]);
    } else if (repeatMode === "all" && queue.length > 0) {
      setQueueIndex(0);
      loadAndPlay(queue[0]);
    }
  }, [queue, queueIndex, loadAndPlay, shuffleMode, repeatMode]);

  const previous = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      loadAndPlay(queue[prevIdx]);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [queue, queueIndex, loadAndPlay]);

  const toggleShuffle = useCallback(() => {
    setShuffleMode((prev) => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        queue,
        shuffleMode,
        repeatMode,
        play,
        pause,
        resume,
        seek,
        setVolume,
        playQueue,
        next,
        previous,
        toggleShuffle,
        cycleRepeat,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
