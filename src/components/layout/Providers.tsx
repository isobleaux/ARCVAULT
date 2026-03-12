"use client";

import { SessionProvider } from "next-auth/react";
import { PlayerProvider } from "@/components/player/PlayerContext";
import { PlayerBar } from "@/components/player/PlayerBar";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        {children}
        <PlayerBar />
      </PlayerProvider>
    </SessionProvider>
  );
}
