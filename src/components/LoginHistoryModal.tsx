"use client";

import { useEffect, useState } from "react";
import { Clock, X, Shield, Globe, Monitor, Calendar } from "lucide-react";

interface LoginHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function LoginHistoryModal({
  isOpen,
  onClose,
  userEmail,
}: LoginHistoryModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.lastLogins) {
            setLogs(data.user.lastLogins);
          }
        }
      } catch (err) {
        console.error("Logs could not be loaded:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Oturum Açma Geçmişi
              </h3>
              <p className="text-xs text-slate-500">
                Veritabanına kaydedilen oturum açma tarihleri ({userEmail})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Kullanıcı e-posta, şifre ve oturum açma tarihleri veritabanında güvenle saklanmaktadır.
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Oturum kayıtları getiriliyor...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Henüz oturum kaydı bulunamadı.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-slate-800">
                        Başarılı Giriş
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                          En Son
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(log.loginAt)}</span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                    <div className="flex items-center justify-end gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span>{log.ip || "127.0.0.1"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

