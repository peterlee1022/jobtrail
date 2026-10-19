import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { applications, events } from "@/db/schema";
import { parseCsv } from "@/lib/csv";
import { mapImportRows } from "@/lib/import";
import { GET } from "./route";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

beforeEach(async () => {
  await db.delete(events);
  await db.delete(applications);
  await db.insert(applications).values({
    company: "Acme, Inc.",
    role: "Engineer",
    status: "screening",
    salaryMin: 120_000,
    salaryMax: 150_000,
    appliedAt: new Date(2026, 8, 1),
    notes: '- talked to "Sam"\n- next step is a take-home',
  });
});

describe("GET /export", () => {
  it("downloads a CSV file", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /attachment; filename="jobtrail-.*\.csv"/,
    );
  });

  it("can be imported again without losing anything", async () => {
    const text = await (await GET()).text();
    const { rows, errors } = mapImportRows(parseCsv(text));

    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      company: "Acme, Inc.",
      role: "Engineer",
      status: "screening",
      salaryMin: 120_000,
      salaryMax: 150_000,
      notes: '- talked to "Sam"\n- next step is a take-home',
    });
    expect(rows[0].appliedAt?.getDate()).toBe(1);
  });
});
