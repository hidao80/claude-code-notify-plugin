#!/usr/bin/env node
/**
 * notify.mjs — Claude Code Stop hook completion notification script
 *
 * Notification method by OS:
 *   Windows 10/11  : SnoreToast (binary bundled with node-notifier)
 *   macOS >= 10.14 : Notification Center (terminal-notifier)
 *   Linux          : libnotify (notify-send)
 *
 * node-notifier is run on-demand via pnpm dlx / npx (version-pinned).
 * No pre-installation required. Download only happens on the first run.
 *
 * Usage:
 *   node notify.mjs                                # receive stop hook JSON from stdin
 *   node notify.mjs --title "Done" --message "OK"  # specify message directly
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ── Constants ─────────────────────────────────────────────────────────────────
/** Unicode-escaped emoji map — avoids literal multibyte chars in source */
export const EMOJI = {
  end_turn:      "\u2705",         // ✅
  error:         "\u274C",         // ❌
  stop_sequence: "\uD83D\uDED1",   // 🛑
};

/** node-notifier package with pinned version to reduce supply-chain risk */
const NOTIFIER_PACKAGE = "node-notifier@6.0.0";

// ── Argument parsing ──────────────────────────────────────────────────────────
/**
 * Extract the value of a named CLI flag from an argument list.
 * @param {string[]} argv - Argument array (e.g. process.argv.slice(2))
 * @param {string}   flag - Flag name including leading dashes (e.g. "--title")
 * @returns {string|null} The value following the flag, or null if absent
 */
export function getArg(argv, flag) {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}

// ── Stop hook JSON parsing ────────────────────────────────────────────────────
/**
 * Parse a raw string as Claude Code Stop hook JSON.
 * Returns an empty object on empty input, parse errors, or non-object values.
 * @param {string} raw
 * @returns {Record<string, unknown>}
 */
export function parseHookData(raw) {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw.trim());
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Read and parse Claude Code Stop hook JSON from a file descriptor.
 * Returns an empty object if the fd is unavailable or contains non-JSON.
 * @param {number} [fd=0] - File descriptor (0 = stdin)
 * @returns {Record<string, unknown>}
 */
export function readHookData(fd = 0) {
  try {
    return parseHookData(readFileSync(fd, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Extract and type-validate stop_reason and session_id from hook data.
 * Non-string values are replaced with safe defaults.
 * @param {Record<string, unknown>} hookData
 * @returns {{ stopReason: string, sessionId: string }}
 */
export function extractHookFields(hookData) {
  const stopReason = typeof hookData.stop_reason === "string" ? hookData.stop_reason : "completed";
  const rawSessionId = typeof hookData.session_id === "string" ? hookData.session_id : "";
  const sessionId = rawSessionId.slice(0, 8) || "unknown";
  return { stopReason, sessionId };
}

// ── Notification parameters ───────────────────────────────────────────────────
/**
 * Resolve notification title and message from CLI args and hook data.
 * CLI arguments take precedence over defaults derived from hook data.
 * @param {string[]} argv       - process.argv.slice(2)
 * @param {string}   stopReason
 * @param {string}   sessionId
 * @returns {{ title: string, message: string }}
 */
export function buildNotification(argv, stopReason, sessionId) {
  const emoji   = EMOJI[stopReason] ?? EMOJI.end_turn;
  const title   = getArg(argv, "--title")   ?? "Claude Code";
  const message = getArg(argv, "--message") ??
    `${emoji} Task complete  [${stopReason}]  session: ${sessionId}`;
  return { title, message };
}

// ── Notification dispatch ─────────────────────────────────────────────────────
/**
 * Inline Node.js script executed inside the node-notifier process.
 *
 * SECURITY: Title and message are injected via environment variables
 * (NOTIFY_TITLE / NOTIFY_MESSAGE), NOT via --eval string interpolation.
 * This prevents U+2028 / U+2029 code injection attacks that bypass
 * JSON.stringify() escaping.
 */
const INLINE_SCRIPT = `
const notifier = require('node-notifier');
notifier.notify(
  { title: process.env.NOTIFY_TITLE, message: process.env.NOTIFY_MESSAGE, sound: false, wait: false },
  (err) => { if (err) process.stderr.write('[claude-code-notify] ' + String(err) + '\\n'); process.exit(0); }
);
setTimeout(() => process.exit(0), 6000);
`;

/**
 * Send a desktop notification using the first available runner (pnpm dlx, npx).
 * Title and message are passed via environment variables to avoid injection risks.
 *
 * Timeout layering (intentional):
 *   hooks.json framework timeout : 15 s  (outer limit set by Claude Code)
 *   execFileSync timeout          : 12 s  (process-level hard limit)
 *   notifier setTimeout           :  6 s  (inner exit guard for hung notifiers)
 *
 * @param {string} title
 * @param {string} message
 * @returns {boolean} true if at least one runner succeeded
 */
export function sendNotification(title, message) {
  const runners = [
    ["pnpm", ["dlx", `--package=${NOTIFIER_PACKAGE}`, "node", "--eval", INLINE_SCRIPT]],
    ["npx",  ["-y",  `--package=${NOTIFIER_PACKAGE}`, "node", "--eval", INLINE_SCRIPT]],
  ];

  return runners.some(([bin, runArgs]) => {
    try {
      execFileSync(bin, runArgs, {
        stdio:       ["ignore", "inherit", "pipe"],
        timeout:     12000,
        windowsHide: true,
        env:         { ...process.env, NOTIFY_TITLE: title, NOTIFY_MESSAGE: message },
      });
      return true;
    } catch (e) {
      const stderr = e.stderr?.toString().trim();
      if (stderr) process.stderr.write(`[claude-code-notify] ${bin} failed: ${stderr}\n`);
      return false;
    }
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────
// Guard prevents main logic from running when this module is imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hookData = readHookData(0);
  const { stopReason, sessionId } = extractHookFields(hookData);
  const { title, message } = buildNotification(process.argv.slice(2), stopReason, sessionId);

  const notified = sendNotification(title, message);
  if (!notified) {
    process.stderr.write("[claude-code-notify] Failed to send notification (both pnpm and npx failed)\n");
  }

  // Always exit 0 to avoid interrupting Stop hooks
  process.exit(0);
}
