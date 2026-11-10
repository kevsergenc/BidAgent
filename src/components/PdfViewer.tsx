"use client";

import { useState } from "react";
import {
  FileText,
  X,
  ExternalLink,
  Download,
  Layers,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface PdfViewerProps {
  document: {
    id: string;
    title: string;
    fileName: string;
    pageCount: number;
    fileSize: number;
  };
  onClose: () => void;
}

export default function PdfViewer({ document, onClose }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileUrl = `/api/documents/${document.id}/file`;

  return (
    <div
      className={`h-full flex flex-col bg-slate-900 border-l border-slate-200 transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 bg-slate-950" : "flex-1 relative"
      }`}
    >
      {/* PDF Header Bar */}
      <div className="h-12 bg-slate-800 text-white px-4 flex items-center justify-between border-b border-slate-700/80 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-6 h-6 rounded bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span
            className="text-xs font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-[280px]"
            title={document.title}
          >
            {document.title}.pdf
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded">
            <Layers className="w-3 h-3 text-indigo-400" />
            {document.pageCount} Sayfa
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Yeni Sekmede Aç"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={fileUrl}
            download={`${document.title}.pdf`}
            title="İndir"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Küçült" : "Tam Ekran"}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onClose}
            title="PDF Görünümünü Kapat"
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded PDF iframe */}
      <div className="flex-1 w-full h-[calc(100%-3rem)] bg-slate-900 relative">
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
          className="w-full h-full border-0"
          title={`PDF Görüntüleyici: ${document.title}`}
        />
      </div>
    </div>
  );
}

