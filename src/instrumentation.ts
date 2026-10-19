// Runs once when the server boots. Applying migrations here means a fresh
// deploy (or a new Docker volume) just works without a separate step.
export async function register() {
  // The import has to sit inside this check, otherwise the edge bundle tries
  // to pull in node-only modules and the dev server falls over.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
