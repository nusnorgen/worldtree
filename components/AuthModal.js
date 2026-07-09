"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const TABS = [
  { key: "login", label: "登录" },
  { key: "register", label: "注册" },
  { key: "magic", label: "免密登录" },
  { key: "google", label: "Google" },
];

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (text, type = "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  /** 邮箱 + 密码登录 */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      showMsg(
        error.message === "Invalid login credentials"
          ? "邮箱或密码错误"
          : error.message
      );
    } else {
      onClose();
    }
  };

  /** 邮箱 + 密码注册 */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 6) {
      showMsg("密码至少需要 6 位字符");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      showMsg(error.message);
    } else {
      showMsg(
        "注册成功！请检查邮箱并确认验证链接（如未收到请查看垃圾邮件箱）。",
        "success"
      );
    }
  };

  /** 魔法链接免密登录 */
  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      showMsg(error.message);
    } else {
      showMsg("魔法链接已发送至你的邮箱，点击链接即可登录。", "success");
    }
  };

  /** Google OAuth 登录 */
  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) showMsg(error.message);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(7,10,20,.82)",
          backdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <div
          className="fade-up w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "rgba(16,22,44,.98)",
            border: "1px solid #26314F",
            boxShadow: "0 0 60px rgba(103,232,249,.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="p-5 flex items-center justify-between"
            style={{ borderBottom: "1px solid #1B2340" }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: "#67E8F9" }}>✦</span>
              <h2
                className="serif text-lg font-bold"
                style={{ color: "#EDE9FE" }}
              >
                世界树 · 旅人登录
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "#161D38", color: "#8B94AD" }}
            >
              ✕
            </button>
          </div>

          <div className="flex px-5 pt-4 gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setMsg(null);
                }}
                className="flex-1 text-xs py-2 rounded-full font-medium transition-all"
                style={{
                  background:
                    tab === t.key ? "rgba(103,232,249,.12)" : "transparent",
                  border:
                    tab === t.key
                      ? "1px solid rgba(103,232,249,.4)"
                      : "1px solid transparent",
                  color: tab === t.key ? "#67E8F9" : "#5A6584",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {msg && (
              <div
                className="text-xs px-3 py-2 rounded-lg mb-4"
                style={{
                  background:
                    msg.type === "success"
                      ? "rgba(103,232,249,.08)"
                      : "rgba(248,113,113,.08)",
                  border: `1px solid ${
                    msg.type === "success"
                      ? "rgba(103,232,249,.35)"
                      : "rgba(248,113,113,.35)"
                  }`,
                  color: msg.type === "success" ? "#67E8F9" : "#FCA5A5",
                }}
              >
                {msg.text}
              </div>
            )}

            {tab === "google" ? (
              <div className="text-center">
                <p className="text-sm mb-4" style={{ color: "#8B94AD" }}>
                  使用 Google 账号一键登录
                </p>
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-3 transition-all"
                  style={{
                    background: loading ? "#1B2340" : "#FFFFFF",
                    color: loading ? "#5A6584" : "#1F1F1F",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {loading ? "跳转中…" : "使用 Google 账号登录"}
                </button>
              </div>
            ) : (
              <form
                onSubmit={
                  tab === "login"
                    ? handleLogin
                    : tab === "register"
                      ? handleRegister
                      : handleMagicLink
                }
              >
                <label
                  className="block text-xs font-medium mb-2"
                  style={{ color: "#8B94AD" }}
                >
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="traveler@example.com"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4"
                  style={{
                    background: "#121A34",
                    border: "1px solid #1E2848",
                    color: "#DDE4F5",
                  }}
                />

                {(tab === "login" || tab === "register") && (
                  <>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: "#8B94AD" }}
                    >
                      密码
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        tab === "register" ? "至少 6 位字符" : "输入密码"
                      }
                      required
                      minLength={6}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4"
                      style={{
                        background: "#121A34",
                        border: "1px solid #1E2848",
                        color: "#DDE4F5",
                      }}
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-medium text-sm transition-all"
                  style={{
                    background: loading
                      ? "#1B2340"
                      : tab === "magic"
                        ? "rgba(167,139,250,.18)"
                        : "rgba(103,232,249,.15)",
                    border: "1px solid #2A3554",
                    color: loading
                      ? "#5A6584"
                      : tab === "magic"
                        ? "#A78BFA"
                        : "#67E8F9",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading
                    ? "处理中…"
                    : tab === "login"
                      ? "登录"
                      : tab === "register"
                        ? "注册"
                        : "发送魔法链接"}
                </button>
              </form>
            )}

            <p
              className="text-xs mt-4 text-center"
              style={{ color: "#3E4767" }}
            >
              {tab === "register"
                ? "注册即表示你同意在智慧之树上留下足迹"
                : tab === "magic"
                  ? "无需密码，通过邮箱链接直接登录"
                  : "登录后你的旅人档案、建言与智慧点将永久留存"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
