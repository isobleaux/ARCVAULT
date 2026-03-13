"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Music } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign in failed. Please try signing in.");
        setIsLoading(false);
      } else {
        // Hard navigation to ensure browser sends the fresh session cookie
        window.location.href = "/onboarding";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Music className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-neutral-400 mt-2">
            Start your journey as an artist
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Input
            id="name"
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-amber-400 hover:text-amber-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
