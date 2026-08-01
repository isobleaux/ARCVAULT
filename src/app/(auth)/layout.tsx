import Link from "next/link";
import { Camera } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-ink">
          <Camera className="size-4.5" aria-hidden />
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">MacroSnap</span>
      </Link>
      {children}
    </main>
  );
}
