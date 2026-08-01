/** Longest edge we send to the model. Above this adds tokens, not accuracy. */
const MAX_EDGE = 1600;
const QUALITY = 0.85;

/**
 * Downscale a camera photo in the browser before upload.
 *
 * Phone cameras produce 4000px, 6MB files. Shrinking client-side keeps uploads
 * fast on cellular and cuts image-token cost, and 1600px is still well above
 * what portion estimation needs.
 */
export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  // GIFs would lose animation and PNG screenshots are usually already small.
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
