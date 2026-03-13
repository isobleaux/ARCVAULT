import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  updateRoyaltySplit,
  removeRoyaltySplit,
} from "@/modules/royalties/royalties.service";
import { updateSplitSchema } from "@/modules/royalties/royalties.validations";
import { z } from "zod";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { splitId } = await params;
    const body = await req.json();
    const data = updateSplitSchema.parse(body);

    const split = await updateRoyaltySplit(splitId, user.artistId, data);
    return NextResponse.json(split);
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { splitId } = await params;
    await removeRoyaltySplit(splitId, user.artistId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
