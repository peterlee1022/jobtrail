import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from ".";
import { applications, events } from "./schema";

export function getApplications() {
  return db.select().from(applications).orderBy(desc(applications.updatedAt));
}

export function getApplication(id: number) {
  return db.query.applications.findFirst({
    where: eq(applications.id, id),
    with: { events: { orderBy: [desc(events.createdAt), desc(events.id)] } },
  });
}

export async function getStatsData() {
  const [apps, history] = await Promise.all([
    db
      .select({
        id: applications.id,
        status: applications.status,
        appliedAt: applications.appliedAt,
      })
      .from(applications),
    db
      .select({
        applicationId: events.applicationId,
        fromStatus: events.fromStatus,
        toStatus: events.toStatus,
        createdAt: events.createdAt,
      })
      .from(events)
      .where(eq(events.type, "status_change"))
      .orderBy(asc(events.createdAt)),
  ]);
  return { apps, history };
}
