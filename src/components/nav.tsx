"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, CalendarDays, LineChart, Settings, Utensils } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/trends", label: "Trends", icon: LineChart },
  { href: "/foods", label: "Foods", icon: Utensils },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile: a bottom tab bar with the capture button raised in the middle. */
export function BottomNav() {
  const pathname = usePathname();
  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pt-1.5">
        {left.map((tab) => (
          <TabLink key={tab.href} {...tab} active={isActive(pathname, tab.href)} />
        ))}

        <div className="flex justify-center">
          <Link
            href="/add"
            aria-label="Add a meal from a photo"
            className={cn(
              "-mt-6 flex size-14 items-center justify-center rounded-2xl shadow-lg transition active:scale-95",
              isActive(pathname, "/add")
                ? "bg-accent text-accent-ink shadow-accent/20"
                : "bg-accent text-accent-ink shadow-black/30",
            )}
          >
            <Camera className="size-6" aria-hidden />
          </Link>
        </div>

        {right.map((tab) => (
          <TabLink key={tab.href} {...tab} active={isActive(pathname, tab.href)} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof CalendarDays;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[0.625rem] font-medium transition",
        active ? "text-accent" : "text-faint hover:text-muted",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </Link>
  );
}

/** Desktop: the same destinations as a persistent rail. */
export function SideNav({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
      <Link href="/today" className="mb-8 flex items-center gap-2.5 px-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-ink">
          <Camera className="size-4" aria-hidden />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">MacroSnap</span>
      </Link>

      <Link
        href="/add"
        className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition hover:brightness-105"
      >
        <Camera className="size-4" aria-hidden />
        Snap a meal
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-raised hover:text-body",
              )}
            >
              <tab.icon className="size-4.5" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <p className="px-3 text-xs text-faint">Signed in as {name}</p>
    </aside>
  );
}
