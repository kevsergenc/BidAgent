"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  User as UserIcon,
  X,
  Camera,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  Save,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    name?: string | null;
    surname?: string | null;
    image?: string | null;
    createdAt?: string;
  };
  onUpdateUser: (updatedUser: any) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}: ProfileModalProps) {
  const [name, setName] = useState(user.name || "");
  const [surname, setSurname] = useState(user.surname || "");
  const [previewImage, setPreviewImage] = useState<string | null>(user.image || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Görsel boyutu en fazla 5 MB olabilir.");
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let updatedUserData;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("surname", surname);
        formData.append("avatar", selectedFile);

        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Profil güncellenemedi.");
        updatedUserData = data.user;
      } else {
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            surname,
            image: previewImage === null ? null : user.image,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Profil güncellenemedi.");
        updatedUserData = data.user;
      }

      setSuccess("Profil bilgileriniz başarıyla kaydedildi.");
      onUpdateUser(updatedUserData);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Bilinmiyor";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const displayName = `${name || ""} ${surname || ""}`.trim() || user.email;
  const initial = (name ? name.charAt(0) : user.email.charAt(0)).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Profil Bilgilerim
              </h3>
              <p className="text-xs text-slate-500">
                Kişisel bilgilerinizi ve profil fotoğrafınızı yönetin
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Profile Picture Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-100 bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage}
                    alt="Profil Fotoğrafı"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              {/* Camera Icon Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Fotoğraf Yükle"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition-all border-2 border-white"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h4 className="text-xs font-bold text-slate-800">Profil Fotoğrafı</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                PNG, JPG veya WEBP formatında bir resim yükleyebilirsiniz (En fazla 5 MB).
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Resim Seç</span>
                </button>

                {previewImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kaldır</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User Information Fields: İsim, Soyisim, E-posta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                İsim
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="İsminiz"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Soyisim
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Soyisminiz"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* E-posta Adresi (Görüntüleme) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">
                E-posta Adresi
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                (Kayıtlı E-posta - Değiştirilemez)
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Üyelik Tarihi */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Hesap Oluşturulma Tarihi:</span>
            </div>
            <span className="font-semibold text-slate-700">
              {formatDate(user.createdAt)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Kaydediliyor..." : "Bilgileri Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

