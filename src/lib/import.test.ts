import { describe, expect, it } from "vitest";
import { MAX_IMPORT_ROWS, mapImportRows } from "./import";

describe("mapImportRows", () => {
  it("matches loosely named columns", () => {
    const { rows, errors } = mapImportRows([
      ["Employer", "Job Title", "Date Applied", "Stage", "Comments"],
      ["Acme", "Engineer", "2026-09-01", "Phone screen", "Talked to Sam"],
    ]);

    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      company: "Acme",
      role: "Engineer",
      status: "screening",
      notes: "Talked to Sam",
    });
    expect(rows[0].appliedAt?.getDate()).toBe(1);
  });

  it("splits a salary range column", () => {
    const { rows } = mapImportRows([
      ["Company", "Role", "Salary"],
      ["Acme", "Engineer", "120k - 150k"],
      ["Beta", "Engineer", "$90,000 to $110,000"],
    ]);
    expect(rows.map((r) => [r.salaryMin, r.salaryMax])).toEqual([
      [120_000, 150_000],
      [90_000, 110_000],
    ]);
  });

  it("picks a sensible status when the column is missing", () => {
    const { rows } = mapImportRows([
      ["Company", "Role", "Applied"],
      ["Acme", "Engineer", "9/15/2026"],
      ["Beta", "Engineer", ""],
    ]);
    expect(rows.map((r) => r.status)).toEqual(["applied", "wishlist"]);
    expect(rows[1].appliedAt).toBeNull();
  });

  it("fills in an applied date for rows past the wishlist", () => {
    const { rows } = mapImportRows([
      ["Company", "Role", "Status"],
      ["Acme", "Engineer", "Interviewing"],
    ]);
    expect(rows[0].appliedAt).toBeInstanceOf(Date);
  });

  it("reports bad rows by line number and keeps the good ones", () => {
    const { rows, errors } = mapImportRows([
      ["Company", "Role", "Status", "Applied"],
      ["Acme", "Engineer", "", ""],
      ["", "Engineer", "", ""],
      ["Beta", "Engineer", "Hired", ""],
      ["Gamma", "Engineer", "", "last tuesday"],
    ]);

    expect(rows.map((r) => r.company)).toEqual(["Acme"]);
    expect(errors).toEqual([
      { line: 3, message: "Company is required" },
      { line: 4, message: 'Unknown status "Hired"' },
      { line: 5, message: 'Couldn\'t read the date "last tuesday"' },
    ]);
  });

  it("refuses files without company and role columns", () => {
    const { rows, errors } = mapImportRows([
      ["Name", "Notes"],
      ["Acme", "hi"],
    ]);
    expect(rows).toEqual([]);
    expect(errors[0].message).toMatch(/Company/);
  });

  it("refuses huge files", () => {
    const body = Array.from({ length: MAX_IMPORT_ROWS + 1 }, () => ["Acme", "Engineer"]);
    expect(mapImportRows([["Company", "Role"], ...body]).errors).toHaveLength(1);
  });
});
