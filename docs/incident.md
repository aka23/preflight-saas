# 障害メモ: 他テナントの診断レポートが見えていた（デモ用の想定インシデント）

> このメモは面談用の「見本」です。実際の顧客影響はありません。

## 何が壊れたか
| # | 症状 | 原因 |
|---|------|------|
| 1 | ダッシュボードで他社のレポートタイトルが表示された | `reports` の RLS が無効。クエリも `tenant_id` で絞っていなかった |
| 2 | `/api/tenants/<他社ID>/reports` が 200 で中身を返した | URL の tenantId をそのまま信用し、membership を確認していなかった |
| 3 | ブラウザの JS バンドルに秘密鍵らしき値 | 秘密値を `NEXT_PUBLIC_` 付きの env に置いていた |
| 4 | 未決済でも Pro 機能が使えた | webhook の署名検証なし・クライアント側フラグで判定 |

### 壊れていたポリシー（説明用。本番 migration には含めない）
```sql
-- ❌ RLS 無効
alter table public.reports disable row level security;
-- ❌ 有効でも全員に許可
create policy "anyone" on public.reports for select using (true);
-- ❌ ログインしていれば誰でも
create policy "authed" on public.reports for select using (auth.role() = 'authenticated');
```

## 直し方
1. 全テーブルで `enable row level security`。判定は `public.is_member(tenant_id)`（security definer 関数で memberships を参照）に統一。
   → `supabase/migrations/20261029000000_init.sql`
2. API は path/body の tenant_id を信用せず、`memberships` に (tenant_id, auth.uid()) があるか確認。無ければ **403**。
   → `app/api/tenants/[tenantId]/reports/route.ts`
3. 秘密値は接頭辞なしの env に移し、Vercel 側でもローテーション。管理用クライアントは `server-only` で囲う。
   → `lib/supabase/admin.ts`
4. Pro 判定はサーバーで `subscriptions` を読む。更新は署名検証済み Stripe webhook のみ（`subscriptions` にクライアント書き込みポリシーなし）。
   → `app/api/webhooks/stripe/route.ts`

## 検証手順
1. ユーザー A / B を別ブラウザでサインアップ（それぞれ自動で個人テナントが作られる）
2. A で `/app/demo/security` → 「reports-before」: 他テナント行（is_mine:false）が混ざる＝ビフォーの見え方
3. 「reports-after」: 自分の行のみ（RLS が効いている）
4. B の tenant_id を A の画面で入力 → **HTTP 403 forbidden**。自分の ID なら 200
5. SQL エディタで確認:
   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';  -- 全て true
   ```
6. `npm run build` 後 `grep -r "sk_live\|service_role" .next/static` がヒットしない
7. Stripe CLI で `stripe listen --forward-to localhost:3000/api/webhooks/stripe` → テストカード 4242… で決済 → `subscriptions.plan = 'pro'`。署名なしの POST は 400

## 再発防止
- PR テンプレに「新テーブルは RLS + ポリシー必須」チェック
- `NEXT_PUBLIC_` に `SECRET|SERVICE_ROLE|sk_` を含む env 名を CI で拒否
