import { StorageAdapter } from "./storage.interface";
import { LocalStorageAdapter } from "./local.adapter";

let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (storageInstance) return storageInstance;

  const provider = process.env.STORAGE_PROVIDER || "local";

  switch (provider) {
    case "s3":
      throw new Error(
        "S3 storage adapter not yet implemented. Set STORAGE_PROVIDER=local or implement S3Adapter."
      );
    case "local":
    default:
      storageInstance = new LocalStorageAdapter();
      return storageInstance;
  }
}
