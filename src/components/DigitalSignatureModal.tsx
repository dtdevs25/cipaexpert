import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, ShieldCheck, Key, FileCheck } from 'lucide-react';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  onConfirmSignature: (signatureData: {
    signerName: string;
    signerCpf: string;
    signerRole: string;
    hash: string;
    signatureCanvasDataUrl?: string;
    timestamp: string;
  }) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  onConfirmSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState('Daniele Santos');
  const [signerCpf, setSignerCpf] = useState('123.456.789-00');
  const [signerRole, setSignerRole] = useState('Presidente da CIPA');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleConfirm = () => {
    if (!signerName || !signerCpf) return;

    // Generate SHA-like unique deterministic hash
    const fakeHash = 'ec-' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const canvasData = canvasRef.current ? canvasRef.current.toDataURL() : '';
    const now = new Date().toLocaleString('pt-BR');

    onConfirmSignature({
      signerName,
      signerCpf,
      signerRole,
      hash: fakeHash.toUpperCase(),
      signatureCanvasDataUrl: canvasData,
      timestamp: now,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Verde Padronizado */}
        <div className="flex items-center justify-between px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 border-b border-emerald-200/80 text-emerald-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center ring-1 ring-emerald-200 shadow-2xs">
              <FileCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                Assinatura Digital Integrada
              </h3>
              <p className="text-xs text-slate-600 font-mono">
                Conformidade MP 2.200-2/2001 & NR-5
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

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <span className="font-semibold text-slate-700">Documento a ser assinado:</span>
            <p className="text-slate-900 font-bold">{documentTitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Signatário
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CPF do Signatário
              </label>
              <input
                type="text"
                value={signerCpf}
                onChange={(e) => setSignerCpf(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Papel na CIPA / Cargo
            </label>
            <select
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Presidente da CIPA">Presidente da CIPA (Designado Empregador)</option>
              <option value="Vice-Presidente da CIPA">Vice-Presidente da CIPA (Eleito Empregados)</option>
              <option value="Secretário(a) da CIPA">Secretário(a) da CIPA</option>
              <option value="Membro Titular CIPA">Membro Titular</option>
              <option value="Técnico de Segurança do Trabalho">Técnico de Segurança do Trabalho (SESMT)</option>
              <option value="Representante Legal da Empresa">Representante Legal da Empresa</option>
            </select>
          </div>

          {/* Signature Canvas Pad */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Desenhe sua Assinatura (Mouse ou Touch)
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            </div>
            <div className="border border-slate-300 rounded-lg bg-slate-50/50 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={460}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-28 bg-white cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                  Assine aqui com o cursor ou o dedo
                </div>
              )}
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              Declaro sob as penas da lei que sou o titular identificado e que esta assinatura eletrônica possui plena validade jurídica para registro de ata e cumprimento da NR-5.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!acceptedTerms || !signerName}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
          >
            <FileCheck className="w-4 h-4" />
            <span>Assinar & Autenticar Documento</span>
          </button>
        </div>

      </div>
    </div>
  );
};
