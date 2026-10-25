import React, { useMemo } from 'react';
import { 
  ShieldCheck, 
  Vote, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Building2, 
  ArrowRight, 
  Layers, 
  Bell, 
  ChevronRight, 
  MapPin, 
  BarChart3, 
  PenTool,
  Lock,
  PieChart,
  Activity,
  Award,
  Users,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { AuthUser, Company, CompanyUnit } from '../../types/auth';

interface AdminDashboardProps {
  currentUser: AuthUser;
  companies: Company[];
  activeCompany: Company;
  selectedUnitId?: string;
  onSelectUnitId?: (unitId: string) => void;
  selectedCompanyId?: string;
  onSelectCompanyId?: (companyId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenSignatureModal: (ataId: string, title: string) => void;
  signedAtas: Record<string, { hash: string; timestamp: string; signerName: string }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  companies,
  activeCompany,
  selectedUnitId = 'todas',
  onSelectUnitId,
  selectedCompanyId,
  onSelectCompanyId,
  onNavigateTab,
  onOpenSignatureModal,
  signedAtas
}) => {
  const isMaster = currentUser.role === 'master';
  const isAdminEmpresa = currentUser.role === 'admin_empresa';
  const isGestorUnidade = currentUser.role === 'gestor_unidade';
  const isTecnicoSST = currentUser.role === 'tecnico_sst';
  const isCipeiro = currentUser.role === 'cipeiro';
  const isEleitor = currentUser.role === 'eleitor';

  // 1. Unidades liberadas para este usuário logado
  const allowedUnits: CompanyUnit[] = useMemo(() => {
    const units = Array.isArray(activeCompany?.units) ? activeCompany.units : [];
    
    // Master e Administrador da Empresa têm acesso a todas as filiais
    if (isMaster || isAdminEmpresa) {
      return units;
    }

    // Gestor de Unidade, Cipeiro, Eleitor ou Técnico com unidade restrita vinculada
    if (currentUser.unitId) {
      const specific = units.filter(u => u.id === currentUser.unitId);
      if (specific.length > 0) return specific;
    }

    return units;
  }, [activeCompany, currentUser, isMaster, isAdminEmpresa]);

  // Se o usuário só tem permissão para 1 unidade, ela é fixa
  const isRestrictedToSingleUnit = allowedUnits.length === 1 && !isMaster && !isAdminEmpresa;

  // Unidade ativa em foco
  const activeUnit = isRestrictedToSingleUnit 
    ? allowedUnits[0] 
    : (selectedUnitId && selectedUnitId !== 'todas' 
        ? allowedUnits.find(u => u.id === selectedUnitId) || null 
        : null);

  const isConsolidated = !activeUnit;

  // Headcount & Grau de Risco
  const totalColaboradores = isConsolidated
    ? allowedUnits.reduce((acc, u) => acc + (u.headcount || 0), 0) || 550
    : activeUnit.headcount || 145;

  const currentGrauRisco = activeUnit ? activeUnit.grauDeRisco : 3;

  // =========================================================================
  // CÁLCULOS DINÂMICOS DOS KPIS
  // =========================================================================
  const cipasAtivasCount = isConsolidated
    ? companies.reduce((acc, c) => acc + (c?.units ? c.units.filter(u => u.cipaAtiva).length : 0), 0)
    : (activeUnit.cipaAtiva ? 1 : 0);

  const eleicoesEmAndamentoCount = isConsolidated ? 3 : 1;
  const reunioesEmDia = isConsolidated ? 11 : 10;
  const reunioesEmAtraso = 1;
  const totalDocPendentes = Math.max(1, 3 - Object.keys(signedAtas).length);
  const acoesVencidas = isConsolidated ? 2 : 1;
  const acoesAVencer = isConsolidated ? 7 : 3;

  // =========================================================================
  // DADOS PARA OS GRÁFICOS DO SISTEMA
  // =========================================================================

  // Gráfico 1: Quórum e Eleição da CIPA
  const electionStats = useMemo(() => {
    let totalAptos = totalColaboradores;
    let votosComputados = Math.round(totalAptos * 0.62);

    if (activeUnit?.id === 'unit-1-matriz') {
      totalAptos = 145;
      votosComputados = 72; // 49.6%
    } else if (activeUnit?.id === 'unit-1-betim') {
      totalAptos = 320;
      votosComputados = 218; // 68.1%
    } else if (activeUnit?.id === 'unit-1-cajamar') {
      totalAptos = 85;
      votosComputados = 53; // 62.3%
    }

    const quorumMinimoLegal = Math.ceil(totalAptos * 0.50); // Mínimo de 50% dos votos conforme NR-5
    const quorumPercent = totalAptos > 0 ? Number(((votosComputados / totalAptos) * 100).toFixed(1)) : 0;
    const quorumAtingido = votosComputados >= quorumMinimoLegal;
    const votosFaltantes = Math.max(0, quorumMinimoLegal - votosComputados);

    return {
      totalAptos,
      votosComputados,
      quorumMinimoLegal,
      quorumPercent,
      quorumAtingido,
      votosFaltantes,
      turnos: [
        { name: '1º Turno (Manhã)', percent: 84, votos: Math.round(votosComputados * 0.44), total: Math.round(totalAptos * 0.40) },
        { name: '2º Turno (Tarde)', percent: 62, votos: Math.round(votosComputados * 0.32), total: Math.round(totalAptos * 0.32) },
        { name: '3º Turno (Noite)', percent: 46, votos: Math.round(votosComputados * 0.15), total: Math.round(totalAptos * 0.18) },
        { name: 'Administrativo & Apoio', percent: 92, votos: Math.round(votosComputados * 0.09), total: Math.round(totalAptos * 0.10) }
      ]
    };
  }, [activeUnit, totalColaboradores]);

  // Gráfico 2: Ciclo Anual de 12 Reuniões Ordinárias do Mandato NR-5
  const annualMeetings = [
    { mes: 'Jan', status: 'concluida', ata: 'Ata 01/2024', assinado: true, label: 'Instalação e Posse' },
    { mes: 'Fev', status: 'concluida', ata: 'Ata 02/2024', assinado: true, label: 'Inspeção Setorial' },
    { mes: 'Mar', status: 'concluida', ata: 'Ata 03/2024', assinado: true, label: 'Campanha de Ergonomia' },
    { mes: 'Abr', status: 'concluida', ata: 'Ata 04/2024', assinado: true, label: 'Quase-Acidente Linha 01' },
    { mes: 'Mai', status: 'concluida', ata: 'Ata 05/2024', assinado: true, label: 'Revisão Mapa de Risco' },
    { mes: 'Jun', status: 'concluida', ata: 'Ata 06/2024', assinado: true, label: 'Fiscalização de EPIs' },
    { mes: 'Jul', status: 'concluida', ata: 'Ata 07/2024', assinado: true, label: 'Prevenção de Incêndio' },
    { mes: 'Ago', status: 'concluida', ata: 'Ata 08/2024', assinado: true, label: 'Treinamento Periódico' },
    { mes: 'Set', status: 'concluida', ata: 'Ata 09/2024', assinado: true, label: 'Prevenção ao Assédio' },
    { mes: 'Out', status: 'concluida', ata: 'Ata 10/2024', assinado: true, label: 'Planejamento da SIPAT' },
    { mes: 'Nov', status: 'atual', ata: 'Pauta Aberta', assinado: false, label: '11ª Reunião Ordinária' },
    { mes: 'Dez', status: 'prevista', ata: 'Agendada', assinado: false, label: '12ª Reunião / Balanço' },
  ];

  // Gráfico 3: Matriz de Riscos & Ações Preventivas 5W2H
  const actionsByRisk = [
    { 
      name: 'Riscos Mecânicos / Máquinas', 
      concluidas: 8, 
      andamento: 2, 
      atrasadas: 1, 
      total: 11,
      color: 'bg-emerald-500', 
      bgLight: 'bg-emerald-50' 
    },
    { 
      name: 'Riscos Físicos & Ruído', 
      concluidas: 5, 
      andamento: 2, 
      atrasadas: 0, 
      total: 7,
      color: 'bg-blue-500', 
      bgLight: 'bg-blue-50' 
    },
    { 
      name: 'Riscos Ergonômicos (NR-17)', 
      concluidas: 6, 
      andamento: 1, 
      atrasadas: 0, 
      total: 7,
      color: 'bg-amber-500', 
      bgLight: 'bg-amber-50' 
    },
    { 
      name: 'Prevenção ao Assédio (Lei 14.457/22)', 
      concluidas: 4, 
      andamento: 1, 
      atrasadas: 1, 
      total: 6,
      color: 'bg-purple-500', 
      bgLight: 'bg-purple-50' 
    },
  ];

  // Gráfico 4: Índice de Conformidade Legal NR-5
  const compliancePillars = [
    { name: 'Dimensionamento & Vagas', percent: 100, desc: 'Quadro I Conforme' },
    { name: 'Urna & Processo Eleitoral', percent: 94, desc: 'Cronograma Legal' },
    { name: 'Regularidade das Atas Digitais', percent: 92, desc: '10 atas formalizadas' },
    { name: 'Treinamento Obrigatório Cipeiros (20h)', percent: 88, desc: '8/9 certificados emitidos' },
    { name: 'Canal de Denúncias & SIPAT', percent: 96, desc: 'Lei 14.457/22 atendida' },
  ];

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-150">
      
      {/* ========================================================================= */}
      {/* CABEÇALHO DO DASHBOARD COM INDICADOR DA FILIAL SELECIONADA                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 py-2.5 px-4 sm:px-5 rounded-xl border border-emerald-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight leading-none">
              Dashboard Executivo CIPA
            </h2>
            <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
              Gestão inteligente de conformidade da NR-5 e processos eleitorais
            </span>
          </div>
        </div>

        {/* SELETOR INTERATIVO DE FILIAL LIBERADA */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {isRestrictedToSingleUnit ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 border border-emerald-300 text-xs shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                  Unidade Liberada ({currentUser.roleLabel})
                </span>
                <strong className="text-xs font-bold text-slate-900 block truncate max-w-[200px]">
                  {allowedUnits[0]?.name}
                </strong>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-white/95 p-1 rounded-xl border border-emerald-300 shadow-2xs text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 ml-1.5 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap hidden sm:inline">
                Filial:
              </span>
              <select
                value={activeUnit ? activeUnit.id : 'todas'}
                onChange={(e) => onSelectUnitId && onSelectUnitId(e.target.value)}
                className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer py-1 px-1.5 text-xs rounded-lg hover:bg-emerald-50/50"
              >
                {(isMaster || isAdminEmpresa) && (
                  <option value="todas">Todas as Unidades (Visão Consolidada)</option>
                )}
                {allowedUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.headcount} colab. - GR {u.grauDeRisco})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Badge Resumo da Unidade */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg shadow-2xs font-semibold">
            <span>{totalColaboradores} Colaboradores</span>
            <span>·</span>
            <span>Grau de Risco {currentGrauRisco}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CARDS DE KPIS PRINCIPAIS (DESIGN APROVADO: ÍCONES GRANDES, SEM FUNDO) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 w-full">
        
        {/* KPI 1: CIPAs Ativas */}
        <div 
          onClick={() => onNavigateTab('cadastros')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-emerald-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              CIPAs Ativas
            </span>
            <div className="mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono group-hover:text-emerald-600 transition-colors leading-none block">
                {cipasAtivasCount}
              </span>
              <span className="text-xs text-slate-400 block mt-1 font-medium truncate">
                {isConsolidated ? 'comissões regulares' : `Grau de Risco ${currentGrauRisco}`}
              </span>
            </div>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-600 group-hover:scale-110 group-hover:text-emerald-700 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

        {/* KPI 2: Eleições em Andamento */}
        <div 
          onClick={() => onNavigateTab('eleicao')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-purple-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              Em Andamento
            </span>
            <div className="mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-purple-900 tracking-tight font-mono group-hover:text-purple-600 transition-colors leading-none block">
                {eleicoesEmAndamentoCount}
              </span>
              <span className="text-xs text-slate-400 block mt-1 font-medium truncate">
                {isConsolidated ? 'processos eleitorais' : `${electionStats.quorumPercent}% quórum`}
              </span>
            </div>
          </div>
          <Vote className="w-8 h-8 text-purple-600 group-hover:scale-110 group-hover:text-purple-700 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

        {/* KPI 3: Reuniões CIPA */}
        <div 
          onClick={() => onNavigateTab('gestao')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-blue-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              Reuniões CIPA
            </span>
            <div className="mt-1.5 flex items-baseline gap-2.5">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono group-hover:text-blue-600 transition-colors leading-none block">
                  {reunioesEmDia}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                  em dia
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono leading-none block">
                  {reunioesEmAtraso}
                </span>
                <span className="text-[10px] text-rose-600 font-bold block mt-1">
                  em atraso
                </span>
              </div>
            </div>
          </div>
          <Calendar className="w-8 h-8 text-blue-600 group-hover:scale-110 group-hover:text-blue-700 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

        {/* KPI 4: Documentos Pendentes de Assinatura */}
        <div 
          onClick={() => onNavigateTab('assinaturas')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-amber-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              Assinaturas
            </span>
            <div className="mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-amber-900 tracking-tight font-mono group-hover:text-amber-600 transition-colors leading-none block">
                {totalDocPendentes}
              </span>
              <span className="text-xs text-slate-400 block mt-1 font-medium truncate">
                aguardando validação
              </span>
            </div>
          </div>
          <PenTool className="w-8 h-8 text-amber-600 group-hover:scale-110 group-hover:text-amber-700 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

        {/* KPI 5: Ações Vencidas e a Vencer */}
        <div 
          onClick={() => onNavigateTab('gestao')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-rose-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              Ações 5W2H
            </span>
            <div className="mt-1.5 flex items-baseline gap-2.5">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono leading-none block">
                  {acoesVencidas}
                </span>
                <span className="text-[10px] text-rose-600 font-bold block mt-1">
                  vencidas
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono leading-none block">
                  {acoesAVencer}
                </span>
                <span className="text-[10px] text-slate-500 font-bold block mt-1">
                  a vencer
                </span>
              </div>
            </div>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-600 group-hover:scale-110 group-hover:text-rose-700 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. GRÁFICOS DO SISTEMA: MÉTRICAS DA CIPA & AUDITORIA NR-5                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* GRÁFICO 1: QUÓRUM ELEITORAL E URNA DIGITAL (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
          <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Participação Eleitoral & Urna Digital (Meta NR-5)
              </h3>
            </div>
            {electionStats.quorumAtingido ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Quórum Atingido ({electionStats.quorumPercent}%)
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" /> Faltam {electionStats.votosFaltantes} votos ({electionStats.quorumPercent}%)
              </span>
            )}
          </div>

          <div className="p-5 space-y-5">
            {/* Barra Principal de Quórum com Linha de Meta Legal 50% */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700">
                  Progresso Geral de Votação:
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {electionStats.votosComputados} de {electionStats.totalAptos} eleitores ({electionStats.quorumPercent}%)
                </span>
              </div>

              <div className="relative w-full h-7 bg-slate-100 rounded-xl overflow-hidden p-1 border border-slate-200">
                {/* Barra preenchida */}
                <div 
                  className={`h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2 text-white text-[11px] font-bold font-mono shadow-xs ${
                    electionStats.quorumAtingido 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                      : 'bg-gradient-to-r from-amber-500 to-purple-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, electionStats.quorumPercent))}%` }}
                >
                  {electionStats.quorumPercent}%
                </div>

                {/* Marcador Vertical da Meta Legal da NR-5 (50%) */}
                <div 
                  className="absolute top-0 bottom-0 border-r-2 border-dashed border-rose-500 flex flex-col items-center pointer-events-none"
                  style={{ left: '50%' }}
                  title="Meta mínima de 50% exigida pelo item 5.4.1 da NR-5"
                >
                  <span className="absolute -top-1 transform -translate-y-full text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded border border-rose-200 whitespace-nowrap">
                    Meta NR-5 (50%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>0% de Votos</span>
                <span className="text-rose-600 font-bold">50% Quórum Legal ({electionStats.quorumMinimoLegal} votos)</span>
                <span>100% Eleitorado</span>
              </div>
            </div>

            {/* Participação por Turno */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">
                Participação por Turno Operacional:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {electionStats.turnos.map((t, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700">{t.name}</span>
                      <span className="font-mono font-bold text-emerald-700">{t.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${t.percent}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{t.votos} votos</span>
                      <span>Total: {t.total} colab.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Criptografia RSA-2048 com carimbo de tempo ICP-Brasil
            </span>
            <button
              onClick={() => onNavigateTab('eleicao')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Urna Online</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* GRÁFICO 2: SCORE DE CONFORMIDADE LEGAL NR-5 (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
          <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Índice de Conformidade NR-5
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white shadow-2xs">
              94.6% Conforme
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Radial / Destaque de Auditoria */}
            <div className="flex items-center gap-4 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/60">
              <div className="relative w-14 h-14 rounded-full bg-emerald-700 text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0">
                <span className="text-sm leading-none">94.6</span>
                <span className="text-[9px] font-normal leading-none opacity-80">%</span>
              </div>
              <div className="min-w-0">
                <strong className="text-sm font-extrabold text-slate-900 block leading-tight">
                  Status de Auditoria: Regular
                </strong>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  Estabelecimento em conformidade com as diretrizes da NR-5 e Lei 14.457/22.
                </p>
              </div>
            </div>

            {/* Pilares Legais da NR-5 */}
            <div className="space-y-2.5">
              {compliancePillars.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate">{p.name}</span>
                    <span className="font-mono font-bold text-slate-900">{p.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.percent === 100 
                          ? 'bg-emerald-600' 
                          : p.percent >= 90 
                            ? 'bg-emerald-500' 
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${p.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Base legal: Portaria MTP nº 4.219 / NR-5 Atualizada
            </span>
            <button
              onClick={() => onNavigateTab('dimensionamento')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Quadro I</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. GRÁFICOS: CICLO DE 12 REUNIÕES DA CIPA & GESTÃO DE RISCOS 5W2H         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* GRÁFICO 3: CICLO ANUAL DE 12 REUNIÕES ORDINÁRIAS (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
          <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Ciclo de 12 Reuniões Ordinárias do Mandato da CIPA
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
              Mandato 2024 / 2025
            </span>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              A NR-5 determina a realização de reuniões ordinárias mensais durante o mandato. Acompanhe a emissão e assinatura das atas digitais:
            </p>

            {/* 12 Colunas Mensais */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2">
              {annualMeetings.map((m, idx) => {
                const isConcluida = m.status === 'concluida';
                const isAtual = m.status === 'atual';

                return (
                  <div 
                    key={idx}
                    className="flex flex-col items-center group cursor-pointer"
                    title={`${m.mes}: ${m.label} (${m.ata})`}
                  >
                    {/* Barra visual vertical */}
                    <div className="w-full h-16 bg-slate-100 rounded-lg p-1 flex flex-col justify-end relative overflow-hidden border border-slate-200 group-hover:border-emerald-400 transition-colors">
                      <div 
                        className={`w-full rounded-md transition-all duration-300 ${
                          isConcluida 
                            ? 'h-full bg-emerald-600 group-hover:bg-emerald-500' 
                            : isAtual 
                              ? 'h-3/4 bg-blue-600 animate-pulse' 
                              : 'h-1/4 bg-slate-300'
                        }`}
                      ></div>
                      
                      {/* Ícone de status no topo da barra */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isConcluida && <CheckCircle2 className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                        {isAtual && <Clock className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                      </div>
                    </div>

                    {/* Rótulo do Mês */}
                    <span className={`text-[11px] font-bold mt-1.5 ${
                      isAtual ? 'text-blue-700' : isConcluida ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {m.mes}
                    </span>

                    {/* Indicador de Ata Assinada */}
                    <span className={`text-[9px] font-mono leading-none ${
                      isConcluida ? 'text-emerald-700' : isAtual ? 'text-blue-600 font-bold' : 'text-slate-400'
                    }`}>
                      {isConcluida ? '✓ Ata' : isAtual ? 'Pauta' : 'Prev.'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legenda dos Status */}
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Realizada com Ata Assinada (10)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Mês Atual / Pauta Aberta (1)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span>Prevista no Cronograma (1)</span>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Taxa de Assiduidade: <strong className="text-emerald-700 font-bold">100%</strong>
            </span>
            <button
              onClick={() => onNavigateTab('gestao')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar Atas da CIPA</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* GRÁFICO 4: MATRIZ DE RISCOS & PLANO DE AÇÃO 5W2H (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
          <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Plano de Ação 5W2H por Tipo de Risco
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
              31 Ações Mapeadas
            </span>
          </div>

          <div className="p-5 space-y-3.5">
            {actionsByRisk.map((r, idx) => {
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{r.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      <strong className="text-emerald-700 font-bold">{r.concluidas}</strong> / {r.total} concluídas
                    </span>
                  </div>

                  {/* Barra empilhada */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${(r.concluidas / r.total) * 100}%` }}
                      title={`${r.concluidas} Concluídas`}
                    ></div>
                    <div 
                      className="bg-blue-400 h-full" 
                      style={{ width: `${(r.andamento / r.total) * 100}%` }}
                      title={`${r.andamento} Em Andamento`}
                    ></div>
                    <div 
                      className="bg-rose-500 h-full" 
                      style={{ width: `${(r.atrasadas / r.total) * 100}%` }}
                      title={`${r.atrasadas} Atrasadas`}
                    ></div>
                  </div>
                </div>
              );
            })}

            {/* Resumo Consolidado 5W2H */}
            <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100 text-xs">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs text-emerald-700 font-semibold block">Concluídas</span>
                <strong className="text-lg font-black text-emerald-900 font-mono">23</strong>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-xs text-blue-700 font-semibold block">Em Curso</span>
                <strong className="text-lg font-black text-blue-900 font-mono">6</strong>
              </div>
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-xs text-rose-700 font-semibold block">Atrasadas</span>
                <strong className="text-lg font-black text-rose-900 font-mono">2</strong>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Efetividade Geral: <strong className="text-emerald-700 font-bold">74%</strong>
            </span>
            <button
              onClick={() => onNavigateTab('gestao')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Acessar Quadro 5W2H</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. PAINEL DE EMPRESAS E ALERTAS LEGAIS DA NR-5                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* Coluna Esquerda: Status por Empresa / Estabelecimentos (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
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
                      <span>{(company.units || []).length} filiais</span>
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

        {/* Coluna Direita: Alertas Rápidos e Prazos Críticos (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Alertas e Prazos Legais NR-5 */}
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
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
                  <strong className="text-rose-950 font-bold block">Ação Preventiva 5W2H Vencida</strong>
                  <p className="text-rose-800 text-[11px] mt-0.5">
                    Adequação física na Linha 02 e canal de denúncias sem comprovação anexada.
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
                  <strong className="text-amber-950 font-bold block">11ª Reunião Ordinária em Pauta Aberta</strong>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Requer inclusão das diretrizes antiassédio antes da emissão e coleta de assinaturas.
                  </p>
                  <button 
                    onClick={() => onNavigateTab('gestao')}
                    className="text-[11px] font-bold text-amber-900 underline mt-1 block cursor-pointer"
                  >
                    Confeccionar Ata Agora &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos para Módulos */}
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
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
                <span className="text-[11px] text-slate-500 block truncate">Gestão CIPA & Atas</span>
              </button>
              <button
                onClick={() => onNavigateTab('assinaturas')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 hover:border-amber-200 border border-slate-200 text-left transition-all cursor-pointer"
              >
                <strong className="text-slate-900 block font-bold">Assinaturas</strong>
                <span className="text-[11px] text-slate-500 block truncate">Portal Digital ICP</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
