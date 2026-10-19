import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { STATUSES } from "@/lib/statuses";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const applications = sqliteTable(
  "applications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    location: text("location"),
    url: text("url"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    status: text("status", { enum: STATUSES }).notNull().default("wishlist"),
    notes: text("notes"),
    appliedAt: integer("applied_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("applications_status_idx").on(t.status)],
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["created", "status_change", "note"] }).notNull(),
    fromStatus: text("from_status", { enum: STATUSES }),
    toStatus: text("to_status", { enum: STATUSES }),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("events_application_idx").on(t.applicationId)],
);

export const applicationsRelations = relations(applications, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  application: one(applications, {
    fields: [events.applicationId],
    references: [applications.id],
  }),
}));

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Event = typeof events.$inferSelect;
