import React, { useState } from 'react';
import { 
  FileSignature, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowLeft, 
  FileText, 
  Printer, 
  Key, 
  UserCheck, 
  Eye, 
  Download,
  AlertCircle
} from 'lucide-react';
import { GeneratedDocument, generateCipaDocument } from '../../data/documentTemplates';

interface SignaturePortalProps {
  companyName: string;
  cnpj: string;
  onOpenDocument: (doc: GeneratedDocument) => void;
  onOpenSignatureModal: (ataId: string, title: string) => void;
  signedAtas: Record<string, { hash: string; timestamp: string; signerName: string }>;
  onBackToMenu: () => void;
}

export const SignaturePortal: React.FC<SignaturePortalProps> = ({
  companyName,
  cnpj,
  onOpenDocument,
  onOpenSignatureModal,
  signedAtas,
  onBackToMenu
}) => {
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'assinados'>('todos');

  const documents = [
    {
      id: 'ata-1',
      title: 'Ata da 10ª Reunião Ordinária da CIPA (Outubro/2026)',
      category: 'Ata Mensal Obrigatória',
      date: '05/10/2026',
      normativeCode: 'NR-5 Item 5.6.1 · Lei Federal 14.457/2022',
      signatoriesCount: '4 de 4 assinados',
      requiredRoles: ['Presidente', 'Vice-Presidente', 'Secretário', 'Técnico SST'],
      isSigned: !!signedAtas['ata-1'],
      docType: 'ata_reuniao' as const
    },
    {
      id: 'ata-2',
      title: 'Ata da 11ª Reunião Ordinária da CIPA (Novembro/2026)',
      category: 'Ata Mensal Obrigatória',
      date: '10/11/2026',
      normativeCode: 'NR-5 Item 5.6.1 · Lei Federal 14.457/2022',
      signatoriesCount: !!signedAtas['ata-2'] ? '1 de 4 assinados' : 'Pendente de assinaturas',
      requiredRoles: ['Presidente', 'Vice-Presidente', 'Secretário', 'Membros Cipeiros'],
      isSigned: !!signedAtas['ata-2'],
      docType: 'ata_reuniao' as const
    },
    {
      id: 'comunicado-sindicato',
      title: 'Comunicação ao Sindicato da Categoria (Início do Processo Eleitoral)',
      category: 'Comunicação Sindical',
      date: '15/10/2026',
      normativeCode: 'NR-5 Item 5.5.1, alínea c · Comunicação Obrigatória',
      signatoriesCount: !!signedAtas['comunicado-sindicato'] ? 'Assinado pela Diretoria & Sindicato' : 'Aguardando assinatura digital',
      requiredRoles: ['Representante Legal do Empregador', 'Sindicato da Categoria'],
      isSigned: !!signedAtas['comunicado-sindicato'],
      docType: 'comunicado_sindicato' as const
    },
    {
      id: 'edital-convocacao',
      title: 'Edital de Convocação da Eleição CIPA Mandato 2026/2027',
      category: 'Edital Eleitoral',
      date: '15/10/2026',
      normativeCode: 'NR-5 Item 5.5.1 · Antecedência de 60 dias',
      signatoriesCount: !!signedAtas['edital-convocacao'] ? 'Assinado pela Diretoria' : 'Aguardando assinatura do Empregador',
      requiredRoles: ['Representante Legal da Empresa', 'Presidente da CIPA'],
      isSigned: !!signedAtas['edital-convocacao'],
      docType: 'edital_convocacao' as const
    },
    {
      id: 'ata-posse',
      title: 'Ata de Instalação e Posse dos Novos Cipeiros',
      category: 'Ata de Posse',
      date: '01/12/2026',
      normativeCode: 'NR-5 Item 5.5.10 · Início do Mandato',
      signatoriesCount: !!signedAtas['ata-posse'] ? '100% Homologado' : 'Aguardando finalização das eleições',
      requiredRoles: ['Empregador', 'Todos os Titulares e Suplentes'],
      isSigned: !!signedAtas['ata-posse'],
      docType: 'ata_posse' as const
    }
  ];

  const filteredDocs = documents.filter(d => {
    if (filter === 'pendentes') return !d.isSigned;
    if (filter === 'assinados') return d.isSigned;
    return true;
  });

  const handleView = (docType: any, title: string) => {
    const generated = generateCipaDocument(docType, companyName, cnpj);
    onOpenDocument({ ...generated, title });
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* Header com estilo verde claro padronizado */}
      <div className="flex items-center justify-between gap-4 bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <FileSignature className="w-5 h-5 text-emerald-700" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Portal de Assinaturas Digitais da CIPA
          </h2>
        </div>
      </div>

      {/* Guias fora do card de título (igual à página de Cadastros Gerais) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full py-1">
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('todos')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              filter === 'todos' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pendentes')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              filter === 'pendentes' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes ({documents.filter(d => !d.isSigned).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('assinados')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              filter === 'assinados' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assinados ({documents.filter(d => d.isSigned).length})
          </button>
        </div>
      </div>

      {/* Grid de Documentos e Assinaturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDocs.map((doc) => {
          const sigInfo = signedAtas[doc.id];

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
            >
              {/* Header na cor verde claro idêntico ao dashboard */}
              <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-950 block truncate">
                      {doc.category} · {doc.normativeCode}
                    </span>
                  </div>
                </div>
                
                {doc.isSigned ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Assinado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-amber-600" /> Pendente
                  </span>
                )}
              </div>

              {/* Conteúdo interno */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Título sem nada escrito abaixo */}
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {doc.title}
                  </h3>

                  {/* Bloco de Validação Criptográfica se assinado */}
                  {doc.isSigned && sigInfo ? (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1 text-emerald-950 font-mono">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Certificado Digital Gravado</span>
                      </div>
                      <div className="text-[10px] truncate text-slate-600">
                        Hash: <strong className="text-emerald-800">{sigInfo.hash}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Assinado por: <strong>{sigInfo.signerName}</strong></span>
                        <span>{sigInfo.timestamp}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-600">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Signatários Obrigatórios:</span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {doc.requiredRoles.map((r, i) => (
                          <span key={i} className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleView(doc.docType, doc.title)}
                  className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualizar Documento</span>
                </button>

                {!doc.isSigned ? (
                  <button
                    type="button"
                    onClick={() => onOpenSignatureModal(doc.id, doc.title)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Assinar na Tela</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleView(doc.docType, doc.title)}
                    className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Imprimir Certificado</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    </div>
  );
};
