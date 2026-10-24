import React from 'react';
import { 
  ShieldCheck, 
  Vote, 
  Calendar, 
  AlertTriangle, 
  FileSignature, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Building2, 
  ArrowRight, 
  FileText, 
  Layers, 
  Send,
  Bell,
  ChevronRight,
  TrendingUp,
  MapPin,
  LayoutDashboard
} from 'lucide-react';
import { AuthUser, Company } from '../../types/auth';

interface AdminDashboardProps {
  currentUser: AuthUser;
  companies: Company[];
  activeCompany: Company;
  onNavigateTab: (tab: string) => void;
  onOpenSignatureModal: (ataId: string, title: string) => void;
  signedAtas: Record<string, { hash: string; timestamp: string; signerName: string }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  companies,
  activeCompany,
  onNavigateTab,
  onOpenSignatureModal,
  signedAtas
}) => {
  const isMaster = currentUser.role === 'master';
  const isAdminEmpresa = currentUser.role === 'admin_empresa';
  const isGestorUnidade = currentUser.role === 'gestor_unidade';
  const isTecnicoSST = currentUser.role === 'tecnico_sst';
  const isCipeiro = currentUser.role === 'cipeiro';

  // KPI Calculations
  const totalEmpresas = companies.length;
  const totalUnidades = companies.reduce((acc, c) => acc + c.units.length, 0);

  // CIPAs ativas & em andamento
  const cipasAtivasCount = companies.reduce(
    (acc, c) => acc + c.units.filter(u => u.cipaAtiva).length, 
    0
  );
  const eleicoesEmAndamentoCount = 3; // Processos eleitorais abertos

  // Reuniões: em dia vs em atraso
  const reunioesEmDia = 11;
  const reunioesEmAtraso = 1;

  // Documentos pendentes de assinatura
  const totalDocPendentes = 3 - Object.keys(signedAtas).length > 0 ? 3 - Object.keys(signedAtas).length : 1;

  // Ações 5W2H
  const acoesVencidas = 2;
  const acoesAVencer = 7;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-150">
      
      {/* ========================================================================= */}
      {/* CABEÇALHO COM HEADER NA COR VERDE CLARO                                  */}
      {/* ========================================================================= */}
      <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <LayoutDashboard className="w-5 h-5 text-emerald-700" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h2>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CARDS DE KPIS PRINCIPAIS (SEM BORDA LATERAL COLORIDA)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 w-full">
        
        {/* KPI 1: CIPAs Ativas */}
        <div 
          onClick={() => onNavigateTab('cadastros')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-emerald-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CIPAs Ativas</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 transition-all shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono group-hover:text-emerald-700 transition-colors">
                {cipasAtivasCount}
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">comissões regulares</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-100 px-2 py-0.5 rounded-md mt-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span className="truncate">100% Conforme NR-5</span>
          </div>
        </div>

        {/* KPI 2: Eleições em Andamento */}
        <div 
          onClick={() => onNavigateTab('eleicao')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-purple-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Em Andamento</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-100 transition-all shadow-2xs">
                <Vote className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-900 tracking-tight font-mono group-hover:text-purple-700 transition-colors">
                {eleicoesEmAndamentoCount}
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">processos eleitorais</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-700 bg-purple-50/80 border border-purple-100 px-2 py-0.5 rounded-md mt-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">Urna digital ativa</span>
          </div>
        </div>

        {/* KPI 3: Reuniões em Dia vs em Atraso */}
        <div 
          onClick={() => onNavigateTab('gestao')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-blue-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reuniões CIPA</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-100 transition-all shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1.5 flex items-baseline gap-2">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono group-hover:text-blue-700 transition-colors">{reunioesEmDia}</span>
                <span className="text-[10px] text-emerald-600 font-bold block -mt-0.5">em dia</span>
              </div>
              <div className="h-5 w-px bg-slate-200"></div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600 font-mono">{reunioesEmAtraso}</span>
                <span className="text-[10px] text-rose-600 font-bold block -mt-0.5">em atraso</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-md mt-1">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">1 pendente de pauta</span>
          </div>
        </div>

        {/* KPI 4: Documentos Pendentes de Assinatura */}
        <div 
          onClick={() => onNavigateTab('assinaturas')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-amber-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assinaturas</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-100 transition-all shadow-2xs">
                <FileSignature className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight font-mono group-hover:text-amber-700 transition-colors">
                {totalDocPendentes}
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">documentos aguardando</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50/80 border border-amber-200 px-2 py-0.5 rounded-md mt-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">Atas mensais / posse</span>
          </div>
        </div>

        {/* KPI 5: Ações Vencidas e a Vencer */}
        <div 
          onClick={() => onNavigateTab('gestao')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-rose-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ações 5W2H</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-rose-100 transition-all shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1.5 flex items-baseline gap-2">
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600 font-mono">{acoesVencidas}</span>
                <span className="text-[10px] text-rose-600 font-bold block -mt-0.5">vencidas</span>
              </div>
              <div className="h-5 w-px bg-slate-200"></div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800 font-mono">{acoesAVencer}</span>
                <span className="text-[10px] text-slate-500 font-bold block -mt-0.5">a vencer</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-800 bg-rose-50/80 border border-rose-200 px-2 py-0.5 rounded-md mt-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate">2 ações requerem ação</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. PAINEL DE GERENCIAMENTO COM HEADERS NA COR VERDE CLARO                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* Coluna Esquerda: Status por Empresa / Estabelecimentos (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
          {/* Header na cor verde claro não muito forte */}
          <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Status das Empresas & Estabelecimentos</span>
            </h2>
            <button
              onClick={() => onNavigateTab('cadastros')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-3 flex-1">
            {companies.map((company) => (
              <div 
                key={company.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {/* Logo Redondo conforme solicitado */}
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.nomeFantasia}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <strong className="text-sm font-bold text-slate-900 block truncate">{company.nomeFantasia}</strong>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span>CNPJ: {company.cnpj}</span>
                      <span>·</span>
                      <span>{company.units.length} filiais</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CIPA Regular
                  </span>
                  <button
                    onClick={() => onNavigateTab('cadastros')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                    title="Ver Detalhes"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Ações Rápidas & Prazos Críticos (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Alertas e Prazos Legais NR-5 */}
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
            {/* Header na cor verde claro não muito forte */}
            <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-700" />
                Alertas Legais & Prazos da NR-5
              </h2>
              <span className="text-[10px] uppercase font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Urgência
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3 hover:bg-rose-50 transition-colors">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <strong className="text-rose-950 font-bold block">2 Ações Preventivas 5W2H Vencidas</strong>
                  <p className="text-rose-800 text-[11px] mt-0.5">
                    Adequação física na Linha 02 e canal de denúncias sem comprovação.
                  </p>
                  <button 
                    onClick={() => onNavigateTab('gestao')}
                    className="text-[11px] font-bold text-rose-900 underline mt-1 block cursor-pointer"
                  >
                    Resolver no Plano de Ação &rarr;
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 hover:bg-amber-50 transition-colors">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <strong className="text-amber-950 font-bold block">Reunião Mensal em Atraso de Pauta</strong>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    11ª Reunião Ordinária requer formalização de pauta antiassédio.
                  </p>
                  <button 
                    onClick={() => onNavigateTab('gestao')}
                    className="text-[11px] font-bold text-amber-900 underline mt-1 block cursor-pointer"
                  >
                    Confeccionar Ata Agora &rarr;
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-start gap-3 hover:bg-purple-50 transition-colors">
                <Vote className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <strong className="text-purple-950 font-bold block">Eleição Online Aberta (Quórum 48%)</strong>
                  <p className="text-purple-800 text-[11px] mt-0.5">
                    Faltam 2% de votação para atingir o quórum legal de 50% dos eleitores.
                  </p>
                  <button 
                    onClick={() => onNavigateTab('eleicao')}
                    className="text-[11px] font-bold text-purple-900 underline mt-1 block cursor-pointer"
                  >
                    Ver Apuração em Tempo Real &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos para Módulos */}
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
            {/* Header na cor verde claro não muito forte */}
            <div className="bg-emerald-50/80 px-5 py-3 border-b border-emerald-200/70">
              <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                Acesso Rápido aos Módulos
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('dimensionamento')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 border border-slate-200 text-left transition-all cursor-pointer"
              >
                <strong className="text-slate-900 block font-bold">Módulo 1</strong>
                <span className="text-[11px] text-slate-500 block truncate">Dimensionamento NR-5</span>
              </button>
              <button
                onClick={() => onNavigateTab('eleicao')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 hover:border-purple-200 border border-slate-200 text-left transition-all cursor-pointer"
              >
                <strong className="text-slate-900 block font-bold">Módulo 2</strong>
                <span className="text-[11px] text-slate-500 block truncate">Urna Eletrônica CIPA</span>
              </button>
              <button
                onClick={() => onNavigateTab('gestao')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50/50 hover:border-sky-200 border border-slate-200 text-left transition-all cursor-pointer"
              >
                <strong className="text-slate-900 block font-bold">Módulo 3</strong>
                <span className="text-[11px] text-slate-500 block truncate">Gestão & Atas Digitais</span>
              </button>
              <button
                onClick={() => onNavigateTab('lembretes')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50/50 hover:border-rose-200 border border-slate-200 text-left transition-all cursor-pointer"
              >
                <strong className="text-slate-900 block font-bold">Alertas</strong>
                <span className="text-[11px] text-slate-500 block truncate">Lembretes Automáticos</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
