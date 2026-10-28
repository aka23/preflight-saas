"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const supabase = createClient();
    const { data, error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    if (mode === "signup" && !data.session) return setMsg("確認メールを送信しました。リンクを開いてからログインしてください。");
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3 rounded border bg-white p-6">
      <h1 className="text-xl font-bold">{mode === "login" ? "ログイン" : "サインアップ"}</h1>
      <input className="w-full rounded border p-2" type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full rounded border p-2" type="password" placeholder="password（6文字以上）" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <button className="w-full rounded bg-slate-900 p-2 text-white">{mode === "login" ? "ログイン" : "登録"}</button>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <p className="text-sm">
        {mode === "login" ? <Link className="underline" href="/signup">アカウント作成</Link> : <Link className="underline" href="/login">ログインへ</Link>}
      </p>
    </form>
  );
}
