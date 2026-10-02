import { clearAdminSession, getAdminToken } from "../auth/adminSession"
import { ApiError, apiRequest } from "../lib/api"
import type { ReceiptDraft, ReceiptRecord } from "./contracts"

async function adminRequest<T>(
  path: string,
  options: Parameters<typeof apiRequest>[1] = {},
) {
  const token = getAdminToken()
  if (!token)
    throw new Error("Your administrator session expired. Sign in again.")
  try {
    return await apiRequest<T>(path, { ...options, token })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearAdminSession()
    throw error
  }
}

export async function loadReceipts() {
  const response = await adminRequest<{ receipts: ReceiptRecord[] }>(
    "/api/admin/receipts",
  )
  return response.receipts
}

export async function issueReceipt(draft: ReceiptDraft) {
  const response = await adminRequest<{ receipt: ReceiptRecord }>(
    "/api/admin/receipts",
    { method: "POST", body: { ...draft } },
  )
  return response.receipt
}

export async function deleteReceipt(id: string) {
  await adminRequest<void>(`/api/admin/receipts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
