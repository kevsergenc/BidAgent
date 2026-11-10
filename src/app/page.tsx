"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar, { DocumentItem } from "@/components/Sidebar";
import UploadZone from "@/components/UploadZone";
import ChatScreen from "@/components/ChatScreen";
import PdfViewer from "@/components/PdfViewer";
import AuthCard from "@/components/AuthCard";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import ProfileModal from "@/components/ProfileModal";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);

  // UI layout states
  const [isPdfVisible, setIsPdfVisible] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Check current session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Fetch documents for logged-in user
  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Documents fetch error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setActiveDocument(null);
      setIsPdfVisible(false);
    }
  };

  // Handle Successful Upload:
  // "ikinci sayfaya eğer kullanıcı bir pdf yüklerse geçiş yapılacak."
  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocument(newDoc);
  };

  // Handle Document Selection from Sidebar
  const handleSelectDoc = (doc: DocumentItem) => {
    setActiveDocument(doc);
  };

  // Handle Document Deletion
  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (activeDocument?.id === docId) {
          setActiveDocument(null);
          setIsPdfVisible(false);
        }
      }
    } catch (err) {
      console.error("Delete doc error:", err);
    }
  };

  // Handle PDF View Toggle:
  // "ve eğer kullanıcı bu butona basarsa sayfa ikiye bölünsün dikey olarak ve sol tarfta chat ekranı
  // sağ tarafta da pdf dökümanı görüntülensin ayrıca soldaki panel de sola soğru kapansın
  // eğer kullanıcı isterse paneli genişlet butonundan genişletebilsin."
  const handleTogglePdf = () => {
    const nextPdfState = !isPdfVisible;
    setIsPdfVisible(nextPdfState);
    if (nextPdfState) {
      // Automatically collapse the left sidebar when opening PDF side-by-side
      setIsSidebarCollapsed(true);
    }
  };

  // Initial loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">BidAgent Yükleniyor...</p>
      </div>
    );
  }

  // Not authenticated: Show Login/Register/Forgot Password View
  if (!user) {
    return <AuthCard onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Body with Sidebar + Center/Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Kullanıcı Paneli) */}
        <Sidebar
          documents={documents}
          selectedDocId={activeDocument?.id || null}
          onSelectDoc={handleSelectDoc}
          onDeleteDoc={handleDeleteDoc}
          onNewUpload={() => {
            setActiveDocument(null);
            setIsPdfVisible(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center Content: Page 1 (Upload Zone) or Page 2 (Chat + Optional PDF Viewer) */}
        <main className="flex-1 flex overflow-hidden relative">
          {!activeDocument ? (
            // SAYFA 1: Giriş sonrası ilk sayfa (Ortada PDF Yükleme Alanı)
            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              hasDocuments={documents.length > 0}
              onOpenExisting={() => {
                if (documents.length > 0) {
                  setActiveDocument(documents[0]);
                }
              }}
            />
          ) : (
            // SAYFA 2: Chat Ekranı & İkiye Bölünmüş PDF Görüntüleyici
            <div className="flex-1 flex overflow-hidden w-full h-full">
              {/* Left Column of Split: Chat Screen */}
              <div
                className={`h-full flex flex-col transition-all duration-300 ${
                  isPdfVisible ? "w-full md:w-1/2" : "w-full"
                }`}
              >
                <ChatScreen
                  document={activeDocument}
                  isPdfVisible={isPdfVisible}
                  onTogglePdf={handleTogglePdf}
                  onBackToUpload={() => {
                    setActiveDocument(null);
                    setIsPdfVisible(false);
                  }}
                  isSidebarCollapsed={isSidebarCollapsed}
                  onExpandSidebar={() => setIsSidebarCollapsed(false)}
                  userImage={user.image}
                  userName={user.name}
                />
              </div>

              {/* Right Column of Split: PDF Viewer */}
              {isPdfVisible && (
                <div className="hidden md:flex md:w-1/2 h-full">
                  <PdfViewer
                    document={activeDocument}
                    onClose={() => setIsPdfVisible(false)}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        isTempPassword={user.tempPassword}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={(updatedUser) => {
          setUser((prev: any) => ({ ...prev, ...updatedUser }));
        }}
      />
    </div>
  );
}

