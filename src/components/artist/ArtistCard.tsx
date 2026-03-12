import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Music } from "lucide-react";

interface ArtistCardProps {
  artist: {
    name: string;
    slug: string;
    avatarUrl?: string | null;
    genre?: string | null;
    bio?: string | null;
    _count?: { tracks: number };
  };
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/${artist.slug}`}
      className="group block rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 hover:border-neutral-700 hover:bg-neutral-900 transition-all"
    >
      <div className="flex flex-col items-center text-center">
        <Avatar
          src={artist.avatarUrl}
          fallback={artist.name}
          size="lg"
        />
        <h3 className="mt-3 font-semibold text-white group-hover:text-amber-400 transition-colors">
          {artist.name}
        </h3>
        {artist.genre && (
          <Badge variant="default" className="mt-1.5">
            {artist.genre}
          </Badge>
        )}
        {artist.bio && (
          <p className="mt-2 text-xs text-neutral-500 line-clamp-2">
            {artist.bio}
          </p>
        )}
        {artist._count && (
          <div className="mt-3 flex items-center gap-1 text-xs text-neutral-600">
            <Music className="h-3 w-3" />
            {artist._count.tracks} tracks
          </div>
        )}
      </div>
    </Link>
  );
}
