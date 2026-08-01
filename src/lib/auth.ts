import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/sign-in", newUser: "/onboarding" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as Session["user"] & { id: string }).id = token.uid as string;
      }
      return session;
    },
  },
};

const SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

/**
 * Resolve the signed-in user's id.
 *
 * `getServerSession` is the happy path. It occasionally returns null inside
 * route handlers depending on how the request was dispatched, so we fall back
 * to decoding the session cookie directly rather than 401-ing a valid session.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const fromSession = (session?.user as { id?: string } | undefined)?.id;
  if (fromSession) return fromSession;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const jar = await cookies();
  for (const name of SESSION_COOKIES) {
    const raw = jar.get(name)?.value;
    if (!raw) continue;
    try {
      const token = await decode({ token: raw, secret });
      if (token?.uid) return token.uid as string;
    } catch {
      // Malformed or expired cookie — try the next candidate.
    }
  }
  return null;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const id = await getCurrentUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, image: true },
  });
  return user;
}

/** Throws a 401-shaped error for API routes. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new UnauthorizedError();
  return id;
}
