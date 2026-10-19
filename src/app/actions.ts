"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { applications, events, type Application } from "@/db/schema";
import { isStatus, STAGE_RANK, type Status } from "@/lib/statuses";
import { applicationSchema, noteSchema } from "@/lib/validation";

export type FormState = {
  ok: boolean;
  errors?: Record<string, string[] | undefined>;
  // Echoed back so the form keeps what the user typed when validation fails
  values?: Record<string, string>;
};

function formValues(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
}

function appliedAtFor(app: Pick<Application, "appliedAt">, status: Status, now: Date) {
  if (app.appliedAt) return app.appliedAt;
  return STAGE_RANK[status] >= STAGE_RANK.applied ? now : null;
}

function refresh(id?: number) {
  revalidatePath("/");
  revalidatePath("/stats");
  if (id) revalidatePath(`/applications/${id}`);
}

export async function createApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const now = new Date();
  const data = parsed.data;

  await db.transaction(async (tx) => {
    const [app] = await tx
      .insert(applications)
      .values({
        ...data,
        appliedAt: appliedAtFor({ appliedAt: null }, data.status, now),
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: applications.id });

    await tx.insert(events).values({
      applicationId: app.id,
      type: "created",
      toStatus: data.status,
      createdAt: now,
    });
  });

  refresh();
  return { ok: true };
}

export async function updateApplication(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const existing = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  if (!existing) return { ok: false, errors: { company: ["This application no longer exists"] } };

  const now = new Date();
  const data = parsed.data;

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({
        ...data,
        // Clearing a field in the form should clear it in the database too
        location: data.location ?? null,
        url: data.url ?? null,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        notes: data.notes ?? null,
        appliedAt: appliedAtFor(existing, data.status, now),
        updatedAt: now,
      })
      .where(eq(applications.id, id));

    if (existing.status !== data.status) {
      await tx.insert(events).values({
        applicationId: id,
        type: "status_change",
        fromStatus: existing.status,
        toStatus: data.status,
        createdAt: now,
      });
    }
  });

  refresh(id);
  return { ok: true };
}

export async function moveApplication(id: number, status: string) {
  if (!isStatus(status)) throw new Error(`Unknown status: ${status}`);

  const existing = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  if (!existing || existing.status === status) return;

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({ status, appliedAt: appliedAtFor(existing, status, now), updatedAt: now })
      .where(eq(applications.id, id));
    await tx.insert(events).values({
      applicationId: id,
      type: "status_change",
      fromStatus: existing.status,
      toStatus: status,
      createdAt: now,
    });
  });

  refresh(id);
}

export async function addNote(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const parsed = noteSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const now = new Date();
  await db.insert(events).values({
    applicationId: id,
    type: "note",
    note: parsed.data.note,
    createdAt: now,
  });
  await db.update(applications).set({ updatedAt: now }).where(eq(applications.id, id));

  refresh(id);
  return { ok: true };
}

export async function deleteApplication(id: number) {
  // SQLite only enforces ON DELETE CASCADE when foreign_keys is switched on
  // for the connection, so don't rely on it.
  await db.transaction(async (tx) => {
    await tx.delete(events).where(eq(events.applicationId, id));
    await tx.delete(applications).where(eq(applications.id, id));
  });
  refresh();
  redirect("/");
}
