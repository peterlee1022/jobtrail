"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

export function NoteForm({
  action,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false });

  return (
    <form action={formAction} className="grid gap-2">
      <textarea
        name="note"
        rows={2}
        placeholder="Add a note, e.g. who you talked to"
        defaultValue={state.ok ? "" : state.values?.note}
        className="field resize-y"
      />
      {state.errors?.note && (
        <span className="text-xs text-rose-600 dark:text-rose-400">{state.errors.note[0]}</span>
      )}
      <button
        disabled={pending}
        className="border-border hover:bg-background justify-self-end rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add note"}
      </button>
    </form>
  );
}
