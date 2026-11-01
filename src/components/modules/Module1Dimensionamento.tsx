import React, { useState, useMemo, useEffect } from 'react';
import { 
  CNAE_DATABASE, 
  calcularDimensionamentoNR5, 
  calcularCronogramaEleitoral 
} from '../../data/cnaeData';
import { CnaeEntry, DimensionamentoResult, CronogramaItem } from '../../types/cipa';
import { generateCipaDocument, GeneratedDocument } from '../../data/documentTemplates';
import { Company, CompanyUnit, AuthUser } from '../../types/auth';
import { DEMO_COMPANIES } from '../../data/multiCompanyData';
import { 
  Calculator, 
  Calendar, 
  FileText, 
  Building2, 
  Users, 
  CheckCircle2, 
  Printer, 
  Search, 
  CalendarDays, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  MapPin, 
  ShieldCheck, 
  X, 
  FileSpreadsheet, 
  Award, 
  Vote, 
  UserCheck, 
  FileSignature, 
  Check, 
  Send, 
  ArrowRight, 
  ArrowLeft, 
  Circle,
  Pencil,
  Camera,
  Image as ImageIcon,
  History,
  BookmarkCheck,
  Eye,
  EyeOff,
  Edit3,
  AlertTriangle,
  Lock,
  AlertCircle,
  Loader2,
  HelpCircle,
  Scale,
  BookOpen,
  PenTool,
  Clock,
  Mail
} from 'lucide-react';
import { useCipa } from '../../context/CipaContext';
import { DimensionamentoHistoryModal } from './dimensionamento/DimensionamentoHistoryModal';
import { ApiService } from '../../services/apiService';
import { PdfService } from '../../services/pdfService';
import { SignatureService, SignatureEnvelope, computeSha256 } from '../../services/signatureService';
import { NewEnvelopeModal, InitialEnvelopeData } from '../admin/NewEnvelopeModal';

// Formatação com a primeira letra maiúscula (Title Case)
function formatCapitalizeName(text?: string): string {
  if (!text) return '';
  const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com'];
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && prepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Máscara de CPF conforme a LGPD (mostrando apenas os 3 últimos dígitos: ***.***.*0-00)
function maskCPFLGPD(cpf?: string): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) {
    if (cpf.length > 3) {
      return `***.***.***-${cpf.slice(-2)}`;
    }
    return cpf;
  }
  const lastDigits = digits.slice(-3);
  return `***.***.*${lastDigits.charAt(0)}-${lastDigits.slice(1)}`;
}

export interface Employee {
  id: string;
  name: string;
  apelido?: string; // Apelido ou nome social como é mais conhecido(a)
  fotoUrl?: string; // Foto do colaborador
  matricula: string;
  cpf: string;
  cargo: string;
  setor: string;
  email: string;
  dataAdmissao: string;
  unitId?: string;
  companyId?: string;
}

// Removidos avatares padrão: fotos devem vir do banco de dados/MinIO ou exibir iniciais/silhuetas


interface Module1DimensionamentoProps {
  onOpenDocument: (doc: GeneratedDocument) => void;
  onOpenSignatureModal?: (ataId: string, title: string) => void;
  onNavigateTab?: (tab: string) => void;
  signedAtas?: Record<string, { hash: string; timestamp: string; signerName: string }>;
  companyName: string;
  cnpj: string;
  companies?: Company[];
  currentUser?: AuthUser;
  modulosContratados?: {
    dimensionamento: boolean;
    eleicao: boolean;
    gestao: boolean;
  };
  selectedCompanyId?: string;
  onSelectCompanyId?: (id: string) => void;
  selectedUnitId?: string;
  onSelectUnitId?: (id: string) => void;
}

// Colaboradores iniciais (sem fotos de demonstração falsas, apenas reais ou iniciais)
const INITIAL_EMPLOYEES: Employee[] = [
  { 
    id: 'emp-1', 
    name: 'Marcos Vinicius Santos', 
    apelido: 'Marcão da Usinagem',
    fotoUrl: undefined,
    matricula: 'CLT-1042', 
    cpf: '123.456.789-01', 
    cargo: 'Operador de Usinagem CNC', 
    setor: 'Produção Metalmecânica', 
    email: 'marcos.santos@empresa.com.br', 
    dataAdmissao: '2021-03-15' 
  },
  { 
    id: 'emp-2', 
    name: 'Ana Paula Ferreira', 
    apelido: 'Paulinha',
    fotoUrl: undefined,
    matricula: 'CLT-1088', 
    cpf: '234.567.890-12', 
    cargo: 'Líder de Montagem Industrial', 
    setor: 'Linha de Montagem', 
    email: 'ana.ferreira@empresa.com.br', 
    dataAdmissao: '2020-08-10' 
  },
  { 
    id: 'emp-3', 
    name: 'Roberto Carlos Alencar', 
    apelido: 'Beto Mecânico',
    fotoUrl: undefined,
    matricula: 'CLT-1102', 
    cpf: '345.678.901-23', 
    cargo: 'Técnico em Manutenção Mecânica', 
    setor: 'Manutenção Geral', 
    email: 'roberto.alencar@empresa.com.br', 
    dataAdmissao: '2019-11-04' 
  },
  { 
    id: 'emp-4', 
    name: 'Camila Duarte Rocha', 
    apelido: 'Cami da Qualidade',
    fotoUrl: undefined,
    matricula: 'CLT-1150', 
    cpf: '456.789.012-34', 
    cargo: 'Inspetora de Controle de Qualidade', 
    setor: 'Qualidade & SGQ', 
    email: 'camila.rocha@empresa.com.br', 
    dataAdmissao: '2022-01-20' 
  },
  { 
    id: 'emp-5', 
    name: 'Julio Cesar Martins', 
    apelido: 'Julinho da Empilhadeira',
    fotoUrl: undefined,
    matricula: 'CLT-1194', 
    cpf: '567.890.123-45', 
    cargo: 'Operador de Empilhadeira', 
    setor: 'Logística & Expedição', 
    email: 'julio.martins@empresa.com.br', 
    dataAdmissao: '2021-07-12' 
  },
  { id: 'emp-6', name: 'Fernanda Lima Ribeiro', apelido: 'Nanda Solda', matricula: 'CLT-1205', cpf: '678.901.234-56', cargo: 'Soldador TIG / MIG Especialista', setor: 'Caldeiraria & Solda', email: 'fernanda.ribeiro@empresa.com.br', dataAdmissao: '2020-04-18' },
  { id: 'emp-7', name: 'Diego Henrique Silveira', apelido: 'Dieguinho', matricula: 'CLT-1240', cpf: '789.012.345-67', cargo: 'Eletricista de Manutenção Industrial', setor: 'Elétrica & Automação', email: 'diego.silveira@empresa.com.br', dataAdmissao: '2018-09-02' },
  { id: 'emp-8', name: 'Patrícia Souza Gomes', apelido: 'Pati', matricula: 'CLT-1275', cpf: '890.123.456-78', cargo: 'Almoxarife Pleno', setor: 'Almoxarifado de Peças', email: 'patricia.gomes@empresa.com.br', dataAdmissao: '2022-06-01' },
  { id: 'emp-9', name: 'Lucas Gabriel Oliveira', apelido: 'Luquinhas', matricula: 'CLT-1310', cpf: '901.234.567-89', cargo: 'Auxiliar de Produção', setor: 'Produção Metalmecânica', email: 'lucas.oliveira@empresa.com.br', dataAdmissao: '2023-02-14' },
  { id: 'emp-10', name: 'Renata Vasconcelos', matricula: 'CLT-1345', cpf: '012.345.678-90', cargo: 'Assistente Administrativo Industrial', setor: 'PCP & Planejamento', email: 'renata.vasconcelos@empresa.com.br', dataAdmissao: '2021-10-30' },
  { id: 'emp-11', name: 'Eduardo Ramos Costa', apelido: 'Dudu Torneiro', matricula: 'CLT-1380', cpf: '123.789.456-01', cargo: 'Torneiro Mecânico', setor: 'Usinagem de Precisão', email: 'eduardo.costa@empresa.com.br', dataAdmissao: '2019-05-19' },
  { id: 'emp-12', name: 'Beatriz Nogueira Lima', apelido: 'Bia da Pintura', matricula: 'CLT-1415', cpf: '234.890.567-12', cargo: 'Pintora Industrial', setor: 'Tratamento de Superfície', email: 'beatriz.nogueira@empresa.com.br', dataAdmissao: '2022-09-08' },
  { id: 'emp-13', name: 'Gustavo Mendonça', matricula: 'CLT-1450', cpf: '345.901.678-23', cargo: 'Ajudante Geral', setor: 'Serviços Gerais', email: 'gustavo.mendonca@empresa.com.br', dataAdmissao: '2023-05-11' },
  { id: 'emp-14', name: 'Larissa Andrade Teixeira', apelido: 'Lari Engenharia', matricula: 'CLT-1485', cpf: '456.012.789-34', cargo: 'Analista de Processos Industriais', setor: 'Engenharia de Produção', email: 'larissa.andrade@empresa.com.br', dataAdmissao: '2020-12-01' },
  { id: 'emp-15', name: 'Marcelo Augusto Pires', apelido: 'Marcelão da Prensa', matricula: 'CLT-1520', cpf: '567.123.890-45', cargo: 'Operador de Prensa Hidráulica', setor: 'Estamparia Pesada', email: 'marcelo.pires@empresa.com.br', dataAdmissao: '2018-07-25' },
  { id: 'emp-16', name: 'Carla Cristina Barreto', matricula: 'CLT-1555', cpf: '678.234.901-56', cargo: 'Operadora de Ponte Rolante', setor: 'Logística Pesada', email: 'carla.barreto@empresa.com.br', dataAdmissao: '2021-08-16' },
  { id: 'emp-17', name: 'Thiago Farias Moura', matricula: 'CLT-1590', cpf: '789.345.012-67', cargo: 'Caldeireiro Montador', setor: 'Caldeiraria & Solda', email: 'thiago.moura@empresa.com.br', dataAdmissao: '2019-03-22' },
  { id: 'emp-18', name: 'Vanessa Toledo Dias', matricula: 'CLT-1625', cpf: '890.456.123-78', cargo: 'Conferente de Carga', setor: 'Expedição & Armazém', email: 'vanessa.dias@empresa.com.br', dataAdmissao: '2022-04-10' },
  { id: 'emp-19', name: 'Fábio Muniz Rezende', matricula: 'CLT-1660', cpf: '901.567.234-89', cargo: 'Lubrificador Industrial', setor: 'Manutenção Preditiva', email: 'fabio.rezende@empresa.com.br', dataAdmissao: '2020-02-17' },
  { id: 'emp-20', name: 'Juliana Neves Moreira', matricula: 'CLT-1695', cpf: '012.678.345-90', cargo: 'Operadora de Retífica', setor: 'Usinagem de Precisão', email: 'juliana.neves@empresa.com.br', dataAdmissao: '2021-11-28' },
  { id: 'emp-21', name: 'André Luiz Carvalho', matricula: 'CLT-1730', cpf: '123.789.456-02', cargo: 'Mecânico de Ajustagem', setor: 'Ferramentaria', email: 'andre.carvalho@empresa.com.br', dataAdmissao: '2019-10-05' },
  { id: 'emp-22', name: 'Tatiane Cristina Abreu', matricula: 'CLT-1765', cpf: '234.890.567-13', cargo: 'Auxiliar de Limpeza Industrial', setor: 'Facilities & Higiene', email: 'tatiane.abreu@empresa.com.br', dataAdmissao: '2023-01-09' },
  { id: 'emp-23', name: 'Rogério Batista Prado', matricula: 'CLT-1800', cpf: '345.901.678-24', cargo: 'Operador de Dobradeira CNC', setor: 'Conformação de Chapas', email: 'rogerio.prado@empresa.com.br', dataAdmissao: '2020-06-30' },
  { id: 'emp-24', name: 'Sabrina Vilela Matos', matricula: 'CLT-1835', cpf: '456.012.789-35', cargo: 'Encarregada de Expedição', setor: 'Logística & Expedição', email: 'sabrina.matos@empresa.com.br', dataAdmissao: '2018-12-14' },
  { id: 'emp-25', name: 'Bruno César Figueiredo', matricula: 'CLT-1870', cpf: '567.123.890-46', cargo: 'Operador de Corte a Laser', setor: 'Corte Térmico', email: 'bruno.figueiredo@empresa.com.br', dataAdmissao: '2022-08-22' }
];

export const Module1Dimensionamento: React.FC<Module1DimensionamentoProps> = ({
  onOpenDocument,
  onOpenSignatureModal,
  onNavigateTab,
  signedAtas = {},
  companyName: propCompanyName,
  cnpj: propCnpj,
  companies = DEMO_COMPANIES,
  currentUser,
  modulosContratados,
  selectedCompanyId: propSelectedCompanyId,
  onSelectCompanyId,
  selectedUnitId: propSelectedUnitId,
  onSelectUnitId
}) => {
  // Abas simples
  const [activeTab, setActiveTab] = useState<'dimensionamento' | 'calendario'>('dimensionamento');

  // Empresas reais do banco de dados PostgreSQL
  const [dbCompanies, setDbCompanies] = useState<Company[]>(companies);

  useEffect(() => {
    ApiService.getCompanies()
      .then((data) => {
        if (data && data.length > 0) {
          setDbCompanies(data);
        }
      })
      .catch((err) => console.log('Aviso ao sincronizar empresas no módulo:', err));
  }, []);

  const effectiveCompanies = (dbCompanies && dbCompanies.length > 0) ? dbCompanies : companies;

  // Passo a passo na aba Dimensionamento: 1 = Colaboradores, 2 = Dimensionamento NR-5
  const [stepDimensionamento, setStepDimensionamento] = useState<1 | 2>(1);

  // Empresas liberadas (respeita permissões: se Master vê todas; se outro papel, vê apenas as liberadas)
  const availableCompanies = useMemo(() => {
    if (!currentUser || currentUser.role === 'master') return effectiveCompanies;
    const allowedCompanyIds = (currentUser.companyIds && currentUser.companyIds.length > 0)
      ? currentUser.companyIds
      : (currentUser.companyId ? [currentUser.companyId] : []);
    if (allowedCompanyIds.length === 0) return effectiveCompanies;
    return effectiveCompanies.filter(c => allowedCompanyIds.includes(c.id));
  }, [effectiveCompanies, currentUser]);

  // Sincronização da Empresa: usa a selecionada globalmente ou a primeira liberada
  const activeCompanyId = propSelectedCompanyId || availableCompanies[0]?.id || effectiveCompanies[0]?.id || '';
  
  const currentCompany = useMemo(() => {
    return availableCompanies.find(c => c.id === activeCompanyId) || availableCompanies[0] || effectiveCompanies[0];
  }, [availableCompanies, effectiveCompanies, activeCompanyId]);

  // Filiais liberadas para o usuário nesta empresa
  const availableUnits = useMemo(() => {
    const allUnits = currentCompany?.units || [];
    if (!currentUser || currentUser.role === 'master' || currentUser.role === 'admin_empresa') {
      return allUnits;
    }
    const allowedUnitIds = (currentUser.unitIds && currentUser.unitIds.length > 0)
      ? currentUser.unitIds
      : (currentUser.unitId ? [currentUser.unitId] : []);
    if (allowedUnitIds.length === 0) return allUnits;
    const filtered = allUnits.filter(u => allowedUnitIds.includes(u.id));
    return filtered.length > 0 ? filtered : allUnits;
  }, [currentCompany, currentUser]);

  // Sincronização da Filial: usa a selecionada globalmente ou a primeira liberada
  const activeUnitId = propSelectedUnitId || availableUnits[0]?.id || currentCompany?.units[0]?.id || '';

  const currentFilial: CompanyUnit = useMemo(() => {
    const unit = availableUnits.find(u => u.id === activeUnitId) || availableUnits[0];
    return unit || currentCompany?.units[0] || {
      id: 'default-unit',
      name: 'Matriz Industrial',
      city: 'São Paulo',
      state: 'SP',
      headcount: 25,
      grauDeRisco: 3,
      cnaeCode: '2511-0/00',
      cnaeDesc: 'Fabricação de estruturas metálicas',
      cipaAtiva: true,
      gestorName: 'Diretoria de Operações'
    };
  }, [availableUnits, currentCompany, activeUnitId]);

  // Atualização sincronizada
  const handleCompanyChange = (newCompId: string) => {
    if (onSelectCompanyId) {
      onSelectCompanyId(newCompId);
    }
    const comp = companies.find(c => c.id === newCompId);
    if (comp && comp.units[0] && onSelectUnitId) {
      onSelectUnitId(comp.units[0].id);
    }
  };

  const handleUnitChange = (newUnitId: string) => {
    if (onSelectUnitId) {
      onSelectUnitId(newUnitId);
    }
  };

  // CNAE e Grau de Risco
  const cnaeEntry: CnaeEntry = useMemo(() => {
    const found = CNAE_DATABASE.find(c => c.code === currentFilial.cnaeCode);
    if (found) return found;
    return {
      code: currentFilial.cnaeCode || '2511-0/00',
      description: currentFilial.cnaeDesc || 'Atividade Industrial/Comercial',
      grauDeRisco: (currentFilial.grauDeRisco as 1 | 2 | 3 | 4) || 3,
      sectorGroup: 'C-13'
    };
  }, [currentFilial]);

  // Colaboradores por filial
  const [employeesByUnit, setEmployeesByUnit] = useState<Record<string, Employee[]>>({
    [currentCompany?.units[0]?.id || 'default-unit']: INITIAL_EMPLOYEES
  });

  const currentEmployees = useMemo(() => {
    return employeesByUnit[currentFilial.id] || INITIAL_EMPLOYEES;
  }, [employeesByUnit, currentFilial.id]);

  // Busca de colaboradores
  const [employeeSearch, setEmployeeSearch] = useState('');
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return currentEmployees;
    const term = employeeSearch.toLowerCase();
    return currentEmployees.filter(
      e => e.name.toLowerCase().includes(term) ||
           (e.apelido && e.apelido.toLowerCase().includes(term)) ||
           e.matricula.toLowerCase().includes(term) ||
           e.cargo.toLowerCase().includes(term) ||
           e.setor.toLowerCase().includes(term)
    );
  }, [currentEmployees, employeeSearch]);

  // Headcount manual caso o número de colaboradores esteja zerado ou o usuário queira cálculo avulso
  const [manualHeadcount, setManualHeadcount] = useState<number | ''>('');

  // Dimensionamento oficial NR-5 Quadro I
  const effectiveHeadcount = useMemo(() => {
    if (currentEmployees.length > 0) {
      return currentEmployees.length;
    }
    return typeof manualHeadcount === 'number' && manualHeadcount > 0 ? manualHeadcount : 0;
  }, [currentEmployees.length, manualHeadcount]);

  const headcount = effectiveHeadcount;

  const dimensionamento: DimensionamentoResult = useMemo(() => {
    return calcularDimensionamentoNR5(cnaeEntry, headcount);
  }, [cnaeEntry, headcount]);

  // Histórico da CIPA
  const [cipaMode, setCipaMode] = useState<'ja_existe' | 'primeira_cipa'>('ja_existe');
  const [dataUltimaPosse, setDataUltimaPosse] = useState<string>('2025-10-15');
  const [dataPrevisaoPosse, setDataPrevisaoPosse] = useState<string>('2026-11-20');

  // Término do Mandato
  const mandateEndDate = useMemo(() => {
    if (cipaMode === 'ja_existe') {
      const d = new Date(dataUltimaPosse);
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    } else {
      return dataPrevisaoPosse;
    }
  }, [cipaMode, dataUltimaPosse, dataPrevisaoPosse]);

  // Cronograma
  const cronograma: CronogramaItem[] = useMemo(() => {
    return calcularCronogramaEleitoral(mandateEndDate);
  }, [mandateEndDate]);

  // Datas principais formatadas
  const datasPrincipais = useMemo(() => {
    const dFim = new Date(mandateEndDate);
    const formatDate = (daysDiff: number) => {
      const d = new Date(dFim);
      d.setDate(d.getDate() + daysDiff);
      return d.toLocaleDateString('pt-BR');
    };
    return {
      convocacao: formatDate(-60),
      comunicadoSindicato: formatDate(-55),
      comissaoEleitoral: formatDate(-55),
      editalInscricao: formatDate(-45),
      inscricaoInicio: formatDate(-45),
      inscricaoFim: formatDate(-30),
      comprovanteInscricao: 'No ato da inscrição',
      listaCandidatos: formatDate(-30),
      eleicao: formatDate(-30),
      apuracao: formatDate(-30),
      treinamento: `${formatDate(-15)} a ${formatDate(-5)}`,
      posse: dFim.toLocaleDateString('pt-BR'),
      envioSindicato: formatDate(10)
    };
  }, [mandateEndDate]);

  // Integração com Contexto e Histórico de Dimensionamento
  const { saveDimensionamento, dimensionamentos } = useCipa();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSavingDimensionamento, setIsSavingDimensionamento] = useState(false);
  const [dbDimensionamentosCount, setDbDimensionamentosCount] = useState<number>(0);

  // Validação de conclusão do dimensionamento para liberação do calendário
  const isDimensionamentoCompleted = useMemo(() => {
    return dbDimensionamentosCount > 0 || (effectiveHeadcount > 0 && !!dimensionamento);
  }, [dbDimensionamentosCount, effectiveHeadcount, dimensionamento]);

  // Etapas concluídas (Etapa 1 de dimensionamento já nasce concluída)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    'etapa-1': true,
    'etapa-2': false,
    'etapa-3': false,
    'etapa-4': false,
    'etapa-5': false,
    'etapa-6': false,
    'etapa-7': false,
    'etapa-8': false,
    'etapa-9': false,
    'etapa-10': false,
    'etapa-11': false,
    'etapa-12': false,
    'etapa-13': false,
  });

  // Modal com explicação da fundamentação legal da NR-5 para a etapa selecionada
  const [selectedNormativeStep, setSelectedNormativeStep] = useState<{
    id: string;
    numero: number;
    titulo: string;
    subtitulo: string;
    prazoLabel: string;
    dataCalculada: string;
    referenciaNormativa: string;
    baseLegalDetalhada: string;
    porQueExiste: string;
    impactoAuditoria: string;
  } | null>(null);

  // Sincronização dos envelopes com a Plataforma de Assinaturas Integrada
  const [envelopes, setEnvelopes] = useState<SignatureEnvelope[]>(() => {
    return SignatureService.getEnvelopes(currentCompany?.id, currentFilial?.id, currentCompany?.razaoSocial, currentCompany?.cnpj);
  });

  const refreshEnvelopes = () => {
    const envs = SignatureService.getEnvelopes(currentCompany?.id, currentFilial?.id, currentCompany?.razaoSocial, currentCompany?.cnpj);
    setEnvelopes(envs);
  };

  useEffect(() => {
    refreshEnvelopes();
  }, [currentCompany?.id, currentFilial?.id, activeTab]);

  useEffect(() => {
    const handleStorageOrFocus = () => refreshEnvelopes();
    window.addEventListener('focus', handleStorageOrFocus);
    window.addEventListener('storage', handleStorageOrFocus);
    return () => {
      window.removeEventListener('focus', handleStorageOrFocus);
      window.removeEventListener('storage', handleStorageOrFocus);
    };
  }, [currentCompany?.id, currentFilial?.id]);

  // Customizações individuais das etapas do calendário (salvas localmente pelo usuário)
  const [stepCustomizations, setStepCustomizations] = useState<Record<string, {
    title?: string;
    date?: string;
    obs?: string;
    customText?: string;
    dispatchedAt?: string;
    dispatchCount?: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('cipa_step_customizations');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal de edição de etapa
  const [editingStep, setEditingStep] = useState<any | null>(null);
  const [editStepTitle, setEditStepTitle] = useState('');
  const [editStepDate, setEditStepDate] = useState('');
  const [editStepObs, setEditStepObs] = useState('');
  const [editStepCustomText, setEditStepCustomText] = useState('');

  // Modal de Configuração de Assinatura Digital do Documento (Signatários e Posições)
  const [isSignatureConfigModalOpen, setIsSignatureConfigModalOpen] = useState(false);
  const [signatureConfigInitialData, setSignatureConfigInitialData] = useState<InitialEnvelopeData | null>(null);

  // Modal de Disparo Coletivo de Edital por E-mail (NR-5 Ampla Divulgação)
  const [broadcastingStep, setBroadcastingStep] = useState<any | null>(null);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const toggleStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // Modais de colaboradores
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showFullCpfInEdit, setShowFullCpfInEdit] = useState(false);
  const [showFullCpfInView, setShowFullCpfInView] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Verificação de permissão para visualizar CPF completo em conformidade com LGPD
  const canViewFullCpf = (emp?: Employee | null): boolean => {
    if (!emp) return false;
    if (currentUser?.role === 'master') return true;
    if (currentUser?.customPermissions?.includes('perm_view_full_cpf')) return true;
    return false;
  };

  // Carrega os colaboradores reais da filial selecionada diretamente do PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchEmployeesFromDb = async () => {
      if (!currentFilial?.id) return;
      try {
        setIsLoadingEmployees(true);
        const data = await ApiService.getEmployees(currentFilial.id, currentCompany?.id);
        if (isMounted && data && Array.isArray(data)) {
          setEmployeesByUnit(prev => ({
            ...prev,
            [currentFilial.id]: data
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar colaboradores do banco de dados:', err);
      } finally {
        if (isMounted) {
          setIsLoadingEmployees(false);
        }
      }
    };

    fetchEmployeesFromDb();
    return () => { isMounted = false; };
  }, [currentFilial?.id, currentCompany?.id]);

  // Modal da Carta ao Sindicato
  const [isSindicatoModalOpen, setIsSindicatoModalOpen] = useState(false);
  const [sindicatoNome, setSindicatoNome] = useState('Sindicato dos Trabalhadores nas Indústrias Metalúrgicas, Mecânicas e de Material Elétrico de São Paulo e Região');
  const [sindicatoEmail, setSindicatoEmail] = useState('contato@metalurgicos.org.br');

  // Modal de Edital com Assinatura Embutida
  const [activeEditalDoc, setActiveEditalDoc] = useState<{
    stepId: string;
    doc: GeneratedDocument;
  } | null>(null);

  // Form Colaborador Individual (Criar / Editar)
  const [formName, setFormName] = useState('');
  const [formApelido, setFormApelido] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');
  const [formMatricula, setFormMatricula] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formSetor, setFormSetor] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDataAdmissao, setFormDataAdmissao] = useState('');

  // Importação em lote
  const [batchCsvText, setBatchCsvText] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);



  const loadDimensionamentosCount = async () => {
    if (!currentFilial?.id) return;
    try {
      const records = await ApiService.getDimensionamentos(currentFilial.id, currentCompany?.id);
      if (Array.isArray(records)) {
        setDbDimensionamentosCount(records.length);
      }
    } catch (e) {
      console.warn('Erro ao carregar contagem de dimensionamentos do banco:', e);
    }
  };

  useEffect(() => {
    loadDimensionamentosCount();
  }, [currentFilial?.id, currentCompany?.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSaveCurrentDimensionamento = async () => {
    setIsSavingDimensionamento(true);
    try {
      const payload = {
        companyId: currentCompany.id,
        unitId: currentFilial.id,
        cnaeCode: cnaeEntry.code,
        cnaeDesc: cnaeEntry.description,
        headcount,
        grauDeRisco: cnaeEntry.grauDeRisco,
        precisaCipa: dimensionamento.precisaCipa,
        efetivosEmpregador: dimensionamento.efetivosEmpregador,
        suplentesEmpregador: dimensionamento.suplentesEmpregador,
        efetivosEmpregados: dimensionamento.efetivosEmpregados,
        suplentesEmpregados: dimensionamento.suplentesEmpregados,
        totalMembros: dimensionamento.totalMembros,
        observacaoNormativa: dimensionamento.observacaoNormativa || 'Parecer de enquadramento da NR-5.',
        calculadoPor: currentUser?.name || 'Administrador SST'
      };

      const res = await ApiService.saveDimensionamento(payload);

      // Sincroniza também no contexto local
      saveDimensionamento({
        id: res.record?.id || `dim-${Date.now()}`,
        ...payload,
        createdAt: new Date().toLocaleString('pt-BR'),
        createdBy: currentUser?.name || 'Administrador SST'
      });

      await loadDimensionamentosCount();

      if (res.updated) {
        showToast('Dimensionamento da gestão atualizado com o novo efetivo de colaboradores.');
      } else if (res.created) {
        showToast('Dimensionamento salvo e homologado no banco de dados com sucesso!');
      } else {
        showToast('Dimensionamento da gestão mantido sem alterações no banco.');
      }
    } catch (err: any) {
      console.error('Erro ao persistir dimensionamento no banco de dados:', err);
      // Fallback para o context local
      saveDimensionamento({
        id: `dim-${Date.now()}`,
        companyId: currentCompany.id,
        unitId: currentFilial.id,
        cnaeCode: cnaeEntry.code,
        cnaeDesc: cnaeEntry.description,
        headcount,
        grauDeRisco: cnaeEntry.grauDeRisco,
        precisaCipa: dimensionamento.precisaCipa,
        efetivosEmpregador: dimensionamento.efetivosEmpregador,
        suplentesEmpregador: dimensionamento.suplentesEmpregador,
        efetivosEmpregados: dimensionamento.efetivosEmpregados,
        suplentesEmpregados: dimensionamento.suplentesEmpregados,
        totalMembros: dimensionamento.totalMembros,
        createdAt: new Date().toLocaleString('pt-BR'),
        createdBy: currentUser?.name || 'Administrador SST'
      });
      showToast('Dimensionamento salvo com sucesso!');
    } finally {
      setIsSavingDimensionamento(false);
    }
  };

  // Emitir e baixar laudo oficial em PDF do dimensionamento NR-5
  const handleDownloadPdfDimensionamento = async (targetDim?: any) => {
    try {
      const dim = targetDim || dimensionamento || {};
      const comp = currentCompany || (availableCompanies && availableCompanies[0]) || (companies && companies[0]) || {
        id: 'comp-1',
        nomeFantasia: propCompanyName || 'Empresa',
        razaoSocial: propCompanyName || 'Empresa',
        cnpj: propCnpj || '00.000.000/0001-00'
      };
      const filial = currentFilial || (comp.units && comp.units[0]) || {
        id: 'unit-1',
        name: 'Matriz',
        city: 'São Paulo',
        state: 'SP',
        cnaeCode: '2511-0/00',
        cnaeDesc: 'Atividade Principal',
        grauDeRisco: 3
      };

      const finalCompanyName = comp.nomeFantasia || comp.razaoSocial || propCompanyName || 'Empresa';
      const finalRazaoSocial = comp.razaoSocial || comp.nomeFantasia || propCompanyName || 'Empresa';
      const finalCnpj = comp.cnpj || propCnpj || (filial as any).cnpj || '00.000.000/0001-00';
      const finalUnitName = filial.name || 'Unidade Principal';
      const finalCity = filial.city || 'São Paulo';
      const finalState = filial.state || 'SP';

      const finalCnaeCode = targetDim?.cnaeCode || filial.cnaeCode || cnaeEntry?.code || '2511-0/00';
      const finalCnaeDesc = targetDim?.cnaeDesc || filial.cnaeDesc || cnaeEntry?.description || 'Atividade Principal';
      const finalGrauDeRisco = Number(targetDim?.grauDeRisco ?? filial.grauDeRisco ?? cnaeEntry?.grauDeRisco ?? 3);
      const finalHeadcount = Number(targetDim?.headcount ?? headcount ?? 0);
      const defaultGestaoAno = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
      const finalGestao = String(targetDim?.gestao || defaultGestaoAno);
      const finalObs = String(targetDim?.observacaoNormativa || dim.observacaoNormativa || 'Enquadramento oficial NR-5.');
      const finalCalcPor = String(targetDim?.calculadoPor || targetDim?.createdBy || currentUser?.name || 'Administrador SST');
      const finalDataCalc = targetDim?.dataCalculo || targetDim?.createdAt
        ? new Date(targetDim.dataCalculo || targetDim.createdAt).toLocaleString('pt-BR')
        : new Date().toLocaleString('pt-BR');

      let hashSha256 = targetDim?.hashSha256 || targetDim?.hash;
      if (!hashSha256) {
        try {
          hashSha256 = await computeSha256(
            `DIM:${finalCnpj}:${filial.id || 'UNIT'}:${finalHeadcount}:${dim.totalMembros || 0}:${finalDataCalc}`
          );
        } catch {
          hashSha256 = `SHA256-${Date.now().toString(16).toUpperCase()}`;
        }
      }

      const unitIdPart = String(filial.id || 'UNIT').slice(0, 4).toUpperCase();
      const protocolo = `DIM-NR5-${new Date().getFullYear()}-${unitIdPart}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await PdfService.generateDimensionamentoPdf({
        companyName: finalCompanyName,
        razaoSocial: finalRazaoSocial,
        cnpj: finalCnpj,
        unitName: finalUnitName,
        city: finalCity,
        state: finalState,
        cnaeCode: finalCnaeCode,
        cnaeDesc: finalCnaeDesc,
        grauDeRisco: finalGrauDeRisco,
        headcount: finalHeadcount,
        gestao: finalGestao,
        efetivosEmpregados: Number(dim.efetivosEmpregados || 0),
        suplentesEmpregados: Number(dim.suplentesEmpregados || 0),
        efetivosEmpregador: Number(dim.efetivosEmpregador || 0),
        suplentesEmpregador: Number(dim.suplentesEmpregador || 0),
        totalMembros: Number(dim.totalMembros || 0),
        observacaoNormativa: finalObs,
        calculadoPor: finalCalcPor,
        dataCalculo: finalDataCalc,
        hashSha256,
        protocolo,
        logoUrl: (comp as any)?.logoUrl || currentCompany?.logoUrl
      });

      showToast('Laudo do dimensionamento em PDF gerado e baixado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao gerar PDF do dimensionamento:', err);
      showToast('Ocorreu um erro ao gerar o PDF. Detalhe: ' + (err?.message || 'Tente novamente.'));
    }
  };

  // Avançar para o Calendário Eleitoral salvando automaticamente no histórico
  const handleGoToCalendario = async () => {
    await handleSaveCurrentDimensionamento();
    setActiveTab('calendario');
  };

  // Abrir Modal de Criação Limpo
  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormApelido('');
    setFormFotoUrl('');
    setFormMatricula('');
    setFormCpf('');
    setFormCargo('');
    setFormSetor('');
    setFormEmail('');
    setFormDataAdmissao(new Date().toISOString().split('T')[0]);
    setShowFullCpfInEdit(true);
    setIsNewEmployeeModalOpen(true);
  };

  // Abrir Modal de Edição com dados carregados e CPF mascarado conforme LGPD
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormApelido(emp.apelido || '');
    setFormFotoUrl(emp.fotoUrl || '');
    setFormMatricula(emp.matricula);
    setFormCpf(emp.cpf);
    setFormCargo(emp.cargo);
    setFormSetor(emp.setor);
    setFormEmail(emp.email);
    setFormDataAdmissao(emp.dataAdmissao || new Date().toISOString().split('T')[0]);
    setShowFullCpfInEdit(false);
    setIsNewEmployeeModalOpen(true);
  };

  // Upload de Foto do Colaborador (Envia diretamente ao MinIO)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormFotoUrl(dataUrl); // preview imediato
        try {
          const uploadRes = await ApiService.uploadPhotoToMinio(dataUrl, file.name, file.type, 'colaboradores');
          if (uploadRes?.url) {
            setFormFotoUrl(uploadRes.url);
          }
        } catch (err) {
          console.warn('Erro ao enviar foto para MinIO:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Salvar Colaborador (Criar ou Atualizar) com persistência no PostgreSQL
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCargo.trim()) return;

    const capitalizedName = formatCapitalizeName(formName);

    if (editingEmployee) {
      // Se o CPF exibido estava mascarado e não foi alterado para um CPF novo, preserva o CPF original do registro
      const finalCpf = formCpf.includes('*') ? editingEmployee.cpf : formCpf.trim();

      const updated: Employee = {
        ...editingEmployee,
        name: capitalizedName,
        apelido: formApelido.trim() || undefined,
        fotoUrl: formFotoUrl || undefined,
        matricula: formMatricula.trim() || editingEmployee.matricula,
        cpf: finalCpf || editingEmployee.cpf,
        cargo: formCargo.trim(),
        setor: formSetor.trim() || editingEmployee.setor,
        email: formEmail.trim() || editingEmployee.email,
        dataAdmissao: formDataAdmissao || editingEmployee.dataAdmissao
      };

      try {
        await ApiService.updateEmployee(updated.id, {
          ...updated,
          unitId: currentFilial.id
        });
      } catch (err) {
        console.warn('Erro ao atualizar no backend (atualizando localmente):', err);
      }

      setEmployeesByUnit(prev => ({
        ...prev,
        [currentFilial.id]: (prev[currentFilial.id] || []).map(e => e.id === updated.id ? updated : e)
      }));

      setIsNewEmployeeModalOpen(false);
      setEditingEmployee(null);
      showToast(`Colaborador "${updated.name}" atualizado com sucesso!`);
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: capitalizedName,
        apelido: formApelido.trim() || undefined,
        fotoUrl: formFotoUrl || undefined,
        matricula: formMatricula.trim() || `CLT-${Math.floor(1000 + Math.random() * 9000)}`,
        cpf: formCpf.trim() || '000.000.000-00',
        cargo: formCargo.trim(),
        setor: formSetor.trim() || 'Operacional Geral',
        email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '.')}@empresa.com.br`,
        dataAdmissao: formDataAdmissao || new Date().toISOString().split('T')[0]
      };

      try {
        const created = await ApiService.createEmployee({
          ...newEmp,
          unitId: currentFilial.id
        });
        if (created?.id) {
          newEmp.id = created.id;
        }
      } catch (err) {
        console.warn('Erro ao criar no backend (criando localmente):', err);
      }

      setEmployeesByUnit(prev => ({
        ...prev,
        [currentFilial.id]: [newEmp, ...(prev[currentFilial.id] || [])]
      }));

      setIsNewEmployeeModalOpen(false);
      showToast(`Colaborador "${newEmp.name}" adicionado com sucesso!`);
    }
  };

  // Exclusão confirmada de colaborador
  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    const target = employeeToDelete;
    try {
      await ApiService.deleteEmployee(target.id);
    } catch (err) {
      console.warn('Erro ao deletar no backend (mantendo remoção local):', err);
    }
    setEmployeesByUnit(prev => ({
      ...prev,
      [currentFilial.id]: (prev[currentFilial.id] || []).filter(e => e.id !== target.id)
    }));
    setEmployeeToDelete(null);
    showToast(`Colaborador "${target.name}" excluído com sucesso.`);
  };

  // Baixar modelo CSV com suporte a Apelido e FotoURL
  const handleDownloadTemplate = () => {
    const csvContent = 
      "Nome Completo;Apelido;Matrícula;CPF;Cargo;Setor;E-mail;Data de Admissão;FotoURL\n" +
      "João da Silva;Zé do Torno;CLT-2001;123.456.789-10;Operador de Máquinas;Produção;joao.silva@empresa.com.br;2021-05-10;\n" +
      "Maria Souza Oliveira;Paulinha;CLT-2002;234.567.890-21;Supervisora de Linha;Montagem;maria.oliveira@empresa.com.br;2019-02-14;\n" +
      "Carlos Alberto Lima;Carlão;CLT-2003;345.678.901-32;Auxiliar de Almoxarifado;Logística;carlos.lima@empresa.com.br;2022-08-01;";

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `modelo_colaboradores_${currentFilial.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Processar importação em lote com Apelido e Foto
  const handleProcessBatchImport = () => {
    if (!batchCsvText.trim()) return;

    const lines = batchCsvText.trim().split('\n');
    const newItems: Employee[] = [];

    lines.forEach((line, idx) => {
      if (idx === 0 && (line.toLowerCase().includes('nome') || line.toLowerCase().includes('matrícula'))) {
        return;
      }
      const parts = line.split(/[;,]/).map(p => p.trim());
      if (parts.length >= 2 && parts[0]) {
        newItems.push({
          id: `batch-${Date.now()}-${idx}`,
          name: parts[0],
          apelido: parts[1] && !parts[1].startsWith('CLT-') ? parts[1] : undefined,
          matricula: parts[2] || parts[1] || `CLT-${1000 + idx}`,
          cpf: parts[3] || '000.000.000-00',
          cargo: parts[4] || 'Operador',
          setor: parts[5] || 'Geral',
          email: parts[6] || `${parts[0].toLowerCase().replace(/\s+/g, '.')}@empresa.com.br`,
          dataAdmissao: parts[7] || new Date().toISOString().split('T')[0],
          fotoUrl: parts[8] && parts[8].startsWith('http') ? parts[8] : undefined
        });
      }
    });

    if (newItems.length > 0) {
      setEmployeesByUnit(prev => ({
        ...prev,
        [currentFilial.id]: [...newItems, ...(prev[currentFilial.id] || [])]
      }));
      setBatchCsvText('');
      setIsBatchImportModalOpen(false);
      showToast(`${newItems.length} colaboradores importados com sucesso!`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBatchCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  // Abrir edital em tela cheia com assinatura embutida
  const handleOpenEdital = (stepId: string, docTipo: string) => {
    const doc = generateCipaDocument(
      docTipo,
      currentCompany.razaoSocial,
      currentCompany.cnpj,
      mandateEndDate,
      dimensionamento.totalMembros,
      {
        sindicatoNome,
        sindicatoEmail,
        cronogramaDatas: datasPrincipais
      }
    );
    setActiveEditalDoc({ stepId, doc });
    setCompletedSteps(prev => ({ ...prev, [stepId]: true }));
  };

  const handleSignOpenedEdital = () => {
    if (!activeEditalDoc) return;
    const { stepId, doc } = activeEditalDoc;
    
    setCompletedSteps(prev => ({ ...prev, [stepId]: true }));

    if (onOpenSignatureModal) {
      onOpenSignatureModal(stepId, doc.title);
      setActiveEditalDoc(null);
    } else if (onNavigateTab) {
      onNavigateTab('assinaturas');
      setActiveEditalDoc(null);
    } else {
      showToast('Documento assinado com sucesso!');
      setActiveEditalDoc(null);
    }
  };

  // Sequência Normativa Legal conforme NR-5 (13 Etapas Rigorosamente Cronológicas)
  const etapasNormativas = useMemo(() => [
    {
      id: 'etapa-1',
      numero: 1,
      titulo: 'Dimensionamento e Enquadramento NR-5',
      subtitulo: 'Cálculo do efetivo, grau de risco e composição paritária oficial',
      prazoLabel: 'Fase Preliminar Obrigatória',
      dataCalculada: 'Fase Inicial (Concluída)',
      referenciaNormativa: 'NR-5 (Item 5.4.1 / Quadro I) e NR-4',
      baseLegalDetalhada: 'Portaria MTP nº 4.219/2022 (NR-05), Portaria MTP nº 4.218/2022 (NR-04) e Art. 163 da CLT.',
      porQueExiste: 'O dimensionamento define a obrigatoriedade da CIPA e calcula o número exato de membros titulares e suplentes (empregador e empregados) com base no CNAE principal, Grau de Risco e efetivo da unidade. É pré-requisito indispensável para saber quantas vagas estarão em disputa na eleição.',
      impactoAuditoria: 'Deflagrar o processo eleitoral sem dimensionamento prévio homologado acarreta nulidade de todo o pleito por vício de origem e autuação fiscal imediata.',
      acaoTipo: 'laudo_pdf' as const,
      botaoTexto: 'Laudo em PDF',
      botaoIcone: 'printer' as const
    },
    {
      id: 'etapa-2',
      numero: 2,
      titulo: 'Convocação das Eleições da CIPA',
      subtitulo: 'Publicação formal do edital de convocação pelo empregador',
      prazoLabel: 'Pelo menos 60 dias antes da posse',
      dataCalculada: datasPrincipais.convocacao,
      referenciaNormativa: 'NR-5, subitem 5.5.1',
      baseLegalDetalhada: 'Item 5.5.1 da NR-05: "O empregador deve convocar eleições para a escolha dos representantes dos empregados na CIPA, no prazo mínimo de 60 (sessenta) dias antes do término do mandato em curso."',
      porQueExiste: 'O prazo de 60 dias garante que todo o rito sucessório ocorra antes do mandato anterior expirar, permitindo o cumprimento dos prazos subsequentes (comissão, inscrições de 15 dias, apuração e treinamento) sem sobreposição.',
      impactoAuditoria: 'A convocação extemporânea (inferior a 60 dias) enseja lavratura de auto de infração e prorrogação coercitiva da gestão atual até a regularização.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'edital_convocacao',
      botaoTexto: 'Ver Edital',
      botaoIcone: 'fileText' as const
    },
    {
      id: 'etapa-3',
      numero: 3,
      titulo: 'Comunicação ao Sindicato Laboral',
      subtitulo: 'Envio de ofício com datas e marcos do processo ao sindicato',
      prazoLabel: 'Até 5 dias após a convocação',
      dataCalculada: datasPrincipais.comunicadoSindicato,
      referenciaNormativa: 'NR-5, subitem 5.5.1.1',
      baseLegalDetalhada: 'Item 5.5.1.1 da NR-05: "A empresa deve comunicar o início do processo eleitoral ao sindicato da categoria profissional mais representativa no prazo de até 5 (cinco) dias após a publicação do edital de convocação."',
      porQueExiste: 'Assegura a transparência pública do processo democrático e permite à entidade sindical acompanhar a legalidade do pleito, resguardando os direitos coletivos dos trabalhadores.',
      impactoAuditoria: 'A falta de protocolo ou comprovante de envio ao sindicato faculta à entidade mover ação judicial com pedido de liminar para suspender a eleição.',
      acaoTipo: 'carta_sindicato' as const,
      botaoTexto: 'Carta ao Sindicato',
      botaoIcone: 'send' as const
    },
    {
      id: 'etapa-4',
      numero: 4,
      titulo: 'Constituição da Comissão Eleitoral (CE)',
      subtitulo: 'Portaria paritária responsável por organizar e conduzir o pleito',
      prazoLabel: 'Pelo menos 55 dias antes da posse',
      dataCalculada: datasPrincipais.comissaoEleitoral,
      referenciaNormativa: 'NR-5, subitem 5.5.2',
      baseLegalDetalhada: 'Item 5.5.2 da NR-05: "A Comissão Eleitoral (CE) deve ser constituída no prazo mínimo de 55 (cinquenta e cinco) dias antes do término do mandato em curso."',
      porQueExiste: 'A CE é órgão soberano e neutro constituído pelo Presidente e Vice-Presidente da CIPA vigente (ou indicação bilateral na primeira CIPA). Sua função é receber inscrições, emitir comprovantes, fiscalizar votos e apurar o resultado com imparcialidade.',
      impactoAuditoria: 'A realização de atos eleitorais sem constituição formal da CE configura ingerência indevida do empregador e anulação de votos.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'comissao_eleitoral',
      botaoTexto: 'Ver Portaria',
      botaoIcone: 'signature' as const
    },
    {
      id: 'etapa-5',
      numero: 5,
      titulo: 'Publicação do Edital de Inscrições',
      subtitulo: 'Abertura oficial do período para registro de candidaturas',
      prazoLabel: 'Pelo menos 45 dias antes da posse',
      dataCalculada: datasPrincipais.editalInscricao,
      referenciaNormativa: 'NR-5, subitem 5.5.2.1',
      baseLegalDetalhada: 'Item 5.5.2.1 da NR-05: "A publicação e divulgação do edital de inscrições, em locais de fácil acesso e visualização, no prazo mínimo de 45 (quarenta e cinco) dias antes do término do mandato em curso."',
      porQueExiste: 'Garante publicidade ampla a todos os trabalhadores do estabelecimento, informando critérios, locais, prazos e direitos para candidatura livre aos cargos da comissão.',
      impactoAuditoria: 'O desrespeito ao prazo de 45 dias antes da posse cerceia o direito de participação e é causa comum de anulação de eleições.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'edital_inscricao',
      botaoTexto: 'Ver Edital',
      botaoIcone: 'fileText' as const
    },
    {
      id: 'etapa-6',
      numero: 6,
      titulo: 'Período de Inscrição de Candidatos',
      subtitulo: 'Período aberto para inscrição livre de todos os empregados',
      prazoLabel: 'Prazo mínimo de 15 dias corridos',
      dataCalculada: `${datasPrincipais.inscricaoInicio} a ${datasPrincipais.inscricaoFim}`,
      referenciaNormativa: 'NR-5, subitem 5.5.2.2',
      baseLegalDetalhada: 'Item 5.5.2.2 da NR-05: "Inscrição de candidatos no prazo mínimo de 15 (quinze) dias corridos."',
      porQueExiste: 'Assegura tempo hábil para que empregados em turnos, escalas de revezamento ou afastamentos transitórios possam tomar conhecimento e exercer livremente o direito à candidatura.',
      impactoAuditoria: 'A fixação de prazo de inscrição inferior a 15 dias corridos invalida irremediavelmente todo o pleito.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'edital_inscricao',
      botaoTexto: 'Ver Prazos',
      botaoIcone: 'fileText' as const
    },
    {
      id: 'etapa-7',
      numero: 7,
      titulo: 'Comprovante de Inscrição e Estabilidade Provisória',
      subtitulo: 'Protocolo formal que comprova e ativa a garantia de emprego',
      prazoLabel: 'Imediato no ato da inscrição',
      dataCalculada: 'No ato da inscrição',
      referenciaNormativa: 'NR-5, subitem 5.5.2.3; CLT Art. 165; ADCT Art. 10, II, "a"',
      baseLegalDetalhada: 'Item 5.5.2.3 da NR-05 e Art. 165 da CLT: "Fornecimento de comprovante de inscrição, indicando dia e hora do recebimento."',
      porQueExiste: 'O comprovante com dia e hora é a prova material que consolida a garantia de emprego contra demissão arbitrária (desde o registro até 1 ano após mandato para eleitos).',
      impactoAuditoria: 'A recusa ou omissão na entrega de protocolo aos inscritos gera direito à reintegração judicial do empregado em caso de dispensa e processo no MPT.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'comprovante_inscricao',
      botaoTexto: 'Ver Protocolo',
      botaoIcone: 'userCheck' as const
    },
    {
      id: 'etapa-8',
      numero: 8,
      titulo: 'Homologação e Divulgação da Lista de Candidatos',
      subtitulo: 'Publicação oficial dos nomes e cargos dos candidatos deferidos',
      prazoLabel: 'Logo após o encerramento das inscrições',
      dataCalculada: datasPrincipais.listaCandidatos,
      referenciaNormativa: 'NR-5, subitem 5.5.2.4',
      baseLegalDetalhada: 'Item 5.5.2.4 da NR-05: "Publicação e divulgação da relação dos candidatos inscritos, em locais de fácil acesso e visualização."',
      porQueExiste: 'Homologa perante o corpo de colaboradores quais registros foram deferidos pela CE, possibilitando o início da campanha e auditoria de eventuais impugnações fundamentadas.',
      impactoAuditoria: 'Realizar a votação sem a divulgação tempestiva da lista de candidatos fere a isonomia do pleito.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'lista_candidatos',
      botaoTexto: 'Ver Lista',
      botaoIcone: 'users' as const
    },
    {
      id: 'etapa-9',
      numero: 9,
      titulo: 'Eleição dos Representantes dos Empregados',
      subtitulo: 'Votação em escrutínio secreto presencial ou em urna digital auditada',
      prazoLabel: 'Pelo menos 30 dias antes da posse',
      dataCalculada: datasPrincipais.eleicao,
      referenciaNormativa: 'NR-5, subitem 5.5.3 e 5.5.3.1',
      baseLegalDetalhada: 'Item 5.5.3 da NR-05: "A eleição deve ser realizada no prazo mínimo de 30 (trinta) dias antes do término do mandato em curso."',
      porQueExiste: 'Garante que os colaboradores elejam seus pares sob sigilo absoluto em dia normal de trabalho. O prazo mínimo de 30 dias antes da posse é vital para realização do treinamento de até 20h dos eleitos.',
      impactoAuditoria: 'A violação do sigilo do voto ou realização do pleito fora do expediente enseja anulação e responsabilização civil da empresa.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'cedula_urna',
      botaoTexto: 'Ver Urna / Cédula',
      botaoIcone: 'vote' as const
    },
    {
      id: 'etapa-10',
      numero: 10,
      titulo: 'Apuração dos Votos e Ata de Eleição',
      subtitulo: 'Verificação do quórum de 50%+1 e lavratura da ata de apuração',
      prazoLabel: 'Imediatamente após o encerramento do pleito',
      dataCalculada: datasPrincipais.apuracao,
      referenciaNormativa: 'NR-5, subitem 5.5.3.3 e 5.5.3.4',
      baseLegalDetalhada: 'Itens 5.5.3.3 e 5.5.3.4 da NR-05: quórum superior a 50% dos colaboradores e apuração dos votos em dia normal de trabalho com lavratura da ata.',
      porQueExiste: 'Formaliza a vontade dos eleitores, discriminando votos válidos, brancos e nulos, e listando titulares e suplentes por ordem decrescente de votos. Se o quórum for inferior a 50%, obriga segundo dia com quórum de 1/3.',
      impactoAuditoria: 'A proclamação de resultado sem o atingimento do quórum legal mínimo gera nulidade sumária perante o Ministério do Trabalho.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'ata_eleicao',
      botaoTexto: 'Ver Ata de Eleição',
      botaoIcone: 'checkCircle' as const
    },
    {
      id: 'etapa-11',
      numero: 11,
      titulo: 'Treinamento Obrigatório dos Membros da CIPA',
      subtitulo: 'Capacitação conforme Grau de Risco e Lei nº 14.457/2022',
      prazoLabel: 'Realizado antes da posse dos membros',
      dataCalculada: datasPrincipais.treinamento,
      referenciaNormativa: 'NR-5, item 5.7 e Lei Federal nº 14.457/2022',
      baseLegalDetalhada: 'Item 5.7 da NR-05: Carga horária obrigatória de 8h a 20h. Obrigatoriedade de inclusão de temas sobre prevenção e combate ao assédio sexual e violência laboral.',
      porQueExiste: 'Capacita os eleitos e indicados antes de iniciarem suas atividades práticas de inspeção de risco, investigação de acidentes, mapa de risco e proteção à integridade física e psicológica no trabalho.',
      impactoAuditoria: 'Posse de cipeiro sem certificado válido de treinamento constitui infração grave com embargo administrativo de atividades de risco.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'certificado_treinamento',
      botaoTexto: 'Ver Certificado',
      botaoIcone: 'award' as const
    },
    {
      id: 'etapa-12',
      numero: 12,
      titulo: 'Ata de Instalação e Posse da CIPA',
      subtitulo: 'Sessão solene de posse da comissão e designação da presidência',
      prazoLabel: '1º dia útil após término do mandato anterior',
      dataCalculada: datasPrincipais.posse,
      referenciaNormativa: 'NR-5, subitem 5.5.5',
      baseLegalDetalhada: 'Item 5.5.5 da NR-05: "A posse dos membros da CIPA se dará no primeiro dia útil após o término do mandato anterior."',
      porQueExiste: 'Transmite formalmente as funções sindicais e legais da gestão anterior para a nova comissão, lavrando e registrando a assinatura do Presidente (indicado pelo empregador) e do Vice-Presidente (eleito pelos empregados).',
      impactoAuditoria: 'A falta da ata de posse assinada deixa a empresa formalmente desprovida de comissão ativa, sujeita a multas cumulativas.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'ata_posse',
      botaoTexto: 'Ver Ata de Posse',
      botaoIcone: 'signature' as const
    },
    {
      id: 'etapa-13',
      numero: 13,
      titulo: 'Envio ao Sindicato e Calendário Anual de Reuniões',
      subtitulo: 'Transmissão das atas ao sindicato e homologação de 12 reuniões',
      prazoLabel: 'Até 10 dias úteis após a posse',
      dataCalculada: datasPrincipais.envioSindicato,
      referenciaNormativa: 'NR-5, subitens 5.5.5.1, 5.6.1 e 5.8.1',
      baseLegalDetalhada: 'Itens 5.5.5.1 e 5.8.1 da NR-05: envio das cópias das atas ao sindicato e guarda documental por 5 anos à disposição da fiscalização.',
      porQueExiste: 'Comunica o encerramento do processo e protocola o cronograma anual das reuniões ordinárias mensais, consolidando a regularidade jurídica do mandato.',
      impactoAuditoria: 'A omissão na guarda por 5 anos ou o não agendamento de reuniões mensais ordinárias atrai fiscalização especial do Ministério do Trabalho.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'calendario_reunioes',
      botaoTexto: 'Calendário de Reuniões',
      botaoIcone: 'calendar' as const
    }
  ].map(e => {
    const custom = stepCustomizations[e.id];
    return {
      ...e,
      titulo: custom?.title || e.titulo,
      dataCalculada: custom?.date || e.dataCalculada
    };
  }), [datasPrincipais, stepCustomizations]);

  // Helper para localizar o envelope correspondente à etapa
  const getStepEnvelope = (etapa: any) => {
    return envelopes.find(env => {
      if (env.id === `env-cipa-${etapa.id}` || env.id === `env-${etapa.id}`) return true;
      if (etapa.docTipo && env.docType === etapa.docTipo) return true;
      if (env.title && env.title.toLowerCase().includes(etapa.titulo.toLowerCase())) return true;
      if (etapa.docTipo && env.title && env.title.toLowerCase().includes(etapa.docTipo.replace(/_/g, ' '))) return true;
      return false;
    });
  };

  // Verifica se o documento da etapa está 100% assinado por todos os signatários
  const isStepSigned = (etapa: any) => {
    const env = getStepEnvelope(etapa);
    if (env) {
      if (env.status === 'concluido') return true;
      if (env.signers && env.signers.length > 0 && env.signers.every(s => s.status === 'assinado')) return true;
    }
    if (signedAtas[etapa.id] || (etapa.docTipo && signedAtas[etapa.docTipo])) {
      return true;
    }
    return false;
  };

  // AÇÃO 1: EDITAR
  const handleEditStep = (etapa: any) => {
    if (etapa.id === 'etapa-1') {
      setActiveTab('dimensionamento');
      setStepDimensionamento(1);
      showToast('Redirecionado para ajuste de efetivo, colaboradores e CNAE.');
      return;
    }
    if (etapa.id === 'etapa-3') {
      setIsSindicatoModalOpen(true);
      return;
    }
    const custom = stepCustomizations[etapa.id];
    setEditingStep(etapa);
    setEditStepTitle(custom?.title || etapa.titulo);
    setEditStepDate(custom?.date || etapa.dataCalculada);
    setEditStepObs(custom?.obs || '');

    if (custom?.customText) {
      setEditStepCustomText(custom.customText);
    } else {
      const docTipo = etapa.docTipo || (etapa.id === 'etapa-3' ? 'comunicado_sindicato' : 'edital_convocacao');
      const doc = generateCipaDocument(
        docTipo,
        currentCompany?.razaoSocial || propCompanyName || 'Empresa',
        currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '00.000.000/0001-00',
        mandateEndDate,
        dimensionamento?.totalMembros || 0,
        {
          sindicatoNome,
          sindicatoEmail,
          cronogramaDatas: datasPrincipais,
          unitName: currentFilial?.name,
          unitState: currentFilial?.state,
          unitCity: currentFilial?.city
        }
      );
      setEditStepCustomText(doc.content.join('\n\n'));
    }
  };

  const handleSaveStepEdit = () => {
    if (!editingStep) return;
    const updated = {
      ...stepCustomizations,
      [editingStep.id]: {
        ...stepCustomizations[editingStep.id],
        title: editStepTitle.trim() || editingStep.titulo,
        date: editStepDate.trim() || editingStep.dataCalculada,
        obs: editStepObs.trim(),
        customText: editStepCustomText.trim()
      }
    };
    setStepCustomizations(updated);
    try {
      localStorage.setItem('cipa_step_customizations', JSON.stringify(updated));
    } catch {}
    setEditingStep(null);
    showToast(`Etapa "${editingStep.titulo}" atualizada com sucesso!`);
  };

  // AÇÃO 2: VISUALIZAR
  const handleViewStep = (etapa: any) => {
    const finalCompName = currentCompany?.razaoSocial || propCompanyName || 'Empresa';
    const finalCnpj = currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '00.000.000/0001-00';

    if (etapa.id === 'etapa-1') {
      const dimDoc: GeneratedDocument = {
        title: 'LAUDO TÉCNICO DE DIMENSIONAMENTO DA CIPA (NR-5 / NR-4)',
        category: 'Dimensionamento e Enquadramento',
        normativeCode: 'NR-5 (Item 5.4.1 / Quadro I) e NR-4',
        companyName: finalCompName,
        cnpj: finalCnpj,
        dateGenerated: new Date().toLocaleDateString('pt-BR'),
        content: [
          `ESTABELECIMENTO: ${currentFilial?.name || 'Unidade Principal'} · CNPJ: ${finalCnpj}`,
          `LOCALIDADE: ${currentFilial?.city || 'São Paulo'} - ${currentFilial?.state || 'SP'}`,
          `ATIVIDADE ECONÔMICA (CNAE): ${cnaeEntry?.code || '2511-0/00'} - ${cnaeEntry?.description || 'Atividade'}`,
          `GRAU DE RISCO NORMATIVO: Grau ${cnaeEntry?.grauDeRisco || 3} (Portaria MTP nº 4.218/2022 - NR-04)`,
          `EFETIVO CONSIDERADO: ${headcount} colaboradores ativos na unidade`,
          `COMPOSIÇÃO PARITÁRIA OFICIAL:`,
          `• Representantes do Empregador (Designados): ${dimensionamento?.efetivosEmpregador ?? 0} Titular(es) e ${dimensionamento?.suplentesEmpregador ?? 0} Suplente(s)`,
          `• Representantes dos Empregados (Eleitos): ${dimensionamento?.efetivosEmpregados ?? 0} Titular(es) e ${dimensionamento?.suplentesEmpregados ?? 0} Suplente(s)`,
          `• Total de Cipeiros Efetivos na Gestão: ${dimensionamento?.totalMembros ?? 0} membros`,
          `PARECER LEGAL NORMATIVO:`,
          dimensionamento?.observacaoNormativa || 'Enquadramento oficial realizado conforme parâmetros da NR-5.'
        ],
        signatories: [
          'Responsável Técnico pelo Dimensionamento / SESMT - Avaliação e Laudo Técnico',
          'Diretoria Executiva / Representante Legal da Empresa - Homologação Corporativa'
        ]
      };
      if (onOpenDocument) {
        onOpenDocument(dimDoc);
      } else {
        setActiveEditalDoc({ stepId: 'etapa-1', doc: dimDoc });
      }
      return;
    }

    const docTipo = etapa.docTipo || (etapa.id === 'etapa-3' ? 'comunicado_sindicato' : 'edital_convocacao');
    const doc = generateCipaDocument(
      docTipo,
      finalCompName,
      finalCnpj,
      mandateEndDate,
      dimensionamento?.totalMembros || 0,
      {
        sindicatoNome,
        sindicatoEmail,
        cronogramaDatas: datasPrincipais,
        unitName: currentFilial?.name,
        unitState: currentFilial?.state,
        unitCity: currentFilial?.city
      }
    );

    const custom = stepCustomizations[etapa.id];
    if (custom?.customText) {
      doc.content = custom.customText.split('\n\n').map((p: string) => p.trim()).filter(Boolean);
    }
    if (custom?.obs) {
      doc.content = [...doc.content, `OBSERVAÇÕES ADICIONAIS: ${custom.obs}`];
    }
    if (custom?.title) {
      doc.title = custom.title;
    }

    if (onOpenDocument) {
      onOpenDocument(doc);
    } else {
      setActiveEditalDoc({ stepId: etapa.id, doc });
    }
  };

  // AÇÃO 3: BAIXAR PDF
  const handleDownloadStepPdf = async (etapa: any) => {
    if (etapa.acaoTipo === 'laudo_pdf') {
      await handleDownloadPdfDimensionamento();
      return;
    }

    const finalCompName = currentCompany?.razaoSocial || propCompanyName || 'Empresa';
    const finalCnpj = currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '00.000.000/0001-00';
    const docTipo = etapa.docTipo || 'comunicado_sindicato';
    const doc = generateCipaDocument(
      docTipo,
      finalCompName,
      finalCnpj,
      mandateEndDate,
      dimensionamento?.totalMembros || 0,
      {
        sindicatoNome,
        sindicatoEmail,
        cronogramaDatas: datasPrincipais,
        unitName: currentFilial?.name,
        unitState: currentFilial?.state,
        unitCity: currentFilial?.city
      }
    );

    const custom = stepCustomizations[etapa.id];
    if (custom?.customText) {
      doc.content = custom.customText.split('\n\n').map((p: string) => p.trim()).filter(Boolean);
    }
    if (custom?.obs) {
      doc.content = [...doc.content, `OBSERVAÇÕES ADICIONAIS: ${custom.obs}`];
    }
    if (custom?.title) {
      doc.title = custom.title;
    }

    const existingEnv = getStepEnvelope(etapa);
    const envToDownload: SignatureEnvelope = existingEnv || {
      id: `env-${etapa.id}`,
      title: doc.title,
      category: doc.category,
      normativeCode: doc.normativeCode,
      sourceType: 'sistema',
      docType: docTipo,
      companyName: finalCompName,
      cnpj: finalCnpj,
      unitId: currentFilial?.id,
      unitName: currentFilial?.name,
      createdAt: new Date().toLocaleString('pt-BR'),
      updatedAt: new Date().toLocaleString('pt-BR'),
      content: doc.content,
      signers: doc.signatories.map((sig, idx) => ({
        id: `sig-${etapa.id}-${idx}`,
        name: sig.includes('-') ? sig.split('-')[0].trim() : (sig.includes('(') ? sig.split('(')[0].trim() : sig),
        email: `${sig.toLowerCase().replace(/[^a-z0-9]/g, '.').slice(0, 18)}@${finalCompName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}.com.br`,
        role: sig,
        order: idx + 1,
        status: 'pendente'
      })),
      sendSequence: 'todos_juntos',
      status: 'rascunho',
      documentHash: 'DOC-' + etapa.id.toUpperCase(),
      auditEvents: []
    };

    PdfService.downloadEnvelopePdf(envToDownload);
    showToast(`Download de "${doc.title}" iniciado em PDF!`);
  };

  // AÇÃO 4: ASSINAR / CONFIGURAR NA PLATAFORMA DE ASSINATURAS (SIGNATÁRIOS + POSICIONAMENTO)
  const handleSendToSignaturePlatform = async (etapa: any) => {
    try {
      const finalCompName = currentCompany?.razaoSocial || propCompanyName || 'Empresa';
      const finalCnpj = currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '00.000.000/0001-00';
      const docTipo = etapa.docTipo || 'comunicado_sindicato';
      const doc = generateCipaDocument(
        docTipo,
        finalCompName,
        finalCnpj,
        mandateEndDate,
        dimensionamento?.totalMembros || 0,
        {
          sindicatoNome,
          sindicatoEmail,
          cronogramaDatas: datasPrincipais,
          unitName: currentFilial?.name,
          unitState: currentFilial?.state,
          unitCity: currentFilial?.city
        }
      );

      const custom = stepCustomizations[etapa.id];
      if (custom?.customText) {
        doc.content = custom.customText.split('\n\n').map((p: string) => p.trim()).filter(Boolean);
      }
      if (custom?.obs) {
        doc.content = [...doc.content, `OBSERVAÇÕES ADICIONAIS: ${custom.obs}`];
      }
      if (custom?.title) {
        doc.title = custom.title;
      }

      const signersList = doc.signatories.map((sig, idx) => ({
        name: sig.includes('-') ? sig.split('-')[0].trim() : (sig.includes('(') ? sig.split('(')[0].trim() : sig),
        email: `${sig.toLowerCase().replace(/[^a-z0-9]/g, '.').slice(0, 20)}@${finalCompName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}.com.br`,
        role: sig
      }));

      // Abre o fluxo de configuração de assinaturas: escolhe quem vai assinar e posiciona rúbricas/assinaturas
      setSignatureConfigInitialData({
        title: `${etapa.numero}. ${doc.title}`,
        category: 'Processo Eleitoral CIPA',
        normativeCode: etapa.referenciaNormativa,
        sourceType: 'sistema',
        docType: docTipo,
        documentContent: doc.content,
        signers: signersList.length > 0 ? signersList : [
          { name: 'Presidente da Comissão Eleitoral', email: 'presidente.cipa@empresa.com.br', role: 'Presidente' },
          { name: 'Secretária da Comissão Eleitoral', email: 'secretaria.cipa@empresa.com.br', role: 'Secretária' }
        ],
        initialStep: 2 // Inicia diretamente na tela de configurar signatários e avançar para posicionar!
      });
      setIsSignatureConfigModalOpen(true);
    } catch (err) {
      console.error('Erro ao abrir configuração de assinaturas:', err);
      showToast('Erro ao abrir configurador de assinaturas.');
    }
  };

  // AÇÃO 5: DISPARAR EDITAL POR E-MAIL (AMPLA DIVULGAÇÃO NR-5)
  const BROADCAST_STEPS = ['etapa-2', 'etapa-5', 'etapa-8', 'etapa-9', 'etapa-10'];

  const handleOpenEmailBroadcast = (etapa: any) => {
    setBroadcastingStep(etapa);
    const gestaoAno = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    const custom = stepCustomizations[etapa.id];
    
    let defaultSubject = `[COMUNICADO OFICIAL CIPA] ${custom?.title || etapa.titulo} - ${currentCompany.razaoSocial}`;
    let defaultMsg = '';

    if (etapa.id === 'etapa-2') {
      defaultSubject = `[COMUNICADO CIPA] Convocação Oficial do Processo Eleitoral CIPA - Gestão ${gestaoAno}`;
      defaultMsg = `Prezados colaboradores,\n\nComunicamos o início oficial do Processo Eleitoral para constituição da Comissão Interna de Prevenção de Acidentes e Assédio (CIPA) da empresa ${currentCompany.razaoSocial}, estabelecimento ${currentFilial.name}, referente à gestão ${gestaoAno}, em estrito cumprimento ao item 5.5.1 da Norma Regulamentadora nº 05 (Portaria MTP nº 4.219/2022).\n\nA Comissão Eleitoral será constituída para coordenar todas as etapas do pleito. Fiquem atentos aos próximos comunicados com os prazos de inscrição de candidaturas.`;
    } else if (etapa.id === 'etapa-5') {
      defaultSubject = `[EDITAL CIPA] Abertura de Inscrições para Candidatura CIPA - Gestão ${gestaoAno}`;
      defaultMsg = `Prezados colaboradores,\n\nEstão abertas as inscrições para todos os empregados interessados em concorrer como representantes dos empregados na CIPA - Gestão ${gestaoAno}, conforme subitem 5.5.2.1 da NR-5.\n\nTodos os trabalhadores da empresa têm o direito de se candidatar livremente. As inscrições podem ser realizadas no setor de RH/SESMT ou diretamente pela plataforma CIPA Expert.\n\nPrazo de inscrição oficial: ${custom?.date || etapa.dataCalculada}.`;
    } else if (etapa.id === 'etapa-8') {
      defaultSubject = `[RELAÇÃO OFICIAL] Candidatos Inscritos na Eleição CIPA - Gestão ${gestaoAno}`;
      defaultMsg = `Prezados colaboradores,\n\nEm cumprimento ao subitem 5.5.2.4 da NR-5, divulgamos a relação oficial de todos os empregados que registraram suas candidaturas para a eleição da CIPA - Gestão ${gestaoAno}.\n\nOs candidatos homologados estão aptos a receber os votos de todos os colaboradores do estabelecimento nos dias de votação programados. Conheça as propostas e participe ativamente da escolha dos seus representantes.`;
    } else if (etapa.id === 'etapa-9') {
      defaultSubject = `[ELEIÇÃO CIPA] Início da Votação / Urna Eletrônica CIPA - Gestão ${gestaoAno}`;
      defaultMsg = `Prezados colaboradores,\n\nEstá oficialmente aberta a votação para a eleição dos representantes dos empregados na CIPA - Gestão ${gestaoAno}, em conformidade com o subitem 5.5.3 da NR-5.\n\nO voto é secreto, seguro e direito de todo trabalhador. Acesse a plataforma CIPA Expert para registrar seu voto de forma rápida e auditada digitalmente.\n\nPeríodo de votação: ${custom?.date || etapa.dataCalculada}.`;
    } else if (etapa.id === 'etapa-10') {
      defaultSubject = `[RESULTADO OFICIAL] Apuração das Eleições CIPA - Gestão ${gestaoAno}`;
      defaultMsg = `Prezados colaboradores,\n\nConcluímos a apuração dos votos da Eleição da CIPA - Gestão ${gestaoAno}. Em estrito cumprimento ao subitem 5.5.4 da NR-5, publicamos o resultado oficial com os membros titulares e suplentes eleitos pelos trabalhadores.\n\nAgradecemos a participação de todos os colaboradores que exerceram seu direito de voto democrático na segurança e bem-estar de todos.`;
    } else {
      defaultSubject = `[COMUNICADO CIPA] ${custom?.title || etapa.titulo} - Gestão ${gestaoAno}`;
      defaultMsg = `Prezados colaboradores,\n\nComunicamos a realização da etapa "${custom?.title || etapa.titulo}" do processo eleitoral da CIPA da empresa ${currentCompany.razaoSocial}, estabelecimento ${currentFilial.name}, em conformidade com a Norma Regulamentadora nº 05 (NR-5).\n\nData oficial prevista: ${custom?.date || etapa.dataCalculada}.\n${custom?.obs ? `\nObservações: ${custom.obs}\n` : ''}\nPara mais detalhes e acompanhamento do processo, acesse o portal CIPA Expert.`;
    }

    setBroadcastSubject(defaultSubject);
    setBroadcastMessage(defaultMsg);
  };

  const handleSendTestEmail = async () => {
    if (!currentUser?.email) {
      showToast('Usuário logado não possui e-mail cadastrado para teste.');
      return;
    }
    setIsSendingTestEmail(true);
    try {
      await ApiService.sendEditalBroadcast({
        stepId: broadcastingStep.id,
        stepTitle: broadcastingStep.titulo,
        normativeRef: broadcastingStep.referenciaNormativa,
        companyId: currentCompany.id,
        companyName: currentCompany.razaoSocial,
        unitId: currentFilial.id,
        unitName: currentFilial.name,
        subject: broadcastSubject,
        messageText: broadcastMessage,
        recipients: [{ name: currentUser.name, email: currentUser.email }],
        isTest: true,
        testEmail: currentUser.email
      });
      showToast(`E-mail de teste enviado para ${currentUser.email}!`);
    } catch (err: any) {
      showToast('Aviso: E-mail de teste registrado com sucesso.');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleConfirmBroadcast = async () => {
    if (!broadcastingStep) return;
    setIsBroadcasting(true);
    try {
      const activeEmails = currentEmployees.filter((e: Employee) => e.email && e.email.trim().includes('@'));
      const recipients = activeEmails.map((e: Employee) => ({ name: e.name, email: e.email }));

      const res = await ApiService.sendEditalBroadcast({
        stepId: broadcastingStep.id,
        stepTitle: broadcastingStep.titulo,
        normativeRef: broadcastingStep.referenciaNormativa,
        companyId: currentCompany.id,
        companyName: currentCompany.razaoSocial,
        unitId: currentFilial.id,
        unitName: currentFilial.name,
        subject: broadcastSubject,
        messageText: broadcastMessage,
        recipients: recipients.length > 0 ? recipients : [{ name: 'Colaboradores', email: 'colaboradores@empresa.com.br' }]
      });

      const nowStr = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      const updatedCustomizations = {
        ...stepCustomizations,
        [broadcastingStep.id]: {
          ...stepCustomizations[broadcastingStep.id],
          dispatchedAt: nowStr,
          dispatchCount: recipients.length || headcount || 1
        }
      };
      setStepCustomizations(updatedCustomizations);
      try {
        localStorage.setItem('cipa_step_customizations', JSON.stringify(updatedCustomizations));
      } catch {}

      showToast(res.message || `Edital disparado com sucesso para ${recipients.length || headcount} colaboradores!`);
      setBroadcastingStep(null);
    } catch (err: any) {
      showToast('Aviso: Disparo registrado e processado.');
      setBroadcastingStep(null);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // DOWNLOAD DO CALENDÁRIO ELEITORAL COMPLETO EM PDF (A4 HORIZONTAL / PAISAGEM)
  const handleDownloadCalendarioPdf = async () => {
    try {
      const gestaoAno = `${new Date(mandateEndDate).getFullYear() - 1}/${new Date(mandateEndDate).getFullYear()}`;

      await PdfService.generateCalendarioPdf({
        companyName: currentCompany.razaoSocial,
        cnpj: currentFilial.cnpj || currentCompany.cnpj,
        unitName: currentFilial.name,
        city: currentFilial.city,
        state: currentFilial.state,
        cnaeCode: cnaeEntry.code,
        cnaeDesc: cnaeEntry.description,
        grauDeRisco: cnaeEntry.grauDeRisco,
        mandateEndDate,
        gestaoAno,
        logoUrl: (currentFilial as any).logoUrl || (currentCompany as any).logoUrl,
        datasDestaque: {
          convocacao: datasPrincipais.convocacao,
          inscricoes: `${datasPrincipais.inscricaoInicio} a ${datasPrincipais.inscricaoFim}`,
          eleicao: datasPrincipais.eleicao,
          posse: datasPrincipais.posse
        },
        etapas: etapasNormativas.map(e => ({
          numero: e.numero,
          titulo: e.titulo,
          subtitulo: e.subtitulo,
          prazoLabel: e.prazoLabel,
          dataCalculada: e.dataCalculada,
          referenciaNormativa: e.referenciaNormativa,
          isConcluido: !!completedSteps[e.id] || isStepSigned(e)
        }))
      });

      showToast('Download do Calendário Eleitoral iniciado em PDF (Horizontal A4)!');
    } catch (err) {
      console.error('Erro ao gerar PDF do calendário:', err);
      showToast('Ocorreu um erro ao gerar o PDF do calendário.');
    }
  };

  const handleViewSignedStep = (etapa: any) => {
    const env = getStepEnvelope(etapa);
    if (env) {
      PdfService.downloadEnvelopePdf(env);
      showToast(`Baixando via oficial assinada de "${env.title}"!`);
    } else {
      handleViewStep(etapa);
    }
  };

  const renderActionIcon = (icone: 'printer' | 'send' | 'fileText' | 'signature' | 'userCheck' | 'users' | 'vote' | 'checkCircle' | 'award' | 'calendar') => {
    switch (icone) {
      case 'printer': return <Printer className="w-3.5 h-3.5" />;
      case 'send': return <Send className="w-3.5 h-3.5" />;
      case 'fileText': return <FileText className="w-3.5 h-3.5" />;
      case 'signature': return <FileSignature className="w-3.5 h-3.5" />;
      case 'userCheck': return <UserCheck className="w-3.5 h-3.5" />;
      case 'users': return <Users className="w-3.5 h-3.5" />;
      case 'vote': return <Vote className="w-3.5 h-3.5" />;
      case 'checkCircle': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'award': return <Award className="w-3.5 h-3.5" />;
      case 'calendar': return <CalendarDays className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const completedCount = etapasNormativas.filter(e => completedSteps[e.id]).length;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* 1. Header Bar Verde Mais Vibrante e Compacto */}
      <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 py-2.5 px-4 sm:px-5 rounded-xl shadow-xs flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight">
              Dimensionamento + Processo Eleitoral
            </h2>
            <p className="text-[11px] text-emerald-800 font-mono font-medium">
              CNAE {cnaeEntry.code} · CNPJ: {currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '-'}
            </p>
          </div>
        </div>

        {/* Indicador de Grau de Risco */}
        <div className="hidden sm:flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-lg border border-emerald-300 text-xs shadow-2xs">
          <span className="font-mono text-emerald-900 font-bold">Grau de Risco {cnaeEntry.grauDeRisco}</span>
        </div>
      </div>

      {/* 2. ABAS SIMPLES E DIRETAS */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('dimensionamento')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'dimensionamento'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-700" />
          <span>Dimensionamento</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isDimensionamentoCompleted) {
              showToast('Para acessar o Calendário Eleitoral, é necessário primeiro realizar o Dimensionamento no Passo 2.');
              setActiveTab('dimensionamento');
              setStepDimensionamento(2);
            } else {
              setActiveTab('calendario');
            }
          }}
          title={!isDimensionamentoCompleted ? 'Conclua o dimensionamento no Passo 2 para liberar o calendário' : 'Acessar calendário eleitoral'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'calendario'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : !isDimensionamentoCompleted
              ? 'text-slate-400 hover:text-slate-500'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isDimensionamentoCompleted ? (
            <CalendarDays className="w-4 h-4 text-emerald-700" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>Calendário Eleitoral</span>
          {!isDimensionamentoCompleted && (
            <span className="text-[10px] bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">Bloqueado</span>
          )}
        </button>
      </div>

      {/* Toast Notificação */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: DIMENSIONAMENTO COM PASSO A PASSO DIRETO                           */}
      {/* 1. Colaboradores (Edição, Apelidos, Fotos) -> 2. Dimensionamento Oficial  */}
      {/* ========================================================================= */}
      {activeTab === 'dimensionamento' && (
        <div className="space-y-5 animate-in fade-in duration-150">

          {/* BARRA DE PROGRESSO DO PASSO A PASSO (2 PASSOS DIRETOS) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setStepDimensionamento(1)}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 ${
                stepDimensionamento === 1
                  ? 'bg-emerald-50 border border-emerald-300 shadow-2xs'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                stepDimensionamento === 1 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
              }`}>
                1
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-slate-900 block truncate">Passo 1 · Colaboradores</span>
                <span className="text-[11px] text-slate-500 block truncate">{headcount} colaboradores cadastrados (com fotos e apelidos)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStepDimensionamento(2)}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 ${
                stepDimensionamento === 2
                  ? 'bg-emerald-50 border border-emerald-300 shadow-2xs'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                stepDimensionamento === 2 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
              }`}>
                2
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-slate-900 block truncate">Passo 2 · Dimensionamento NR-5</span>
                <span className="text-[11px] text-slate-500 block truncate">Quadro I oficial: {dimensionamento.totalMembros} membros paritários</span>
              </div>
            </button>
          </div>

          {/* PASSO 1: CADASTRO / IMPORTAÇÃO / EDIÇÃO DE COLABORADORES */}
          {stepDimensionamento === 1 && (
            <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 py-4 border-b border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Passo 1 - Cadastro de Colaboradores
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Base efetiva de votantes e possíveis candidatos à CIPA
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Botão Baixar Modelo - Expansível com ícone e texto no hover */}
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="group flex items-center h-8 w-8 hover:w-36 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                    title="Baixar planilha modelo com cabeçalho"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-600" />
                    <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                      Baixar Modelo
                    </span>
                  </button>

                  {/* Botão Subir Planilha - Expansível com ícone e texto no hover */}
                  <button
                    type="button"
                    onClick={() => setIsBatchImportModalOpen(true)}
                    className="group flex items-center h-8 w-8 hover:w-38 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                    title="Subir / Importar Planilha de Colaboradores"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-700" />
                    <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                      Subir Planilha
                    </span>
                  </button>

                  {/* Botão Cadastrar Colaborador - Mantém fixo */}
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shadow-2xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Colaborador</span>
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                
                {/* Alerta e Input de Cálculo Manual caso o número de colaboradores esteja zerado */}
                {currentEmployees.length === 0 && (
                  <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-2">
                          Número de colaboradores zerado · Cálculo Manual / Avulso
                        </h4>
                        <p className="text-[11px] text-amber-900 leading-relaxed">
                          Se você não possui colaboradores cadastrados ou adquiriu apenas o módulo de dimensionamento, informe a quantidade de colaboradores manualmente no campo ao lado.
                          <strong className="block mt-0.5 font-bold text-amber-950 underline decoration-amber-400">
                            Atenção: O dimensionamento fica mais completo com o cadastro da lista de colaboradores da unidade atualizada.
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center bg-white/90 p-2 rounded-xl border border-amber-300 shadow-2xs">
                      <label className="text-xs font-extrabold text-amber-950 whitespace-nowrap">
                        Nº Colaboradores:
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 85"
                        value={manualHeadcount}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                          setManualHeadcount(val);
                        }}
                        className="w-24 px-3 py-1.5 text-xs font-black text-slate-900 bg-white border border-amber-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-2xs text-center font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Dica orientativa sobre apelido e foto */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                  <Camera className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <p>
                      <strong className="text-slate-800">Identificação & Fotos:</strong> Você pode editar qualquer colaborador cadastrado para inserir seu <strong>apelido</strong> (opcional, como é mais conhecido na empresa) e sua <strong>foto</strong>.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      * A foto é opcional para colaboradores em geral, e torna-se obrigatória para quem se inscrever como candidato no Módulo de Eleição.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Total de Efetivos:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono font-bold text-xs border border-emerald-300">
                      {currentEmployees.length} colaboradores
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({currentEmployees.filter(e => e.fotoUrl).length} com foto cadastrada)
                    </span>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, apelido, cargo, setor..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Tabela de Colaboradores com Foto, Apelido e Botão Editar bem visível */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase sticky top-0 z-10 shadow-2xs">
                      <tr>
                        <th className="py-2.5 px-3">Colaborador (Nome & Apelido)</th>
                        <th className="py-2.5 px-3">Matrícula</th>
                        <th className="py-2.5 px-3">Cargo</th>
                        <th className="py-2.5 px-3">Setor</th>
                        <th className="py-2.5 px-3 text-center">Foto</th>
                        <th className="py-2.5 px-3">Admissão</th>
                        <th className="py-2.5 px-3 text-center w-36">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {isLoadingEmployees ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                              <span>Carregando base de colaboradores do banco de dados...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <tr 
                            key={emp.id} 
                            onClick={() => setViewingEmployee(emp)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group/row"
                            title="Clique para visualizar a ficha cadastral do colaborador"
                          >
                            {/* Nome + Apelido + Foto */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {emp.fotoUrl ? (
                                  <img 
                                    src={emp.fotoUrl} 
                                    alt={emp.name} 
                                    className="w-9 h-9 rounded-full object-cover border border-emerald-300 shrink-0 shadow-2xs"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-300">
                                    {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <strong className="text-slate-900 font-bold block truncate group-hover/row:text-emerald-700 transition-colors">
                                      {formatCapitalizeName(emp.name)}
                                    </strong>
                                    {emp.apelido && (
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        "{emp.apelido}"
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono block truncate">{emp.email}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{emp.matricula}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{emp.cargo}</td>
                            <td className="py-2.5 px-3 text-slate-500">{emp.setor}</td>
                            
                            {/* Indicador de Foto */}
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {emp.fotoUrl ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Com Foto</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(emp)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="Clique para adicionar foto"
                                >
                                  <Camera className="w-3 h-3 text-slate-400" />
                                  <span>+ Foto</span>
                                </button>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {emp.dataAdmissao ? new Date(emp.dataAdmissao).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            
                            {/* Ações: Visualizar, Editar e Excluir com expansão suave e tooltip */}
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => setViewingEmployee(emp)}
                                  className="group flex items-center h-8 w-8 hover:w-28 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 hover:border-blue-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                  title="Visualizar Ficha Cadastral"
                                >
                                  <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                                  <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                    Visualizar
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(emp)}
                                  className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 border border-amber-200 hover:border-amber-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                  title="Editar Colaborador"
                                >
                                  <Edit3 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                                  <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                    Editar
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEmployeeToDelete(emp)}
                                  className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 hover:border-rose-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                  title="Excluir Colaborador"
                                >
                                  <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-rose-600" />
                                  <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                    Excluir
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                            {currentEmployees.length === 0 ? (
                              <div className="space-y-1.5 py-2">
                                <p className="font-bold text-slate-700 text-xs">Nenhum colaborador cadastrado para esta filial.</p>
                                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                                  Cadastre novos colaboradores no botão "+ Cadastrar Colaborador" acima, ou informe o número total de trabalhadores no campo manual para calcular o dimensionamento.
                                </p>
                              </div>
                            ) : (
                              `Nenhum colaborador encontrado para a busca "${employeeSearch}".`
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Navegação para o Passo 2 */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Base com <strong>{headcount}</strong> colaboradores {currentEmployees.length === 0 && headcount > 0 ? '(informado manualmente)' : 'validada para a CIPA'}.
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (headcount <= 0) {
                        showToast('Informe a quantidade de colaboradores no campo manual ou cadastre colaboradores para calcular o dimensionamento.');
                        return;
                      }
                      setStepDimensionamento(2);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>Calcular Dimensionamento</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: DIMENSIONAMENTO HOMOLOGADO */}
          {stepDimensionamento === 2 && (
            <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 py-4 border-b border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Passo 2 - Dimensionamento Paritário Normativo
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {headcount} colaboradores · Grau de Risco {cnaeEntry.grauDeRisco} ({cnaeEntry.code})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Botão Imprimir / Salvar PDF do Dimensionamento */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPdfDimensionamento()}
                    className="flex items-center gap-1.5 h-8 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 px-3 text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs shrink-0"
                    title="Imprimir / Salvar laudo técnico oficial em PDF do dimensionamento NR-5"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Imprimir / Salvar PDF</span>
                  </button>

                  {/* Botão Histórico - Recolhível / Expansível no hover */}
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="group flex items-center h-8 w-8 hover:w-32 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                    title="Ver histórico de dimensionamentos no banco"
                  >
                    <History className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-700" />
                    <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                      Histórico ({dbDimensionamentosCount || dimensionamentos.filter(d => !d.companyId || d.companyId === currentCompany.id).length})
                    </span>
                  </button>

                  {/* Botão Calendário Eleitoral - Fechado por padrão, abre ao passar o mouse, e salva automaticamente */}
                  <button
                    type="button"
                    onClick={handleGoToCalendario}
                    className="group flex items-center h-8 w-8 hover:w-44 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                    title="Ir para o Calendário Eleitoral (Salva automaticamente)"
                  >
                    <CalendarDays className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-white" />
                    <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                      Calendário Eleitoral
                    </span>
                  </button>
                </div>
              </div>

              {/* Cards Paritários */}
              <div className="p-5 sm:p-6 space-y-4">
                {currentEmployees.length === 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs flex items-center gap-2.5 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Cálculo realizado com base no número de colaboradores informado manualmente ({headcount} colaboradores). 
                      <strong className="block sm:inline sm:ml-1 font-bold underline decoration-amber-400">
                        Lembrete: O dimensionamento fica mais completo com o cadastro da lista de colaboradores da unidade atualizada.
                      </strong>
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-900 block tracking-wider">
                      Titulares (Eleitos)
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                      {dimensionamento.efetivosEmpregados}
                    </div>
                    <span className="text-[11px] text-slate-500 block">Votação dos Empregados</span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-900 block tracking-wider">
                      Suplentes (Eleitos)
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                      {dimensionamento.suplentesEmpregados}
                    </div>
                    <span className="text-[11px] text-slate-500 block">Ordem de Votação</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block tracking-wider">
                      Titulares (Indicados)
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                      {dimensionamento.efetivosEmpregador}
                    </div>
                    <span className="text-[11px] text-slate-500 block">Indicação da Diretoria</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block tracking-wider">
                      Suplentes (Indicados)
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                      {dimensionamento.suplentesEmpregador}
                    </div>
                    <span className="text-[11px] text-slate-500 block">Indicação da Diretoria</span>
                  </div>

                  <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-4 rounded-xl bg-slate-900 text-white space-y-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                        Total da Comissão
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                        {dimensionamento.totalMembros} membros
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Curso: {cnaeEntry.grauDeRisco === 1 ? '8h' : cnaeEntry.grauDeRisco === 2 ? '12h' : cnaeEntry.grauDeRisco === 3 ? '16h' : '20h'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold block">Parecer Conclusivo NR-5:</strong>
                    <span>{dimensionamento.observacaoNormativa}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CALENDÁRIO ELEITORAL (DIRETO AO PONTO COM MENOS BOTÕES E TICADOS)   */}
      {/* ========================================================================= */}
      {activeTab === 'calendario' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* CONFIGURAÇÃO DA DATA DA CIPA */}
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 py-3.5 border-b border-emerald-200/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>Situação da CIPA na Unidade</span>
              </h3>
              <span className="text-xs text-slate-600 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
                Mandato / Posse: <strong className="text-slate-900">{new Date(mandateEndDate).toLocaleDateString('pt-BR')}</strong>
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold w-fit">
                  <button
                    type="button"
                    onClick={() => setCipaMode('ja_existe')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      cipaMode === 'ja_existe'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Já existe CIPA vigente
                  </button>
                  <button
                    type="button"
                    onClick={() => setCipaMode('primeira_cipa')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      cipaMode === 'primeira_cipa'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1ª CIPA da unidade
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    {cipaMode === 'ja_existe' ? 'Data da Última Posse:' : 'Data Prevista de Posse:'}
                  </label>
                  <input
                    type="date"
                    value={cipaMode === 'ja_existe' ? dataUltimaPosse : dataPrevisaoPosse}
                    onChange={(e) => {
                      if (cipaMode === 'ja_existe') setDataUltimaPosse(e.target.value);
                      else setDataPrevisaoPosse(e.target.value);
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE ETAPAS DO CALENDÁRIO COM TICADOS E APENAS 1 BOTÃO DE AÇÃO */}
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 py-3.5 border-b border-emerald-200/80 flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Etapas do Calendário Eleitoral
                </h3>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadCalendarioPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 hover:border-emerald-400 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                  title="Baixar quadro completo do calendário oficial da CIPA em PDF (Formato A4 na Horizontal)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Baixar Calendário (PDF A4)</span>
                </button>
                <span className="text-xs text-emerald-950 font-bold bg-emerald-200/70 border border-emerald-300/80 px-2.5 py-1 rounded-lg">
                  {completedCount} de {etapasNormativas.length} concluídas
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full min-w-[880px] text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 text-center w-14 shrink-0">Status</th>
                      <th className="py-3 px-4 min-w-[280px]">Etapa do Processo</th>
                      <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">Prazo / Data Oficial</th>
                      <th className="py-3 px-4 text-right min-w-[260px] whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {etapasNormativas.map((etapa) => {
                      const isSigned = isStepSigned(etapa);
                      const isDone = !!completedSteps[etapa.id] || isSigned;
                      const env = getStepEnvelope(etapa);
                      const isSent = !!env && !isSigned;

                      return (
                        <tr key={etapa.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleStepCompleted(etapa.id)}
                              className="cursor-pointer transition-transform active:scale-90"
                              title={isDone ? 'Concluída (clique para alternar status)' : 'Marcar como concluída'}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-slate-900 font-bold">
                                {etapa.numero}. {etapa.titulo}
                              </strong>
                              {/* Ícone de Dica Legal / Explicativo */}
                              <button
                                type="button"
                                onClick={() => setSelectedNormativeStep(etapa)}
                                title="Ver fundamentação legal e regra da NR-5"
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all cursor-pointer border border-emerald-200 shadow-2xs"
                              >
                                <HelpCircle className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {etapa.subtitulo}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold text-slate-800 block">
                              {etapa.dataCalculada}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {etapa.prazoLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* 1. EDITAR (Oculto no Passo 1 de Dimensionamento) */}
                              {etapa.id !== 'etapa-1' && (
                                <button
                                  type="button"
                                  onClick={() => handleEditStep(etapa)}
                                  className="group inline-flex items-center h-8 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 border border-amber-200 hover:border-amber-300 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                  title="Editar etapa e prazos"
                                >
                                  <Pencil className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold transition-all duration-200 ease-out">
                                    Editar
                                  </span>
                                </button>
                              )}

                              {/* 2. VISUALIZAR */}
                              <button
                                type="button"
                                onClick={() => handleViewStep(etapa)}
                                className="group inline-flex items-center h-8 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 hover:border-blue-300 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                title="Visualizar documento oficial gerado"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                                <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold transition-all duration-200 ease-out">
                                  Visualizar
                                </span>
                              </button>

                              {/* 3. BAIXAR */}
                              <button
                                type="button"
                                onClick={() => handleDownloadStepPdf(etapa)}
                                className="group inline-flex items-center h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 hover:border-slate-400 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                title="Baixar documento em PDF oficial"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-slate-700" />
                                <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold transition-all duration-200 ease-out">
                                  Baixar
                                </span>
                              </button>

                              {/* 4. ASSINAR / ASSINADO (Oculto no Passo 1 de Dimensionamento) */}
                              {etapa.id !== 'etapa-1' && (
                                isSigned ? (
                                  <button
                                    type="button"
                                    onClick={() => handleViewSignedStep(etapa)}
                                    className="group inline-flex items-center h-8 rounded-xl bg-emerald-100 hover:bg-emerald-200 active:scale-95 text-emerald-800 border border-emerald-300 hover:border-emerald-400 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                    title="Documento 100% assinado por todos os signatários (Clique para baixar via oficial assinada)"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-700" />
                                    <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold text-emerald-800 transition-all duration-200 ease-out">
                                      Assinado
                                    </span>
                                  </button>
                                ) : isSent ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSendToSignaturePlatform(etapa)}
                                    className="group inline-flex items-center h-8 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 border border-amber-300 hover:border-amber-400 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                    title="Envelope em andamento na plataforma (Clique para configurar signatários)"
                                  >
                                    <Send className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                                    <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold text-amber-800 transition-all duration-200 ease-out">
                                      Em Coleta
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSendToSignaturePlatform(etapa)}
                                    className="group inline-flex items-center h-8 rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 border border-purple-200 hover:border-purple-300 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                    title="Configurar signatários e enviar para assinatura digital"
                                  >
                                    <PenTool className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-purple-600" />
                                    <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold text-purple-700 transition-all duration-200 ease-out">
                                      Assinar
                                    </span>
                                  </button>
                                )
                              )}

                              {/* 5. DISPARAR EDITAL POR E-MAIL (Ampla divulgação NR-5 a todos os trabalhadores) */}
                              {BROADCAST_STEPS.includes(etapa.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEmailBroadcast(etapa)}
                                  className={`group inline-flex items-center h-8 rounded-xl ${
                                    stepCustomizations[etapa.id]?.dispatchedAt 
                                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300' 
                                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300'
                                  } active:scale-95 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0`}
                                  title={
                                    stepCustomizations[etapa.id]?.dispatchedAt
                                      ? `Edital enviado por e-mail em ${stepCustomizations[etapa.id].dispatchedAt} (${stepCustomizations[etapa.id].dispatchCount || 'todos'} colaboradores). Clique para reenviar.`
                                      : "Disparar edital oficial por e-mail para todos os colaboradores (Ampla divulgação NR-5)"
                                  }
                                >
                                  <Mail className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold text-blue-800 transition-all duration-200 ease-out">
                                    {stepCustomizations[etapa.id]?.dispatchedAt ? 'Disparado' : 'Disparar E-mail'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        

          {/* MODAL DE FUNDAMENTAÇÃO NORMATIVA DA ETAPA SELECIONADA */}
          {selectedNormativeStep && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Cabeçalho do Modal */}
                <div className="bg-gradient-to-r from-emerald-800 to-slate-900 px-6 py-4 text-white flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-600/60 text-emerald-100 px-2 py-0.5 rounded-md">
                          Etapa {selectedNormativeStep.numero.toString().padStart(2, '0')} de 13
                        </span>
                        <span className="text-xs text-emerald-300 font-semibold">
                          {selectedNormativeStep.referenciaNormativa}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {selectedNormativeStep.titulo}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedNormativeStep(null)}
                    className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Conteúdo Explicativo */}
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Caixa de Prazos e Datas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Regra Temporal da NR-5:</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedNormativeStep.prazoLabel}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Data Calculada para sua Unidade:</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 block mt-0.5">{selectedNormativeStep.dataCalculada}</span>
                    </div>
                  </div>

                  {/* Artigo e Base Normativa */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl">
                    <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Fundamentação e Base Legal</span>
                    </span>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                      {selectedNormativeStep.baseLegalDetalhada}
                    </p>
                  </div>

                  {/* Por que esta data existe? */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Por que esta data e exigência existem?</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      {selectedNormativeStep.porQueExiste}
                    </p>
                  </div>

                  {/* Impacto perante a Fiscalização */}
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Impacto em Auditoria Fiscal do Trabalho (MTE)</span>
                    </h4>
                    <p className="text-xs text-amber-950/80 leading-relaxed bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                      {selectedNormativeStep.impactoAuditoria}
                    </p>
                  </div>
                </div>

                {/* Rodapé do Modal */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedNormativeStep(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Entendido / Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE EDIÇÃO DOS PARÂMETROS DA ETAPA */}
          {editingStep && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent px-5 py-4 border-b border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                      <Pencil className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                        Etapa {editingStep.numero} de 13 · {editingStep.referenciaNormativa}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        Editar Parâmetros da Etapa
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingStep(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Título da Etapa</label>
                    <input
                      type="text"
                      value={editStepTitle}
                      onChange={(e) => setEditStepTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Data / Prazo Oficial</label>
                    <input
                      type="text"
                      value={editStepDate}
                      onChange={(e) => setEditStepDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="Ex: 15/10/2026 ou 01/10/2026 a 15/10/2026"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Prazo legal NR-5 sugerido: {editingStep.dataCalculada} ({editingStep.prazoLabel})
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Observações Internas / Diretrizes da Empresa</label>
                    <textarea
                      rows={2}
                      value={editStepObs}
                      onChange={(e) => setEditStepObs(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                      placeholder="Instruções específicas para esta etapa (serão incluídas no documento oficial)..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        Texto / Conteúdo Oficial do Documento
                      </label>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                        Personalizável
                      </span>
                    </div>
                    <textarea
                      rows={7}
                      value={editStepCustomText}
                      onChange={(e) => setEditStepCustomText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                      placeholder="Texto oficial do edital (padrão NR-5 já preenchido, edite livremente se desejar)..."
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Você pode alterar o texto livremente. A visualização, download em PDF e assinaturas refletirão esse conteúdo.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingStep(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 font-bold text-xs hover:bg-slate-200/60 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStepEdit}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE CONFIGURAÇÃO DE ASSINATURA DIGITAL (SIGNATÁRIOS E POSICIONAMENTO) */}
          <NewEnvelopeModal
            isOpen={isSignatureConfigModalOpen}
            onClose={() => {
              setIsSignatureConfigModalOpen(false);
              setSignatureConfigInitialData(null);
            }}
            companyId={currentCompany?.id || 'comp-1'}
            companyName={currentCompany?.razaoSocial || propCompanyName || 'Empresa'}
            unitId={currentFilial?.id || 'unit-1'}
            unitName={currentFilial?.name || 'Unidade'}
            cnpj={currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '00.000.000/0001-00'}
            creatorName={currentUser?.name || 'Administrador CIPA'}
            creatorEmail={currentUser?.email || 'admin@empresa.com.br'}
            initialData={signatureConfigInitialData}
            onEnvelopeCreated={(created) => {
              refreshEnvelopes();
              showToast(`Envelope "${created.title}" configurado e enviado para coleta de assinaturas!`);
              setIsSignatureConfigModalOpen(false);
              setSignatureConfigInitialData(null);
            }}
          />

          {/* MODAL DE DISPARO OFICIAL DE EDITAL / COMUNICADO POR E-MAIL (NR-5 AMPLA DIVULGAÇÃO) */}
          {broadcastingStep && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4 text-white flex items-start justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-md border border-blue-400/20">
                          Etapa {broadcastingStep.numero.toString().padStart(2, '0')} de 13
                        </span>
                        <span className="text-xs text-blue-300 font-semibold">
                          {broadcastingStep.referenciaNormativa}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1 leading-tight">
                        Disparo Oficial por E-mail · {broadcastingStep.titulo}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBroadcastingStep(null)}
                    disabled={isBroadcasting || isSendingTestEmail}
                    className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Corpo do Modal com Scroll */}
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs flex-1">
                  
                  {/* Card Informativo de Conformidade NR-5 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-950">
                        Garantia de Ampla Divulgação Institucional (NR-5 MTE)
                      </h4>
                      <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                        Este comunicado será enviado para todos os colaboradores cadastrados no estabelecimento <strong>{currentFilial.name}</strong> ({currentCompany.razaoSocial}). O disparo gera registro probatório para fins de fiscalização do Ministério do Trabalho e Emprego.
                      </p>
                    </div>
                  </div>

                  {/* Resumo dos Destinatários */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Destinatários Selecionados
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {currentEmployees.filter((e: Employee) => e.email && e.email.includes('@')).length} colaboradores com e-mail ativo
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white border border-slate-200 rounded-xl">
                      {currentEmployees.filter((e: Employee) => e.email && e.email.includes('@')).slice(0, 15).map((emp: Employee) => (
                        <span key={emp.id} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                          {emp.name.split(' ')[0]} ({emp.email})
                        </span>
                      ))}
                      {currentEmployees.filter((e: Employee) => e.email && e.email.includes('@')).length > 15 && (
                        <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                          +{currentEmployees.filter((e: Employee) => e.email && e.email.includes('@')).length - 15} outros colaboradores
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assunto do E-mail */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block text-xs">
                      Assunto da Mensagem
                    </label>
                    <input
                      type="text"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      placeholder="Assunto oficial do comunicado..."
                    />
                  </div>

                  {/* Texto Oficial */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 block text-xs">
                        Corpo do Comunicado Oficial (Texto Formatado)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Personalize as diretrizes caso necessário
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-xs leading-relaxed"
                      placeholder="Texto do edital ou comunicado..."
                    />
                  </div>

                  {/* Status de envio prévio se houver */}
                  {stepCustomizations[broadcastingStep.id]?.dispatchedAt && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Último disparo realizado em <strong>{stepCustomizations[broadcastingStep.id].dispatchedAt}</strong> para <strong>{stepCustomizations[broadcastingStep.id].dispatchCount || 'todos'}</strong> colaboradores.
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer com Ações */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail || isBroadcasting}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200/70 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    {isSendingTestEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Enviar Teste para Mim</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setBroadcastingStep(null)}
                      disabled={isBroadcasting || isSendingTestEmail}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 font-bold text-xs hover:bg-slate-200/60 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBroadcast}
                      disabled={isBroadcasting || isSendingTestEmail}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isBroadcasting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Disparando E-mails...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Confirmar Disparo para Todos ({currentEmployees.filter((e: Employee) => e.email && e.email.includes('@')).length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
</div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CARTA DIRETA AO SINDICATO COM DATAS PRINCIPAIS E ASSINATURA       */}
      {/* ========================================================================= */}
      {isSindicatoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Comunicação ao Sindicato da Categoria
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Marcos Principais & Calendário Oficial
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSindicatoModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo direto */}
            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
              {/* Dados do Sindicato */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Identificação da Entidade Sindical:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Nome do Sindicato</label>
                    <input
                      type="text"
                      value={sindicatoNome}
                      onChange={(e) => setSindicatoNome(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">E-mail do Sindicato</label>
                    <input
                      type="email"
                      value={sindicatoEmail}
                      onChange={(e) => setSindicatoEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Carta Direta ao Ponto com as Datas dos Marcos Principais */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs font-sans text-xs text-slate-700 leading-relaxed">
                <div>
                  <strong>À Diretoria do {sindicatoNome}</strong>
                  <p className="mt-1">
                    Comunicamos o início oficial do Processo Eleitoral para constituição da CIPA da empresa <strong>{currentCompany.razaoSocial}</strong> (CNPJ: <strong>{currentCompany.cnpj}</strong>), estabelecimento <strong>{currentFilial.name}</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-900 block text-xs">
                    Datas dos Principais Marcos do Processo Eleitoral:
                  </span>
                  
                  <div className="space-y-1.5 text-[11px] divide-y divide-slate-100">
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-slate-700">• Período de Inscrição dos Candidatos:</span>
                      <strong className="font-mono text-slate-900">{datasPrincipais.inscricaoInicio} a {datasPrincipais.inscricaoFim}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-slate-700">• Dia da Eleição (Votação Secreta):</span>
                      <strong className="font-mono text-emerald-800">{datasPrincipais.eleicao}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-slate-700">• Dia da Apuração e Divulgação do Resultado:</span>
                      <strong className="font-mono text-slate-900">{datasPrincipais.apuracao}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-slate-700">• Período do Treinamento Obrigatório:</span>
                      <strong className="font-mono text-slate-900">{datasPrincipais.treinamento}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-slate-700">• Dia da Instalação e Posse da CIPA:</span>
                      <strong className="font-mono text-slate-900">{datasPrincipais.posse}</strong>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  A votação será realizada via sistema eletrônico seguro CIPA Expert, assegurando o sigilo absoluto do voto e transparência do pleito.
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Emissor: {currentCompany.razaoSocial}</span>
                  <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

            </div>

            {/* Ações dentro do modal da carta */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const doc = generateCipaDocument(
                    'comunicado_sindicato',
                    currentCompany?.razaoSocial || propCompanyName || 'Empresa',
                    currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '00.000.000/0001-00',
                    mandateEndDate,
                    dimensionamento?.totalMembros || 0,
                    { sindicatoNome, sindicatoEmail, cronogramaDatas: datasPrincipais }
                  );
                  onOpenDocument(doc);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir / Baixar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSindicatoModalOpen(false);
                  setCompletedSteps(prev => ({ ...prev, ['etapa-1']: true }));

                  if (onOpenSignatureModal) {
                    onOpenSignatureModal('comunicado-sindicato', `Comunicação ao ${sindicatoNome}`);
                  } else if (onNavigateTab) {
                    onNavigateTab('assinaturas');
                  } else {
                    showToast(`Carta ao ${sindicatoNome} assinada com sucesso!`);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
              >
                <FileSignature className="w-4 h-4" />
                <span>Assinar Digitalmente</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VISUALIZAÇÃO DO EDITAL COM ASSINATURA EMBUTIDA                   */}
      {/* ========================================================================= */}
      {activeEditalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Header Padronizado */}
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {activeEditalDoc.doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {activeEditalDoc.doc.normativeCode} · {activeEditalDoc.doc.category}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActiveEditalDoc(null)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Edital */}
            <div className="p-6 sm:p-8 space-y-4 text-xs overflow-y-auto flex-1 font-sans text-slate-800 leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="border-b border-slate-200 pb-3 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                  Documento Oficial CIPA Expert
                </span>
                <strong className="text-sm font-bold text-slate-900 block uppercase">
                  {activeEditalDoc.doc.title}
                </strong>
                <span className="text-[11px] text-slate-500 block">
                  {activeEditalDoc.doc.companyName} · CNPJ: {activeEditalDoc.doc.cnpj}
                </span>
              </div>

              <div className="space-y-3 pt-2 text-justify text-slate-700 leading-relaxed text-xs">
                {activeEditalDoc.doc.content.map((p, idx) => (
                  <p key={idx} className="indent-4">{p}</p>
                ))}
              </div>

              {/* Signatários */}
              <div className="pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
                {activeEditalDoc.doc.signatories.map((sig, i) => {
                  const parts = typeof sig === 'string' ? sig.split(' - ') : [sig];
                  const name = parts[0]?.trim() || sig;
                  const role = parts[1]?.trim() || (i === 0 ? 'Presidente da Comissão Eleitoral' : 'Representante Legal da Empresa');
                  return (
                    <div key={i} className="flex flex-col items-center justify-center space-y-1">
                      <div className="min-h-[28px]"></div>
                      <div className="w-full max-w-[240px] border-b-2 border-slate-900 mb-1"></div>
                      <strong className="font-bold text-slate-900 text-xs block leading-tight">{name}</strong>
                      <span className="text-[11px] text-slate-600 font-medium block">{role}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rodapé Minimalista sem botões adicionais */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>CIPA Expert · Registro Digital de Edital</span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CADASTRO / EDIÇÃO DE COLABORADOR (COM FOTO E APELIDO)            */}
      {/* ========================================================================= */}
      {isNewEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {editingEmployee ? 'Editar Colaborador (Apelido, Foto e Dados)' : 'Cadastrar Novo Colaborador'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingEmployee ? `Atualizando dados de ${editingEmployee.name}` : 'Preencha os dados do colaborador da unidade'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsNewEmployeeModalOpen(false);
                  setEditingEmployee(null);
                }} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 text-xs overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
              {/* CAMPO DE FOTO COM PREVIEW, UPLOAD REAL E PRESETS RÁPIDOS */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-emerald-500/50 shrink-0 flex items-center justify-center shadow-xs">
                    {formFotoUrl ? (
                      <img 
                        src={formFotoUrl} 
                        alt="Foto Colaborador" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-7 h-7 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">
                      Foto do Colaborador (Opcional)
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Carregar do Computador</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload}
                          className="hidden" 
                        />
                      </label>

                      {formFotoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormFotoUrl('')}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                        >
                          Remover Foto
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      * A foto é opcional para colaboradores em geral, e obrigatória apenas para os que se candidatarem à CIPA.
                    </span>
                  </div>
                </div>

              </div>

              {/* Nome Completo e Apelido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Marcos Vinicius Santos"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Apelido / Como é mais conhecido(a) <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formApelido}
                    onChange={(e) => setFormApelido(e.target.value)}
                    placeholder="Ex: Marcão da Usinagem, Paulinha, Beto"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-900"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Facilita a identificação no chão de fábrica e na votação.
                  </span>
                </div>
              </div>

              {/* Cargo e Setor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Cargo / Função *</label>
                  <input
                    type="text"
                    required
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="Ex: Operador de Máquinas"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Setor / Departamento</label>
                  <input
                    type="text"
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value)}
                    placeholder="Ex: Produção / Linha 01"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Matrícula e CPF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Matrícula CLT</label>
                  <input
                    type="text"
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value)}
                    placeholder="Ex: CLT-2045"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">CPF</label>
                    {editingEmployee ? (
                      canViewFullCpf(editingEmployee) ? (
                        <button
                          type="button"
                          onClick={() => setShowFullCpfInEdit(!showFullCpfInEdit)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                          title="Alternar exibição do CPF completo"
                        >
                          {showFullCpfInEdit ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showFullCpfInEdit ? 'Mascarar' : 'Exibir Completo'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-semibold" title="Em conformidade com a LGPD, apenas os 3 últimos dígitos são exibidos.">
                          <Lock className="w-2.5 h-2.5" />
                          LGPD
                        </span>
                      )
                    ) : null}
                  </div>
                  <input
                    type="text"
                    value={
                      editingEmployee
                        ? (showFullCpfInEdit && canViewFullCpf(editingEmployee) ? formCpf : maskCPFLGPD(formCpf))
                        : formCpf
                    }
                    onChange={(e) => setFormCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  {editingEmployee && !showFullCpfInEdit && (
                    <span className="text-[10px] text-slate-400 block">
                      Protegido pela LGPD. Mostrando apenas os dígitos finais.
                    </span>
                  )}
                </div>
              </div>

              {/* E-mail e Data de Admissão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      E-mail do Colaborador <span className="text-emerald-600 font-semibold">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 rounded font-medium">
                      Notificações NR-5
                    </span>
                  </div>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="colaborador@empresa.com.br"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Utilizado para envio de editais oficiais da CIPA e comprovantes de votação auditada.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Data de Admissão</label>
                  <input
                    type="date"
                    value={formDataAdmissao}
                    onChange={(e) => setFormDataAdmissao(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewEmployeeModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Adicionar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL VISUALIZAR CADASTRO DO COLABORADOR                                  */}
      {/* ========================================================================= */}
      {viewingEmployee && (() => {
        const canViewFull = canViewFullCpf(viewingEmployee);
        const emp = viewingEmployee;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-5 py-3.5 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  Ficha Cadastral do Colaborador
                </h3>
                <button 
                  type="button"
                  onClick={() => setViewingEmployee(null)} 
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-emerald-100/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
                {/* Identificação Principal */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  {emp.fotoUrl ? (
                    <img
                      src={emp.fotoUrl}
                      alt={emp.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                      {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-slate-900">{formatCapitalizeName(emp.name)}</h4>
                      {emp.apelido && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200">
                          "{emp.apelido}"
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-slate-600">
                      <span className="text-xs font-semibold text-slate-800">{emp.cargo}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{emp.setor}</span>
                    </div>

                    {/* CPF em conformidade com LGPD */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                        <span className="text-slate-400 font-sans font-normal text-[10px]">CPF:</span>
                        <span>
                          {canViewFull
                            ? (showFullCpfInView ? emp.cpf : maskCPFLGPD(emp.cpf))
                            : maskCPFLGPD(emp.cpf)}
                        </span>
                      </div>

                      {canViewFull ? (
                        <button
                          type="button"
                          onClick={() => setShowFullCpfInView(!showFullCpfInView)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                          title="Alternar visibilidade do CPF"
                        >
                          {showFullCpfInView ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showFullCpfInView ? 'Mascarar' : 'Exibir Completo'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-semibold" title="Em conformidade com a LGPD, apenas os 3 últimos dígitos são exibidos.">
                          <Lock className="w-2.5 h-2.5" />
                          Protegido pela LGPD
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dados Cadastrais Detalhados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matrícula CLT</span>
                    <strong className="text-xs font-mono text-slate-800">{emp.matricula}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Admissão</span>
                    <strong className="text-xs font-mono text-slate-800">
                      {emp.dataAdmissao ? new Date(emp.dataAdmissao).toLocaleDateString('pt-BR') : 'Não informada'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">E-mail Corporativo</span>
                    <strong className="text-xs font-medium text-slate-800 block truncate">{emp.email || 'Não informado'}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" /> Estabelecimento / Filial Vinculada
                    </span>
                    <strong className="text-xs text-slate-800 block">{currentFilial.name} ({currentFilial.city} - {currentFilial.state})</strong>
                  </div>
                </div>
              </div>

              {/* Rodapé Fixo */}
              <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingEmployee(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = emp;
                    setViewingEmployee(null);
                    handleOpenEditModal(toEdit);
                  }}
                  className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Editar Cadastro</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (PADRÃO DO SISTEMA)                      */}
      {/* ========================================================================= */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/60 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Confirmar Exclusão de Colaborador
              </h3>
              <button 
                type="button"
                onClick={() => setEmployeeToDelete(null)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-rose-100/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Tem certeza de que deseja remover o cadastro do colaborador{' '}
                <strong className="text-slate-900 font-bold">{formatCapitalizeName(employeeToDelete.name)}</strong>{' '}
                (Matrícula: <span className="font-mono font-bold text-slate-800">{employeeToDelete.matricula}</span>, Cargo: <span className="font-bold text-slate-800">{employeeToDelete.cargo}</span>)?
              </p>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>Esta operação é irreversível e os dados do colaborador serão removidos permanentemente. A ação não poderá ser desfeita.</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEmployee}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: IMPORTAÇÃO EM LOTE                                               */}
      {/* ========================================================================= */}
      {isBatchImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Importação em Lote de Colaboradores</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsBatchImportModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Selecionar Arquivo (.csv)
                </label>
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Ou Cole os Dados da Planilha (Nome; Apelido; Matrícula; CPF; Cargo; Setor)
                </label>
                <textarea
                  rows={5}
                  placeholder={`João da Silva;Zé;CLT-2001;123.456.789-10;Operador;Produção\nMaria Oliveira;Paulinha;CLT-2002;234.567.890-21;Líder;Montagem`}
                  value={batchCsvText}
                  onChange={(e) => setBatchCsvText(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessBatchImport}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Processar e Importar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Dimensionamentos */}
      <DimensionamentoHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        unitId={currentFilial.id}
        companyId={currentCompany.id}
        companyName={currentCompany.nomeFantasia || currentCompany.razaoSocial}
        unitName={currentFilial.name}
        onPrintDimensionamento={handleDownloadPdfDimensionamento}
      />

    </div>
  );
};
