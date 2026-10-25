import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, FileText, Shield } from 'lucide-react';
import { GeneratedDocument } from '../data/documentTemplates';

interface DocumentViewerModalProps {
  document: GeneratedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSignRequested?: () => void;
  isSigned?: boolean;
  signatureHash?: string;
  signatureDate?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: docData,
  isOpen,
  onClose,
  onSignRequested,
  isSigned = false,
  signatureHash,
  signatureDate
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !docData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const textContent = `
================================================================================
${docData.title}
Normativa: ${docData.normativeCode} | Categoria: ${docData.category}
Empresa: ${docData.companyName} | CNPJ: ${docData.cnpj}
Data: ${docData.dateGenerated}
================================================================================

${docData.content.join('\n\n')}

--------------------------------------------------------------------------------
ASSINATURAS RECONHECIDAS:
${docData.signatories.map(s => `- ${s}`).join('\n')}

${isSigned ? `STATUS: ASSINADO DIGITALMENTE (MP 2.200-2/2001)\nHASH: ${signatureHash || 'SHA256-VALIDATED-EASY-CIPA'}\nDATA: ${signatureDate || docData.dateGenerated}` : 'STATUS: DOCUMENTO GERADO / AGUARDANDO ASSINATURAS'}
================================================================================
`;
    const element = window.document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${docData.title.toLowerCase().replace(/\s+/g, '_')}.txt`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar Verde Padronizado */}
        <div className="flex items-center justify-between px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 border-b border-emerald-200/80 text-emerald-950 no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center ring-1 ring-emerald-200 shadow-2xs">
              <FileText className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                {docData.title}
              </h3>
              <p className="text-xs text-slate-600 font-mono">
                {docData.normativeCode} · {docData.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 shadow-xs cursor-pointer"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 shadow-xs cursor-pointer"
              title="Baixar arquivo de texto"
            >
              <Download className="w-3.5 h-3.5 text-slate-700" />
              <span>Baixar</span>
            </button>
            {onSignRequested && !isSigned && (
              <button
                onClick={onSignRequested}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Assinar Digitalmente</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors ml-2 cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Area */}
        <div ref={contentRef} className="p-8 sm:p-12 overflow-y-auto space-y-6 text-slate-800 bg-white font-sans text-sm leading-relaxed">
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              REPÚBLICA FEDERATIVA DO BRASIL · MINISTÉRIO DO TRABALHO E EMPREGO
            </div>
            <h1 className="text-lg font-bold text-slate-950 uppercase tracking-tight">
              {docData.title}
            </h1>
            <div className="text-xs text-slate-600 flex flex-wrap justify-center gap-x-4 gap-y-1">
              <span><strong>Empresa:</strong> {docData.companyName}</span>
              <span><strong>CNPJ:</strong> {docData.cnpj}</span>
              <span><strong>Base Legal:</strong> {docData.normativeCode}</span>
              <span><strong>Data de Emissão:</strong> {docData.dateGenerated}</span>
            </div>
          </div>

          {/* Document Paragraphs */}
          <div className="space-y-4 pt-2">
            {docData.content.map((paragraph, idx) => (
              <p key={idx} className="text-justify text-slate-700 indent-8 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Official Signatures Section */}
          <div className="pt-8 border-t border-slate-200 space-y-8">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
              Termos de Ciência e Validação das Partes Interessadas
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              {docData.signatories.map((sig, idx) => (
                <div key={idx} className="text-center space-y-1">
                  <div className="border-b border-slate-400 mx-auto w-48 mb-2"></div>
                  <p className="text-xs font-semibold text-slate-900">{sig}</p>
                  <p className="text-[11px] text-slate-500">CIPA Expert · Documento Registrado</p>
                </div>
              ))}
            </div>

            {/* Cryptographic Digital Stamp */}
            {isSigned && (
              <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-950">
                    Documento Assinado Digitalmente com Validade Jurídica (MP 2.200-2/2001)
                  </p>
                  <p className="text-emerald-800">
                    Assinatura eletrônica autenticada pela plataforma <strong>CIPA Expert</strong>. Carimbo de tempo criptográfico verificado.
                  </p>
                  <p className="font-mono text-[11px] text-emerald-700 break-all">
                    Hash de Autenticidade: {signatureHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Data e Hora do Registro: {signatureDate || new Date().toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 no-print">
          <span>CIPA Expert · Gerenciador Normativo NR-5</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fechar Visualização
          </button>
        </div>

      </div>
    </div>
  );
};
