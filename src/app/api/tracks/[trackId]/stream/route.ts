import { NextResponse } from "next/server";
import { getTrackById } from "@/modules/music/music.service";
import { getStorage } from "@/modules/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    const track = await getTrackById(trackId);

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const storage = getStorage();
    const rangeHeader = req.headers.get("range");

    // Extract the storage key from the URL
    const key = track.fileUrl.replace(/^\/uploads\//, "");

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        // First get total size
        const { totalSize } = await storage.getStream(key);
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

        const { stream, size } = await storage.getStream(key, { start, end });

        return new Response(stream as unknown as ReadableStream, {
          status: 206,
          headers: {
            "Content-Type": track.fileFormat === "wav" ? "audio/wav" : "audio/mpeg",
            "Content-Length": size.toString(),
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    // No range — serve full file
    const { stream, totalSize } = await storage.getStream(key);

    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": track.fileFormat === "wav" ? "audio/wav" : "audio/mpeg",
        "Content-Length": totalSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    return NextResponse.json(
      { error: "Failed to stream track" },
      { status: 500 }
    );
  }
}
