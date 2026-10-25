import React, { useState, useRef } from 'react';
import { 
  PenTool, 
  Trash2, 
  Move, 
  Calendar, 
  FileCheck2, 
  Sparkles, 
  Layers, 
  Info,
  CheckCircle2,
  MousePointer,
  HelpCircle
} from 'lucide-react';
import { SignatureTagPosition } from '../../services/signatureService';

interface SignerOption {
  name: string;
  email: string;
  role?: string;
}

interface SignaturePlacementEditorProps {
  documentTitle: string;
  documentContent: string[];
  companyName: string;
  cnpj: string;
  normativeCode?: string;
  signers: SignerOption[];
  positions: SignatureTagPosition[];
  onChangePositions: (positions: SignatureTagPosition[]) => void;
  readOnly?: boolean;
}

// Cores temáticas por índice de signatário (Padrão DocuSign / D4Sign)
const SIGNER_COLORS = [
  { bg: 'bg-blue-100/90', border: 'border-blue-500', text: 'text-blue-950', badge: 'bg-blue-600 text-white', ring: 'ring-blue-400' },
  { bg: 'bg-emerald-100/90', border: 'border-emerald-500', text: 'text-emerald-950', badge: 'bg-emerald-600 text-white', ring: 'ring-emerald-400' },
  { bg: 'bg-purple-100/90', border: 'border-purple-500', text: 'text-purple-950', badge: 'bg-purple-600 text-white', ring: 'ring-purple-400' },
  { bg: 'bg-amber-100/90', border: 'border-amber-500', text: 'text-amber-950', badge: 'bg-amber-600 text-white', ring: 'ring-amber-400' },
  { bg: 'bg-rose-100/90', border: 'border-rose-500', text: 'text-rose-950', badge: 'bg-rose-600 text-white', ring: 'ring-rose-400' },
  { bg: 'bg-indigo-100/90', border: 'border-indigo-500', text: 'text-indigo-950', badge: 'bg-indigo-600 text-white', ring: 'ring-indigo-400' }
];

export const SignaturePlacementEditor: React.FC<SignaturePlacementEditorProps> = ({
  documentTitle,
  documentContent,
  companyName,
  cnpj,
  normativeCode,
  signers,
  positions,
  onChangePositions,
  readOnly = false
}) => {
  const [selectedSignerIndex, setSelectedSignerIndex] = useState<number>(0);
  const [selectedFieldType, setSelectedFieldType] = useState<'assinatura' | 'rubrica' | 'data'>('assinatura');
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const activeSigner = signers[selectedSignerIndex] || signers[0];
  const activeColor = SIGNER_COLORS[selectedSignerIndex % SIGNER_COLORS.length];

  // Adiciona campo ao clicar na folha do documento
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !pageContainerRef.current || !activeSigner) return;
    
    // Evita adicionar se clicou em um marcador existente
    if ((e.target as HTMLElement).closest('[data-signature-tag]')) return;

    const rect = pageContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Converte para percentual relativo à folha (0 - 100%)
    let posX = Math.round((clickX / rect.width) * 100);
    let posY = Math.round((clickY / rect.height) * 100);

    // Ajusta margens de segurança para a tag não vazar
    posX = Math.max(5, Math.min(75, posX));
    posY = Math.max(5, Math.min(92, posY));

    const newTag: SignatureTagPosition = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      signerEmail: activeSigner.email,
      signerName: activeSigner.name,
      type: selectedFieldType,
      page: 1,
      posX,
      posY
    };

    onChangePositions([...positions, newTag]);
  };

  // Remove tag específica
  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChangePositions(positions.filter(p => p.id !== tagId));
  };

  // Preset: Distribuir Automaticamente no Rodapé (Estilo Padrão Brasileiro)
  const handleAutoDistributeBottom = () => {
    const total = signers.length;
    if (total === 0) return;

    const autoTags: SignatureTagPosition[] = signers.map((s, idx) => {
      // Distribui horizontalmente em colunas no rodapé
      const colWidth = 100 / Math.min(total, 2);
      const isSecondRow = idx >= 2;
      const colIndex = idx % 2;

      const posX = Math.round(colIndex * colWidth + (colWidth * 0.1));
      const posY = isSecondRow ? 86 : 76;

      return {
        id: `tag-auto-${Date.now()}-${idx}`,
        signerEmail: s.email,
        signerName: s.name,
        type: 'assinatura',
        page: 1,
        posX,
        posY
      };
    });

    onChangePositions(autoTags);
  };

  // Preset: Adicionar Rubricas no Canto Inferior Direito
  const handleAddInitialsBottomRight = () => {
    const initialTags: SignatureTagPosition[] = signers.map((s, idx) => ({
      id: `tag-rubrica-${Date.now()}-${idx}`,
      signerEmail: s.email,
      signerName: s.name,
      type: 'rubrica',
      page: 1,
      posX: 70 - (idx * 16),
      posY: 94
    }));

    onChangePositions([...positions, ...initialTags]);
  };

  // Limpar todos os campos
  const handleClearAll = () => {
    onChangePositions([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 w-full">
      
      {/* 1. Painel de Controle Lateral (DocuSign / D4Sign Toolbar) */}
      {!readOnly && (
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          
          {/* Card: Selecione o Signatário */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <PenTool className="w-4 h-4 text-emerald-600" />
              <span>1. Escolha o Signatário</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {signers.map((s, idx) => {
                const color = SIGNER_COLORS[idx % SIGNER_COLORS.length];
                const isSelected = idx === selectedSignerIndex;
                const signerTagCount = positions.filter(p => p.signerEmail.toLowerCase() === s.email.toLowerCase()).length;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSignerIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? `${color.bg} ${color.border} font-bold shadow-xs ring-2 ${color.ring}`
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{s.role || s.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      signerTagCount > 0 ? color.badge : 'bg-slate-200 text-slate-600'
                    }`}>
                      {signerTagCount} {signerTagCount === 1 ? 'campo' : 'campos'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Tipo de Marcador */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Tipo de Campo
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedFieldType('assinatura')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedFieldType === 'assinatura'
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 mb-1" />
                <span>Assinatura</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFieldType('rubrica')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedFieldType === 'rubrica'
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 mb-1" />
                <span>Rubrica</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFieldType('data')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedFieldType === 'data'
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mb-1" />
                <span>Data</span>
              </button>
            </div>
          </div>

          {/* Card: Atalhos Automáticos */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Atalhos Rápidos</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleAutoDistributeBottom}
                className="w-full text-left px-3 py-2 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-medium text-emerald-900 transition-colors shadow-2xs flex items-center justify-between cursor-pointer"
              >
                <span>Distribuir no Rodapé</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono">Auto</span>
              </button>

              <button
                type="button"
                onClick={handleAddInitialsBottomRight}
                className="w-full text-left px-3 py-2 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-medium text-emerald-900 transition-colors shadow-2xs flex items-center justify-between cursor-pointer"
              >
                <span>Adicionar Rubricas</span>
                <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">Canto</span>
              </button>
            </div>

            {positions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="w-full text-center px-2 py-1.5 text-[11px] text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors cursor-pointer"
              >
                Limpar todos os campos posicionados
              </button>
            )}
          </div>

          {/* Instruções Interativas */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <MousePointer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Como posicionar:</span>
            </div>
            <p>Clique em qualquer parte da folha do documento para marcar o local exato onde o signatário deverá assinar.</p>
          </div>

        </div>
      )}

      {/* 2. Visualizador da Folha A4 Interativa (Área de Posicionamento) */}
      <div className="flex-1 flex flex-col items-center bg-slate-200/80 p-3 sm:p-6 rounded-2xl border border-slate-300 overflow-x-auto min-h-[500px]">
        
        {/* Folha A4 Estilizada com Sombreamento e Proporção Real */}
        <div 
          ref={pageContainerRef}
          onClick={handlePageClick}
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-300 p-8 sm:p-12 min-h-[750px] cursor-crosshair select-none transition-shadow"
          style={{ minHeight: '780px' }}
        >
          {/* Tarja Lateral Criptográfica Mock */}
          <div className="absolute left-2 top-8 bottom-8 flex flex-col justify-between items-center text-[8px] font-mono text-slate-300 pointer-events-none select-none">
            <span className="[writing-mode:vertical-lr] rotate-180 tracking-widest uppercase">
              ÁREA DE POSICIONAMENTO DIGITAL · PADRÃO DOCUSIGN / D4SIGN · MP 2.200-2/2001
            </span>
            <span className="[writing-mode:vertical-lr] rotate-180 text-emerald-600 font-bold">
              CIPA EXPERT DOC-SIGN
            </span>
          </div>

          {/* Cabeçalho Institucional da Folha */}
          <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1 pointer-events-none">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              REPÚBLICA FEDERATIVA DO BRASIL · MINISTÉRIO DO TRABALHO E EMPREGO
            </p>
            <h2 className="text-base font-extrabold text-slate-900 uppercase">
              {documentTitle}
            </h2>
            <div className="text-[10px] text-slate-500 flex flex-wrap justify-center gap-x-3">
              <span><strong>Empresa:</strong> {companyName}</span>
              <span><strong>CNPJ:</strong> {cnpj}</span>
              {normativeCode && <span><strong>Norma:</strong> {normativeCode}</span>}
            </div>
          </div>

          {/* Conteúdo Parágrafos da Folha */}
          <div className="space-y-3 pt-4 text-xs text-slate-700 leading-relaxed pointer-events-none opacity-85">
            {documentContent.slice(0, 5).map((para, i) => (
              <p key={i} className="text-justify indent-6">
                {para}
              </p>
            ))}
            {documentContent.length > 5 && (
              <p className="text-center text-[10px] text-slate-400 italic pt-2">
                [... continuação dos termos e itens normativos regulamentares da NR-5 ...]
              </p>
            )}
          </div>

          {/* Rodapé Oficial Padrão (Guia Visual) */}
          <div className="mt-12 pt-6 border-t border-slate-200 pointer-events-none opacity-60">
            <p className="text-[10px] font-bold uppercase text-slate-400 text-center tracking-wider mb-4">
              Local Reservado para Chancelas Eletrônicas e Assinaturas
            </p>
          </div>

          {/* TAGS POSICIONADAS NA FOLHA (INTERATIVAS) */}
          {positions.map((pos) => {
            const signerIdx = signers.findIndex(s => s.email.toLowerCase() === pos.signerEmail.toLowerCase());
            const color = SIGNER_COLORS[signerIdx >= 0 ? signerIdx % SIGNER_COLORS.length : 0];

            return (
              <div
                key={pos.id}
                data-signature-tag="true"
                style={{
                  position: 'absolute',
                  left: `${pos.posX}%`,
                  top: `${pos.posY}%`,
                  transform: 'translate(-10%, -50%)',
                  zIndex: 20
                }}
                className={`group flex items-center gap-1.5 p-1.5 sm:p-2 rounded-lg border-2 ${color.border} ${color.bg} shadow-md backdrop-blur-xs transition-all animate-in zoom-in-90 duration-150 cursor-grab active:cursor-grabbing hover:scale-105`}
              >
                {/* Ícone de Tipo */}
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${color.badge}`}>
                  {pos.type === 'assinatura' && <PenTool className="w-3 h-3" />}
                  {pos.type === 'rubrica' && <FileCheck2 className="w-3 h-3" />}
                  {pos.type === 'data' && <Calendar className="w-3 h-3" />}
                </div>

                {/* Dados da Tag */}
                <div className="text-[10px] leading-tight select-none pr-1">
                  <p className={`font-extrabold ${color.text} truncate max-w-[140px]`}>
                    {pos.signerName}
                  </p>
                  <p className="text-[9px] text-slate-600 uppercase font-semibold">
                    {pos.type}
                  </p>
                </div>

                {/* Botão de Excluir Marcador */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(pos.id, e)}
                    className="p-1 rounded text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    title="Remover campo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Dica de Tela Vazia de Posições */}
          {positions.length === 0 && !readOnly && (
            <div className="absolute inset-x-8 bottom-16 p-4 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/90 text-center space-y-1.5 animate-pulse">
              <p className="text-xs font-bold text-emerald-950 flex items-center justify-center gap-1.5">
                <MousePointer className="w-4 h-4 text-emerald-600" />
                Nenhum local de assinatura definido ainda
              </p>
              <p className="text-[11px] text-emerald-800">
                Clique na folha acima onde deseja posicionar a assinatura de cada signatário, ou use o botão <strong>"Distribuir no Rodapé"</strong> no menu lateral.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
