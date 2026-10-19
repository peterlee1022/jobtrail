import clsx from "clsx";
import type { Status } from "@/lib/statuses";

export const STATUS_DOT: Record<Status, string> = {
  wishlist: "bg-stone-400",
  applied: "bg-blue-500",
  screening: "bg-violet-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-500",
};

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx("inline-block size-2 shrink-0 rounded-full", STATUS_DOT[status], className)}
    />
  );
}
