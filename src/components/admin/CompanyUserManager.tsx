import React, { useState, useRef } from 'react';
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
  KeyRound
} from 'lucide-react';
import { Company, CompanyUnit, UserRole, AuthUser } from '../../types/auth';
import { DEMO_USERS } from '../../data/multiCompanyData';
import { CNAE_DATABASE } from '../../data/cnaeData';
import { StandardModal } from '../common/StandardModal';

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
  const [companyViewMode, setCompanyViewMode] = useState<'cards' | 'lista'>('cards');
  const [filialViewMode, setFilialViewMode] = useState<'cards' | 'lista'>('cards');
  
  // Registration Modals
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
  // New User Form State
  // ==========================================
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('tecnico_sst');
  const [newUserCompanyId, setNewUserCompanyId] = useState(companies[0]?.id || 'emp-1');
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState('');

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80'
  ];

  const logoPresets = [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=160&h=160&q=80',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=160&h=160&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=160&h=160&q=80'
  ];

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
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCnpj.trim() || !newFantasia.trim() || !newAdmin.trim() || !newEndereco.trim() || !newSelectedCnae) {
      showFeedback('Campos Obrigatórios', 'CNPJ, CNAE, Nome Fantasia, Responsável Administrador e Endereço Completo são obrigatórios.', 'warning');
      return;
    }

    const cnaeObj = CNAE_DATABASE.find(c => c.code === newSelectedCnae);
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
  };

  // Create Filial / Unit
  const handleCreateFilial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompanyIdForFilial || !newFilialName.trim() || !newFilialCity.trim() || !newFilialGestor.trim()) {
      showFeedback('Campos Obrigatórios', 'Selecione a empresa e informe o nome da filial, cidade e gestor local.', 'warning');
      return;
    }

    const cnaeObj = CNAE_DATABASE.find(c => c.code === newFilialCnae);

    const newUnit: CompanyUnit = {
      id: `unit-${Date.now()}`,
      name: newFilialName.trim(),
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

    const targetCompName = companies.find(c => c.id === targetCompanyIdForFilial)?.nomeFantasia || 'Empresa';
    setNewFilialName('');
    setNewFilialCity('');
    setNewFilialGestor('');

    showFeedback(
      'Filial Cadastrada com Sucesso!',
      `O estabelecimento "${newUnit.name}" foi vinculado à organização "${targetCompName}".`
    );
  };

  // Save Edit Filial
  const handleSaveEditFilial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFilial) return;

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
  };

  // Save Edit Company (Funcional)
  const handleSaveEditCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    const updated = companies.map(c => c.id === editingCompany.id ? editingCompany : c);
    onUpdateCompanies(updated);
    const name = editingCompany.nomeFantasia;
    setEditingCompany(null);
    showFeedback('Empresa Atualizada!', `Os dados cadastrais de "${name}" foram atualizados com sucesso.`);
  };

  // Save Edit User (Funcional)
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const roleLabels: Record<UserRole, string> = {
      master: 'Usuário Master (Super Admin)',
      admin_empresa: 'Administrador da Empresa',
      gestor_unidade: 'Gestor de Unidade',
      tecnico_sst: 'Técnico de Segurança do Trabalho',
      cipeiro: 'Cipeiro (Eleito)',
      eleitor: 'Eleitor (Colaborador CLT)'
    };

    const updated = usersList.map(u => u.id === editingUser.id ? {
      ...editingUser,
      roleLabel: roleLabels[editingUser.role] || editingUser.roleLabel,
      roleDescription: `Usuário cadastrado com privilégios de ${roleLabels[editingUser.role] || editingUser.roleLabel}.`,
      avatarInitials: editingUser.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    } : u);
    setUsersList(updated);
    const name = editingUser.name;
    setEditingUser(null);
    showFeedback('Usuário Atualizado!', `As alterações cadastrais do usuário "${name}" foram salvas.`);
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
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const roleLabels: Record<UserRole, string> = {
      master: 'Usuário Master (Super Admin)',
      admin_empresa: 'Administrador da Empresa',
      gestor_unidade: 'Gestor de Unidade',
      tecnico_sst: 'Técnico de Segurança do Trabalho',
      cipeiro: 'Cipeiro (Eleito)',
      eleitor: 'Eleitor (Colaborador CLT)'
    };

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      roleLabel: roleLabels[newUserRole],
      roleDescription: `Usuário cadastrado com privilégios de ${roleLabels[newUserRole]}.`,
      companyId: newUserCompanyId,
      avatarInitials: newUserName.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(),
      avatarUrl: newUserAvatarUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
    };

    setUsersList([...usersList, newUser]);
    setIsNewUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserAvatarUrl('');

    showFeedback('Usuário Cadastrado!', `O usuário "${newUser.name}" foi habilitado com sucesso.`);
  };

  // Reenviar email de redefinição de senha
  const handleResetUserPassword = (user: AuthUser) => {
    showFeedback(
      'E-mail Enviado!',
      `Um link seguro para redefinição de senha foi enviado com sucesso para ${user.email}. O link possui validade de 24 horas.`,
      'success'
    );
  };

  // All Filiais flat array for the Filiais Tab
  const allFiliaisWithCompany = companies.flatMap(comp => 
    comp.units.map(unit => ({
      filial: unit,
      companyId: comp.id,
      companyName: comp.nomeFantasia,
      companyLogo: comp.logoUrl
    }))
  );

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-150">
      
      {/* ========================================================================= */}
      {/* 1. CARD DO TÍTULO: CABEÇALHO NA COR VERDE CLARO                           */}
      {/* ========================================================================= */}
      <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            {activeTab === 'empresas' && <Building2 className="w-5 h-5 text-emerald-700" />}
            {activeTab === 'filiais' && <MapPin className="w-5 h-5 text-emerald-700" />}
            {activeTab === 'usuarios' && <Users className="w-5 h-5 text-emerald-700" />}
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Cadastros Gerais
          </h2>
        </div>

        {/* Botão de Criação Único (Sem duplicar o '+') */}
        {activeTab === 'empresas' && (
          <button
            type="button"
            onClick={() => setIsNewCompanyModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
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
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Filial</span>
          </button>
        )}

        {activeTab === 'usuarios' && (
          <button
            type="button"
            onClick={() => setIsNewUserModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
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
            Empresas ({companies.length})
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
            Filiais & Unidades ({allFiliaisWithCompany.length})
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
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Header na cor verde claro idêntico ao dashboard */}
                  <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
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
                          <strong className="text-slate-800 text-xs block">{company.units.length} estabelecimentos</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCompanyIdForFilial(company.id);
                            setIsNewFilialModalOpen(true);
                          }}
                          className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-2xs active:scale-95"
                          title="Cadastrar Filial"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Visualizar Empresa"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingCompany(company)}
                          className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Editar Empresa"
                        >
                          <Edit3 className="w-4 h-4 text-amber-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompanyToDelete(company)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Excluir Empresa"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
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
                    <tr className="bg-emerald-50/80 border-b border-emerald-200/80 text-emerald-950 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Empresa & Logo</th>
                      <th className="py-3.5 px-4">CNPJ</th>
                      <th className="py-3.5 px-4">CNAE Principal</th>
                      <th className="py-3.5 px-4">Endereço Completo</th>
                      <th className="py-3.5 px-4">Responsável</th>
                      <th className="py-3.5 px-4">Filiais</th>
                      <th className="py-3.5 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {companies.map((company) => (
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
                              <strong className="text-slate-900 font-bold block truncate max-w-[200px]">{company.nomeFantasia}</strong>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">{company.razaoSocial}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-600 font-semibold whitespace-nowrap">
                          {company.cnpj}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-800 block">{company.cnaeCode || '2511-0/00'}</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[180px] block">{company.cnaeDesc || 'Atividade'}</span>
                        </td>
                        <td className="py-4 px-4 max-w-[220px]">
                          <span className="text-xs text-slate-700 line-clamp-2">
                            {company.enderecoCompleto}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {company.responsavelAdmin}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">{company.units.length} estabelecimentos</span>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <button
                              onClick={() => setViewingCompany(company)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Visualizar Empresa"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => setEditingCompany(company)}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Empresa"
                            >
                              <Edit3 className="w-4 h-4 text-amber-600" />
                            </button>
                            <button
                              onClick={() => setCompanyToDelete(company)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Empresa"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
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
                  {/* Header na cor verde claro idêntico ao dashboard */}
                  <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {item.filial.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/90 text-slate-700 border border-slate-200 shrink-0">
                      GR {item.filial.grauDeRisco}
                    </span>
                  </div>

                  {/* Conteúdo interno */}
                  <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Empresa Vinculada</span>
                        <strong className="text-slate-800 text-xs block truncate">{item.companyName}</strong>
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
                          {item.filial.cnaeCode} · {item.filial.cnaeDesc}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Estabelecimento Ativo
                      </span>

                      {/* Botões com apenas o ícone sem escrita para não ultrapassar o card */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingFilial({ filial: item.filial, companyName: item.companyName })}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Visualizar Filial"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingFilial({ filial: item.filial, companyId: item.companyId })}
                          className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Editar Filial"
                        >
                          <Edit3 className="w-4 h-4 text-amber-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setFilialToDelete({ filial: item.filial, companyId: item.companyId })}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Excluir Filial"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
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
                    <tr className="bg-emerald-50/80 border-b border-emerald-200/80 text-emerald-950 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Filial / Unidade</th>
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
                              onClick={() => setViewingFilial({ filial: item.filial, companyName: item.companyName })}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Visualizar Filial"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => setEditingFilial({ filial: item.filial, companyId: item.companyId })}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Filial"
                            >
                              <Edit3 className="w-4 h-4 text-amber-600" />
                            </button>
                            <button
                              onClick={() => setFilialToDelete({ filial: item.filial, companyId: item.companyId })}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Filial"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
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
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden w-full">
          <div className="p-4 sm:p-5 border-b border-emerald-200/80 bg-emerald-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              Usuários e Níveis de Acesso
            </span>
            <span className="text-xs text-slate-600 font-mono">
              Total: {usersList.length} usuários cadastrados
            </span>
          </div>

          <div className="divide-y divide-slate-100 w-full">
            {usersList.map((user) => {
              const userComp = companies.find(c => c.id === user.companyId);

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
                          {user.avatarInitials}
                        </div>
                      )}
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0"></span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 block truncate">{user.name}</strong>
                        {user.id === currentUser.id && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Sua Sessão
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                        {userComp && (
                          <span className="hidden md:inline text-slate-400">· {userComp.nomeFantasia}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-emerald-700 block">
                        {user.roleLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                        {user.roleDescription}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingUser(user)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Visualizar Usuário"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar Usuário"
                      >
                        <Edit3 className="w-4 h-4 text-amber-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetUserPassword(user)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Reenviar e-mail de redefinição de senha"
                      >
                        <KeyRound className="w-4 h-4 text-emerald-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CADASTRAR FILIAL / UNIDADE                                          */}
      {/* ========================================================================= */}
      {isNewFilialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                Cadastrar Nova Filial / Estabelecimento
              </h3>
              <button onClick={() => setIsNewFilialModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFilial} className="p-6 space-y-4 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">CNAE da Filial</label>
                  <select
                    value={newFilialCnae}
                    onChange={e => {
                      setNewFilialCnae(e.target.value);
                      const sel = CNAE_DATABASE.find(c => c.code === e.target.value);
                      if (sel) setNewFilialGr(sel.grauDeRisco);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  >
                    {CNAE_DATABASE.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - GR {c.grauDeRisco}</option>
                    ))}
                  </select>
                </div>

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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Cadastrar Filial
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Editar Dados da Filial
              </h3>
              <button onClick={() => setEditingFilial(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFilial} className="p-6 space-y-4 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">CNAE da Filial</label>
                  <select
                    value={editingFilial.filial.cnaeCode || CNAE_DATABASE[10].code}
                    onChange={e => {
                      const sel = CNAE_DATABASE.find(c => c.code === e.target.value);
                      setEditingFilial({
                        ...editingFilial,
                        filial: {
                          ...editingFilial.filial,
                          cnaeCode: e.target.value,
                          cnaeDesc: sel?.description || editingFilial.filial.cnaeDesc,
                          grauDeRisco: (sel ? sel.grauDeRisco : editingFilial.filial.grauDeRisco) as 1 | 2 | 3 | 4
                        }
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  >
                    {CNAE_DATABASE.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - GR {c.grauDeRisco}</option>
                    ))}
                  </select>
                </div>

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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Salvar Alterações
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
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between">
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
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Gestor Local</span>
                <strong className="text-slate-800 text-xs block">{viewingFilial.filial.gestorName}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CADASTRAR EMPRESA                                                   */}
      {/* ========================================================================= */}
      {isNewCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Cadastrar Empresa Cliente
              </h3>
              <button onClick={() => setIsNewCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-6 space-y-4 overflow-y-auto text-xs">
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
                          handleFileToDataUrl(file, url => setNewLogoUrl(url));
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
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400">Sugestões:</span>
                      {logoPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewLogoUrl(preset)}
                          className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    CNPJ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={newCnpj}
                    onChange={e => setNewCnpj(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
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
                <label className="text-xs font-bold text-slate-700">
                  CNAE Principal <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newSelectedCnae}
                  onChange={e => {
                    setNewSelectedCnae(e.target.value);
                    const selected = CNAE_DATABASE.find(c => c.code === e.target.value);
                    if (selected) setNewCustomCnaeDesc(selected.description);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  {CNAE_DATABASE.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.description} (Grau de Risco {c.grauDeRisco})
                    </option>
                  ))}
                </select>

                {/* Grau de Risco automático trazido da base legal do CNAE */}
                <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Grau de Risco Legal (NR-4):</span>
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Grau {CNAE_DATABASE.find(c => c.code === newSelectedCnae)?.grauDeRisco || 3} (Automático)
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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Salvar Empresa
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
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between">
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Editar Dados da Empresa
              </h3>
              <button onClick={() => setEditingCompany(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCompany} className="p-6 space-y-4 overflow-y-auto text-xs">
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
                          handleFileToDataUrl(file, url => setEditingCompany({ ...editingCompany, logoUrl: url }));
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
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400">Sugestões:</span>
                      {logoPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditingCompany({ ...editingCompany, logoUrl: preset })}
                          className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    CNPJ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCompany.cnpj}
                    onChange={e => setEditingCompany({ ...editingCompany, cnpj: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
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
                <label className="text-xs font-bold text-slate-700">
                  CNAE Principal <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editingCompany.cnaeCode || CNAE_DATABASE[10].code}
                  onChange={e => {
                    const sel = CNAE_DATABASE.find(c => c.code === e.target.value);
                    setEditingCompany({
                      ...editingCompany,
                      cnaeCode: e.target.value,
                      cnaeDesc: sel ? sel.description : editingCompany.cnaeDesc
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  {CNAE_DATABASE.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.description} (Grau de Risco {c.grauDeRisco})
                    </option>
                  ))}
                </select>

                {/* Grau de Risco automático trazido da base legal do CNAE */}
                <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Grau de Risco Legal (NR-4):</span>
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Grau {CNAE_DATABASE.find(c => c.code === editingCompany.cnaeCode)?.grauDeRisco || 3} (Automático)
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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL VISUALIZAR USUÁRIO                                                  */}
      {/* ========================================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[85vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-3 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Ficha do Usuário
              </h3>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {viewingUser.avatarUrl ? (
                  <img
                    src={viewingUser.avatarUrl}
                    alt={viewingUser.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0">
                    {viewingUser.avatarInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold text-slate-900">{viewingUser.name}</h4>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{viewingUser.email}</span>
                  </div>
                  <span className="inline-block mt-1.5 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                    {viewingUser.roleLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Empresa Vinculada</span>
                  <strong className="text-slate-800 text-xs block">
                    {companies.find(c => c.id === viewingUser.companyId)?.nomeFantasia || 'Todas as Organizações (Master)'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nível de Permissões NR-5</span>
                  <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">
                    {viewingUser.roleDescription}
                  </p>
                </div>
              </div>
            </div>

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
                  setEditingUser(u);
                }}
                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Usuário</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDITAR USUÁRIO                                                      */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[85vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-3 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Editar Usuário
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1 overscroll-contain">
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
                      handleFileToDataUrl(file, url => setEditingUser({ ...editingUser, avatarUrl: url }));
                    }
                  }}
                />

                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">Foto de Perfil</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Sugestões:</span>
                    {avatarPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingUser({ ...editingUser, avatarUrl: preset })}
                        className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
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
                <label className="text-xs font-bold text-slate-700">Empresa Vinculada</label>
                <select
                  value={editingUser.companyId || companies[0]?.id}
                  onChange={e => setEditingUser({ ...editingUser, companyId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Função / Nível de Acesso</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin_empresa">Administrador da Empresa</option>
                  <option value="gestor_unidade">Gestor de Unidade</option>
                  <option value="tecnico_sst">Técnico de Segurança do Trabalho (SST)</option>
                  <option value="cipeiro">Cipeiro (Eleito/Indicado)</option>
                  <option value="eleitor">Eleitor (Colaborador Votante)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleResetUserPassword(editingUser)}
                  className="px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  title="Reenviar e-mail de redefinição de senha"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reenviar E-mail de Senha</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Salvar Alterações
                </button>
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
            <div className="px-5 py-3 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Cadastrar Usuário
              </h3>
              <button onClick={() => setIsNewUserModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1 overscroll-contain">
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
                      handleFileToDataUrl(file, url => setNewUserAvatarUrl(url));
                    }
                  }}
                />

                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">Foto de Perfil</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Modelos:</span>
                    {avatarPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewUserAvatarUrl(preset)}
                        className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
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
                <label className="text-xs font-bold text-slate-700">Empresa Vinculada</label>
                <select
                  value={newUserCompanyId}
                  onChange={e => setNewUserCompanyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Função / Nível de Acesso</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin_empresa">Administrador da Empresa</option>
                  <option value="gestor_unidade">Gestor de Unidade</option>
                  <option value="tecnico_sst">Técnico de Segurança do Trabalho (SST)</option>
                  <option value="cipeiro">Cipeiro (Eleito/Indicado)</option>
                  <option value="eleitor">Eleitor (Colaborador Votante)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Salvar Usuário
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
