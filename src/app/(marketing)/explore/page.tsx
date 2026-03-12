import { listArtists } from "@/modules/artist/artist.service";
import { ArtistCard } from "@/components/artist/ArtistCard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Search } from "lucide-react";

const GENRES = [
  "Hip Hop",
  "R&B",
  "Pop",
  "Electronic",
  "Rock",
  "Jazz",
  "Classical",
  "Latin",
  "Afrobeats",
  "Country",
];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; page?: string }>;
}) {
  const { genre, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);

  const { artists, total, pages } = await listArtists({
    genre,
    page: currentPage,
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Explore Artists</h1>
          <p className="text-neutral-400 mt-1">
            Discover talented artists and their music
          </p>
        </div>

        {/* Genre Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <a
            href="/explore"
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !genre
                ? "bg-amber-500 text-black font-medium"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            All
          </a>
          {GENRES.map((g) => (
            <a
              key={g}
              href={`/explore?genre=${encodeURIComponent(g)}`}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                genre === g
                  ? "bg-amber-500 text-black font-medium"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {g}
            </a>
          ))}
        </div>

        {/* Results */}
        {artists.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">
              {genre
                ? `No artists found for "${genre}"`
                : "No artists found. Check back soon!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {artists.map((artist: { id: string; name: string; slug: string; avatarUrl: string | null; genre: string | null; bio: string | null; _count: { tracks: number } }) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {currentPage > 1 && (
                  <a
                    href={`/explore?${genre ? `genre=${encodeURIComponent(genre)}&` : ""}page=${currentPage - 1}`}
                    className="px-4 py-2 rounded-lg bg-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    Previous
                  </a>
                )}
                <span className="px-4 py-2 text-sm text-neutral-500">
                  Page {currentPage} of {pages}
                </span>
                {currentPage < pages && (
                  <a
                    href={`/explore?${genre ? `genre=${encodeURIComponent(genre)}&` : ""}page=${currentPage + 1}`}
                    className="px-4 py-2 rounded-lg bg-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
