"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const signUp = mode === "sign-up";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);

    try {
      if (signUp) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!response.ok) throw new Error((await response.json()).error);
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("That email and password did not match.");
        return;
      }

      router.push(signUp ? "/onboarding" : "/today");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold">
          {signUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {signUp
            ? "Two minutes of setup and you can start snapping meals."
            : "Pick up where you left off."}
        </p>
      </div>

      {signUp && (
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />
      )}

      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />

      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete={signUp ? "new-password" : "current-password"}
        hint={signUp ? "At least 8 characters" : undefined}
        minLength={signUp ? 8 : undefined}
        required
      />

      <Button type="submit" size="lg" full loading={busy}>
        {signUp ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
