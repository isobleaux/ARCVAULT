import { StorageAdapter } from "./storage.interface";
import { ReadableStream } from "stream/web";
import fs from "fs/promises";
import { createReadStream, statSync } from "fs";
import path from "path";
import { Readable } from "stream";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export class LocalStorageAdapter implements StorageAdapter {
  async upload(file: Buffer, key: string, _contentType: string): Promise<string> {
    const filePath = path.join(UPLOAD_DIR, key);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, file);
    return `/uploads/${key}`;
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }

  async getStream(
    key: string,
    range?: { start: number; end: number }
  ): Promise<{ stream: ReadableStream; size: number; totalSize: number }> {
    const filePath = path.join(UPLOAD_DIR, key);
    const stat = statSync(filePath);
    const totalSize = stat.size;

    const options = range
      ? { start: range.start, end: range.end }
      : undefined;

    const nodeStream = createReadStream(filePath, options);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    const size = range ? range.end - range.start + 1 : totalSize;

    return { stream: webStream, size, totalSize };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, key);
    await fs.unlink(filePath).catch(() => {});
  }
}
