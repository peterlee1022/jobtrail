export const STATUSES = [
  "wishlist",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

// How far along the pipeline a status is. Rejected sits outside the
// progression, so it gets -1 and we look at history to see how far an
// application made it before being turned down.
export const STAGE_RANK: Record<Status, number> = {
  wishlist: 0,
  applied: 1,
  screening: 2,
  interviewing: 3,
  offer: 4,
  rejected: -1,
};

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}
