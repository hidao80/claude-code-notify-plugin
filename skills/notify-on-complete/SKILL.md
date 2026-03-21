---
description: Sends OS-native notifications when a Claude Code task completes. Works on Windows, macOS, and Linux. Invoke when you want to be alerted on completion during long-running tasks or while working in another window.
---

# notify-on-complete Skill

## Purpose

Notify the user via desktop notification when a Claude Code task completes.
The primary use case is **automatic firing** via Stop hook, but **manual invocation** at milestone completion is also supported.

## Supported Environments

| OS | Notification Method |
|----|---------------------|
| Windows 10/11 | SnoreToast (bundled with node-notifier) |
| macOS ≥ 10.14 | Notification Center |
| Linux | notify-send (libnotify) |

**Common requirements**: Node.js ≥ 18 + pnpm or npx

## Manual Invocation Examples

```bash
# Default notification
node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs"

# Custom message
node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs" --title "Claude Code" --message "✅ Build complete"

# Failure notification
node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs" --title "Claude Code" --message "❌ Tests failed — action required"
```

## Troubleshooting

**Windows**: Go to System Settings → Notifications and verify that the SnoreToast banner is enabled.

**Linux**: `sudo apt install libnotify-bin` (Ubuntu) / `sudo dnf install libnotify` (Fedora)

**Slow on first run**: pnpm dlx downloads node-notifier on the first run, which takes a few seconds. Subsequent runs use the cache and are fast.
