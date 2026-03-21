#!/usr/bin/env node
/**
 * notify.mjs — Claude Code Stop hook 完了通知スクリプト
 *
 * OS別通知方式:
 *   Windows 10/11  : SnoreToast (node-notifier 同梱バイナリ)
 *   macOS >= 10.14 : Notification Center (terminal-notifier)
 *   Linux          : libnotify (notify-send)
 *
 * node-notifier は pnpm dlx / npx でオンデマンド実行。
 * 事前インストール不要。初回のみダウンロードが走る。
 *
 * 使い方:
 *   node notify.mjs                              # stdin から stop hook JSON を受け取る
 *   node notify.mjs --title "完了" --message "OK" # メッセージを直接指定
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// ── 引数パース ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

// ── stdin から Stop hook JSON を受け取る ────────────────────────────────────
let hookData = {};
try {
  // /dev/stdin はWindowsでは使えないため process.stdin のfdを使う
  const raw = readFileSync(0, "utf8").trim();   // fd 0 = stdin（クロスプラットフォーム）
  if (raw) hookData = JSON.parse(raw);
} catch {
  // stdin なし・非JSON・パイプなしは無視
}

const stopReason = hookData.stop_reason ?? "completed";
const sessionId = (hookData.session_id ?? "").slice(0, 8) || "unknown";

const EMOJI = { end_turn: "✅", error: "❌", stop_sequence: "🛑" };
const emoji = EMOJI[stopReason] ?? "✅";

const title = getArg("--title") ?? "Claude Code";
const message = getArg("--message") ?? `${emoji} 処理完了  [${stopReason}]  session: ${sessionId}`;

// ── node-notifier をインライン eval で実行 ──────────────────────────────────
// pnpm dlx / npx が node-notifier を自動インストールして node --eval で実行する。
// このファイル自体は Node.js 標準 API のみ使用。
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
  process.stderr.write(`[claude-code-notify] 通知送信失敗 (pnpm/npx どちらも失敗)\n`);
}

// Stop hook を妨げないよう常に exit 0
process.exit(0);
