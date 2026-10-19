import { expect, test } from "@playwright/test";

test("import a CSV and see the rows on the board", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Import from CSV" });

  await dialog.getByLabel("CSV file").setInputFiles({
    name: "old-spreadsheet.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      [
        "Employer,Job Title,Stage,Date Applied",
        "Initech,Software Engineer,Interviewing,9/20/2026",
        "Globex,Backend Engineer,Who knows,",
      ].join("\n"),
    ),
  });
  await dialog.getByRole("button", { name: "Import" }).click();

  await expect(dialog.getByRole("status")).toHaveText("Imported 1 application, skipped 1.");
  await expect(dialog.getByText('Line 3: Unknown status "Who knows"')).toBeVisible();

  await dialog.getByRole("button", { name: "Done" }).click();
  const interviewing = page.locator("section", {
    has: page.getByRole("heading", { name: /Interviewing/ }),
  });
  await expect(interviewing.getByRole("link", { name: /Initech/ })).toBeVisible();
});

test("export downloads everything as CSV", async ({ page }) => {
  await page.goto("/");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export" }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^jobtrail-\d{4}-\d{2}-\d{2}\.csv$/);
  const text = await (
    await download.createReadStream()
  )
    .toArray()
    .then((chunks) => Buffer.concat(chunks).toString());
  expect(text.split("\r\n")[0]).toBe(
    "Company,Role,Location,Status,Salary min,Salary max,Job posting,Applied,Notes",
  );
  expect(text).toContain('Shopify,"Developer, Checkout",Remote,Offer');
});
