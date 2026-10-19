// Plain JS on purpose: a .ts config makes `next start` try to install
// TypeScript at runtime, which the production Docker image doesn't have.

/** @type {import("next").NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
