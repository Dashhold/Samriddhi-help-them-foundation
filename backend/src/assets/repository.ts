import { createHash } from "node:crypto";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";

export const MAX_ASSET_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ASSET_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export function safeAssetFilename(originalFilename: string, mimeType: string) {
  const withoutPath = originalFilename.replace(/\\/g, "/").split("/").pop() ?? "asset";
  const base = withoutPath.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 180) || "asset";
  return `${base}.${extensionByMime[mimeType] ?? "bin"}`;
}

export function hasValidSignature(mimeType: string, bytes: Buffer) {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "image/gif") return ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"));
  if (mimeType === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  return false;
}

type AssetRow = {
  id: string;
  original_filename: string;
  safe_filename: string;
  mime_type: string;
  byte_size: number;
  sha256: string;
  data: Buffer;
};

export async function insertAsset(
  sql: Database,
  // adminId is null for public uploads, such as photos sent with a join-us application.
  input: { originalFilename: string; mimeType: string; bytes: Buffer; adminId: string | null },
) {
  if (!ALLOWED_ASSET_TYPES.has(input.mimeType)) {
    throw new AppError(400, "BAD_REQUEST", "Choose a PNG, JPEG, WebP, GIF or PDF file.");
  }
  if (input.bytes.length === 0 || input.bytes.length > MAX_ASSET_BYTES) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "The selected file is larger than the 10 MB upload limit.");
  }
  if (!hasValidSignature(input.mimeType, input.bytes)) {
    throw new AppError(400, "BAD_REQUEST", "The uploaded file does not match its declared file type.");
  }
  const originalFilename = input.originalFilename.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 255) || "asset";
  const safeFilename = safeAssetFilename(originalFilename, input.mimeType);
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  const rows = await sql<AssetRow[]>`
    INSERT INTO cms_assets (
      original_filename, safe_filename, mime_type, byte_size, sha256, data, uploaded_by
    ) VALUES (
      ${originalFilename}, ${safeFilename}, ${input.mimeType}, ${input.bytes.length},
      ${sha256}, ${input.bytes}, ${input.adminId}
    )
    RETURNING id, original_filename, safe_filename, mime_type, byte_size, sha256, data
  `;
  const asset = rows[0];
  if (!asset) throw new AppError(500, "INTERNAL_ERROR", "The file could not be stored.");
  return asset;
}

export async function getAsset(sql: Database, id: string) {
  const rows = await sql<AssetRow[]>`
    SELECT id, original_filename, safe_filename, mime_type, byte_size, sha256, data
    FROM cms_assets WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ?? null;
}
