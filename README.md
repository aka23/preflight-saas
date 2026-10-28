# Preflight — AI SaaS 公開前診断（デモ）

半完成の AI SaaS を公開する前に確認すべき点（RLS、テナント分離、env 漏れ、課金フラグ）を、
小さな動くアプリで **ビフォー / アフター** として見せるための見本です。契約前の面談で「どこを、どう直すか」を説明する用途を想定しています。
本番運用中のサービスではありません。

## スタック
- Next.js 15（App Router）+ TypeScript + Tailwind CSS v4
- Supabase Auth（メール + パスワード）/ Postgres RLS
- Stripe Checkout + Webhook（**テストモードのみ**。`sk_test_` 以外のキーでは Checkout を作成しない）

## 本番URL
準備中（下記「デプロイ手順」参照）

## 画面
| パス | 内容 |
|------|------|
| `/` | ランディング |
| `/signup` `/login` | Supabase Auth |
| `/app` | ダッシュボード（自テナントの診断レポート一覧・作成。Free は3件まで） |
| `/app/billing` | Stripe Checkout（テスト）へ。webhook で Pro 化 |
| `/app/demo/security` | RLS ビフォー/アフター、env 漏れの見え方（偽値）、403 再現 |
| `/docs` | 障害メモへの導線 |

API: `/api/checkout`, `/api/webhooks/stripe`, `/api/demo/reports-before`, `/api/demo/reports-after`, `/api/tenants/[tenantId]/reports`

## 使い方（3行）
1. `/signup` で登録 → `/app` に自分のテナントとサンプル診断レポートが表示される
2. `/app/billing` → テストカード `4242 4242 4242 4242`（期限は未来の任意日付・CVC 任意）で決済 → プランが Pro になる
3. `/app/demo/security` で他テナントID（初期値のダミーID）を取得 → **403**、自分のIDなら 200

## デモ用テストカード（Stripe 公式）
- 成功: `4242 4242 4242 4242`
- 3Dセキュア: `4000 0025 0000 3155`
- 拒否: `4000 0000 0000 0002`
詳細: https://docs.stripe.com/testing

## ローカル起動
```bash
cp .env.example .env.local   # 値を埋める（テストキーのみ）
npm install
npm run dev                  # http://localhost:3000
# 別ターミナルで webhook 転送
stripe listen --forward-to localhost:3000/api/webhooks/stripe   # 表示される whsec_ を STRIPE_WEBHOOK_SECRET に
```

### Supabase セットアップ
1. 新規 Supabase プロジェクトを作成
2. SQL エディタで `supabase/migrations/20261029000000_init.sql` を実行（または `supabase link --project-ref <ref> && supabase db push`）
3. Auth > Providers で Email を有効化。デモでは「Confirm email」をオフにするとすぐログインできる

### Stripe セットアップ（テストモード）
1. ダッシュボードをテストモードにして Product + 月額 Price を作成 → `STRIPE_PRICE_ID`
2. Webhook エンドポイント `https://<本番URL>/api/webhooks/stripe`、イベント `checkout.session.completed`, `customer.subscription.deleted`

## デプロイ手順（Vercel）
```bash
vercel login
vercel link
# .env.example の全キーを Production に登録（NEXT_PUBLIC_APP_URL は本番URL）
vercel env add NEXT_PUBLIC_SUPABASE_URL production   # 以下同様
vercel --prod
```
デプロイ後、本番URLを Supabase Auth の Site URL と Stripe webhook に設定し、この README の「本番URL」を更新。

## 環境変数
`.env.example` 参照。`NEXT_PUBLIC_` が付くのはブラウザに出てよい値（URL・anon key・publishable key）だけ。

## ドキュメント
- [docs/incident.md](docs/incident.md) — 障害メモ（何が壊れた／直し方／検証手順）

## 注意
- 画面上の `sk_live_REDACTED...` 等はすべて偽値です
- 「ビフォー」の他テナント行は公開デモで実ユーザーのデータを晒さないよう固定ダミーで再現しています
- 本番 migration は正しい RLS のみ。壊れたポリシー例は docs/incident.md にのみ記載
