import { Board } from "@/components/board";
import { ImportDialog } from "@/components/import-dialog";
import { NewApplicationDialog } from "@/components/new-application-dialog";
import { getApplications } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const applications = await getApplications();

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="text-muted text-sm">Drag a card to change its status.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/export"
            download
            className="text-muted hover:text-foreground hidden rounded-md px-3 py-2 text-sm sm:block"
          >
            Export
          </a>
          <ImportDialog />
          <NewApplicationDialog />
        </div>
      </div>
      <Board applications={applications} now={new Date()} />
    </div>
  );
}
