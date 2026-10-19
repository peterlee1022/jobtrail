import { describe, expect, it } from "vitest";
import {
  funnel,
  furthestStage,
  isStale,
  median,
  responseRate,
  responseTimes,
  weeklyApplications,
  type StatsApplication,
  type StatsEvent,
} from "./stats";

const d = (s: string) => new Date(`${s}T12:00:00`);

const apps: StatsApplication[] = [
  { id: 1, status: "wishlist", appliedAt: null },
  { id: 2, status: "applied", appliedAt: d("2026-09-01") },
  { id: 3, status: "interviewing", appliedAt: d("2026-09-02") },
  { id: 4, status: "rejected", appliedAt: d("2026-09-03") },
  { id: 5, status: "offer", appliedAt: d("2026-09-10") },
];

const events: StatsEvent[] = [
  { applicationId: 3, fromStatus: "applied", toStatus: "screening", createdAt: d("2026-09-09") },
  {
    applicationId: 3,
    fromStatus: "screening",
    toStatus: "interviewing",
    createdAt: d("2026-09-15"),
  },
  // rejected straight after applying
  { applicationId: 4, fromStatus: "applied", toStatus: "rejected", createdAt: d("2026-09-06") },
  { applicationId: 5, fromStatus: "applied", toStatus: "interviewing", createdAt: d("2026-09-14") },
  { applicationId: 5, fromStatus: "interviewing", toStatus: "offer", createdAt: d("2026-09-30") },
];

describe("furthestStage", () => {
  it("uses history for rejected applications", () => {
    const app: StatsApplication = { id: 9, status: "rejected", appliedAt: d("2026-09-01") };
    const history: StatsEvent[] = [
      {
        applicationId: 9,
        fromStatus: "applied",
        toStatus: "interviewing",
        createdAt: d("2026-09-05"),
      },
      {
        applicationId: 9,
        fromStatus: "interviewing",
        toStatus: "rejected",
        createdAt: d("2026-09-12"),
      },
    ];
    expect(furthestStage(app, history)).toBe(3);
  });

  it("treats an applied date as at least applied", () => {
    expect(furthestStage({ id: 1, status: "rejected", appliedAt: d("2026-09-01") })).toBe(1);
  });
});

describe("funnel", () => {
  it("counts how many applications reached each stage", () => {
    expect(funnel(apps, events)).toEqual([
      { stage: "applied", count: 4 },
      { stage: "screening", count: 2 },
      { stage: "interviewing", count: 2 },
      { stage: "offer", count: 1 },
    ]);
  });
});

describe("responseTimes", () => {
  it("measures days until the first move out of applied", () => {
    expect(responseTimes(apps, events).sort((a, b) => a - b)).toEqual([3, 4, 7]);
  });
});

describe("median", () => {
  it("handles odd, even and empty lists", () => {
    expect(median([7, 3, 4])).toBe(4);
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe("responseRate", () => {
  it("counts rejections as hearing back", () => {
    // 4 applied, 3 heard back (one still waiting)
    expect(responseRate(apps, events)).toBe(0.75);
  });

  it("returns null with nothing applied", () => {
    expect(responseRate([{ id: 1, status: "wishlist", appliedAt: null }], [])).toBeNull();
  });
});

describe("weeklyApplications", () => {
  it("buckets by week starting Monday", () => {
    const weeks = weeklyApplications(apps, d("2026-09-16"), 3);
    expect(weeks).toEqual([
      { week: "Aug 31", count: 3 },
      { week: "Sep 7", count: 1 },
      { week: "Sep 14", count: 0 },
    ]);
  });

  it("ignores anything outside the window", () => {
    const weeks = weeklyApplications(apps, d("2026-12-01"), 4);
    expect(weeks.every((w) => w.count === 0)).toBe(true);
  });
});

describe("isStale", () => {
  const now = d("2026-10-01");

  it("flags applications that have gone quiet", () => {
    expect(isStale("applied", d("2026-09-01"), now)).toBe(true);
    expect(isStale("applied", d("2026-09-20"), now)).toBe(false);
  });

  it("never flags wishlist or finished applications", () => {
    expect(isStale("wishlist", d("2026-01-01"), now)).toBe(false);
    expect(isStale("offer", d("2026-01-01"), now)).toBe(false);
  });
});
