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
  Loader2
} from 'lucide-react';
import { useCipa } from '../../context/CipaContext';
import { DimensionamentoHistoryModal } from './dimensionamento/DimensionamentoHistoryModal';
import { ApiService } from '../../services/apiService';

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

  // Dimensionamento oficial NR-5 Quadro I
  const headcount = currentEmployees.length;
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
      inscricaoInicio: formatDate(-45),
      inscricaoFim: formatDate(-30),
      eleicao: formatDate(-30),
      apuracao: formatDate(-30),
      treinamento: `${formatDate(-15)} a ${formatDate(-5)}`,
      posse: dFim.toLocaleDateString('pt-BR')
    };
  }, [mandateEndDate]);

  // Etapas concluídas
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    'etapa-1': false,
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
  });

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

  // Integração com Contexto e Histórico de Dimensionamento
  const { saveDimensionamento, dimensionamentos } = useCipa();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSaveCurrentDimensionamento = () => {
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
    showToast('Dimensionamento salvo no histórico da unidade com sucesso!');
  };

  // Avançar para o Calendário Eleitoral salvando automaticamente no histórico
  const handleGoToCalendario = () => {
    handleSaveCurrentDimensionamento();
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

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

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
          onClick={() => setActiveTab('calendario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'calendario'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-emerald-700" />
          <span>Calendário Eleitoral</span>
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
                            Nenhum colaborador encontrado para a busca "{employeeSearch}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Navegação para o Passo 2 */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Base com {headcount} colaboradores validada para a CIPA.
                  </span>

                  <button
                    type="button"
                    onClick={() => setStepDimensionamento(2)}
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
                  {/* Botão Histórico - Recolhível / Expansível no hover */}
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="group flex items-center h-8 w-8 hover:w-32 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                    title="Ver histórico de dimensionamentos"
                  >
                    <History className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-700" />
                    <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                      Histórico ({dimensionamentos.filter(d => !d.companyId || d.companyId === currentCompany.id).length})
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
            <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 py-3.5 border-b border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Etapas do Calendário Eleitoral
                </h3>
              </div>
              <span className="text-xs text-emerald-950 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg">
                {completedCount} de 11 concluídas
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">Status</th>
                      <th className="py-3 px-4">Etapa do Processo</th>
                      <th className="py-3 px-4">Prazo / Data Oficial</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    
                    {/* ETAPA 1: COMUNICAR O SINDICATO */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-1')}
                          className="cursor-pointer transition-transform active:scale-90"
                          title={completedSteps['etapa-1'] ? 'Marcar como pendente' : 'Marcar como concluída'}
                        >
                          {completedSteps['etapa-1'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">1. Comunicar o Sindicato</strong>
                        <span className="text-[11px] text-slate-500">Envio da carta formal com os marcos e datas do pleito</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        {datasPrincipais.convocacao}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSindicatoModalOpen(true);
                            setCompletedSteps(prev => ({ ...prev, ['etapa-1']: true }));
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Carta ao Sindicato</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 2: CONVOCAÇÃO DA ELEIÇÃO */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-2')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-2'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">2. Convocação das Eleições</strong>
                        <span className="text-[11px] text-slate-500">Publicação formal do edital de convocação na empresa</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        {datasPrincipais.convocacao}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-2', 'edital_convocacao')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Edital</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 3: COMISSÃO ELEITORAL */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-3')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-3'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">3. Comissão Eleitoral</strong>
                        <span className="text-[11px] text-slate-500">Portaria paritária com os responsáveis pela condução</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        55 dias antes da posse
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-3', 'comissao_eleitoral')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Portaria</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 4: INSCRIÇÃO DE CANDIDATOS */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-4')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-4'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">4. Inscrição de Candidatos</strong>
                        <span className="text-[11px] text-slate-500">Período mínimo de 15 dias corridos para candidatura livre</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        {datasPrincipais.inscricaoInicio} a {datasPrincipais.inscricaoFim}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-4', 'edital_inscricao')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Edital</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 5: COMPROVANTE DE INSCRIÇÃO */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-5')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-5'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">5. Protocolo de Inscrição</strong>
                        <span className="text-[11px] text-slate-500">Garantia provisória de emprego protocolada</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        No ato da inscrição
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-5', 'comprovante_inscricao')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Protocolo</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 6: LISTA OFICIAL DE CANDIDATOS */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-6')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-6'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">6. Lista de Candidatos</strong>
                        <span className="text-[11px] text-slate-500">Divulgação de todos os concorrentes deferidos</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        35 dias antes da posse
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-6', 'lista_candidatos')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Lista</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 7: ZERÉSIMA DA URNA */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-7')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-7'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">7. Zerésima da Urna Digital</strong>
                        <span className="text-[11px] text-slate-500">Lacração e auditoria eletrônica da urna</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        30 dias antes da posse
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-7', 'cedula_urna')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <Vote className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Zerésima</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 8: ELEIÇÃO E APURAÇÃO */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-8')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-8'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">8. Ata de Eleição & Apuração</strong>
                        <span className="text-[11px] text-slate-500">Validação do quórum 50%+1 e eleitos</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        {datasPrincipais.eleicao}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-8', 'ata_eleicao')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Ata</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 9: TREINAMENTO */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-9')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-9'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">9. Certificado de Treinamento</strong>
                        <span className="text-[11px] text-slate-500">Curso da NR-5 com Prevenção ao Assédio (Lei 14.457)</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        {datasPrincipais.treinamento}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-9', 'certificado_treinamento')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <Award className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Certificado</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 10: ATA DE POSSE */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-10')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-10'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">10. Ata de Instalação e Posse</strong>
                        <span className="text-[11px] text-slate-500">Sessão solene de transmissão do mandato</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        {datasPrincipais.posse}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-10', 'ata_posse')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Ata</span>
                        </button>
                      </td>
                    </tr>

                    {/* ETAPA 11: CALENDÁRIO ANUAL */}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted('etapa-11')}
                          className="cursor-pointer transition-transform active:scale-90"
                        >
                          {completedSteps['etapa-11'] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">11. Calendário Anual de Reuniões</strong>
                        <span className="text-[11px] text-slate-500">Agendamento das 12 reuniões ordinárias mensais</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                        {datasPrincipais.posse}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdital('etapa-11', 'calendario_reunioes')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Calendário</span>
                        </button>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          </div>

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
                    currentCompany.razaoSocial,
                    currentCompany.cnpj,
                    mandateEndDate,
                    dimensionamento.totalMembros,
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
              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center text-[11px] text-slate-500">
                {activeEditalDoc.doc.signatories.map((sig, i) => (
                  <div key={i} className="pt-4 border-t border-slate-300">
                    <span className="font-semibold text-slate-800 block">{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé com Assinatura Embutida */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onOpenDocument(activeEditalDoc.doc);
                  setActiveEditalDoc(null);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir / Baixar</span>
              </button>

              <button
                type="button"
                onClick={handleSignOpenedEdital}
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
                  <label className="text-xs font-bold text-slate-700">E-mail</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="colaborador@empresa.com.br"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
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
      />

    </div>
  );
};
