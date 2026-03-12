import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth-options";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user as
    | {
        id: string;
        email: string;
        name: string | null;
        image: string | null;
        role: string;
        artistId: string | null;
        artistSlug: string | null;
      }
    | undefined;
}
