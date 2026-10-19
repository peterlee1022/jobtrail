import { formatDistanceStrict } from "date-fns";

const compact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
});

export function formatSalary(min: number | null, max: number | null) {
  if (min && max) return `${compact.format(min)} - ${compact.format(max)}`;
  if (min) return `${compact.format(min)}+`;
  if (max) return `up to ${compact.format(max)}`;
  return null;
}

// Takes `now` explicitly so server and client render the same string
export function timeAgo(date: Date, now: Date) {
  if (now.getTime() - date.getTime() < 60_000) return "just now";
  return `${formatDistanceStrict(date, now)} ago`;
}
