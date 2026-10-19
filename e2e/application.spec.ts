import { expect, test } from "@playwright/test";

test("filter narrows the board down", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Filter by company/).fill("remote");

  await expect(page.getByRole("link", { name: /Shopify/ })).toBeVisible();
  // Stripe is in Seattle, so it should be filtered out
  await expect(page.getByRole("link", { name: /Stripe/ })).toBeHidden();
});

test("edit form validates and keeps what was typed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Notion/ }).click();
  await expect(page.getByRole("heading", { name: "Notion" })).toBeVisible();

  await page.getByLabel("Salary min").fill("200k");
  await page.getByLabel("Salary max").fill("150k");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Max should be at least the min")).toBeVisible();
  await expect(page.getByLabel("Salary min")).toHaveValue("200k");

  await page.getByLabel("Salary max").fill("250k");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  await page.getByRole("link", { name: /Back to board/ }).click();
  await expect(page.getByRole("link", { name: /Notion/ })).toContainText("$200K - $250K");
});

test("deleting an application removes it from the board", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /GitLab/ }).click();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete application" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: /GitLab/ })).toBeHidden();
});

test("unknown applications show the not found page", async ({ page }) => {
  const response = await page.goto("/applications/99999");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Nothing here")).toBeVisible();
});
