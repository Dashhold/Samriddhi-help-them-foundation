import { clearAdminSession, getAdminToken } from "../auth/adminSession"
import { ApiError, apiRequest } from "../lib/api"
import type {
  AdminMember,
  MemberStatus,
  MemberUpdate,
  PublicMember,
} from "./contracts"

export type JoinResponse = {
  id: string
  status: "pending"
  reference: string
}

/** Sends the application as JSON plus the photo; the JSON part must come first. */
export async function submitJoinApplication(
  application: Record<string, unknown>,
  photo: Blob,
  photoName: string,
) {
  const body = new FormData()
  body.set("data", JSON.stringify(application))
  body.set("photo", photo, photoName)
  return apiRequest<JoinResponse>("/api/join", {
    method: "POST",
    body,
    timeoutMs: 45_000,
  })
}

export async function loadTeam() {
  const response = await apiRequest<{ members: PublicMember[] }>("/api/team")
  return response.members
}

export async function loadTeamMember(code: string) {
  const response = await apiRequest<{ member: PublicMember }>(
    `/api/team/${encodeURIComponent(code)}`,
  )
  return response.member
}

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

export async function loadMembers(status: MemberStatus | "all" = "all") {
  const response = await adminRequest<{ members: AdminMember[] }>(
    `/api/admin/members?status=${status}`,
  )
  return response.members
}

export async function updateMember(id: string, update: MemberUpdate) {
  const response = await adminRequest<{ member: AdminMember }>(
    `/api/admin/members/${encodeURIComponent(id)}`,
    { method: "PUT", body: { ...update } },
  )
  return response.member
}

export async function deleteMember(id: string) {
  await adminRequest<void>(`/api/admin/members/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
