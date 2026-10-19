import { describe, expect, it } from "vitest";
import { applicationSchema } from "./validation";

const base = { company: "Linear", role: "Frontend Engineer" };

describe("applicationSchema", () => {
  it("turns blank optional fields into undefined", () => {
    const result = applicationSchema.parse({ ...base, location: "  ", url: "", salaryMin: "" });
    expect(result.location).toBeUndefined();
    expect(result.url).toBeUndefined();
    expect(result.salaryMin).toBeUndefined();
    expect(result.status).toBe("wishlist");
  });

  it("parses salaries written the way people actually write them", () => {
    const result = applicationSchema.parse({ ...base, salaryMin: "120k", salaryMax: "$150,000" });
    expect(result.salaryMin).toBe(120_000);
    expect(result.salaryMax).toBe(150_000);
  });

  it("rejects a max salary below the min", () => {
    const result = applicationSchema.safeParse({
      ...base,
      salaryMin: "150000",
      salaryMax: "90000",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["salaryMax"]);
  });

  it("requires company and role", () => {
    const result = applicationSchema.safeParse({ company: " ", role: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(["company", "role"]);
  });

  it("rejects junk salary input", () => {
    expect(applicationSchema.safeParse({ ...base, salaryMin: "lots" }).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(applicationSchema.safeParse({ ...base, status: "hired" }).success).toBe(false);
  });
});
