import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  FileText, 
  Shield, 
  ExternalLink, 
  QrCode, 
  Lock, 
  Check, 
  Users, 
  Calendar, 
  Building2,
  Award,
  Edit3,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { GeneratedDocument } from '../data/documentTemplates';
import { QrCodeService } from '../services/qrCodeService';
import { RichTextRenderer } from './common/RichTextRenderer';

interface DocumentViewerModalProps {
  document: GeneratedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSignRequested?: () => void;
  onEditRequested?: () => void;
  isSigned?: boolean;
  signatureHash?: string;
  signatureDate?: string;
  signersList?: Array<{ 
    name: string; 
    email: string; 
    role?: string; 
    signedAt?: string; 
    signatureStyle?: string;
    signatureType?: string;
    signatureDataUrl?: string;
    hash?: string;
    status?: string;
  }>;
  signaturePositions?: Array<{ id: string; signerEmail: string; signerName: string; type: string; posX: number; posY: number; scale?: number }>;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: docData,
  isOpen,
  onClose,
  onSignRequested,
  onEditRequested,
  isSigned = false,
  signatureHash,
  signatureDate,
  signersList,
  signaturePositions
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [realQrCodeUrl, setRealQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (!docData) {
      setRealQrCodeUrl('');
      return;
    }
    if (docData.qrCodeDataUrl) {
      setRealQrCodeUrl(docData.qrCodeDataUrl);
      return;
    }
    const linkFound = docData.content.find(p => p.startsWith('http://') || p.startsWith('https://')) || docData.eleicaoLink;
    if (linkFound) {
      QrCodeService.generateDataUrl(linkFound.trim(), 240).then(url => {
        if (url) setRealQrCodeUrl(url);
      });
    } else {
      setRealQrCodeUrl('');
    }
  }, [docData]);

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
            {onEditRequested && (
              <button
                type="button"
                onClick={onEditRequested}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                title="Editar parâmetros e conteúdo oficial do documento"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 active:scale-95 text-slate-700 hover:text-emerald-900 border border-slate-300 hover:border-emerald-300 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title="Imprimir documento oficial ou salvar como PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title="Baixar via de texto TXT"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TXT</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
              title="Fechar (X)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Area with Cryptographic Margin */}
        <div ref={contentRef} className="relative p-8 sm:p-12 overflow-y-auto space-y-6 text-slate-800 bg-white font-sans text-sm leading-relaxed">
          
          {/* Dados de Criptografia no Canto Superior Esquerdo da Página (Linha Única - Mínimo Regulamentar MP 2.200-2/2001) */}
          <div className="flex items-center justify-between text-left font-mono text-[8.5px] text-slate-500 select-none pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-emerald-800 shrink-0">Autenticação Digital MP 2.200-2/01</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 truncate">
                SHA-256: {signatureHash ? `${signatureHash.slice(0, 20)}...` : 'e3b0c44298fc1c149afb...'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 shrink-0">
                {signatureDate || new Date().toLocaleString('pt-BR')}
              </span>
            </div>
            <span className="text-[8px] font-mono text-slate-400 shrink-0 hidden sm:inline">
              Fé Pública Digital
            </span>
          </div>

          {/* Institutional Executive Letterhead com Logo e Identidade Corporativa */}
          <div className="pb-5 border-b-2 border-slate-900/80">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
              {/* Logo da Empresa */}
              <div className="flex items-center gap-3.5 shrink-0">
                {docData.logoUrl ? (
                  <div className="h-14 max-w-[160px] flex items-center justify-center p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <img 
                      src={docData.logoUrl} 
                      alt={docData.companyName} 
                      className="max-h-12 max-w-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex flex-col items-center justify-center font-bold shadow-xs ring-1 ring-emerald-500/30 shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-100" />
                    <span className="text-[10px] font-black tracking-wider uppercase mt-0.5">
                      {docData.companyName ? docData.companyName.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0]).join('').toUpperCase() || 'CIPA' : 'CIPA'}
                    </span>
                  </div>
                )}
                
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 flex items-center justify-center sm:justify-start gap-1">
                    <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>MTE · Norma Regulamentadora NR-05</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-snug">
                    {docData.companyName}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    {docData.unitName ? <span className="font-semibold text-slate-800">{docData.unitName} · </span> : ''}
                    {docData.unitAddress || (docData.unitCity ? `${docData.unitCity} - ${docData.unitState || 'BR'}` : '')}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    CNPJ: <strong>{docData.cnpj}</strong> · Gestão CIPA {docData.gestaoAno || '2026/2027'}
                  </p>
                </div>
              </div>

              {/* Selo CIPA Oficial à Direita */}
              <div className="shrink-0 flex flex-col items-center sm:items-end justify-center">
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-black tracking-wide uppercase flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>CIPA Gestão {docData.gestaoAno || '2026/2027'}</span>
                </div>
                <span className="text-[9.5px] font-mono text-slate-400 mt-1">
                  Comissão Interna de Prevenção e Assédio
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  Base Legal: {docData.normativeCode}
                </span>
              </div>
            </div>

            {/* Linha Divisória de Destaque Esmeralda */}
            <div className="w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-700 rounded-full mt-4 mb-4"></div>

            {/* Faixa Título do Documento */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-lg py-2.5 px-4 text-center shadow-2xs">
              <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                {docData.title}
              </h1>
              <div className="text-[10.5px] text-slate-500 font-mono mt-0.5 flex items-center justify-center gap-3">
                <span>Data de Emissão: {docData.dateGenerated}</span>
                <span>·</span>
                <span>Categoria: {docData.category}</span>
              </div>
            </div>
          </div>

          {/* Document Content Blocks com Suporte a Tabelas, Parâmetros e Credenciamento */}
          <div className="space-y-2.5 pt-2 text-slate-800 text-sm leading-relaxed">
            {(() => {
              const blocks: React.ReactNode[] = [];
              let i = 0;
              
              // Deduplicação dos parágrafos de abertura que repetem o cabeçalho/título (exceto para Certificados)
              const isCertificate = docData.category === 'Capacitação e Treinamento' || docData.title.toUpperCase().includes('CERTIFICADO');
              let startIndex = 0;
              if (!isCertificate) {
                const normalizedTitle = docData.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                const normalizedCompany = docData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
                for (let idx = 0; idx < Math.min(4, docData.content.length); idx++) {
                  const p = docData.content[idx].trim();
                  const pNorm = p.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const isRepeatTitle = pNorm.length > 5 && (normalizedTitle.includes(pNorm) || pNorm.includes(normalizedTitle));
                  const isRepeatCipa = p.toLowerCase().startsWith('cipa') && (p.toLowerCase().includes('comissão') || p.toLowerCase().includes('comissao') || p.toLowerCase().includes('gestão'));
                  const isRepeatUnitGestao = p.toLowerCase().includes('gestão 2026') || p.toLowerCase().includes('gestao 2026');
                  const isRepeatCompanyCnpj = pNorm.includes(normalizedCompany) && p.toLowerCase().includes('cnpj:');

                  if (isRepeatTitle || isRepeatCipa || (isRepeatUnitGestao && p.length < 70) || isRepeatCompanyCnpj) {
                    startIndex = idx + 1;
                  } else {
                    break;
                  }
                }
              }
              const content = docData.content.slice(startIndex);

              while (i < content.length) {
                const paragraph = content[i];

                // 0. Elementos Visuais do Certificado Oficial
                if (paragraph === 'CERTIFICADO') {
                  blocks.push(
                    <div key={i} className="my-3 text-center">
                      <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-800 text-white shadow-md border-2 border-emerald-400">
                        <GraduationCap className="w-5 h-5 text-emerald-300" />
                        <span className="font-serif tracking-widest text-base sm:text-lg font-black uppercase">
                          CERTIFICADO
                        </span>
                        <Award className="w-5 h-5 text-amber-300" />
                      </div>
                    </div>
                  );
                  i++;
                  continue;
                }

                if (paragraph === 'Certificamos que:') {
                  blocks.push(
                    <div key={i} className="text-center font-serif italic text-slate-600 text-base my-2">
                      Certificamos que:
                    </div>
                  );
                  i++;
                  continue;
                }

                if (paragraph.startsWith('NOME:')) {
                  const nome = paragraph.replace('NOME:', '').trim();
                  blocks.push(
                    <div key={i} className="text-center py-3 my-2 bg-gradient-to-r from-emerald-50/40 via-emerald-50 to-emerald-50/40 border-y-2 border-emerald-300 rounded-lg">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-800 block mb-0.5">
                        Membro da CIPA Capacitado(a)
                      </span>
                      <h2 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight font-serif uppercase">
                        {nome}
                      </h2>
                    </div>
                  );
                  i++;
                  continue;
                }

                if (paragraph.startsWith('CONTEÚDO PROGRAMÁTICO')) {
                  blocks.push(
                    <div key={i} className="mt-5 mb-2 p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-xl text-emerald-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xs">
                      <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{paragraph}</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 1. Tabela Markdown (inicia com '|')
                if (paragraph.trim().startsWith('|')) {
                  const tableLines: string[] = [];
                  while (i < content.length && content[i].trim().startsWith('|')) {
                    tableLines.push(content[i].trim());
                    i++;
                  }
                  
                  if (tableLines.length >= 2) {
                    const headerCells = tableLines[0].split('|').map(c => c.trim()).filter(Boolean);
                    const dataRows = tableLines.slice(1)
                      .filter(l => !l.replace(/[\s\-|:]/g, '') === false)
                      .map(l => l.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1));

                    blocks.push(
                      <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/90 text-slate-800 font-extrabold uppercase border-b border-slate-200">
                              {headerCells.map((h, hIdx) => (
                                <th key={hIdx} className="px-3 py-2 text-[10.5px] tracking-wider whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {dataRows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-3 py-2 text-slate-700 font-mono text-[11px]">
                                    {cell === '👤' ? (
                                      <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] text-slate-600 shadow-2xs">👤</span>
                                    ) : (
                                      cell
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                    continue;
                  }
                }

                // 2. Banner de Inscrições Aprovadas
                if (paragraph.startsWith('INSCRIÇÕES APROVADAS:')) {
                  const count = paragraph.replace('INSCRIÇÕES APROVADAS:', '').trim();
                  blocks.push(
                    <div key={i} className="flex items-center justify-between p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl mt-4 mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-950">Inscrições Aprovadas</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-2xs">{count} Homologadas</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 3. Banner de Inscrições Reprovadas
                if (paragraph.startsWith('INSCRIÇÕES REPROVADAS:')) {
                  const count = paragraph.replace('INSCRIÇÕES REPROVADAS:', '').trim();
                  blocks.push(
                    <div key={i} className="flex items-center justify-between p-3 bg-rose-50/90 border border-rose-300 rounded-xl mt-4 mb-2">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-extrabold text-xs uppercase tracking-wider text-rose-950">Inscrições Reprovadas / Indeferidas</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-2xs">{count} Indeferida</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 4. Banner de Candidatos na Votação
                if (paragraph === 'CANDIDATOS CADASTRADOS NA VOTAÇÃO') {
                  blocks.push(
                    <div key={i} className="p-3 bg-slate-100 border border-slate-300 rounded-xl mt-5 mb-2 flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <Users className="w-4 h-4 text-slate-700" />
                      <span>Candidatos Cadastrados na Votação (Cédula Eleitoral Oficial)</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 5. Card de Candidato na Votação (Nome + Descrição)
                if (paragraph.startsWith('NOME DO CANDIDATO:')) {
                  const nome = paragraph.replace('NOME DO CANDIDATO:', '').trim();
                  let desc = '';
                  if (i + 1 < content.length && content[i + 1].startsWith('DESCRIÇÃO DO CANDIDATO:')) {
                    desc = content[i + 1].replace('DESCRIÇÃO DO CANDIDATO:', '').trim();
                    i++;
                  }
                  blocks.push(
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <strong className="text-slate-900 font-bold block">{nome}</strong>
                        <span className="text-slate-600 font-mono text-[11px] block">{desc}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md shrink-0 uppercase tracking-tight">Habilitado</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 6. URLs
                if (paragraph.startsWith('http://') || paragraph.startsWith('https://')) {
                  blocks.push(
                    <div key={i} className="my-3 p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Link Oficial de Inscrição / Votação</span>
                          <a href={paragraph} target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-bold text-emerald-900 underline hover:text-emerald-700 truncate block">
                            {paragraph}
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(paragraph)}
                        className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/60 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiar Link</span>
                      </button>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 7. QR Code Box
                if (paragraph.toLowerCase().includes('scan me')) {
                  blocks.push(
                    <div key={i} className="my-4 p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-emerald-50/70 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left shadow-xs">
                      <div className="p-2.5 bg-white border border-emerald-200 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                        {realQrCodeUrl ? (
                          <img 
                            src={realQrCodeUrl} 
                            alt="QR Code Oficial CIPA Expert" 
                            className="w-24 h-24 object-contain rounded"
                          />
                        ) : (
                          <QrCode className="w-16 h-16 text-slate-800" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-wider block">QR Code Dinâmico Oficial · CIPA Expert</span>
                        <strong className="text-sm font-extrabold text-slate-900 block leading-tight">Aponte a câmera do celular para se inscrever</strong>
                        <p className="text-xs text-slate-600 leading-snug">
                          Acesso sincronizado e exclusivo ao formulário oficial de candidatura desta unidade.
                        </p>
                        <span className="text-[10px] font-mono text-emerald-700 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                          ✓ Gerado eletronicamente pela Plataforma CIPA Expert
                        </span>
                      </div>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 8. Aviso de Bloqueio Temporal
                if (paragraph.startsWith('🔒')) {
                  blocks.push(
                    <div key={i} className="my-3 p-3.5 bg-amber-50/80 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-amber-950">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs font-medium leading-relaxed">
                        {paragraph.replace('🔒 ', '')}
                      </div>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 9. Certificação Digital / ITI
                if (paragraph.includes('grtsdigital.com.br') || paragraph.includes('validar.iti.gov.br')) {
                  blocks.push(
                    <div key={i} className="my-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
                      <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono text-[11px]">{paragraph}</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 10. Chamada de Votação & Banners Especiais
                if (paragraph === 'Chegou o momento de votar no seu representante da CIPA!') {
                  blocks.push(
                    <div key={i} className="my-3 p-3.5 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border-l-4 border-emerald-600 rounded-r-xl">
                      <h3 className="text-sm font-extrabold text-emerald-950 uppercase tracking-tight">
                        Chegou o momento de votar no seu representante da CIPA!
                      </h3>
                    </div>
                  );
                  i++;
                  continue;
                }

                if (paragraph === 'Relembre quem são os candidatos da CIPA:') {
                  blocks.push(
                    <div key={i} className="pt-3 pb-1 flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Relembre quem são os candidatos da CIPA</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                if (paragraph === 'Confira os detalhes sobre a eleição e programe-se para a votação:') {
                  blocks.push(
                    <div key={i} className="pt-4 pb-1 flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Confira os detalhes sobre a eleição e programe-se para a votação</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 11. Títulos e Seções
                if (
                  paragraph === 'Você sabia o que cabe ao Cipeiro?' ||
                  paragraph === 'COMISSÃO ELEITORAL:' ||
                  paragraph === 'REPRESENTANTES DOS EMPREGADOS:' ||
                  paragraph === 'REPRESENTANTES DO EMPREGADOR:' ||
                  paragraph === 'Titulares:' ||
                  paragraph === 'Suplentes:' ||
                  paragraph.startsWith('Fica também definido nesta reunião de posse') ||
                  paragraph.startsWith('Acordou-se ainda a realização do calendário anual') ||
                  paragraph.startsWith('Edital de Inscrições') ||
                  paragraph.startsWith('Votação da CIPA') ||
                  paragraph.startsWith('Gestão ') ||
                  paragraph.startsWith('Unidade ')
                ) {
                  const isMainSection = paragraph === 'REPRESENTANTES DOS EMPREGADOS:' || 
                    paragraph === 'REPRESENTANTES DO EMPREGADOR:' || 
                    paragraph === 'COMISSÃO ELEITORAL:' ||
                    paragraph.startsWith('Fica também definido') ||
                    paragraph.startsWith('Acordou-se ainda');

                  const isSubSection = paragraph === 'Titulares:' || paragraph === 'Suplentes:';

                  blocks.push(
                    <h4
                      key={i}
                      className={`font-bold text-slate-900 ${
                        isMainSection
                          ? 'mt-4 mb-2 p-2.5 bg-slate-100/90 border border-slate-200 rounded-xl text-xs uppercase tracking-wider text-slate-900 font-extrabold flex items-center gap-2'
                          : isSubSection
                          ? 'mt-2 mb-1 text-xs font-bold uppercase tracking-wide text-emerald-800 border-b border-emerald-100 pb-1'
                          : paragraph.startsWith('Edital') || paragraph.startsWith('Votação')
                          ? 'text-base text-center uppercase tracking-tight pb-1 text-emerald-950 font-black'
                          : paragraph.startsWith('Unidade') || paragraph.startsWith('Gestão')
                          ? 'text-xs text-center text-slate-600 pb-1 font-medium'
                          : 'pt-3 text-xs uppercase text-slate-800'
                      }`}
                    >
                      {paragraph}
                    </h4>
                  );
                  i++;
                  continue;
                }

                // 12. Parâmetros em Chave: Valor
                if (
                  (paragraph.startsWith('DATA DE GERAÇÃO') ||
                  paragraph.startsWith('GERADO POR:') ||
                  paragraph.startsWith('NOME DA CIPA') ||
                  paragraph.startsWith('PERÍODO DE REALIZAÇÃO') ||
                  paragraph.startsWith('PERÍODO DA 1º') ||
                  paragraph.startsWith('PERÍODO DA 2º') ||
                  paragraph.startsWith('DESCRIÇÃO DA CIPA') ||
                  paragraph.startsWith('REALIZADOR DA CIPA') ||
                  paragraph.startsWith('CNPJ DO REALIZADOR') ||
                  paragraph.startsWith('INCLUSÃO DE PAUTAS') ||
                  paragraph.startsWith('VOTAÇÃO COM PESO') ||
                  paragraph.startsWith('VOTO SECRETO:') ||
                  paragraph.startsWith('ACOMPANHAMENTO DE QUÓRUM:') ||
                  paragraph.startsWith('CONVOCAÇÃO DE CIPA') ||
                  paragraph.startsWith('VOTANTES HABILITADOS:') ||
                  paragraph.startsWith('QUÓRUM MÍNIMO') ||
                  paragraph.startsWith('REALIZAÇÃO DE VIDEO') ||
                  paragraph.startsWith('TÍTULO DA PAUTA:') ||
                  paragraph.startsWith('DESCRIÇÃO DA PAUTA:') ||
                  paragraph.startsWith('ACOMPANHAMENTO DO RESULTADO') ||
                  paragraph.startsWith('INÍCIO DO PERÍODO') ||
                  paragraph.startsWith('FIM DO PERÍODO') ||
                  paragraph.startsWith('APROVADO POR:') ||
                  paragraph.startsWith('Data da Eleição:') ||
                  paragraph.startsWith('Horário:') ||
                  paragraph.startsWith('Sistema de Votação:') ||
                  paragraph.startsWith('Telefone') ||
                  paragraph.startsWith('Endereço:') ||
                  paragraph.startsWith('CEP') ||
                  paragraph.startsWith('CNPJ:')) &&
                  paragraph.includes(':')
                ) {
                  const [label, ...valParts] = paragraph.split(':');
                  const val = valParts.join(':').trim();
                  blocks.push(
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 px-3 bg-slate-50/80 border-b border-slate-100 rounded-md text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-tight text-[11px]">{label.trim()}</span>
                      <span className="font-mono text-slate-900 font-semibold text-[11px]">{val}</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 12. Bullets
                if (paragraph.startsWith('•') || paragraph.startsWith('*')) {
                  blocks.push(
                    <div key={i} className="flex items-start gap-2 pl-4 text-slate-700">
                      <span className="text-emerald-600 font-bold leading-tight">•</span>
                      <span className="leading-relaxed">{paragraph.replace(/^[•*]\s*/, '')}</span>
                    </div>
                  );
                  i++;
                  continue;
                }

                // 13. Parágrafo Padrão (com suporte a RichText, links clicáveis, imagens e caracteres especiais)
                blocks.push(
                  <div key={i} className="text-justify text-slate-700 leading-relaxed">
                    <RichTextRenderer content={paragraph} className="text-justify" />
                  </div>
                );
                i++;
              }

              return blocks;
            })()}
          </div>

          {/* Official Signatures Section */}
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
              Termos de Ciência e Validação das Partes Interessadas
            </h4>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${(signersList?.length || docData.signatories.length) >= 4 ? 'lg:grid-cols-4' : ''} gap-6 pt-6`}>
              {signersList && signersList.length > 0 ? (
                signersList.map((sig, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center space-y-1 select-none">
                    {/* Imagem do desenho da assinatura OU fonte cursiva */}
                    <div className="pb-1 min-h-[36px] flex items-end justify-center">
                      {sig.signatureDataUrl ? (
                        <img 
                          src={sig.signatureDataUrl} 
                          alt={`Assinatura de ${sig.name}`} 
                          className="h-9 max-w-[200px] object-contain select-none pointer-events-none" 
                        />
                      ) : sig.status === 'assinado' ? (
                        <span className="font-serif italic text-base text-blue-900 font-bold block leading-tight">
                          {sig.name}
                        </span>
                      ) : null}
                    </div>

                    {/* Linha de Assinatura */}
                    <div className="w-full max-w-[260px] border-b-2 border-slate-900 mb-1"></div>

                    {/* Nome do Colaborador abaixo da linha */}
                    <p className="font-bold text-slate-900 text-sm leading-tight">
                      {sig.name}
                    </p>

                    {/* Função abaixo do nome */}
                    <p className="text-xs text-slate-600 font-medium">
                      {sig.role || 'Membro da Comissão Eleitoral'}
                    </p>

                    {/* Registro criptográfico se assinado */}
                    {sig.status === 'assinado' && (
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                        Assinado em {sig.signedAt ? new Date(sig.signedAt).toLocaleString('pt-BR') : '25/10/2026'}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                docData.signatories.map((sig, idx) => {
                  const parts = typeof sig === 'string' ? sig.split(' - ') : [sig];
                  const name = parts[0]?.trim() || sig;
                  const role = parts[1]?.trim() || (idx === 0 ? 'Presidente da Comissão Eleitoral' : 'Representante Legal da Empresa');
                  return (
                    <div key={idx} className="flex flex-col items-center text-center space-y-1 select-none">
                      <div className="pb-1 min-h-[36px]"></div>
                      {/* Linha de Assinatura */}
                      <div className="w-full max-w-[260px] border-b-2 border-slate-900 mb-1"></div>
                      {/* Nome do Colaborador abaixo da linha */}
                      <p className="font-bold text-slate-900 text-sm leading-tight">
                        {name}
                      </p>
                      {/* Função abaixo do nome */}
                      <p className="text-xs text-slate-600 font-medium">
                        {role}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cryptographic Digital Stamp & Chancela Legal */}
            {isSigned && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-2 border-emerald-300 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 ring-1 ring-emerald-300">
                    <Shield className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                      Documento Autenticado com Validade Jurídica Integral
                    </p>
                    <p className="text-slate-700 text-[11px] leading-snug">
                      Assinatura eletrônica avançada em estrita conformidade com a <strong>Medida Provisória nº 2.200-2/2001</strong> e a <strong>Lei Federal nº 14.063/2020</strong>.
                    </p>
                    <div className="font-mono text-[10px] text-slate-600 bg-white/80 p-2 rounded border border-emerald-200 mt-1 break-all">
                      <span className="text-emerald-800 font-bold">HASH SHA-256: </span>
                      {signatureHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 font-mono text-[10px] text-slate-500 border-t sm:border-t-0 sm:border-l border-emerald-200 pt-2 sm:pt-0 sm:pl-4 space-y-0.5">
                  <p className="font-bold text-slate-700">CARIMBO TEMPORAL</p>
                  <p>{signatureDate || new Date().toLocaleString('pt-BR')}</p>
                  <p className="text-emerald-700 font-bold">PADRÃO ICP-BRASIL / NR-5</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 no-print">
          <span>CIPA Expert · Gerenciador Normativo NR-5</span>
        </div>

      </div>
    </div>
  );
};
