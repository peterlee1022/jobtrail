import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from ".";
import { getApplication, getApplications, getStatsData } from "./queries";
import { applications, events } from "./schema";

const day = (n: number) => new Date(Date.UTC(2026, 8, n));

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

beforeEach(async () => {
  await db.delete(events);
  await db.delete(applications);

  await db.insert(applications).values([
    { id: 1, company: "Older", role: "Dev", status: "applied", updatedAt: day(1) },
    { id: 2, company: "Newer", role: "Dev", status: "screening", updatedAt: day(5) },
  ]);
  await db.insert(events).values([
    { applicationId: 2, type: "created", toStatus: "applied", createdAt: day(2) },
    {
      applicationId: 2,
      type: "status_change",
      fromStatus: "applied",
      toStatus: "screening",
      createdAt: day(4),
    },
    { applicationId: 2, type: "note", note: "Phone screen went well", createdAt: day(5) },
  ]);
});

describe("getApplications", () => {
  it("puts the most recently touched applications first", async () => {
    const apps = await getApplications();
    expect(apps.map((a) => a.company)).toEqual(["Newer", "Older"]);
  });
});

describe("getApplication", () => {
  it("includes the timeline, newest first", async () => {
    const app = await getApplication(2);
    expect(app?.events.map((e) => e.type)).toEqual(["note", "status_change", "created"]);
  });

  it("returns undefined for a missing id", async () => {
    expect(await getApplication(404)).toBeUndefined();
  });
});

describe("getStatsData", () => {
  it("only returns status changes from the history", async () => {
    const { apps, history } = await getStatsData();
    expect(apps).toHaveLength(2);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ fromStatus: "applied", toStatus: "screening" });
  });
});
