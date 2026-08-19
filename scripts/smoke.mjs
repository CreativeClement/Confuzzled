#!/usr/bin/env node

const BASE = process.env.SMOKE_URL ?? "http://127.0.0.1:3000";

const ROUTES = [
  { path: "/", mustInclude: ["Confuzzled", "Unconfuzzle this"] },
  { path: "/about", mustInclude: ["Confuzzled"] },
  { path: "/honesty", mustInclude: ["honest"] },
  { path: "/privacy", mustInclude: ["browser"] },
  { path: "/manifest.webmanifest", mustInclude: ["Confuzzled"] },
  { path: "/api/health", mustInclude: ["\"ok\""] },
];

async function main() {
  for (const route of ROUTES) {
    const response = await fetch(`${BASE}${route.path}`, { redirect: "follow" });
    if (!response.ok) {
      throw new Error(`${route.path} returned ${response.status}`);
    }
    const body = await response.text();
    for (const needle of route.mustInclude) {
      if (!body.includes(needle)) {
        throw new Error(`${route.path} missing ${JSON.stringify(needle)}`);
      }
    }
    console.log(`ok ${route.path}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
