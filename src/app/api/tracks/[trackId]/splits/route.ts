import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTrackSplits, addRoyaltySplit } from "@/modules/royalties/royalties.service";
import { addSplitSchema } from "@/modules/royalties/royalties.validations";
import { z } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    const splits = await getTrackSplits(trackId);
    return NextResponse.json(splits);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId } = await params;
    const body = await req.json();
    const data = addSplitSchema.parse({ ...body, trackId });

    const split = await addRoyaltySplit(user.artistId, data);
    return NextResponse.json(split, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
