import React, { useState, useRef, useEffect } from 'react';
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
  const isRealPhoto = (url?: string | null): boolean => {
    if (!url) return false;
    if (url.includes('unsplash.com')) return false;
    return true;
  };

  const getInitials = (fullName: string): string => {
    const parts = fullName.replace(/\s*\(.*?\)\s*/g, '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'US';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const [name, setName] = useState(currentUser?.name?.replace(/\s*\(.*?\)\s*/g, '').trim() || '');
  const [avatarUrl, setAvatarUrl] = useState(isRealPhoto(currentUser?.avatarUrl) ? currentUser!.avatarUrl! : '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza sempre que abrir o modal com o usuário ativo mais recente
  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name?.replace(/\s*\(.*?\)\s*/g, '').trim() || '');
      setAvatarUrl(isRealPhoto(currentUser.avatarUrl) ? currentUser.avatarUrl! : '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      setErrorMessage(null);
      setIsUploadingPhoto(true);

      try {
        const uploadRes = await ApiService.uploadPhotoToMinio(base64, file.name, file.type);
        if (uploadRes.success && uploadRes.avatarUrl) {
          setAvatarUrl(uploadRes.avatarUrl);
          onUserUpdated({ avatarUrl: uploadRes.avatarUrl });
          setSuccessMessage('Foto atualizada com sucesso!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } catch (uploadErr: any) {
        console.warn('Fallback upload:', uploadErr);
      } finally {
        setIsUploadingPhoto(false);
      }
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
        avatarUrl: isRealPhoto(avatarUrl) ? avatarUrl.trim() : ''
      });

      if (res.success || res.user) {
        const finalUser = res.user;
        onUserUpdated({
          name: finalUser?.name || name.trim(),
          avatarUrl: finalUser?.avatarUrl || (isRealPhoto(avatarUrl) ? avatarUrl.trim() : undefined),
          avatarInitials: (finalUser?.name || name.trim()).split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
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
      onUserUpdated({
        name: name.trim(),
        avatarUrl: isRealPhoto(avatarUrl) ? avatarUrl.trim() : undefined,
        avatarInitials: name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      });
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
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
        setSuccessMessage('E-mail de redefinição enviado com sucesso (válido por 24 horas)!');
        setTimeout(() => setSuccessMessage(null), 4000);
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
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Modal Verde e Padronizado */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center ring-1 ring-white/30">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white leading-tight">Editar Perfil</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Mensagens de Sucesso e Erro */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Seção da Foto */}
            <div className="flex flex-col items-center justify-center pb-1">
              <div className="relative group cursor-pointer" onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}>
                {isRealPhoto(avatarUrl) ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-22 h-22 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-md transition-opacity group-hover:opacity-80"
                  />
                ) : (
                  <div className="w-22 h-22 rounded-full bg-slate-900 border-2 border-slate-700 text-white font-bold text-2xl flex flex-col items-center justify-center shadow-md ring-4 ring-emerald-500/30 transition-opacity group-hover:opacity-80">
                    <span className="tracking-wider">{getInitials(name || currentUser.name)}</span>
                  </div>
                )}
                
                {/* Overlay Hover ou Carregando */}
                {isUploadingPhoto ? (
                  <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/60 text-white">
                    <Loader2 className="w-5 h-5 animate-spin mb-1 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-center px-1">Salvando foto...</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-semibold">Trocar Foto</span>
                  </div>
                )}

                <div className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 text-white rounded-full shadow ring-2 ring-white">
                  <Camera className="w-3 h-3" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingPhoto}
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-3 mt-2.5">
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer disabled:opacity-50"
                >
                  {isUploadingPhoto ? 'Enviando foto...' : 'Enviar foto do computador'}
                </button>
                {isRealPhoto(avatarUrl) && (
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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

            {/* Campo E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                E-mail
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
            </div>

            {/* Botão de Salvar Alterações */}
            <div className="pt-1 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingPhoto}
                className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all rounded-xl shadow-md cursor-pointer disabled:opacity-50"
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

          {/* Card Simples: Redefinir Senha */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Senha de Acesso</span>
                  <span className="text-[11px] text-slate-500 block truncate">Enviar link de redefinição para {currentUser.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestPasswordReset}
                disabled={isSendingReset}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-800 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-xs active:scale-95"
              >
                {isSendingReset ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Redefinir Senha</span>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
