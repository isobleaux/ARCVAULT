import { prisma } from "@/lib/prisma";

export interface CreateSplitInput {
  trackId: string;
  recipientName: string;
  recipientEmail: string;
  role: string;
  percentage: number;
  isPrimary?: boolean;
}

export async function addRoyaltySplit(
  artistId: string,
  input: CreateSplitInput
) {
  // Verify the track belongs to the artist
  const track = await prisma.track.findFirst({
    where: { id: input.trackId, artistId },
  });
  if (!track) throw new Error("Track not found");

  // Check total percentage doesn't exceed 100
  const existing = await prisma.royaltySplit.aggregate({
    where: { trackId: input.trackId },
    _sum: { percentage: true },
  });
  const currentTotal = Number(existing._sum.percentage) || 0;
  if (currentTotal + input.percentage > 100) {
    throw new Error(
      `Total splits would be ${currentTotal + input.percentage}%. Cannot exceed 100%.`
    );
  }

  // Check if collaborator is a registered artist
  const collaboratorArtist = await prisma.artist.findFirst({
    where: { user: { email: input.recipientEmail } },
  });

  return prisma.royaltySplit.create({
    data: {
      trackId: input.trackId,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      role: input.role,
      percentage: input.percentage,
      isPrimary: input.isPrimary ?? false,
      artistId: collaboratorArtist?.id || null,
    },
  });
}

export async function updateRoyaltySplit(
  splitId: string,
  artistId: string,
  data: { recipientName?: string; role?: string; percentage?: number }
) {
  const split = await prisma.royaltySplit.findUnique({
    where: { id: splitId },
    include: { track: { select: { artistId: true } } },
  });
  if (!split || split.track.artistId !== artistId) {
    throw new Error("Split not found");
  }

  if (data.percentage !== undefined) {
    const existing = await prisma.royaltySplit.aggregate({
      where: { trackId: split.trackId, id: { not: splitId } },
      _sum: { percentage: true },
    });
    const otherTotal = Number(existing._sum.percentage) || 0;
    if (otherTotal + data.percentage > 100) {
      throw new Error(
        `Total splits would be ${otherTotal + data.percentage}%. Cannot exceed 100%.`
      );
    }
  }

  return prisma.royaltySplit.update({
    where: { id: splitId },
    data,
  });
}

export async function removeRoyaltySplit(splitId: string, artistId: string) {
  const split = await prisma.royaltySplit.findUnique({
    where: { id: splitId },
    include: { track: { select: { artistId: true } } },
  });
  if (!split || split.track.artistId !== artistId) {
    throw new Error("Split not found");
  }

  return prisma.royaltySplit.delete({ where: { id: splitId } });
}

export async function getTrackSplits(trackId: string) {
  return prisma.royaltySplit.findMany({
    where: { trackId },
    orderBy: [{ isPrimary: "desc" }, { percentage: "desc" }],
    include: {
      artist: { select: { id: true, name: true, slug: true, avatarUrl: true } },
    },
  });
}

export async function getArtistCollaborations(email: string) {
  return prisma.royaltySplit.findMany({
    where: { recipientEmail: email },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          coverUrl: true,
          artist: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function initializeOwnerSplit(
  trackId: string,
  artistId: string,
  artistName: string,
  artistEmail: string
) {
  const existing = await prisma.royaltySplit.findFirst({
    where: { trackId, isPrimary: true },
  });
  if (existing) return existing;

  return prisma.royaltySplit.create({
    data: {
      trackId,
      recipientName: artistName,
      recipientEmail: artistEmail,
      role: "owner",
      percentage: 100,
      isPrimary: true,
      artistId,
    },
  });
}
