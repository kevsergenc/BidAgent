"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  FileText,
  Copy,
  Check,
} from "lucide-react";

interface AuthCardProps {
  onAuthSuccess: (user: any) => void;
}

type AuthMode = "login" | "register" | "forgot";

export default function AuthCard({ onAuthSuccess }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tempPasswordGenerated, setTempPasswordGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
    setTempPasswordGenerated(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Kayıt olurken bir hata oluştu.");
      }

      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Giriş yapılırken bir hata oluştu.");
      }

      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Şifre sıfırlama talebi gönderilemedi.");
      }

      setSuccess(data.message);
      if (data.tempPassword) {
        setTempPasswordGenerated(data.tempPassword);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyTempPasswordToLogin = () => {
    if (tempPasswordGenerated) {
      setPassword(tempPasswordGenerated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-8 relative">
        {/* Logo and Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            BidAgent
          </h1>
          <p className="text-xs text-slate-500">
            Teknik Şartname ve İhale Dökümanı İnceleme Sistemi
          </p>
        </div>

        {/* Tab Switcher (Login / Register) */}
        {mode !== "forgot" && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetMessages();
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === "login"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                resetMessages();
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === "register"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              E-posta ile Kayıt Ol
            </button>
          </div>
        )}

        {/* Notification / Error / Success Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        {/* Temporary Password Helper Box (Simulated / Dev mode) */}
        {tempPasswordGenerated && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Oluşturulan Geçici Şifreniz:</span>
            </div>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-200 font-mono text-sm font-bold text-slate-800">
              <span>{tempPasswordGenerated}</span>
              <button
                type="button"
                onClick={copyTempPasswordToLogin}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-sans font-semibold ml-2"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aktarıldı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Giriş Alanına Aktar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-amber-700 leading-tight">
              Bu geçici şifre ile hemen sisteme giriş yapabilirsiniz.
            </p>
          </div>
        )}

        {/* Form: LOGIN */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Şifre
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    resetMessages();
                  }}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Şifremi Unuttum?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Giriş Yapılıyor...</span>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form: REGISTER */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Ad Soyad
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                E-posta Adresi <span className="text-indigo-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Bir e-posta adresi ile yalnızca bir kez kayıt olunabilir.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Şifre Belirleyin <span className="text-indigo-600">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Hesap Oluşturuluyor...</span>
              ) : (
                <>
                  <span>Hesap Oluştur ve Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form: FORGOT PASSWORD */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Şifre Sıfırlama</span>
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kayıtlı e-posta adresinizi giriniz. Sistem e-posta adresinize tek kullanımlık geçici bir şifre gönderecektir.
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-slate-700 block">
                E-posta Adresiniz
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Geçici Şifre Gönderiliyor...</span>
              ) : (
                <span>Geçici Şifre Gönder</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetMessages();
              }}
              className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Giriş Ekranına Geri Dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

