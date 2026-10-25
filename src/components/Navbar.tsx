import React from 'react';
import { ShieldCheck, Lock, LogOut, ChevronDown } from 'lucide-react';
import { AuthUser } from '../types/auth';

interface NavbarProps {
  currentView: 'landing' | 'login' | 'admin';
  onNavigate: (view: 'landing' | 'admin' | 'login') => void;
  onOpenLogin: () => void;
  onOpenProfile?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  activeAdminTab?: string;
  onSelectAdminTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenLogin,
  onOpenProfile,
  currentUser,
  onLogout
}) => {
  // If we are in full-screen login view, do not show the regular navbar
  if (currentView === 'login') return null;

  return (
    <div className="sticky top-0 z-40 bg-white shadow-xs">
      
      {/* Tarja Superior: Apenas na Página Pública (Quando logado, REMOVIDA) */}
      {currentView === 'landing' && (
        <div className="bg-slate-950 text-white text-xs py-2 px-4 text-center border-b border-slate-800 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">
            CIPA Expert · Gestão 100% Digital da CIPA em estrita conformidade com a Nova NR-5 e a Lei Federal 14.457/2022
          </span>
        </div>
      )}

      {/* Header Principal */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className={`${currentView === 'admin' ? 'w-full pl-2 sm:pl-4 lg:pl-4 pr-4 sm:pr-6 lg:pr-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} h-16 flex items-center justify-between`}>
          
          {/* Logo CIPA Expert à Esquerda */}
          <button
            onClick={() => onNavigate(currentView === 'admin' ? 'admin' : 'landing')}
            className="flex items-center gap-2 text-left group transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-0 sm:p-0.5 cursor-pointer"
          >
            <img 
              src="/logocompleto.png" 
              alt="CIPA Expert - CIPA Digital Inteligente" 
              className="h-10 sm:h-11 w-auto max-w-[220px] object-contain transition-transform group-hover:scale-[1.02]" 
            />
          </button>

          {/* Lado Direito do Header */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Se estiver na Página Pública: Botão Acessar Plataforma */}
            {currentView === 'landing' ? (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all rounded-xl shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acessar Plataforma</span>
              </button>
            ) : (
              /* Quando Logado: Nome, bolinha com foto, função abaixo e botão de sair */
              <div className="flex items-center gap-3 sm:gap-4">
                
                {/* Bloco do Usuário: Bolinha com foto + Nome + Função abaixo */}
                <button
                  type="button"
                  onClick={onOpenProfile || onOpenLogin}
                  title="Meu Perfil: clique para alterar foto, nome ou solicitar redefinição de senha"
                  className="flex items-center gap-2.5 sm:gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer border border-transparent hover:border-slate-200"
                >
                  {/* Aquela bolinha com foto */}
                  <div className="relative shrink-0">
                    {currentUser?.avatarUrl && !currentUser.avatarUrl.includes('unsplash.com') ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-emerald-500/40">
                        {currentUser?.name 
                          ? currentUser.name.replace(/\s*\(.*?\)\s*/g, '').trim().split(/\s+/).filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
                          : (currentUser?.avatarInitials || 'US')}
                      </div>
                    )}
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0"></span>
                  </div>

                  {/* Nome do usuário e a função dele no sistema abaixo */}
                  <div className="flex flex-col min-w-0 pr-1 text-left">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate max-w-[140px] sm:max-w-[200px] leading-tight">
                      {currentUser?.name?.replace(/\s*\(.*?\)\s*/g, '').trim() || 'Usuário'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-[140px] sm:max-w-[200px] leading-tight mt-0.5">
                      {currentUser?.role === 'master' ? 'Usuário Master' : (currentUser?.roleLabel?.replace(/\s*\(.*?\)\s*/g, '').trim() || 'Função')}
                    </span>
                  </div>
                </button>

                {/* Linha divisória sutil */}
                <div className="h-7 w-px bg-slate-200"></div>

                {/* Botão de Sair ao lado */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Sair do sistema"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600" />
                  <span className="hidden sm:inline">Sair</span>
                </button>

              </div>
            )}

          </div>

        </div>
      </header>

    </div>
  );
};
