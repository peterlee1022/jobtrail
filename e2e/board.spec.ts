import { expect, test } from "@playwright/test";

test("add an application and move it through the board", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Board" })).toBeVisible();

  await page.getByRole("button", { name: "Add application" }).click();
  const dialog = page.getByRole("dialog");

  // Validation runs on the server, so this checks the round trip too
  await dialog.getByRole("button", { name: "Add" }).click();
  await expect(dialog.getByText("Company is required")).toBeVisible();

  await dialog.getByLabel("Company").fill("Acme Corp");
  await dialog.getByLabel("Role").fill("Platform Engineer");
  await dialog.getByLabel("Salary min").fill("130k");
  await dialog.getByRole("button", { name: "Add" }).click();
  await expect(dialog).toBeHidden();

  const wishlist = page.locator("section", {
    has: page.getByRole("heading", { name: /Wishlist/ }),
  });
  const applied = page.locator("section", { has: page.getByRole("heading", { name: /^Applied/ }) });
  const card = page.getByRole("link", { name: /Acme Corp/ });

  await expect(wishlist.getByRole("link", { name: /Acme Corp/ })).toBeVisible();

  await card.dragTo(applied, { steps: 10 });
  await expect(applied.getByRole("link", { name: /Acme Corp/ })).toBeVisible();

  // Survives a reload, so it really was saved
  await page.reload();
  await expect(applied.getByRole("link", { name: /Acme Corp/ })).toBeVisible();

  await applied.getByRole("link", { name: /Acme Corp/ }).click();
  await expect(page.getByText("Moved from Wishlist to Applied")).toBeVisible();
});

test("notes show up in the activity feed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Ramp/ }).click();

  await page.getByPlaceholder(/Add a note/).fill("Followed up with the recruiter on LinkedIn");
  await page.getByRole("button", { name: "Add note" }).click();

  await expect(page.getByText("Followed up with the recruiter on LinkedIn")).toBeVisible();
});

test("stats page renders the pipeline", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByText("Applications sent")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
});
