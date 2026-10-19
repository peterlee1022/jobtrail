"use client";

import { useActionState, useRef, useState } from "react";
import { importApplications, type ImportState } from "@/app/actions";

export function ImportDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Remounting the form clears the file input and the last result
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="border-border bg-surface hover:bg-background shrink-0 rounded-md border px-3.5 py-2 text-sm"
      >
        Import
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setFormKey((k) => k + 1)}
        aria-labelledby="import-title"
        className="border-border bg-surface text-foreground m-auto w-[min(520px,calc(100vw-2rem))] rounded-xl border p-0 shadow-xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
          <h2 id="import-title" className="font-medium">
            Import from CSV
          </h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="text-muted hover:text-foreground text-sm"
            aria-label="Close"
          >
            Esc
          </button>
        </div>
        <ImportForm key={formKey} onDone={() => dialogRef.current?.close()} />
      </dialog>
    </>
  );
}

function ImportForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importApplications,
    {},
  );
  const finished = state.imported !== undefined && state.imported > 0;

  return (
    <form action={formAction} className="grid gap-4 p-5 text-sm">
      <p className="text-muted">
        Needs a <strong className="text-foreground font-medium">Company</strong> and a{" "}
        <strong className="text-foreground font-medium">Role</strong> column. Location, status,
        salary, job posting, applied date and notes are picked up too if they&apos;re there. A file
        from <em>Export</em> works as is.
      </p>

      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        aria-label="CSV file"
        className="field file:bg-accent-soft file:text-accent file:mr-3 file:rounded file:border-0 file:px-2.5 file:py-1"
      />

      {state.imported !== undefined && (
        <p role="status" className="font-medium">
          Imported {state.imported} {state.imported === 1 ? "application" : "applications"}
          {state.errors?.length ? `, skipped ${state.errors.length}` : ""}.
        </p>
      )}

      {state.errors && state.errors.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {state.errors.map((e, i) => (
            <li key={i}>
              {e.line > 0 && <span className="font-mono">Line {e.line}: </span>}
              {e.message}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end gap-3">
        {finished ? (
          <button
            type="button"
            onClick={onDone}
            className="bg-accent rounded-md px-4 py-2 font-medium text-white hover:opacity-90 dark:text-black"
          >
            Done
          </button>
        ) : (
          <button
            disabled={pending}
            className="bg-accent rounded-md px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50 dark:text-black"
          >
            {pending ? "Importing..." : "Import"}
          </button>
        )}
      </div>
    </form>
  );
}
