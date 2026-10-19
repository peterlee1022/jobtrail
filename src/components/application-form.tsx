"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/app/actions";
import type { Application } from "@/db/schema";
import { STATUS_LABELS, STATUSES } from "@/lib/statuses";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  application?: Application;
  submitLabel: string;
  onSaved?: () => void;
};

export function ApplicationForm({ action, application, submitLabel, onSaved }: Props) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state, onSaved]);

  const value = (name: keyof Application) => {
    if (state.values && !state.ok) return state.values[name] ?? "";
    const v = application?.[name];
    return v == null ? "" : String(v);
  };

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Company" errors={state.errors?.company}>
        <input
          name="company"
          defaultValue={value("company")}
          className="field"
          autoFocus={!application}
        />
      </Field>
      <Field label="Role" errors={state.errors?.role}>
        <input name="role" defaultValue={value("role")} className="field" />
      </Field>
      <Field label="Location" errors={state.errors?.location}>
        <input
          name="location"
          defaultValue={value("location")}
          placeholder="Remote, NYC, ..."
          className="field"
        />
      </Field>
      <Field label="Status" errors={state.errors?.status}>
        <select name="status" defaultValue={value("status") || "wishlist"} className="field">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Salary min" errors={state.errors?.salaryMin}>
        <input
          name="salaryMin"
          defaultValue={value("salaryMin")}
          placeholder="120k"
          className="field"
          inputMode="numeric"
        />
      </Field>
      <Field label="Salary max" errors={state.errors?.salaryMax}>
        <input
          name="salaryMax"
          defaultValue={value("salaryMax")}
          placeholder="150k"
          className="field"
          inputMode="numeric"
        />
      </Field>
      <Field label="Job posting" errors={state.errors?.url} wide>
        <input
          name="url"
          type="url"
          defaultValue={value("url")}
          placeholder="https://"
          className="field"
        />
      </Field>
      <Field label="Notes" errors={state.errors?.notes} wide>
        <textarea name="notes" defaultValue={value("notes")} rows={4} className="field resize-y" />
      </Field>

      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        {state.ok && application && <span className="text-muted text-sm">Saved</span>}
        <button
          type="submit"
          disabled={pending}
          className="bg-accent rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-black"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  errors,
  wide,
  children,
}: {
  label: string;
  errors?: string[];
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}>
      <span className="text-muted text-xs font-medium">{label}</span>
      {children}
      {errors?.[0] && <span className="text-xs text-rose-600 dark:text-rose-400">{errors[0]}</span>}
    </label>
  );
}
