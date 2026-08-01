import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff className="size-9 text-faint" aria-hidden />
      <div>
        <h1 className="font-display text-xl font-semibold">You&rsquo;re offline</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          MacroSnap needs a connection to read your diary and analyse photos. Your data
          is safe — reconnect and it will all be here.
        </p>
      </div>
    </main>
  );
}
