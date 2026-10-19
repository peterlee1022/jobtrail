import { parse, isValid } from "date-fns";
import { STAGE_RANK, STATUS_LABELS, STATUSES, type Status } from "./statuses";
import { applicationSchema, type ApplicationInput } from "./validation";

export const MAX_IMPORT_ROWS = 1000;

type Field = keyof ApplicationInput | "salary" | "appliedAt";

// Spreadsheets out in the wild use all sorts of column names, so match loosely
const HEADER_ALIASES: Record<string, Field> = {
  company: "company",
  employer: "company",
  organization: "company",
  role: "role",
  title: "role",
  position: "role",
  "job title": "role",
  job: "role",
  location: "location",
  url: "url",
  link: "url",
  "job posting": "url",
  posting: "url",
  status: "status",
  stage: "status",
  "salary min": "salaryMin",
  "min salary": "salaryMin",
  "salary max": "salaryMax",
  "max salary": "salaryMax",
  salary: "salary",
  "salary range": "salary",
  compensation: "salary",
  applied: "appliedAt",
  "applied at": "appliedAt",
  "applied on": "appliedAt",
  "date applied": "appliedAt",
  notes: "notes",
  note: "notes",
  comments: "notes",
};

const STATUS_ALIASES: Record<string, Status> = {
  ...Object.fromEntries(STATUSES.map((s) => [s, s])),
  ...Object.fromEntries(STATUSES.map((s) => [STATUS_LABELS[s].toLowerCase(), s])),
  saved: "wishlist",
  "phone screen": "screening",
  screen: "screening",
  interview: "interviewing",
  declined: "rejected",
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type ImportRow = ApplicationInput & { appliedAt: Date | null };

export type ImportResult = {
  rows: ImportRow[];
  errors: { line: number; message: string }[];
};

function parseDate(value: string): Date | null | undefined {
  if (!value.trim()) return null;
  for (const pattern of ["yyyy-MM-dd", "M/d/yyyy", "M/d/yy", "MMM d, yyyy", "MMMM d, yyyy"]) {
    const date = parse(value.trim(), pattern, new Date());
    if (isValid(date)) return date;
  }
  return undefined;
}

/** Turns parsed CSV rows (header first) into validated applications. */
export function mapImportRows(table: string[][]): ImportResult {
  const [header, ...body] = table;
  if (!header) return { rows: [], errors: [{ line: 1, message: "The file is empty" }] };

  const columns = header.map((h) => HEADER_ALIASES[normalize(h)]);
  if (!columns.includes("company") || !columns.includes("role")) {
    return {
      rows: [],
      errors: [{ line: 1, message: 'Needs at least a "Company" and a "Role" column' }],
    };
  }
  if (body.length > MAX_IMPORT_ROWS) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Can import up to ${MAX_IMPORT_ROWS} rows at a time` }],
    };
  }

  const result: ImportResult = { rows: [], errors: [] };

  body.forEach((cells, i) => {
    const line = i + 2;
    const raw: Partial<Record<Field, string>> = {};
    columns.forEach((field, c) => {
      // Undo the formula guard that our own export adds
      if (field && cells[c] !== undefined)
        raw[field] = cells[c].trim().replace(/^'(?=[=+\-@])/, "");
    });

    // A single "120k - 150k" column is common, split it into min and max
    if (raw.salary && !raw.salaryMin && !raw.salaryMax) {
      const [min, max] = raw.salary.split(/\s*(?:-|to)\s*/i);
      raw.salaryMin = min;
      raw.salaryMax = max;
    }

    const appliedAt = parseDate(raw.appliedAt ?? "");
    if (appliedAt === undefined) {
      result.errors.push({ line, message: `Couldn't read the date "${raw.appliedAt}"` });
      return;
    }

    let status: Status | undefined;
    if (raw.status) {
      status = STATUS_ALIASES[normalize(raw.status)];
      if (!status) {
        result.errors.push({ line, message: `Unknown status "${raw.status}"` });
        return;
      }
    } else {
      status = appliedAt ? "applied" : "wishlist";
    }

    const parsed = applicationSchema.safeParse({ ...raw, status });
    if (!parsed.success) {
      result.errors.push({ line, message: parsed.error.issues[0].message });
      return;
    }

    result.rows.push({
      ...parsed.data,
      // Anything past the wishlist must have been applied to at some point
      appliedAt:
        appliedAt ??
        (STAGE_RANK[status] >= STAGE_RANK.applied || status === "rejected" ? new Date() : null),
    });
  });

  return result;
}
