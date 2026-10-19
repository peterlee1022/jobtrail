import { differenceInCalendarDays, startOfWeek, subWeeks, addWeeks, format } from "date-fns";
import { STAGE_RANK, type Status } from "./statuses";

export type StatsApplication = {
  id: number;
  status: Status;
  appliedAt: Date | null;
};

export type StatsEvent = {
  applicationId: number;
  fromStatus: Status | null;
  toStatus: Status | null;
  createdAt: Date;
};

export const FUNNEL_STAGES = ["applied", "screening", "interviewing", "offer"] as const;

function groupEvents(events: StatsEvent[]) {
  const byApp = new Map<number, StatsEvent[]>();
  for (const e of events) {
    const list = byApp.get(e.applicationId);
    if (list) list.push(e);
    else byApp.set(e.applicationId, [e]);
  }
  for (const list of byApp.values()) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  return byApp;
}

/** The furthest stage an application has ever been in, based on its history. */
export function furthestStage(app: StatsApplication, history: StatsEvent[] = []): number {
  let rank = STAGE_RANK[app.status];
  for (const e of history) {
    if (e.toStatus) rank = Math.max(rank, STAGE_RANK[e.toStatus]);
    if (e.fromStatus) rank = Math.max(rank, STAGE_RANK[e.fromStatus]);
  }
  // A rejection with an applied date still counts as having applied, even if
  // the history was never recorded (e.g. imported data).
  if (app.appliedAt) rank = Math.max(rank, STAGE_RANK.applied);
  return rank;
}

export function funnel(apps: StatsApplication[], events: StatsEvent[]) {
  const byApp = groupEvents(events);
  const reached = apps.map((a) => furthestStage(a, byApp.get(a.id)));

  return FUNNEL_STAGES.map((stage) => ({
    stage,
    count: reached.filter((r) => r >= STAGE_RANK[stage]).length,
  }));
}

/**
 * Days between applying and the first time anything happened afterwards
 * (moving forward or getting rejected). Applications still sitting in
 * "applied" haven't heard back, so they're left out.
 */
export function responseTimes(apps: StatsApplication[], events: StatsEvent[]): number[] {
  const byApp = groupEvents(events);
  const days: number[] = [];

  for (const app of apps) {
    if (!app.appliedAt) continue;
    const reply = byApp
      .get(app.id)
      ?.find((e) => e.fromStatus === "applied" && e.createdAt >= app.appliedAt!);
    if (reply) days.push(differenceInCalendarDays(reply.createdAt, app.appliedAt));
  }
  return days;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function responseRate(apps: StatsApplication[], events: StatsEvent[]): number | null {
  const byApp = groupEvents(events);
  const applied = apps.filter((a) => furthestStage(a, byApp.get(a.id)) >= STAGE_RANK.applied);
  if (applied.length === 0) return null;

  const heardBack = applied.filter(
    (a) => a.status === "rejected" || furthestStage(a, byApp.get(a.id)) > STAGE_RANK.applied,
  );
  return heardBack.length / applied.length;
}

/** Applications sent per week for the last `weeks` weeks, oldest first. */
export function weeklyApplications(apps: StatsApplication[], now: Date, weeks = 12) {
  const thisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const first = subWeeks(thisWeek, weeks - 1);

  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = addWeeks(first, i);
    return { week: format(start, "MMM d"), start, count: 0 };
  });

  for (const app of apps) {
    if (!app.appliedAt) continue;
    const index = Math.floor(differenceInCalendarDays(app.appliedAt, first) / 7);
    if (index >= 0 && index < weeks) buckets[index].count++;
  }

  return buckets.map(({ week, count }) => ({ week, count }));
}

/** No movement in this many days and we flag the card as probably ghosted. */
export const STALE_AFTER_DAYS = 21;

export function isStale(status: Status, lastActivity: Date, now: Date) {
  if (status !== "applied" && status !== "screening") return false;
  return differenceInCalendarDays(now, lastActivity) >= STALE_AFTER_DAYS;
}
