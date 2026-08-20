#!/usr/bin/env node
/**
 * Rasterize public/logo.svg into the PWA icon PNGs using headless Chrome,
 * the only SVG rasterizer available in this environment.
 *
 * Usage: node scripts/make-icons.mjs
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_BIN ?? "google-chrome";

const ROOT = new URL("..", import.meta.url).pathname;
const svg = readFileSync(join(ROOT, "public/logo.svg"), "utf8");

const TARGETS = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
];

function render({ file, size }) {
  const work = mkdtempSync(join(tmpdir(), "cz-icon-"));
  const page = join(work, "icon.html");
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;padding:0;background:#000;}
      svg{display:block;width:${size}px;height:${size}px;}
    </style>${svg}`,
  );

  const out = join(ROOT, file);
  // Headless Chrome writes the screenshot but does not always exit on its own
  // here, so cap it with `timeout` and judge success by the file it produced.
  try {
    execFileSync(
      "timeout",
      [
        "25",
        CHROME,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--disable-component-update",
        "--hide-scrollbars",
        "--virtual-time-budget=2000",
        `--user-data-dir=${join(work, "profile")}`,
        "--force-device-scale-factor=1",
        `--window-size=${size},${size}`,
        `--screenshot=${out}`,
        `file://${page}`,
      ],
      { stdio: "ignore" },
    );
  } catch {
    /* timeout kill is expected */
  }

  rmSync(work, { recursive: true, force: true });

  const bytes = statSync(out).size;
  if (bytes < 500) {
    throw new Error(`${file} looks empty (${bytes} bytes)`);
  }
  console.log(`wrote ${file} (${size}x${size}, ${bytes} bytes)`);
}

for (const target of TARGETS) {
  render(target);
}
