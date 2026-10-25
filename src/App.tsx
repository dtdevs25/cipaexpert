import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { DigitalSignatureModal } from './components/DigitalSignatureModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { GeneratedDocument } from './data/documentTemplates';
import { AuthUser } from './types/auth';
import { DEMO_USERS } from './data/multiCompanyData';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'admin'>('landing');
  const [activeAdminTab, setActiveAdminTab] = useState<string>('menu');
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(DEMO_USERS.master);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Password reset via token link state
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user clicked email reset link with ?resetToken=...
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('resetToken');
    if (token) {
      setResetToken(token);
    }
  }, []);

  // Active document for modal viewer
  const [viewingDocument, setViewingDocument] = useState<GeneratedDocument | null>(null);
  
  // Digital signature modal state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [signatureTargetAtaId, setSignatureTargetAtaId] = useState<string>('');
  const [signatureTargetTitle, setSignatureTargetTitle] = useState<string>('');

  // Signed Atas registry
  const [signedAtas, setSignedAtas] = useState<Record<string, {
    hash: string;
    timestamp: string;
    signerName: string;
  }>>({
    'ata-1': {
      hash: 'EC-4F91B883C1A2E0942B',
      timestamp: '05/10/2026 15:35',
      signerName: 'Carlos Mendes'
    }
  });

  const handleNavigate = (view: 'landing' | 'login' | 'admin') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLogin = () => {
    setCurrentView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'eleitor') {
      setActiveAdminTab('eleicao');
    } else {
      setActiveAdminTab('dashboard');
    }
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDocument = (doc: GeneratedDocument) => {
    setViewingDocument(doc);
  };

  const handleOpenSignatureModal = (ataId: string, title: string) => {
    setSignatureTargetAtaId(ataId);
    setSignatureTargetTitle(title);
    setIsSignatureModalOpen(true);
  };

  const handleConfirmSignature = (data: {
    signerName: string;
    signerCpf: string;
    signerRole: string;
    hash: string;
    timestamp: string;
  }) => {
    if (signatureTargetAtaId) {
      setSignedAtas((prev) => ({
        ...prev,
        [signatureTargetAtaId]: {
          hash: data.hash,
          timestamp: data.timestamp,
          signerName: data.signerName
        }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      
      {/* Universal Fixed Header (with top fixed CIPA Expert banner) */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeAdminTab={activeAdminTab}
        onSelectAdminTab={(tab) => setActiveAdminTab(tab)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'landing' ? (
          <LandingPage
            onOpenLogin={handleOpenLogin}
          />
        ) : currentView === 'login' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBackToLanding={() => handleNavigate('landing')}
          />
        ) : (
          <AdminLayout
            currentUser={currentUser || DEMO_USERS.master}
            onOpenDocument={handleOpenDocument}
            onOpenSignatureModal={handleOpenSignatureModal}
            signedAtas={signedAtas}
            initialTab={activeAdminTab}
          />
        )}
      </main>

      {/* Modal de Perfil do Usuário (Trocar foto, nome ou solicitar redefinição de senha) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => {
          setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
        }}
      />

      {/* Modal de Redefinição de Senha via Link de 24h recebido por E-mail */}
      <ResetPasswordModal
        isOpen={!!resetToken}
        token={resetToken || ''}
        onSuccess={() => {
          setResetToken(null);
          window.history.replaceState({}, '', window.location.pathname);
          handleOpenLogin();
        }}
        onCancel={() => {
          setResetToken(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />

      {/* Document Viewer Modal for Official Legal Documents */}
      <DocumentViewerModal
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        isSigned={false}
        onSignRequested={() => {
          if (viewingDocument) {
            const docId = viewingDocument.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
            handleOpenSignatureModal(docId, viewingDocument.title);
            setViewingDocument(null);
          }
        }}
      />

      {/* Digital Signature Pad Modal */}
      <DigitalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        documentTitle={signatureTargetTitle || 'Ata da Reunião Mensal da CIPA'}
        onConfirmSignature={handleConfirmSignature}
      />

    </div>
  );
};
