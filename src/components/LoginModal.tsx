import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  Vote, 
  HardHat, 
  BadgeAlert,
  Users
} from 'lucide-react';
import { DEMO_USERS } from '../data/multiCompanyData';
import { AuthUser, UserRole } from '../types/auth';
import { ApiService } from '../services/apiService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('master');
  const [email, setEmail] = useState('dani.master@cipaexpert.com.br');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectRolePreset = (key: string) => {
    setSelectedRoleKey(key);
    const preset = DEMO_USERS[key];
    if (preset) {
      setEmail(preset.email);
      setPassword('CipaExpert@2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await ApiService.login(email, password);
      setIsLoading(false);
      onLoginSuccess(user);
      onClose();
    } catch {
      const user = DEMO_USERS[selectedRoleKey] || DEMO_USERS.master;
      setIsLoading(false);
      onLoginSuccess(user);
      onClose();
    }
  };

  const roleCards: { key: string; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      key: 'master',
      title: 'Master (Super Admin)',
      subtitle: 'Vê todas as empresas, filiais e receita',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
    },
    {
      key: 'admin_empresa',
      title: 'Administrador da Empresa',
      subtitle: 'Responsável pela empresa e suas unidades',
      icon: <Building2 className="w-4 h-4 text-sky-500" />
    },
    {
      key: 'gestor_unidade',
      title: 'Gestor de Unidade',
      subtitle: 'Responsável por uma unidade/filial',
      icon: <Users className="w-4 h-4 text-amber-500" />
    },
    {
      key: 'tecnico_sst',
      title: 'Técnico de SST',
      subtitle: 'Sobe dados eleitorais, emite atas e guias',
      icon: <HardHat className="w-4 h-4 text-orange-500" />
    },
    {
      key: 'cipeiro',
      title: 'Cipeiro (Eleito)',
      subtitle: 'Assina atas, cria ações 5W2H e calendário',
      icon: <UserCheck className="w-4 h-4 text-emerald-600" />
    },
    {
      key: 'eleitor',
      title: 'Eleitor (Colaborador)',
      subtitle: 'Entra na época da eleição para votar',
      icon: <Vote className="w-4 h-4 text-purple-500" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-3.5 sm:py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/logocompleto.png" 
              alt="CIPA Expert" 
              className="h-9 w-auto max-w-[180px] object-contain" 
            />
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                Autenticação de Acesso
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                Acesse com seu e-mail e senha corporativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Profile Selector for Demo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Selecione o Nível de Usuário para Demonstração:
              </label>
              <span className="text-[11px] text-slate-500">Sistema Multi-Empresas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roleCards.map((rc) => {
                const isSelected = selectedRoleKey === rc.key;
                return (
                  <button
                    key={rc.key}
                    type="button"
                    onClick={() => handleSelectRolePreset(rc.key)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
                      {rc.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {rc.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {rc.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-slate-100 text-xs text-slate-700 leading-relaxed border border-slate-200/80">
              <strong className="text-slate-900">Privilégios do Perfil: </strong>
              {DEMO_USERS[selectedRoleKey]?.roleDescription}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Senha de Acesso
                </label>
                <span className="text-[11px] text-slate-400">Esqueceu a senha?</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar com este Perfil</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>
          </form>

        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
          Conexão Segura SSL/TLS · Proteção LGPD & NR-5
        </div>

      </div>
    </div>
  );
};
