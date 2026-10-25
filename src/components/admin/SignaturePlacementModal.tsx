import React, { useState } from 'react';
import { X, Check, PenTool, FileText, Sparkles } from 'lucide-react';
import { SignatureEnvelope, SignatureService, SignatureTagPosition } from '../../services/signatureService';
import { SignaturePlacementEditor } from './SignaturePlacementEditor';

interface SignaturePlacementModalProps {
  envelope: SignatureEnvelope | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedPositions: SignatureTagPosition[]) => void;
}

export const SignaturePlacementModal: React.FC<SignaturePlacementModalProps> = ({
  envelope,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !envelope) return null;

  const [positions, setPositions] = useState<SignatureTagPosition[]>(() => {
    if (envelope.signaturePositions && envelope.signaturePositions.length > 0) {
      return envelope.signaturePositions;
    }
    // Se não tiver posições customizadas, gera o default de rodapé organizado
    return envelope.signers.map((s, idx) => ({
      id: `tag-init-${idx}`,
      signerEmail: s.email,
      signerName: s.name,
      type: 'assinatura' as const,
      page: 1,
      posX: idx % 2 === 0 ? 15 : 55,
      posY: idx >= 2 ? 88 : 78
    }));
  });

  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const handleSave = () => {
    SignatureService.updateSignaturePositions(envelope.id, positions);
    if (onSave) {
      onSave(positions);
    }
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        
        {/* Header Verde Padronizado */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0 text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-emerald-950 leading-tight">
                Posicionamento de Assinaturas
              </h3>
              <p className="text-xs text-slate-600 font-mono truncate max-w-md">
                {envelope.title} · {envelope.companyName}
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

        {/* Corpo com o Editor Visual */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 [scrollbar-width:thin]">
          <SignaturePlacementEditor
            documentTitle={envelope.title}
            documentContent={envelope.content}
            companyName={envelope.companyName}
            cnpj={envelope.cnpj}
            normativeCode={envelope.normativeCode}
            signers={envelope.signers.map(s => ({ name: s.name, email: s.email, role: s.role }))}
            positions={positions}
            onChangePositions={setPositions}
            readOnly={envelope.status === 'concluido'}
          />
        </div>

        {/* Rodapé */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            {positions.length} campo(s) posicionado(s) no documento
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              Fechar
            </button>

            {envelope.status !== 'concluido' && (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSavedFeedback ? 'Posições Salvas!' : 'Salvar Posições de Assinatura'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
