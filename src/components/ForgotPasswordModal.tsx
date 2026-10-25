import React, { useState } from 'react';
import { X, Mail, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = ''
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await ApiService.forgotPassword(email.trim());
      if (res.success) {
        setSuccess(true);
      } else {
        setErrorMessage(res.message || 'E-mail não encontrado no cadastro do sistema.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'E-mail não encontrado no cadastro do sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho Verde Padronizado */}
        <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-extrabold text-emerald-950">Redefinir Senha</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {success ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">E-mail Enviado com Sucesso!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enviamos um link criptografado e seguro para <strong>{email}</strong> contendo o botão de redefinição de senha.
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 animate-pulse"></span>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  <strong>Atenção:</strong> Por motivos de segurança, este link é criptografado e expira em exatamente <strong>24 horas</strong>. Verifique também sua caixa de spam.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Entendido, voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Digite o e-mail cadastrado na sua conta. Nosso sistema validará o cadastro e enviará um link criptografado com validade de <strong>24 horas</strong> para redefinir sua senha.
              </p>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  E-mail Cadastrado
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu.email@empresa.com.br"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-medium text-slate-900 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validando e Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Link Seguro</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
