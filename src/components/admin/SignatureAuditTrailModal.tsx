import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Printer, 
  Clock, 
  CheckCircle2, 
  FileText, 
  QrCode, 
  Copy, 
  ExternalLink,
  Lock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { SignatureEnvelope } from '../../services/signatureService';

interface SignatureAuditTrailModalProps {
  envelope: SignatureEnvelope | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SignatureAuditTrailModal: React.FC<SignatureAuditTrailModalProps> = ({
  envelope,
  isOpen,
  onClose
}) => {
  if (!isOpen || !envelope) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
  };

  const totalSigners = envelope.signers.length;
  const signedCount = envelope.signers.filter(s => s.status === 'assinado').length;
  const percentCompleted = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;
  const isCompleted = envelope.status === 'concluido';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header Verde Padronizado */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center ring-1 ring-emerald-200 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                Folha de Auditoria & Certificado de Assinaturas Digitais
              </h3>
              <p className="text-[11px] text-slate-600 font-mono">
                Conformidade MP nº 2.200-2/2001 · Lei nº 14.063/2020 · NR-5
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3"
              title="Imprimir Certificado de Assinatura"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Certificado</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Audit Trail (Imprimível) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1 [scrollbar-width:thin]">
          
          {/* Card Cabeçalho do Certificado */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Certificado Digital de Assinaturas · CIPA Expert
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {envelope.title}
                </h4>
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                  Empresa: {envelope.companyName} (CNPJ: {envelope.cnpj})
                </span>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status do Envelope</span>
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    100% Homologado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wider mt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {signedCount} de {totalSigners} Assinados ({percentCompleted}%)
                  </span>
                )}
              </div>
            </div>

            {/* Hashes Criptográficas Raiz */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hash SHA-256 do Documento Original
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-slate-800 break-all select-all">
                    {envelope.documentHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyHash(envelope.documentHash)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0 cursor-pointer"
                    title="Copiar Hash"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hash Final de Conclusão / Fechamento
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-emerald-800 break-all select-all">
                    {envelope.finalHash || 'Aguardando conclusão de todas as assinaturas'}
                  </span>
                  {envelope.finalHash && (
                    <button
                      type="button"
                      onClick={() => copyHash(envelope.finalHash!)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0 cursor-pointer"
                      title="Copiar Hash Final"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Signatários & Evidências Digitais */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Signatários e Assinaturas Registradas ({signedCount}/{totalSigners})
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {envelope.signers.map((signer, idx) => {
                const isSigned = signer.status === 'assinado';

                return (
                  <div key={signer.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <strong className="text-sm font-bold text-slate-900 truncate">{signer.name}</strong>
                        {signer.cpf && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            CPF: ***.***.***-** (Protegido LGPD)
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isSigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isSigned ? 'Assinado' : 'Pendente'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                        <span>Função: <strong>{signer.role}</strong></span>
                        <span>E-mail: <strong>{signer.email}</strong></span>
                        {isSigned && (
                          <>
                            <span>Data/Hora: <strong className="text-slate-800">{signer.signedAt}</strong></span>
                            <span>IP: <strong className="font-mono">{signer.ipAddress}</strong></span>
                          </>
                        )}
                      </div>

                      {isSigned && signer.hash && (
                        <div className="pt-1 text-[10px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 break-all">
                          <span className="font-bold text-slate-400 uppercase">Hash SHA-256 da Assinatura: </span>
                          <span className="text-emerald-900 font-semibold">{signer.hash}</span>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail / Pré-visualização da Assinatura se já assinado */}
                    {isSigned && signer.signatureDataUrl && (
                      <div className="shrink-0 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center self-start sm:self-center">
                        <img
                          src={signer.signatureDataUrl}
                          alt={`Assinatura de ${signer.name}`}
                          className="h-10 w-auto max-w-[120px] object-contain mx-auto mix-blend-multiply"
                        />
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">Rubrica Eletrônica</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Linha do Tempo e Histórico de Eventos (Audit Trail) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              Histórico Cronológico e Trilha de Auditoria (Audit Log)
            </h4>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 font-mono text-xs">
              {envelope.auditEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 text-slate-700 pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 ring-2 ring-emerald-200"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <strong className="text-slate-900 font-bold">{event.action}</strong>
                      <span className="text-[10px] text-slate-400">{event.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-sans leading-relaxed">
                      {event.description}
                    </p>
                    {event.hash && (
                      <span className="text-[10px] font-mono text-emerald-800 block mt-0.5 break-all">
                        Hash: {event.hash}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Declaração de Conformidade com as Leis Brasileiras */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
            <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-700" />
              Validade Jurídica e Integridade Criptográfica
            </span>
            <p className="text-[11px] text-emerald-900 leading-relaxed font-sans">
              As assinaturas constantes neste documento foram colhidas por meio eletrônico e atendem plenamente aos requisitos de autenticidade, integridade, tempestividade e não-repúdio estatuídos pelo <strong>Artigo 10 da Medida Provisória nº 2.200-2/2001</strong>, pela <strong>Lei Federal nº 14.063/2020</strong> e pela <strong>Norma Regulamentadora nº 05 (NR-5)</strong> do Ministério do Trabalho e Emprego.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-emerald-800 border-t border-emerald-200/60">
              <span>Chancela: CIPA Expert Trust Network</span>
              <span>Identificador Único: {envelope.id}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            ID do Envelope: <strong>{envelope.id}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            Fechar Certificado
          </button>
        </div>

      </div>
    </div>
  );
};
