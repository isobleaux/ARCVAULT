import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const genres = await prisma.track.groupBy({
      by: ["genre"],
      where: {
        isPublished: true,
        genre: { not: null },
      },
      _count: true,
      orderBy: { _count: { genre: "desc" } },
    });

    const result = genres
      .filter((g) => g.genre)
      .map((g) => ({
        name: g.genre!,
        trackCount: g._count,
      }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
