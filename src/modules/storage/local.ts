import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function uploadDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./public/uploads");
}

export interface StoredFile {
  /** Path the browser can load, e.g. `/uploads/ab12.jpg`. */
  url: string;
  sizeBytes: number;
}

/**
 * Persist a meal photo to disk.
 *
 * Local disk is the default because it needs no configuration. Swapping in S3
 * or R2 means replacing this one function — nothing else touches the
 * filesystem.
 */
export async function storeImage(
  userId: string,
  data: Buffer,
  mimeType: string,
): Promise<StoredFile> {
  const extension = EXTENSIONS[mimeType] ?? "bin";
  // userId is a cuid and the name is generated, so neither can traverse.
  const relative = path.posix.join(userId, `${randomUUID()}.${extension}`);
  const target = path.join(uploadDir(), relative);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);

  return { url: `/uploads/${relative}`, sizeBytes: data.byteLength };
}
