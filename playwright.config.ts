import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  // All tests share one seeded database
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Runs against the production build with its own throwaway database
    command: `npm run db:migrate && npm run db:seed && npx next start -p ${port}`,
    port,
    env: { DATABASE_URL: "file:data/e2e.db" },
    reuseExistingServer: false,
  },
});
