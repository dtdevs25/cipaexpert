import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft
} from 'lucide-react';
import { DEMO_USERS } from '../data/multiCompanyData';
import { AuthUser } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding
}) => {
  const [email, setEmail] = useState('dani.master@cipaexpert.com.br');
  const [password, setPassword] = useState('cipa2026@segura');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('master');
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (roleKey: string) => {
    setSelectedRoleKey(roleKey);
    const preset = DEMO_USERS[roleKey];
    if (preset) {
      setEmail(preset.email);
      setPassword('cipa2026@segura');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const user = DEMO_USERS[selectedRoleKey] || DEMO_USERS.master;
      onLoginSuccess(user);
    }, 350);
  };

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 flex items-center justify-center p-4 font-sans select-none z-50">
      
      {/* Background Animated Efeitos / Glowing Mesh Orbs */}
      <div className="absolute top-1/6 left-1/5 w-72 h-72 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/6 right-1/5 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80 pointer-events-none"></div>

      {/* Card de Login Menor, Ultracompacto e Centralizado ao Meio da Tela */}
      <div className="w-full max-w-[340px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-emerald-950/60 border border-emerald-500/30 p-5 space-y-3.5 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Brand Compacto */}
        <div className="text-center space-y-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/30 mx-auto">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-base font-extrabold text-slate-950 tracking-tight leading-tight">
            CIPA <span className="text-emerald-600">Expert</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Acesse a plataforma de gestão digital
          </p>
        </div>

        {/* Seletor Discreto de Perfil Demo em Linha Única */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Perfil:</span>
          <select
            value={selectedRoleKey}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer truncate"
          >
            <option value="master">Master (Global)</option>
            <option value="admin_empresa">Admin Empresa</option>
            <option value="gestor_unidade">Gestor Unidade</option>
            <option value="tecnico_sst">Técnico SST</option>
            <option value="cipeiro">Cipeiro (Assinatura)</option>
            <option value="eleitor">Eleitor (Voto)</option>
          </select>
        </div>

        {/* Formulário Compacto */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* E-mail */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu.email@empresa.com.br"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Senha com olhinho para ver e esqueci a senha */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">
                Senha
              </label>
              <button
                type="button"
                onClick={() => setForgotPasswordNotice(!forgotPasswordNotice)}
                className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
              >
                Esqueci a senha
              </button>
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all font-medium font-mono text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Aviso esqueci a senha */}
          {forgotPasswordNotice && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 leading-tight animate-in fade-in duration-150">
              Link de recuperação enviado para <strong>{email}</strong>.
            </div>
          )}

          {/* Botão Acessar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-700/30 flex items-center justify-center gap-1.5 pt-2.5 mt-1 cursor-pointer"
          >
            {isLoading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Acessar</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Link Voltar */}
        <div className="text-center pt-0.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Voltar ao site</span>
          </button>
        </div>

      </div>

    </div>
  );
};
