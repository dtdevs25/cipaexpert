import React, { useState, useRef } from 'react';
import { X, User, Camera, Mail, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AuthUser } from '../types/auth';
import { ApiService } from '../services/apiService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUserUpdated: (updatedUser: Partial<AuthUser>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [name, setName] = useState(currentUser?.name?.replace(/\s*\(.*?\)\s*/g, '').trim() || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('O nome do usuário não pode ficar vazio.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await ApiService.updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || undefined
      });

      if (res.success) {
        onUserUpdated({
          name: name.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          avatarInitials: name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        });
        setSuccessMessage('Perfil atualizado com sucesso!');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Não foi possível atualizar o perfil.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setIsSendingReset(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await ApiService.requestResetMyPassword();
      if (res.success) {
        setSuccessMessage(res.message || 'E-mail com link de redefinição enviado com sucesso (válido por 24 horas)!');
      } else {
        setErrorMessage(res.message || 'Erro ao solicitar redefinição de senha.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar ao serviço de e-mail.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/40">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Meu Perfil</h3>
              <p className="text-xs text-slate-300">Atualize seus dados cadastrais ou redefina sua senha</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Mensagens de Sucesso e Erro */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Seção da Foto / Avatar */}
            <div className="flex flex-col items-center justify-center pb-2">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-md transition-opacity group-hover:opacity-80"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-900 text-white font-bold text-2xl flex items-center justify-center shadow-md ring-4 ring-emerald-500/30 transition-opacity group-hover:opacity-80">
                    {name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'US'}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold">Trocar Foto</span>
                </div>
                <div className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 text-white rounded-full shadow ring-2 ring-white">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  Enviar foto do computador
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>

            {/* Campo Nome */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-sm font-medium text-slate-900 transition-all outline-none"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            {/* Campo E-mail (somente leitura para identificação) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                O e-mail é a chave de acesso da sua conta e para redefinições de segurança.
              </p>
            </div>

            {/* Botão de Salvar Alterações */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </button>
            </div>
          </form>

          {/* Divisor */}
          <div className="border-t border-slate-200 pt-5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-slate-600" />
              <span>Segurança e Senha de Acesso</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Deseja alterar sua senha? O sistema enviará um e-mail com um link seguro e criptografado para <strong>{currentUser.email}</strong> com validade de 24 horas para você definir uma nova senha.
            </p>
            <button
              type="button"
              onClick={handleRequestPasswordReset}
              disabled={isSendingReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isSendingReset ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Enviando link para seu e-mail...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>Solicitar Redefinição de Senha via E-mail</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
