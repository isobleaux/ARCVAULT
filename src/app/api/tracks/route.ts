import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createTrack, listArtistTracks } from "@/modules/music/music.service";
import { createTrackSchema } from "@/modules/music/music.validations";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createTrackSchema.parse(body);
    const track = await createTrack(user.artistId, data);
    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Create track error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tracks = await listArtistTracks(user.artistId);
    return NextResponse.json(tracks);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
