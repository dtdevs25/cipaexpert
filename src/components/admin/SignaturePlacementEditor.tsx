import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  Trash2, 
  Move, 
  Calendar, 
  FileCheck2, 
  Sparkles, 
  Info,
  CheckCircle2,
  MousePointer,
  Eye,
  EyeOff,
  ShieldCheck,
  GripVertical
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

// Cores temáticas por signatário
const SIGNER_COLORS = [
  { bg: 'bg-blue-50/95', border: 'border-blue-500', text: 'text-blue-950', badge: 'bg-blue-600 text-white', ring: 'ring-blue-400' },
  { bg: 'bg-emerald-50/95', border: 'border-emerald-500', text: 'text-emerald-950', badge: 'bg-emerald-600 text-white', ring: 'ring-emerald-400' },
  { bg: 'bg-purple-50/95', border: 'border-purple-500', text: 'text-purple-950', badge: 'bg-purple-600 text-white', ring: 'ring-purple-400' },
  { bg: 'bg-amber-50/95', border: 'border-amber-500', text: 'text-amber-950', badge: 'bg-amber-600 text-white', ring: 'ring-amber-400' },
  { bg: 'bg-rose-50/95', border: 'border-rose-500', text: 'text-rose-950', badge: 'bg-rose-600 text-white', ring: 'ring-rose-400' },
  { bg: 'bg-indigo-50/95', border: 'border-indigo-500', text: 'text-indigo-950', badge: 'bg-indigo-600 text-white', ring: 'ring-indigo-400' }
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
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  
  // Estado para arraste fluido
  const [activeDrag, setActiveDrag] = useState<{
    tagId: string;
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
  } | null>(null);

  const pageContainerRef = useRef<HTMLDivElement>(null);

  const activeSigner = signers[selectedSignerIndex] || signers[0];

  // Listener global de arraste de mouse/touch
  useEffect(() => {
    if (!activeDrag) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!pageContainerRef.current) return;
      const rect = pageContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - activeDrag.startX;
      const deltaY = e.clientY - activeDrag.startY;

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      let newPosX = Math.round(activeDrag.initialPosX + deltaPercentX);
      let newPosY = Math.round(activeDrag.initialPosY + deltaPercentY);

      // Limites de segurança para não ultrapassar a folha
      newPosX = Math.max(2, Math.min(76, newPosX));
      newPosY = Math.max(3, Math.min(94, newPosY));

      onChangePositions(
        positions.map(p => (p.id === activeDrag.tagId ? { ...p, posX: newPosX, posY: newPosY } : p))
      );
    };

    const handlePointerUp = () => {
      setActiveDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDrag, positions, onChangePositions]);

  // Iniciar arraste do marcador
  const handleTagPointerDown = (tagId: string, e: React.PointerEvent) => {
    if (readOnly || isPreviewMode) return;
    
    // Ignora se o usuário clicou em botão, select ou links
    if ((e.target as HTMLElement).closest('button, select, input, option')) return;

    e.preventDefault();
    e.stopPropagation();

    const tag = positions.find(p => p.id === tagId);
    if (!tag) return;

    setActiveDrag({
      tagId,
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: tag.posX,
      initialPosY: tag.posY
    });
  };

  // Adiciona campo ao clicar na folha do documento
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || isPreviewMode || !pageContainerRef.current || !activeSigner) return;
    
    // Evita adicionar se clicou em um marcador existente ou durante arraste
    if ((e.target as HTMLElement).closest('[data-signature-tag]')) return;
    if (activeDrag) return;

    const rect = pageContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let posX = Math.round((clickX / rect.width) * 100);
    let posY = Math.round((clickY / rect.height) * 100);

    posX = Math.max(5, Math.min(75, posX));
    posY = Math.max(5, Math.min(92, posY));

    const newTag: SignatureTagPosition = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      signerEmail: activeSigner.email,
      signerName: activeSigner.name,
      type: selectedFieldType,
      page: 1,
      posX,
      posY
    };

    onChangePositions([...positions, newTag]);
  };

  // Atualizar o signatário de um campo existente via lista suspensa
  const handleSignerChange = (tagId: string, newEmail: string) => {
    const selected = signers.find(s => s.email.toLowerCase() === newEmail.toLowerCase());
    if (!selected) return;

    onChangePositions(
      positions.map(p => (p.id === tagId ? { ...p, signerEmail: selected.email, signerName: selected.name } : p))
    );
  };

  // Atualizar o tipo de campo (assinatura, rubrica, data)
  const handleTypeChange = (tagId: string, newType: 'assinatura' | 'rubrica' | 'data') => {
    onChangePositions(
      positions.map(p => (p.id === tagId ? { ...p, type: newType } : p))
    );
  };

  // Remove tag específica
  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChangePositions(positions.filter(p => p.id !== tagId));
  };

  // Preset: Distribuir Automaticamente no Rodapé
  const handleAutoDistributeBottom = () => {
    const total = signers.length;
    if (total === 0) return;

    const autoTags: SignatureTagPosition[] = signers.map((s, idx) => {
      const colWidth = 100 / Math.min(total, 2);
      const isSecondRow = idx >= 2;
      const colIndex = idx % 2;

      const posX = Math.round(colIndex * colWidth + (colWidth * 0.08));
      const posY = isSecondRow ? 86 : 75;

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

  // Preset: Adicionar Rubricas no Canto
  const handleAddInitialsBottomRight = () => {
    const initialTags: SignatureTagPosition[] = signers.map((s, idx) => ({
      id: `tag-rubrica-${Date.now()}-${idx}`,
      signerEmail: s.email,
      signerName: s.name,
      type: 'rubrica',
      page: 1,
      posX: 70 - (idx * 16),
      posY: 93
    }));

    onChangePositions([...positions, ...initialTags]);
  };

  // Limpar todos os campos
  const handleClearAll = () => {
    onChangePositions([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 w-full">
      
      {/* 1. Painel de Controle Lateral (Toolbar) */}
      {!readOnly && (
        <div className="w-full lg:w-76 shrink-0 space-y-4">
          
          {/* Botão de Destaque: PRÉVIA DA ASSINATURA (OLHINHO) */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 rounded-xl border border-blue-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                Modo Visualização
              </span>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isPreviewMode ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {isPreviewMode ? 'PRÉVIA ATIVA' : 'EDIÇÃO'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 ${
                isPreviewMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300' 
                  : 'bg-white hover:bg-blue-100/60 text-blue-900 border border-blue-300'
              }`}
            >
              {isPreviewMode ? (
                <>
                  <EyeOff className="w-4 h-4 text-white" />
                  <span>Voltar para Edição (Arrastar)</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Visualizar Como Ficará a Assinatura</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-blue-800/80 leading-tight">
              {isPreviewMode 
                ? 'Você está vendo o carimbo e a assinatura como aparecerão no PDF final.'
                : 'Clique para conferir a assinatura real e garantir o alinhamento no texto.'}
            </p>
          </div>

          {/* Card: Escolha do Signatário Padrão para Novos Cliques */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <PenTool className="w-4 h-4 text-emerald-600" />
                <span>Signatário Ativo</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {signers.length} disponível(is)
              </span>
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

          {/* Card: Tipo de Campo Padrão */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tipo para Novo Clique
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

          {/* Dicas de Arraste e Seleção */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <Move className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dicas de posicionamento:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[10px] leading-tight">
              <li><strong>Arrastar:</strong> Segure o campo pelo ícone de grade e mova-o livremente pela folha.</li>
              <li><strong>Mudar Signatário:</strong> Use a lista suspensa diretamente dentro de cada campo.</li>
              <li><strong>Prévia:</strong> Clique no botão de olho acima para conferir o visual real da assinatura.</li>
            </ul>
          </div>

        </div>
      )}

      {/* 2. Visualizador da Folha A4 Interativa (Área de Posicionamento e Prévia) */}
      <div className="flex-1 flex flex-col items-center bg-slate-200/80 p-3 sm:p-6 rounded-2xl border border-slate-300 overflow-x-auto min-h-[500px]">
        
        {/* Barra Superior da Folha: Modo e Alternância Rápida */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-3 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 font-mono">Documento NR-5</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{positions.length} campo(s) configurado(s)</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isPreviewMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-white text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-300'
            }`}
            title="Alternar entre modo de edição e prévia visual"
          >
            {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isPreviewMode ? 'Modo de Edição' : 'Prévia da Assinatura'}</span>
          </button>
        </div>

        {/* Folha A4 Estilizada com Sombreamento e Proporção Real */}
        <div 
          ref={pageContainerRef}
          onClick={handlePageClick}
          className={`relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-300 p-8 sm:p-12 min-h-[780px] select-none transition-all ${
            isPreviewMode ? 'cursor-default' : 'cursor-crosshair'
          }`}
          style={{ minHeight: '800px' }}
        >
          {/* Tarja Lateral Criptográfica Mock */}
          <div className="absolute left-2 top-8 bottom-8 flex flex-col justify-between items-center text-[8px] font-mono text-slate-300 pointer-events-none select-none">
            <span className="[writing-mode:vertical-lr] rotate-180 tracking-widest uppercase">
              ÁREA DE POSICIONAMENTO DIGITAL · MP 2.200-2/2001 · LEI 14.063/2020
            </span>
            <span className="[writing-mode:vertical-lr] rotate-180 text-emerald-600 font-bold">
              CIPASIGN · CIPA EXPERT
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
          <div className="mt-14 pt-6 border-t border-slate-200 pointer-events-none opacity-60">
            <p className="text-[10px] font-bold uppercase text-slate-400 text-center tracking-wider mb-4">
              Local Reservado para Chancelas Eletrônicas e Assinaturas
            </p>
          </div>

          {/* ========================================================================= */}
          {/* MODO PRÉVIA: RENDERIZAÇÃO REALISTA DE COMO A ASSINATURA FICARÁ NO PDF     */}
          {/* ========================================================================= */}
          {isPreviewMode && (
            <>
              {positions.map((pos) => {
                return (
                  <div
                    key={pos.id}
                    style={{
                      position: 'absolute',
                      left: `${pos.posX}%`,
                      top: `${pos.posY}%`,
                      transform: 'translate(-5%, -50%)',
                      zIndex: 30
                    }}
                    className="pointer-events-none select-none animate-in fade-in zoom-in-95 duration-200"
                  >
                    {pos.type === 'assinatura' && (
                      <div className="bg-white/95 border-2 border-emerald-600/90 rounded-lg p-2.5 shadow-lg min-w-[220px] max-w-[270px] text-left ring-1 ring-emerald-500/20">
                        {/* Assinatura Manuscrita Cursiva Simulada */}
                        <div className="pb-1 border-b border-emerald-300 flex items-center justify-between">
                          <span className="font-serif italic text-base text-blue-900 font-bold tracking-wider select-none pr-2">
                            {pos.signerName}
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        </div>

                        {/* Carimbo Digital de Conformidade NR-5 / ICP-Brasil */}
                        <div className="mt-1 text-[8px] text-slate-600 leading-tight space-y-0.5 font-mono">
                          <p className="font-bold text-emerald-800 uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Assinado Digitalmente · CIPASign
                          </p>
                          <p className="truncate"><strong>Nome:</strong> {pos.signerName}</p>
                          <p className="truncate"><strong>E-mail:</strong> {pos.signerEmail}</p>
                          <p><strong>Data/Hora:</strong> 25/10/2026 14:35:12 BRT</p>
                          <p className="text-[7.5px] text-slate-400 truncate">
                            SHA256: 4e8f1b...c92a (MP 2.200-2 / Lei 14.063)
                          </p>
                        </div>
                      </div>
                    )}

                    {pos.type === 'rubrica' && (
                      <div className="bg-white/95 border-2 border-blue-500 rounded-lg p-2 shadow-md text-left min-w-[130px] ring-1 ring-blue-400/20">
                        <div className="flex items-center justify-between border-b border-blue-200 pb-1">
                          <span className="font-serif italic text-base text-blue-900 font-bold">
                            {pos.signerName.split(' ').map(n => n[0]).join('')}.
                          </span>
                          <FileCheck2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        </div>
                        <p className="text-[8px] text-slate-600 font-mono mt-0.5 truncate">
                          Rubrica Digital · {pos.signerName.split(' ')[0]}
                        </p>
                      </div>
                    )}

                    {pos.type === 'data' && (
                      <div className="bg-white/95 border border-slate-300 rounded p-1.5 shadow-sm text-[9px] font-mono text-slate-700">
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <Calendar className="w-3 h-3" />
                          <span>25/10/2026 14:35</span>
                        </div>
                        <p className="text-[8px] text-slate-400">Data e Hora Certificada</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ========================================================================= */}
          {/* MODO EDIÇÃO: MARCADORES INTERATIVOS ARRASTÁVEIS COM LISTA SUSPENSA        */}
          {/* ========================================================================= */}
          {!isPreviewMode && positions.map((pos) => {
            const signerIdx = signers.findIndex(s => s.email.toLowerCase() === pos.signerEmail.toLowerCase());
            const color = SIGNER_COLORS[signerIdx >= 0 ? signerIdx % SIGNER_COLORS.length : 0];
            const isBeingDragged = activeDrag?.tagId === pos.id;

            return (
              <div
                key={pos.id}
                data-signature-tag="true"
                style={{
                  position: 'absolute',
                  left: `${pos.posX}%`,
                  top: `${pos.posY}%`,
                  transform: 'translate(-5%, -50%)',
                  zIndex: isBeingDragged ? 50 : 20
                }}
                onPointerDown={(e) => handleTagPointerDown(pos.id, e)}
                className={`group flex items-center gap-1.5 p-2 rounded-xl border-2 ${color.border} ${color.bg} shadow-md backdrop-blur-xs transition-shadow duration-100 select-none ${
                  isBeingDragged 
                    ? 'ring-4 ring-emerald-400 scale-105 shadow-2xl cursor-grabbing' 
                    : 'cursor-grab hover:shadow-lg'
                }`}
              >
                {/* Ícone de Arraste (Grip) */}
                <div 
                  className="cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-slate-700 transition-colors p-0.5"
                  title="Clique e arraste para mover o campo pela folha"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Ícone do Tipo */}
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${color.badge}`}>
                  {pos.type === 'assinatura' && <PenTool className="w-3.5 h-3.5" />}
                  {pos.type === 'rubrica' && <FileCheck2 className="w-3.5 h-3.5" />}
                  {pos.type === 'data' && <Calendar className="w-3.5 h-3.5" />}
                </div>

                {/* Seletores Interativos: Signatário e Tipo de Campo */}
                <div className="flex flex-col gap-1 pr-1 text-left">
                  {/* 1. Lista Suspensa de Signatários */}
                  <div className="flex items-center gap-1">
                    <select
                      value={pos.signerEmail}
                      onChange={(e) => handleSignerChange(pos.id, e.target.value)}
                      className="bg-white text-slate-900 border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs max-w-[155px] truncate"
                      title="Escolha quem assinará neste local"
                    >
                      {signers.map((s, idx) => (
                        <option key={idx} value={s.email}>
                          {s.name} ({s.role || s.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Tipo de Campo */}
                  <div className="flex items-center gap-1">
                    <select
                      value={pos.type}
                      onChange={(e) => handleTypeChange(pos.id, e.target.value as any)}
                      className="bg-white/80 text-slate-700 border border-slate-200 rounded px-1 py-0.5 text-[9px] font-semibold cursor-pointer"
                    >
                      <option value="assinatura">Assinatura</option>
                      <option value="rubrica">Rubrica</option>
                      <option value="data">Data</option>
                    </select>

                    <span className="text-[9px] text-slate-500 font-mono">
                      {pos.posX}% x {pos.posY}%
                    </span>
                  </div>
                </div>

                {/* Botão de Excluir Marcador */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(pos.id, e)}
                    className="p-1 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer self-start ml-0.5"
                    title="Remover este campo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Dica de Tela Vazia de Posições */}
          {positions.length === 0 && !readOnly && !isPreviewMode && (
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
