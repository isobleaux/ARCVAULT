import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import { authOptions } from "@/modules/auth/auth-options";

export async function getSession() {
  return getServerSession(authOptions);
}

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  artistId: string | null;
  artistSlug: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | undefined> {
  // Try getServerSession first
  const session = await getSession();
  if (session?.user && (session.user as Record<string, unknown>).id) {
    return session.user as CurrentUser;
  }

  // Fallback: decode JWT directly from cookies
  // This handles cases where getServerSession fails in App Router route handlers
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const token = await getToken({
      req: {
        headers: Object.fromEntries(headerStore.entries()),
        cookies: Object.fromEntries(
          cookieStore.getAll().map((c) => [c.name, c.value])
        ),
      } as Parameters<typeof getToken>[0]["req"],
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token?.sub) {
      return {
        id: token.sub,
        email: token.email as string,
        name: (token.name as string) || null,
        image: (token.picture as string) || null,
        role: (token.role as string) || "FAN",
        artistId: (token.artistId as string) || null,
        artistSlug: (token.artistSlug as string) || null,
      };
    }
  } catch (e) {
    console.error("getToken fallback failed:", e);
  }

  return undefined;
}
