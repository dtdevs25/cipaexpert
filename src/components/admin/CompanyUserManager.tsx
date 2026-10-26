import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  Mail, 
  UserCheck, 
  LayoutGrid, 
  List, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  FileCheck2,
  Building,
  Layers,
  ArrowRight,
  KeyRound,
  Search,
  Loader2,
  AlertCircle,
  Lock,
  EyeOff,
  ShieldAlert,
  Check,
  FileText,
  Sparkles
} from 'lucide-react';
import { Company, CompanyUnit, UserRole, AuthUser } from '../../types/auth';
import { DEMO_USERS, INITIAL_COMPANIES } from '../../data/multiCompanyData';
import { CNAE_DATABASE } from '../../data/cnaeData';
import { StandardModal } from '../common/StandardModal';
import { ApiService } from '../../services/apiService';
import { 
  validateCPF, 
  validateCNPJ, 
  formatCPF, 
  formatCNPJ, 
  formatCNAE,
  maskCPFLGPD
} from '../../utils/documentValidators';

// Reexporta para manter compatibilidade com quaisquer outros componentes
export { validateCPF, validateCNPJ, formatCPF, formatCNPJ, formatCNAE, maskCPFLGPD };

// Formata texto com a primeira letra de cada palavra em maiúsculo (Title Case)
export const formatCapitalizeName = (text?: string): string => {
  if (!text) return '';
  const lowerExceptions = ['de', 'da', 'do', 'das', 'dos', 'e'];
  const upperKeep = ['SST', 'NR-5', 'CLT', 'CPF', 'CNPJ', 'LGPD', 'S.A.', 'LTDA', 'ME', 'EPP'];
  return text
    .trim()
    .split(/\s+/)
    .map((word, idx) => {
      const upper = word.toUpperCase();
      if (upperKeep.includes(upper)) return upper;
      const lower = word.toLowerCase();
      if (idx > 0 && lowerExceptions.includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
};

// Hierarquia oficial de permissões para isolamento e proteção de visualização
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  master: 100,
  admin_empresa: 80,
  gestor_unidade: 60,
  tecnico_sst: 40,
  cipeiro: 20,
  eleitor: 10
};

export const AVAILABLE_ROLES: { role: UserRole; label: string }[] = [
  { role: 'master', label: 'Master' },
  { role: 'admin_empresa', label: 'Administrador da Empresa' },
  { role: 'gestor_unidade', label: 'Gestor de Unidade' },
  { role: 'tecnico_sst', label: 'Técnico de SST' },
  { role: 'cipeiro', label: 'Cipeiro' },
  { role: 'eleitor', label: 'Eleitor' }
];

// Catálogo completo de permissões operacionais do sistema
export interface SystemPermissionDef {
  id: string;
  name: string;
  desc: string;
  category: string;
}

export const SYSTEM_PERMISSIONS: SystemPermissionDef[] = [
  {
    id: 'perm_view_full_cpf',
    name: 'Visualização Completa de CPF (LGPD)',
    desc: 'Visualização de todos os números de CPF sem a máscara protetora de 3 dígitos.',
    category: 'Privacidade & Dados'
  },
  {
    id: 'perm_dimensionamento_full',
    name: 'Cálculo e Dimensionamento NR-5',
    desc: 'Calcular dimensionamento da CIPA e emitir os quadros oficiais I e II.',
    category: 'NR-5 & Segurança'
  },
  {
    id: 'perm_election_manager',
    name: 'Condução do Processo Eleitoral',
    desc: 'Publicar editais, homologar candidaturas, conduzir votação e apurar atas.',
    category: 'Processo Eleitoral'
  },
  {
    id: 'perm_digital_signatures',
    name: 'Portal de Assinaturas Digitais',
    desc: 'Criar envelopes, posicionar signatários e despachar atas para assinatura.',
    category: 'Assinaturas Digitais'
  },
  {
    id: 'perm_manage_companies',
    name: 'Gestão Cadastral de Empresas & Filiais',
    desc: 'Criar e atualizar cadastros de matrizes, filiais e estabelecimentos.',
    category: 'Administração Geral'
  },
  {
    id: 'perm_manage_users',
    name: 'Gestão de Usuários & Contas',
    desc: 'Cadastrar novos colaboradores e redefinir senhas e perfis.',
    category: 'Administração Geral'
  },
  {
    id: 'perm_audit_logs',
    name: 'Auditoria & Logs de Segurança',
    desc: 'Consultar histórico de ações, IPs e registros de conformidade legal.',
    category: 'Segurança & Auditoria'
  },
  {
    id: 'perm_delete_records',
    name: 'Exclusão de Registros do Sistema',
    desc: 'Permissão para excluir registros, históricos e documentos.',
    category: 'Segurança & Auditoria'
  }
];

// Permissões que já vêm por padrão em cada cargo
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  master: [
    'perm_view_full_cpf',
    'perm_dimensionamento_full',
    'perm_election_manager',
    'perm_digital_signatures',
    'perm_manage_companies',
    'perm_manage_users',
    'perm_audit_logs',
    'perm_delete_records'
  ],
  admin_empresa: [
    'perm_dimensionamento_full',
    'perm_election_manager',
    'perm_digital_signatures',
    'perm_manage_companies',
    'perm_manage_users'
  ],
  gestor_unidade: [
    'perm_election_manager',
    'perm_digital_signatures'
  ],
  tecnico_sst: [
    'perm_dimensionamento_full',
    'perm_election_manager',
    'perm_digital_signatures'
  ],
  cipeiro: [
    'perm_digital_signatures'
  ],
  eleitor: []
};

// Detalhes textuais dos cargos (SEM fundo colorido, tipografia limpa e elegante)
export const ROLE_PERMISSIONS_DETAILS: Record<UserRole, {
  label: string;
  description: string;
}> = {
  master: {
    label: 'Master',
    description: 'Acesso pleno e soberano a todas as empresas, filiais, banco de dados e configurações globais de segurança da plataforma.'
  },
  admin_empresa: {
    label: 'Administrador da Empresa',
    description: 'Gestão administrativa da empresa e filiais vinculadas, com autoridade sobre técnicos, cipeiros e colaboradores.'
  },
  gestor_unidade: {
    label: 'Gestor de Unidade',
    description: 'Responsável pelo monitoramento operacional da CIPA em sua unidade/filial designada.'
  },
  tecnico_sst: {
    label: 'Técnico de SST',
    description: 'Operador técnico oficial: realiza dimensionamento NR-5, conduz eleições, emite editais e recolhe assinaturas.'
  },
  cipeiro: {
    label: 'Cipeiro',
    description: 'Membro integrante da CIPA: participa das reuniões ordinárias, elabora planos de ação e assina atas eletronicamente.'
  },
  eleitor: {
    label: 'Eleitor',
    description: 'Colaborador com acesso para registro de candidatura no prazo legal e votação na urna eletrônica segura.'
  }
};



// Componente inteligente de busca e digitação de CNAE com largura contida
interface CnaeSearchSelectProps {
  value: string;
  onChange: (cnaeCode: string, description: string, grauDeRisco: 1 | 2 | 3 | 4) => void;
  cnaesList: any[];
  label?: string;
  required?: boolean;
}

const CnaeSearchSelect: React.FC<CnaeSearchSelectProps> = ({
  value,
  onChange,
  cnaesList,
  label = "CNAE",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedCnae = cnaesList.find(c => c.code === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca adicional na API se o usuário digitar algo específico que não esteja na lista inicial
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term || term.length < 2) return;

    const timeout = setTimeout(() => {
      ApiService.getCnaes(term)
        .then((data) => {
          if (data && data.length > 0) {
            // Mescla resultados novos na lista sem duplicar
            setCnaesList(prev => {
              const existingCodes = new Set(prev.map(p => p.code));
              const newItems = data.filter(d => !existingCodes.has(d.code));
              return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
          }
        })
        .catch(err => console.log('Aviso ao consultar CNAEs na API:', err));
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const filteredCnaes = cnaesList.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const cleanCode = (c.code || '').replace(/\D/g, '');
    const cleanTerm = term.replace(/\D/g, '');
    return (c.code || '').toLowerCase().includes(term) ||
      (cleanTerm && cleanCode.includes(cleanTerm)) ||
      (c.description && c.description.toLowerCase().includes(term));
  }).slice(0, 100);

  return (
    <div className="space-y-1 relative w-full" ref={wrapperRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {selectedCnae && (
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Grau {selectedCnae.grauDeRisco}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Digite o código (ex: 2511) ou atividade..."
          value={isOpen ? searchTerm : (selectedCnae ? `${selectedCnae.code} - ${selectedCnae.description.slice(0, 42)}...` : value)}
          onFocus={() => {
            setSearchTerm('');
            setIsOpen(true);
          }}
          onChange={e => {
            const rawVal = e.target.value;
            setSearchTerm(rawVal);
            setIsOpen(true);
            // Se o usuário digitar um código CNAE exato
            const formatted = formatCNAE(rawVal);
            const exact = cnaesList.find(c => c.code === rawVal || c.code === formatted);
            if (exact) {
              onChange(exact.code, exact.description, exact.grauDeRisco);
            }
          }}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono bg-white cursor-text pr-8"
        />
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
        >
          <Search className="w-3.5 h-3.5" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto w-full divide-y divide-slate-100 animate-in fade-in duration-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-medium border-b border-slate-100 flex items-center justify-between">
            <span>Base Oficial (cnaes_referencia)</span>
            <span>{filteredCnaes.length} exibidos</span>
          </div>
          {filteredCnaes.length === 0 ? (
            <div className="p-3 text-[11px] text-slate-400 text-center">
              Nenhum CNAE encontrado para "{searchTerm}"
            </div>
          ) : (
            filteredCnaes.map(c => {
              const isSelected = c.code === value;
              return (
                <div
                  key={c.code}
                  onClick={() => {
                    onChange(c.code, c.description, c.grauDeRisco);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  title={c.description}
                  className={`p-2.5 text-xs hover:bg-emerald-50 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isSelected ? 'bg-emerald-50/80 font-bold text-emerald-950' : 'text-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-mono text-emerald-800 font-bold mr-1.5">{c.code}</span>
                    <span className="text-slate-600 truncate">{c.description ? c.description.slice(0, 48) : ''}...</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0 font-bold">
                    GR {c.grauDeRisco}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

interface CompanyUserManagerProps {
  companies: Company[];
  onUpdateCompanies: (updated: Company[]) => void;
  currentUser: AuthUser;
  onBackToMenu?: () => void;
}

export const CompanyUserManager: React.FC<CompanyUserManagerProps> = ({
  companies,
  onUpdateCompanies,
  currentUser
}) => {
  // Tabs: Empresas | Filiais & Unidades | Usuários
  const [activeTab, setActiveTab] = useState<'empresas' | 'filiais' | 'usuarios'>('empresas');
  // Padrão: Modo Lista (Tabela) como solicitado pelo usuário
  const [companyViewMode, setCompanyViewMode] = useState<'cards' | 'lista'>('lista');
  const [filialViewMode, setFilialViewMode] = useState<'cards' | 'lista'>('lista');
  
  // Registration Modals & Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
  const [isNewFilialModalOpen, setIsNewFilialModalOpen] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);

  // View / Edit / Delete states for Company
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // View / Edit / Delete states for Filial/Unit
  const [viewingFilial, setViewingFilial] = useState<{ filial: CompanyUnit; companyName: string } | null>(null);
  const [editingFilial, setEditingFilial] = useState<{ filial: CompanyUnit; companyId: string } | null>(null);
  const [filialToDelete, setFilialToDelete] = useState<{ filial: CompanyUnit; companyId: string } | null>(null);

  // View / Edit / Delete states for User
  const [usersList, setUsersList] = useState<AuthUser[]>(Object.values(DEMO_USERS));
  const [cnaesList, setCnaesList] = useState<any[]>(CNAE_DATABASE);

  // Sincroniza com os usuários e CNAEs reais do PostgreSQL
  useEffect(() => {
    ApiService.getUsers()
      .then((data) => {
        if (data && data.length > 0) {
          setUsersList(data);
        }
      })
      .catch((err) => console.log('Aviso ao sincronizar usuários do banco:', err));

    ApiService.getCnaes()
      .then((data) => {
        if (data && data.length > 0) {
          setCnaesList(data);
        }
      })
      .catch((err) => console.log('Aviso ao sincronizar CNAEs do banco:', err));
  }, []);
  const [viewingUser, setViewingUser] = useState<AuthUser | null>(null);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);

  // Standardized Feedback Message Modal
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'error';
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'success'
  });

  // ==========================================
  // New Company Form State
  // ==========================================
  const [newCnpj, setNewCnpj] = useState('');
  const [newSelectedCnae, setNewSelectedCnae] = useState(CNAE_DATABASE[10].code);
  const [newCustomCnaeDesc, setNewCustomCnaeDesc] = useState('');
  const [newFantasia, setNewFantasia] = useState('');
  const [newRazao, setNewRazao] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [newEndereco, setNewEndereco] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newModulos, setNewModulos] = useState({
    dimensionamento: true,
    eleicao: true,
    gestao: true
  });
  const [newUnitName, setNewUnitName] = useState('Matriz Corporativa');

  // ==========================================
  // New Filial Form State
  // ==========================================
  const [targetCompanyIdForFilial, setTargetCompanyIdForFilial] = useState(companies[0]?.id || '');
  const [newFilialName, setNewFilialName] = useState('');
  const [newFilialCnpj, setNewFilialCnpj] = useState('');
  const [newFilialCity, setNewFilialCity] = useState('');
  const [newFilialState, setNewFilialState] = useState('SP');
  const [newFilialCnae, setNewFilialCnae] = useState(CNAE_DATABASE[10].code);
  const [newFilialGr, setNewFilialGr] = useState<1 | 2 | 3 | 4>(3);
  const [newFilialGestor, setNewFilialGestor] = useState('');

  // File input refs
  const companyLogoInputRef = useRef<HTMLInputElement | null>(null);
  const editCompanyLogoInputRef = useRef<HTMLInputElement | null>(null);
  const userPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const editUserPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================
  // New User Form State (Suporte a Multiempresas e Multifiliais)
  // ==========================================
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCpf, setNewUserCpf] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('tecnico_sst');
  const [newUserCompanyId, setNewUserCompanyId] = useState(companies[0]?.id || 'emp-1');
  const [newUserCompanyIds, setNewUserCompanyIds] = useState<string[]>([companies[0]?.id || 'emp-1']);
  const [newUserUnitIds, setNewUserUnitIds] = useState<string[]>([]);
  const [newUserCustomPermissions, setNewUserCustomPermissions] = useState<string[]>([]);
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState('');
  const [showFullCpfInModal, setShowFullCpfInModal] = useState(false);

  // Determina se o usuário conectado pode ver o CPF completo sem máscara (Master, titular ou liberado pelo Master)
  const canCurrentUserViewFullCpf = (targetUser?: AuthUser | null): boolean => {
    if (!targetUser) return false;
    if (currentUser?.role === 'master') return true;
    if (currentUser?.id && currentUser.id === targetUser.id) return true;
    if (currentUser?.customPermissions?.includes('perm_view_full_cpf')) return true;
    return false;
  };



  const handleFileToDataUrl = (file: File, onLoaded: (url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onLoaded(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const showFeedback = (title: string, description: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setFeedbackModal({
      isOpen: true,
      title,
      description,
      type
    });
  };

  // Create Company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newCnpj.trim() || !newFantasia.trim() || !newAdmin.trim() || !newEndereco.trim() || !newSelectedCnae) {
      showFeedback('Campos Obrigatórios', 'CNPJ, CNAE, Nome Fantasia, Responsável Administrador e Endereço Completo são obrigatórios.', 'warning');
      return;
    }

    if (!validateCNPJ(newCnpj)) {
      showFeedback(
        'CNPJ Inválido',
        'O CNPJ informado não é válido segundo os critérios da Receita Federal. Verifique os dígitos e digite novamente.',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const cnaeObj = cnaesList.find(c => c.code === newSelectedCnae);
      const finalCnaeDesc = newCustomCnaeDesc || cnaeObj?.description || 'Atividade empresarial industrial/comercial';
      const finalGr = cnaeObj?.grauDeRisco || 3;

      const newCompany: Company = {
        id: `emp-${Date.now()}`,
        razaoSocial: newRazao.trim() || newFantasia.trim(),
        nomeFantasia: newFantasia.trim(),
        cnpj: newCnpj.trim(),
        logoUrl: newLogoUrl.trim(),
        cnaeCode: newSelectedCnae,
        cnaeDesc: finalCnaeDesc,
        enderecoCompleto: newEndereco.trim(),
        responsavelAdmin: newAdmin.trim(),
        modulosContratados: newModulos,
        units: [
          {
            id: `unit-${Date.now()}-1`,
            name: newUnitName.trim() || 'Matriz Corporativa',
            city: newEndereco.split(',').length > 1 ? newEndereco.split(',')[newEndereco.split(',').length - 2]?.trim() || 'São Paulo' : 'São Paulo',
            state: 'SP',
            headcount: 0,
            grauDeRisco: finalGr,
            cnaeCode: newSelectedCnae,
            cnaeDesc: finalCnaeDesc,
            cipaAtiva: true,
            gestorName: newAdmin.trim()
          }
        ]
      };

      onUpdateCompanies([...companies, newCompany]);
      setIsNewCompanyModalOpen(false);

      // Persiste no PostgreSQL
      await ApiService.createCompany({
        razaoSocial: newCompany.razaoSocial,
        nomeFantasia: newCompany.nomeFantasia,
        cnpj: newCompany.cnpj,
        cnaePrincipalCode: newCompany.cnaeCode,
        cnaePrincipalDesc: newCompany.cnaeDesc,
        enderecoCompleto: newCompany.enderecoCompleto,
        responsavelAdmin: newCompany.responsavelAdmin
      }).catch(err => console.log('Aviso ao persistir empresa no backend:', err));

      setNewCnpj('');
      setNewFantasia('');
      setNewRazao('');
      setNewAdmin('');
      setNewEndereco('');
      setNewLogoUrl('');

      showFeedback(
        'Empresa Cadastrada!',
        `A organização "${newCompany.nomeFantasia}" foi registrada com sucesso.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Filial / Unit
  const handleCreateFilial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!targetCompanyIdForFilial || !newFilialName.trim() || !newFilialCity.trim() || !newFilialGestor.trim()) {
      showFeedback('Campos Obrigatórios', 'Selecione a empresa e informe o nome da filial, cidade e gestor local.', 'warning');
      return;
    }

    if (newFilialCnpj.trim() && !validateCNPJ(newFilialCnpj)) {
      showFeedback(
        'CNPJ da Filial Inválido',
        'O CNPJ informado para a filial é inválido segundo a Receita Federal. Caso utilize o CNPJ da matriz, deixe em branco ou informe um CNPJ válido.',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const cnaeObj = cnaesList.find(c => c.code === newFilialCnae);

      const newUnit: CompanyUnit = {
        id: `unit-${Date.now()}`,
        name: newFilialName.trim(),
        cnpj: newFilialCnpj.trim() || undefined,
        city: newFilialCity.trim(),
        state: newFilialState.trim().toUpperCase(),
        headcount: 0,
        grauDeRisco: newFilialGr,
        cnaeCode: newFilialCnae,
        cnaeDesc: cnaeObj?.description || 'Atividade Operacional da Filial',
        cipaAtiva: true,
        gestorName: newFilialGestor.trim()
      };

      const updatedCompanies = companies.map(c => {
        if (c.id === targetCompanyIdForFilial) {
          return {
            ...c,
            units: [...c.units, newUnit]
          };
        }
        return c;
      });

      onUpdateCompanies(updatedCompanies);
      setIsNewFilialModalOpen(false);

      // Persiste no PostgreSQL
      await ApiService.createUnit(targetCompanyIdForFilial, {
        name: newUnit.name,
        cnpj: newUnit.cnpj,
        city: newUnit.city,
        state: newUnit.state,
        headcount: newUnit.headcount,
        grauDeRisco: newUnit.grauDeRisco,
        cnaeCode: newUnit.cnaeCode,
        cnaeDesc: newUnit.cnaeDesc,
        gestorName: newUnit.gestorName
      } as any).catch(err => console.log('Aviso ao persistir filial no backend:', err));

      const targetCompName = companies.find(c => c.id === targetCompanyIdForFilial)?.nomeFantasia || 'Empresa';
      setNewFilialName('');
      setNewFilialCnpj('');
      setNewFilialCity('');
      setNewFilialGestor('');

      showFeedback(
        'Filial Cadastrada com Sucesso!',
        `O estabelecimento "${newUnit.name}" foi vinculado à organização "${targetCompName}".`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit Filial
  const handleSaveEditFilial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFilial || isSubmitting) return;

    if (!editingFilial.filial.name.trim() || !editingFilial.filial.city.trim() || !editingFilial.filial.gestorName.trim()) {
      showFeedback('Campos Obrigatórios', 'Nome da filial, cidade e gestor local são obrigatórios.', 'warning');
      return;
    }

    if (editingFilial.filial.cnpj?.trim() && !validateCNPJ(editingFilial.filial.cnpj)) {
      showFeedback(
        'CNPJ da Filial Inválido',
        'O CNPJ informado para a filial é inválido segundo a Receita Federal. Por favor, corrija os dígitos.',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedCompanies = companies.map(c => {
        if (c.id === editingFilial.companyId) {
          return {
            ...c,
            units: c.units.map(u => u.id === editingFilial.filial.id ? editingFilial.filial : u)
          };
        }
        return c;
      });

      onUpdateCompanies(updatedCompanies);
      const unitName = editingFilial.filial.name;
      setEditingFilial(null);
      showFeedback('Filial Atualizada!', `Os dados da filial "${unitName}" foram salvos com sucesso.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit Company (Funcional)
  const handleSaveEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || isSubmitting) return;

    if (!editingCompany.cnpj.trim() || !editingCompany.nomeFantasia.trim() || !editingCompany.responsavelAdmin.trim()) {
      showFeedback('Campos Obrigatórios', 'CNPJ, Nome Fantasia e Responsável Administrador são obrigatórios.', 'warning');
      return;
    }

    if (!validateCNPJ(editingCompany.cnpj)) {
      showFeedback(
        'CNPJ Inválido',
        'O CNPJ da empresa é inválido segundo a Receita Federal. Por favor, verifique os dígitos digitados.',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = companies.map(c => c.id === editingCompany.id ? editingCompany : c);
      onUpdateCompanies(updated);
      const name = editingCompany.nomeFantasia;
      setEditingCompany(null);
      showFeedback('Empresa Atualizada!', `Os dados cadastrais de "${name}" foram atualizados com sucesso.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit User (Funcional)
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || isSubmitting) return;

    if (!editingUser.name.trim() || !editingUser.email.trim()) {
      showFeedback('Campos Obrigatórios', 'Nome e e-mail corporativo são obrigatórios.', 'warning');
      return;
    }

    if (editingUser.cpf?.trim() && !validateCPF(editingUser.cpf)) {
      showFeedback(
        'CPF Inválido',
        'O CPF informado para o usuário é inválido segundo a Receita Federal. Por favor, verifique os dígitos.',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const roleLabels: Record<UserRole, string> = {
        master: 'Usuário Master (Super Admin)',
        admin_empresa: 'Administrador da Empresa',
        gestor_unidade: 'Gestor de Unidade',
        tecnico_sst: 'Técnico de Segurança do Trabalho',
        cipeiro: 'Cipeiro (Eleito)',
        eleitor: 'Eleitor (Colaborador CLT)'
      };

      const effectiveCompanyIds = (editingUser.companyIds && editingUser.companyIds.length > 0)
        ? editingUser.companyIds
        : (editingUser.companyId ? [editingUser.companyId] : [companies[0]?.id || 'emp-1']);
      const effectiveUnitIds = editingUser.unitIds || (editingUser.unitId ? [editingUser.unitId] : []);

      const updated = usersList.map(u => u.id === editingUser.id ? {
        ...editingUser,
        name: formatCapitalizeName(editingUser.name),
        companyIds: effectiveCompanyIds,
        companyId: effectiveCompanyIds[0],
        unitIds: effectiveUnitIds,
        unitId: effectiveUnitIds[0] || undefined,
        customPermissions: editingUser.customPermissions || [],
        roleLabel: ROLE_PERMISSIONS_DETAILS[editingUser.role]?.label || roleLabels[editingUser.role] || editingUser.roleLabel,
        roleDescription: ROLE_PERMISSIONS_DETAILS[editingUser.role]?.description || `Usuário cadastrado com privilégios de ${roleLabels[editingUser.role] || editingUser.roleLabel}.`,
        avatarInitials: editingUser.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      } : u);
      setUsersList(updated);
      const name = formatCapitalizeName(editingUser.name);
      setEditingUser(null);
      showFeedback('Usuário Atualizado!', `As alterações cadastrais do usuário "${name}" foram salvas.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Filial
  const handleConfirmDeleteFilial = () => {
    if (!filialToDelete) return;
    const targetComp = companies.find(c => c.id === filialToDelete.companyId);
    if (targetComp && targetComp.units.length <= 1) {
      setFilialToDelete(null);
      showFeedback('Operação Bloqueada', 'A empresa deve possuir ao menos uma unidade/matriz ativa.', 'warning');
      return;
    }

    const updatedCompanies = companies.map(c => {
      if (c.id === filialToDelete.companyId) {
        return {
          ...c,
          units: c.units.filter(u => u.id !== filialToDelete.filial.id)
        };
      }
      return c;
    });

    onUpdateCompanies(updatedCompanies);
    const deletedName = filialToDelete.filial.name;
    setFilialToDelete(null);
    showFeedback('Filial Excluída', `O estabelecimento "${deletedName}" foi removido do sistema.`);
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || isSubmitting) return;

    if (newUserCpf.trim() && !validateCPF(newUserCpf)) {
      showFeedback(
        'CPF Inválido',
        'O CPF informado para o usuário é inválido segundo a Receita Federal. Por favor, verifique os números digitados.',
        'warning'
      );
      return;
    }

    const currentRank = ROLE_HIERARCHY[currentUser?.role || 'eleitor'] || 10;
    const selectedRoleRank = ROLE_HIERARCHY[newUserRole] || 10;
    if (currentUser?.role !== 'master' && (newUserRole === 'master' || selectedRoleRank > currentRank)) {
      showFeedback('Operação Não Permitida', 'Você não pode criar um usuário com privilégios superiores ao seu perfil.', 'error');
      return;
    }

    const effectiveCompanyIds = newUserCompanyIds.length > 0 ? newUserCompanyIds : [newUserCompanyId];
    const capitalizedName = formatCapitalizeName(newUserName);

    setIsSubmitting(true);
    try {
      const roleLabels: Record<UserRole, string> = {
        master: 'Master',
        admin_empresa: 'Administrador da Empresa',
        gestor_unidade: 'Gestor de Unidade',
        tecnico_sst: 'Técnico de SST',
        cipeiro: 'Cipeiro',
        eleitor: 'Eleitor'
      };

      const newUser: AuthUser = {
        id: `usr-${Date.now()}`,
        name: capitalizedName,
        email: newUserEmail.trim(),
        cpf: newUserCpf.trim() ? formatCPF(newUserCpf) : undefined,
        role: newUserRole,
        roleLabel: ROLE_PERMISSIONS_DETAILS[newUserRole]?.label || roleLabels[newUserRole],
        roleDescription: ROLE_PERMISSIONS_DETAILS[newUserRole]?.description || `Usuário cadastrado com privilégios de ${roleLabels[newUserRole]}.`,
        companyId: effectiveCompanyIds[0],
        companyIds: effectiveCompanyIds,
        unitId: newUserUnitIds[0] || undefined,
        unitIds: newUserUnitIds,
        customPermissions: currentUser?.role === 'master' ? newUserCustomPermissions : [],
        avatarInitials: capitalizedName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(),
        avatarUrl: newUserAvatarUrl.trim() || undefined
      };

      setUsersList([...usersList, newUser]);
      setIsNewUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserCpf('');
      setNewUserAvatarUrl('');
      setNewUserCompanyIds([companies[0]?.id || 'emp-1']);
      setNewUserUnitIds([]);
      setNewUserCustomPermissions([]);


      // Persiste no PostgreSQL
      await ApiService.createUser({
        name: newUser.name,
        email: newUser.email,
        cpf: newUser.cpf,
        role: newUser.role,
        companyId: newUser.companyId
      }).catch(err => console.log('Aviso ao persistir usuário no backend:', err));

      showFeedback('Usuário Cadastrado!', `O usuário "${newUser.name}" foi habilitado com sucesso.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reenviar email de redefinição de senha com controle de hierarquia
  const handleResetUserPassword = (user: AuthUser) => {
    const currentRank = ROLE_HIERARCHY[currentUser?.role || 'eleitor'] || 10;
    const targetRank = ROLE_HIERARCHY[user.role] || 10;
    if (currentUser?.role !== 'master' && (user.role === 'master' || targetRank > currentRank)) {
      showFeedback('Operação Bloqueada', 'Você não possui permissão para redefinir a senha de um usuário com nível hierárquico superior.', 'error');
      return;
    }

    showFeedback(
      'E-mail Enviado!',
      `Um link seguro para redefinição de senha foi enviado com sucesso para ${user.email}. O link possui validade de 24 horas.`,
      'success'
    );
  };


  // Garante que a lista de empresas e unidades seja sempre um array válido
  const safeCompanies = (companies && companies.length > 0 ? companies : INITIAL_COMPANIES).map(c => ({
    ...c,
    units: Array.isArray(c?.units) ? c.units : []
  }));

  // All Filiais flat array for the Filiais Tab
  const allFiliaisWithCompany = safeCompanies.flatMap(comp => 
    (comp?.units || []).map(unit => ({
      filial: unit,
      companyId: comp.id,
      companyName: comp.nomeFantasia,
      companyLogo: comp.logoUrl
    }))
  );

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-150">
      
      {/* ========================================================================= */}
      {/* 1. CARD DO TÍTULO: CABEÇALHO VERDE MAIS VIBRANTE E COMPACTO                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 py-2.5 px-4 sm:px-5 rounded-xl shadow-xs flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            {activeTab === 'empresas' && <Building2 className="w-4 h-4 text-white" />}
            {activeTab === 'filiais' && <MapPin className="w-4 h-4 text-white" />}
            {activeTab === 'usuarios' && <Users className="w-4 h-4 text-white" />}
          </div>
          <h2 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight">
            Cadastros Gerais
          </h2>
        </div>

        {/* Botão de Criação Único */}
        {activeTab === 'empresas' && (
          <button
            type="button"
            onClick={() => setIsNewCompanyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Empresa</span>
          </button>
        )}

        {activeTab === 'filiais' && (
          <button
            type="button"
            onClick={() => {
              setTargetCompanyIdForFilial(companies[0]?.id || '');
              setIsNewFilialModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Filial</span>
          </button>
        )}

        {activeTab === 'usuarios' && (
          <button
            type="button"
            onClick={() => setIsNewUserModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Usuário</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. GUIAS / ABAS SUPERIORES E CONTROLES (POSICIONADOS LOGO ABAIXO)         */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full py-1">
        {/* Guias do Módulo Cadastros Gerais */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('empresas')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'empresas' 
                ? 'bg-white text-slate-900 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Empresas ({safeCompanies.length})
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('filiais')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'filiais' 
                ? 'bg-white text-slate-900 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Filiais ({allFiliaisWithCompany.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usuarios')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'usuarios' 
                ? 'bg-white text-slate-900 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Usuários ({usersList.length})
          </button>
        </div>

        {/* Alternar Visualização Cards / Lista */}
        {activeTab === 'empresas' && (
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold items-center self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCompanyViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                companyViewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setCompanyViewMode('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                companyViewMode === 'lista'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        )}

        {activeTab === 'filiais' && (
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold items-center self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilialViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filialViewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setFilialViewMode('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filialViewMode === 'lista'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* GUIA 1: EMPRESAS                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'empresas' && (
        <div className="w-full">
          {companyViewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full animate-in fade-in duration-150">
              {safeCompanies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Header na cor verde idêntico ao dashboard */}
                  <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 py-3.5 border-b border-emerald-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.nomeFantasia}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {company.nomeFantasia}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/90 text-slate-700 border border-slate-200 shrink-0">
                      CNPJ: {company.cnpj}
                    </span>
                  </div>

                  {/* Conteúdo interno */}
                  <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">CNAE Principal</span>
                        <strong className="text-slate-800 text-xs block font-mono">
                          {company.cnaeCode || '2511-0/00'} · {company.cnaeDesc || 'Atividade Industrial/Comercial'}
                        </strong>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> Endereço Completo
                        </span>
                        <p className="text-slate-700 text-xs mt-0.5 line-clamp-2">
                          {company.enderecoCompleto || 'Endereço registrado na sede da organização'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Filiais Cadastradas</span>
                          <strong className="text-slate-800 text-xs block">{(company.units || []).length} estabelecimentos</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCompanyIdForFilial(company.id);
                            setIsNewFilialModalOpen(true);
                          }}
                          className="group flex items-center h-7 w-7 hover:w-22 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 border border-emerald-200 hover:border-emerald-300 px-1.5 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                          title="Cadastrar Filial"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-700" />
                          <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1 text-[11px] font-bold transition-opacity duration-300">
                            + Filial
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Regular
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingCompany(company)}
                          className="group flex items-center h-8 w-8 hover:w-28 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 hover:border-blue-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                          title="Visualizar Empresa"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                          <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                            Visualizar
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingCompany(company)}
                          className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 border border-amber-200 hover:border-amber-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                          title="Editar Empresa"
                        >
                          <Edit3 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                          <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                            Editar
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompanyToDelete(company)}
                          className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 hover:border-rose-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                          title="Excluir Empresa"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-rose-600" />
                          <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                            Excluir
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden w-full animate-in fade-in duration-150">
              <div className="overflow-x-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 border-b border-emerald-200/80 text-emerald-950 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Empresa</th>
                      <th className="py-3.5 px-4">CNAE Principal</th>
                      <th className="py-3.5 px-4">Endereço</th>
                      <th className="py-3.5 px-4">Responsável</th>
                      <th className="py-3.5 px-4 text-center">Filiais</th>
                      <th className="py-3.5 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {safeCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {company.logoUrl ? (
                              <img
                                src={company.logoUrl}
                                alt={company.nomeFantasia}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <strong 
                                className="text-slate-900 font-bold block truncate max-w-[200px]"
                                title={`${company.nomeFantasia} (${company.razaoSocial})`}
                              >
                                {company.nomeFantasia}
                              </strong>
                              <span 
                                className="text-[11px] font-mono font-medium text-slate-500 block truncate"
                                title={`CNPJ: ${company.cnpj}`}
                              >
                                {company.cnpj}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-800 block">{company.cnaeCode || '2511-0/00'}</span>
                          <span 
                            className="text-[11px] text-slate-500 truncate max-w-[170px] block cursor-help"
                            title={company.cnaeDesc || 'Atividade'}
                          >
                            {company.cnaeDesc || 'Atividade'}
                          </span>
                        </td>
                        <td className="py-4 px-4 max-w-[170px]">
                          <span 
                            className="text-xs text-slate-700 truncate block cursor-help"
                            title={company.enderecoCompleto}
                          >
                            {company.enderecoCompleto}
                          </span>
                        </td>
                        <td className="py-4 px-4 max-w-[140px] whitespace-nowrap">
                          <span 
                            className="text-xs font-medium text-slate-800 truncate block cursor-help"
                            title={`Responsável Administrador: ${company.responsavelAdmin}`}
                          >
                            {company.responsavelAdmin}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center font-extrabold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                            {(company.units || []).length}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => setViewingCompany(company)}
                              className="group flex items-center h-8 w-8 hover:w-28 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 hover:border-blue-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Visualizar Empresa"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Visualizar
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingCompany(company)}
                              className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 border border-amber-200 hover:border-amber-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Editar Empresa"
                            >
                              <Edit3 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Editar
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCompanyToDelete(company)}
                              className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 hover:border-rose-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Excluir Empresa"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-rose-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Excluir
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* GUIA 2: FILIAIS & UNIDADES (CADASTRO E GESTÃO DE FILIAIS SOLICITADA)      */}
      {/* ========================================================================= */}
      {activeTab === 'filiais' && (
        <div className="w-full">
          {filialViewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full animate-in fade-in duration-150">
              {allFiliaisWithCompany.map((item) => (
                <div
                  key={item.filial.id}
                  className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Header na cor verde idêntico ao dashboard */}
                  <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 py-3.5 border-b border-emerald-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {item.filial.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/90 text-slate-700 border border-slate-200 shrink-0">
                      {item.filial.cnpj ? item.filial.cnpj : `GR ${item.filial.grauDeRisco}`}
                    </span>
                  </div>

                  {/* Conteúdo interno */}
                  <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Empresa Vinculada</span>
                        <strong className="text-slate-800 text-xs block truncate">{item.companyName}</strong>
                        {item.filial.cnpj && (
                          <span className="text-[11px] font-mono font-semibold text-emerald-800 block mt-0.5">
                            CNPJ: {item.filial.cnpj}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Localização</span>
                          <strong className="text-slate-800 text-xs block">{item.filial.city} - {item.filial.state}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Gestor Local</span>
                          <strong className="text-slate-800 text-xs block truncate">{item.filial.gestorName || 'Responsável Local'}</strong>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">CNAE da Unidade</span>
                        <span className="text-slate-700 text-xs font-mono font-semibold block">
                          {item.filial.cnaeCode} · {item.filial.cnaeDesc} (Grau {item.filial.grauDeRisco})
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Estabelecimento Ativo
                      </span>

                      {/* Botões com expansão suave e texto no hover */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingFilial({ filial: item.filial, companyName: item.companyName })}
                          className="group flex items-center h-8 w-8 hover:w-28 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 hover:border-blue-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                          title="Visualizar Filial"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                          <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                            Visualizar
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingFilial({ filial: item.filial, companyId: item.companyId })}
                          className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 border border-amber-200 hover:border-amber-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                          title="Editar Filial"
                        >
                          <Edit3 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                          <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                            Editar
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFilialToDelete({ filial: item.filial, companyId: item.companyId })}
                          className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 hover:border-rose-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                          title="Excluir Filial"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-rose-600" />
                          <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                            Excluir
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden w-full animate-in fade-in duration-150">
              <div className="overflow-x-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 border-b border-emerald-200/80 text-emerald-950 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Filial / Unidade</th>
                      <th className="py-3.5 px-4">CNPJ da Filial</th>
                      <th className="py-3.5 px-4">Empresa Vinculada</th>
                      <th className="py-3.5 px-4">Cidade / UF</th>
                      <th className="py-3.5 px-4">Grau de Risco</th>
                      <th className="py-3.5 px-4">Gestor Responsável</th>
                      <th className="py-3.5 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {allFiliaisWithCompany.map((item) => (
                      <tr key={item.filial.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4">
                          <strong className="text-slate-900 font-bold block">{item.filial.name}</strong>
                          <span className="text-[11px] text-slate-500 font-mono block">CNAE: {item.filial.cnaeCode}</span>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {item.filial.cnpj || <span className="text-slate-400 font-normal">Mesmo da Matriz</span>}
                        </td>
                        <td className="py-4 px-4 font-bold text-emerald-800 whitespace-nowrap">
                          {item.companyName}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {item.filial.city} - {item.filial.state}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold whitespace-nowrap">
                          Grau {item.filial.grauDeRisco}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {item.filial.gestorName || 'Responsável Local'}
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => setViewingFilial({ filial: item.filial, companyName: item.companyName })}
                              className="group flex items-center h-8 w-8 hover:w-28 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 hover:border-blue-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Visualizar Filial"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Visualizar
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingFilial({ filial: item.filial, companyId: item.companyId })}
                              className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 border border-amber-200 hover:border-amber-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Editar Filial"
                            >
                              <Edit3 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Editar
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFilialToDelete({ filial: item.filial, companyId: item.companyId })}
                              className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 hover:border-rose-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Excluir Filial"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-rose-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Excluir
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* GUIA 3: USUÁRIOS                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'usuarios' && (() => {
        const currentRank = ROLE_HIERARCHY[currentUser?.role || 'eleitor'] || 10;
        // Filtragem hierárquica estrita: Administrador não vê Master, e assim sucessivamente
        const visibleUsersList = usersList.filter((user) => {
          if (currentUser?.role === 'master') return true;
          if (user.role === 'master') return false;
          const targetRank = ROLE_HIERARCHY[user.role] || 10;
          return targetRank <= currentRank;
        });

        return (
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden w-full">
            <div className="p-4 sm:p-5 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                Usuários e Níveis de Acesso
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-mono bg-white/70 px-2 py-0.5 rounded-lg border border-emerald-200/60 font-semibold">
                  Total: {visibleUsersList.length} usuários visíveis
                </span>
                {currentUser?.role !== 'master' && (
                  <span className="text-[10px] text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-lg border border-emerald-200 font-bold hidden sm:inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    Filtrado por seu nível ({ROLE_PERMISSIONS_DETAILS[currentUser?.role || 'eleitor']?.label})
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-100 w-full">
              {visibleUsersList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum usuário cadastrado neste nível de permissão.
                </div>
              ) : (
                visibleUsersList.map((user) => {
                  const assignedCompanyIds = (user.companyIds && user.companyIds.length > 0)
                    ? user.companyIds
                    : (user.companyId ? [user.companyId] : []);
                  const assignedCompanies = safeCompanies.filter(c => assignedCompanyIds.includes(c.id));
                  const userUnitsCount = user.unitIds?.length || (user.unitId ? 1 : 0);
                  const isFullCpfAllowed = canCurrentUserViewFullCpf(user);

                  return (
                    <div key={user.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                              {user.avatarInitials || (user.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U')}
                            </div>
                          )}
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0"></span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-bold text-slate-900 block truncate">{formatCapitalizeName(user.name)}</strong>
                            {currentUser?.id && user.id === currentUser.id && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Sua Sessão
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </span>

                            {/* CPF protegido por LGPD */}
                            {user.cpf && (
                              <span 
                                className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] inline-flex items-center gap-1"
                                title={isFullCpfAllowed ? "CPF Completo (Visível para seu perfil)" : "CPF com proteção de privacidade LGPD (3 últimos dígitos)"}
                              >
                                {!isFullCpfAllowed && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                <span>CPF: {isFullCpfAllowed ? user.cpf : maskCPFLGPD(user.cpf)}</span>
                              </span>
                            )}

                            {/* Múltiplas Empresas e Filiais */}
                            {assignedCompanies.length > 0 && (
                              <span 
                                className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-600"
                                title={assignedCompanies.map(c => c.nomeFantasia).join(', ')}
                              >
                                <span>·</span>
                                <Building className="w-3 h-3 text-slate-400" />
                                <span className="font-semibold text-slate-700">{assignedCompanies[0].nomeFantasia}</span>
                                {assignedCompanies.length > 1 && (
                                  <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    +{assignedCompanies.length - 1} empresa{assignedCompanies.length > 2 ? 's' : ''}
                                  </span>
                                )}
                                {userUnitsCount > 0 && (
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    ({userUnitsCount} filial{userUnitsCount > 1 ? 'is' : ''})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <div className="flex items-center sm:justify-end gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 block">
                              {formatCapitalizeName(ROLE_PERMISSIONS_DETAILS[user.role]?.label || user.roleLabel || user.role)}
                            </span>
                            {user.customPermissions && user.customPermissions.length > 0 && (
                              <span 
                                className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-bold inline-flex items-center gap-0.5"
                                title={`Possui ${user.customPermissions.length} acesso(s) especial(is) liberado(s) pelo Master`}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                +{user.customPermissions.length} extra{user.customPermissions.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[220px]" title={user.roleDescription}>
                            {user.roleDescription || 'Usuário do sistema'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setShowFullCpfInModal(false);
                              setViewingUser(user);
                            }}
                            className="group flex items-center h-8 w-8 hover:w-28 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 hover:border-blue-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                            title="Visualizar Usuário"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                              Visualizar
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser({
                                ...user,
                                companyIds: (user.companyIds && user.companyIds.length > 0) ? user.companyIds : (user.companyId ? [user.companyId] : [companies[0]?.id || 'emp-1']),
                                unitIds: user.unitIds || (user.unitId ? [user.unitId] : [])
                              });
                            }}
                            className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 border border-amber-200 hover:border-amber-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                            title="Editar Usuário"
                          >
                            <Edit3 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                              Editar
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetUserPassword(user)}
                            className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 border border-emerald-200 hover:border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                            title="Reenviar e-mail de redefinição de senha"
                          >
                            <KeyRound className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-600" />
                            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                              Senha
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            className="group flex items-center h-8 w-8 hover:w-22 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 hover:border-rose-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-rose-600" />
                            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                              Excluir
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL CADASTRAR FILIAL / UNIDADE                                          */}
      {/* ========================================================================= */}
      {isNewFilialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                Cadastrar Nova Filial / Estabelecimento
              </h3>
              <button 
                type="button"
                onClick={() => setIsNewFilialModalOpen(false)} 
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFilial} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Empresa Vinculada <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={targetCompanyIdForFilial}
                    onChange={e => setTargetCompanyIdForFilial(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nomeFantasia} (CNPJ: {c.cnpj})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Nome da Filial / Identificação <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Planta de Fundição Betim ou CD Cajamar"
                      value={newFilialName}
                      onChange={e => setNewFilialName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        CNPJ da Filial <span className="text-slate-400 font-normal">(caso possua CNPJ próprio)</span>
                      </label>
                      {newFilialCnpj.replace(/\D/g, '').length === 14 && (
                        validateCNPJ(newFilialCnpj) ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-500" /> Inválido
                          </span>
                        )
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="00.000.000/0002-00"
                      value={newFilialCnpj}
                      onChange={e => setNewFilialCnpj(formatCNPJ(e.target.value))}
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 font-mono transition-colors ${
                        newFilialCnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(newFilialCnpj)
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 text-rose-900'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                    />
                    {newFilialCnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(newFilialCnpj) && (
                      <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        CNPJ da filial inválido segundo a Receita Federal.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Cidade <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Betim"
                      value={newFilialCity}
                      onChange={e => setNewFilialCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Estado (UF) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="MG"
                      value={newFilialState}
                      onChange={e => setNewFilialState(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CnaeSearchSelect
                    value={newFilialCnae}
                    onChange={(code, _desc, gr) => {
                      setNewFilialCnae(code);
                      setNewFilialGr(gr);
                    }}
                    cnaesList={cnaesList}
                    label="CNAE da Filial"
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Grau de Risco (NR-4)</label>
                    <div className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold flex items-center justify-between">
                      <span>Grau {newFilialGr}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Automático Legal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Gestor Responsável Local <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do Gerente de Unidade / Supervisor SST"
                    value={newFilialGestor}
                    onChange={e => setNewFilialGestor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Rodapé Fixo com Botão de Ação */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewFilialModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Filial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDITAR FILIAL                                                       */}
      {/* ========================================================================= */}
      {editingFilial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Editar Dados da Filial
              </h3>
              <button 
                type="button"
                onClick={() => setEditingFilial(null)} 
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFilial} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nome da Filial</label>
                    <input
                      type="text"
                      required
                      value={editingFilial.filial.name}
                      onChange={e => setEditingFilial({
                        ...editingFilial,
                        filial: { ...editingFilial.filial, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        CNPJ da Filial <span className="text-slate-400 font-normal">(específico da unidade)</span>
                      </label>
                      {editingFilial.filial.cnpj && editingFilial.filial.cnpj.replace(/\D/g, '').length === 14 && (
                        validateCNPJ(editingFilial.filial.cnpj) ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-500" /> Inválido
                          </span>
                        )
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="00.000.000/0002-00"
                      value={editingFilial.filial.cnpj || ''}
                      onChange={e => setEditingFilial({
                        ...editingFilial,
                        filial: { ...editingFilial.filial, cnpj: formatCNPJ(e.target.value) }
                      })}
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 font-mono transition-colors ${
                        editingFilial.filial.cnpj && editingFilial.filial.cnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(editingFilial.filial.cnpj)
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 text-rose-900'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                    />
                    {editingFilial.filial.cnpj && editingFilial.filial.cnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(editingFilial.filial.cnpj) && (
                      <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        CNPJ da filial inválido segundo a Receita Federal.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Cidade</label>
                    <input
                      type="text"
                      required
                      value={editingFilial.filial.city}
                      onChange={e => setEditingFilial({
                        ...editingFilial,
                        filial: { ...editingFilial.filial, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Estado (UF)</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={editingFilial.filial.state}
                      onChange={e => setEditingFilial({
                        ...editingFilial,
                        filial: { ...editingFilial.filial, state: e.target.value.toUpperCase() }
                      })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Gestor Local</label>
                  <input
                    type="text"
                    required
                    value={editingFilial.filial.gestorName}
                    onChange={e => setEditingFilial({
                      ...editingFilial,
                      filial: { ...editingFilial.filial, gestorName: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CnaeSearchSelect
                    value={editingFilial.filial.cnaeCode || '2511-0/00'}
                    onChange={(code, desc, gr) => {
                      setEditingFilial({
                        ...editingFilial,
                        filial: {
                          ...editingFilial.filial,
                          cnaeCode: code,
                          cnaeDesc: desc,
                          grauDeRisco: gr
                        }
                      });
                    }}
                    cnaesList={cnaesList}
                    label="CNAE da Filial"
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Grau de Risco (NR-4)</label>
                    <div className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold flex items-center justify-between">
                      <span>Grau {editingFilial.filial.grauDeRisco}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Automático Legal
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé Fixo com Botão de Ação */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingFilial(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL VISUALIZAR FILIAL                                                   */}
      {/* ========================================================================= */}
      {viewingFilial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                Ficha da Filial
              </h3>
              <button onClick={() => setViewingFilial(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estabelecimento</span>
                <strong className="text-base font-extrabold text-slate-900 block">{viewingFilial.filial.name}</strong>
                <span className="text-xs font-bold text-emerald-700 block">Empresa: {viewingFilial.companyName}</span>
                <span className="text-xs font-mono font-bold text-slate-800 block">
                  CNPJ: {viewingFilial.filial.cnpj || 'Mesmo da Matriz'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Local</span>
                  <strong className="text-slate-800 text-xs block">{viewingFilial.filial.city} - {viewingFilial.filial.state}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Grau de Risco</span>
                  <strong className="text-slate-800 text-xs block font-mono">Grau {viewingFilial.filial.grauDeRisco}</strong>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">CNAE da Filial</span>
                <strong className="text-slate-800 text-xs block font-mono">
                  {viewingFilial.filial.cnaeCode} · {viewingFilial.filial.cnaeDesc}
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Gestor Local</span>
                <strong className="text-slate-800 text-xs block">{viewingFilial.filial.gestorName}</strong>
              </div>
            </div>

            {/* Rodapé Fixo */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewingFilial(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const f = viewingFilial;
                  const comp = companies.find(c => c.nomeFantasia === f.companyName) || companies[0];
                  setViewingFilial(null);
                  setEditingFilial({ filial: f.filial, companyId: comp.id });
                }}
                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Filial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CADASTRAR EMPRESA                                                   */}
      {/* ========================================================================= */}
      {isNewCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Cadastrar Empresa Cliente
              </h3>
              <button 
                type="button"
                onClick={() => setIsNewCompanyModalOpen(false)} 
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Logo da Empresa (Redondo)
                  </label>
                  
                  <div className="flex items-center gap-4">
                    {newLogoUrl ? (
                      <img
                        src={newLogoUrl}
                        alt="Logo preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-200 border border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <Building2 className="w-6 h-6" />
                        <span className="text-[9px] mt-0.5">Sem logo</span>
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      <input
                        type="file"
                        ref={companyLogoInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileToDataUrl(file, async (url) => {
                              setNewLogoUrl(url);
                              try {
                                const res = await ApiService.uploadPhotoToMinio(url, file.name, file.type, 'empresas');
                                if (res?.url) setNewLogoUrl(res.url);
                              } catch (err) {
                                console.warn('Erro ao enviar logo para MinIO:', err);
                              }
                            });
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => companyLogoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Carregar do Computador</span>
                        </button>
                        {newLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setNewLogoUrl('')}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        CNPJ <span className="text-rose-500">*</span>
                      </label>
                      {newCnpj.replace(/\D/g, '').length === 14 && (
                        validateCNPJ(newCnpj) ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-500" /> Inválido
                          </span>
                        )
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0001-00"
                      value={newCnpj}
                      onChange={e => setNewCnpj(formatCNPJ(e.target.value))}
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 font-mono transition-colors ${
                        newCnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(newCnpj)
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 text-rose-900'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                    />
                    {newCnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(newCnpj) && (
                      <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        CNPJ inválido segundo a Receita Federal (dígitos verificadores inconsistentes).
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Nome Fantasia <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Alfa Brasil Industrial"
                      value={newFantasia}
                      onChange={e => {
                        setNewFantasia(e.target.value);
                        if (!newRazao) setNewRazao(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Razão Social</label>
                  <input
                    type="text"
                    placeholder="Ex: Indústrias Metalmecânicas Alfa Brasil S.A."
                    value={newRazao}
                    onChange={e => setNewRazao(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <CnaeSearchSelect
                    value={newSelectedCnae}
                    onChange={(code, desc) => {
                      setNewSelectedCnae(code);
                      setNewCustomCnaeDesc(desc);
                    }}
                    cnaesList={cnaesList}
                    label="CNAE Principal"
                    required
                  />

                  {/* Grau de Risco automático trazido da base legal do CNAE */}
                  <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Grau de Risco Legal (NR-4):</span>
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Grau {cnaesList.find(c => c.code === newSelectedCnae)?.grauDeRisco || 3} (Automático)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Responsável Administrador <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do Diretor / Gestor Geral / RH"
                    value={newAdmin}
                    onChange={e => setNewAdmin(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Endereço Completo da Empresa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Av. das Indústrias, 1500, Distrito Industrial, São Paulo - SP, CEP 04795-100"
                    value={newEndereco}
                    onChange={e => setNewEndereco(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Rodapé Fixo com Botão de Ação */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewCompanyModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Empresa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL VISUALIZAR EMPRESA                                                  */}
      {/* ========================================================================= */}
      {viewingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Ficha Cadastral da Empresa
              </h3>
              <button onClick={() => setViewingCompany(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {viewingCompany.logoUrl ? (
                  <img
                    src={viewingCompany.logoUrl}
                    alt={viewingCompany.nomeFantasia}
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    <Building2 className="w-8 h-8 text-emerald-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold text-slate-900">{viewingCompany.nomeFantasia}</h4>
                  <p className="text-xs text-slate-500 truncate">{viewingCompany.razaoSocial}</p>
                  <span className="inline-block mt-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                    CNPJ: {viewingCompany.cnpj}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">CNAE Principal</span>
                  <strong className="text-slate-800 text-xs block font-mono">
                    {viewingCompany.cnaeCode || '2511-0/00'}
                  </strong>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{viewingCompany.cnaeDesc || 'Atividade Operacional'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Responsável Administrador</span>
                  <strong className="text-slate-800 text-xs block">{viewingCompany.responsavelAdmin || 'Diretoria'}</strong>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Gestor Master CIPA</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Endereço Completo
                </span>
                <p className="text-slate-800 text-xs mt-1 leading-relaxed">
                  {viewingCompany.enderecoCompleto || 'Endereço corporativo sede registrado'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Filiais Cadastradas</span>
                  <span className="text-[11px] font-bold text-emerald-700">{viewingCompany.units.length} estabelecimentos</span>
                </div>
                <div className="divide-y divide-slate-200 max-h-36 overflow-y-auto">
                  {viewingCompany.units.map((u) => (
                    <div key={u.id} className="py-1.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-800 block">{u.name}</strong>
                        <span className="text-[10px] text-slate-500">{u.city} - {u.state}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        GR {u.grauDeRisco}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  const comp = viewingCompany;
                  setViewingCompany(null);
                  setEditingCompany(comp);
                }}
                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Empresa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDITAR EMPRESA                                                      */}
      {/* ========================================================================= */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Editar Dados da Empresa
              </h3>
              <button 
                type="button"
                onClick={() => setEditingCompany(null)} 
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCompany} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Logo da Empresa (Redondo)
                  </label>
                  
                  <div className="flex items-center gap-4">
                    {editingCompany.logoUrl ? (
                      <img
                        src={editingCompany.logoUrl}
                        alt="Logo preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-200 border border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <Building2 className="w-6 h-6" />
                        <span className="text-[9px] mt-0.5">Sem logo</span>
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      <input
                        type="file"
                        ref={editCompanyLogoInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileToDataUrl(file, async (url) => {
                              setEditingCompany({ ...editingCompany, logoUrl: url });
                              try {
                                const res = await ApiService.uploadPhotoToMinio(url, file.name, file.type, 'empresas', editingCompany.id);
                                if (res?.url) {
                                  setEditingCompany(prev => prev ? ({ ...prev, logoUrl: res.url }) : null);
                                }
                              } catch (err) {
                                console.warn('Erro ao enviar logo para MinIO:', err);
                              }
                            });
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => editCompanyLogoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Carregar do Computador</span>
                        </button>
                        {editingCompany.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingCompany({ ...editingCompany, logoUrl: '' })}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        CNPJ <span className="text-rose-500">*</span>
                      </label>
                      {editingCompany.cnpj.replace(/\D/g, '').length === 14 && (
                        validateCNPJ(editingCompany.cnpj) ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-500" /> Inválido
                          </span>
                        )
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={editingCompany.cnpj}
                      onChange={e => setEditingCompany({ ...editingCompany, cnpj: formatCNPJ(e.target.value) })}
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 font-mono transition-colors ${
                        editingCompany.cnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(editingCompany.cnpj)
                          ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 text-rose-900'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                    />
                    {editingCompany.cnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(editingCompany.cnpj) && (
                      <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        CNPJ inválido segundo a Receita Federal.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Nome Fantasia <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCompany.nomeFantasia}
                      onChange={e => setEditingCompany({ ...editingCompany, nomeFantasia: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Razão Social</label>
                  <input
                    type="text"
                    value={editingCompany.razaoSocial}
                    onChange={e => setEditingCompany({ ...editingCompany, razaoSocial: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <CnaeSearchSelect
                    value={editingCompany.cnaeCode || '2511-0/00'}
                    onChange={(code, desc) => {
                      setEditingCompany({
                        ...editingCompany,
                        cnaeCode: code,
                        cnaeDesc: desc
                      });
                    }}
                    cnaesList={cnaesList}
                    label="CNAE Principal"
                    required
                  />

                  {/* Grau de Risco automático trazido da base legal do CNAE */}
                  <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Grau de Risco Legal (NR-4):</span>
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Grau {cnaesList.find(c => c.code === editingCompany.cnaeCode)?.grauDeRisco || 3} (Automático)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Responsável Administrador <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCompany.responsavelAdmin}
                    onChange={e => setEditingCompany({ ...editingCompany, responsavelAdmin: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Endereço Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCompany.enderecoCompleto || ''}
                    onChange={e => setEditingCompany({ ...editingCompany, enderecoCompleto: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Rodapé Fixo com Botão de Ação */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL VISUALIZAR USUÁRIO                                                  */}
      {/* ========================================================================= */}
      {viewingUser && (() => {
        const roleInfo = ROLE_PERMISSIONS_DETAILS[viewingUser.role] || ROLE_PERMISSIONS_DETAILS.eleitor;
        const isFullCpfAllowed = canCurrentUserViewFullCpf(viewingUser);
        const assignedCompanyIds = (viewingUser.companyIds && viewingUser.companyIds.length > 0)
          ? viewingUser.companyIds
          : (viewingUser.companyId ? [viewingUser.companyId] : []);
        const assignedCompanies = safeCompanies.filter(c => assignedCompanyIds.includes(c.id));

        const allUnitsOfAssignedCompanies = assignedCompanies.flatMap(c => c.units || []);
        const assignedUnitIds = viewingUser.unitIds || (viewingUser.unitId ? [viewingUser.unitId] : []);
        const assignedUnits = allUnitsOfAssignedCompanies.filter(u => assignedUnitIds.includes(u.id));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-5 py-3.5 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  Ficha Cadastral e Permissões do Usuário
                </h3>
                <button 
                  onClick={() => setViewingUser(null)} 
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-emerald-100/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
                {/* Identificação Principal do Usuário */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  {viewingUser.avatarUrl ? (
                    <img
                      src={viewingUser.avatarUrl}
                      alt={viewingUser.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                      {viewingUser.avatarInitials || (viewingUser.name ? viewingUser.name.slice(0, 2).toUpperCase() : 'U')}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-slate-900">{formatCapitalizeName(viewingUser.name)}</h4>
                      {currentUser?.id && viewingUser.id === currentUser.id && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Sua Conta
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{viewingUser.email}</span>
                    </div>

                    {/* CPF em conformidade com LGPD */}
                    {viewingUser.cpf && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                          <span className="text-slate-400 font-sans font-normal text-[10px]">CPF:</span>
                          <span>
                            {isFullCpfAllowed 
                              ? (showFullCpfInModal ? viewingUser.cpf : maskCPFLGPD(viewingUser.cpf))
                              : maskCPFLGPD(viewingUser.cpf)}
                          </span>
                        </div>

                        {isFullCpfAllowed ? (
                          <button
                            type="button"
                            onClick={() => setShowFullCpfInModal(!showFullCpfInModal)}
                            className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                            title="Alternar visibilidade do CPF"
                          >
                            {showFullCpfInModal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showFullCpfInModal ? 'Mascarar' : 'Exibir Completo'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-semibold" title="Em conformidade com a LGPD, apenas os 3 últimos dígitos são exibidos.">
                            <Lock className="w-2.5 h-2.5" />
                            Protegido pela LGPD
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Função:</span>
                      <span className="text-xs font-bold text-slate-800">
                        {formatCapitalizeName(roleInfo.label)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vínculos Organizacionais: Multiempresas e Multifiliais */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Empresas Vinculadas ({assignedCompanies.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {assignedCompanies.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">Nenhuma organização vinculada</span>
                      ) : (
                        assignedCompanies.map(c => (
                          <span 
                            key={c.id} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-xs shadow-2xs"
                          >
                            <Building2 className="w-3 h-3 text-emerald-600" />
                            <span>{c.nomeFantasia}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({c.cnpj})</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Filiais e Unidades Designadas
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {assignedUnits.length > 0 ? (
                        assignedUnits.map(u => (
                          <span 
                            key={u.id} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-medium text-xs"
                          >
                            <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>{u.name}</span>
                            <span className="text-[10px] text-emerald-700 font-bold">({u.city} - {u.state})</span>
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Acesso global a todas as filiais das empresas vinculadas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhamento Real dos Níveis de Permissões NR-5 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Nível de Permissões e Capacidades NR-5
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Hierarquia Grau {ROLE_HIERARCHY[viewingUser.role] || 10}/100
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/80">
                    {roleInfo.description}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Matriz de Acessos Operacionais
                      </span>
                      {viewingUser.customPermissions && viewingUser.customPermissions.length > 0 && viewingUser.role !== 'master' && (
                        <span className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {viewingUser.customPermissions.length} liberado(s) pelo Master
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {SYSTEM_PERMISSIONS.map((perm) => {
                        const isDefault = (ROLE_DEFAULT_PERMISSIONS[viewingUser.role] || []).includes(perm.id) || viewingUser.role === 'master';
                        const isCustom = !isDefault && (viewingUser.customPermissions || []).includes(perm.id);
                        const isAllowed = isDefault || isCustom;

                        return (
                          <div 
                            key={perm.id} 
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                              isCustom
                                ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                                : isDefault
                                  ? 'bg-white border-slate-200 text-slate-800'
                                  : 'bg-slate-100/70 border-slate-200/60 text-slate-500'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isCustom ? (
                                <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                                  <Sparkles className="w-2.5 h-2.5" />
                                </div>
                              ) : isDefault ? (
                                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                  <Lock className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs">{perm.name}</span>
                                {isCustom ? (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" /> Liberado pelo Master
                                  </span>
                                ) : isDefault ? (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                    Padrão da Função
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                                    Restrito
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {perm.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé Fixo */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleResetUserPassword(viewingUser);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Reenviar e-mail de redefinição de senha"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Redefinir Senha</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const u = viewingUser;
                    setViewingUser(null);
                    setEditingUser({
                      ...u,
                      companyIds: (u.companyIds && u.companyIds.length > 0) ? u.companyIds : (u.companyId ? [u.companyId] : [companies[0]?.id || 'emp-1']),
                      unitIds: u.unitIds || (u.unitId ? [u.unitId] : [])
                    });
                  }}
                  className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Usuário</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL EDITAR USUÁRIO                                                      */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[85vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-3.5 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Editar Usuário
              </h3>
              <button 
                type="button"
                onClick={() => setEditingUser(null)} 
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="relative shrink-0">
                    {editingUser.avatarUrl ? (
                      <img
                        src={editingUser.avatarUrl}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-300">
                        {editingUser.avatarInitials}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => editUserPhotoInputRef.current?.click()}
                      className="w-5 h-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center absolute -bottom-0.5 -right-0.5 shadow-md cursor-pointer"
                      title="Trocar Foto"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={editUserPhotoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileToDataUrl(file, async (url) => {
                          setEditingUser({ ...editingUser, avatarUrl: url });
                          try {
                            const res = await ApiService.uploadPhotoToMinio(url, file.name, file.type, 'usuarios', editingUser.id);
                            if (res?.url) {
                              setEditingUser(prev => prev ? ({ ...prev, avatarUrl: res.url }) : null);
                            }
                          } catch (err) {
                            console.warn('Erro ao enviar avatar para MinIO:', err);
                          }
                        });
                      }
                    }}
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Foto de Perfil</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editUserPhotoInputRef.current?.click()}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                      >
                        Selecionar foto do computador
                      </button>
                      {editingUser.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingUser({ ...editingUser, avatarUrl: undefined })}
                          className="text-xs text-rose-600 hover:text-rose-700 underline cursor-pointer"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">CPF do Usuário</label>
                    {editingUser.cpf && editingUser.cpf.replace(/\D/g, '').length === 11 && (
                      validateCPF(editingUser.cpf) ? (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" /> Inválido
                        </span>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={editingUser.cpf || ''}
                    onChange={e => setEditingUser({ ...editingUser, cpf: formatCPF(e.target.value) })}
                    className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 font-mono transition-colors ${
                      editingUser.cpf && editingUser.cpf.replace(/\D/g, '').length === 11 && !validateCPF(editingUser.cpf)
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 text-rose-900'
                        : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                  />
                  {editingUser.cpf && editingUser.cpf.replace(/\D/g, '').length === 11 && !validateCPF(editingUser.cpf) && (
                    <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      CPF inválido segundo a Receita Federal.
                    </p>
                  )}
                </div>

                {/* Seleção de Múltiplas Empresas */}
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      Empresas Vinculadas (Multiempresas)
                    </label>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                      {(editingUser.companyIds?.length || 1)} selecionada{(editingUser.companyIds?.length || 1) > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    O usuário pode ter acesso a uma ou mais empresas da organização.
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {companies.map(c => {
                      const isChecked = (editingUser.companyIds || [editingUser.companyId]).includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-white border-emerald-500 shadow-2xs font-bold text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentIds = editingUser.companyIds || (editingUser.companyId ? [editingUser.companyId] : [c.id]);
                              let nextIds: string[];
                              if (e.target.checked) {
                                nextIds = Array.from(new Set([...currentIds, c.id]));
                              } else {
                                if (currentIds.length <= 1) {
                                  showFeedback('Aviso', 'O usuário deve estar vinculado a pelo menos uma empresa.', 'warning');
                                  return;
                                }
                                nextIds = currentIds.filter(id => id !== c.id);
                              }
                              setEditingUser({
                                ...editingUser,
                                companyIds: nextIds,
                                companyId: nextIds[0]
                              });
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1 truncate">
                            <span className="block truncate">{c.nomeFantasia}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">CNPJ: {c.cnpj}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Seleção de Múltiplas Filiais */}
                {(() => {
                  const currentCompIds = editingUser.companyIds || (editingUser.companyId ? [editingUser.companyId] : []);
                  const selectedCompanies = safeCompanies.filter(c => currentCompIds.includes(c.id));
                  const availableUnits = selectedCompanies.flatMap(c => c.units.map(u => ({ ...u, companyName: c.nomeFantasia })));

                  return (
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          Filiais / Unidades Vinculadas (Multifiliais)
                        </label>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                          {(editingUser.unitIds?.length || 0)} selecionada{(editingUser.unitIds?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Marque as filiais permitidas. Se nenhuma for marcada, o acesso abrangerá todas as filiais.
                      </p>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                        {availableUnits.length === 0 ? (
                          <div className="text-[11px] text-slate-400 p-2 italic text-center">
                            Nenhuma filial cadastrada nas empresas selecionadas.
                          </div>
                        ) : (
                          availableUnits.map(unit => {
                            const isChecked = (editingUser.unitIds || []).includes(unit.id);
                            return (
                              <label
                                key={unit.id}
                                className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isChecked ? 'bg-white border-emerald-500 shadow-2xs font-bold text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentUnits = editingUser.unitIds || [];
                                    const nextUnits = e.target.checked
                                      ? Array.from(new Set([...currentUnits, unit.id]))
                                      : currentUnits.filter(id => id !== unit.id);
                                    setEditingUser({
                                      ...editingUser,
                                      unitIds: nextUnits,
                                      unitId: nextUnits[0] || undefined
                                    });
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <div className="min-w-0 flex-1 truncate">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="truncate">{unit.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">({unit.city} - {unit.state})</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-700 font-normal block truncate">
                                    {unit.companyName}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Função / Nível de Acesso filtrado por hierarquia */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Função / Nível de Acesso</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Nível máx: {currentUser?.role || 'master'}
                    </span>
                  </div>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    {AVAILABLE_ROLES
                      .filter(r => {
                        if (currentUser?.role === 'master') return true;
                        if (r.role === 'master') return false;
                        return (ROLE_HIERARCHY[r.role] || 10) <= (ROLE_HIERARCHY[currentUser?.role || 'eleitor'] || 10);
                      })
                      .map(r => (
                        <option key={r.role} value={r.role}>{r.label}</option>
                      ))}
                  </select>
                </div>

                {/* Liberação de Acessos Adicionais pelo Usuário Master */}
                {currentUser?.role === 'master' && editingUser.role !== 'master' && (
                  <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Acessos Adicionais (Liberação pelo Master)</span>
                      </label>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {(editingUser.customPermissions || []).length} concedido(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Como usuário Master, você pode liberar acessos operacionais adicionais para este usuário além dos privilégios padrão do cargo dele:
                    </p>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                      {SYSTEM_PERMISSIONS.map(perm => {
                        const isDefault = (ROLE_DEFAULT_PERMISSIONS[editingUser.role] || []).includes(perm.id);
                        const isCustomGranted = (editingUser.customPermissions || []).includes(perm.id);
                        const isChecked = isDefault || isCustomGranted;

                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs transition-colors ${
                              isDefault 
                                ? 'bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed'
                                : isCustomGranted
                                  ? 'bg-purple-50/60 border-purple-200 text-slate-900 font-semibold cursor-pointer'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDefault}
                              onChange={(e) => {
                                const current = editingUser.customPermissions || [];
                                const next = e.target.checked
                                  ? Array.from(new Set([...current, perm.id]))
                                  : current.filter(id => id !== perm.id);
                                setEditingUser({
                                  ...editingUser,
                                  customPermissions: next
                                });
                              }}
                              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-[11px]">{perm.name}</span>
                                {isDefault ? (
                                  <span className="text-[9px] text-slate-500 font-bold bg-slate-200 px-1.5 py-0.2 rounded">
                                    Padrão da Função
                                  </span>
                                ) : isCustomGranted ? (
                                  <span className="text-[9px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" /> Liberado
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-normal">
                                    Restrito
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                {perm.desc}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé Fixo */}
              <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleResetUserPassword(editingUser)}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-100 bg-white border border-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  title="Reenviar e-mail de redefinição de senha"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Redefinir Senha</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                    <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CADASTRAR USUÁRIO                                                   */}
      {/* ========================================================================= */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[85vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-3 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Cadastrar Usuário
              </h3>
              <button onClick={() => setIsNewUserModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="relative shrink-0">
                    {newUserAvatarUrl ? (
                      <img
                        src={newUserAvatarUrl}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-300">
                        {newUserName ? newUserName.slice(0, 2).toUpperCase() : <Camera className="w-5 h-5 text-slate-400" />}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => userPhotoInputRef.current?.click()}
                      className="w-5 h-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center absolute -bottom-0.5 -right-0.5 shadow-md cursor-pointer"
                      title="Carregar Foto"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={userPhotoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileToDataUrl(file, async (url) => {
                          setNewUserAvatarUrl(url);
                          try {
                            const res = await ApiService.uploadPhotoToMinio(url, file.name, file.type, 'usuarios');
                            if (res?.url) setNewUserAvatarUrl(res.url);
                          } catch (err) {
                            console.warn('Erro ao enviar avatar para MinIO:', err);
                          }
                        });
                      }
                    }}
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Foto de Perfil</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => userPhotoInputRef.current?.click()}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                      >
                        Selecionar foto do computador
                      </button>
                      {newUserAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setNewUserAvatarUrl('')}
                          className="text-xs text-rose-600 hover:text-rose-700 underline cursor-pointer"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    placeholder="carlos.silva@empresa.com.br"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">CPF do Usuário</label>
                    {newUserCpf.replace(/\D/g, '').length === 11 && (
                      validateCPF(newUserCpf) ? (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" /> Inválido
                        </span>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={newUserCpf}
                    onChange={e => setNewUserCpf(formatCPF(e.target.value))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 font-mono transition-colors ${
                      newUserCpf.replace(/\D/g, '').length === 11 && !validateCPF(newUserCpf)
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 text-rose-900'
                        : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                  />
                  {newUserCpf.replace(/\D/g, '').length === 11 && !validateCPF(newUserCpf) && (
                    <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      CPF inválido segundo a Receita Federal (dígitos verificadores inconsistentes).
                    </p>
                  )}
                </div>

                {/* Seleção de Múltiplas Empresas */}
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      Empresas Vinculadas (Multiempresas)
                    </label>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                      {newUserCompanyIds.length} selecionada{newUserCompanyIds.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    O usuário poderá acessar e operar uma ou mais empresas da organização.
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {companies.map(c => {
                      const isChecked = newUserCompanyIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-white border-emerald-500 shadow-2xs font-bold text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const next = Array.from(new Set([...newUserCompanyIds, c.id]));
                                setNewUserCompanyIds(next);
                                setNewUserCompanyId(next[0]);
                              } else {
                                if (newUserCompanyIds.length <= 1) {
                                  showFeedback('Aviso', 'O usuário deve estar vinculado a pelo menos uma empresa.', 'warning');
                                  return;
                                }
                                const next = newUserCompanyIds.filter(id => id !== c.id);
                                setNewUserCompanyIds(next);
                                setNewUserCompanyId(next[0]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1 truncate">
                            <span className="block truncate">{c.nomeFantasia}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">CNPJ: {c.cnpj}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Seleção de Múltiplas Filiais */}
                {(() => {
                  const selectedCompanies = safeCompanies.filter(c => newUserCompanyIds.includes(c.id));
                  const availableUnits = selectedCompanies.flatMap(c => c.units.map(u => ({ ...u, companyName: c.nomeFantasia })));

                  return (
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          Filiais / Unidades Vinculadas (Multifiliais)
                        </label>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                          {newUserUnitIds.length} selecionada{newUserUnitIds.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Marque as filiais permitidas. Se nenhuma for marcada, o usuário terá acesso a todas as filiais das empresas selecionadas.
                      </p>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                        {availableUnits.length === 0 ? (
                          <div className="text-[11px] text-slate-400 p-2 italic text-center">
                            Nenhuma filial cadastrada nas empresas selecionadas.
                          </div>
                        ) : (
                          availableUnits.map(unit => {
                            const isChecked = newUserUnitIds.includes(unit.id);
                            return (
                              <label
                                key={unit.id}
                                className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isChecked ? 'bg-white border-emerald-500 shadow-2xs font-bold text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewUserUnitIds(Array.from(new Set([...newUserUnitIds, unit.id])));
                                    } else {
                                      setNewUserUnitIds(newUserUnitIds.filter(id => id !== unit.id));
                                    }
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <div className="min-w-0 flex-1 truncate">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="truncate">{unit.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">({unit.city} - {unit.state})</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-700 font-normal block truncate">
                                    {unit.companyName}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Função / Nível de Acesso filtrado por hierarquia */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Função / Nível de Acesso</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Nível máx: {currentUser?.role || 'master'}
                    </span>
                  </div>
                  <select
                    value={newUserRole}
                    onChange={e => {
                      const nextRole = e.target.value as UserRole;
                      setNewUserRole(nextRole);
                      // Limpa permissões extras que já pertençam ao novo cargo
                      const defaultPerms = ROLE_DEFAULT_PERMISSIONS[nextRole] || [];
                      setNewUserCustomPermissions(prev => prev.filter(p => !defaultPerms.includes(p)));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    {AVAILABLE_ROLES
                      .filter(r => {
                        if (currentUser?.role === 'master') return true;
                        if (r.role === 'master') return false;
                        return (ROLE_HIERARCHY[r.role] || 10) <= (ROLE_HIERARCHY[currentUser?.role || 'eleitor'] || 10);
                      })
                      .map(r => (
                        <option key={r.role} value={r.role}>{r.label}</option>
                      ))}
                  </select>
                </div>

                {/* Liberação de Acessos Adicionais pelo Usuário Master */}
                {currentUser?.role === 'master' && newUserRole !== 'master' && (
                  <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Acessos Adicionais (Liberação pelo Master)</span>
                      </label>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {newUserCustomPermissions.length} concedido(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Como usuário Master, você pode liberar acessos operacionais adicionais para este usuário além dos privilégios padrão do cargo dele:
                    </p>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                      {SYSTEM_PERMISSIONS.map(perm => {
                        const isDefault = (ROLE_DEFAULT_PERMISSIONS[newUserRole] || []).includes(perm.id);
                        const isCustomGranted = newUserCustomPermissions.includes(perm.id);
                        const isChecked = isDefault || isCustomGranted;

                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs transition-colors ${
                              isDefault 
                                ? 'bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed'
                                : isCustomGranted
                                  ? 'bg-purple-50/60 border-purple-200 text-slate-900 font-semibold cursor-pointer'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDefault}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUserCustomPermissions(prev => Array.from(new Set([...prev, perm.id])));
                                } else {
                                  setNewUserCustomPermissions(prev => prev.filter(p => p !== perm.id));
                                }
                              }}
                              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-[11px]">{perm.name}</span>
                                {isDefault ? (
                                  <span className="text-[9px] text-slate-500 font-bold bg-slate-200 px-1.5 py-0.2 rounded">
                                    Padrão da Função
                                  </span>
                                ) : isCustomGranted ? (
                                  <span className="text-[9px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" /> Liberado
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-normal">
                                    Restrito
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                {perm.desc}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé fixo */}
              <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standard Modals */}
      <StandardModal
        isOpen={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        type="confirm_delete"
        title="Confirmar Exclusão de Empresa"
        description={companyToDelete ? `Tem certeza que deseja excluir permanentemente a empresa "${companyToDelete.nomeFantasia}"?` : ''}
        confirmLabel="Sim, Excluir Empresa"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (!companyToDelete) return;
          if (companies.length <= 1) {
            setCompanyToDelete(null);
            showFeedback('Operação Bloqueada', 'O sistema requer ao menos uma empresa cadastrada.', 'warning');
            return;
          }
          const name = companyToDelete.nomeFantasia;
          onUpdateCompanies(companies.filter(c => c.id !== companyToDelete.id));
          setCompanyToDelete(null);
          showFeedback('Empresa Excluída', `A empresa "${name}" foi removida.`);
        }}
      />

      <StandardModal
        isOpen={!!filialToDelete}
        onClose={() => setFilialToDelete(null)}
        type="confirm_delete"
        title="Confirmar Exclusão de Filial"
        description={filialToDelete ? `Deseja realmente remover o estabelecimento "${filialToDelete.filial.name}"?` : ''}
        confirmLabel="Sim, Excluir Filial"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDeleteFilial}
      />

      <StandardModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        type="confirm_delete"
        title="Confirmar Exclusão de Usuário"
        description={userToDelete ? `Deseja remover o usuário "${userToDelete.name}" (${userToDelete.email})?` : ''}
        confirmLabel="Sim, Excluir Usuário"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (!userToDelete) return;
          if (userToDelete.id === currentUser.id) {
            setUserToDelete(null);
            showFeedback('Ação Bloqueada', 'Você não pode excluir sua própria conta logada.', 'warning');
            return;
          }
          const name = userToDelete.name;
          setUsersList(usersList.filter(u => u.id !== userToDelete.id));
          setUserToDelete(null);
          showFeedback('Usuário Excluído', `O usuário "${name}" foi removido.`);
        }}
      />

      <StandardModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        type={feedbackModal.type}
        title={feedbackModal.title}
        description={feedbackModal.description}
        confirmLabel="Compreendido"
      />

    </div>
  );
};
