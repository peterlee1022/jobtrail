import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addNote, updateApplication } from "@/app/actions";
import { ApplicationForm } from "@/components/application-form";
import { DeleteButton } from "@/components/delete-button";
import { NoteForm } from "@/components/note-form";
import { StatusDot } from "@/components/status-dot";
import { getApplication } from "@/db/queries";
import type { Event } from "@/db/schema";
import { STATUS_LABELS } from "@/lib/statuses";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function load(params: Props["params"]) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const app = await getApplication(id);
  if (!app) notFound();
  return app;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const app = await load(params);
  return { title: `${app.company}, ${app.role}` };
}

export default async function ApplicationPage({ params }: Props) {
  const app = await load(params);

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <Link href="/" className="text-muted hover:text-foreground text-sm">
          &larr; Back to board
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{app.company}</h1>
            <p className="text-muted">{app.role}</p>
          </div>
          <div className="border-border bg-surface flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <StatusDot status={app.status} />
            {STATUS_LABELS[app.status]}
          </div>
        </div>
        {app.appliedAt && (
          <p className="text-muted mt-2 text-sm">Applied {format(app.appliedAt, "MMMM d, yyyy")}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="border-border bg-surface rounded-lg border p-5">
          <h2 className="mb-4 text-sm font-medium">Details</h2>
          <ApplicationForm
            action={updateApplication.bind(null, app.id)}
            application={app}
            submitLabel="Save changes"
          />
        </section>

        <aside className="grid content-start gap-4">
          <section className="border-border bg-surface rounded-lg border p-5">
            <h2 className="mb-3 text-sm font-medium">Activity</h2>
            <NoteForm action={addNote.bind(null, app.id)} />
            <ol className="border-border mt-5 grid gap-4 border-l pl-4">
              {app.events.map((event) => (
                <TimelineItem key={event.id} event={event} />
              ))}
            </ol>
          </section>

          <DeleteButton id={app.id} company={app.company} />
        </aside>
      </div>
    </div>
  );
}

function TimelineItem({ event }: { event: Event }) {
  let body: React.ReactNode;
  if (event.type === "created") {
    body = (
      <>
        {event.note ? "Imported into" : "Added to"}{" "}
        <strong className="font-medium">{STATUS_LABELS[event.toStatus ?? "wishlist"]}</strong>
      </>
    );
  } else if (event.type === "status_change" && event.fromStatus && event.toStatus) {
    body = (
      <>
        Moved from {STATUS_LABELS[event.fromStatus]} to{" "}
        <strong className="font-medium">{STATUS_LABELS[event.toStatus]}</strong>
      </>
    );
  } else {
    body = <p className="whitespace-pre-wrap">{event.note}</p>;
  }

  return (
    <li className="relative text-sm">
      <span className="border-surface bg-muted absolute top-1.5 -left-[21px] size-2 rounded-full border-2" />
      <div>{body}</div>
      <time className="text-muted text-xs" dateTime={event.createdAt.toISOString()}>
        {format(event.createdAt, "MMM d, yyyy 'at' h:mm a")}
      </time>
    </li>
  );
}
