import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3,
  Building2, 
  Calculator, 
  Vote, 
  ClipboardList, 
  CalendarClock, 
  PenTool, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Sparkles
} from 'lucide-react';
import { AuthUser, Company, UserRole } from '../types/auth';
import { INITIAL_COMPANIES } from '../data/multiCompanyData';
import { Module1Dimensionamento } from './modules/Module1Dimensionamento';
import { Module2EleicaoOnline } from './modules/Module2EleicaoOnline';
import { Module3GestaoCIPA } from './modules/Module3GestaoCIPA';
import { GeneratedDocument } from '../data/documentTemplates';
import { CompanyUserManager } from './admin/CompanyUserManager';
import { RemindersManager } from './admin/RemindersManager';
import { SignaturePortal } from './admin/SignaturePortal';
import { AdminDashboard } from './admin/AdminDashboard';
import { ApiService } from '../services/apiService';
import { ErrorBoundary } from './common/ErrorBoundary';

interface AdminLayoutProps {
  currentUser: AuthUser;
  onOpenDocument: (doc: GeneratedDocument) => void;
  onOpenSignatureModal: (ataId: string, title: string) => void;
  signedAtas: Record<string, { hash: string; timestamp: string; signerName: string }>;
  initialTab?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  onOpenDocument,
  onOpenSignatureModal,
  signedAtas,
  initialTab = 'dashboard'
}) => {
  // Companies State
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);

  // Sincroniza com as empresas reais do PostgreSQL
  useEffect(() => {
    ApiService.getCompanies()
      .then((data) => {
        if (data && data.length > 0) {
          // Ajusta formato das unidades caso necessário
          const mappedCompanies = data.map(c => ({
            ...c,
            cnaeCode: c.cnaeCode || (c as any).cnaePrincipalCode || '2511-0/00',
            cnaeDesc: c.cnaeDesc || (c as any).cnaePrincipalDesc || 'Atividade Principal',
            modulosContratados: {
              dimensionamento: c.moduloDimensionamento ?? true,
              eleicao: c.moduloEleicao ?? true,
              gestao: c.moduloGestao ?? true
            },
            units: Array.isArray(c.units) ? c.units.map(u => ({
              id: u.id,
              name: u.name,
              city: u.city,
              state: u.state,
              headcount: u.headcount,
              grauDeRisco: u.grauDeRisco,
              cnaeCode: u.cnaeCode,
              cnaeDesc: u.cnaeDesc,
              cipaAtiva: u.cipaAtiva,
              gestorName: u.gestorName
            })) : []
          }));
          setCompanies(mappedCompanies as any);
        }
      })
      .catch((err) => console.log('Aviso ao sincronizar empresas:', err));
  }, []);
  
  // Selected Company for operations
  const initialCompany = companies.find(c => c.id === currentUser.companyId) || companies[0];
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialCompany?.id || 'emp-1');
  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0] || INITIAL_COMPANIES[0];
  
  // Selected Unit for operations
  const safeActiveUnits = Array.isArray(activeCompany?.units) ? activeCompany.units : [];
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    currentUser.unitId || safeActiveUnits[0]?.id || ''
  );
  const activeUnit = safeActiveUnits.find(u => u.id === selectedUnitId) || safeActiveUnits[0];

  // Active Tab State: 'dashboard' | 'cadastros' | 'dimensionamento' | 'eleicao' | 'gestao' | 'assinaturas' | 'lembretes'
  const [activeTab, setActiveTab] = useState<string>(
    currentUser.role === 'eleitor' ? 'eleicao' : (initialTab === 'menu' ? 'dashboard' : initialTab)
  );

  // Intelligent Auto-Expand on Hover Sidebar State (com opção de fixar)
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Delicada pausa de 180ms para evitar fechamentos bruscos caso o mouse saia rapidamente
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const isExpanded = isPinned || isHovered;

  // Helper flags
  const isMaster = currentUser.role === 'master';
  const isAdminEmpresa = currentUser.role === 'admin_empresa';
  const isGestorUnidade = currentUser.role === 'gestor_unidade';
  const isTecnicoSST = currentUser.role === 'tecnico_sst';
  const isCipeiro = currentUser.role === 'cipeiro';
  const isEleitor = currentUser.role === 'eleitor';

  // Flat sidebar menu items based on role (Sem submenus conforme solicitado)
  const getSidebarMenuItems = () => {
    if (isEleitor) {
      return [
        { id: 'eleicao', label: 'Votação Online', icon: Vote, color: 'text-purple-400' }
      ];
    }

    if (isCipeiro) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-emerald-400' },
        { id: 'assinaturas', label: 'CIPASign', icon: PenTool, color: 'text-amber-400' },
        { id: 'gestao', label: 'Gestão CIPA & Atas', icon: ClipboardList, color: 'text-sky-400' },
        { id: 'lembretes', label: 'Lembretes e Reuniões', icon: CalendarClock, color: 'text-rose-400' }
      ];
    }

    // Master, Admin Empresa, Gestor Unidade, Técnico SST
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-emerald-400' }
    ];

    if (isMaster || isAdminEmpresa || isGestorUnidade) {
      items.push({ id: 'cadastros', label: 'Cadastros Gerais', icon: Building2, color: 'text-emerald-400' });
    }

    items.push(
      { id: 'dimensionamento', label: 'Módulo 1: Dimensionamento', icon: Calculator, color: 'text-blue-400' },
      { id: 'eleicao', label: 'Módulo 2: Eleição Online', icon: Vote, color: 'text-purple-400' },
      { id: 'gestao', label: 'Módulo 3: Gestão CIPA', icon: ClipboardList, color: 'text-sky-400' },
      { id: 'assinaturas', label: 'CIPASign', icon: PenTool, color: 'text-amber-400' },
      { id: 'lembretes', label: 'Lembretes & Alertas', icon: CalendarClock, color: 'text-rose-400' }
    );

    return items;
  };

  const sidebarMenuItems = getSidebarMenuItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row font-sans w-full relative">
      
      {/* ESPAÇADOR NO FLUXO (Acompanha a largura do menu para nunca cobrir o conteúdo nem os seletores) */}
      <div 
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
      />

      {/* ========================================================================= */}
      {/* MENU LATERAL ESQUERDO AUTOMÁTICO (EXPANDE AO PASSAR O MOUSE & FIXAÇÃO)    */}
      {/* Ao passar o mouse: abre suavemente para o usuário clicar                  */}
      {/* Ao retirar o mouse: recolhe automaticamente para modo ícones compactos    */}
      {/* Botão de Fixação (Pin): permite travar aberto caso o usuário prefira      */}
      {/* ========================================================================= */}
      <aside 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`bg-slate-950 text-white border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-hidden ${
          isExpanded 
            ? 'w-64 shadow-2xl shadow-black/80 z-50 ring-1 ring-white/10' 
            : 'w-20 z-30'
        }`}
      >
        {/* Topo da Sidebar: Status & Botão de Fixação */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between min-h-[57px] shrink-0">
          {isExpanded ? (
            <div className="flex items-center justify-between w-full animate-in fade-in duration-200">
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 truncate">
                  Navegação
                </span>
                {!isPinned && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" /> Auto
                  </span>
                )}
              </div>

              {/* Botão para Fixar / Desafixar */}
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isPinned 
                    ? 'bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isPinned ? 'Desafixar menu (recolher automaticamente ao tirar o mouse)' : 'Fixar menu aberto permanentemente'}
              >
                {isPinned ? (
                  <Pin className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                ) : (
                  <PinOff className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsPinned(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Passe o mouse para abrir automaticamente ou clique para fixar"
              >
                <PinOff className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Lista de Itens do Menu (Plano, sem submenus) */}
        <div className="flex-1 py-3 px-2 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {sidebarMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (!isPinned) {
                    setIsHovered(false);
                  }
                }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer group text-left relative ${
                  isExpanded 
                    ? 'gap-3 px-3.5 py-3' 
                    : 'justify-center p-3'
                } ${
                  isActive 
                    ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 font-medium'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                {/* Ícone */}
                <IconComponent className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-white' : item.color
                }`} />

                {/* Texto do Menu (Apenas quando o menu estiver aberto) */}
                {isExpanded && (
                  <span className="text-xs tracking-tight truncate flex-1 animate-in fade-in duration-150">
                    {item.label}
                  </span>
                )}

                {/* Indicador de Item Ativo */}
                {isActive && isExpanded && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Rodapé da Sidebar: Info compacta */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className={`flex items-center text-xs text-slate-400 ${isExpanded ? 'justify-between px-2' : 'justify-center'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              {isExpanded && (
                <span className="text-[11px] font-mono truncate text-slate-400 animate-in fade-in duration-150">
                  {isPinned ? 'Menu Fixado' : 'Auto-Retrátil'}
                </span>
              )}
            </div>
            {isExpanded && !isPinned && (
              <span className="text-[10px] text-slate-500 font-mono animate-in fade-in duration-150">
                Auto
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* ÁREA DE CONTEÚDO PRINCIPAL (DIREITA)                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Seletor de Empresa/Unidade em Operação: Fundo verdinho claro e layout responsivo */}
        {activeTab !== 'cadastros' && (
          <div className="bg-emerald-50/90 border-b border-emerald-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs w-full transition-all duration-300">
            <div className="flex items-center gap-3 flex-wrap">
              {isMaster ? (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-950/80 font-bold">Empresa em Operação:</span>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => {
                      setSelectedCompanyId(e.target.value);
                      const comp = companies.find(c => c.id === e.target.value);
                      if (comp && Array.isArray(comp.units) && comp.units[0]) {
                        setSelectedUnitId(comp.units[0].id);
                      }
                    }}
                    className="font-bold text-emerald-950 bg-white/90 hover:bg-white px-2.5 py-1 rounded-lg border border-emerald-300/80 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shadow-2xs transition-colors"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.razaoSocial}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="font-bold text-emerald-950 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-300/80 shadow-2xs">
                  {activeCompany.razaoSocial}
                </div>
              )}

              <div className="h-4 w-px bg-emerald-300 hidden sm:block"></div>

              <div className="flex items-center gap-1.5 text-emerald-900">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                {isMaster || isAdminEmpresa ? (
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="font-semibold text-emerald-950 bg-white/90 hover:bg-white px-2.5 py-1 rounded-lg border border-emerald-300/80 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shadow-2xs transition-colors"
                  >
                    <option value="todas">Todas as Unidades (Visão Consolidada)</option>
                    {(activeCompany.units || []).map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-semibold text-emerald-950 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-300/80 shadow-2xs">
                    {activeUnit?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTAINER PRINCIPAL DO MÓDULO */}
        <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 flex-1 flex flex-col">
          
          {/* 1. DASHBOARD EXECUTIVO PRINCIPAL */}
          {activeTab === 'dashboard' && (
            <AdminDashboard
              currentUser={currentUser}
              companies={companies}
              activeCompany={activeCompany}
              selectedUnitId={selectedUnitId}
              onSelectUnitId={setSelectedUnitId}
              selectedCompanyId={selectedCompanyId}
              onSelectCompanyId={setSelectedCompanyId}
              onNavigateTab={setActiveTab}
              onOpenSignatureModal={onOpenSignatureModal}
              signedAtas={signedAtas}
            />
          )}

          {/* 2. CADASTROS GERAIS (COM GUIAS DE EMPRESAS, FILIAIS E USUÁRIOS) */}
          {activeTab === 'cadastros' && (
            <ErrorBoundary fallbackTitle="Erro ao carregar Cadastros Gerais">
              <CompanyUserManager
                companies={companies}
                onUpdateCompanies={setCompanies}
                currentUser={currentUser}
              />
            </ErrorBoundary>
          )}

          {/* 3. MÓDULO 1: DIMENSIONAMENTO & CRONOGRAMA */}
          {activeTab === 'dimensionamento' && (
            <Module1Dimensionamento
              onOpenDocument={onOpenDocument}
              onOpenSignatureModal={onOpenSignatureModal}
              onNavigateTab={setActiveTab}
              signedAtas={signedAtas}
              companyName={activeCompany.razaoSocial}
              cnpj={activeCompany.cnpj}
              companies={companies}
              currentUser={currentUser}
              modulosContratados={activeCompany.modulosContratados}
              selectedCompanyId={selectedCompanyId}
              onSelectCompanyId={setSelectedCompanyId}
              selectedUnitId={selectedUnitId}
              onSelectUnitId={setSelectedUnitId}
            />
          )}

          {/* 4. MÓDULO 2: ELEIÇÃO ONLINE & URNA */}
          {activeTab === 'eleicao' && (
            <Module2EleicaoOnline
              onOpenDocument={onOpenDocument}
              companyName={activeCompany.razaoSocial}
              cnpj={activeCompany.cnpj}
              totalEleitoresAptos={activeUnit?.headcount || 145}
            />
          )}

          {/* 5. MÓDULO 3: GESTÃO DA CIPA & ATAS DIGITAIS */}
          {activeTab === 'gestao' && (
            <Module3GestaoCIPA
              onOpenDocument={onOpenDocument}
              onOpenSignatureModal={onOpenSignatureModal}
              companyName={activeCompany.razaoSocial}
              cnpj={activeCompany.cnpj}
              signedAtas={signedAtas}
            />
          )}

          {/* 6. PORTAL DE ASSINATURAS */}
          {activeTab === 'assinaturas' && (
            <SignaturePortal
              currentUser={currentUser}
              companyId={activeCompany.id}
              companyName={activeCompany.razaoSocial}
              unitId={activeUnit?.id}
              unitName={activeUnit?.name}
              cnpj={activeCompany.cnpj}
              onOpenDocument={onOpenDocument}
              onOpenSignatureModal={onOpenSignatureModal}
              signedAtas={signedAtas}
              onBackToMenu={() => setActiveTab('dashboard')}
            />
          )}

          {/* 7. LEMBRETES & ALERTAS */}
          {activeTab === 'lembretes' && (
            <RemindersManager
              companyName={activeCompany.razaoSocial}
              onBackToMenu={() => setActiveTab('dashboard')}
            />
          )}

        </main>

      </div>

    </div>
  );
};
