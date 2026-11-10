"use client";

import { useState } from "react";
import {
  Search,
  FileText,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FilePlus,
  X,
  FileUp,
} from "lucide-react";

export interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  createdAt: string;
}

interface SidebarProps {
  documents: DocumentItem[];
  selectedDocId: string | null;
  onSelectDoc: (doc: DocumentItem) => void;
  onDeleteDoc: (docId: string) => void;
  onNewUpload: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  documents,
  selectedDocId,
  onSelectDoc,
  onDeleteDoc,
  onNewUpload,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // If collapsed, show a slim toggle bar
  if (isCollapsed) {
    return (
      <aside className="w-12 h-[calc(100vh-4rem)] border-r border-slate-200 bg-white flex flex-col items-center py-4 select-none shrink-0 transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          title="Paneli Genişlet"
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-200 hover:border-indigo-200 group"
        >
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <div className="mt-8 [writing-mode:vertical-rl] rotate-180 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Döküman Paneli ({documents.length})
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-[calc(100vh-4rem)] border-r border-slate-200 bg-white flex flex-col shrink-0 select-none transition-all duration-300 shadow-sm relative z-20">
      {/* Panel Top Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Dökümanlarım</h2>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onNewUpload}
              title="Yeni PDF Yükle"
              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleCollapse}
              title="Paneli Daralt"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar (Panelin en üstünde arama çubuğu yer alacak) */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dökümanlarda ara..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 mt-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-300 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            {searchQuery ? (
              <>
                <p className="text-xs font-semibold text-slate-600">Sonuç Bulunamadı</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  &quot;{searchQuery}&quot; ile eşleşen bir döküman yok.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-600">Henüz Döküman Yok</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  İlk PDF dosyanızı yüklemek için ortadaki alana sürükleyin.
                </p>
              </>
            )}
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const isSelected = doc.id === selectedDocId;

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50/80 border-indigo-200 shadow-sm text-indigo-950"
                    : "bg-white border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-red-50 text-red-600 border border-red-100 group-hover:bg-red-100 group-hover:text-red-700"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-xs font-semibold truncate ${
                        isSelected ? "text-indigo-950" : "text-slate-800"
                      }`}
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>

                    {/* Metadata: Sayfa Sayısı & Yükleme Tarihi */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        {doc.pageCount} Sayfa
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${doc.title}" dökümanını silmek istediğinize emin misiniz?`)) {
                        onDeleteDoc(doc.id);
                      }
                    }}
                    title="Dökümanı Sil"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Bottom Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={onNewUpload}
          className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-700 hover:text-indigo-700 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
        >
          <FileUp className="w-4 h-4 text-indigo-600" />
          <span>Yeni Dosya Yükle</span>
        </button>
      </div>
    </aside>
  );
}

