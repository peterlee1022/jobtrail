"use client";

import { useTransition } from "react";
import { deleteApplication } from "@/app/actions";

export function DeleteButton({ id, company }: { id: number; company: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete ${company}? This removes its history too.`)) return;
        startTransition(() => deleteApplication(id));
      }}
      className="justify-self-start text-sm text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
    >
      {pending ? "Deleting..." : "Delete application"}
    </button>
  );
}
