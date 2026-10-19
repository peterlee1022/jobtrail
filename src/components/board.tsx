"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { moveApplication } from "@/app/actions";
import type { Application } from "@/db/schema";
import { formatSalary, timeAgo } from "@/lib/format";
import { isStale } from "@/lib/stats";
import { STATUS_LABELS, STATUSES, type Status } from "@/lib/statuses";
import { StatusDot } from "./status-dot";

type Move = { id: number; status: Status };

export function Board({ applications, now }: { applications: Application[]; now: Date }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [optimistic, applyMove] = useOptimistic(applications, (state, move: Move) =>
    state.map((a) => (a.id === move.id ? { ...a, status: move.status, updatedAt: new Date() } : a)),
  );

  const sensors = useSensors(
    // A small distance threshold so a normal click still opens the card
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // On touch screens, press and hold to drag so swiping still scrolls the board
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const columns = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = q
      ? optimistic.filter((a) =>
          `${a.company} ${a.role} ${a.location ?? ""}`.toLowerCase().includes(q),
        )
      : optimistic;

    return STATUSES.map((status) => ({
      status,
      items: visible.filter((a) => a.status === status),
    }));
  }, [optimistic, query]);

  const active = activeId ? optimistic.find((a) => a.id === activeId) : undefined;

  function onDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
    setError(null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const id = Number(event.active.id);
    const status = event.over?.id as Status | undefined;
    const app = optimistic.find((a) => a.id === id);
    if (!app || !status || app.status === status) return;

    startTransition(async () => {
      applyMove({ id, status });
      try {
        await moveApplication(id, status);
      } catch {
        setError(`Couldn't move ${app.company}. Try again?`);
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by company, role or location"
          className="field max-w-xs"
        />
        <span className="text-muted text-sm">
          {optimistic.length} {optimistic.length === 1 ? "application" : "applications"}
        </span>
        {error && <span className="text-sm text-rose-600 dark:text-rose-400">{error}</span>}
      </div>

      <DndContext
        id="board"
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-6 xl:overflow-visible">
          {columns.map((col) => (
            <Column key={col.status} status={col.status} count={col.items.length}>
              {col.items.map((app) => (
                <DraggableCard key={app.id} app={app} now={now} dimmed={app.id === activeId} />
              ))}
            </Column>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {active && <Card app={active} now={now} lifted />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  count,
  children,
}: {
  status: Status;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[60vh] w-72 shrink-0 snap-start flex-col rounded-lg border p-2 transition-colors xl:w-auto",
        isOver
          ? "border-accent bg-accent-soft"
          : "border-transparent bg-black/[0.03] dark:bg-white/[0.03]",
      )}
    >
      <h2 className="flex items-center gap-2 px-1.5 pt-1 pb-2.5 text-sm font-medium">
        <StatusDot status={status} />
        {STATUS_LABELS[status]}
        <span className="text-muted ml-auto font-mono text-xs">{count}</span>
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function DraggableCard({ app, now, dimmed }: { app: Application; now: Date; dimmed: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: app.id });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={clsx(dimmed && "opacity-30")}>
      <Card app={app} now={now} />
    </div>
  );
}

function Card({ app, now, lifted }: { app: Application; now: Date; lifted?: boolean }) {
  const salary = formatSalary(app.salaryMin, app.salaryMax);
  const stale = isStale(app.status, app.updatedAt, now);

  return (
    <Link
      href={`/applications/${app.id}`}
      draggable={false}
      className={clsx(
        "border-border bg-surface block rounded-md border p-3 text-sm transition-shadow",
        lifted ? "rotate-1 cursor-grabbing shadow-lg" : "hover:shadow-sm",
      )}
    >
      <div className="font-medium">{app.company}</div>
      <div className="text-muted mt-0.5">{app.role}</div>
      {(app.location || salary) && (
        <div className="text-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {app.location && <span>{app.location}</span>}
          {salary && <span className="font-mono">{salary}</span>}
        </div>
      )}
      <div className="text-muted mt-2.5 flex items-center justify-between text-xs">
        <span>{timeAgo(app.updatedAt, now)}</span>
        {stale && (
          <span
            title="No movement in 3 weeks. Might be worth a follow-up."
            className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          >
            quiet
          </span>
        )}
      </div>
    </Link>
  );
}
