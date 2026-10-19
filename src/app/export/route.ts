import { format } from "date-fns";
import { getApplications } from "@/db/queries";
import { toCsv } from "@/lib/csv";
import { STATUS_LABELS } from "@/lib/statuses";

export const dynamic = "force-dynamic";

// Column names line up with what the importer understands, so an export can
// be imported again as is
export async function GET() {
  const apps = await getApplications();

  const csv = toCsv([
    [
      "Company",
      "Role",
      "Location",
      "Status",
      "Salary min",
      "Salary max",
      "Job posting",
      "Applied",
      "Notes",
    ],
    ...apps.map((a) => [
      a.company,
      a.role,
      a.location,
      STATUS_LABELS[a.status],
      a.salaryMin,
      a.salaryMax,
      a.url,
      a.appliedAt ? format(a.appliedAt, "yyyy-MM-dd") : null,
      a.notes,
    ]),
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jobtrail-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
