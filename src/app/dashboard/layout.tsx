import { requireArtist } from "@/modules/auth/guards";
import { DashboardShell } from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArtist();

  return <DashboardShell>{children}</DashboardShell>;
}
