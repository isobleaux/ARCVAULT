import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getArtistById, updateArtist } from "@/modules/artist/artist.service";
import { updateArtistSchema } from "@/modules/artist/artist.validations";
import { z } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { artistId } = await params;
    const artist = await getArtistById(artistId);
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }
    return NextResponse.json(artist);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { artistId } = await params;
    if (user.artistId !== artistId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateArtistSchema.parse(body);
    const artist = await updateArtist(artistId, data);
    return NextResponse.json(artist);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
