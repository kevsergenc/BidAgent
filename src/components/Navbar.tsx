"use client";

import { useState } from "react";
import { User, LogOut, FileText, Clock, ChevronDown, ShieldCheck } from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    tempPassword?: boolean;
    lastLogins?: Array<{
      id: string;
      loginAt: string;
      ip?: string | null;
      userAgent?: string | null;
    }>;
  };
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenChangePassword?: () => void;
}

export default function Navbar({ user, onLogout, onOpenHistory }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-slate-900 tracking-tight">BidAgent</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Şartname & İhale
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">Teknik Şartname ve İhale Dökümanı İnceleme Asistanı</p>
        </div>
      </div>

      {/* Right Corner: User info */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs shadow-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {user.name || user.email}
            </span>
            <span className="text-[11px] text-slate-500 max-w-[140px] truncate">
              {user.email}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kullanıcı Hesabı</p>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">{user.name || "Kullanıcı"}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenHistory();
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">Oturum Açma Geçmişi</span>
                    <span className="text-[11px] text-slate-400">Veritabanına kaydedilen tarihler</span>
                  </div>
                </button>

                {onOpenChangePassword && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenChangePassword();
                    }}
                    className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">Şifre Değiştir</span>
                      <span className="text-[11px] text-slate-400">Yeni kalıcı şifre belirleyin</span>
                    </div>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-medium text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Güvenli Çıkış Yap</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

