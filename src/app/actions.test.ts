import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { redirect } from "next/navigation";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { applications, events } from "@/db/schema";
import {
  addNote,
  createApplication,
  deleteApplication,
  importApplications,
  moveApplication,
  updateApplication,
} from "./actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function create(fields: Record<string, string> = {}) {
  const result = await createApplication(
    { ok: false },
    form({ company: "Acme", role: "Engineer", ...fields }),
  );
  expect(result.ok).toBe(true);
  const [app] = await db.select().from(applications).orderBy(applications.id).limit(1);
  return app;
}

function historyOf(id: number) {
  return db.select().from(events).where(eq(events.applicationId, id)).orderBy(events.id);
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

beforeEach(async () => {
  await db.delete(events);
  await db.delete(applications);
  vi.clearAllMocks();
});

describe("createApplication", () => {
  it("saves the application and logs that it was created", async () => {
    const app = await create({ salaryMin: "120k", status: "wishlist" });

    expect(app).toMatchObject({ company: "Acme", salaryMin: 120_000, status: "wishlist" });
    expect(app.appliedAt).toBeNull();

    const history = await historyOf(app.id);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ type: "created", toStatus: "wishlist" });
  });

  it("sets the applied date when added straight into applied", async () => {
    const app = await create({ status: "applied" });
    expect(app.appliedAt).toBeInstanceOf(Date);
  });

  it("returns errors and the submitted values when validation fails", async () => {
    const result = await createApplication({ ok: false }, form({ company: "", role: "Engineer" }));

    expect(result.ok).toBe(false);
    expect(result.errors?.company).toBeDefined();
    expect(result.values).toMatchObject({ company: "", role: "Engineer" });
    expect(await db.select().from(applications)).toHaveLength(0);
  });
});

describe("moveApplication", () => {
  it("updates the status and records where it moved from", async () => {
    const app = await create();
    await moveApplication(app.id, "screening");

    const [updated] = await db.select().from(applications).where(eq(applications.id, app.id));
    expect(updated.status).toBe("screening");
    // Skipping past "applied" still counts as having applied
    expect(updated.appliedAt).toBeInstanceOf(Date);

    const history = await historyOf(app.id);
    expect(history.at(-1)).toMatchObject({
      type: "status_change",
      fromStatus: "wishlist",
      toStatus: "screening",
    });
  });

  it("keeps the original applied date on later moves", async () => {
    const app = await create({ status: "applied" });
    await moveApplication(app.id, "interviewing");

    const [updated] = await db.select().from(applications).where(eq(applications.id, app.id));
    expect(updated.appliedAt?.getTime()).toBe(app.appliedAt?.getTime());
  });

  it("does nothing when the status hasn't changed", async () => {
    const app = await create();
    await moveApplication(app.id, "wishlist");
    expect(await historyOf(app.id)).toHaveLength(1);
  });

  it("rejects statuses that don't exist", async () => {
    const app = await create();
    await expect(moveApplication(app.id, "hired")).rejects.toThrow("Unknown status");
  });
});

describe("updateApplication", () => {
  it("clears optional fields that were emptied in the form", async () => {
    const app = await create({ location: "Remote", salaryMin: "100000" });

    const result = await updateApplication(
      app.id,
      { ok: false },
      form({ company: "Acme", role: "Engineer", location: "", salaryMin: "", status: "wishlist" }),
    );
    expect(result.ok).toBe(true);

    const [updated] = await db.select().from(applications).where(eq(applications.id, app.id));
    expect(updated.location).toBeNull();
    expect(updated.salaryMin).toBeNull();
    // Status didn't change, so no new history entry
    expect(await historyOf(app.id)).toHaveLength(1);
  });

  it("logs a status change made through the form", async () => {
    const app = await create();
    await updateApplication(
      app.id,
      { ok: false },
      form({ company: "Acme", role: "Engineer", status: "offer" }),
    );

    const history = await historyOf(app.id);
    expect(history.at(-1)).toMatchObject({ fromStatus: "wishlist", toStatus: "offer" });
  });

  it("reports an error for an application that was deleted", async () => {
    const result = await updateApplication(
      9999,
      { ok: false },
      form({ company: "Acme", role: "Engineer" }),
    );
    expect(result.ok).toBe(false);
  });
});

describe("addNote", () => {
  it("adds the note to the timeline", async () => {
    const app = await create();
    const result = await addNote(app.id, { ok: false }, form({ note: "Called the recruiter" }));

    expect(result.ok).toBe(true);
    const history = await historyOf(app.id);
    expect(history.at(-1)).toMatchObject({ type: "note", note: "Called the recruiter" });
  });

  it("refuses empty notes", async () => {
    const app = await create();
    const result = await addNote(app.id, { ok: false }, form({ note: "   " }));

    expect(result.ok).toBe(false);
    expect(await historyOf(app.id)).toHaveLength(1);
  });
});

describe("deleteApplication", () => {
  it("removes the application with its history and goes back to the board", async () => {
    const app = await create();
    await addNote(app.id, { ok: false }, form({ note: "hello" }));

    await deleteApplication(app.id);

    expect(await db.select().from(applications)).toHaveLength(0);
    expect(await db.select().from(events)).toHaveLength(0);
    expect(redirect).toHaveBeenCalledWith("/");
  });
});

describe("importApplications", () => {
  function csvForm(text: string) {
    const data = new FormData();
    data.set("file", new File([text], "apps.csv", { type: "text/csv" }));
    return data;
  }

  it("imports the good rows and reports the bad ones", async () => {
    const csv = [
      "Company,Role,Status,Applied",
      "Acme,Engineer,Interviewing,2026-09-01",
      ",Engineer,,",
      "Beta,Designer,,",
    ].join("\n");

    const result = await importApplications({}, csvForm(csv));

    expect(result.imported).toBe(2);
    expect(result.errors).toEqual([{ line: 3, message: "Company is required" }]);

    const saved = await db.select().from(applications).orderBy(applications.company);
    expect(saved.map((a) => [a.company, a.status])).toEqual([
      ["Acme", "interviewing"],
      ["Beta", "wishlist"],
    ]);

    const history = await historyOf(saved[0].id);
    expect(history).toMatchObject([{ type: "created", note: "Imported from CSV" }]);
  });

  it("asks for a file when none was picked", async () => {
    const result = await importApplications({}, new FormData());
    expect(result.errors?.[0].message).toMatch(/Choose a CSV/);
  });

  it("writes nothing when every row is bad", async () => {
    const result = await importApplications({}, csvForm("Name\nAcme"));
    expect(result.imported).toBe(0);
    expect(await db.select().from(applications)).toHaveLength(0);
  });
});
