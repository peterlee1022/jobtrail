import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple table", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quotes, commas and line breaks inside fields", () => {
    const text = 'name,notes\n"Acme, Inc.","said ""hi""\nthen left"\n';
    expect(parseCsv(text)).toEqual([
      ["name", "notes"],
      ["Acme, Inc.", 'said "hi"\nthen left'],
    ]);
  });

  it("copes with CRLF, a BOM and blank trailing rows", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r\n,\r\n\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps empty fields", () => {
    expect(parseCsv("a,,c")).toEqual([["a", "", "c"]]);
  });
});

describe("toCsv", () => {
  it("quotes only when needed", () => {
    expect(toCsv([["plain", "with, comma", 'a "quote"', 42, null]])).toBe(
      'plain,"with, comma","a ""quote""",42,\r\n',
    );
  });

  it("neutralizes values that a spreadsheet would run as formulas", () => {
    expect(toCsv([["=HYPERLINK(1)", "@cmd", "fine"]])).toBe("'=HYPERLINK(1),'@cmd,fine\r\n");
  });

  it("round trips through the parser", () => {
    const rows = [
      ["Company", "Notes"],
      ["Acme, Inc.", 'Line one\nLine "two"'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
