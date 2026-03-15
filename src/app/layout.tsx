import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArtistHub — Eight Powerful Modules. One Unified Platform.",
  description:
    "Upload music, sell digital products, collect payments, and build your artist brand — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="font-sans antialiased bg-neutral-950 text-white"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
