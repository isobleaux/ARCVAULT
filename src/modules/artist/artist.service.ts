import { prisma } from "@/lib/prisma";
import { CreateArtistInput, UpdateArtistInput } from "./artist.validations";

export async function createArtist(userId: string, data: CreateArtistInput) {
  const artist = await prisma.artist.create({
    data: {
      userId,
      name: data.name,
      slug: data.slug,
      bio: data.bio,
      genre: data.genre,
      location: data.location,
    },
  });

  // Upgrade user role to ARTIST
  await prisma.user.update({
    where: { id: userId },
    data: { role: "ARTIST" },
  });

  return artist;
}

export async function updateArtist(artistId: string, data: UpdateArtistInput) {
  return prisma.artist.update({
    where: { id: artistId },
    data,
  });
}

export async function getArtistBySlug(slug: string) {
  return prisma.artist.findUnique({
    where: { slug },
    include: {
      user: { select: { email: true, name: true, image: true } },
      _count: { select: { tracks: true, products: true, albums: true } },
    },
  });
}

export async function getArtistById(artistId: string) {
  return prisma.artist.findUnique({
    where: { id: artistId },
    include: {
      user: { select: { email: true, name: true, image: true } },
    },
  });
}

export async function getArtistByUserId(userId: string) {
  return prisma.artist.findUnique({
    where: { userId },
  });
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const existing = await prisma.artist.findUnique({ where: { slug } });
  return !existing;
}

export async function listArtists({
  genre,
  page = 1,
  limit = 20,
}: {
  genre?: string;
  page?: number;
  limit?: number;
}) {
  const where = {
    isPublished: true,
    ...(genre ? { genre } : {}),
  };

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({
      where,
      include: {
        _count: { select: { tracks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.artist.count({ where }),
  ]);

  return { artists, total, pages: Math.ceil(total / limit) };
}
