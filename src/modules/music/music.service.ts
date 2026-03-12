import { prisma } from "@/lib/prisma";
import { CreateTrackInput, UpdateTrackInput } from "./music.validations";

export async function createTrack(artistId: string, data: CreateTrackInput) {
  return prisma.track.create({
    data: {
      artistId,
      title: data.title,
      slug: data.slug,
      description: data.description,
      duration: data.duration,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      fileFormat: data.fileFormat,
      coverUrl: data.coverUrl,
      genre: data.genre,
      tags: data.tags || [],
      lyrics: data.lyrics,
      isPublished: data.isPublished ?? false,
      isDownloadable: data.isDownloadable ?? false,
      price: data.price,
      albumId: data.albumId,
    },
  });
}

export async function updateTrack(trackId: string, data: UpdateTrackInput) {
  return prisma.track.update({
    where: { id: trackId },
    data,
  });
}

export async function deleteTrack(trackId: string) {
  return prisma.track.delete({ where: { id: trackId } });
}

export async function getTrackById(trackId: string) {
  return prisma.track.findUnique({
    where: { id: trackId },
    include: { artist: { select: { id: true, name: true, slug: true } } },
  });
}

export async function listArtistTracks(artistId: string) {
  return prisma.track.findMany({
    where: { artistId },
    orderBy: { createdAt: "desc" },
    include: { album: { select: { id: true, title: true } } },
  });
}

export async function listPublicTracks(artistId: string) {
  return prisma.track.findMany({
    where: { artistId, isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { artist: { select: { id: true, name: true, slug: true } } },
  });
}

export async function incrementPlayCount(trackId: string) {
  return prisma.track.update({
    where: { id: trackId },
    data: { playCount: { increment: 1 } },
  });
}
