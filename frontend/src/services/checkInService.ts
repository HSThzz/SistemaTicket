import { api } from "./api";

export interface CheckInResult {
  owner_name: string;
  owner_document: string;
  checked_in_at: string;
  ticket_id: string;
  event_title: string;
}

export async function checkInTicket(uniqueCode: string): Promise<CheckInResult> {
  const { data } = await api.post<CheckInResult>("/tickets/check-in", {
    unique_code: uniqueCode.trim(),
  });
  return data;
}
