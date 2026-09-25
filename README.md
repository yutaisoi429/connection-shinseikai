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

## バックエンド設計

本番実装に必要なAPI、データモデル、複数担当者、メンション、通知ジョブ、
ファイル管理、権限・セキュリティの設計は [`docs/BACKEND_DESIGN.md`](docs/BACKEND_DESIGN.md) を参照してください。

## バックエンドAPIを起動する

追加依存なしのNode.js APIを同梱しています。別のターミナルで次を実行してください。

```bash
npm run server
```

既定では `http://localhost:3000` で起動し、データを `data/database.json` に保存します。
`PORT`、`DATA_FILE`、`CORS_ORIGIN` 環境変数で設定を変更できます。APIテストは `npm test` で実行します。

## デモ版のファイル対応状況

案件画面から **PDF、PowerPoint（`.ppt` / `.pptx`）、Excel（`.xls` / `.xlsx`）、Word（`.doc` / `.docx`）、画像（`.png` / `.jpg` / `.jpeg`）** をアップロードできます。API接続時はMIMEタイプと一部ファイルシグネチャを検証し、1ファイル50MBまで `UPLOAD_DIR` に保存します。本番運用ではS3互換ストレージとウイルススキャンの追加を推奨します。

## ログイン付きローカル環境

フロントエンドとAPIを別々のターミナルで起動します。

```bash
cp .env.example .env
npm run server
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

初回はログイン画面の「初回管理者を登録」から管理者を作成します。管理者はメンバー画面から招待メールを発行でき、受信者は7日間有効なリンクから、メールアドレスが入力済みの状態で氏名とパスワードを登録できます。ログインは30日間維持され、ログアウトまたはパスワード変更時にセッションを無効化します。パスワードそのものは保存せず、ランダムなsaltを使った `scrypt` ハッシュのみ保存します。

### PostgreSQL

`DATABASE_URL` を設定後、次を実行します。

```bash
npm run migrate
npm run server
```

未設定時は開発しやすいJSONストレージを利用します。現在のPostgreSQL実装はデモ互換のJSONB永続化です。本番ではバックアップ、監視、秘密情報管理を備えたマネージドPostgreSQLを推奨します。

### 招待メール（開発用メールとは）

SMTPを設定しない開発環境では、実在のメールを誤送信しないよう `data/mailbox/` にメール内容をJSONで保存します。これが「開発用メール」です。個人のメールアドレスを**受信先**として試すことはできますが、実際に送信するにはSendGrid、Amazon SES、Resend、契約サーバー等の認証済みSMTP情報を `.env` に設定してください。個人メールのパスワードをコードやGitHubへ登録しないでください。

### ファイルアップロード

案件内の資料APIは PDF、PNG、JPEG、Excel（`.xlsx` / `.xls`）、PowerPoint（`.pptx` / `.ppt`）、Word（`.docx` / `.doc`）に対応し、1ファイル50MBまでです。保存先は開発時は `data/uploads/` です。本番ではS3互換ストレージとウイルススキャンの追加を推奨します。

> GitHub Pagesは静的フロントエンドのみを配信します。ログイン、メール、PostgreSQL、ファイル保存を常時利用する本番運用では、APIをRender、Railway、AWS等へ配置し、そのURLを `VITE_API_BASE_URL` に設定する必要があります。
