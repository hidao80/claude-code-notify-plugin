# claude-code-notify - Claude Code Completion Sound Hook

A Claude Code plugin that plays a completion sound when the CLI finishes.

`hooks/hooks.json` dispatches directly to an OS-specific helper:

- Windows 11: `hooks/play-sound.bat`
- macOS: `hooks/play-sound.sh` via `afplay` or `osascript`
- Linux desktop: `hooks/play-sound.sh` via `paplay`, `pw-play`, `canberra-gtk-play`, `aplay`, or `speaker-test`

## Installation

### 1. Register marketplace and install the Claude plugin

```bash
/plugin marketplace add https://github.com/hidao80/claude-code-notify-plugin
/plugin install claude-code-notify@hidao80-plugins
```

No editor extension is required. Once the plugin is installed, the Stop hook will try to play a sound locally on the machine where Claude Code is running.

## Usage

When Claude Code reaches the `Stop` hook, `hooks/hooks.json` runs a small inline command that selects `play-sound.bat` on Windows and `play-sound.sh` on macOS/Linux.

The helper scripts ignore hook stdin and just play a local completion sound.

You can also smoke-test the hook manually:

Windows:

```bat
hooks\play-sound.bat
```

macOS / Linux:

```bash
bash hooks/play-sound.sh
```

## File Structure

```text
claude-code-notify-plugin/
|-- .claude-plugin/
|   |-- plugin.json
|   `-- marketplace.json
|-- hooks/
|   |-- hooks.json
|   |-- play-sound.bat
|   `-- play-sound.sh
`-- README.md
```

## Troubleshooting

**No sound on Windows 11**: Confirm PowerShell is available at the standard Windows PowerShell path.

**No sound on macOS**: Check that `afplay` or `osascript` is available.

**No sound on Linux desktop**: Install one of `paplay`, `pw-play`, `canberra-gtk-play`, `aplay`, or `speaker-test`.

**Hook not firing**: Run `claude --debug` and check whether `claude-code-notify` appears in `loading plugin`.

## License

MIT
