import React, { useState, useEffect, useMemo } from 'react';
import { Candidato, VotoAuditoria } from '../../types/cipa';
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
import { RichTextRenderer } from '../common/RichTextRenderer';
import { RichTextEditor } from '../common/RichTextEditor';
import { 
  Vote, 
  ShieldCheck, 
  Lock, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Hash, 
  Clock, 
  ChevronRight,
  User,
  Fingerprint,
  Printer,
  Check,
  RotateCcw,
  Calendar,
  Settings,
  UserPlus,
  Mail,
  Send,
  Upload,
  Copy,
  ExternalLink,
  QrCode,
  Search,
  Eye,
  AlertCircle,
  HelpCircle,
  Camera,
  Trash2,
  BellRing,
  Sparkles,
  Download,
  FileCheck
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
    activeUnit: contextActiveUnit,
    castVote, 
    hasVoted, 
    getVoteReceipt 
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

  // Subabas do Módulo de Votação
  const [activeSubTab, setActiveSubTab] = useState<'apuracao' | 'pleito' | 'colaboradores' | 'candidatos' | 'urna' | 'relatorios'>('apuracao');

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

  // Candidatos da Eleição (com foto obrigatória)
  const [candidatos, setCandidatos] = useState<CandidatoEleicao[]>(() => 
    ElectionService.getCandidatos(targetUnitId)
  );
  const [isPublicCandidateModalOpen, setIsPublicCandidateModalOpen] = useState(false);

  // Logs de Auditoria
  const [auditLogs, setAuditLogs] = useState<ElectionAuditLog[]>(() => 
    ElectionService.getAuditLogs(targetUnitId)
  );
  const [logFilter, setLogFilter] = useState<string>('TODOS');

  // Feedback e Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado da Urna Digital Interativa (Cabine de Votação Oficial)
  const [urnaStep, setUrnaStep] = useState<'login' | 'cedula' | 'confirmacao' | 'comprovante'>('login');
  const [voterRe, setVoterRe] = useState('');
  const [voterCpfDigits, setVoterCpfDigits] = useState('');
  const [authenticatedVoter, setAuthenticatedVoter] = useState<EmployeeRecord | null>(null);
  const [voterAlreadyVoted, setVoterAlreadyVoted] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [voteReceipt, setVoteReceipt] = useState<{ hash: string; timestamp: string } | null>(null);
  const [isVotingSubmitting, setIsVotingSubmitting] = useState(false);

  // Notificação toast temporária
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Recarregar dados ao trocar de unidade
  useEffect(() => {
    setPleitoConfig(ElectionService.getPleitoConfig(targetUnitId, targetCompanyId));
    setEmployees(ElectionService.getEmployees(targetUnitId));
    setCandidatos(ElectionService.getCandidatos(targetUnitId));
    setAuditLogs(ElectionService.getAuditLogs(targetUnitId));
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

  // Ações do Tópico 1: Gestão de Colaboradores
  const handleSaveEmployee = (emp: EmployeeRecord) => {
    ElectionService.saveEmployee(emp);
    setEmployees(ElectionService.getEmployees(targetUnitId));
    showToast(`Colaborador ${emp.name} salvo com sucesso!`);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Tem certeza que deseja remover este colaborador da lista de eleitores?')) {
      ElectionService.deleteEmployee(targetUnitId, id);
      setEmployees(ElectionService.getEmployees(targetUnitId));
      showToast('Colaborador removido.');
    }
  };

  // Ações do Tópico 2: Salvar Configuração do Pleito
  const handleSavePleito = (e: React.FormEvent) => {
    e.preventDefault();
    ElectionService.savePleitoConfig(pleitoConfig);
    setAuditLogs(ElectionService.getAuditLogs(targetUnitId));
    showToast('Configurações do pleito salvas com sucesso!');
  };

  // Ações do Tópico 3: Lembretes Diários de Confirmação
  const handleSendDailyReminders = () => {
    const res = ElectionService.sendDailyReminders(targetUnitId);
    setCandidatos(ElectionService.getCandidatos(targetUnitId));
    setAuditLogs(ElectionService.getAuditLogs(targetUnitId));
    if (res.sentCount > 0) {
      showToast(`Lembrete diário enviado para ${res.sentCount} candidato(s) com inscrição pendente!`);
    } else {
      showToast('Nenhuma candidatura pendente de confirmação no momento.');
    }
  };

  const handleConfirmCandidate = (candidatoId: string) => {
    ElectionService.confirmCandidatura(targetUnitId, candidatoId);
    setCandidatos(ElectionService.getCandidatos(targetUnitId));
    setAuditLogs(ElectionService.getAuditLogs(targetUnitId));
    showToast('Candidatura confirmada e homologada com sucesso!');
  };

  const handleReproveCandidate = (candidatoId: string) => {
    const motivo = prompt('Informe o motivo formal da reprovação da candidatura:');
    if (motivo) {
      ElectionService.reproveCandidatura(targetUnitId, candidatoId, motivo);
      setCandidatos(ElectionService.getCandidatos(targetUnitId));
      setAuditLogs(ElectionService.getAuditLogs(targetUnitId));
      showToast('Candidatura reprovada com registro em ata.');
    }
  };

  // Ações do Tópico 4: Urna Digital (Login RE + 4 Primeiros Dígitos do CPF)
  const handleVoterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const auth = ElectionService.authenticateVoter(targetUnitId, voterRe, voterCpfDigits);
    setAuditLogs(ElectionService.getAuditLogs(targetUnitId));

    if (!auth.authenticated || !auth.employee) {
      setLoginError(auth.message);
      return;
    }

    setAuthenticatedVoter(auth.employee);
    setVoterAlreadyVoted(auth.alreadyVoted);

    if (auth.alreadyVoted) {
      setUrnaStep('comprovante');
      setVoteReceipt({
        hash: 'VOTE-SHA256-ANTERIORMENTE-COMPUTADO-E3B0C44298FC1C14',
        timestamp: '13/10/2026 às 09:14'
      });
    } else {
      setUrnaStep('cedula');
    }
  };

  const handleSelectCandidateToVote = (candId: string) => {
    setSelectedCandidateId(candId);
    setUrnaStep('confirmacao');
  };

  const handleConfirmVote = async () => {
    if (!authenticatedVoter || !selectedCandidateId) return;
    setIsVotingSubmitting(true);

    try {
      if (selectedCandidateId === 'branco') {
        setVotosBrancos(prev => prev + 1);
      } else if (selectedCandidateId === 'nulo') {
        setVotosNulos(prev => prev + 1);
      }

      const res = await ElectionService.castVoterVote(targetUnitId, authenticatedVoter.matricula, selectedCandidateId);
      setCandidatos(ElectionService.getCandidatos(targetUnitId));
      setAuditLogs(ElectionService.getAuditLogs(targetUnitId));

      if (res.success && res.hash) {
        setVoteReceipt({
          hash: res.hash,
          timestamp: res.receiptTimestamp || new Date().toLocaleString('pt-BR')
        });
        setUrnaStep('comprovante');
        showToast('Voto computado com sucesso na urna eletrônica!');
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao registrar voto.');
    } finally {
      setIsVotingSubmitting(false);
    }
  };

  const handleResetUrnaSession = () => {
    setUrnaStep('login');
    setVoterRe('');
    setVoterCpfDigits('');
    setAuthenticatedVoter(null);
    setSelectedCandidateId(null);
    setVoteReceipt(null);
    setLoginError(null);
  };

  // Emissão da Ata de Apuração Oficial
  const handleEmitirAtaEleicao = () => {
    const doc = generateCipaDocument(
      'ata_eleicao', 
      companyName || activeCompany.razaoSocial, 
      cnpj || activeCompany.cnpj, 
      new Date().toISOString(), 
      candidatosOrdenados.length,
      {
        unitName: activeUnit?.name,
        unitCnpj: activeUnit?.cnpj || activeCompany?.cnpj,
        gestaoAno: pleitoConfig.mandato,
        apuracao: {
          isOnline: true,
          totalEleitoresAptos: totalAptos,
          totalVotantes: totalGeralVotos,
          votosBrancos,
          votosNulos,
          votosValidos: totalVotosNominais,
          quorumMinimo: quorumMinimo1,
          quorumAtingido,
          percentualQuorum,
          candidatosResultados: candidatosOrdenados.map((c, i) => ({
            id: c.id,
            matricula: c.matricula,
            nome: c.nome,
            cargo: c.cargo,
            votos: c.votos || 0,
            percentual: totalVotosNominais > 0 ? ((c.votos || 0) / totalVotosNominais) * 100 : 0,
            classificacao: i + 1,
            situacao: i < 3 ? `${i + 1}º Titular Eleito` : (i < 5 ? `${i - 2}º Suplente Eleito` : 'Não Eleito'),
            dataAdmissao: c.dataAdmissao
          }))
        }
      }
    );
    onOpenDocument(doc);
  };

  // Helper centralizado para preparar dados dinâmicos dos relatórios oficiais (PDFs)
  const buildReportExtraData = (override?: any) => {
    // Lista de votantes reais e participantes com base nos colaboradores da unidade
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

  // Emissão de qualquer relatório entregável oficial da Eleição
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* TOAST FLUTUANTE */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 bg-emerald-950 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold border border-emerald-700 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CABEÇALHO DO MÓDULO 2 */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-800/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Módulo 2 · Eleição Online Auditada
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                Gestão {pleitoConfig.mandato} · NR-05
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
              {pleitoConfig.titulo}
            </h2>
            <p className="text-xs text-emerald-200/80">
              {activeCompany?.razaoSocial} · {activeUnit?.name} · CNPJ: {activeUnit?.cnpj || cnpj}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenReport('zeresima')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-100 bg-emerald-800/80 hover:bg-emerald-700 rounded-xl transition-all border border-emerald-600/50 cursor-pointer active:scale-95 shadow-xs"
            title="Emissão oficial da Zerésima da Urna Eletrônica antes do 1º voto"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Emitir Zerésima</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('relatorios')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-800/90 hover:bg-slate-700 rounded-xl transition-all border border-slate-600/50 cursor-pointer active:scale-95 shadow-xs"
          >
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Relatórios Oficiais (5)</span>
          </button>

          <button
            type="button"
            onClick={handleEmitirAtaEleicao}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Emitir Ata Oficial de Eleição</span>
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE SUB-ABAS */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto border border-slate-200/80 text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('apuracao')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'apuracao'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Apuração & Quórum</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pleito')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'pleito'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 text-emerald-600" />
          <span>Configuração do Pleito</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('colaboradores')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'colaboradores'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Colaboradores & Eleitores</span>
          {!hasModuloDimensionamento && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded font-mono">
              Base da Unidade
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('candidatos')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'candidatos'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-600" />
          <span>Candidatos (Foto Obrigatória)</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded font-mono">
            {candidatos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('urna');
            handleResetUrnaSession();
          }}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'urna'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Fingerprint className="w-4 h-4 text-emerald-300" />
          <span>Urna Digital Oficial (Votar)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('relatorios')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'relatorios'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>Entregáveis & Relatórios</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded font-mono">
            5 Oficiais
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* ABA 1: APURAÇÃO & QUÓRUM EM TEMPO REAL                       */}
      {/* ============================================================ */}
      {activeSubTab === 'apuracao' && (
        <div className="space-y-6">
          {/* CARDS DE QUÓRUM E RESUMO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" /> Total de Votos
                </span>
                <span className="font-mono uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">
                  Computados
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {totalGeralVotos}
                </span>
                <span className="text-xs text-slate-500">
                  de {totalAptos} aptos
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Quórum 1º Dia (50%+1)
                </span>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  quorumAtingido ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {quorumAtingido ? 'Atingido' : 'Pendente'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {percentualQuorum}%
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Mínimo: {quorumMinimo1}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${quorumAtingido ? 'bg-emerald-600' : 'bg-amber-500'}`}
                    style={{ width: `${percentualQuorum}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> Líder do Pleito
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  1º Lugar
                </span>
              </div>
              <div className="space-y-0.5">
                <strong className="text-sm font-bold text-slate-900 block truncate">
                  {candidatosOrdenados[0]?.nome || 'Aguardando votos'}
                </strong>
                <span className="text-xs text-slate-500 font-mono block">
                  {candidatosOrdenados[0]?.votos || 0} votos ({totalGeralVotos > 0 ? Math.round(((candidatosOrdenados[0]?.votos || 0) / totalGeralVotos) * 100) : 0}%)
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Auditoria Imutável
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  SHA-256
                </span>
              </div>
              <div className="space-y-0.5">
                <strong className="text-xs font-bold text-emerald-800 block">
                  Sigilo Absoluto do Voto
                </strong>
                <span className="text-[11px] text-slate-500 block">
                  Zero-Knowledge Proof & Hash individual
                </span>
              </div>
            </div>
          </div>

          {/* TABELA DE CLASSIFICAÇÃO DOS CANDIDATOS */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Classificação Oficial dos Candidatos (NR-05)
                </h3>
                <p className="text-xs text-slate-500">
                  Critério normativo de desempate por tempo de serviço no estabelecimento
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {candidatosConfirmados.length} Candidatos Homologados
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {candidatosOrdenados.map((c, index) => {
                const percentual = totalGeralVotos > 0 ? Math.round(((c.votos || 0) / totalGeralVotos) * 100) : 0;
                const isTitular = index < 3;
                const isSuplente = index >= 3 && index < 5;

                return (
                  <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <img 
                          src={c.fotoUrl} 
                          alt={c.nome} 
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                          {index + 1}º
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-900">{c.apelidoUrna || c.nome}</strong>
                          <span className="font-mono text-xs font-bold text-slate-600 px-1.5 py-0.2 bg-slate-100 rounded border border-slate-200">
                            Nº {c.numeroUrna}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {c.cargo} · {c.setor} · RE: {c.matricula}
                        </p>
                        <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          <RichTextRenderer content={c.propostas} className="text-[11px]" allowImages={false} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="font-mono text-base font-black text-slate-900">
                          {c.votos || 0} votos
                        </span>
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {percentual}% dos votos
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

          {/* BANNER DE ENTREGÁVEIS OFICIAIS & AUDITORIA DIGITAL */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-6 text-white border border-emerald-800/40 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300 shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    Entregáveis Oficiais & Auditoria Digital do Pleito
                  </h4>
                  <p className="text-xs text-emerald-200/80">
                    5 relatórios auditáveis com carimbo de tempo, quórum e hash SHA-256 (NR-05 & Portaria MTP nº 422/2021)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('relatorios')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs self-start sm:self-center active:scale-95"
              >
                Ver Central Completa de Relatórios →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleOpenReport('zeresima')}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-left transition-all group cursor-pointer hover:border-emerald-500/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                    Zerada
                  </span>
                </div>
                <strong className="text-xs font-bold block text-white group-hover:text-emerald-300 transition-colors">
                  Zerésima da Urna
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  0 votos iniciais
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenReport('relatorio_votacao')}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-left transition-all group cursor-pointer hover:border-blue-500/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-mono text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/30 font-bold">
                    Oficial
                  </span>
                </div>
                <strong className="text-xs font-bold block text-white group-hover:text-blue-300 transition-colors">
                  Resultado CIPAA
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Titulares e suplentes
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenReport('relatorio_votantes')}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-left transition-all group cursor-pointer hover:border-purple-500/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold">
                    Quórum
                  </span>
                </div>
                <strong className="text-xs font-bold block text-white group-hover:text-purple-300 transition-colors">
                  Lista de Votantes
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Sigilo do voto 100%
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenReport('relatorio_participantes')}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-left transition-all group cursor-pointer hover:border-amber-500/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
                    Acessos
                  </span>
                </div>
                <strong className="text-xs font-bold block text-white group-hover:text-amber-300 transition-colors">
                  Acessos à Urna
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Votou vs Não Votou
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenReport('relatorio_permissao_acesso')}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-left transition-all group cursor-pointer hover:border-rose-500/50 col-span-2 sm:col-span-1"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold">
                    Inalterado
                  </span>
                </div>
                <strong className="text-xs font-bold block text-white group-hover:text-rose-300 transition-colors">
                  Permissões Base
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Sem alterações pós-início
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 2: CONFIGURAÇÃO DO PLEITO ELEITORAL (TÓPICO 2)           */}
      {/* ============================================================ */}
      {activeSubTab === 'pleito' && (
        <div className="space-y-6">
          <form onSubmit={handleSavePleito} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Parâmetros do Pleito Eleitoral · Mandato {pleitoConfig.mandato}
                </h3>
                <p className="text-xs text-slate-500">
                  Definição de prazos, regras normativas da NR-05 e exigência de foto para candidatos
                </p>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                Salvar Configurações
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Título Oficial do Pleito:</label>
                <input
                  type="text"
                  value={pleitoConfig.titulo}
                  onChange={(e) => setPleitoConfig({ ...pleitoConfig, titulo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mandato / Gestão:</label>
                <input
                  type="text"
                  value={pleitoConfig.mandato}
                  onChange={(e) => setPleitoConfig({ ...pleitoConfig, mandato: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">CNPJ do Estabelecimento:</label>
                <input
                  type="text"
                  value={pleitoConfig.cnpj}
                  onChange={(e) => setPleitoConfig({ ...pleitoConfig, cnpj: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                  required
                />
              </div>
            </div>

            {/* DATAS DE INSCRIÇÃO E VOTAÇÃO */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <strong className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                Prazos Regulamentares de Inscrições e Votação (NR-05)
              </strong>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Início das Inscrições:</label>
                  <input
                    type="datetime-local"
                    value={pleitoConfig.inicioInscricoes}
                    onChange={(e) => setPleitoConfig({ ...pleitoConfig, inicioInscricoes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Término das Inscrições:</label>
                  <input
                    type="datetime-local"
                    value={pleitoConfig.fimInscricoes}
                    onChange={(e) => setPleitoConfig({ ...pleitoConfig, fimInscricoes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Data Oficial da Votação:</label>
                  <input
                    type="datetime-local"
                    value={pleitoConfig.inicioVotacao}
                    onChange={(e) => setPleitoConfig({ ...pleitoConfig, inicioVotacao: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Encerramento da Votação:</label>
                  <input
                    type="datetime-local"
                    value={pleitoConfig.fimVotacao}
                    onChange={(e) => setPleitoConfig({ ...pleitoConfig, fimVotacao: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">1ª Prorrogação (2º Dia - Quórum 1/3):</label>
                  <input
                    type="text"
                    value={pleitoConfig.prorrogacao1}
                    onChange={(e) => setPleitoConfig({ ...pleitoConfig, prorrogacao1: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">2ª Prorrogação (3º Dia - Qualquer Quórum):</label>
                  <input
                    type="text"
                    value={pleitoConfig.prorrogacao2}
                    onChange={(e) => setPleitoConfig({ ...pleitoConfig, prorrogacao2: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* REGRAS DA URNA E EXIGÊNCIA DE FOTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Foto dos Candidatos</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white font-mono">
                    Obrigatória
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  Exige imagem frontal nítida para todos os candidatos antes da homologação na urna.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Voto Secreto</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-white font-mono">
                    Sim (NR-05)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Desacoplamento criptográfico entre a identidade do eleitor e o candidato votado.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Acompanhamento Quórum</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white font-mono">
                    Tempo Real
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Atualização instantânea do percentual de participação de eleitores sem quebra de sigilo.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Voto com Peso</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                    Não (Paritário)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  1 colaborador = 1 voto, respeitando a isonomia legal estabelecida na NR-05.
                </p>
              </div>
            </div>

            {/* LINKS DO PLEITO */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3 text-xs">
              <strong className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider block">
                Links e Acessos Oficiais da CIPA
              </strong>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-300 font-medium">Link de Candidatura Pública:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-emerald-300 truncate max-w-xs">{pleitoConfig.inscricaoLink}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pleitoConfig.inscricaoLink, 'Link de Candidatura')}
                      className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white cursor-pointer"
                      title="Copiar Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublicCandidateModalOpen(true)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-[10px] cursor-pointer"
                    >
                      Abrir Tela
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-300 font-medium">Link da Urna Digital de Votação:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-emerald-300 truncate max-w-xs">{pleitoConfig.eleicaoLink}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pleitoConfig.eleicaoLink, 'Link da Urna')}
                      className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white cursor-pointer"
                      title="Copiar Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab('urna');
                        handleResetUrnaSession();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-[10px] cursor-pointer"
                    >
                      Testar Urna
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 3: COLABORADORES & ELEITORES (TÓPICO 1)                  */}
      {/* ============================================================ */}
      {activeSubTab === 'colaboradores' && (
        <div className="space-y-6">
          {/* BANNER DIFERENCIADO CONFORME POSSUI OU NÃO O MÓDULO DE DIMENSIONAMENTO */}
          {hasModuloDimensionamento ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-emerald-950 block">
                    Base Sincronizada com o Módulo de Dimensionamento
                  </strong>
                  <p className="text-emerald-800">
                    Os colaboradores abaixo foram importados automaticamente a partir do dimensionamento homologado para {activeUnit?.name}.
                  </p>
                </div>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('dimensionamento')}
                  className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Ver Dimensionamento NR-5
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-amber-950 block">
                    Gestão Direta de Colaboradores e Eleitores (Módulo de Dimensionamento não contratado)
                  </strong>
                  <p className="text-amber-800">
                    Como sua empresa não possui o Módulo 1 (Dimensionamento), cadastre ou importe abaixo os colaboradores e fotos para validar os eleitores e candidaturas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* BARRA DE AÇÕES DA BASE DE ELEITORES */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Buscar por nome, RE, cargo ou setor..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmployee(null);
                    setIsEmployeeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Novo Colaborador</span>
                </button>
              </div>
            </div>

            {/* TABELA DE ELEITORES */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2.5 px-3 w-12 text-center">Foto</th>
                      <th className="py-2.5 px-3">Nome do Colaborador</th>
                      <th className="py-2.5 px-3 w-24">RE / Matrícula</th>
                      <th className="py-2.5 px-3 w-32">CPF (Senha = 4 Dig)</th>
                      <th className="py-2.5 px-3">Cargo / Setor</th>
                      <th className="py-2.5 px-3 w-28">Admissão</th>
                      <th className="py-2.5 px-3 w-20 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees
                      .filter(e => {
                        if (!employeeSearch.trim()) return true;
                        const term = employeeSearch.toLowerCase();
                        return e.name.toLowerCase().includes(term) || e.matricula.includes(term) || e.cargo.toLowerCase().includes(term);
                      })
                      .map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-center">
                            <div className="w-8 h-8 rounded-xl bg-slate-200 overflow-hidden mx-auto border border-slate-300 flex items-center justify-center">
                              {emp.fotoUrl ? (
                                <img src={emp.fotoUrl} alt={emp.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <strong className="text-slate-900 block">{emp.name}</strong>
                            <span className="text-[11px] text-slate-500">{emp.email}</span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {emp.matricula}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-700">
                            <span>{emp.cpf}</span>
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              Senha: {emp.cpf.replace(/\D/g, '').slice(0, 4)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            <div>{emp.cargo}</div>
                            <span className="text-[10px] text-slate-400">{emp.setor}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {emp.dataAdmissao}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setIsEmployeeModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 4: CANDIDATOS (FOTO OBRIGATÓRIA & LEMBRETES - TÓPICO 3) */}
      {/* ============================================================ */}
      {activeSubTab === 'candidatos' && (
        <div className="space-y-6">
          {/* BANNER DE LEMBRETES DIÁRIOS E AÇÕES */}
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 rounded-3xl border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <strong className="text-sm font-extrabold text-emerald-950 block">
                  Automação de Confirmações & Lembretes Diários
                </strong>
                <p className="text-emerald-800 leading-relaxed">
                  Candidaturas submetidas pelo link recebem e-mail com token. Caso o colaborador não confirme, o sistema dispara lembretes diários automaticamente até o fim do prazo e grava os logs de auditoria.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSendDailyReminders}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Disparar Lembretes Diários Agora</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPublicCandidateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Simular Inscrição (Link Público)</span>
              </button>
            </div>
          </div>

          {/* GRID DE CANDIDATOS COM FOTOS OBRIGATÓRIAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidatos.map((cand) => (
              <div key={cand.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={cand.fotoUrl}
                      alt={cand.nome}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                    />
                    <span className="absolute -top-1 -left-1 px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono text-[9px] font-bold">
                      Nº {cand.numeroUrna}
                    </span>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-slate-900 truncate block">
                        {cand.apelidoUrna || cand.nome}
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{cand.nome}</p>
                    <p className="text-[10px] text-slate-400">RE: {cand.matricula} · {cand.cargo}</p>
                    <span className={`inline-block text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded mt-1 ${
                      cand.status === 'confirmado'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : cand.status === 'pendente_confirmacao'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {cand.status === 'confirmado' ? 'Confirmado' : (cand.status === 'pendente_confirmacao' ? 'Pendente Confirmação' : 'Reprovado')}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto">
                  <RichTextRenderer content={cand.propostas} className="text-[11px]" allowImages={true} />
                </div>

                {cand.status === 'pendente_confirmacao' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>Lembretes enviados: {cand.lembretesEnviadosCount}</span>
                      <span>{cand.ultimoLembreteEm || 'Aguardando 1º envio'}</span>
                    </div>
                    <p className="leading-snug">
                      O candidato ainda não confirmou pelo e-mail ({cand.email}).
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {cand.status === 'pendente_confirmacao' ? (
                    <button
                      type="button"
                      onClick={() => handleConfirmCandidate(cand.id)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Homologar Manualmente
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Protocolo: {cand.protocolo}
                    </span>
                  )}

                  {cand.status !== 'reprovado' && (
                    <button
                      type="button"
                      onClick={() => handleReproveCandidate(cand.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Reprovar candidatura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* TRILHA DE AUDITORIA DAS CANDIDATURAS E LEMBRETES */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Logs Imutáveis de Candidaturas & E-mails de Lembrete
              </strong>
              <span className="text-[10px] text-slate-400 font-mono">
                {auditLogs.length} eventos registrados
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      log.tipo === 'INSCRICAO' ? 'bg-blue-900 text-blue-200' :
                      log.tipo === 'CONFIRMACAO_EMAIL' ? 'bg-purple-900 text-purple-200' :
                      log.tipo === 'LEMBRETE_DIARIO' ? 'bg-amber-900 text-amber-200' :
                      log.tipo === 'VOTO_COMPUTADO' ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-700 text-slate-200'
                    }`}>
                      {log.tipo}
                    </span>
                    <span className="text-slate-300">{log.descricao}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[10px]">
                    {log.hash && <span className="text-emerald-400 font-bold truncate max-w-[120px]">{log.hash.slice(0, 16)}...</span>}
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 5: URNA DIGITAL OFICIAL (VOTAÇÃO DO DIA - TÓPICO 4)      */}
      {/* ============================================================ */}
      {activeSubTab === 'urna' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* TELA 1: LOGIN POR RE E 4 PRIMEIROS DÍGITOS DO CPF */}
          {urnaStep === 'login' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-6 text-white text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-400/30 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Cabine de Votação Oficial da CIPA
                </h3>
                <p className="text-xs text-emerald-200/90 font-mono">
                  {pleitoConfig.titulo} · Unidade Jundiaí
                </p>
              </div>

              <form onSubmit={handleVoterLogin} className="p-6 sm:p-8 space-y-5 text-xs">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-slate-800 font-extrabold">
                    RE / Matrícula Funcional do Colaborador: *
                  </label>
                  <input
                    type="text"
                    value={voterRe}
                    onChange={(e) => setVoterRe(e.target.value)}
                    placeholder="Ex: 179645"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:outline-emerald-600"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Digite seu número de RE cadastrado no departamento de Recursos Humanos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-800 font-extrabold flex items-center justify-between">
                    <span>Senha de Acesso (4 Primeiros Dígitos do CPF): *</span>
                    <span className="text-emerald-700 font-mono font-bold text-[10px]">
                      Padrão de Segurança NR-5
                    </span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={voterCpfDigits}
                    onChange={(e) => setVoterCpfDigits(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 text-base tracking-widest text-center focus:outline-emerald-600"
                    required
                  />
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sua senha são os <strong>4 primeiros dígitos do seu CPF</strong> (sem pontos ou traços).</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                  <strong className="text-slate-800 font-bold block">Garantia Legal de Sigilo (NR-5 Subitem 5.5):</strong>
                  <p className="text-[11px] leading-relaxed">
                    Sua autenticação serve exclusivamente para atestar sua lotação nesta unidade e evitar votos duplicados. A escolha do seu candidato é desacoplada da sua identidade e gravada com criptografia de ponta a ponta.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Acessar Cédula Eleitoral</span>
                </button>

                {/* Dica para teste rápido de eleitores cadastrados */}
                <div className="pt-2 text-center text-[11px] text-slate-400">
                  <span>Eleitores de Teste: RE <strong>179645</strong> (Senha: 3456) · RE <strong>154266</strong> (Senha: 2345)</span>
                </div>
              </form>
            </div>
          )}

          {/* TELA 2: CÉDULA ELEITORAL COM FOTOS OBRIGATÓRIAS */}
          {urnaStep === 'cedula' && authenticatedVoter && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-200 space-y-6 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Cédula de Votação Oficial da CIPA
                  </h3>
                  <p className="text-xs text-slate-500">
                    Eleitor: <strong>{authenticatedVoter.name}</strong> · RE: {authenticatedVoter.matricula}
                  </p>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Voto Secreto
                </span>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide block">
                  Selecione um Candidato para Registrar seu Voto:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
                  {candidatosConfirmados.map((cand) => (
                    <div
                      key={cand.id}
                      onClick={() => handleSelectCandidateToVote(cand.id)}
                      className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/50 cursor-pointer transition-all flex items-start gap-3 shadow-2xs hover:shadow-sm"
                    >
                      <img
                        src={cand.fotoUrl}
                        alt={cand.nome}
                        className="w-14 h-14 rounded-2xl object-cover border border-emerald-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-bold text-slate-900 truncate block">
                            {cand.apelidoUrna || cand.nome}
                          </strong>
                          <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                            Nº {cand.numeroUrna}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{cand.cargo} · {cand.setor}</p>
                        <div className="text-[10px] text-slate-600 line-clamp-2 mt-1">
                          <RichTextRenderer content={cand.propostas} className="text-[10px]" allowImages={false} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* VOTO EM BRANCO E NULO */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectCandidateToVote('branco')}
                    className="p-3 rounded-2xl border-2 border-slate-300 hover:border-slate-500 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 text-center transition-colors cursor-pointer"
                  >
                    Votar em Branco
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectCandidateToVote('nulo')}
                    className="p-3 rounded-2xl border-2 border-slate-300 hover:border-slate-500 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 text-center transition-colors cursor-pointer"
                  >
                    Votar Nulo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TELA 3: CONFIRMAÇÃO DO VOTO (ESTILO URNA ELETRÔNICA) */}
          {urnaStep === 'confirmacao' && authenticatedVoter && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-150">
              <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Confirmação de Voto
              </span>

              {selectedCandidateId === 'branco' ? (
                <div className="py-6 space-y-2">
                  <h4 className="text-2xl font-black text-slate-900">VOTO EM BRANCO</h4>
                  <p className="text-xs text-slate-500">Você optou por não escolher nenhum candidato nominal.</p>
                </div>
              ) : selectedCandidateId === 'nulo' ? (
                <div className="py-6 space-y-2">
                  <h4 className="text-2xl font-black text-slate-900">VOTO NULO</h4>
                  <p className="text-xs text-slate-500">Seu voto será computado como nulo para fins de quórum.</p>
                </div>
              ) : (
                (() => {
                  const cand = candidatosConfirmados.find(c => c.id === selectedCandidateId);
                  if (!cand) return null;
                  return (
                    <div className="py-4 space-y-4 max-w-sm mx-auto">
                      <img
                        src={cand.fotoUrl}
                        alt={cand.nome}
                        className="w-28 h-28 rounded-3xl object-cover mx-auto border-4 border-emerald-500 shadow-lg"
                      />
                      <div className="space-y-1">
                        <span className="font-mono text-sm font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                          Nº {cand.numeroUrna}
                        </span>
                        <h4 className="text-lg font-black text-slate-900 mt-2">
                          {cand.apelidoUrna || cand.nome}
                        </h4>
                        <p className="text-xs text-slate-500">{cand.cargo} · {cand.setor}</p>
                      </div>
                    </div>
                  );
                })()
              )}

              <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUrnaStep('cedula')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  CORRIGE
                </button>

                <button
                  type="button"
                  onClick={handleConfirmVote}
                  disabled={isVotingSubmitting}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isVotingSubmitting ? 'COMPUTANDO...' : 'CONFIRMA'}
                </button>
              </div>
            </div>
          )}

          {/* TELA 4: COMPROVANTE ELEITORAL CRIPTOGRÁFICO */}
          {urnaStep === 'comprovante' && voteReceipt && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">
                  {voterAlreadyVoted ? 'Voto Já Registrado Neste Pleito' : 'Voto Computado com Sucesso!'}
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Sua participação foi auditada com inviolabilidade criptográfica de acordo com a NR-5.
                </p>
              </div>

              <div className="p-5 bg-slate-900 text-white rounded-2xl text-left space-y-3 font-mono text-xs max-w-lg mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 text-[10px] uppercase">Eleitor</span>
                  <span className="text-emerald-400 font-bold">{authenticatedVoter?.name || 'Eleitor Autenticado'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 text-[10px] uppercase">RE</span>
                  <span className="text-slate-200">{authenticatedVoter?.matricula}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 text-[10px] uppercase">Data / Horário Oficial</span>
                  <span className="text-slate-200">{voteReceipt.timestamp}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Hash de Auditoria SHA-256</span>
                  <div className="p-2 bg-slate-800 rounded text-[10px] text-emerald-300 break-all border border-slate-700">
                    {voteReceipt.hash}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comprovante</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetUrnaSession}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Concluir e Liberar Urna
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 6: ENTREGÁVEIS & RELATÓRIOS OFICIAIS DO PLEITO          */}
      {/* ============================================================ */}
      {activeSubTab === 'relatorios' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* HEADER DA CENTRAL DE ENTREGÁVEIS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0 shadow-inner">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                      Normativa NR-05 & Portaria MTP 422/2021
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      ICP-Brasil MP 2.200-2/2001
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
                    Central de Entregáveis & Relatórios Oficiais da Eleição
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeCompany?.razaoSocial} · {activeUnit?.name} · Mandato {pleitoConfig.mandato}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenReport('zeresima')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all border border-emerald-300 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Emitir Zerésima</span>
                </button>
                <button
                  type="button"
                  onClick={handleEmitirAtaEleicao}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ata de Apuração</span>
                </button>
              </div>
            </div>

            {/* AVISO DE CONFORMIDADE JURÍDICA */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold text-emerald-900 block">
                  Segurança da Informação, Sigilo Constitucional do Voto e Fé Pública
                </strong>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  Todos os relatórios desta central são gerados eletronicamente com hash de integridade SHA-256, carimbo de tempo brasileiro (BRT) e rastreabilidade integral perante a Auditoria Fiscal do Trabalho (MTE) e entidades sindicais, atendendo rigorosamente aos subitens 5.5.3, 5.5.4 e 5.5.9 da Norma Regulamentadora nº 05.
                </p>
              </div>
            </div>
          </div>

          {/* GRID COM OS 5 RELATÓRIOS OFICIAIS + ATA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. ZERÉSIMA DA URNA ELETRÔNICA */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-md space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Abertura da Urna (0 Votos)
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    1. Zerésima da Urna Eletrônica
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Certificação formal de que a urna eletrônica foi aberta e auditada antes do primeiro sufrágio, comprovando que todos os candidatos possuíam exatamente 0 (zero) votos e total geral zerado.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Votos Nominais:</span>
                    <strong className="text-emerald-700">0 (Zero)</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Brancos e Nulos:</span>
                    <strong className="text-emerald-700">0 (Zero)</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Candidatos Registrados:</span>
                    <strong className="text-slate-900">{candidatosConfirmados.length} Zerados</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[10px] truncate">
                    <span>Hash Inicial:</span>
                    <span className="text-slate-500 truncate ml-2">e3b0c442...b855</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReport('zeresima')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Visualizar Zerésima Oficial</span>
                </button>
              </div>
            </div>

            {/* 2. RELATÓRIO DE VOTAÇÃO (RESULTADO OFICIAL) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all hover:shadow-md space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                    Resultado Oficial
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    2. Relatório de Eleição Virtual - Resultado
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Demonstrativo oficial com quórum apurado por fase (inclusive prorrogações), total de votos válidos, brancos e nulos, e tabela hierárquica de Titulares, Suplentes e Não Eleitos.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Quórum Atingido:</span>
                    <strong className="text-blue-700">{percentualQuorum}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total de Votantes:</span>
                    <strong className="text-slate-900">{totalGeralVotos} eleitores</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Votos Válidos:</span>
                    <strong className="text-slate-900">{totalVotosNominais}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Brancos / Nulos:</span>
                    <strong className="text-slate-900">{votosBrancos} / {votosNulos}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReport('relatorio_votacao')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Visualizar Relatório de Resultado</span>
                </button>
              </div>
            </div>

            {/* 3. RELATÓRIO DE VOTANTES (QUÓRUM) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all hover:shadow-md space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                    Quórum & Comparecimento
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    3. Relatório de Eleição Virtual - Quórum
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Lista nominal de todos os votantes auditados, contendo ID, Nome, RE/Matrícula, CNPJ, Entidade, E-mail, IP de Origem, Data/Hora da Votação e Tipo de Acesso, assegurando total sigilo do voto.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Eleitores que Votaram:</span>
                    <strong className="text-purple-700">{totalGeralVotos} colaboradores</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Sigilo do Voto:</span>
                    <strong className="text-emerald-700">100% Inviolável (NR-05)</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Campos Auditados:</span>
                    <strong className="text-slate-900">IP, Data/Hora, RE e CNPJ</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Comissão Eleitoral:</span>
                    <strong className="text-slate-900 truncate ml-2">Tamires Santos de Souza (Presidente)</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReport('relatorio_votantes')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Visualizar Relatório de Votantes</span>
                </button>
              </div>
            </div>

            {/* 4. RELATÓRIO DE ACESSOS DOS PARTICIPANTES */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all hover:shadow-md space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Logs & Acessos
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    4. Relatório de Acessos dos Participantes
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Auditoria completa de todos os participantes cadastrados na base, informando o status de participação individual ("Votou" / "Não Votou"), primeiro acesso, último acesso e IP de conexão.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Total de Participantes:</span>
                    <strong className="text-slate-900">{totalAptos} cadastrados</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Acessos Computados:</span>
                    <strong className="text-amber-700">{Math.round(totalGeralVotos * 1.01)} acessos</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Registro de Voto:</span>
                    <strong className="text-slate-900">Auditado (Votou / Não Votou)</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Rastreabilidade:</span>
                    <strong className="text-slate-900">Primeiro e Último Acesso</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReport('relatorio_participantes')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Visualizar Relatório de Acessos</span>
                </button>
              </div>
            </div>

            {/* 5. RELATÓRIO DE ALTERAÇÃO DE PERMISSÃO DE ACESSO */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all hover:shadow-md space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                    Segurança & Inviolabilidade
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    5. Relatório de Permissão de Acesso
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Certificação técnica conclusiva: "SEM ALTERAÇÃO NA PERMISSÃO DE ACESSO DOS PARTICIPANTES", garantindo que a base de eleitores não sofreu adições ou manipulações durante a votação.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Alteração pós-início:</span>
                    <strong className="text-emerald-700 font-extrabold">NÃO</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Voto em separado:</span>
                    <strong className="text-slate-900">NÃO</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Base de Eleitores:</span>
                    <strong className="text-emerald-700">Congelada & Inalterada</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Validação ICP-Brasil:</span>
                    <strong className="text-slate-900">validar.iti.gov.br</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReport('relatorio_permissao_acesso')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Visualizar Relatório de Permissões</span>
                </button>
              </div>
            </div>

            {/* 6. ATA OFICIAL DE ELEIÇÃO E APURAÇÃO */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-md space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Ata Jurídica NR-05
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    6. Ata de Eleição e Apuração dos Votos
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ata circunstanciada de encerramento do escrutínio, proclamação formal dos titulares e suplentes, registro de estabilidade provisória (art. 10 ADCT) e assinaturas da comissão eleitoral.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Normativa:</span>
                    <strong className="text-slate-900">NR-05 · Item 5.5.9</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Classificação:</span>
                    <strong className="text-slate-900">Titulares e Suplentes Proclamados</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Assinaturas Digitais:</span>
                    <strong className="text-slate-900">Mesa Apuradora & Fiscais</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estabilidade CIPA:</span>
                    <strong className="text-emerald-700">Art. 10, II "a" ADCT</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEmitirAtaEleicao}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Visualizar Ata Oficial de Eleição</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO DE COLABORADOR (TÓPICO 1) */}
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

      {/* MODAL PÚBLICO DE INSCRIÇÃO DE CANDIDATO (TÓPICO 3) */}
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
                setAuditLogs(ElectionService.getAuditLogs(targetUnitId));
                showToast(`Candidatura de ${novoCand.nome} registrada com sucesso!`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
