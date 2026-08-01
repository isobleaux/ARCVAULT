import { fail, ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeImage } from "@/modules/storage/local";
import {
  MAX_IMAGE_BYTES,
  analyzeMealPhoto,
  hasApiKey,
  isSupportedMimeType,
} from "@/modules/vision/analyze";
import { totalsFor } from "@/modules/vision/schema";

/** Photo analysis is a slow model call — keep it off the edge runtime. */
export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = route(async (request: Request) => {
  const userId = await requireUserId();

  if (!hasApiKey()) {
    return fail(
      "Photo analysis is not configured. Add ANTHROPIC_API_KEY to your environment, or log this meal by hand.",
      503,
      { reason: "no_api_key" },
    );
  }

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return fail("No photo was attached.", 400);
  }
  if (!isSupportedMimeType(file.type)) {
    return fail("Use a JPEG, PNG, WebP or GIF image.", 415);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fail("That photo is too large. Try one under 4MB.", 413);
  }

  const data = Buffer.from(await file.arrayBuffer());
  const stored = await storeImage(userId, data, file.type);

  const photo = await prisma.mealPhoto.create({
    data: {
      userId,
      url: stored.url,
      mimeType: file.type,
      sizeBytes: stored.sizeBytes,
      status: "PENDING",
    },
  });

  const hint = typeof form.get("hint") === "string" ? String(form.get("hint")) : undefined;
  const localTime =
    typeof form.get("localTime") === "string" ? String(form.get("localTime")) : undefined;

  const result = await analyzeMealPhoto({
    data,
    mimeType: file.type,
    hint,
    localTime,
  });

  if (!result.ok) {
    await prisma.mealPhoto.update({
      where: { id: photo.id },
      data: { status: "FAILED", errorReason: result.message },
    });
    const status = result.reason === "no_api_key" ? 503 : 502;
    return fail(result.message, status, { reason: result.reason, photoId: photo.id });
  }

  await prisma.mealPhoto.update({
    where: { id: photo.id },
    data: {
      status: "ANALYZED",
      model: result.model,
      analysis: JSON.parse(JSON.stringify(result.analysis)),
    },
  });

  return ok({
    photoId: photo.id,
    photoUrl: stored.url,
    model: result.model,
    analysis: result.analysis,
    totals: totalsFor(result.analysis.items),
  });
});
