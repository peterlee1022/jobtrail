import { subDays } from "date-fns";
import type { Status } from "@/lib/statuses";
import { db } from "./index";
import { applications, events } from "./schema";

type Seed = {
  company: string;
  role: string;
  location?: string;
  salary?: [number, number];
  // status path with days ago for each step, starting at the first status
  path: [Status, number][];
  notes?: string;
};

const seeds: Seed[] = [
  {
    company: "Vercel",
    role: "Software Engineer, Frontend",
    location: "Remote",
    salary: [140000, 180000],
    path: [
      ["applied", 34],
      ["screening", 27],
      ["interviewing", 19],
    ],
    notes: "Recruiter was Dana. Take-home was a small Next.js app.",
  },
  {
    company: "Linear",
    role: "Product Engineer",
    location: "Remote (US)",
    path: [["wishlist", 10]],
    notes: "Wait until the portfolio site is live.",
  },
  {
    company: "Stripe",
    role: "Software Engineer, New Grad",
    location: "Seattle, WA",
    salary: [150000, 175000],
    path: [
      ["applied", 45],
      ["screening", 38],
      ["interviewing", 30],
      ["rejected", 16],
    ],
    notes: "Got to onsite. Feedback: system design round was weak.",
  },
  {
    company: "Figma",
    role: "Software Engineer, Editor",
    location: "San Francisco, CA",
    path: [["applied", 40]],
  },
  {
    company: "Supabase",
    role: "Developer Experience Engineer",
    location: "Remote",
    path: [
      ["applied", 22],
      ["rejected", 19],
    ],
  },
  {
    company: "Datadog",
    role: "Software Engineer I",
    location: "New York, NY",
    salary: [125000, 145000],
    path: [
      ["applied", 18],
      ["screening", 11],
    ],
  },
  {
    company: "Shopify",
    role: "Developer, Checkout",
    location: "Remote",
    path: [
      ["applied", 50],
      ["screening", 43],
      ["interviewing", 35],
      ["offer", 6],
    ],
    notes: "Offer call on the 13th. Need to reply by end of month.",
  },
  {
    company: "Ramp",
    role: "Software Engineer, Product",
    location: "New York, NY",
    salary: [160000, 200000],
    path: [["applied", 12]],
  },
  {
    company: "Cloudflare",
    role: "Systems Engineer",
    location: "Austin, TX",
    path: [
      ["applied", 28],
      ["screening", 24],
      ["rejected", 20],
    ],
  },
  {
    company: "Notion",
    role: "Software Engineer, Web",
    location: "San Francisco, CA",
    path: [["wishlist", 3]],
  },
  { company: "Plaid", role: "Software Engineer", location: "Remote", path: [["applied", 9]] },
  {
    company: "Retool",
    role: "Frontend Engineer",
    location: "San Francisco, CA",
    path: [
      ["applied", 15],
      ["interviewing", 6],
    ],
  },
  {
    company: "GitLab",
    role: "Fullstack Engineer, Plan",
    location: "Remote",
    path: [
      ["applied", 60],
      ["rejected", 52],
    ],
  },
  {
    company: "Discord",
    role: "Software Engineer, Activities",
    location: "Remote",
    path: [["applied", 4]],
  },
];

const now = new Date();

await db.delete(events);
await db.delete(applications);

for (const seed of seeds) {
  const [firstStatus, firstDaysAgo] = seed.path[0];
  const [lastStatus, lastDaysAgo] = seed.path[seed.path.length - 1];
  const appliedStep = seed.path.find(([s]) => s === "applied");

  const [app] = await db
    .insert(applications)
    .values({
      company: seed.company,
      role: seed.role,
      location: seed.location,
      salaryMin: seed.salary?.[0],
      salaryMax: seed.salary?.[1],
      status: lastStatus,
      notes: seed.notes,
      appliedAt: appliedStep ? subDays(now, appliedStep[1]) : null,
      createdAt: subDays(now, firstDaysAgo),
      updatedAt: subDays(now, lastDaysAgo),
    })
    .returning();

  await db.insert(events).values([
    {
      applicationId: app.id,
      type: "created",
      toStatus: firstStatus,
      createdAt: subDays(now, firstDaysAgo),
    },
    ...seed.path.slice(1).map(([status, daysAgo], i) => ({
      applicationId: app.id,
      type: "status_change" as const,
      fromStatus: seed.path[i][0],
      toStatus: status,
      createdAt: subDays(now, daysAgo),
    })),
  ]);
}

console.log(`Seeded ${seeds.length} applications`);
