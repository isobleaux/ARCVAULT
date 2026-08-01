import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <AuthForm mode="sign-in" />
      <p className="mt-6 text-center text-sm text-muted">
        No account yet?{" "}
        <Link href="/sign-up" className="font-medium text-accent underline underline-offset-4">
          Create one
        </Link>
      </p>
    </>
  );
}
