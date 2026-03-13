import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { artist: { select: { id: true, name: true, slug: true } } },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          artistId: user.artist?.id || null,
          artistName: user.artist?.name || null,
          artistSlug: user.artist?.slug || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.role = u.role as string;
        token.artistId = u.artistId as string | null;
        token.artistName = u.artistName as string | null;
        token.artistSlug = u.artistSlug as string | null;
      }
      if (trigger === "update" && session) {
        token.role = session.role;
        token.artistId = session.artistId;
        token.artistName = session.artistName;
        token.artistSlug = session.artistSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as Record<string, unknown>;
        u.id = token.sub;
        u.role = token.role;
        u.artistId = token.artistId;
        u.artistName = token.artistName;
        u.artistSlug = token.artistSlug;
      }
      return session;
    },
  },
};
