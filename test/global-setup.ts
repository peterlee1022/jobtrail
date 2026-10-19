import { rmSync } from "node:fs";

// Each test run starts from an empty database file
export default function setup() {
  rmSync("data/test.db", { force: true });
}
