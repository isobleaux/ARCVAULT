import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  artistId: string | null;
  artistSlug: string | null;
};

/**
 * Decode the NextAuth JWT directly from cookies.
 * getServerSession from next-auth v4 is broken on Next.js 16 (async cookies/headers),
 * so we bypass it entirely and read the JWT cookie ourselves.
 */
export async function getCurrentUser(): Promise<CurrentUser | undefined> {
  try {
    const cookieStore = await cookies();

    // next-auth uses different cookie names depending on whether HTTPS is active
    const tokenStr =
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (!tokenStr) return undefined;

    const token = await decode({
      token: tokenStr,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.sub) return undefined;

    return {
      id: token.sub,
      email: token.email as string,
      name: (token.name as string) || null,
      image: (token.picture as string) || null,
      role: (token.role as string) || "FAN",
      artistId: (token.artistId as string) || null,
      artistSlug: (token.artistSlug as string) || null,
    };
  } catch (e) {
    console.error("getCurrentUser failed:", e);
    return undefined;
  }
}
