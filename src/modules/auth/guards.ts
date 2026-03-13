import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function requireArtist() {
  const user = await requireAuth();
  if (user.role !== "ARTIST" && user.role !== "ADMIN") {
    console.log(`[requireArtist] Redirecting to /onboarding — role is "${user.role}", expected ARTIST or ADMIN`);
    redirect("/onboarding");
  }
  if (!user.artistId) {
    console.log(`[requireArtist] Redirecting to /onboarding — artistId is null for user ${user.id}`);
    redirect("/onboarding");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
