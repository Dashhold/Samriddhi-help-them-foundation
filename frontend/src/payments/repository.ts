import { clearAdminSession, getAdminToken } from "../auth/adminSession"
import { ApiError, apiRequest } from "../lib/api"
import { DonationRecord } from "./contracts"

export async function loadDonationRecords(
  period: "monthly" | "yearly",
  value: string,
) {
  const token = getAdminToken()
  if (!token)
    throw new Error("Your administrator session expired. Sign in again.")
  const query = new URLSearchParams({ period, value })
  try {
    const response = await apiRequest<{ records: DonationRecord[] }>(
      `/api/admin/donations?${query}`,
      { token },
    )
    return response.records
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearAdminSession()
    throw error
  }
}
