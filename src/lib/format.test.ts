import { describe, expect, it } from "vitest";
import { formatSalary, timeAgo } from "./format";

describe("formatSalary", () => {
  it("formats a range", () => {
    expect(formatSalary(120_000, 150_000)).toBe("$120K - $150K");
  });

  it("handles one side missing", () => {
    expect(formatSalary(90_000, null)).toBe("$90K+");
    expect(formatSalary(null, 200_000)).toBe("up to $200K");
  });

  it("returns null with nothing to show", () => {
    expect(formatSalary(null, null)).toBeNull();
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-01T12:00:00Z");

  it("says just now for anything under a minute", () => {
    expect(timeAgo(new Date("2026-10-01T11:59:30Z"), now)).toBe("just now");
  });

  it("uses the largest whole unit", () => {
    expect(timeAgo(new Date("2026-09-28T12:00:00Z"), now)).toBe("3 days ago");
  });
});
