"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import {
  Send,
  FileText,
  Eye,
  EyeOff,
  Layers,
  ArrowLeft,
  Bot,
  User as UserIcon,
  Sparkles,
  HelpCircle,
  Clock,
} from "lucide-react";
import { DocumentItem } from "./Sidebar";

interface Message {
  id: string;
  sender: string;
  question: string;
  answer?: string | null;
  createdAt?: string;
}

interface ChatScreenProps {
  document: DocumentItem;
  isPdfVisible: boolean;
  onTogglePdf: () => void;
  onBackToUpload: () => void;
  isSidebarCollapsed: boolean;
  onExpandSidebar: () => void;
  userImage?: string | null;
  userName?: string | null;
}

export default function ChatScreen({
  document,
  isPdfVisible,
  onTogglePdf,
  onBackToUpload,
  isSidebarCollapsed,
  onExpandSidebar,
  userImage,
  userName,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat messages when document changes
  useEffect(() => {
    let isMounted = true;

    async function loadChats() {
      try {
        const res = await fetch(`/api/documents/${document.id}/chat`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.chats) {
            setMessages(data.chats);
          }
        }
      } catch (err) {
        console.error("Chats could not be loaded:", err);
      }
    }

    loadChats();
    return () => {
      isMounted = false;
    };
  }, [document.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const questionText = inputText.trim();
    setInputText("");
    setIsLoading(true);

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender: "user",
      question: questionText,
      answer: "", // Kept empty as per user requirement: "bu alan şimdilik boş kalsın"
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/documents/${document.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace temp message with actual message from DB
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.chat : m))
        );
      }
    } catch (err) {
      console.error("Message send error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
        {/* Left: Document info & Back button */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToUpload}
            title="Dosya Yükleme Ekranına Dön"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[220px] sm:max-w-md" title={document.title}>
                {document.title}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                <Layers className="w-3 h-3 text-indigo-500" />
                {document.pageCount} Sayfa
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Şartname İnceleme & Soru-Cevap Odası</p>
          </div>
        </div>

        {/* Right: PDF Toggle Button (chat ekranının sağ tarafında pdf i görüntüle seçeneği) */}
        <div className="flex items-center gap-2">
          {/* Paneli Genişlet button if sidebar is collapsed */}
          {isSidebarCollapsed && (
            <button
              onClick={onExpandSidebar}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs transition-colors hidden md:flex items-center gap-1.5"
            >
              <span>Paneli Genişlet</span>
            </button>
          )}

          <button
            onClick={onTogglePdf}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
              isPdfVisible
                ? "bg-slate-800 text-white hover:bg-slate-900"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
            }`}
          >
            {isPdfVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>PDF&apos;i Gizle</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>PDF&apos;i Görüntüle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Welcome / Document Loaded Card */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              &quot;{document.title}&quot; Dökümanı Başarıyla Yüklendi
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Toplam <strong>{document.pageCount} sayfa</strong> içeren bu döküman hakkında sormak istediğiniz soruları aşağıdaki alana yazabilirsiniz.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-indigo-500" />
              Örnek: Bu şartnamedeki teslim süresi nedir?
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-indigo-500" />
              Örnek: Cezai şartlar ve teminat oranları nelerdir?
            </span>
          </div>
        </div>

        {/* Message History */}
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3 max-w-2xl mx-auto">
            {/* User Question */}
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs max-w-[85%] sm:max-w-[75%]">
                <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {msg.question}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-indigo-200">
                  <Clock className="w-3 h-3" />
                  <span>Şimdi</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs">
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userImage}
                    alt={userName || "Kullanıcı"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userName ? userName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}</span>
                )}
              </div>
            </div>

            {/* Answer Area (Per user requirement: "chat kısmının üstünde yanıt alanı açılacak(bu alan şimdilik boş kalsın)") */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-4 shadow-xs min-h-[70px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>BidAgent Asistan Yanıtı</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Alan Ayrıldı
                  </span>
                </div>
                {msg.answer ? (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {msg.answer}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 italic text-xs py-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <span>(Kullanıcı isteği doğrultusunda bu yanıt alanı şimdilik boş bırakılmıştır)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Chat Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Döküman hakkında bir soru yazın ve ok tuşuna basın..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-12"
            />
            {/* Arrow Button ("ok tuşuna basarsa") */}
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              title="Soruyu Gönder (Enter)"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

