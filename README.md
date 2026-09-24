# 真誓会 Connect

協議会の案件、タスク、コメント、関連資料をまとめて確認するためのダッシュボードです。

## ローカルで確認する

Node.js 22 以上を用意し、次のコマンドを実行します。

```bash
npm install
npm run dev
```

ターミナルに表示される URL（通常は `http://localhost:5173`）をブラウザで開いてください。

## GitHub Pages にデモを公開する

このリポジトリには GitHub Pages 用のワークフローが含まれています。

1. GitHub のリポジトリ画面で **Settings → Pages** を開きます。
2. **Build and deployment** の **Source** を **GitHub Actions** に変更します。
3. この変更を `main` ブランチへマージ、または push します。
4. **Actions** タブの **Deploy demo to GitHub Pages** が完了するまで待ちます。
5. 完了後、ワークフロー画面または **Settings → Pages** に表示される URL を開きます。

> **重要:** Source が **Deploy from a branch** のままだと、未変換の JSX がそのまま配信されるため画面を表示できません。必ず **GitHub Actions** を選択してください。

公開 URL は通常、次の形式です。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/
```

手動で再公開する場合は、GitHub の **Actions → Deploy demo to GitHub Pages → Run workflow** を選択してください。

### 白い画面になる場合

1. **Settings → Pages → Source** が **GitHub Actions** になっているか確認します。
2. **Actions → Deploy demo to GitHub Pages** を開き、最新の実行に緑色のチェックが付いているか確認します。
3. 失敗している場合は実行ログを確認し、修正後に **Run workflow** で再実行します。
4. デプロイ成功後、ブラウザでスーパーリロード（Windows: `Ctrl + Shift + R`、Mac: `Command + Shift + R`）します。

GitHub Pages にはリポジトリ直下のソースではなく、ワークフローが生成した `dist` を公開する必要があります。

## 本番用ビルド

```bash
npm run build
npm run preview
```

生成物は `dist` ディレクトリに出力されます。
