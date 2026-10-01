import { clearAdminSession, getAdminToken } from "../auth/adminSession"
import { ApiError, apiRequest } from "../lib/api"

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
])

type AssetResponse = {
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

export async function uploadCmsAsset(file: File, folder: string) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Choose a PNG, JPEG, WebP, GIF or PDF file.")
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("The selected file is larger than the 10 MB upload limit.")
  }
  const token = getAdminToken()
  if (!token)
    throw new Error("Your administrator session expired. Sign in again.")
  const body = new FormData()
  body.set("file", file, file.name)
  body.set("folder", folder)
  try {
    const asset = await apiRequest<AssetResponse>("/api/admin/assets", {
      method: "POST",
      token,
      body,
      timeoutMs: 30_000,
    })
    return {
      url: asset.url,
      path: asset.id,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearAdminSession()
    throw error
  }
}
