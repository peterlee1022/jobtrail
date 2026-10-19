import type { Metadata } from "next";
import { WeeklyChart } from "@/components/weekly-chart";
import { getStatsData } from "@/db/queries";
import { funnel, median, responseRate, responseTimes, weeklyApplications } from "@/lib/stats";
import { STATUS_LABELS } from "@/lib/statuses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stats" };

export default async function StatsPage() {
  const { apps, history } = await getStatsData();
  const now = new Date();

  const stages = funnel(apps, history);
  const rate = responseRate(apps, history);
  const days = median(responseTimes(apps, history));
  const weekly = weeklyApplications(apps, now, 12);
  const top = stages[0].count;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Stats</h1>
        <p className="text-muted text-sm">How the search is going so far.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Applications sent" value={String(top)} />
        <Tile
          label="Heard back"
          value={rate === null ? "-" : `${Math.round(rate * 100)}%`}
          hint="Moved forward or got a rejection"
        />
        <Tile
          label="Median wait"
          value={days === null ? "-" : `${days} ${days === 1 ? "day" : "days"}`}
          hint="From applying to first reply"
        />
        <Tile label="Offers" value={String(stages[stages.length - 1].count)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border-border bg-surface rounded-lg border p-5">
          <h2 className="text-sm font-medium">Pipeline</h2>
          <p className="text-muted mb-4 text-xs">How many applications made it to each stage</p>
          {top === 0 ? (
            <Empty />
          ) : (
            <ul className="grid gap-3">
              {stages.map((s, i) => {
                const prev = i === 0 ? null : stages[i - 1].count;
                return (
                  <li
                    key={s.stage}
                    className="grid grid-cols-[100px_1fr_auto] items-center gap-3 text-sm"
                  >
                    <span className="text-muted">{STATUS_LABELS[s.stage]}</span>
                    <div className="h-6 rounded bg-black/[0.04] dark:bg-white/[0.05]">
                      <div
                        className="bg-accent h-full rounded"
                        style={{ width: `${Math.max((s.count / top) * 100, s.count ? 2 : 0)}%` }}
                        title={`${s.count} reached ${STATUS_LABELS[s.stage].toLowerCase()}`}
                      />
                    </div>
                    <span className="w-20 text-right font-mono text-xs">
                      {s.count}
                      {prev ? (
                        <span className="text-muted"> ({Math.round((s.count / prev) * 100)}%)</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border-border bg-surface rounded-lg border p-5">
          <h2 className="text-sm font-medium">Applications per week</h2>
          <p className="text-muted mb-2 text-xs">Last 12 weeks, by date applied</p>
          {top === 0 ? <Empty /> : <WeeklyChart data={weekly} />}
        </section>
      </div>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <div className="text-muted text-xs">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="text-muted mt-1 text-xs">{hint}</div>}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-muted py-10 text-center text-sm">
      Nothing to show until you&apos;ve applied somewhere.
    </p>
  );
}
