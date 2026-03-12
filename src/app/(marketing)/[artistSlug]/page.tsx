import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtistBySlug } from "@/modules/artist/artist.service";
import { listPublicTracks } from "@/modules/music/music.service";
import { listPublicProducts } from "@/modules/products/products.service";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  MapPin,
  Globe,
  Music,
  Package,
  Play,
} from "lucide-react";
import { ArtistTrackList } from "./ArtistTrackList";

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ artistSlug: string }>;
}) {
  const { artistSlug } = await params;
  const artist = await getArtistBySlug(artistSlug);

  if (!artist || !artist.isPublished) {
    notFound();
  }

  const [tracks, products] = await Promise.all([
    listPublicTracks(artist.id),
    listPublicProducts(artist.id),
  ]);

  const socials = (artist.socialLinks as Record<string, string>) || {};

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-amber-900/30 to-neutral-900">
        {artist.bannerUrl && (
          <img
            src={artist.bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-16 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-8">
          <Avatar
            src={artist.avatarUrl}
            fallback={artist.name}
            size="lg"
            className="h-32 w-32 border-4 border-neutral-950 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{artist.name}</h1>
              {artist.isVerified && (
                <Badge variant="success">Verified</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-400">
              {artist.genre && <span>{artist.genre}</span>}
              {artist.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {artist.location}
                </span>
              )}
              {artist.websiteUrl && (
                <a
                  href={artist.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                >
                  <Globe className="h-3 w-3" />
                  Website
                </a>
              )}
            </div>
            {/* Social Links */}
            {Object.keys(socials).length > 0 && (
              <div className="flex gap-3 mt-2 text-xs text-neutral-500">
                {socials.twitter && <span>Twitter: {socials.twitter}</span>}
                {socials.instagram && (
                  <span>Instagram: {socials.instagram}</span>
                )}
                {socials.spotify && <span>Spotify</span>}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="text-neutral-400 text-sm mb-8 max-w-2xl">
            {artist.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-6 mb-8 text-sm">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Music className="h-4 w-4" />
            <span className="font-medium text-white">
              {artist._count.tracks}
            </span>{" "}
            tracks
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Package className="h-4 w-4" />
            <span className="font-medium text-white">
              {artist._count.products}
            </span>{" "}
            products
          </div>
        </div>

        {/* Tracks */}
        {tracks.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Tracks</h2>
            <ArtistTrackList tracks={tracks} artistName={artist.name} artistSlug={artist.slug} />
          </section>
        )}

        {/* Products */}
        {products.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Store</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: { id: string; slug: string; name: string; thumbnailUrl: string | null; productType: string; price: unknown; description: string | null }) => (
                <Link key={product.id} href={`/${artist.slug}/products/${product.slug}`}>
                <Card className="hover:border-neutral-700 transition-colors">
                  <CardContent>
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-40 bg-neutral-800 rounded-lg mb-3 flex items-center justify-center">
                        <Package className="h-8 w-8 text-neutral-600" />
                      </div>
                    )}
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="default">{product.productType}</Badge>
                      <span className="text-sm font-semibold text-amber-400">
                        {formatCurrency(Number(product.price))}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-neutral-500 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {tracks.length === 0 && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500">
              This artist hasn&apos;t published any content yet.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
