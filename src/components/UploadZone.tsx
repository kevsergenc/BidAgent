"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, AlertCircle, Loader2, Sparkles, Shield, ArrowRight } from "lucide-react";

interface UploadZoneProps {
  onUploadSuccess: (document: any) => void;
  hasDocuments: boolean;
  onOpenExisting?: () => void;
}

export default function UploadZone({
  onUploadSuccess,
  hasDocuments,
  onOpenExisting,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Validate PDF
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setErrorMessage("Yalnızca PDF formatındaki dökümanlar desteklenmektedir.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("Dosya boyutu 50 MB'tan büyük olamaz.");
      return;
    }

    setSelectedFileName(file.name);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Dosya yüklenirken bir hata oluştu.");
      }

      // Automatically transitions to page 2 (Chat & PDF View)
      onUploadSuccess(data.document);
    } catch (err: any) {
      setErrorMessage(err.message || "Yükleme başarısız oldu.");
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-2xl text-center space-y-6">
        {/* Welcome & Intro Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Yapay Zeka Destekli Şartname Analizi</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Şartname veya İhale PDF Dökümanınızı Yükleyin
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            İncelemek istediğiniz teknik şartnameyi sisteme yükleyerek hemen soru-cevap yapabilir, dökümanınızı interaktif olarak inceleyebilirsiniz.
          </p>
        </div>

        {/* Dropzone Container (Sayfanın Ortasında PDF Formatında) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
            isDragging
              ? "border-indigo-600 bg-indigo-50/70 scale-[1.01] shadow-lg shadow-indigo-100"
              : "border-slate-300/80 bg-white hover:border-indigo-400 hover:bg-slate-50/60 shadow-md shadow-slate-100"
          } ${isUploading ? "pointer-events-none opacity-90" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Upload Icon & Graphic */}
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
              isDragging
                ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-300"
                : "bg-indigo-50 text-indigo-600 group-hover:scale-105"
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            ) : (
              <UploadCloud className="w-10 h-10" />
            )}
          </div>

          {/* Upload Text */}
          <div className="space-y-1.5">
            {isUploading ? (
              <>
                <p className="text-base font-bold text-slate-800">
                  Döküman Yükleniyor ve Sayfalar Hesaplanıyor...
                </p>
                <p className="text-xs text-slate-500">{selectedFileName}</p>
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto mt-3">
                  <div className="w-full h-full bg-indigo-600 animate-pulse rounded-full" />
                </div>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-slate-800">
                  PDF dosyasını buraya sürükleyin veya{" "}
                  <span className="text-indigo-600 underline decoration-indigo-300 hover:decoration-indigo-600 underline-offset-2">
                    dosya seçin
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Maksimum dosya boyutu 50 MB &bull; Yalnızca PDF formatı
                </p>
              </>
            )}
          </div>

          {/* Action button */}
          {!isUploading && (
            <button
              type="button"
              className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Cihazımdan PDF Seç</span>
            </button>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Security & Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 pt-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Güvenli & Şifrelenmiş Depolama</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Otomatik Sayfa Sayısı Tespiti</span>
          </div>
        </div>

        {/* If user already has documents, hint to select from sidebar */}
        {hasDocuments && (
          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-center gap-2 text-xs text-slate-600">
            <span>Daha önce yüklediğiniz dökümanları soldaki panelden seçebilirsiniz</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
          </div>
        )}
      </div>
    </div>
  );
}

