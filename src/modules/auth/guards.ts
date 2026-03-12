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
    redirect("/onboarding");
  }
  if (!user.artistId) {
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
