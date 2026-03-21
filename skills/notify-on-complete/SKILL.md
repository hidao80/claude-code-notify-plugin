---
description: Claude Code のタスク完了時に OS ネイティブ通知を送る。Windows / macOS / Linux 共通。長時間処理や別ウィンドウ作業中に完了を知らせたいときに呼び出す。
---

# notify-on-complete Skill

## 目的

Claude Code のタスクが完了したとき、デスクトップ通知でユーザーに知らせる。
Stop hook による**自動発火**が主な用途だが、マイルストーン完了時の**手動呼び出し**にも対応する。

## 動作環境

| OS | 通知方式 |
|----|---------|
| Windows 10/11 | SnoreToast（node-notifier 同梱） |
| macOS ≥ 10.14 | Notification Center |
| Linux | notify-send (libnotify) |

**共通要件**: Node.js ≥ 18 + pnpm または npx

## 手動呼び出し例

```bash
# 標準通知
node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs"

# メッセージ指定
node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs" --title "Claude Code" --message "✅ ビルド完了"

# 失敗通知
node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs" --title "Claude Code" --message "❌ テスト失敗 — 要確認"
```

## トラブルシューティング

**Windows**: システム設定 → 通知 で SnoreToast のバナーが有効か確認。

**Linux**: `sudo apt install libnotify-bin` (Ubuntu) / `sudo dnf install libnotify` (Fedora)

**初回が遅い**: pnpm dlx が node-notifier をダウンロードするため数秒かかる。2回目以降はキャッシュで高速。
