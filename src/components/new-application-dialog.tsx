"use client";

import { useCallback, useRef, useState } from "react";
import { createApplication } from "@/app/actions";
import { ApplicationForm } from "./application-form";

export function NewApplicationDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Bumping the key remounts the form so it starts empty each time
  const [formKey, setFormKey] = useState(0);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setFormKey((k) => k + 1);
  }, []);

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="bg-accent rounded-md px-3.5 py-2 text-sm font-medium text-white hover:opacity-90 dark:text-black"
      >
        Add application
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setFormKey((k) => k + 1)}
        className="border-border bg-surface text-foreground m-auto w-[min(640px,calc(100vw-2rem))] rounded-xl border p-0 shadow-xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="font-medium">New application</h2>
          <button
            onClick={close}
            className="text-muted hover:text-foreground text-sm"
            aria-label="Close"
          >
            Esc
          </button>
        </div>
        <div className="p-5">
          <ApplicationForm
            key={formKey}
            action={createApplication}
            submitLabel="Add"
            onSaved={close}
          />
        </div>
      </dialog>
    </>
  );
}
