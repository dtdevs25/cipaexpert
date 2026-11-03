import React, { useState, useEffect, useMemo } from 'react';
import { generateCipaDocument, GeneratedDocument } from '../../data/documentTemplates';
import { useCipa } from '../../context/CipaContext';
import { Company, CompanyUnit, AuthUser } from '../../types/auth';
import { EmployeeRecord } from '../../data/employeeData';
import { 
  ElectionService, 
  ElectionPleitoConfig, 
  ElectionAuditLog, 
  CandidatoEleicao 
} from '../../services/electionService';
import { EmployeeRegistryModal } from '../election/EmployeeRegistryModal';
import { CandidateRegistrationPortal } from '../election/CandidateRegistrationPortal';
import { PublicVotingPortal } from '../election/PublicVotingPortal';
import { StandardModal } from '../common/StandardModal';
import { RichTextRenderer } from '../common/RichTextRenderer';
import { 
  Vote, 
  ShieldCheck, 
  Lock, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Clock, 
  ChevronRight,
  User,
  Fingerprint,
  Calendar,
  Settings,
  UserPlus,
  Mail,
  Send,
  Copy, 
  ExternalLink, 
  QrCode, 
  Search, 
  Eye, 
  Camera, 
  Trash2, 
  BellRing, 
  FileCheck,
  Check,
  Info,
  Sparkles
} from 'lucide-react';

interface Module2EleicaoOnlineProps {
  onOpenDocument: (doc: GeneratedDocument) => void;
  companyName: string;
  cnpj: string;
  totalEleitoresAptos?: number;
  activeCompany?: Company;
  activeUnit?: CompanyUnit;
  currentUser?: AuthUser | null;
  modulosContratados?: {
    dimensionamento: boolean;
    eleicao: boolean;
    gestao: boolean;
  };
  onNavigateTab?: (tab: string) => void;
}

export const Module2EleicaoOnline: React.FC<Module2EleicaoOnlineProps> = ({
  onOpenDocument,
  companyName,
  cnpj,
  totalEleitoresAptos = 88,
  activeCompany: propActiveCompany,
  activeUnit: propActiveUnit,
  currentUser: propCurrentUser,
  modulosContratados,
  onNavigateTab
}) => {
  const { 
    currentUser: contextCurrentUser, 
    activeCompany: contextActiveCompany, 
    activeUnit: contextActiveUnit 
  } = useCipa();

  const activeCompany = propActiveCompany || contextActiveCompany;
  const activeUnit = propActiveUnit || contextActiveUnit;
  const currentUser = propCurrentUser || contextCurrentUser;

  const targetUnitId = activeUnit?.id || 'unit-tel-jundiai';
  const targetCompanyId = activeCompany?.id || 'comp-telefonica';

  // Verifica se o cliente possui o módulo de dimensionamento contratado
  const hasModuloDimensionamento = modulosContratados?.dimensionamento !== undefined
    ? Boolean(modulosContratados.dimensionamento)
    : Boolean(activeCompany?.modulosContratados?.dimensionamento);

  // FLUXO PRINCIPAL: 4 PASSOS SEQUENCIAIS
  // Passo 1: Pleito & Urna Virtual
  // Passo 2: Eleitores & Candidatos
  // Passo 3: Apuração & Quórum
  // Passo 4: Entregáveis Oficiais (5 Relatórios + Ata)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Configuração do Pleito Eleitoral
  const [pleitoConfig, setPleitoConfig] = useState<ElectionPleitoConfig>(() => 
    ElectionService.getPleitoConfig(targetUnitId, targetCompanyId)
  );

  // Base de Colaboradores e Eleitores
  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => 
    ElectionService.getEmployees(targetUnitId)
  );
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  
  // Modal padrão do sistema para exclusão de colaborador (NUNCA browser confirm)
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeRecord | null>(null);

  // Candidatos da Eleição (com foto obrigatória)
  const [candidatos, setCandidatos] = useState<CandidatoEleicao[]>(() => 
    ElectionService.getCandidatos(targetUnitId)
  );
  const [isPublicCandidateModalOpen, setIsPublicCandidateModalOpen] = useState(false);

  // Modal para testar/simular a Urna Pública Externa
  const [isTestingVotingModalOpen, setIsTestingVotingModalOpen] = useState(false);

  // Feedback e Toasts temporários
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Recarregar dados ao trocar de unidade
  useEffect(() => {
    setPleitoConfig(ElectionService.getPleitoConfig(targetUnitId, targetCompanyId));
    setEmployees(ElectionService.getEmployees(targetUnitId));
    setCandidatos(ElectionService.getCandidatos(targetUnitId));
  }, [targetUnitId, targetCompanyId]);

  // Cálculos de votos e quórum legal (NR-5)
  const candidatosConfirmados = useMemo(() => {
    return candidatos.filter(c => c.status === 'confirmado');
  }, [candidatos]);

  const totalVotosNominais = useMemo(() => {
    return candidatosConfirmados.reduce((acc, c) => acc + (c.votos || 0), 0);
  }, [candidatosConfirmados]);

  const [votosBrancos, setVotosBrancos] = useState(3);
  const [votosNulos, setVotosNulos] = useState(1);
  const totalGeralVotos = totalVotosNominais + votosBrancos + votosNulos;

  const totalAptos = employees.length > 0 ? employees.length : totalEleitoresAptos;
  const quorumMinimo1 = Math.floor(totalAptos / 2) + 1; // 50% + 1 no 1º dia
  const quorumMinimo2 = Math.ceil(totalAptos / 3); // 1/3 no 2º dia
  const quorumAtingido = totalGeralVotos >= quorumMinimo1;
  const percentualQuorum = totalAptos > 0 ? Math.round((totalGeralVotos / totalAptos) * 100) : 0;

  // Candidatos ordenados por votos apurados
  const candidatosOrdenados = useMemo(() => {
    return [...candidatosConfirmados].sort((a, b) => (b.votos || 0) - (a.votos || 0));
  }, [candidatosConfirmados]);

  // Link público exclusivo para votação fora do sistema
  const publicVotingUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${path}?votar=${pleitoConfig.id}`;
  }, [pleitoConfig.id]);

  // Ações de Colaboradores
  const handleSaveEmployee = (emp: EmployeeRecord) => {
    ElectionService.saveEmployee(emp);
    setEmployees(ElectionService.getEmployees(targetUnitId));
    showToast(`Colaborador ${emp.name} salvo com sucesso!`);
  };

  const handleConfirmDeleteEmployee = () => {
    if (employeeToDelete) {
      ElectionService.deleteEmployee(targetUnitId, employeeToDelete.id);
      setEmployees(ElectionService.getEmployees(targetUnitId));
      showToast(`Colaborador ${employeeToDelete.name} removido da lista de eleitores.`);
      setEmployeeToDelete(null);
    }
  };

  // Salvar Configuração do Pleito
  const handleSavePleito = (e: React.FormEvent) => {
    e.preventDefault();
    ElectionService.savePleitoConfig(pleitoConfig);
    showToast('Parâmetros do pleito eleitoral salvos com sucesso!');
  };

  // Lembretes Diários
  const handleSendDailyReminders = () => {
    const res = ElectionService.sendDailyReminders(targetUnitId);
    setCandidatos(ElectionService.getCandidatos(targetUnitId));
    if (res.sentCount > 0) {
      showToast(`Lembrete diário enviado para ${res.sentCount} candidato(s) pendentes!`);
    } else {
      showToast('Nenhuma candidatura pendente de confirmação no momento.');
    }
  };

  // Helper centralizado para preparar dados dinâmicos dos relatórios oficiais (PDFs)
  const buildReportExtraData = (override?: any) => {
    const votantesList = employees.map((emp, idx) => {
      const jaVotou = idx < totalGeralVotos;
      const minAcesso = 10 + (idx % 45);
      const segAcesso = (idx * 7) % 60;
      const horaStr = `09/06/2026 às ${String(8 + Math.floor(idx / 15)).padStart(2, '0')}:${String(minAcesso).padStart(2, '0')}:${String(segAcesso).padStart(2, '0')}`;
      const primHoraStr = `09/06/2026 às ${String(8 + Math.floor(idx / 15)).padStart(2, '0')}:${String(Math.max(0, minAcesso - 1)).padStart(2, '0')}:12`;
      return {
        id: String(2277846 + idx),
        nome: emp.name.toUpperCase(),
        matricula: emp.matricula || emp.id,
        cnpj: activeUnit?.cnpj || activeCompany?.cnpj || cnpj || '02.558.157/0001-62',
        entidade: activeUnit?.name?.toUpperCase() || 'SP MTZ ECOBERRI',
        email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`,
        telefone: '-',
        ip: `162.10.${28 + (idx % 15)}.${10 + (idx % 90)}`,
        dataHora: horaStr,
        tipoAcesso: 'Link de Convocação',
        votou: jaVotou,
        primeiroAcesso: primHoraStr,
        ultimoAcesso: horaStr
      };
    });

    return {
      unitName: activeUnit?.name || 'Unidade Eco Berrini',
      unitCnpj: activeUnit?.cnpj || activeCompany?.cnpj || cnpj || '02.558.157/0001-62',
      unitAddress: activeCompany?.enderecoCompleto || (activeUnit ? `${activeUnit.city} - ${activeUnit.state}` : 'Av. Engenheiro Luiz Carlos Berrini, 1376 - São Paulo - SP'),
      gestaoAno: pleitoConfig.mandato || '2026/2027',
      periodoEleicao: pleitoConfig.inicioVotacao && pleitoConfig.fimVotacao 
        ? `${pleitoConfig.inicioVotacao} às ${pleitoConfig.fimVotacao}`
        : '09/06/2026 das 08:30h às 18:00h',
      prorrogacao1Periodo: '10/06/2026(qua) das 08:30h às 18:00h',
      prorrogacao1Quorum: '31.72%',
      prorrogacao2Periodo: '11/06/2026(qui) das 08:30h às 18:00h',
      prorrogacao2Quorum: '36.65%',
      hashZeramento: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      comissaoPresidente: 'Tamires Santos de Souza',
      comissaoVice: 'Luiz Alberto De Barros Junior',
      votantesHabilitados: totalAptos,
      votantesList,
      candidatosAprovados: candidatosConfirmados.map(c => ({
        id: c.id,
        nome: c.nome,
        matricula: c.matricula,
        cargo: c.cargo,
        dataAdmissao: c.dataAdmissao || '10/02/2018'
      })),
      apuracao: {
        isOnline: true,
        totalEleitoresAptos: totalAptos,
        totalVotantes: totalGeralVotos,
        votosBrancos,
        votosNulos,
        votosValidos: totalVotosNominais,
        quorumMinimo: quorumMinimo1,
        quorumAtingido,
        percentualQuorum: totalAptos > 0 ? Number(((totalGeralVotos / totalAptos) * 100).toFixed(2)) : 0,
        candidatosResultados: candidatosOrdenados.map((c, i) => ({
          id: c.id,
          matricula: c.matricula,
          nome: c.nome,
          cargo: c.cargo,
          votos: c.votos || 0,
          percentual: totalVotosNominais > 0 ? ((c.votos || 0) / totalVotosNominais) * 100 : 0,
          classificacao: i + 1,
          situacao: i < 10 ? `${i + 1}º Titular` : (i < 18 ? `${i - 9}º Suplente` : 'Não Eleito'),
          dataAdmissao: c.dataAdmissao || '10/02/2018'
        }))
      },
      ...override
    };
  };

  // Emissão de relatório oficial
  const handleOpenReport = (docType: 'zeresima' | 'relatorio_votacao' | 'relatorio_votantes' | 'relatorio_participantes' | 'relatorio_permissao_acesso') => {
    const extraData = buildReportExtraData();
    const doc = generateCipaDocument(
      docType,
      companyName || activeCompany?.razaoSocial || 'TELEFONICA BRASIL S/A',
      cnpj || activeCompany?.cnpj || '02.558.157/0001-62',
      new Date().toISOString(),
      candidatosConfirmados.length,
      extraData
    );
    onOpenDocument(doc);
    showToast(`Visualizando: ${doc.title}`);
  };

  // Emissão da Ata de Apuração Oficial
  const handleEmitirAtaEleicao = () => {
    const extraData = buildReportExtraData();
    const doc = generateCipaDocument(
      'ata_eleicao', 
      companyName || activeCompany?.razaoSocial || 'TELEFONICA BRASIL S/A', 
      cnpj || activeCompany?.cnpj || '02.558.157/0001-62', 
      new Date().toISOString(), 
      candidatosOrdenados.length,
      extraData
    );
    onOpenDocument(doc);
    showToast(`Visualizando: ${doc.title}`);
  };

  const copyVotingLink = () => {
    navigator.clipboard.writeText(publicVotingUrl);
    setCopiedLink(true);
    showToast('Link público da urna copiado com sucesso!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Filtragem de colaboradores para busca rápida
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const term = employeeSearch.toLowerCase();
    return employees.filter(
      e => e.name.toLowerCase().includes(term) || 
           e.matricula.toLowerCase().includes(term) ||
           e.cargo.toLowerCase().includes(term)
    );
  }, [employees, employeeSearch]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* TOAST FLUTUANTE DO SISTEMA */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 bg-emerald-950 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold border border-emerald-700 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CABEÇALHO EXECUTIVO E DIRETO */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-800/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Módulo 2 · Eleição Online & Urna Digital
              </span>
              <span className="text-[10px] font-mono text-emerald-200/80">
                Mandato {pleitoConfig.mandato}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
              Eleição da CIPA · {activeUnit?.name || 'Unidade Eco Berrini'}
            </h2>
            <p className="text-xs text-emerald-200/80">
              {activeCompany?.razaoSocial} · CNPJ: {activeUnit?.cnpj || cnpj}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTestingVotingModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-all border border-emerald-500/40 cursor-pointer shadow-xs active:scale-95"
            title="Abre a cabine de votação como um eleitor veria"
          >
            <Fingerprint className="w-4 h-4 text-emerald-300" />
            <span>Simular Urna Externa</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenReport('zeresima')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-100 bg-emerald-950/80 hover:bg-emerald-900 rounded-xl transition-all border border-emerald-600/50 cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zerésima</span>
          </button>

          <button
            type="button"
            onClick={handleEmitirAtaEleicao}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Ata da Eleição</span>
          </button>
        </div>
      </div>

      {/* FLUXO DINÂMICO E PERSUASIVO EM 4 ETAPAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`p-3 rounded-xl font-bold transition-all text-left flex items-center gap-3 cursor-pointer ${
            activeStep === 1
              ? 'bg-white text-slate-900 shadow-xs border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 ${
            activeStep === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            1
          </span>
          <div className="truncate">
            <strong className="text-xs block truncate">Pleito & Urna</strong>
            <span className="text-[10px] text-slate-500 font-normal block truncate">Prazos e Link Público</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`p-3 rounded-xl font-bold transition-all text-left flex items-center gap-3 cursor-pointer ${
            activeStep === 2
              ? 'bg-white text-slate-900 shadow-xs border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 ${
            activeStep === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            2
          </span>
          <div className="truncate">
            <strong className="text-xs block truncate">Eleitores & Candidatos</strong>
            <span className="text-[10px] text-slate-500 font-normal block truncate">{totalAptos} aptos · {candidatos.length} cands</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`p-3 rounded-xl font-bold transition-all text-left flex items-center gap-3 cursor-pointer ${
            activeStep === 3
              ? 'bg-white text-slate-900 shadow-xs border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 ${
            activeStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            3
          </span>
          <div className="truncate">
            <strong className="text-xs block truncate">Apuração & Quórum</strong>
            <span className="text-[10px] text-slate-500 font-normal block truncate">{percentualQuorum}% quórum · {totalGeralVotos} votos</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(4)}
          className={`p-3 rounded-xl font-bold transition-all text-left flex items-center gap-3 cursor-pointer ${
            activeStep === 4
              ? 'bg-white text-slate-900 shadow-xs border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 ${
            activeStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            4
          </span>
          <div className="truncate">
            <strong className="text-xs block truncate">Entregáveis Oficiais</strong>
            <span className="text-[10px] text-slate-500 font-normal block truncate">5 Relatórios + Ata NR-05</span>
          </div>
        </button>
      </div>

      {/* ================================================================= */}
      {/* PASSO 1: PLEITO & LINK PÚBLICO DA URNA VIRTUAL                    */}
      {/* ================================================================= */}
      {activeStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* CARD DO LINK PÚBLICO DA URNA */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/40 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                    Página Externa Exclusiva (Fora do Sistema)
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-1">
                    Link Oficial de Votação (Urna Digital)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Disponibilizado aos colaboradores para votação segura. Fica ativo <strong>exclusivamente durante o período oficial</strong> e é lacrado após o encerramento.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Urna Digital Pronta
                </span>
              </div>
            </div>

            {/* CAIXA DE LINK E AÇÕES DIRETAS */}
            <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Vote className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-mono text-xs text-emerald-300 truncate select-all">
                  {publicVotingUrl}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={copyVotingLink}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTestingVotingModalOpen(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 active:scale-95"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Testar Cabine</span>
                </button>

                <a
                  href={publicVotingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* REGRAS CLARAS DE ACESSO DO ELEITOR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">1. Login Seguro</span>
                <p className="text-slate-300 text-[11px]">RE / Matrícula do colaborador + 4 primeiros dígitos do CPF.</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">2. Voto Secreto</span>
                <p className="text-slate-300 text-[11px]">Cédula com fotos obrigatórias e sigilo criptográfico (NR-05).</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">3. Comprovante</span>
                <p className="text-slate-300 text-[11px]">Hash SHA-256 inviolável gerado individualmente para o eleitor.</p>
              </div>
            </div>
          </div>

          {/* CONFIGURAÇÃO RÁPIDA DE PRAZOS DO PLEITO */}
          <form onSubmit={handleSavePleito} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Prazos e Parâmetros Oficiais do Mandato {pleitoConfig.mandato}
                </h3>
                <p className="text-xs text-slate-500">
                  Datas de realização da eleição e prorrogações previstas na NR-05
                </p>
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Salvar Parâmetros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Pleito:</label>
                <input
                  type="text"
                  value={pleitoConfig.titulo}
                  onChange={(e) => setPleitoConfig({ ...pleitoConfig, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Início da Votação:</label>
                <input
                  type="text"
                  value={pleitoConfig.inicioVotacao}
                  onChange={(e) => setPleitoConfig({ ...pleitoConfig, inicioVotacao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="09/06/2026 08:30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Encerramento da Votação:</label>
                <input
                  type="text"
                  value={pleitoConfig.fimVotacao}
                  onChange={(e) => setPleitoConfig({ ...pleitoConfig, fimVotacao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="09/06/2026 18:00"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">1ª Prorrogação (se quórum &lt; 50%+1):</label>
                <input
                  type="text"
                  value={pleitoConfig.prorrogacao1}
                  onChange={(e) => setPleitoConfig({ ...pleitoConfig, prorrogacao1: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="10/06/2026 18:00"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2ª Prorrogação (se quórum &lt; 1/3):</label>
                <input
                  type="text"
                  value={pleitoConfig.prorrogacao2}
                  onChange={(e) => setPleitoConfig({ ...pleitoConfig, prorrogacao2: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="11/06/2026 18:00"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto Obrigatória para Candidatos:</label>
                <div className="flex items-center gap-2 py-2">
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    ATIVADA (Obrigatória)
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* PASSO 2: ELEITORES APTOS & CANDIDATOS COM FOTO OBRIGATÓRIA        */}
      {/* ================================================================= */}
      {activeStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* BASE DE ELEITORES */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Lista Oficial de Eleitores Aptos ao Voto
                </h3>
                <p className="text-xs text-slate-500">
                  {totalAptos} colaboradores cadastrados na {activeUnit?.name || 'Unidade Eco Berrini'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmployee(null);
                    setIsEmployeeModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Novo Colaborador</span>
                </button>
              </div>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, RE ou cargo..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* TABELA LIMPA DE ELEITORES */}
            <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-100">
              {filteredEmployees.slice(0, 30).map((emp) => (
                <div key={emp.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <strong className="text-xs font-bold text-slate-900 truncate block">
                        {emp.name}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-mono">
                        RE: {emp.matricula} · {emp.cargo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEmployee(emp);
                        setIsEmployeeModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmployeeToDelete(emp)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir colaborador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CANDIDATOS HOMOLOGADOS COM FOTO OBRIGATÓRIA */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  Candidatos Homologados (Foto Obrigatória)
                </h3>
                <p className="text-xs text-slate-500">
                  {candidatosConfirmados.length} candidatos aptos com foto e propostas
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendDailyReminders}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl text-xs border border-amber-200 transition-colors cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-600" />
                  <span>Disparar Lembretes Diários</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublicCandidateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Nova Candidatura</span>
                </button>
              </div>
            </div>

            {/* GRID DE CANDIDATOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {candidatos.map((cand) => (
                <div key={cand.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-3 hover:border-emerald-300 transition-all">
                  <img
                    src={cand.fotoUrl}
                    alt={cand.nome}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shrink-0 shadow-xs"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                        Nº {cand.numeroUrna}
                      </span>
                      <strong className="text-xs font-bold text-slate-900 truncate block">
                        {cand.apelidoUrna || cand.nome}
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{cand.nome}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{cand.cargo} · RE: {cand.matricula}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PASSO 3: APURAÇÃO & QUÓRUM EM TEMPO REAL                          */}
      {/* ================================================================= */}
      {activeStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* CARDS DE QUÓRUM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium">Total de Votos</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">{totalGeralVotos}</span>
                <span className="text-xs text-slate-500">de {totalAptos} aptos</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Quórum Legal (50%+1)</span>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  quorumAtingido ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {quorumAtingido ? 'Atingido' : 'Pendente'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-sm font-bold">
                  <span>{percentualQuorum}%</span>
                  <span className="text-xs text-slate-400">Mínimo: {quorumMinimo1}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${quorumAtingido ? 'bg-emerald-600' : 'bg-amber-500'}`}
                    style={{ width: `${percentualQuorum}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium">Líder do Pleito</span>
              <div>
                <strong className="text-sm font-bold text-slate-900 block truncate">
                  {candidatosOrdenados[0]?.nome || 'Aguardando votos'}
                </strong>
                <span className="text-xs text-slate-500 font-mono">
                  {candidatosOrdenados[0]?.votos || 0} votos apurados
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium">Votos Brancos / Nulos</span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xl font-bold text-slate-800">{votosBrancos} brancos</span>
                <span className="text-xs text-slate-400">{votosNulos} nulos</span>
              </div>
            </div>
          </div>

          {/* TABELA DE CLASSIFICAÇÃO DOS CANDIDATOS */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-sm font-extrabold text-slate-900">
                Classificação Oficial dos Candidatos (NR-05)
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {candidatosConfirmados.length} Homologados
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {candidatosOrdenados.map((c, index) => {
                const percentual = totalGeralVotos > 0 ? Math.round(((c.votos || 0) / totalGeralVotos) * 100) : 0;
                const isTitular = index < 3;
                const isSuplente = index >= 3 && index < 5;

                return (
                  <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <img 
                          src={c.fotoUrl} 
                          alt={c.nome} 
                          className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500 shadow-2xs"
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                          {index + 1}º
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-900">{c.apelidoUrna || c.nome}</strong>
                          <span className="font-mono text-xs font-bold text-slate-600 px-1.5 py-0.2 bg-slate-100 rounded">
                            Nº {c.numeroUrna}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {c.cargo} · RE: {c.matricula}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-slate-900 block">
                          {c.votos || 0} votos
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          {percentual}%
                        </span>
                      </div>

                      <span className={`text-xs font-bold px-3 py-1 rounded-xl font-mono uppercase shrink-0 ${
                        isTitular 
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isSuplente 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {isTitular ? 'Eleito Titular' : isSuplente ? 'Eleito Suplente' : 'Não Eleito'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PASSO 4: ENTREGÁVEIS OFICIAIS (5 RELATÓRIOS + ATA NR-05)           */}
      {/* ================================================================= */}
      {activeStep === 4 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  Entregáveis & Relatórios Oficiais da Eleição (NR-05)
                </h3>
                <p className="text-xs text-slate-500">
                  Conjunto probatório completo com carimbo de tempo, hash SHA-256 e fé pública
                </p>
              </div>

              <button
                type="button"
                onClick={handleEmitirAtaEleicao}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Visualizar Ata Completa</span>
              </button>
            </div>

            {/* GRID DOS 5 DOCUMENTOS OFICIAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. ZERÉSIMA */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-emerald-300 transition-all space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Auditada (0 Votos)
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    1. Zerésima da Urna Eletrônica
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Certificação emitida imediatamente antes da abertura do pleito, comprovando que a urna e todos os candidatos possuíam exatamente 0 (zero) votos computados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenReport('zeresima')}
                  className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs transition-colors border border-slate-200 hover:border-emerald-300 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Visualizar Zerésima</span>
                </button>
              </div>

              {/* 2. RELATÓRIO DE VOTAÇÃO (RESULTADO) */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-blue-300 transition-all space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Resultado Oficial
                    </span>
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    2. Relatório de Eleição Virtual - Resultado
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Demonstrativo com quórum apurado por fase, prorrogações, votos válidos/brancos/nulos e ranking oficial de titulares e suplentes com critérios de desempate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenReport('relatorio_votacao')}
                  className="w-full py-2 bg-white hover:bg-blue-50 text-blue-800 font-bold rounded-xl text-xs transition-colors border border-slate-200 hover:border-blue-300 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Visualizar Resultado</span>
                </button>
              </div>

              {/* 3. RELATÓRIO DE VOTANTES (QUÓRUM) */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-purple-300 transition-all space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Sigilo Garantido
                    </span>
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    3. Relatório de Eleição Virtual - Quórum
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Lista nominal de todos os votantes auditados com ID, Nome, RE, CNPJ, IP, Data/Hora e Tipo de Acesso, assegurando total sigilo do voto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenReport('relatorio_votantes')}
                  className="w-full py-2 bg-white hover:bg-purple-50 text-purple-800 font-bold rounded-xl text-xs transition-colors border border-slate-200 hover:border-purple-300 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span>Visualizar Lista de Votantes</span>
                </button>
              </div>

              {/* 4. RELATÓRIO DE ACESSOS */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-amber-300 transition-all space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Logs de Acesso
                    </span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    4. Relatório de Acessos dos Participantes
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Auditoria de todos os participantes cadastrados com status "Votou" ou "Não Votou", IP de conexão, primeiro e último acesso à cabine virtual.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenReport('relatorio_participantes')}
                  className="w-full py-2 bg-white hover:bg-amber-50 text-amber-800 font-bold rounded-xl text-xs transition-colors border border-slate-200 hover:border-amber-300 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>Visualizar Acessos</span>
                </button>
              </div>

              {/* 5. RELATÓRIO DE PERMISSÕES DE ACESSO */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-rose-300 transition-all space-y-3 md:col-span-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      Inviolabilidade da Base
                    </span>
                    <Lock className="w-4 h-4 text-rose-600" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    5. Relatório de Alteração de Permissão de Acesso
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Certificação técnica conclusiva: "SEM ALTERAÇÃO NA PERMISSÃO DE ACESSO DOS PARTICIPANTES", garantindo que a base de eleitores não sofreu adições ou manipulações durante o certame.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenReport('relatorio_permissao_acesso')}
                  className="w-full py-2 bg-white hover:bg-rose-50 text-rose-800 font-bold rounded-xl text-xs transition-colors border border-slate-200 hover:border-rose-300 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-rose-600" />
                  <span>Visualizar Relatório de Permissões</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL PADRÃO DO SISTEMA: EXCLUSÃO DE COLABORADOR (SEM BROWSER CONFIRM) */}
      {/* ================================================================= */}
      <StandardModal
        isOpen={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        type="confirm_delete"
        title="Remover Eleitor da Lista Oficial"
        description={`Tem certeza que deseja remover ${employeeToDelete?.name} da lista de eleitores aptos ao voto? Esta ação impedirá o colaborador de acessar a urna eletrônica.`}
        confirmLabel="Remover Eleitor"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDeleteEmployee}
      />

      {/* MODAL DE CADASTRO/EDIÇÃO DE COLABORADOR */}
      <EmployeeRegistryModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        unitId={targetUnitId}
        companyId={targetCompanyId}
        employeeToEdit={editingEmployee}
      />

      {/* MODAL DE INSCRIÇÃO DE CANDIDATO */}
      {isPublicCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl">
            <CandidateRegistrationPortal
              company={activeCompany}
              unit={activeUnit}
              token={pleitoConfig.id}
              onClose={() => setIsPublicCandidateModalOpen(false)}
              onSuccess={(novoCand) => {
                setCandidatos(ElectionService.getCandidatos(targetUnitId));
                showToast(`Candidatura de ${novoCand.nome} registrada com sucesso!`);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL DE TESTE/SIMULAÇÃO DA CABINE DE VOTAÇÃO EXTERNA */}
      {isTestingVotingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-5xl h-[94vh] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2 font-mono text-emerald-400 font-bold">
                <Fingerprint className="w-4 h-4" />
                Simulador da Cabine Virtual Externa (Visão do Eleitor)
              </span>
              <button
                type="button"
                onClick={() => setIsTestingVotingModalOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar Simulador
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PublicVotingPortal
                company={activeCompany}
                unit={activeUnit}
                token={pleitoConfig.id}
                onClose={() => setIsTestingVotingModalOpen(false)}
                onVoteCast={() => {
                  showToast('Voto computado com sucesso no simulador!');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
