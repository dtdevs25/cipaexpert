import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CNAE_DATABASE, 
  calcularDimensionamentoNR5, 
  calcularCronogramaEleitoral 
} from '../../data/cnaeData';
import { CnaeEntry, DimensionamentoResult, CronogramaItem, Candidato } from '../../types/cipa';
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
  Minus, 
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
  Mail,
  QrCode,
  ExternalLink,
  UserPlus,
  FileCheck,
  ClipboardCheck,
  Sparkles
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

interface ProcessConfig {
  cipaMode: 'ja_existe' | 'primeira_cipa';
  dataUltimaPosse: string;
  dataPrevisaoPosse: string;
  completedSteps: Record<string, boolean>;
}

const getDefaultProcessConfig = (companyId?: string, unitId?: string): ProcessConfig => {
  if (companyId === 'comp-telefonica') {
    return {
      cipaMode: 'ja_existe',
      dataUltimaPosse: '2025-12-21',
      dataPrevisaoPosse: '2026-12-21',
      completedSteps: {
        'etapa-1': true,
        'etapa-2': true,
        'etapa-3': true,
        'etapa-4': true,
        'etapa-5': true,
        'etapa-6': true,
        'etapa-7': true,
        'etapa-8': true
      }
    };
  }
  if (companyId === 'emp-1') {
    if (unitId?.includes('betim')) {
      return {
        cipaMode: 'ja_existe',
        dataUltimaPosse: '2025-08-10',
        dataPrevisaoPosse: '2026-08-10',
        completedSteps: { 'etapa-1': true }
      };
    }
    if (unitId?.includes('cajamar')) {
      return {
        cipaMode: 'ja_existe',
        dataUltimaPosse: '2025-11-25',
        dataPrevisaoPosse: '2026-11-25',
        completedSteps: { 'etapa-1': true }
      };
    }
    return {
      cipaMode: 'ja_existe',
      dataUltimaPosse: '2025-05-15',
      dataPrevisaoPosse: '2026-05-15',
      completedSteps: { 'etapa-1': true, 'etapa-2': true, 'etapa-3': true }
    };
  }
  if (companyId === 'emp-2') {
    return {
      cipaMode: 'ja_existe',
      dataUltimaPosse: '2025-08-30',
      dataPrevisaoPosse: '2026-08-30',
      completedSteps: { 'etapa-1': true, 'etapa-2': true }
    };
  }
  if (companyId === 'emp-3') {
    return {
      cipaMode: 'ja_existe',
      dataUltimaPosse: '2025-10-10',
      dataPrevisaoPosse: '2026-10-10',
      completedSteps: { 'etapa-1': true }
    };
  }
  return {
    cipaMode: 'ja_existe',
    dataUltimaPosse: '2025-10-15',
    dataPrevisaoPosse: '2026-10-15',
    completedSteps: { 'etapa-1': true }
  };
};

const STEP_CAPABILITIES: Record<string, {
  canEdit: boolean;
  canView: boolean;
  canDownload: boolean;
  canSign: boolean;
  canEmail: boolean;
  viewLabel: string;
}> = {
  'etapa-1': { canEdit: false, canView: true, canDownload: true, canSign: false, canEmail: false, viewLabel: 'Ver Laudo' },
  'etapa-2': { canEdit: true, canView: true, canDownload: true, canSign: true, canEmail: true, viewLabel: 'Ver Edital' },
  'etapa-3': { canEdit: true, canView: true, canDownload: true, canSign: true, canEmail: true, viewLabel: 'Ver Carta' },
  'etapa-4': { canEdit: true, canView: true, canDownload: true, canSign: true, canEmail: false, viewLabel: 'Ver Ata da CE' },
  'etapa-5': { canEdit: true, canView: true, canDownload: true, canSign: true, canEmail: true, viewLabel: 'Ver Edital' },
  'etapa-6': { canEdit: false, canView: true, canDownload: false, canSign: false, canEmail: false, viewLabel: 'Ver Candidatos' },
  'etapa-7': { canEdit: false, canView: true, canDownload: true, canSign: false, canEmail: true, viewLabel: 'Ver Relatório' },
  'etapa-8': { canEdit: false, canView: true, canDownload: true, canSign: false, canEmail: true, viewLabel: 'Ver Cédula/Lista' },
  'etapa-9': { canEdit: false, canView: true, canDownload: true, canSign: true, canEmail: false, viewLabel: 'Ver Ata Eleição' },
  'etapa-10': { canEdit: false, canView: true, canDownload: true, canSign: true, canEmail: false, viewLabel: 'Ver Ata Apuração' },
  'etapa-11': { canEdit: false, canView: true, canDownload: true, canSign: false, canEmail: false, viewLabel: 'Ver Treinamento' },
  'etapa-12': { canEdit: true, canView: true, canDownload: true, canSign: true, canEmail: true, viewLabel: 'Ver Ata de Posse' },
  'etapa-13': { canEdit: true, canView: true, canDownload: true, canSign: false, canEmail: true, viewLabel: 'Ver Calendário' }
};

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

  // Histórico da CIPA e Processo Eleitoral com Escopo por Empresa e Filial
  const processScopeKey = useMemo(() => {
    return `${currentCompany?.id || 'emp'}_${currentFilial?.id || 'unit'}`;
  }, [currentCompany?.id, currentFilial?.id]);

  const initialProcessConfig = useMemo(() => {
    return getDefaultProcessConfig(currentCompany?.id, currentFilial?.id);
  }, [currentCompany?.id, currentFilial?.id]);

  const [cipaMode, setCipaMode] = useState<'ja_existe' | 'primeira_cipa'>(initialProcessConfig.cipaMode);
  const [dataUltimaPosse, setDataUltimaPosse] = useState<string>(initialProcessConfig.dataUltimaPosse);
  const [dataPrevisaoPosse, setDataPrevisaoPosse] = useState<string>(initialProcessConfig.dataPrevisaoPosse);

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
      eleicaoProrrogada: formatDate(-27),
      apuracao: formatDate(-30),
      treinamento: `${formatDate(-15)} a ${formatDate(-5)}`,
      treinamentoPresencial: formatDate(-7),
      posse: dFim.toLocaleDateString('pt-BR'),
      envioSindicato: formatDate(10)
    };
  }, [mandateEndDate]);

  // Integração com Contexto e Histórico de Dimensionamento
  const { saveDimensionamento, dimensionamentos, candidatos, saveCandidato } = useCipa();

  // Inscrições de Candidatos (Etapa 6 - NR-5): Módulo de Eleição Contratado vs Ficha Manual
  const [overrideEleicaoModulo, setOverrideEleicaoModulo] = useState<boolean | null>(null);
  const hasModuloEleicao = overrideEleicaoModulo !== null 
    ? overrideEleicaoModulo 
    : Boolean(currentCompany?.modulosContratados?.eleicao);

  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isManualCandidateModalOpen, setIsManualCandidateModalOpen] = useState(false);
  const [isOnlineQuickModalOpen, setIsOnlineQuickModalOpen] = useState(false);
  const [activeEmailCandidate, setActiveEmailCandidate] = useState<Candidato | null>(null);

  // Estado para Apuração da Urna Física (Etapa 9 - quando não contratou módulo de eleição online)
  const [isManualApuracaoModalOpen, setIsManualApuracaoModalOpen] = useState(false);
  const [manualApuracaoData, setManualApuracaoData] = useState<{
    localUrna: string;
    lacreUrna: string;
    horarioAbertura: string;
    horarioEncerramento: string;
    presidenteMesa: string;
    secretarioMesa: string;
    fiscaisPresentes: string;
    votosBrancos: number;
    votosNulos: number;
    votosPorCandidato: Record<string, number>;
  }>({
    localUrna: 'Refeitório / Sala de Treinamento - Unidade SP Jundiaí Vila',
    lacreUrna: 'LACRE-URNA-74829',
    horarioAbertura: '08:00',
    horarioEncerramento: '17:00',
    presidenteMesa: 'Luiz Alberto De Barros Junior',
    secretarioMesa: 'Marciel Pereira Silva',
    fiscaisPresentes: 'Representantes dos empregados e da empresa',
    votosBrancos: 2,
    votosNulos: 1,
    votosPorCandidato: {}
  });

  // Inicializa mapa de votos com valores dos candidatos cadastrados ou padrões
  useEffect(() => {
    if (candidatos && candidatos.length > 0) {
      setManualApuracaoData(prev => {
        if (Object.keys(prev.votosPorCandidato).length > 0) return prev;
        const defaultVotes = [24, 18, 12, 9, 6, 3, 2];
        const newMap: Record<string, number> = {};
        const aprovados = candidatos.filter(c => c.status === 'confirmado');
        aprovados.forEach((c, idx) => {
          newMap[c.id] = c.votos !== undefined && c.votos > 0 ? c.votos : (defaultVotes[idx] ?? 0);
        });
        return {
          ...prev,
          votosPorCandidato: newMap
        };
      });
    }
  }, [candidatos]);

  // Form State para Inscrição Manual ou Rápida
  const [candSelectedEmployeeId, setCandSelectedEmployeeId] = useState('');
  const [candNome, setCandNome] = useState('');
  const [candMatricula, setCandMatricula] = useState('');
  const [candCargo, setCandCargo] = useState('');
  const [candSetor, setCandSetor] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPropostas, setCandPropostas] = useState('');
  const [candTempoEmpresa, setCandTempoEmpresa] = useState('2 anos');

  const handleSelectEmployeeForCandidate = (empId: string) => {
    setCandSelectedEmployeeId(empId);
    if (!empId) {
      setCandNome('');
      setCandMatricula('');
      setCandCargo('');
      setCandSetor('');
      setCandEmail('');
      return;
    }
    const currentEmployees = employeesByUnit[currentFilial?.id] || [];
    const emp = currentEmployees.find(e => e.id === empId);
    if (emp) {
      setCandNome(emp.name);
      setCandMatricula(emp.matricula);
      setCandCargo(emp.cargo);
      setCandSetor(emp.setor);
      setCandEmail(emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`);
    }
  };

  const handleCreateManualCandidate = async () => {
    if (!candNome.trim()) {
      showToast('Por favor, informe o nome do candidato.');
      return;
    }
    const emailCandidate = candEmail.trim() || `${candNome.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`;
    const newCandId = `cand-${Date.now()}`;
    const nextNumber = String(10 + (candidatos.length * 2));

    const finalCompName = currentCompany?.razaoSocial || propCompanyName || 'Telefônica Brasil S.A';
    const finalCnpj = currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '02.558.157/0577-84';

    const fichaDoc = generateCipaDocument(
      'ficha_inscricao_manual',
      finalCompName,
      finalCnpj,
      mandateEndDate,
      dimensionamento?.totalMembros || 0,
      {
        candidatoNome: candNome.trim(),
        candidatoCargo: candCargo.trim() || 'Operador',
        candidatoMatricula: candMatricula.trim() || `CLT-${Math.floor(1000 + Math.random() * 9000)}`,
        candidatoSetor: candSetor.trim() || 'Operacional Geral',
        candidatoEmail: emailCandidate,
        candidatoPropostas: candPropostas.trim() || 'Compromisso com prevenção de riscos e diálogo transparente com a equipe.',
        unitName: currentFilial?.name,
        unitState: currentFilial?.state,
        unitCity: currentFilial?.city,
        gestaoAno: '2026/2027',
        comissaoPresidente: 'Luiz Alberto De Barros Junior'
      }
    );

    const envelopeId = `env-ficha-${Date.now()}`;
    const signersList = [
      {
        id: `sig-${newCandId}-1`,
        name: candNome.trim(),
        email: emailCandidate,
        role: 'Candidato(a) Requerente',
        order: 1,
        status: 'pendente' as const
      },
      {
        id: `sig-${newCandId}-2`,
        name: 'Luiz Alberto De Barros Junior',
        email: 'luiza.junior@telefonica.com',
        role: 'Presidente da Comissão Eleitoral',
        order: 2,
        status: 'pendente' as const
      }
    ];

    try {
      await SignatureService.createEnvelope({
        title: `Ficha de Inscrição Manual - ${candNome.trim()}`,
        category: 'Inscrição e Homologação',
        normativeCode: 'NR-5 · Subitem 5.5.2.2 e 5.5.2.3',
        sourceType: 'sistema',
        docType: 'ficha_inscricao_manual',
        content: fichaDoc.content,
        companyId: currentCompany?.id,
        unitId: currentFilial?.id,
        unitName: currentFilial?.name,
        companyName: finalCompName,
        cnpj: finalCnpj,
        signers: signersList,
        sendSequence: 'todos_juntos',
        creatorName: currentUser?.name || 'Administrador',
        creatorEmail: currentUser?.email || 'admin@empresa.com.br'
      });
      refreshEnvelopes();
    } catch (err) {
      console.warn('Erro ao criar envelope na plataforma de assinaturas:', err);
    }

    const newCandidate: Candidato = {
      id: newCandId,
      nome: candNome.trim(),
      cargo: candCargo.trim() || 'Operador',
      setor: candSetor.trim() || 'Operacional',
      matricula: candMatricula.trim() || `CLT-${Math.floor(1000 + Math.random() * 9000)}`,
      email: emailCandidate,
      tempoEmpresa: candTempoEmpresa || '2 anos',
      numero: nextNumber,
      propostas: candPropostas.trim() || 'Atuação preventiva e participação ativa nas reuniões da CIPA.',
      votos: 0,
      status: 'pendente_confirmacao',
      termoAceito: false,
      metodoInscricao: 'manual',
      envelopeId
    };

    saveCandidato(newCandidate);
    setIsManualCandidateModalOpen(false);
    setActiveEmailCandidate(newCandidate);
    showToast(`Ficha manual enviada para aprovação no módulo de assinaturas. E-mail de confirmação enviado para ${emailCandidate}!`);

    setCandSelectedEmployeeId('');
    setCandNome('');
    setCandMatricula('');
    setCandCargo('');
    setCandSetor('');
    setCandEmail('');
    setCandPropostas('');
  };

  const handleCreateOnlineCandidate = () => {
    if (!candNome.trim()) {
      showToast('Por favor, informe o nome do candidato.');
      return;
    }
    const emailCandidate = candEmail.trim() || `${candNome.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`;
    const newCandId = `cand-${Date.now()}`;
    const nextNumber = String(10 + (candidatos.length * 2));

    const newCandidate: Candidato = {
      id: newCandId,
      nome: candNome.trim(),
      cargo: candCargo.trim() || 'Operador',
      setor: candSetor.trim() || 'Operacional',
      matricula: candMatricula.trim() || `CLT-${Math.floor(1000 + Math.random() * 9000)}`,
      email: emailCandidate,
      tempoEmpresa: candTempoEmpresa || '2 anos',
      numero: nextNumber,
      propostas: candPropostas.trim() || 'Foco em saúde do trabalhador, eliminação de riscos e ergonomia.',
      votos: 0,
      status: 'pendente_confirmacao',
      termoAceito: false,
      metodoInscricao: 'online'
    };

    saveCandidato(newCandidate);
    setIsOnlineQuickModalOpen(false);
    setActiveEmailCandidate(newCandidate);
    showToast(`Inscrição online submetida! E-mail com regras e termo de aceite enviado para ${emailCandidate}!`);

    setCandSelectedEmployeeId('');
    setCandNome('');
    setCandMatricula('');
    setCandCargo('');
    setCandSetor('');
    setCandEmail('');
    setCandPropostas('');
  };

  const handleConfirmCandidateEmail = (cand: Candidato) => {
    const updated: Candidato = {
      ...cand,
      status: 'confirmado',
      termoAceito: true,
      confirmadoEm: new Date().toLocaleString('pt-BR')
    };
    saveCandidato(updated);
    if (activeEmailCandidate?.id === cand.id) {
      setActiveEmailCandidate(updated);
    }
    showToast(`Candidatura de "${cand.nome}" confirmada e homologada com sucesso!`);
  };

  // Helper centralizado para geração fiel dos documentos da NR-5 e Relatórios Oficiais
  const getExtraDataForStep = (etapa?: any) => {
    const aprovados = candidatos
      .filter(c => c.status === 'confirmado')
      .map(c => ({
        id: c.matricula || c.id.replace('cand-', ''),
        matricula: c.matricula || c.id.replace('cand-', ''),
        nome: c.nome,
        email: c.email || `${c.nome.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`,
        cargo: c.cargo,
        dataAdmissao: c.dataAdmissao || '02/06/2026',
        apelido: c.apelido || c.nome.split(' ').slice(0, 2).join(' ')
      }));

    const reprovados = candidatos
      .filter(c => c.status === 'rejeitado')
      .map(c => ({
        id: c.id.replace('cand-', ''),
        nome: c.nome,
        email: c.email || `${c.nome.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`,
        cargo: c.cargo,
        dataAdmissao: c.dataAdmissao || '12/09/2024',
        motivo: c.motivoReprovacao || 'Colaboradora informou que passou em processo seletivo para outro cargo e irá trocar de base.'
      }));

    // Cálculos de Apuração da Eleição (Online vs Urna Física)
    const totalAptos = effectiveHeadcount || headcount || dimensionamento?.headcount || 88;
    const vagasTitulares = dimensionamento?.efetivosEmpregados || 2;
    const vagasSuplentes = dimensionamento?.suplentesEmpregados || 2;

    const candidatosConfirmados = candidatos.filter(c => c.status === 'confirmado');
    let totVotosNominais = 0;
    let apuracaoResultados = candidatosConfirmados.map(c => {
      const v = hasModuloEleicao
        ? (c.votos || 0)
        : (manualApuracaoData.votosPorCandidato[c.id] ?? c.votos ?? 0);
      totVotosNominais += v;
      return {
        id: c.id,
        matricula: c.matricula || c.id.replace('cand-', ''),
        nome: c.nome,
        cargo: c.cargo,
        email: c.email || `${c.nome.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`,
        votos: v,
        dataAdmissao: c.dataAdmissao || '02/06/2026'
      };
    });

    // Ordenação decrescente de votos com desempate por tempo de serviço (admissão mais antiga conforme NR-5)
    apuracaoResultados.sort((a, b) => {
      if (b.votos !== a.votos) return b.votos - a.votos;
      const dateA = a.dataAdmissao ? new Date(a.dataAdmissao.split('/').reverse().join('-')).getTime() : 0;
      const dateB = b.dataAdmissao ? new Date(b.dataAdmissao.split('/').reverse().join('-')).getTime() : 0;
      return dateA - dateB;
    });

    apuracaoResultados = apuracaoResultados.map((item, idx) => {
      let situacao = 'Não Eleito';
      if (idx < vagasTitulares) {
        situacao = `${idx + 1}º Titular Eleito`;
      } else if (idx < vagasTitulares + vagasSuplentes) {
        situacao = `${idx - vagasTitulares + 1}º Suplente Eleito`;
      }
      const pct = totVotosNominais > 0 ? (item.votos / totVotosNominais) * 100 : 0;
      return {
        ...item,
        classificacao: idx + 1,
        situacao,
        percentual: pct
      };
    });

    const vBrancos = hasModuloEleicao ? 3 : manualApuracaoData.votosBrancos;
    const vNulos = hasModuloEleicao ? 1 : manualApuracaoData.votosNulos;
    const totVotantes = totVotosNominais + vBrancos + vNulos;
    const qMin = Math.floor(totalAptos / 2) + 1;
    const qAtingido = totVotantes >= qMin;
    const pctQuorum = totalAptos > 0 ? Math.round((totVotantes / totalAptos) * 100) : 0;

    const apuracaoFinal = {
      isOnline: hasModuloEleicao,
      totalEleitoresAptos: totalAptos,
      totalVotantes: totVotantes,
      votosBrancos: vBrancos,
      votosNulos: vNulos,
      votosValidos: totVotosNominais,
      quorumMinimo: qMin,
      quorumAtingido: qAtingido,
      percentualQuorum: pctQuorum,
      lacreUrna: manualApuracaoData.lacreUrna,
      localUrna: manualApuracaoData.localUrna,
      horarioAbertura: manualApuracaoData.horarioAbertura,
      horarioEncerramento: manualApuracaoData.horarioEncerramento,
      presidenteMesa: manualApuracaoData.presidenteMesa,
      secretarioMesa: manualApuracaoData.secretarioMesa,
      fiscaisPresentes: manualApuracaoData.fiscaisPresentes,
      candidatosResultados: apuracaoResultados
    };

    return {
      logoUrl: (currentFilial as any)?.logoUrl || currentCompany?.logoUrl,
      sindicatoSigla,
      sindicatoNome,
      sindicatoEmail,
      cronogramaDatas: datasPrincipais,
      unitName: currentFilial?.name || (currentCompany?.units?.[0]?.name) || 'Unidade Principal',
      unitState: currentFilial?.state || 'SP',
      unitCity: currentFilial?.city || 'São Paulo',
      unitAddress: (currentFilial as any)?.address || currentCompany?.enderecoCompleto || 'Endereço da Unidade',
      unitCep: (currentFilial as any)?.cep || '00000-000',
      unitCnpj: currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '00.000.000/0001-00',
      gestaoAno: '2026/2027',
      geradoPor: (currentCompany as any)?.responsavelAdmin || currentUser?.name || 'Comissão Eleitoral',
      aprovadoPor: (currentCompany as any)?.responsavelAdmin || currentUser?.name || 'Diretoria / SESMT',
      votantesHabilitados: effectiveHeadcount || headcount || dimensionamento?.headcount || (currentFilial?.headcount || 88),
      quorumMinimo: Math.ceil((effectiveHeadcount || headcount || dimensionamento?.headcount || (currentFilial?.headcount || 88)) / 2),
      candidatosAprovados: aprovados.length > 0 ? aprovados : undefined,
      candidatosReprovados: reprovados.length > 0 ? reprovados : undefined,
      apuracao: apuracaoFinal
    };
  };

  const handleSaveManualApuracao = (andOpenDoc = false) => {
    candidatos.forEach(c => {
      const v = manualApuracaoData.votosPorCandidato[c.id];
      if (v !== undefined) {
        saveCandidato({
          ...c,
          votos: v
        });
      }
    });

    showToast('Votos da urna física e apuração manual salvos com sucesso!');
    
    if (andOpenDoc) {
      setIsManualApuracaoModalOpen(false);
      const etapa9 = etapasNormativas.find(e => e.id === 'etapa-9');
      if (etapa9) {
        handleViewStep(etapa9);
      }
    }
  };
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSavingDimensionamento, setIsSavingDimensionamento] = useState(false);
  const [dbDimensionamentosCount, setDbDimensionamentosCount] = useState<number>(0);

  // Validação de conclusão do dimensionamento para liberação do calendário
  const isDimensionamentoCompleted = useMemo(() => {
    return dbDimensionamentosCount > 0 || (effectiveHeadcount > 0 && !!dimensionamento);
  }, [dbDimensionamentosCount, effectiveHeadcount, dimensionamento]);

  // Etapas concluídas com escopo por empresa/filial
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(`cipa_process_${processScopeKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.completedSteps) return parsed.completedSteps;
      }
    } catch {}
    return initialProcessConfig.completedSteps;
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
      const raw = localStorage.getItem(`cipa_process_${processScopeKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.stepCustomizations) return parsed.stepCustomizations;
      }
    } catch {}
    return {};
  });

  // Carregamento reativo e persistência do processo eleitoral para a empresa/filial ativa
  const activeScopeRef = useRef<string>(processScopeKey);

  useEffect(() => {
    activeScopeRef.current = processScopeKey;
    try {
      const raw = localStorage.getItem(`cipa_process_${processScopeKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.dataUltimaPosse) setDataUltimaPosse(parsed.dataUltimaPosse);
        if (parsed.dataPrevisaoPosse) setDataPrevisaoPosse(parsed.dataPrevisaoPosse);
        if (parsed.cipaMode) setCipaMode(parsed.cipaMode);
        if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps);
        if (parsed.stepCustomizations) setStepCustomizations(parsed.stepCustomizations);
        if (parsed.manualApuracaoData) setManualApuracaoData(parsed.manualApuracaoData);
        return;
      }
    } catch (e) {
      console.warn('Erro ao carregar processo da empresa:', e);
    }

    const def = getDefaultProcessConfig(currentCompany?.id, currentFilial?.id);
    setDataUltimaPosse(def.dataUltimaPosse);
    setDataPrevisaoPosse(def.dataPrevisaoPosse);
    setCipaMode(def.cipaMode);
    setCompletedSteps(def.completedSteps);
    setStepCustomizations({});
  }, [processScopeKey]);

  useEffect(() => {
    if (activeScopeRef.current !== processScopeKey) return;
    try {
      const payload = {
        dataUltimaPosse,
        dataPrevisaoPosse,
        cipaMode,
        completedSteps,
        stepCustomizations,
        manualApuracaoData
      };
      localStorage.setItem(`cipa_process_${processScopeKey}`, JSON.stringify(payload));
    } catch {}
  }, [processScopeKey, dataUltimaPosse, dataPrevisaoPosse, cipaMode, completedSteps, stepCustomizations, manualApuracaoData]);

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
  const [sindicatoSigla, setSindicatoSigla] = useState('SINTTEL');
  const [sindicatoNome, setSindicatoNome] = useState('Sindicato dos Trabalhadores em Empresas de Telecomunicações do Estado de São Paulo');
  const [sindicatoEmail, setSindicatoEmail] = useState('contato@sinttel.org.br');

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
      currentCompany?.razaoSocial || propCompanyName || 'Telefônica Brasil S.A',
      currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '02.558.157/0773-86',
      mandateEndDate,
      dimensionamento?.totalMembros || 0,
      {
        sindicatoSigla,
        sindicatoNome,
        sindicatoEmail,
        unitName: currentFilial?.name,
        unitState: currentFilial?.state,
        unitCity: currentFilial?.city,
        unitAddress: (currentFilial as any)?.address,
        unitCep: (currentFilial as any)?.cep,
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
      subtitulo: 'Ata paritária de definição de membros e regras do processo eleitoral',
      prazoLabel: 'Pelo menos 55 dias antes da posse',
      dataCalculada: datasPrincipais.comissaoEleitoral,
      referenciaNormativa: 'NR-5, subitem 5.5.2',
      baseLegalDetalhada: 'Item 5.5.2 da NR-05: "A Comissão Eleitoral (CE) deve ser constituída no prazo mínimo de 55 (cinquenta e cinco) dias antes do término do mandato em curso."',
      porQueExiste: 'A CE é órgão soberano e neutro constituído pelo Presidente e Vice-Presidente da CIPA vigente (ou indicação bilateral na primeira CIPA). Sua função é receber inscrições, emitir comprovantes, fiscalizar votos e apurar o resultado com imparcialidade.',
      impactoAuditoria: 'A realização de atos eleitorais sem constituição formal da CE configura ingerência indevida do empregador e anulação de votos.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'comissao_eleitoral',
      botaoTexto: 'Ver Ata da CE',
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
      subtitulo: hasModuloEleicao
        ? 'Inscrição online com link/QR Code exclusivo sincronizado à Urna Digital'
        : 'Inscrição via Ficha Manual com envio para aprovação no Módulo de Assinaturas',
      prazoLabel: 'Prazo mínimo de 15 dias corridos',
      dataCalculada: `${datasPrincipais.inscricaoInicio} a ${datasPrincipais.inscricaoFim}`,
      referenciaNormativa: 'NR-5, subitem 5.5.2.2',
      baseLegalDetalhada: 'Item 5.5.2.2 da NR-05: "Inscrição de candidatos no prazo mínimo de 15 (quinze) dias corridos."',
      porQueExiste: 'Assegura tempo hábil para que empregados em turnos, escalas de revezamento ou afastamentos transitórios possam tomar conhecimento e exercer livremente o direito à candidatura.',
      impactoAuditoria: 'A fixação de prazo de inscrição inferior a 15 dias corridos invalida irremediavelmente todo o pleito.',
      acaoTipo: 'candidatos_inscricao' as const,
      docTipo: hasModuloEleicao ? 'edital_inscricao' : 'ficha_inscricao_manual',
      botaoTexto: hasModuloEleicao ? 'Inscrições Online' : 'Ficha Manual de Inscrição',
      botaoIcone: hasModuloEleicao ? ('vote' as const) : ('fileSignature' as const)
    },
    {
      id: 'etapa-7',
      numero: 7,
      titulo: 'Homologação e Publicação da Relação dos Inscritos',
      subtitulo: 'Relatório Oficial de Aprovação de Inscrições e Habilitação para Votação',
      prazoLabel: 'Logo após o encerramento das inscrições',
      dataCalculada: datasPrincipais.listaCandidatos,
      referenciaNormativa: 'NR-5, subitem 5.5.2.4 e 5.5.3.2',
      baseLegalDetalhada: 'Item 5.5.2.4 da NR-05: "Publicação e divulgação da relação dos candidatos inscritos, em locais de fácil acesso e visualização."',
      porQueExiste: 'Homologa perante a comissão e colaboradores a relação de inscrições deferidas e indeferidas com os motivos formais, discriminando quórum, parâmetros e candidatos habilitados à cédula eletrônica.',
      impactoAuditoria: 'A ausência de publicação do relatório de homologação antes do pleito viola o princípio da publicidade e a isonomia da votação.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'relatorio_aprovacao_inscricoes',
      botaoTexto: 'Ver Relatório',
      botaoIcone: 'users' as const
    },
    {
      id: 'etapa-8',
      numero: 8,
      titulo: 'Eleição dos Representantes dos Empregados (Votação On-line)',
      subtitulo: 'Edital oficial e convocação com a relação dos candidatos para a votação online',
      prazoLabel: 'Pelo menos 30 dias antes da posse',
      dataCalculada: datasPrincipais.eleicao,
      referenciaNormativa: 'NR-5, subitem 5.5.3 e 5.5.3.1',
      baseLegalDetalhada: 'Item 5.5.3 da NR-05: "A eleição deve ser realizada no prazo mínimo de 30 (trinta) dias antes do término do mandato em curso."',
      porQueExiste: 'Garante que os colaboradores elejam seus pares sob sigilo absoluto em dia normal de trabalho. O prazo mínimo de 30 dias antes da posse é vital para realização do treinamento de até 20h dos eleitos.',
      impactoAuditoria: 'A violação do sigilo do voto ou realização do pleito fora do expediente enseja anulação e responsabilização civil da empresa.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'edital_votacao',
      botaoTexto: 'Ver Edital de Votação',
      botaoIcone: 'vote' as const
    },
    {
      id: 'etapa-9',
      numero: 9,
      titulo: hasModuloEleicao
        ? 'Apuração dos Votos e Ata de Eleição (Módulo de Eleição Online)'
        : 'Apuração dos Votos e Ata de Eleição (Urna Física / Coleta Manual)',
      subtitulo: hasModuloEleicao
        ? 'Apuração automatizada e auditável em tempo real no Módulo 2 de Eleição Online'
        : 'Lançamento manual dos votos coletados na urna física e apuração de quórum',
      prazoLabel: 'Imediatamente após o encerramento do pleito',
      dataCalculada: datasPrincipais.apuracao,
      referenciaNormativa: 'NR-5, subitem 5.5.3.3 e 5.5.3.4',
      baseLegalDetalhada: 'Itens 5.5.3.3 e 5.5.3.4 da NR-05: quórum superior a 50% dos colaboradores e apuração dos votos em dia normal de trabalho com lavratura da ata.',
      porQueExiste: 'Formaliza a vontade dos eleitores, discriminando votos válidos, brancos e nulos, e listando titulares e suplentes por ordem decrescente de votos. Se o quórum for inferior a 50%, obriga segundo dia com quórum de 1/3.',
      impactoAuditoria: 'A proclamação de resultado sem o atingimento do quórum legal mínimo gera nulidade sumária perante o Ministério do Trabalho.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'ata_eleicao',
      botaoTexto: hasModuloEleicao ? 'Apuração Online (Módulo 2)' : 'Digitar Votos da Urna Física',
      botaoIcone: hasModuloEleicao ? ('vote' as const) : ('fileSpreadsheet' as const)
    },
    {
      id: 'etapa-10',
      numero: 10,
      titulo: 'Treinamento Obrigatório dos Membros da CIPA (20h)',
      subtitulo: 'Capacitação teórica conforme Grau de Risco e Lei nº 14.457/2022',
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
      id: 'etapa-11',
      numero: 11,
      titulo: 'Treinamento Presencial da CIPA (4h)',
      subtitulo: 'Instrução prática in loco sobre rotas de fuga, primeiros socorros e inspeção de extintores',
      prazoLabel: 'Realizado na semana que antecede a posse',
      dataCalculada: datasPrincipais.treinamentoPresencial || '15/12/2026',
      referenciaNormativa: 'NR-5, item 5.7.4',
      baseLegalDetalhada: 'Item 5.7.4 da NR-05: Parte prática e presencial do treinamento de segurança.',
      porQueExiste: 'Permite vivência prática nas dependências da unidade.',
      impactoAuditoria: 'A omissão da capacitação prática invalida a posse.',
      acaoTipo: 'documento_edital' as const,
      docTipo: 'certificado_treinamento',
      botaoTexto: 'Ver Treinamento Presencial',
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
  }), [datasPrincipais, stepCustomizations, hasModuloEleicao]);

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
          sindicatoSigla,
          sindicatoNome,
          sindicatoEmail,
          cronogramaDatas: datasPrincipais,
          unitName: currentFilial?.name,
          unitState: currentFilial?.state,
          unitCity: currentFilial?.city,
          unitAddress: (currentFilial as any)?.address
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
    if (etapa.id === 'etapa-6') {
      setIsCandidateModalOpen(true);
      return;
    }

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
      getExtraDataForStep(etapa)
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
      getExtraDataForStep(etapa)
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
    if (etapa.id === 'etapa-6' && !hasModuloEleicao) {
      setIsManualCandidateModalOpen(true);
      return;
    }

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
        getExtraDataForStep(etapa)
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
  const BROADCAST_STEPS = ['etapa-2', 'etapa-5', 'etapa-7', 'etapa-8', 'etapa-9', 'etapa-10'];

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
    } else if (etapa.id === 'etapa-7') {
      defaultSubject = `[RELAÇÃO OFICIAL CIPA] Homologação e Relação dos Candidatos Inscritos - Gestão ${gestaoAno}`;
      defaultMsg = `Prezados colaboradores,\n\nEm cumprimento ao subitem 5.5.2.4 da NR-5, publicamos o Relatório Oficial de Aprovação de Inscrições com a relação nominal dos candidatos deferidos para a eleição da CIPA - Gestão ${gestaoAno}.\n\nOs candidatos homologados estão aptos para a disputa eleitoral auditada. Acesse o portal CIPA Expert para conferir a relação completa e os parâmetros da votação.`;
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
                      const caps = STEP_CAPABILITIES[etapa.id] || {
                        canEdit: false,
                        canView: true,
                        canDownload: true,
                        canSign: false,
                        canEmail: false,
                        viewLabel: 'Visualizar'
                      };

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
                              {etapa.id === 'etapa-6' ? (
                                <button
                                  type="button"
                                  onClick={() => setIsCandidateModalOpen(true)}
                                  className="text-left text-slate-900 font-bold hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                                  title="Clique para gerenciar candidaturas e fichas de inscrição"
                                >
                                  {etapa.numero}. {etapa.titulo}
                                </button>
                              ) : etapa.id === 'etapa-9' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (hasModuloEleicao) {
                                      if (onNavigateTab) {
                                        onNavigateTab('eleicao');
                                        showToast('Redirecionando para o Módulo de Eleição Online para apuração em tempo real.');
                                      } else {
                                        showToast('Módulo de Eleição Online ativo.');
                                      }
                                    } else {
                                      setIsManualApuracaoModalOpen(true);
                                    }
                                  }}
                                  className={`text-left font-bold hover:underline cursor-pointer transition-colors ${
                                    hasModuloEleicao ? 'text-purple-900 hover:text-purple-700' : 'text-amber-900 hover:text-amber-700'
                                  }`}
                                  title={
                                    hasModuloEleicao
                                      ? 'Apuração 100% no Módulo de Eleição Online (Clique para acessar)'
                                      : 'Lançar votos coletados na urna física e apurar eleição'
                                  }
                                >
                                  {etapa.numero}. {etapa.titulo}
                                </button>
                              ) : (
                                <strong className="text-slate-900 font-bold">
                                  {etapa.numero}. {etapa.titulo}
                                </strong>
                              )}
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
                              {/* 1. EDITAR (Apenas etapas com edição de texto permitida: 2, 3, 4, 5, 12, 13) */}
                              {caps.canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleEditStep(etapa)}
                                  className="group inline-flex items-center h-8 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 border border-amber-200 hover:border-amber-300 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                  title="Editar texto e prazos da etapa"
                                >
                                  <Pencil className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold transition-all duration-200 ease-out">
                                    Editar
                                  </span>
                                </button>
                              )}

                              {/* BOTÃO ESPECIAL PARA ETAPA 6: INSCRIÇÕES ONLINE OU FICHA MANUAL */}
                              {etapa.id === 'etapa-6' && (
                                <button
                                  type="button"
                                  onClick={() => setIsCandidateModalOpen(true)}
                                  className={`group inline-flex items-center h-8 rounded-xl active:scale-95 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0 ${
                                    hasModuloEleicao
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300'
                                  }`}
                                  title={hasModuloEleicao ? 'Inscrições Online: Link, QR Code e Candidatos' : 'Inscrições: Ficha Manual e Assinaturas'}
                                >
                                  {hasModuloEleicao ? (
                                    <Vote className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-700" />
                                  ) : (
                                    <FileSignature className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-indigo-700" />
                                  )}
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold transition-all duration-200 ease-out">
                                    {hasModuloEleicao ? 'Inscrições Online' : 'Fichas Manuais'}
                                  </span>
                                </button>
                              )}

                              {/* BOTÃO ESPECIAL PARA ETAPA 9: APURAÇÃO ONLINE VS URNA FÍSICA */}
                              {etapa.id === 'etapa-9' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (hasModuloEleicao) {
                                      if (onNavigateTab) {
                                        onNavigateTab('eleicao');
                                        showToast('Redirecionando para o Módulo de Eleição Online para apuração automatizada.');
                                      } else {
                                        showToast('Módulo de Eleição Online ativo.');
                                      }
                                    } else {
                                      setIsManualApuracaoModalOpen(true);
                                    }
                                  }}
                                  className={`group inline-flex items-center h-8 rounded-xl active:scale-95 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0 ${
                                    hasModuloEleicao
                                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                  title={
                                    hasModuloEleicao
                                      ? 'Módulo de Eleição Online Contratado: Apuração 100% automatizada e auditável'
                                      : 'Sem Módulo Online: Lançar dados e votos coletados da urna física'
                                  }
                                >
                                  {hasModuloEleicao ? (
                                    <Vote className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-purple-700" />
                                  ) : (
                                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-700" />
                                  )}
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold transition-all duration-200 ease-out">
                                    {hasModuloEleicao ? 'Eleição Online' : 'Lançar Urna Física'}
                                  </span>
                                </button>
                              )}

                              {/* 2. VISUALIZAR (Com rótulo contextual e específico de cada fase) */}
                              {caps.canView && (
                                <button
                                  type="button"
                                  onClick={() => handleViewStep(etapa)}
                                  className="group inline-flex items-center h-8 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 hover:border-blue-300 px-2.5 transition-all duration-200 ease-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                  title={`Visualizar documento oficial (${caps.viewLabel})`}
                                >
                                  <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 overflow-hidden whitespace-nowrap pl-0 group-hover:pl-1.5 text-[11px] font-bold transition-all duration-200 ease-out">
                                    {caps.viewLabel}
                                  </span>
                                </button>
                              )}

                              {/* 3. BAIXAR PDF (Apenas etapas com documentos oficiais - oculta na etapa 6 operacional) */}
                              {caps.canDownload && (
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
                              )}

                              {/* 4. ASSINAR / ASSINADO (Apenas etapas que exigem coleta formal de assinaturas) */}
                              {caps.canSign && (
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
                              {caps.canEmail && (
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Sigla</label>
                    <input
                      type="text"
                      value={sindicatoSigla}
                      onChange={(e) => setSindicatoSigla(e.target.value)}
                      placeholder="SINTTEL"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700">Nome Completo do Sindicato</label>
                    <input
                      type="text"
                      value={sindicatoNome}
                      onChange={(e) => setSindicatoNome(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">E-mail Oficial do Sindicato</label>
                  <input
                    type="email"
                    value={sindicatoEmail}
                    onChange={(e) => setSindicatoEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Carta Formatada conforme modelo oficial da NR-5 */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs font-sans text-xs text-slate-800 leading-relaxed">
                <div className="text-right text-slate-600 font-medium">
                  {currentFilial?.city || 'São Paulo'}, {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}.
                </div>

                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 text-sm">Ao {sindicatoSigla || 'SINTTEL'}</p>
                  <p className="font-semibold text-slate-700">{sindicatoNome || 'Sindicato dos Trabalhadores em Empresas de Telecomunicações do Estado de São Paulo.'}</p>
                </div>

                <div className="font-bold text-slate-900 pt-1">
                  Assunto: Comunicação de Renovação de CIPA
                </div>

                <p className="text-justify leading-relaxed indent-4">
                  Em conformidade com a NR-5, subitem 5.5.1.1, comunicamos o início do Processo Eleitoral para membros da CIPA (Gestão 2026/2027) da {currentFilial?.name || 'Unidade Marquês'} inscrita no CNPJ {currentFilial?.cnpj || currentCompany?.cnpj || '02.558.157/0773-86'} localizada na {(currentFilial as any)?.address || 'Avenida Marquês de São Vicente, 288, São Paulo - SP'}.
                </p>

                <p className="text-justify leading-relaxed indent-4">
                  A eleição será realizada no dia <strong>{datasPrincipais.eleicao}</strong>, de forma eletrônica.
                </p>

                <p className="text-justify leading-relaxed indent-4">
                  Este processo será acompanhado pelo signatário e quaisquer dúvidas poderão ser esclarecidas através dos contatos cesar.bueno@telefonica.com Telefone: (11) 91763-9084.
                </p>

                <div className="pt-2 space-y-2">
                  <strong className="block text-slate-900">Abaixo cronograma:</strong>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>EDITAL DE CONVOCAÇÃO</span><strong>{datasPrincipais.convocacao || '20/10/2026'}</strong></div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>Formação comissão eleitoral</span><strong>{datasPrincipais.comissaoEleitoral || '20/10/2026'}</strong></div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>Divulgação do edital de inscrição</span><strong>{datasPrincipais.editalInscricao || '19/10/2026'}</strong></div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>Período de inscrições</span><strong>{datasPrincipais.inscricaoInicio} a {datasPrincipais.inscricaoFim}</strong></div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>Publicação inscritos</span><strong>{datasPrincipais.listaCandidatos || '09/11/2026'}</strong></div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>Eleição</span><strong className="text-emerald-800">{datasPrincipais.eleicao || '16/11/2026'}</strong></div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>Apuração dos votos</span><strong>{datasPrincipais.apuracao || '23/11/2026'}</strong></div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>Treinamento membros 20h</span><strong>{datasPrincipais.treinamento || '26/11/2026 a 30/11/2026'}</strong></div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100"><span>Treinamento presencial</span><strong>08/12/2026</strong></div>
                    <div className="flex justify-between py-0.5"><span>Posse</span><strong>{datasPrincipais.posse || '21/12/2026'}</strong></div>
                  </div>
                </div>

                <div className="pt-6 text-center space-y-1">
                  <div className="w-full max-w-[260px] border-b-2 border-slate-900 mx-auto mb-1"></div>
                  <strong className="font-bold text-slate-900 text-xs block">{currentCompany?.razaoSocial || 'Telefônica Brasil S.A'}</strong>
                  <span className="text-[10px] text-slate-500 block">Representante Legal do Empregador</span>
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
                    currentCompany?.razaoSocial || propCompanyName || 'Telefônica Brasil S.A',
                    currentFilial?.cnpj || currentCompany?.cnpj || propCnpj || '02.558.157/0773-86',
                    mandateEndDate,
                    dimensionamento?.totalMembros || 0,
                    {
                      sindicatoSigla,
                      sindicatoNome,
                      sindicatoEmail,
                      unitName: currentFilial?.name,
                      unitState: currentFilial?.state,
                      unitCity: currentFilial?.city,
                      unitAddress: (currentFilial as any)?.address,
                      cronogramaDatas: datasPrincipais
                    }
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

              <div className="space-y-2.5 pt-2 text-slate-700 leading-relaxed text-xs">
                {activeEditalDoc.doc.content.map((p, idx) => {
                  // Link de Acesso / URL da Eleição
                  if (p.startsWith('http://') || p.startsWith('https://')) {
                    return (
                      <div key={idx} className="my-3 p-3 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Link Oficial de Inscrição / Votação</span>
                            <a href={p} target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-bold text-emerald-900 underline hover:text-emerald-700 truncate block">
                              {p}
                            </a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(p);
                            showToast('Link da eleição copiado para a área de transferência!');
                          }}
                          className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/60 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiar Link</span>
                        </button>
                      </div>
                    );
                  }

                  // Scan me / QR Code Box
                  if (p.toLowerCase().includes('scan me')) {
                    return (
                      <div key={idx} className="my-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-4 text-center">
                        <div className="p-2.5 bg-white border border-slate-300 rounded-xl shadow-xs">
                          <QrCode className="w-10 h-10 text-slate-900" />
                        </div>
                        <div className="text-left space-y-0.5">
                          <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider block">QR Code Exclusivo</span>
                          <strong className="text-xs font-bold text-slate-900 block">Scan me para Inscrição / Votação</strong>
                          <span className="text-[11px] text-slate-500 block">Aponte a câmera do celular para abrir o link oficial</span>
                        </div>
                      </div>
                    );
                  }

                  // Aviso de Segurança e Bloqueio Temporal
                  if (p.startsWith('🔒')) {
                    return (
                      <div key={idx} className="my-3 p-3 bg-amber-50/80 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-amber-950">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-[11px] font-medium leading-relaxed">
                          {p.replace('🔒 ', '')}
                        </div>
                      </div>
                    );
                  }

                  // Títulos e cabeçalhos de seção
                  if (p === 'Você sabia o que cabe ao Cipeiro?' || p === 'COMISSÃO ELEITORAL:' || p.startsWith('Edital de Inscrições') || p.startsWith('Unidade ')) {
                    return (
                      <h4 key={idx} className={`font-bold text-slate-900 ${p.startsWith('Edital') ? 'text-sm text-center uppercase tracking-tight pb-1' : p.startsWith('Unidade') ? 'text-xs text-center text-slate-600 pb-2' : 'pt-2 text-xs uppercase text-slate-800'}`}>
                        {p}
                      </h4>
                    );
                  }

                  // Bullet points
                  if (p.startsWith('•') || p.startsWith('*')) {
                    return (
                      <div key={idx} className="flex items-start gap-2 pl-3 text-slate-700">
                        <span className="text-emerald-600 font-bold leading-tight">•</span>
                        <span className="leading-relaxed">{p.replace(/^[•*]\s*/, '')}</span>
                      </div>
                    );
                  }

                  // Parágrafos normais
                  return (
                    <p key={idx} className="indent-4 text-justify leading-relaxed">{p}</p>
                  );
                })}
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

      {/* ========================================================================= */}
      {/* MODAL 5: GESTÃO DE INSCRIÇÕES DE CANDIDATOS (ETAPA 6 - NR-5)              */}
      {/* ========================================================================= */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 text-white rounded-xl shadow-xs ${hasModuloEleicao ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                  {hasModuloEleicao ? <Vote className="w-5 h-5" /> : <FileSignature className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Inscrições de Candidatos à CIPA · Gestão 2026/2027
                  </h3>
                  <p className="text-[11px] text-slate-600 font-mono">
                    NR-5 Subitem 5.5.2.2 · {currentFilial.name} ({currentFilial.city} - {currentFilial.state})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switcher para teste / simulação de contratação do módulo */}
                <button
                  type="button"
                  onClick={() => setOverrideEleicaoModulo(prev => (prev === null ? !Boolean(currentCompany?.modulosContratados?.eleicao) : !prev))}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer bg-white text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
                  title="Clique para alternar a simulação entre 'Módulo de Eleição Contratado (Online)' e 'Sem Módulo (Ficha Manual)'"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Modo: <strong>{hasModuloEleicao ? 'Online (Módulo Ativo)' : 'Ficha Manual (Assinaturas)'}</strong></span>
                </button>

                <button 
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo com rolagem */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs">
              
              {/* CENÁRIO 1: MÓDULO DE ELEIÇÃO CONTRATADO (ONLINE) */}
              {hasModuloEleicao ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Módulo de Eleição Online Ativo
                        </span>
                        <h4 className="text-xs font-bold text-emerald-950 mt-0.5">
                          Link Oficial & QR Code de Inscrição dos Colaboradores
                        </h4>
                        <p className="text-[11px] text-emerald-900/80 mt-0.5">
                          Os trabalhadores se inscrevem diretamente através do link ou QR Code exclusivo gerado no Edital de Inscrições.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsOnlineQuickModalOpen(true)}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Nova Inscrição Online</span>
                        </button>

                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCandidateModalOpen(false);
                              onNavigateTab('eleicao');
                            }}
                            className="px-3 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Vote className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Abrir Módulo de Eleição</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card de Link e QR Code */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="md:col-span-2 p-3 bg-white rounded-xl border border-emerald-200 flex flex-col justify-between space-y-2">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-mono text-emerald-900 font-bold break-all text-[11px]">
                            https://assembleia.grtsdigital.com.br/2lsCc1wU4b3qgsXcjGJKVy6dUbqX0l/preInscricao
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-emerald-100 text-[10px] text-slate-500">
                          <span>Token criptográfico individual da eleição</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('https://assembleia.grtsdigital.com.br/2lsCc1wU4b3qgsXcjGJKVy6dUbqX0l/preInscricao');
                              showToast('Link copiado para a área de transferência!');
                            }}
                            className="font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Copiar Link Completo
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-center gap-3 text-left">
                        <QrCode className="w-10 h-10 text-slate-900 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scan me</span>
                          <strong className="text-slate-900 text-xs block leading-tight">QR Code Eleitoral</strong>
                          <span className="text-[10px] text-slate-500 block">Celulares da unidade</span>
                        </div>
                      </div>
                    </div>

                    {/* Alerta de Validação Temporal */}
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px]">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Validação Cronológica NR-5:</strong> O link e o QR Code só permitem submissão durante o período oficial de inscrições ({datasPrincipais.inscricaoInicio || '21/09/2026'} a {datasPrincipais.inscricaoFim || '05/10/2026 até às 17:00'}).
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* CENÁRIO 2: MÓDULO DE ELEIÇÃO NÃO CONTRATADO (FICHA MANUAL & ASSINATURAS) */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider flex items-center gap-1.5">
                          <FileSignature className="w-3.5 h-3.5 text-indigo-600" /> Processo Manual Tradicional (NR-5)
                        </span>
                        <h4 className="text-xs font-bold text-indigo-950 mt-0.5">
                          Ficha de Inscrição Individual com Envio ao Módulo de Assinaturas
                        </h4>
                        <p className="text-[11px] text-indigo-900/80 mt-0.5">
                          Como a empresa não utiliza o Módulo de Eleição Online, as candidaturas são preenchidas manualmente, gerando documento oficial com coleta de assinaturas e disparo automático do Termo de Aceite das Regras por e-mail.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsManualCandidateModalOpen(true)}
                        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Preencher Ficha Manual</span>
                      </button>
                    </div>

                    <div className="p-2.5 bg-white/80 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900">
                      <span>✓ Emite Ficha Individual conforme NR-5 Subitem 5.5.2.2 e 5.5.2.3</span>
                      <span>✓ Coleta assinaturas do Candidato e da Comissão Eleitoral</span>
                      <span>✓ Notifica colaborador com Regras de Campanha</span>
                    </div>
                  </div>
                </div>
              )}

              {/* LISTA DE CANDIDATOS INSCRITOS / HOMOLOGADOS (VISÍVEL EM AMBOS OS MODOS!) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Candidatos Registrados na Unidade ({candidatos.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Confirmados: <strong className="text-emerald-700 font-bold">{candidatos.filter(c => c.status === 'confirmado').length}</strong> de {candidatos.length}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-[10.5px] uppercase font-bold text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-3">Nº / Foto</th>
                        <th className="py-2.5 px-3">Nome / Cargo / Setor</th>
                        <th className="py-2.5 px-3">E-mail / Matrícula</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3">Status da Candidatura</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {candidatos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Nenhum candidato inscrito nesta unidade até o momento.
                          </td>
                        </tr>
                      ) : (
                        candidatos.map((cand) => {
                          const isConfirmed = cand.status === 'confirmado';
                          return (
                            <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-mono font-bold text-[10px] flex items-center justify-center">
                                    {cand.numero}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <strong className="text-slate-900 font-bold block">{cand.nome}</strong>
                                <span className="text-[11px] text-slate-500 block">{cand.cargo} · {cand.setor}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-[11px] text-slate-700 block truncate max-w-[180px]">{cand.email || `${cand.nome.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`}</span>
                                <span className="text-[10px] font-mono text-slate-400 block">{cand.matricula || 'CLT-1029'}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  cand.metodoInscricao === 'manual'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {cand.metodoInscricao === 'manual' ? 'Ficha Manual' : 'Online'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {isConfirmed ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <Check className="w-3 h-3 text-emerald-600" /> Candidatura Confirmada
                                    </span>
                                    <span className="text-[9.5px] text-slate-400 block mt-0.5 font-mono">
                                      Regras aceitas {cand.confirmadoEm ? `em ${cand.confirmadoEm}` : ''}
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      <Clock className="w-3 h-3 text-amber-600" /> Aguardando Confirmação
                                    </span>
                                    <span className="text-[9.5px] text-amber-800 block mt-0.5">
                                      Pendente aceite das regras via e-mail
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  {/* Botão Ver E-mail com Regras */}
                                  <button
                                    type="button"
                                    onClick={() => setActiveEmailCandidate(cand)}
                                    className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200"
                                    title="Ver E-mail institucional com Termo de Aceite das Regras enviado ao colaborador"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                                  </button>

                                  {/* Se pendente, botão rápido para validar / confirmar candidatura */}
                                  {!isConfirmed && (
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmCandidateEmail(cand)}
                                      className="px-2 py-1 text-[10.5px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                      title="Simular clique do colaborador confirmando o aceite das regras no e-mail"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Confirmar</span>
                                    </button>
                                  )}

                                  {/* Se manual, botão para ver envelope de assinatura */}
                                  {cand.metodoInscricao === 'manual' && onNavigateTab && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsCandidateModalOpen(false);
                                        onNavigateTab('assinaturas');
                                      }}
                                      className="p-1.5 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                                      title="Ver no Módulo de Assinaturas"
                                    >
                                      <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Rodapé */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                NR-05: Portaria MTP nº 4.219/2022 · Estabilidade garantida conforme art. 10, II, "a" do ADCT
              </span>
              <button
                type="button"
                onClick={() => setIsCandidateModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PREENCHIMENTO DE FICHA MANUAL DE INSCRIÇÃO                       */}
      {/* ========================================================================= */}
      {isManualCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            
            <div className="px-6 py-4 border-b border-indigo-200 bg-indigo-50/70 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                Nova Ficha de Inscrição Manual (NR-5)
              </h3>
              <button 
                type="button"
                onClick={() => setIsManualCandidateModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* Selecionar colaborador cadastrado */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Puxar Colaborador da Unidade (Opcional):
                </label>
                <select
                  value={candSelectedEmployeeId}
                  onChange={(e) => handleSelectEmployeeForCandidate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                >
                  <option value="">-- Selecione ou preencha manualmente abaixo --</option>
                  {(employeesByUnit[currentFilial.id] || []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.cargo} · {emp.matricula})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nome Completo do Candidato: *
                  </label>
                  <input
                    type="text"
                    value={candNome}
                    onChange={(e) => setCandNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo dos Santos"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Matrícula Funcional CLT:
                  </label>
                  <input
                    type="text"
                    value={candMatricula}
                    onChange={(e) => setCandMatricula(e.target.value)}
                    placeholder="Ex: CLT-5892"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Tempo de Empresa:
                  </label>
                  <input
                    type="text"
                    value={candTempoEmpresa}
                    onChange={(e) => setCandTempoEmpresa(e.target.value)}
                    placeholder="Ex: 3 anos"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Cargo / Função:
                  </label>
                  <input
                    type="text"
                    value={candCargo}
                    onChange={(e) => setCandCargo(e.target.value)}
                    placeholder="Ex: Operador Técnico"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Setor de Trabalho:
                  </label>
                  <input
                    type="text"
                    value={candSetor}
                    onChange={(e) => setCandSetor(e.target.value)}
                    placeholder="Ex: Produção e Manutenção"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    E-mail do Colaborador (Para envio do Termo de Aceite das Regras): *
                  </label>
                  <input
                    type="email"
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    placeholder="candidato@telefonica.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Propostas de Prevenção / Mini-currículo:
                  </label>
                  <textarea
                    rows={2}
                    value={candPropostas}
                    onChange={(e) => setCandPropostas(e.target.value)}
                    placeholder="Ex: Atuação voltada à eliminação de riscos de quedas, melhoria de ventilação e apoio às inspeções de segurança."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Informação sobre o fluxo */}
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 text-indigo-950 space-y-1 text-[11px]">
                <strong className="block font-bold">O que acontecerá ao salvar:</strong>
                <p>1. A Ficha de Inscrição Manual será gerada e enviada para aprovação e coleta de assinaturas digitais no Módulo de Assinaturas (Candidato + Presidente da CE).</p>
                <p>2. O candidato receberá imediatamente o e-mail oficial com o <strong>Termo de Aceite – Regras do Candidato</strong>. A candidatura só será considerada homologada após a confirmação via e-mail.</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsManualCandidateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateManualCandidate}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <FileSignature className="w-4 h-4" />
                <span>Salvar Ficha & Enviar para Assinatura</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: INSCRIÇÃO ONLINE RÁPIDA (SIMULAÇÃO VIA LINK)                     */}
      {/* ========================================================================= */}
      {isOnlineQuickModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            
            <div className="px-6 py-4 border-b border-emerald-200 bg-emerald-50/70 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <Vote className="w-5 h-5 text-emerald-600" />
                Inscrição Online de Candidato (Link da Eleição)
              </h3>
              <button 
                type="button"
                onClick={() => setIsOnlineQuickModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Puxar Colaborador da Unidade:
                </label>
                <select
                  value={candSelectedEmployeeId}
                  onChange={(e) => handleSelectEmployeeForCandidate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                >
                  <option value="">-- Selecione ou preencha manualmente --</option>
                  {(employeesByUnit[currentFilial.id] || []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.cargo} · {emp.matricula})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nome Completo: *</label>
                  <input
                    type="text"
                    value={candNome}
                    onChange={(e) => setCandNome(e.target.value)}
                    placeholder="Ex: Gabriela Duarte"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Cargo:</label>
                    <input
                      type="text"
                      value={candCargo}
                      onChange={(e) => setCandCargo(e.target.value)}
                      placeholder="Ex: Analista de Qualidade"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Setor:</label>
                    <input
                      type="text"
                      value={candSetor}
                      onChange={(e) => setCandSetor(e.target.value)}
                      placeholder="Ex: Almoxarifado"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">E-mail Corporativo: *</label>
                  <input
                    type="email"
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    placeholder="gabriela.duarte@telefonica.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Propostas:</label>
                  <textarea
                    rows={2}
                    value={candPropostas}
                    onChange={(e) => setCandPropostas(e.target.value)}
                    placeholder="Ex: Ergonomia preventiva e diálogo permanente com os trabalhadores."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px]">
                Ao submeter a inscrição online, o candidato receberá o e-mail institucional com o <strong>Termo de Aceite das Regras da Eleição</strong>.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsOnlineQuickModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateOnlineCandidate}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Vote className="w-4 h-4" />
                <span>Confirmar Inscrição Online</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: PREVIEW DO E-MAIL DE REGRAS E TERMO DE ACEITE DO CANDIDATO       */}
      {/* ========================================================================= */}
      {activeEmailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Header de Cliente de E-mail Corporativo */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 leading-tight">
                    E-mail de Validação de Candidatura & Regras Eleitorais
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Para: {activeEmailCandidate.email || `${activeEmailCandidate.nome.toLowerCase().replace(/\s+/g, '.')}@telefonica.com`}
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setActiveEmailCandidate(null)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cabeçalho do E-mail */}
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 text-[11px] space-y-1">
              <div><strong className="text-slate-600">De:</strong> <span className="text-slate-800 font-semibold">Comissão Eleitoral CIPA &lt;cipa.br@telefonica.com&gt;</span></div>
              <div><strong className="text-slate-600">Assunto:</strong> <span className="text-slate-900 font-bold">[CIPA] Parabéns! Sua candidatura para CIPA foi validada com sucesso!</span></div>
            </div>

            {/* Corpo do E-mail Oficial do Usuário */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-800 leading-relaxed font-sans">
              
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="font-bold text-emerald-950 text-sm">Prezado Colaborador,</p>
                <p className="text-emerald-900 font-semibold mt-1">
                  Parabéns! Sua candidatura para CIPA foi validada com sucesso!
                </p>
                <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                  Candidato: <strong>{activeEmailCandidate.nome}</strong> (Matrícula: {activeEmailCandidate.matricula || 'CLT-1029'} · Cargo: {activeEmailCandidate.cargo})
                </p>
              </div>

              <p className="text-slate-700">
                Agora que você está oficialmente no processo, é fundamental conhecer e seguir as regras da eleição para que tudo corra de forma justa e tranquila.
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                <strong>Fique ligado :</strong> Candidatos têm estabilidade no emprego até o dia da eleição — exceto em casos previstos na NR 5 ou em situações de descumprimento das regras, avaliadas pela Comissão Eleitoral .
              </div>

              <div className="border-t border-b border-slate-200 py-3 my-2 text-center">
                <strong className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  CIPA – Comissão Interna de Prevenção de Acidentes e Assédio
                </strong>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">
                  Termo de aceite – Regras do Candidato
                </span>
              </div>

              {/* O que você pode fazer */}
              <div className="space-y-1.5">
                <strong className="text-xs font-bold text-emerald-800 block uppercase tracking-wide">
                  O que você pode fazer:
                </strong>
                <ul className="space-y-1 text-slate-700 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Apresentar seu plano de trabalho aos colegas, sempre com foco na prevenção de acidentes e doenças no trabalho.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Circular pelas áreas da empresa para divulgar sua candidatura, com bom senso e respeito ao ambiente de trabalho.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Usar o WhatsApp para divulgar sua candidatura e propostas, desde que respeite todas as demais regras.</span>
                  </li>
                </ul>
              </div>

              {/* O que não pode */}
              <div className="space-y-1.5 pt-2">
                <strong className="text-xs font-bold text-rose-800 block uppercase tracking-wide">
                  O que não pode:
                </strong>
                <ul className="space-y-1 text-slate-700 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Usar canais da empresa (como e-mail corporativo, Teams, WorkVivo ou murais) para pedir votos ou divulgar sua candidatura.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Oferecer brindes ou favores em troca de votos — nada de canetas, canecas, churrascos, festas, etc.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Fazer "boca de urna" ou forçar alguém a votar na sua frente.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Usar sua posição na empresa para pressionar ou ameaçar colegas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Pedir prova de voto, como fotos ou prints de tela.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Interromper o trabalho (seu ou de colegas) para fazer campanha.</span>
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Obs.: Processo não elegível para colaboradores em regime 100% Remoto.
              </p>

              {/* Importante */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1 text-[11.5px]">
                <strong className="text-slate-900 block font-bold">Importante:</strong>
                <p>As denúncias somente serão verificadas se realizadas dentro do período Eleitoral, até a divulgação dos eleitos e acompanhadas de evidências.</p>
                <p>Descumprir essas regras pode levar a punições e até à exclusão do processo eleitoral. Se tiver dúvidas, é só chamar: <strong>cipa.br@telefonica.com</strong> Boa sorte!</p>
                <p className="font-semibold text-slate-800 pt-1">O Processo de eleição é submetido à auditoria e conduzido de forma ética com base nos Princípios de Negócios Responsável.</p>
              </div>

            </div>

            {/* Rodapé do E-mail com Botão de Aceite */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                {activeEmailCandidate.status === 'confirmado' ? (
                  <strong className="text-emerald-700">✓ Regras confirmadas em {activeEmailCandidate.confirmadoEm || '22/09/2026'}</strong>
                ) : (
                  <span className="text-amber-700 font-bold">Aguardando confirmação do colaborador</span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveEmailCandidate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Fechar
                </button>

                {activeEmailCandidate.status !== 'confirmado' ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmCandidateEmail(activeEmailCandidate)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Li e Aceito as Regras do Candidato (Confirmar Candidatura)</span>
                  </button>
                ) : (
                  <div className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Candidatura Homologada e Validada</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: LANÇAMENTO MANUAL DE VOTOS DA URNA FÍSICA (NR-5 - ETAPA 9)       */}
      {/* ========================================================================= */}
      {isManualApuracaoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Header do Modal */}
            <div className="px-6 py-4 border-b border-amber-200 bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950 leading-tight">
                    Apuração de Urna Física · Lançamento Manual de Votos da CIPA
                  </h3>
                  <p className="text-[11px] text-amber-800 font-medium">
                    {currentFilial.name} · CNPJ {currentFilial.cnpj || currentCompany.cnpj} · Gestão 2026/2027
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsManualApuracaoModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-amber-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800">
              
              {/* Banner Informativo NR-5 */}
              <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-950 block text-xs">
                    Processo Eleitoral com Urna Física (Sem Módulo de Eleição Online)
                  </span>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Insira abaixo os dados coletados da urna física e o total de votos de cada candidato. O sistema calcula automaticamente o quórum de 50%+1 (NR-5, subitem 5.5.4), aplica o critério de antiguidade para desempates, classifica titulares e suplentes, e gera a <strong>Ata Oficial de Eleição e Apuração</strong> pronta para visualização e coleta de assinaturas digitais.
                  </p>
                </div>
              </div>

              {/* Informações da Urna Física e Mesa Apuradora */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>1. Dados da Urna Física e Mesa Apuradora</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Local da Urna Física:</label>
                    <input
                      type="text"
                      value={manualApuracaoData.localUrna}
                      onChange={(e) => setManualApuracaoData(prev => ({ ...prev, localUrna: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Lacre de Segurança da Urna:</label>
                    <input
                      type="text"
                      value={manualApuracaoData.lacreUrna}
                      onChange={(e) => setManualApuracaoData(prev => ({ ...prev, lacreUrna: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Horário de Início:</label>
                    <input
                      type="text"
                      value={manualApuracaoData.horarioAbertura}
                      onChange={(e) => setManualApuracaoData(prev => ({ ...prev, horarioAbertura: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Horário de Encerramento:</label>
                    <input
                      type="text"
                      value={manualApuracaoData.horarioEncerramento}
                      onChange={(e) => setManualApuracaoData(prev => ({ ...prev, horarioEncerramento: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Presidente da Mesa:</label>
                    <input
                      type="text"
                      value={manualApuracaoData.presidenteMesa}
                      onChange={(e) => setManualApuracaoData(prev => ({ ...prev, presidenteMesa: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Estatísticas de Quórum da Votação */}
              {(() => {
                const totalAptos = effectiveHeadcount || headcount || dimensionamento?.headcount || 88;
                const vagasTitulares = dimensionamento?.efetivosEmpregados || 2;
                const vagasSuplentes = dimensionamento?.suplentesEmpregados || 2;
                const candidatosConfirmados = candidatos.filter(c => c.status === 'confirmado');
                
                let totVotosNominais = 0;
                candidatosConfirmados.forEach(c => {
                  totVotosNominais += (manualApuracaoData.votosPorCandidato[c.id] ?? c.votos ?? 0);
                });

                const totVotantes = totVotosNominais + manualApuracaoData.votosBrancos + manualApuracaoData.votosNulos;
                const qMin = Math.floor(totalAptos / 2) + 1;
                const qAtingido = totVotantes >= qMin;
                const pctQuorum = totalAptos > 0 ? Math.round((totVotantes / totalAptos) * 100) : 0;

                return (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>2. Quórum Legal e Votos Globais da Urna</span>
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        qAtingido ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {qAtingido ? 'Quórum NR-5 Atingido (1º Dia)' : 'Quórum Insuficiente (<50%)'}
                      </span>
                    </h4>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Eleitores Aptos</span>
                        <span className="text-xl font-black text-slate-900 font-mono">{totalAptos}</span>
                        <span className="text-[10px] text-slate-400 block">População da base</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Quórum Mínimo (50%+1)</span>
                        <span className="text-xl font-black text-indigo-700 font-mono">{qMin}</span>
                        <span className="text-[10px] text-indigo-600 block font-semibold">Exigência NR-5</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Votantes Apurados</span>
                        <span className="text-xl font-black text-amber-800 font-mono">{totVotantes}</span>
                        <span className="text-[10px] text-slate-500 block">{pctQuorum}% de participação</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Votos Válidos (Nominais)</span>
                        <span className="text-xl font-black text-emerald-700 font-mono">{totVotosNominais}</span>
                        <span className="text-[10px] text-emerald-600 block">Distribuídos aos candidatos</span>
                      </div>
                    </div>

                    {/* Inputs de Brancos e Nulos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">Votos em Branco:</label>
                          <span className="text-[10px] text-slate-500">Cédulas assinaladas em branco</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setManualApuracaoData(prev => ({ ...prev, votosBrancos: Math.max(0, prev.votosBrancos - 1) }))}
                            className="w-7 h-7 bg-white rounded-lg border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={manualApuracaoData.votosBrancos}
                            onChange={(e) => setManualApuracaoData(prev => ({ ...prev, votosBrancos: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-14 text-center py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setManualApuracaoData(prev => ({ ...prev, votosBrancos: prev.votosBrancos + 1 }))}
                            className="w-7 h-7 bg-white rounded-lg border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">Votos Nulos:</label>
                          <span className="text-[10px] text-slate-500">Cédulas rasuradas ou inválidas</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setManualApuracaoData(prev => ({ ...prev, votosNulos: Math.max(0, prev.votosNulos - 1) }))}
                            className="w-7 h-7 bg-white rounded-lg border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={manualApuracaoData.votosNulos}
                            onChange={(e) => setManualApuracaoData(prev => ({ ...prev, votosNulos: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-14 text-center py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setManualApuracaoData(prev => ({ ...prev, votosNulos: prev.votosNulos + 1 }))}
                            className="w-7 h-7 bg-white rounded-lg border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tabela de Lançamento de Votos dos Candidatos */}
              {(() => {
                const totalAptos = effectiveHeadcount || headcount || dimensionamento?.headcount || 88;
                const vagasTitulares = dimensionamento?.efetivosEmpregados || 2;
                const vagasSuplentes = dimensionamento?.suplentesEmpregados || 2;
                const candidatosConfirmados = candidatos.filter(c => c.status === 'confirmado');
                
                let totVotosNominais = 0;
                const listaClassificada = candidatosConfirmados.map(c => {
                  const v = manualApuracaoData.votosPorCandidato[c.id] ?? (c.votos || 0);
                  totVotosNominais += v;
                  return {
                    ...c,
                    votosDigitados: v
                  };
                });

                listaClassificada.sort((a, b) => {
                  if (b.votosDigitados !== a.votosDigitados) return b.votosDigitados - a.votosDigitados;
                  const dateA = a.dataAdmissao ? new Date(a.dataAdmissao.split('/').reverse().join('-')).getTime() : 0;
                  const dateB = b.dataAdmissao ? new Date(b.dataAdmissao.split('/').reverse().join('-')).getTime() : 0;
                  return dateA - dateB;
                });

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Vote className="w-3.5 h-3.5 text-amber-600" />
                        <span>3. Digitação de Votos por Candidato (Urna Física)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Vagas: <strong className="text-slate-800">{vagasTitulares} Titulares</strong> e <strong className="text-slate-800">{vagasSuplentes} Suplentes</strong>
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 text-[10.5px] uppercase font-bold text-slate-700 border-b border-slate-200">
                            <th className="py-2.5 px-3 w-16 text-center">Classif.</th>
                            <th className="py-2.5 px-3 w-24">RE</th>
                            <th className="py-2.5 px-3">Candidato / Cargo</th>
                            <th className="py-2.5 px-3 w-28 text-center">Admissão</th>
                            <th className="py-2.5 px-3 w-40 text-center">Votos Apurados</th>
                            <th className="py-2.5 px-3 w-24 text-center">% Votos</th>
                            <th className="py-2.5 px-3 w-36 text-center">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {listaClassificada.map((cand, idx) => {
                            const pct = totVotosNominais > 0 ? (cand.votosDigitados / totVotosNominais) * 100 : 0;
                            let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
                            let situacaoTexto = 'Não Eleito';

                            if (idx < vagasTitulares) {
                              badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                              situacaoTexto = `${idx + 1}º Titular Eleito`;
                            } else if (idx < vagasTitulares + vagasSuplentes) {
                              badgeStyle = 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
                              situacaoTexto = `${idx - vagasTitulares + 1}º Suplente Eleito`;
                            }

                            return (
                              <tr key={cand.id} className="hover:bg-amber-50/40 transition-colors">
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                                  {idx + 1}º
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                                    {cand.matricula || cand.id}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900">{cand.nome}</div>
                                  <div className="text-[10px] text-slate-500">{cand.cargo}</div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                                  {cand.dataAdmissao || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="inline-flex items-center gap-1.5 justify-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setManualApuracaoData(prev => ({
                                          ...prev,
                                          votosPorCandidato: {
                                            ...prev.votosPorCandidato,
                                            [cand.id]: Math.max(0, (prev.votosPorCandidato[cand.id] ?? cand.votos ?? 0) - 1)
                                          }
                                        }));
                                      }}
                                      className="w-7 h-7 bg-slate-100 rounded-lg border border-slate-300 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                                    >
                                      <Minus className="w-3.5 h-3.5 text-slate-700" />
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={manualApuracaoData.votosPorCandidato[cand.id] ?? cand.votos ?? 0}
                                      onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                        setManualApuracaoData(prev => ({
                                          ...prev,
                                          votosPorCandidato: {
                                            ...prev.votosPorCandidato,
                                            [cand.id]: val
                                          }
                                        }));
                                      }}
                                      className="w-14 text-center py-1 bg-amber-50/70 border border-amber-300 rounded-lg font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setManualApuracaoData(prev => ({
                                          ...prev,
                                          votosPorCandidato: {
                                            ...prev.votosPorCandidato,
                                            [cand.id]: (prev.votosPorCandidato[cand.id] ?? cand.votos ?? 0) + 1
                                          }
                                        }));
                                      }}
                                      className="w-7 h-7 bg-slate-100 rounded-lg border border-slate-300 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                                  {pct.toFixed(1)}%
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap ${badgeStyle}`}>
                                    {situacaoTexto}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Footer do Modal com Ações */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                * As alterações de votos digitadas são salvas e inseridas diretamente na Ata Oficial de Eleição.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsManualApuracaoModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveManualApuracao(false)}
                  className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Salvar Apuração
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveManualApuracao(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-600 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Gerar e Ver Ata Oficial</span>
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
