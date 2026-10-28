import "server-only";
import { createClient } from "@supabase/supabase-js";
// service_role は RLS をバイパスする。サーバー専用。webhook と「壊れた例」デモにのみ使用。
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
