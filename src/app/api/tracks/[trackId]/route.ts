import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTrackById,
  updateTrack,
  deleteTrack,
} from "@/modules/music/music.service";
import { updateTrackSchema } from "@/modules/music/music.validations";
import { z } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    const track = await getTrackById(trackId);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    return NextResponse.json(track);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId } = await params;
    const existing = await getTrackById(trackId);
    if (!existing || existing.artistId !== user.artistId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateTrackSchema.parse(body);
    const track = await updateTrack(trackId, data);
    return NextResponse.json(track);
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId } = await params;
    const existing = await getTrackById(trackId);
    if (!existing || existing.artistId !== user.artistId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await deleteTrack(trackId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
