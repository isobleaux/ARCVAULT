"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Music, Menu, X } from "lucide-react";
import { useState } from "react";
import { APP_NAME } from "@/lib/constants";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Music className="h-6 w-6 text-amber-500" />
            <span className="text-lg font-bold text-white">{APP_NAME}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Explore
            </Link>
            {session?.user ? (
              <>
                {(session.user as Record<string, unknown>).artistId && (
                  <Link
                    href="/dashboard"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <Avatar
                    src={session.user.image}
                    fallback={session.user.name || session.user.email || "U"}
                    size="sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          <button
            className="md:hidden text-neutral-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-950 p-4 space-y-3">
          <Link
            href="/explore"
            className="block text-sm text-neutral-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Explore
          </Link>
          {session?.user ? (
            <>
              {(session.user as Record<string, unknown>).artistId && (
                <Link
                  href="/dashboard"
                  className="block text-sm text-neutral-400 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block text-sm text-neutral-400 hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
