import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Save, 
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { SignatureEnvelope, SignatureSigner, SignatureService } from '../../services/signatureService';

interface EditEnvelopeSignersModalProps {
  envelope: SignatureEnvelope | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const EditEnvelopeSignersModal: React.FC<EditEnvelopeSignersModalProps> = ({
  envelope,
  isOpen,
  onClose,
  onSaved
}) => {
  const [signers, setSigners] = useState<SignatureSigner[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Membro da CIPA');
  const [newCpf, setNewCpf] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (envelope) {
      setSigners([...envelope.signers]);
      setErrorMessage(null);
    }
  }, [envelope, isOpen]);

  if (!isOpen || !envelope) return null;

  const isCompleted = envelope.status === 'concluido';
  const signedCount = signers.filter(s => s.status === 'assinado').length;

  const handleAddSigner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    // Verificar e-mail duplicado
    const emailLower = newEmail.toLowerCase().trim();
    if (signers.some(s => s.email.toLowerCase() === emailLower)) {
      setErrorMessage('Este e-mail já está incluído na lista de signatários.');
      return;
    }

    const newSigner: SignatureSigner = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim(),
      email: emailLower,
      role: newRole.trim() || 'Signatário',
      cpf: newCpf.trim() || undefined,
      order: signers.length + 1,
      status: 'pendente'
    };

    setSigners([...signers, newSigner]);
    setNewName('');
    setNewEmail('');
    setNewRole('Membro da CIPA');
    setNewCpf('');
    setErrorMessage(null);
  };

  const handleRemoveSigner = (signerId: string) => {
    const signer = signers.find(s => s.id === signerId);
    if (signer?.status === 'assinado') {
      setErrorMessage('Não é permitido remover um signatário que já assinou o documento.');
      return;
    }
    setSigners(signers.filter(s => s.id !== signerId));
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (signers.length === 0) {
      setErrorMessage('O envelope deve conter ao menos um signatário.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      SignatureService.updateEnvelopeSigners(envelope.id, signers);
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar signatários.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header Padronizado com Gradiente Verde */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                Editar Signatários do Envelope
              </h3>
              <p className="text-[11px] text-slate-600 truncate max-w-md">
                {envelope.title}
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

        {/* Mensagem de Erro / Alerta se houver */}
        {errorMessage && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 [scrollbar-width:thin]">
          
          {/* Informações de Regra */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>
                Signatários que <strong>já assinaram</strong> ficam bloqueados para alteração ou exclusão por integridade jurídica.
              </span>
            </div>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
              {signedCount} assinado(s)
            </span>
          </div>

          {/* Lista de Signatários */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Signatários Atuais ({signers.length})</span>
              </h4>
            </div>

            <div className="space-y-2">
              {signers.map((signer, index) => {
                const isSigned = signer.status === 'assinado';
                return (
                  <div
                    key={signer.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isSigned
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-slate-900 truncate">{signer.name}</p>
                          {isSigned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Assinado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-amber-100 text-amber-800 shrink-0">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              Pendente
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {signer.email} · <span className="text-emerald-700 font-semibold">{signer.role}</span>
                        </p>
                      </div>
                    </div>

                    {/* Ação de Exclusão (Apenas para quem ainda NÃO assinou) */}
                    <div>
                      {isSigned ? (
                        <div 
                          className="p-1.5 text-slate-400 bg-slate-100 rounded-lg flex items-center gap-1 cursor-not-allowed" 
                          title="Assinado: bloqueado contra alterações"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveSigner(signer.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover signatário pendente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulário para Adicionar Novo Signatário */}
          {!isCompleted && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Acrescentar Novo Signatário</span>
              </span>

              <form onSubmit={handleAddSigner} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome completo *"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="email"
                    placeholder="E-mail *"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Cargo (ex: Membro da CIPA)"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="CPF (Opcional - Protegido LGPD)"
                    value={newCpf}
                    onChange={(e) => setNewCpf(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!newName.trim() || !newEmail.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar à Lista</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer com Botões */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || signers.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
