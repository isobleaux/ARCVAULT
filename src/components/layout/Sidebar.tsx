"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Music,
  Package,
  DollarSign,
  Settings,
  ExternalLink,
} from "lucide-react";
import { useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/music", label: "Music", icon: Music },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/earnings", label: "Earnings", icon: DollarSign },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const artistSlug = (session?.user as Record<string, unknown> | undefined)
    ?.artistSlug as string | undefined;

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-950 min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {artistSlug && (
        <div className="mt-6 pt-6 border-t border-neutral-800">
          <Link
            href={`/${artistSlug}`}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-amber-400 transition-colors px-3"
            target="_blank"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Public Profile
          </Link>
        </div>
      )}
    </aside>
  );
}
