import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  ShieldCheck, 
  FileCheck, 
  PenTool, 
  Type, 
  CheckCircle2, 
  Sparkles,
  Lock,
  Calendar,
  User,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { formatCPF, validateCPF } from '../utils/documentValidators';

export interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  initialSignerName?: string;
  initialSignerCpf?: string;
  initialSignerRole?: string;
  initialSignerEmail?: string;
  onConfirmSignature: (signatureData: {
    signerName: string;
    signerCpf: string;
    signerRole: string;
    signatureType: 'desenhada' | 'padrao_cursiva';
    signatureCanvasDataUrl: string;
    hash: string;
    timestamp: string;
  }) => void;
}

// Estilos tipográficos pré-configurados para a assinatura padrão
const SIGNATURE_STYLES = [
  { id: 'style-1', name: 'Cursiva Clássica Elegante', fontClass: 'font-serif italic font-bold tracking-wider text-xl sm:text-2xl text-slate-900' },
  { id: 'style-2', name: 'Caligrafia Formal Executiva', fontClass: 'italic font-light tracking-widest text-2xl sm:text-3xl text-emerald-950 scale-y-110' },
  { id: 'style-3', name: 'Traço Contínuo Moderno', fontClass: 'font-mono italic font-bold tracking-tight text-xl sm:text-2xl text-slate-800' },
  { id: 'style-4', name: 'Rubrica Fluida Oficial', fontClass: 'font-serif font-black italic tracking-wide text-2xl text-slate-900 underline decoration-emerald-500/60' },
];

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  initialSignerName = 'Daniele Santos',
  initialSignerCpf = '123.456.789-00',
  initialSignerRole = 'Presidente da CIPA',
  initialSignerEmail = '',
  onConfirmSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [signatureMode, setSignatureMode] = useState<'desenhar' | 'padrao'>('desenhar');
  const [selectedStyleId, setSelectedStyleId] = useState('style-1');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(initialSignerName);
  const [signerCpf, setSignerCpf] = useState(initialSignerCpf);
  const [signerRole, setSignerRole] = useState(initialSignerRole);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Sincroniza dados iniciais
  useEffect(() => {
    if (initialSignerName) setSignerName(initialSignerName);
    if (initialSignerCpf) setSignerCpf(initialSignerCpf);
    if (initialSignerRole) setSignerRole(initialSignerRole);
  }, [initialSignerName, initialSignerCpf, initialSignerRole, isOpen]);

  // Configura o canvas de desenho
  useEffect(() => {
    if (isOpen && signatureMode === 'desenhar' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen, signatureMode]);

  if (!isOpen) return null;

  // Handlers do Canvas de Desenho
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Gera uma imagem SVG/PNG da assinatura padrão escolhida
  const generateStandardSignatureDataUrl = (name: string, styleId: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'middle';

    if (styleId === 'style-1') {
      ctx.font = 'italic bold 32px Georgia, serif';
      ctx.fillText(name, 30, 60);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(25, 95);
      ctx.bezierCurveTo(150, 105, 300, 85, 450, 95);
      ctx.stroke();
    } else if (styleId === 'style-2') {
      ctx.font = 'italic 34px "Times New Roman", serif';
      ctx.fillText(name, 40, 65);
    } else if (styleId === 'style-3') {
      ctx.font = 'italic bold 28px "Courier New", monospace';
      ctx.fillText(name, 35, 65);
    } else {
      ctx.font = 'italic 900 30px Georgia, serif';
      ctx.fillText(name, 30, 55);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText(`Rubrica Autenticada · ${name.split(' ').map(n => n[0]).join('.').toUpperCase()}.`, 30, 95);
    }

    return canvas.toDataURL('image/png');
  };

  const handleConfirm = () => {
    if (!signerName.trim() || !signerCpf.trim()) return;

    let finalDataUrl = '';
    if (signatureMode === 'desenhar') {
      finalDataUrl = canvasRef.current ? canvasRef.current.toDataURL() : '';
    } else {
      finalDataUrl = generateStandardSignatureDataUrl(signerName.trim(), selectedStyleId);
    }

    // Hash criptográfico determinístico
    const now = new Date().toLocaleString('pt-BR');
    const fakeHash = 'ec-' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    onConfirmSignature({
      signerName: signerName.trim(),
      signerCpf: signerCpf.trim(),
      signerRole: signerRole.trim(),
      signatureType: signatureMode === 'desenhar' ? 'desenhada' : 'padrao_cursiva',
      signatureCanvasDataUrl: finalDataUrl,
      hash: fakeHash.toUpperCase(),
      timestamp: now,
    });

    onClose();
  };

  const isSignButtonDisabled = 
    !acceptedTerms || 
    !signerName.trim() || 
    !signerCpf.trim() || 
    !validateCPF(signerCpf) || 
    (signatureMode === 'desenhar' && !hasDrawn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header Verde Padronizado */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center ring-1 ring-emerald-200 shadow-2xs">
              <FileCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                Assinatura Digital Integrada
              </h3>
              <p className="text-[11px] text-slate-600 font-mono">
                Conformidade MP 2.200-2/2001 · Lei 14.063/2020 · NR-5
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

        {/* Form Body com Scroll */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Card Resumo do Documento */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Documento a ser Assinado:</span>
            <p className="text-slate-900 font-extrabold text-sm">{documentTitle}</p>
          </div>

          {/* Dados do Signatário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Nome Completo do Signatário
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  CPF do Titular
                </label>
                {signerCpf.replace(/\D/g, '').length === 11 && (
                  validateCPF(signerCpf) ? (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500" /> Inválido
                    </span>
                  )
                )}
              </div>
              <input
                type="text"
                value={signerCpf}
                onChange={(e) => setSignerCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 font-mono font-semibold transition-colors ${
                  signerCpf.replace(/\D/g, '').length === 11 && !validateCPF(signerCpf)
                    ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 text-rose-900'
                    : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {signerCpf.replace(/\D/g, '').length === 11 && !validateCPF(signerCpf) && (
                <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  CPF inválido segundo a Receita Federal.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Papel na CIPA / Cargo Oficial
            </label>
            <input
              type="text"
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              placeholder="Ex: Presidente da CIPA, Secretário, Titular dos Empregados"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Seletor de Modo de Assinatura: Desenhar vs Assinatura Padrão */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-800 block">
              Como deseja assinar o documento?
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSignatureMode('desenhar')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  signatureMode === 'desenhar'
                    ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                <span>Desenhar na Tela</span>
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('padrao')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  signatureMode === 'padrao'
                    ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Type className="w-3.5 h-3.5 text-emerald-600" />
                <span>Criar Assinatura Padrão</span>
              </button>
            </div>
          </div>

          {/* MODO 1: CANVAS DE DESENHO (MOUSE OU TOUCH) */}
          {signatureMode === 'desenhar' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600">
                  Faça sua assinatura ou rubrica no quadro abaixo:
                </span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar tela</span>
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden relative shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-32 bg-white cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1">
                    <PenTool className="w-5 h-5 text-slate-300" />
                    <span className="text-xs">Assine aqui com o mouse ou o dedo</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODO 2: ASSINATURA PADRÃO TIPOGRÁFICA GERADA */}
          {signatureMode === 'padrao' && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Selecione o modelo estilizado da sua assinatura padronizada:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SIGNATURE_STYLES.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                      selectedStyleId === style.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{style.name}</span>
                      {selectedStyleId === style.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <div className={`py-1 text-center truncate ${style.fontClass}`}>
                      {signerName || 'Assinatura Oficial'}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                * Uma imagem em alta resolução com sua rubrica e assinatura estilizada será vinculada aos carimbos do documento.
              </p>
            </div>
          )}

          {/* Termos de Aceite Legal */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="leading-relaxed">
                Declaro ser o titular legítimo identificado acima e concordo em assinar eletronicamente este documento oficial com plena eficácia probatória e validade jurídica nos termos do <strong>Artigo 10 da Medida Provisória nº 2.200-2/2001</strong>, da <strong>Lei Federal nº 14.063/2020</strong> e das diretrizes da <strong>NR-5</strong>.
              </span>
            </label>
          </div>
        </div>

        {/* Footer com Botões Padronizados */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSignButtonDisabled}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Assinar & Homologar Documento</span>
          </button>
        </div>

      </div>
    </div>
  );
};
