import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createArtist, checkSlugAvailable, listArtists } from "@/modules/artist/artist.service";
import { createArtistSchema } from "@/modules/artist/artist.validations";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createArtistSchema.parse(body);

    const slugAvailable = await checkSlugAvailable(data.slug);
    if (!slugAvailable) {
      return NextResponse.json(
        { error: "This URL slug is already taken" },
        { status: 409 }
      );
    }

    const artist = await createArtist(user.id, data);
    return NextResponse.json(artist, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Create artist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const genre = searchParams.get("genre") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);

    const result = await listArtists({ genre, page });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
