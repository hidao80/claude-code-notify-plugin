#!/usr/bin/env node
/**
 * notify.mjs — Claude Code Stop hook completion notification script
 *
 * Notification method by OS:
 *   Windows 10/11  : SnoreToast (binary bundled with node-notifier)
 *   macOS >= 10.14 : Notification Center (terminal-notifier)
 *   Linux          : libnotify (notify-send)
 *
 * node-notifier is run on-demand via pnpm dlx / npx.
 * No pre-installation required. Download only happens on the first run.
 *
 * Usage:
 *   node notify.mjs                                # receive stop hook JSON from stdin
 *   node notify.mjs --title "Done" --message "OK"  # specify message directly
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// ── Argument parsing ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

// ── Read Stop hook JSON from stdin ──────────────────────────────────────────
let hookData = {};
try {
  // /dev/stdin is not available on Windows, so use process.stdin fd directly
  const raw = readFileSync(0, "utf8").trim();   // fd 0 = stdin (cross-platform)
  if (raw) hookData = JSON.parse(raw);
} catch {
  // No stdin, non-JSON, or no pipe — ignore
}

const stopReason = hookData.stop_reason ?? "completed";
const sessionId = (hookData.session_id ?? "").slice(0, 8) || "unknown";

const EMOJI = { end_turn: "✅", error: "❌", stop_sequence: "🛑" };
const emoji = EMOJI[stopReason] ?? "✅";

const title = getArg("--title") ?? "Claude Code";
const message = getArg("--message") ?? `${emoji} Task complete  [${stopReason}]  session: ${sessionId}`;

// ── Run node-notifier via inline eval ───────────────────────────────────────
// pnpm dlx / npx auto-installs node-notifier and runs it with node --eval.
// This file itself only uses the Node.js standard API.
const inlineScript = `
const notifier = require('node-notifier');
notifier.notify(
  { title: ${JSON.stringify(title)}, message: ${JSON.stringify(message)}, sound: false, wait: false },
  (err) => { if (err) process.stderr.write('[claude-code-notify] ' + String(err) + '\\n'); process.exit(0); }
);
setTimeout(() => process.exit(0), 6000);
`;

const runners = [
  ["pnpm", ["dlx", "--package=node-notifier", "node", "--eval", inlineScript]],
  ["npx", ["-y", "--package=node-notifier", "node", "--eval", inlineScript]],
];

let notified = false;
for (const [bin, runArgs] of runners) {
  try {
    execFileSync(bin, runArgs, {
      stdio: ["ignore", "inherit", "pipe"],
      timeout: 12000,
      windowsHide: true,
    });
    notified = true;
    break;
  } catch (e) {
    const stderr = e.stderr?.toString().trim();
    if (stderr) process.stderr.write(`[claude-code-notify] ${bin} failed: ${stderr}\n`);
  }
}

if (!notified) {
  process.stderr.write(`[claude-code-notify] Failed to send notification (both pnpm and npx failed)\n`);
}

// Always exit 0 to avoid interrupting Stop hooks
process.exit(0);
