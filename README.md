# claude-code-notify — Claude Code 完了通知プラグイン

Claude Code のタスク完了時に OS ネイティブ通知を送る Claude Code プラグイン。

| OS | 通知方式 |
|----|---------|
| Windows 10/11 | SnoreToast (WinRT Toast) |
| macOS ≥ 10.14 | Notification Center |
| Linux | notify-send (libnotify) |

`node-notifier` を `pnpm dlx` / `npx` でオンデマンド実行するため、**事前インストール不要**。

---

## インストール

### 1. マーケットプレイスを登録してインストール（推奨）

```bash
# マーケットプレイスを追加（GitHub URL は実際のリポジトリに変更）
/plugin marketplace add https://github.com/hidao/claude-code-notify-plugin

# プラグインをインストール
/plugin install claude-code-notify@claude-code-notify-marketplace

# または CLI で（ユーザースコープ）
claude plugin install claude-code-notify@claude-code-notify-marketplace

# プロジェクトスコープ（チーム共有）
claude plugin install claude-code-notify@claude-code-notify-marketplace --scope project
```

### 2. ローカルで試す（インストールなし）

```bash
git clone https://github.com/hidao/claude-code-notify-plugin
claude --plugin-dir ./claude-code-notify-plugin
```

### 3. 手動配置

```bash
git clone https://github.com/hidao/claude-code-notify-plugin ~/.claude/plugins/claude-code-notify
```

---

## 使い方

インストール後は **何もしなくて OK**。Claude Code がタスクを完了するたびに自動で通知が飛ぶ。

手動で通知を送りたい場合：

```bash
node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs" --title "完了" --message "✅ ビルド成功"
```

---

## ファイル構成

```
claude-code-notify-plugin/
├── .claude-plugin/
│   ├── plugin.json          # プラグインマニフェスト
│   └── marketplace.json     # マーケットプレイスカタログ
├── hooks/
│   ├── hooks.json           # Stop hook 設定
│   └── notify.mjs           # 通知スクリプト本体
├── agents/
│   └── claude-code-notify-agent.md   # 通知サブエージェント定義
├── skills/
│   └── notify-on-complete/
│       └── SKILL.md         # /notify-on-complete スキル
└── README.md
```

---

## トラブルシューティング

**Windows**: 設定 → 通知 → アプリ で `SnoreToast` のバナーを有効化。

**Linux**: `sudo apt install libnotify-bin` が必要。

**初回が遅い**: pnpm dlx が node-notifier をダウンロードするため初回のみ数秒かかる。

**hook が動かない**: `claude --debug` で `claude-code-notify` が `loading plugin` に出るか確認。

---

## ライセンス

MIT
