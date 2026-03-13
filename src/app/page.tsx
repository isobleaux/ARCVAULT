import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { APP_DESCRIPTION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { ArtistCard } from "@/components/artist/ArtistCard";
import { HeroActions } from "@/components/home/HeroActions";
import { HomeCTA } from "@/components/home/HomeCTA";
import { Music, ShoppingBag, Radio, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: Music,
    title: "Upload & Stream",
    description:
      "Share your music with the world. High-quality audio streaming with full player controls.",
  },
  {
    icon: ShoppingBag,
    title: "Sell Digital Products",
    description:
      "Sell beats, sample packs, presets, and more directly to your fans. Keep more of what you earn.",
  },
  {
    icon: Radio,
    title: "Build Your Brand",
    description:
      "Create a stunning artist profile, grow your audience, and manage everything from one dashboard.",
  },
];

export default async function HomePage() {
  const featuredArtists = await prisma.artist.findMany({
    where: { isPublished: true },
    include: { _count: { select: { tracks: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Your Music.{" "}
              <span className="text-amber-400">Your Platform.</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400 max-w-xl">
              {APP_DESCRIPTION} — Upload tracks, sell products, and connect
              with fans. Everything artists need in one place.
            </p>
            <HeroActions />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6"
              >
                <feature.icon className="h-10 w-10 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artists */}
      {featuredArtists.length > 0 && (
        <section className="py-20 border-t border-neutral-800/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Featured Artists</h2>
              <Link
                href="/explore"
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featuredArtists.map((artist: { id: string; name: string; slug: string; avatarUrl: string | null; genre: string | null; bio: string | null; _count: { tracks: number } }) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA — client component, hides for logged-in artists */}
      <HomeCTA />

      <Footer />
    </div>
  );
}
