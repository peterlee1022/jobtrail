import { Board } from "@/components/board";
import { NewApplicationDialog } from "@/components/new-application-dialog";
import { getApplications } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const applications = await getApplications();

  return (
    <div className="grid gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="text-muted text-sm">Drag a card to change its status.</p>
        </div>
        <NewApplicationDialog />
      </div>
      <Board applications={applications} now={new Date()} />
    </div>
  );
}
