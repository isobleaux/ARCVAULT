import { ReadableStream } from "stream/web";

export interface StorageAdapter {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
  getUrl(key: string): string;
  getStream(
    key: string,
    range?: { start: number; end: number }
  ): Promise<{ stream: ReadableStream; size: number; totalSize: number }>;
  delete(key: string): Promise<void>;
}
