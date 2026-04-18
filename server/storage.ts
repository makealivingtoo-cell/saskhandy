import { v2 as cloudinary } from "cloudinary";

type StorageConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function getStorageConfig(): StorageConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET"
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function ensureConfigured() {
  const { cloudName, apiKey, apiSecret } = getStorageConfig();

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function getPublicIdFromKey(key: string): string {
  return normalizeKey(key).replace(/\.[^/.]+$/, "");
}

function getResourceType(contentType: string): "image" | "raw" | "video" | "auto" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return "raw";
}

function toDataUri(data: Buffer | Uint8Array | string, contentType: string) {
  const buffer =
    typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  ensureConfigured();

  const key = normalizeKey(relKey);
  const publicId = getPublicIdFromKey(key);
  const resourceType = getResourceType(contentType);
  const dataUri = toDataUri(data, contentType);

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    resource_type: resourceType,
    overwrite: true,
    invalidate: true,
    use_filename: false,
    unique_filename: false,
    folder: undefined,
  });

  if (!result.secure_url) {
    throw new Error("Cloudinary upload response missing secure_url");
  }

  return {
    key,
    url: result.secure_url,
  };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  ensureConfigured();

  const key = normalizeKey(relKey);
  const publicId = getPublicIdFromKey(key);

  const url = cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
  });

  return { key, url };
}