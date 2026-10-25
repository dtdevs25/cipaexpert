import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  AlertCircle, 
  X, 
  Trash2, 
  Building2, 
  User, 
  ShieldCheck,
  Check,
  Loader2
} from 'lucide-react';

export type StandardModalType = 'confirm_delete' | 'success' | 'info' | 'warning' | 'error';

export interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: StandardModalType;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isConfirming?: boolean;
}

export const StandardModal: React.FC<StandardModalProps> = ({
  isOpen,
  onClose,
  type = 'info',
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  isConfirming = false
}) => {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'confirm_delete':
        return {
          icon: Trash2,
          iconBg: 'bg-rose-100 text-rose-600 ring-8 ring-rose-50',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconBg: 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-100 text-amber-600 ring-8 ring-amber-50',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconBg: 'bg-rose-100 text-rose-600 ring-8 ring-rose-50',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
        };
      default:
        return {
          icon: Info,
          iconBg: 'bg-sky-100 text-sky-600 ring-8 ring-sky-50',
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
        };
    }
  };

  const { icon: IconComponent, iconBg, confirmBtn } = getIconAndColors();

  const isDelete = type === 'confirm_delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Padronizado (Vermelho para Exclusão, Verde Esmeralda para os demais) */}
        <div className={`px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0 ${
          isDelete 
            ? 'bg-gradient-to-r from-rose-100/90 via-rose-50 to-rose-100/80 border-b border-rose-200/80' 
            : 'bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 border-b border-emerald-200/80'
        }`}>
          <h3 className={`text-sm font-extrabold flex items-center gap-2 truncate ${
            isDelete ? 'text-rose-950' : 'text-emerald-950'
          }`}>
            <IconComponent className={`w-4 h-4 shrink-0 ${isDelete ? 'text-rose-700' : 'text-emerald-700'}`} />
            <span className="truncate">{title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-white/60 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal content body (rolável se necessário) */}
        <div className="p-6 flex flex-col items-center text-center overflow-y-auto flex-1 overscroll-contain">
          {/* Badge Icon */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform shadow-xs shrink-0 ${iconBg}`}>
            <IconComponent className="w-7 h-7" />
          </div>

          {/* Optional Description */}
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Custom Children Content */}
          {children && (
            <div className="w-full text-left mt-4 text-xs">
              {children}
            </div>
          )}
        </div>

        {/* Action Buttons (sempre fixos no rodapé) */}
        <div className="w-full p-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="w-full grid grid-cols-2 gap-3">
            {type === 'confirm_delete' || type === 'warning' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isConfirming}
                  className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isConfirming}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${confirmBtn}`}
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      {type === 'confirm_delete' && <Trash2 className="w-3.5 h-3.5" />}
                      <span>{confirmLabel || 'Sim, Excluir'}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={`col-span-2 w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${confirmBtn}`}
              >
                <Check className="w-4 h-4" />
                <span>{confirmLabel || 'Compreendido'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
