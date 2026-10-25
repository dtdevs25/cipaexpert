import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  Trash2, 
  Move, 
  Calendar, 
  FileCheck2, 
  Sparkles, 
  CheckCircle2, 
  MousePointer, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  GripVertical,
  Minus,
  Plus,
  Maximize2,
  Lock
} from 'lucide-react';
import { SignatureTagPosition } from '../../services/signatureService';

export interface SignerOption {
  name: string;
  email: string;
  role?: string;
  signatureType?: 'desenhada' | 'padrao_cursiva';
  signatureDataUrl?: string;
  status?: 'pendente' | 'assinado' | 'aguardando_turno';
  signedAt?: string;
  hash?: string;
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
  const [defaultScale, setDefaultScale] = useState<number>(1.0);
  const [isGlobalPreview, setIsGlobalPreview] = useState<boolean>(false);
  
  // Tags que estão individualmente em modo de visualização de assinatura simulada (sem o marcador)
  const [individualPreviewTagIds, setIndividualPreviewTagIds] = useState<Record<string, boolean>>({});

  // Verifica se qualquer signatário deste documento já assinou
  const hasAnySignerSigned = signers.some(s => s.status === 'assinado');
  const isDocumentLocked = readOnly || hasAnySignerSigned;

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

  // Alternar visualização simulada de uma tag individual (tira o marcador e mostra a assinatura)
  const toggleTagPreview = (tagId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIndividualPreviewTagIds(prev => ({
      ...prev,
      [tagId]: !prev[tagId]
    }));
  };

  // Alterar escala / tamanho da assinatura de uma tag
  const updateTagScale = (tagId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isDocumentLocked) return;

    onChangePositions(
      positions.map(p => {
        if (p.id !== tagId) return p;
        const currentScale = p.scale ?? 1.0;
        const newScale = Math.max(0.65, Math.min(1.5, Math.round((currentScale + delta) * 100) / 100));
        return { ...p, scale: newScale };
      })
    );
  };

  // Listener global de arraste de mouse/touch
  useEffect(() => {
    if (!activeDrag || isDocumentLocked) return;

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
  }, [activeDrag, positions, onChangePositions, isDocumentLocked]);

  // Iniciar arraste do marcador (bloqueado se documento ou signatário já assinou)
  const handleTagPointerDown = (tagId: string, e: React.PointerEvent) => {
    if (isDocumentLocked) return;
    
    const tag = positions.find(p => p.id === tagId);
    if (!tag) return;

    // Se o signatário dessa tag já assinou, bloqueia movimentação individual
    const signerOfTag = signers.find(s => s.email.toLowerCase() === tag.signerEmail.toLowerCase());
    if (signerOfTag?.status === 'assinado') return;

    // Ignora se o usuário clicou em botão, select ou option
    if ((e.target as HTMLElement).closest('button, select, input, option')) return;

    e.preventDefault();
    e.stopPropagation();

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
    if (isDocumentLocked || isGlobalPreview || !pageContainerRef.current || !activeSigner) return;
    
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
      posY,
      scale: defaultScale
    };

    onChangePositions([...positions, newTag]);
  };

  // Atualizar o signatário de um campo existente via lista suspensa
  const handleSignerChange = (tagId: string, newEmail: string) => {
    if (isDocumentLocked) return;

    const tag = positions.find(p => p.id === tagId);
    if (!tag) return;

    const signerOfTag = signers.find(s => s.email.toLowerCase() === tag.signerEmail.toLowerCase());
    if (signerOfTag?.status === 'assinado') return; // Bloqueado se já assinou

    const selected = signers.find(s => s.email.toLowerCase() === newEmail.toLowerCase());
    if (!selected) return;

    onChangePositions(
      positions.map(p => (p.id === tagId ? { ...p, signerEmail: selected.email, signerName: selected.name } : p))
    );
  };

  // Atualizar o tipo de campo (assinatura, rubrica, data)
  const handleTypeChange = (tagId: string, newType: 'assinatura' | 'rubrica' | 'data') => {
    if (isDocumentLocked) return;

    const tag = positions.find(p => p.id === tagId);
    if (!tag) return;

    const signerOfTag = signers.find(s => s.email.toLowerCase() === tag.signerEmail.toLowerCase());
    if (signerOfTag?.status === 'assinado') return;

    onChangePositions(
      positions.map(p => (p.id === tagId ? { ...p, type: newType } : p))
    );
  };

  // Remove tag específica
  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDocumentLocked) return;

    const tag = positions.find(p => p.id === tagId);
    if (!tag) return;

    const signerOfTag = signers.find(s => s.email.toLowerCase() === tag.signerEmail.toLowerCase());
    if (signerOfTag?.status === 'assinado') return;

    onChangePositions(positions.filter(p => p.id !== tagId));
  };

  // Preset: Distribuir Automaticamente no Rodapé
  const handleAutoDistributeBottom = () => {
    if (isDocumentLocked) return;
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
        posY,
        scale: 1.0
      };
    });

    onChangePositions(autoTags);
  };

  // Preset: Adicionar Rubricas no Canto
  const handleAddInitialsBottomRight = () => {
    if (isDocumentLocked) return;
    const initialTags: SignatureTagPosition[] = signers.map((s, idx) => ({
      id: `tag-rubrica-${Date.now()}-${idx}`,
      signerEmail: s.email,
      signerName: s.name,
      type: 'rubrica',
      page: 1,
      posX: 70 - (idx * 16),
      posY: 93,
      scale: 0.85
    }));

    onChangePositions([...positions, ...initialTags]);
  };

  // Limpar todos os campos
  const handleClearAll = () => {
    if (isDocumentLocked) return;
    onChangePositions([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 w-full">
      
      {/* 1. Painel de Controle Lateral (Toolbar) */}
      <div className="w-full lg:w-76 shrink-0 space-y-4">
        
        {/* Banner de Aviso de Bloqueio quando alguém já assinou */}
        {isDocumentLocked && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 space-y-1 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Posicionamento Travado</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Este documento já possui assinaturas registradas. Para garantia de fé pública e conformidade legal (MP 2.200-2/2001), as posições não podem ser alteradas.
            </p>
          </div>
        )}

        {/* Botão de Destaque: PRÉVIA GERAL DA ASSINATURA (OLHINHO GLOBAL) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 rounded-xl border border-blue-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              Modo Visual
            </span>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
              isGlobalPreview ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {isGlobalPreview ? 'VER TODAS REAIS' : 'MODO MARCADORES'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsGlobalPreview(!isGlobalPreview)}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 ${
              isGlobalPreview 
                ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300' 
                : 'bg-white hover:bg-blue-100/60 text-blue-900 border border-blue-300'
            }`}
          >
            {isGlobalPreview ? (
              <>
                <EyeOff className="w-4 h-4 text-white" />
                <span>Voltar aos Marcadores</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Ver Todas as Assinaturas Reais</span>
              </>
            )}
          </button>
        </div>

        {/* Controles de Edição (Apenas se o documento NÃO estiver bloqueado) */}
        {!isDocumentLocked && (
          <>
            {/* Card: Tamanho Padrão das Novas Assinaturas */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tamanho da Assinatura</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  {Math.round(defaultScale * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDefaultScale(0.75)}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    defaultScale === 0.75 
                      ? 'bg-emerald-600 border-emerald-700 text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Pequeno (75%)"
                >
                  P (75%)
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultScale(1.0)}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    defaultScale === 1.0 
                      ? 'bg-emerald-600 border-emerald-700 text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Médio Padrão (100%)"
                >
                  M (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultScale(1.25)}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    defaultScale === 1.25 
                      ? 'bg-emerald-600 border-emerald-700 text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Grande (125%)"
                >
                  G (125%)
                </button>
              </div>
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
                  const isAlreadySigned = s.status === 'assinado';

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
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold truncate">{s.name}</p>
                          {isAlreadySigned && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{s.role || s.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isAlreadySigned 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : signerTagCount > 0 ? color.badge : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isAlreadySigned ? 'Assinado' : `${signerTagCount} ${signerTagCount === 1 ? 'campo' : 'campos'}`}
                      </span>
                    </button>
                  );
                })}
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
          </>
        )}

      </div>

      {/* 2. Visualizador da Folha A4 Interativa (Área de Posicionamento e Prévia) */}
      <div className="flex-1 flex flex-col items-center bg-slate-200/80 p-3 sm:p-6 rounded-2xl border border-slate-300 overflow-x-auto min-h-[500px]">
        
        {/* Barra Superior da Folha: Modo e Alternância Rápida */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-3 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 font-mono">Documento NR-5</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{positions.length} campo(s) configurado(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGlobalPreview(!isGlobalPreview)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isGlobalPreview 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-300'
              }`}
              title="Alternar entre modo de edição e prévia visual"
            >
              {isGlobalPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
              <span>{isGlobalPreview ? 'Modo Marcadores' : 'Ver Todas Assinadas'}</span>
            </button>
          </div>
        </div>

        {/* Folha A4 Estilizada com Sombreamento e Proporção Real */}
        <div 
          ref={pageContainerRef}
          onClick={handlePageClick}
          className={`relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-300 p-8 sm:p-12 min-h-[780px] select-none transition-all ${
            isGlobalPreview || isDocumentLocked ? 'cursor-default' : 'cursor-crosshair'
          }`}
          style={{ minHeight: '800px' }}
        >
          {/* Dados de Criptografia no Canto Superior Esquerdo da Página (Linha Única - Mínimo Regulamentar MP 2.200-2/2001) */}
          <div className="flex items-center justify-between text-left font-mono text-[7.5px] text-slate-500 select-none pb-2 border-b border-slate-100 mb-2 gap-2">
            <div className="flex items-center gap-1 truncate">
              <span className="font-bold text-emerald-800 shrink-0">Autenticação Digital MP 2.200-2/01</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 truncate">SHA-256: 4e8f1b92c0a87f54d19b...</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 shrink-0">25/10/2026 14:35 BRT</span>
            </div>
            <span className="text-[7.5px] font-mono text-slate-400 shrink-0 hidden sm:inline">
              Fé Pública Digital
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
          {/* RENDERIZAÇÃO DOS CAMPOS DE ASSINATURA NA FOLHA                            */}
          {/* ========================================================================= */}
          {positions.map((pos) => {
            const currentSigner = signers.find(s => s.email.toLowerCase() === pos.signerEmail.toLowerCase());
            const signerIdx = signers.findIndex(s => s.email.toLowerCase() === pos.signerEmail.toLowerCase());
            const color = SIGNER_COLORS[signerIdx >= 0 ? signerIdx % SIGNER_COLORS.length : 0];
            const isBeingDragged = activeDrag?.tagId === pos.id;
            const tagScale = pos.scale ?? 1.0;
            const isSignerSigned = currentSigner?.status === 'assinado';
            
            // Se o signatário já assinou, força exibição da assinatura real diretamente no local!
            // Ou se estiver em modo de prévia simulada (global ou individual)
            const isSimulatedPreview = isGlobalPreview || isSignerSigned || !!individualPreviewTagIds[pos.id];

            // --------------------------------------------------------------------------------------------------
            // CASO 1: ASSINATURA REAL/SIMULADA (Apenas assinatura, e abaixo email, data hora e hash, SEM LINHA NEM NADA)
            // --------------------------------------------------------------------------------------------------
            if (isSimulatedPreview) {
              return (
                <div
                  key={pos.id}
                  data-signature-tag="true"
                  style={{
                    position: 'absolute',
                    left: `${pos.posX}%`,
                    top: `${pos.posY}%`,
                    transform: `translate(-5%, -50%) scale(${tagScale})`,
                    transformOrigin: 'top left',
                    zIndex: isBeingDragged ? 50 : 25
                  }}
                  onPointerDown={(e) => handleTagPointerDown(pos.id, e)}
                  className={`group relative select-none animate-in fade-in zoom-in-95 duration-150 ${
                    isDocumentLocked || isSignerSigned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                  title={isSignerSigned ? 'Assinatura Oficial Homologada' : 'Clique e arraste para reposicionar'}
                >
                  {/* Botão de Retorno e Tamanho (Apenas se não assinou e não for lock geral) */}
                  {!isDocumentLocked && !isSignerSigned && !isGlobalPreview && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <button
                        type="button"
                        onClick={(e) => toggleTagPreview(pos.id, e)}
                        className="bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                        title="Voltar ao modo marcador"
                      >
                        <EyeOff className="w-3 h-3 text-white" />
                        <span>Voltar ao Marcador</span>
                      </button>

                      <div className="flex items-center bg-white/95 border border-slate-300 rounded px-1 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={(e) => updateTagScale(pos.id, -0.15, e)}
                          className="text-slate-600 hover:text-slate-900 font-bold px-1 cursor-pointer"
                          title="Diminuir"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] font-mono font-bold text-slate-800 px-0.5">
                          {Math.round(tagScale * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => updateTagScale(pos.id, 0.15, e)}
                          className="text-slate-600 hover:text-slate-900 font-bold px-1 cursor-pointer"
                          title="Aumentar"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Assinatura: SEM LINHA NEM NADA, apenas a assinatura e abaixo email, data hora e hash */}
                  <div 
                    onClick={() => !isDocumentLocked && !isSignerSigned && toggleTagPreview(pos.id)}
                    className="p-1 rounded-lg text-left select-none cursor-pointer"
                    title={isSignerSigned ? 'Assinatura Já Homologada' : 'Clique para voltar ao marcador'}
                  >
                    {/* Imagem do desenho da assinatura OU fonte cursiva */}
                    <div className="pb-0.5">
                      {currentSigner?.signatureDataUrl ? (
                        <img 
                          src={currentSigner.signatureDataUrl} 
                          alt={`Assinatura de ${pos.signerName}`} 
                          className="h-10 max-w-[210px] object-contain select-none pointer-events-none" 
                        />
                      ) : (
                        <span className="font-serif italic text-lg text-blue-900 font-bold tracking-wide select-none block leading-tight">
                          {pos.signerName}
                        </span>
                      )}
                    </div>

                    {/* Abaixo: estritamente e-mail, data/hora e hash, sem linhas */}
                    <div className="text-[9px] font-mono text-slate-700 leading-tight space-y-0.5">
                      <p className="truncate font-semibold text-slate-800">{pos.signerEmail}</p>
                      <p className="text-slate-600">
                        {currentSigner?.signedAt ? new Date(currentSigner.signedAt).toLocaleString('pt-BR') : '25/10/2026 14:35'}
                      </p>
                      <p className="text-slate-400 text-[8px] truncate">
                        Hash: {currentSigner?.hash ? `${currentSigner.hash.slice(0, 16)}...` : 'a8f93e2b...4c1d'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // -------------------------------------------------------------
            // CASO 2: MODO MARCADOR COM CONTROLES DE ARRASTE, LISTA E TAMANHO
            // -------------------------------------------------------------
            return (
              <div
                key={pos.id}
                data-signature-tag="true"
                style={{
                  position: 'absolute',
                  left: `${pos.posX}%`,
                  top: `${pos.posY}%`,
                  transform: `translate(-5%, -50%) scale(${tagScale})`,
                  transformOrigin: 'top left',
                  zIndex: isBeingDragged ? 50 : 20
                }}
                onPointerDown={(e) => handleTagPointerDown(pos.id, e)}
                className={`group flex items-center gap-1.5 p-2 rounded-xl border-2 ${color.border} ${color.bg} shadow-md backdrop-blur-xs transition-shadow duration-100 select-none ${
                  isBeingDragged 
                    ? 'ring-4 ring-emerald-400 scale-105 shadow-2xl cursor-grabbing' 
                    : isDocumentLocked ? 'cursor-default' : 'cursor-grab hover:shadow-lg'
                }`}
              >
                {/* Ícone de Arraste (Grip) ou Cadeado se Bloqueado */}
                <div 
                  className={`p-0.5 ${isDocumentLocked ? 'text-amber-600' : 'cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-slate-700'}`}
                  title={isDocumentLocked ? 'Posição Travada' : 'Segure e arraste para posicionar'}
                >
                  {isDocumentLocked ? <Lock className="w-3.5 h-3.5" /> : <GripVertical className="w-4 h-4" />}
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
                      disabled={isDocumentLocked}
                      onChange={(e) => handleSignerChange(pos.id, e.target.value)}
                      className={`bg-white text-slate-900 border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs max-w-[155px] truncate ${
                        isDocumentLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                      }`}
                      title="Escolha quem assinará neste local"
                    >
                      {signers.map((s, idx) => (
                        <option key={idx} value={s.email}>
                          {s.name} {s.status === 'assinado' ? '(Já Assinou)' : `(${s.role || s.email})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Tipo de Campo & Controles de Tamanho */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={pos.type}
                      disabled={isDocumentLocked}
                      onChange={(e) => handleTypeChange(pos.id, e.target.value as any)}
                      className={`bg-white/80 text-slate-700 border border-slate-200 rounded px-1 py-0.5 text-[9px] font-semibold ${
                        isDocumentLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                      }`}
                    >
                      <option value="assinatura">Assinatura</option>
                      <option value="rubrica">Rubrica</option>
                      <option value="data">Data</option>
                    </select>

                    {/* Botões de Diminuir / Aumentar Tamanho */}
                    {!isDocumentLocked && (
                      <div className="flex items-center bg-white/90 border border-slate-200 rounded px-1 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={(e) => updateTagScale(pos.id, -0.15, e)}
                          className="text-slate-600 hover:text-slate-900 font-bold px-1 transition-colors cursor-pointer"
                          title="Diminuir"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] font-mono font-bold text-slate-700 px-0.5">
                          {Math.round(tagScale * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => updateTagScale(pos.id, 0.15, e)}
                          className="text-slate-600 hover:text-slate-900 font-bold px-1 transition-colors cursor-pointer"
                          title="Aumentar"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Ação da Tag: Olhinho (Prévia Simulada) e Excluir */}
                <div className="flex flex-col gap-1 shrink-0 self-start ml-0.5">
                  <button
                    type="button"
                    onClick={(e) => toggleTagPreview(pos.id, e)}
                    className="p-1 rounded-md text-blue-600 hover:text-white hover:bg-blue-600 transition-colors cursor-pointer"
                    title="Ver como ficará a assinatura simulada neste local"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {!isDocumentLocked && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(pos.id, e)}
                      className="p-1 rounded-md text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      title="Remover este campo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Dica de Tela Vazia de Posições */}
          {positions.length === 0 && !isDocumentLocked && !isGlobalPreview && (
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
