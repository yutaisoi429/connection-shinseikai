# 真誓会 Connect バックエンド設計

> このリポジトリには、本設計のAPI契約を動作確認できるNode.js標準ライブラリ製のAPIを`server/`に実装しています。
> 現段階ではJSON永続化によるデモ実装です。本番移行時は以下のPostgreSQL、OIDC、キュー、オブジェクトストレージ構成へ置き換えます。

## 1. 推奨構成

- **API**: TypeScript + NestJS（REST API、OpenAPIを自動生成）
- **DB**: PostgreSQL 16
- **ジョブ／キュー**: Redis + BullMQ（72時間通知、メール送信、ファイル処理）
- **ファイル**: Amazon S3互換ストレージ。DBにはメタデータのみを保存し、アップロードは署名付きURLを使う
- **認証**: Amazon Cognito / Auth0などのOIDC。招待メールから初回登録し、APIではJWTを検証する
- **メール**: Amazon SESまたはSendGrid
- **監視**: OpenTelemetry + CloudWatch/Sentry

フロントエンドはGitHub Pagesで静的配信を継続し、`VITE_API_BASE_URL`でHTTPS APIへ接続します。本番APIではPagesのOriginだけをCORS許可します。

## 2. マルチテナントと権限

すべての業務データに`organization_id`を持たせ、認証済みユーザーが所属する組織以外の行は取得できないようにします。

| ロール | 主な権限 |
| --- | --- |
| `admin` | 組織設定、メンバー招待、全案件・全タスク管理 |
| `manager` | 案件作成、案件メンバー管理、タスク・ファイル管理 |
| `member` | 参加案件の閲覧、割当タスク更新、コメント・ファイル追加 |
| `viewer` | 参加案件の閲覧のみ |

各APIで組織境界と案件参加権限を検証し、推測可能なIDだけでデータへアクセスできないようUUIDを使用します。

## 3. データモデル

### 組織・ユーザー

- `organizations(id, name, created_at, updated_at)`
- `users(id, auth_subject, email, name, company, council, title, avatar_url, created_at, updated_at)`
- `organization_members(organization_id, user_id, role, status, invited_by, invited_at, joined_at)`
- `invitations(id, organization_id, email, role, token_hash, expires_at, accepted_at)`

### 案件・タスク

- `projects(id, organization_id, name, description, status, owner_id, due_at, created_by, created_at, updated_at)`
- `project_members(project_id, user_id, role)`
- `tasks(id, project_id, title, description, status, due_at, last_activity_at, created_by, completed_by, completed_at, created_at, updated_at)`
- `task_assignees(task_id, user_id, assigned_by, assigned_at)`
- `task_confirmations(task_id, user_id, confirmed_at)`
- `task_comments(id, task_id, author_id, body, created_at, updated_at, deleted_at)`
- `comment_mentions(comment_id, user_id)`

複数担当者は`task_assignees`中間テーブルで表現します。タスク本体は常に1件なので、同名タスクを担当者数だけ複製しません。

### ファイル・通知

- `files(id, project_id, task_id nullable, storage_key, original_name, mime_type, size_bytes, uploaded_by, created_at)`
- `notification_preferences(user_id, channel, event_type, enabled)`
- `notifications(id, user_id, event_type, title, body, resource_type, resource_id, read_at, created_at)`
- `notification_deliveries(id, notification_id, channel, status, attempted_at, delivered_at, error)`
- `audit_logs(id, organization_id, actor_id, action, resource_type, resource_id, metadata_json, created_at)`

主要なインデックスは、`projects(organization_id, status, created_at)`、`tasks(project_id, status, due_at)`、`task_assignees(user_id, task_id)`、`notifications(user_id, read_at, created_at)`、`files(project_id, created_at)`です。

## 4. API概要

### 案件

- `GET /v1/projects?q=&status=&ownerIds=&sort=&cursor=`
- `POST /v1/projects`
- `GET /v1/projects/:projectId`
- `PATCH /v1/projects/:projectId`
- `GET /v1/projects/:projectId/tasks`
- `GET /v1/projects/:projectId/files`

### タスク・コメント

- `POST /v1/projects/:projectId/tasks` — `assigneeIds: string[]`を受け取り、タスク1件と複数の割当をトランザクションで保存
- `GET /v1/tasks?scope=mine|stale|open|done&from=&to=&sort=&q=`
- `PATCH /v1/tasks/:taskId`
- `PUT /v1/tasks/:taskId/assignees` — 担当者一覧を置換
- `POST /v1/tasks/:taskId/confirmations` — ログイン中の担当者がタスクを確認済みにする
- `POST /v1/tasks/:taskId/comments` — 本文と`mentionedUserIds`を保存
- `GET /v1/tasks/:taskId/comments`

### ファイル・メンバー・通知

- `POST /v1/projects/:projectId/files/presign`
- `POST /v1/projects/:projectId/files/complete`
- `POST /v1/organizations/:organizationId/invitations`
- `GET /v1/members` / `PATCH /v1/users/me`
- `GET /v1/notifications` / `POST /v1/notifications/read-all`
- `GET /v1/users/me/notification-preferences`
- `PUT /v1/users/me/notification-preferences`

更新系APIは`Idempotency-Key`に対応し、二重クリックや再送でタスク・招待・コメントが重複しないようにします。

## 5. 通知処理

業務更新と同じDBトランザクションでOutboxイベントを保存し、ワーカーが非同期処理します。

1. APIが`task.created`、`task.assigned`、`comment.mentioned`、`file.created`などのイベントをOutboxへ記録
2. ワーカーが対象ユーザーと`notification_preferences`を解決
3. システム内通知を`notifications`へ作成
4. メール対象ならキューへ投入し、送信結果を`notification_deliveries`へ保存
5. 定期ジョブが、作成から72時間を過ぎても確認記録がない担当者を検出して通知
6. 期限の3日前になった未完了タスクを検出して担当者へ通知
7. 同一タスク・同一対象・同一通知種別は一度だけ発火するよう重複キーで制御

## 6. セキュリティ・運用

- API入力はDTOで検証し、コメント本文は保存時と表示時にサニタイズする
- ファイルは拡張子ではなくMIMEとシグネチャを検査し、ウイルススキャン完了後に公開する
- 招待トークンはハッシュのみ保存し、有効期限と一度限りの利用を強制する
- メールアドレス、会社名などの個人情報は暗号化ストレージとTLSで保護する
- ステータス変更、担当変更、ファイル削除、招待操作を監査ログへ残す
- PostgreSQLは日次バックアップとPoint-in-Time Recoveryを有効化する

## 7. 実装順序

1. 認証、組織、メンバー招待、権限ミドルウェア
2. 案件・タスク・複数担当者・コメント・メンションAPI
3. S3署名付きアップロードとファイル一覧
4. Outbox、システム内通知、通知設定
5. メール送信と72時間判定ジョブ
6. 監査ログ、監視、バックアップ、負荷・権限テスト

最初の本番リリース前に、想定ユーザー数、組織数、ファイル最大容量、メール送信ドメイン、保管期間を確定してください。これらはインフラ容量と費用、保持ポリシーに影響します。
