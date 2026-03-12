import { NextResponse } from "next/server";
import { incrementPlayCount } from "@/modules/music/music.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    await incrementPlayCount(trackId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
