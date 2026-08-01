import { Loader2 } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:brightness-105 active:brightness-95 disabled:bg-accent/40",
  secondary:
    "bg-raised text-body border border-line hover:border-muted/50 hover:bg-raised/70",
  ghost: "text-muted hover:text-body hover:bg-raised/60",
  danger: "bg-danger/12 text-danger border border-danger/25 hover:bg-danger/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-xl",
  md: "h-11 px-4 text-[0.9375rem] gap-2 rounded-2xl",
  lg: "h-13 px-5 text-base gap-2 rounded-2xl",
};

const BASE =
  "inline-flex select-none items-center justify-center font-medium transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  full = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(BASE, VARIANTS[variant], SIZES[size], full && "w-full", className)}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  full = false,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={cn(BASE, VARIANTS[variant], SIZES[size], full && "w-full", className)}
    />
  );
}
