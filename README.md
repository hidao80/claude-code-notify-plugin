# claude-code-notify — Claude Code Completion Notification Plugin

A Claude Code plugin that sends OS-native notifications when tasks complete.

| OS | Notification Method |
|----|---------------------|
| Windows 10/11 | SnoreToast (WinRT Toast) |
| macOS ≥ 10.14 | Notification Center |
| Linux | notify-send (libnotify) |

Runs `node-notifier` on-demand via `pnpm dlx` / `npx` — **no pre-installation required**.

---

## Installation

### 1. Register marketplace and install (recommended)

```bash
# Add marketplace (replace GitHub URL with the actual repository)
/plugin marketplace add https://github.com/hidao/claude-code-notify-plugin

# Install the plugin
/plugin install claude-code-notify@claude-code-notify-marketplace

# Or via CLI (user scope)
claude plugin install claude-code-notify@claude-code-notify-marketplace

# Project scope (team shared)
claude plugin install claude-code-notify@claude-code-notify-marketplace --scope project
```

### 2. Try locally (no installation)

```bash
git clone https://github.com/hidao/claude-code-notify-plugin
claude --plugin-dir ./claude-code-notify-plugin
```

### 3. Manual setup

```bash
git clone https://github.com/hidao/claude-code-notify-plugin ~/.claude/plugins/claude-code-notify
```

---

## Usage

After installation, **nothing else is needed**. Notifications fire automatically whenever Claude Code completes a task.

To send a notification manually:

```bash
node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs" --title "Done" --message "✅ Build succeeded"
```

---

## File Structure

```
claude-code-notify-plugin/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── marketplace.json     # Marketplace catalog
├── hooks/
│   ├── hooks.json           # Stop hook configuration
│   └── notify.mjs           # Notification script
├── agents/
│   └── claude-code-notify-agent.md   # Notification sub-agent definition
├── skills/
│   └── notify-on-complete/
│       └── SKILL.md         # /notify-on-complete skill
└── README.md
```

---

## Troubleshooting

**Windows**: Go to Settings → Notifications → Apps and enable the `SnoreToast` banner.

**Linux**: Install `sudo apt install libnotify-bin`.

**Slow on first run**: pnpm dlx downloads node-notifier on the first run, which takes a few seconds. Subsequent runs use the cache.

**Hook not firing**: Run `claude --debug` and check whether `claude-code-notify` appears in `loading plugin`.

---

## License

MIT
