import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const genre = searchParams.get("genre");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: Record<string, unknown> = { isPublished: true };
    if (genre) {
      where.genre = genre;
    }

    // Get random published tracks for radio
    const totalCount = await prisma.track.count({ where });
    if (totalCount === 0) {
      return NextResponse.json([]);
    }

    // Fetch tracks with a random-ish ordering
    const tracks = await prisma.track.findMany({
      where,
      take: limit,
      orderBy: { playCount: "desc" },
      include: {
        artist: {
          select: { id: true, name: true, slug: true, avatarUrl: true },
        },
      },
    });

    // Shuffle the results for variety
    const shuffled = tracks.sort(() => Math.random() - 0.5);

    return NextResponse.json(shuffled);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
