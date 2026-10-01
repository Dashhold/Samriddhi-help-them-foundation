import { requireSupabase } from "../lib/supabase";

const BUCKET = "cms-media";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

function safeExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;
  if (file.type === "application/pdf") return "pdf";
  return file.type.split("/")[1]?.replace("jpeg", "jpg") || "bin";
}

export async function uploadCmsAsset(file: File, folder: string) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Choose a PNG, JPEG, WebP, GIF or PDF file.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("The selected file is larger than the 10 MB upload limit.");
  }

  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw new Error("Your admin session expired. Sign in again.");

  const normalizedFolder = folder.toLowerCase().replace(/[^a-z0-9/_-]/g, "-");
  const objectName = `${Date.now()}-${crypto.randomUUID()}.${safeExtension(file)}`;
  const objectPath = `${userData.user.id}/${normalizedFolder}/${objectName}`;
  const { error } = await client.storage.from(BUCKET).upload(objectPath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = client.storage.from(BUCKET).getPublicUrl(objectPath);
  return {
    url: data.publicUrl,
    path: objectPath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}
