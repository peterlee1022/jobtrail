import { z } from "zod";
import { STATUSES } from "./statuses";

// Form fields come in as strings, and an empty input should mean "not set"
// rather than failing validation or turning into 0.
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const optionalSalary = z.preprocess(
  (value) => {
    const v = blankToUndefined(value);
    // Let people type "120,000" or "120k"
    if (typeof v === "string") {
      const cleaned = v.replace(/[,$\s]/g, "").toLowerCase();
      return cleaned.endsWith("k") ? Number(cleaned.slice(0, -1)) * 1000 : Number(cleaned);
    }
    return v;
  },
  z
    .number({ error: "Enter a number" })
    .int("Use a whole number")
    .nonnegative("Salary can't be negative")
    .max(10_000_000, "That seems a bit high")
    .optional(),
);

export const applicationSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(120),
    role: z.string().trim().min(1, "Role is required").max(120),
    location: optionalText(120),
    url: z.preprocess(blankToUndefined, z.url("Enter a full URL, like https://...").optional()),
    salaryMin: optionalSalary,
    salaryMax: optionalSalary,
    status: z.enum(STATUSES).default("wishlist"),
    notes: optionalText(5000),
  })
  .refine(
    (data) =>
      data.salaryMin === undefined ||
      data.salaryMax === undefined ||
      data.salaryMax >= data.salaryMin,
    { message: "Max should be at least the min", path: ["salaryMax"] },
  );

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const noteSchema = z.object({
  note: z.string().trim().min(1, "Write something first").max(2000),
});
