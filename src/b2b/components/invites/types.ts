import type { Invite } from "../../hooks/useInvites";

export type ParsedRow = {
  email: string;
  name?: string;
  external_id?: string;
  _status: "valid" | "invalid" | "duplicate";
  _reason?: string;
  _line?: number;
};

export type StatusFilter =
  | "all"
  | "pending"
  | "sent"
  | "claimed"
  | "submitted"
  | "failed"
  | "scheduled";

export type SortKey = "recent" | "name" | "status" | "last_sent";

export function inviteDerivedStatus(i: Invite): Exclude<StatusFilter, "all"> {
  if ((i as any).scheduled_send_at) return "scheduled";
  if (i.status === "claimed") return "claimed";
  if (i.status === "submitted") return "submitted";
  if (i.last_send_error && !i.last_sent_at) return "failed";
  if (
    i.last_send_attempt_at &&
    i.last_send_error &&
    (!i.last_sent_at || new Date(i.last_send_attempt_at) > new Date(i.last_sent_at))
  )
    return "failed";
  if (i.last_sent_at) return "sent";
  return "pending";
}
