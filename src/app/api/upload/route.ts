import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/modules/storage";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_AUDIO_SIZE,
  MAX_IMAGE_SIZE,
} from "@/lib/constants";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "audio" or "image"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const acceptedTypes =
      type === "audio" ? ACCEPTED_AUDIO_TYPES : ACCEPTED_IMAGE_TYPES;
    const maxSize = type === "audio" ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;

    // Infer MIME from extension if browser/client sends generic type
    const EXT_TO_MIME: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      flac: "audio/flac",
      aac: "audio/aac",
      ogg: "audio/ogg",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType =
      file.type && file.type !== "application/octet-stream"
        ? file.type
        : EXT_TO_MIME[ext] || file.type;

    if (!acceptedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid file type: ${mimeType}` },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split(".").pop() || "bin";
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const key = `${type || "misc"}/${user.id}/${uniqueId}.${fileExt}`;

    const storage = getStorage();
    const url = await storage.upload(buffer, key, mimeType);

    return NextResponse.json({ url, key, size: file.size });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
