# jobtrail

A small self-hosted tracker for job applications. I was keeping all of this in a spreadsheet and kept losing track of who I'd heard back from, so I built a board for it instead.

![Board view](docs/board.png)

## What it does

- Kanban board with a column per stage (wishlist, applied, screening, interviewing, offer, rejected). Drag cards between columns to update them.
- Every status change gets logged, so each application has a timeline. You can add notes to it too (who you talked to, what they asked, etc).
- Cards that have been sitting in applied or screening for 3+ weeks get a "quiet" tag so you know who to follow up with.
- Stats page with the pipeline funnel, response rate, median time to hear back, and applications per week.
- Salary fields accept stuff like `120k` or `$150,000` because that's how people actually type it.

![Stats page](docs/stats.png)

## Stack

- [Next.js 15](https://nextjs.org) with the App Router, React Server Components and Server Actions (no separate API layer)
- TypeScript, strict mode
- [Drizzle ORM](https://orm.drizzle.team) on SQLite via libsql. Swapping `DATABASE_URL` for a Turso URL works without code changes.
- [Zod](https://zod.dev) for validating form input on the server
- Tailwind CSS v4
- [dnd-kit](https://dndkit.com) for drag and drop, with optimistic updates through `useOptimistic`
- Recharts for the weekly chart
- Vitest for unit tests, Playwright for end to end tests
- GitHub Actions runs lint, type checks, both test suites and a production build on every push

## Running it locally

Needs Node 22+.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed    # optional, fills the board with example data
npm run dev
```

Then open http://localhost:3000.

The database is a single file at `data/jobtrail.db`. Delete it if you want to start over.

### With Docker

```bash
docker build -t jobtrail .
docker run -p 3000:3000 -v jobtrail-data:/data jobtrail
```

Migrations run when the server starts (see `src/instrumentation.ts`), so a fresh volume works without any extra steps.

## Scripts

| Command                              | What it does                                             |
| ------------------------------------ | -------------------------------------------------------- |
| `npm run dev`                        | Dev server                                               |
| `npm run build` / `npm start`        | Production build and server                              |
| `npm test`                           | Unit tests (Vitest)                                      |
| `npm run test:e2e`                   | Browser tests (Playwright). Run `npm run build` first.   |
| `npm run lint` / `npm run typecheck` | ESLint and `tsc`                                         |
| `npm run db:generate`                | Create a new migration after changing `src/db/schema.ts` |
| `npm run db:migrate`                 | Apply migrations                                         |
| `npm run db:seed`                    | Reset the database to the example data                   |
| `npm run db:studio`                  | Browse the database with Drizzle Studio                  |

## How it's laid out

```
src/
  app/            routes and server actions (actions.ts)
  components/     client components: board, forms, chart
  db/             schema, queries, migrate and seed scripts
  lib/            plain TypeScript with no framework code: validation, stats, formatting
drizzle/          generated SQL migrations
e2e/              Playwright tests
```

The stats math lives in `src/lib/stats.ts` and doesn't touch the database or React, which made it easy to unit test. The trickiest part was deciding what counts as "reaching" a stage. A rejected application has no stage of its own, so the funnel looks at its history to see how far it got before the rejection.

## Things I might add

- Import from a CSV (mostly so I can move my old spreadsheet over)
- Reminders for follow-ups instead of just the quiet tag
- Auth, if I ever host it somewhere other than my own machine

## License

MIT
