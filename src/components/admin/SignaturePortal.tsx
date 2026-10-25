import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Plus, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Search, 
  ChevronDown,
  ChevronUp,
  MapPin,
  Download
} from 'lucide-react';
import { 
  SignatureService, 
  SignatureEnvelope, 
  SignatureSigner 
} from '../../services/signatureService';
import { GeneratedDocument } from '../../data/documentTemplates';
import { PdfService } from '../../services/pdfService';
import { NewEnvelopeModal } from './NewEnvelopeModal';
import { SignatureAuditTrailModal } from './SignatureAuditTrailModal';
import { SignaturePlacementModal } from './SignaturePlacementModal';
import { DigitalSignatureModal } from '../DigitalSignatureModal';
import { StandardModal } from '../common/StandardModal';

interface SignaturePortalProps {
  currentUser?: any;
  companyName: string;
  cnpj: string;
  onOpenDocument: (doc: GeneratedDocument) => void;
  onOpenSignatureModal?: (ataId: string, title: string) => void;
  signedAtas?: Record<string, { hash: string; timestamp: string; signerName: string }>;
  onBackToMenu: () => void;
}

export const SignaturePortal: React.FC<SignaturePortalProps> = ({
  currentUser,
  companyName,
  cnpj,
  onOpenDocument,
  onBackToMenu
}) => {
  const [envelopes, setEnvelopes] = useState<SignatureEnvelope[]>([]);
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'concluidos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modais de Operação
  const [isNewEnvelopeModalOpen, setIsNewEnvelopeModalOpen] = useState(false);
  const [viewingAuditEnvelope, setViewingAuditEnvelope] = useState<SignatureEnvelope | null>(null);
  const [viewingPlacementEnvelope, setViewingPlacementEnvelope] = useState<SignatureEnvelope | null>(null);
  const [signingTarget, setSigningTarget] = useState<{ envelope: SignatureEnvelope; signer: SignatureSigner } | null>(null);
  const [envelopeToDelete, setEnvelopeToDelete] = useState<SignatureEnvelope | null>(null);
  const [expandedEnvelopeId, setExpandedEnvelopeId] = useState<string | null>(null);

  // Pergunta para assinar se o usuário logado for signatário
  const [promptSelfSign, setPromptSelfSign] = useState<{ envelope: SignatureEnvelope; signer: SignatureSigner } | null>(null);

  // Modal de Feedback do Sistema
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'error';
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  });

  // Carrega envelopes do SignatureService
  const loadEnvelopes = () => {
    const data = SignatureService.getEnvelopes();
    setEnvelopes(data);
  };

  useEffect(() => {
    loadEnvelopes();
  }, []);

  // Métricas Globais
  const totalEnvelopes = envelopes.length;
  const concluidosCount = envelopes.filter(e => e.status === 'concluido').length;
  const pendentesCount = envelopes.filter(e => e.status === 'pendente').length;
  
  const totalSignaturesNecessarias = envelopes.reduce((acc, curr) => acc + curr.signers.length, 0);
  const totalSignaturesColetadas = envelopes.reduce(
    (acc, curr) => acc + curr.signers.filter(s => s.status === 'assinado').length, 
    0
  );
  const globalCompletionRate = totalSignaturesNecessarias > 0 
    ? Math.round((totalSignaturesColetadas / totalSignaturesNecessarias) * 100) 
    : 0;

  // Filtragem e Busca
  const filteredEnvelopes = envelopes.filter((env) => {
    if (filter === 'pendentes' && env.status !== 'pendente') return false;
    if (filter === 'concluidos' && env.status !== 'concluido') return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = env.title.toLowerCase().includes(q);
      const matchCategory = env.category.toLowerCase().includes(q);
      const matchSigner = env.signers.some(s => 
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
      return matchTitle || matchCategory || matchSigner;
    }
    return true;
  });

  // Ação: Reenviar e-mail de convite
  const handleResendInvitation = async (envelopeId: string, signerId?: string) => {
    try {
      const res = await SignatureService.resendInvitation(envelopeId, signerId);
      loadEnvelopes();
      setFeedbackModal({
        isOpen: true,
        title: 'Lembretes Disparados!',
        description: res.message,
        type: 'success'
      });
    } catch (err: any) {
      setFeedbackModal({
        isOpen: true,
        title: 'Falha no Reenvio',
        description: err.message || 'Erro ao reenviar notificações.',
        type: 'error'
      });
    }
  };

  // Ação: Baixar Documento Completo em PDF com Certificado
  const handleDownloadPdf = (envelope: SignatureEnvelope) => {
    try {
      PdfService.downloadEnvelopePdf(envelope);
    } catch (err: any) {
      setFeedbackModal({
        isOpen: true,
        title: 'Erro ao Gerar PDF',
        description: err.message || 'Não foi possível compilar o documento em PDF.',
        type: 'error'
      });
    }
  };

  // Ação: Confirmar Assinatura na Tela
  const handleConfirmSignature = async (signatureData: {
    signerName: string;
    signerCpf: string;
    signerRole: string;
    signatureType: 'desenhada' | 'padrao_cursiva';
    signatureCanvasDataUrl: string;
    hash: string;
    timestamp: string;
  }) => {
    if (!signingTarget) return;

    try {
      await SignatureService.signDocument(
        signingTarget.envelope.id,
        signingTarget.signer.id,
        {
          signerName: signatureData.signerName,
          signerCpf: signatureData.signerCpf,
          signerRole: signatureData.signerRole,
          signatureType: signatureData.signatureType,
          signatureDataUrl: signatureData.signatureCanvasDataUrl,
          ipAddress: '189.40.12.88'
        }
      );

      loadEnvelopes();
      setSigningTarget(null);
      setFeedbackModal({
        isOpen: true,
        title: 'Assinatura Registrada com Sucesso!',
        description: `O documento foi assinado por ${signatureData.signerName} com integridade criptográfica SHA-256 e validade legal (MP 2.200-2/2001).`,
        type: 'success'
      });
    } catch (err: any) {
      setFeedbackModal({
        isOpen: true,
        title: 'Erro ao Registrar Assinatura',
        description: err.message || 'Falha ao salvar assinatura.',
        type: 'error'
      });
    }
  };

  // Ação: Visualizar Documento com Tarja Oficial
  const handleViewDocument = (envelope: SignatureEnvelope) => {
    onOpenDocument({
      title: envelope.title,
      category: envelope.category,
      normativeCode: envelope.normativeCode || 'NR-5 · Assinatura Digital MP 2.200-2',
      companyName: envelope.companyName,
      cnpj: envelope.cnpj,
      dateGenerated: envelope.createdAt,
      content: envelope.content,
      signatories: envelope.signers.map(s => `${s.name} (${s.role})`)
    });
  };

  // Ação: Confirmar Exclusão do Envelope
  const handleConfirmDelete = () => {
    if (!envelopeToDelete) return;
    SignatureService.deleteEnvelope(envelopeToDelete.id);
    loadEnvelopes();
    setEnvelopeToDelete(null);
    setFeedbackModal({
      isOpen: true,
      title: 'Envelope Excluído',
      description: 'O envelope de assinaturas foi removido com sucesso.',
      type: 'success'
    });
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* 1. Header Padronizado com Gradiente Verde */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 py-3.5 px-5 sm:px-6 rounded-2xl border border-emerald-200/80 shadow-xs w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight leading-tight">
              CIPASign
            </h2>
          </div>
        </div>

        {/* Botão Principal: Envelope */}
        <button
          type="button"
          onClick={() => setIsNewEnvelopeModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Envelope</span>
        </button>
      </div>

      {/* 2. Cartões de Métricas e Indicadores de Assinatura (Estilo Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
        {/* KPI 1: Total de Envelopes */}
        <div 
          onClick={() => setFilter('todos')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-blue-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              Total de Envelopes
            </span>
            <div className="mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono group-hover:text-blue-600 transition-colors leading-none block">
                {totalEnvelopes}
              </span>
              <span className="text-xs text-slate-400 block mt-1 font-medium truncate">
                documentos gerenciados
              </span>
            </div>
          </div>
          <FileText className="w-8 h-8 text-blue-600 group-hover:scale-110 group-hover:text-blue-700 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

        {/* KPI 2: Assinados (100%) */}
        <div 
          onClick={() => setFilter('concluidos')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-emerald-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              Assinados (100%)
            </span>
            <div className="mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight font-mono group-hover:text-emerald-600 transition-colors leading-none block">
                {concluidosCount}
              </span>
              <span className="text-xs text-emerald-600 block mt-1 font-semibold truncate">
                homologados com fé pública
              </span>
            </div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600 group-hover:scale-110 group-hover:text-emerald-700 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

        {/* KPI 3: Pendentes de Assinatura */}
        <div 
          onClick={() => setFilter('pendentes')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-amber-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              Pendentes
            </span>
            <div className="mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-amber-950 tracking-tight font-mono group-hover:text-amber-600 transition-colors leading-none block">
                {pendentesCount}
              </span>
              <span className="text-xs text-amber-600 block mt-1 font-semibold truncate">
                aguardando signatários
              </span>
            </div>
          </div>
          <Clock className="w-8 h-8 text-amber-500 group-hover:scale-110 group-hover:text-amber-600 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

        {/* KPI 4: Progresso de Assinaturas */}
        <div 
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-[6px] border-l-purple-500 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block truncate">
              Taxa de Conclusão
            </span>
            <div className="mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-purple-950 tracking-tight font-mono group-hover:text-purple-600 transition-colors leading-none block">
                {globalCompletionRate}%
              </span>
              <span className="text-xs text-slate-400 block mt-1 font-medium truncate">
                {totalSignaturesColetadas} de {totalSignaturesNecessarias} assinaturas
              </span>
            </div>
          </div>
          <ShieldCheck className="w-8 h-8 text-purple-600 group-hover:scale-110 group-hover:text-purple-700 transition-all duration-200 shrink-0 mt-0.5" />
        </div>
      </div>

      {/* 3. Filtros e Barra de Pesquisa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full py-1">
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('todos')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              filter === 'todos' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({totalEnvelopes})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pendentes')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              filter === 'pendentes' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes ({pendentesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('concluidos')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              filter === 'concluidos' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Concluídos ({concluidosCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título ou signatário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 4. Tabela de Envelopes (Clean e Direto ao Ponto) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredEnvelopes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <PenTool className="w-9 h-9 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">Nenhum envelope encontrado</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crie um novo envelope ou alterne os filtros acima para visualizar os documentos.
            </p>
            <button
              type="button"
              onClick={() => setIsNewEnvelopeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Envelope</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-3">Fluxo</th>
                  <th className="py-3 px-4">Signatários</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnvelopes.map((env) => {
                  const isCompleted = env.status === 'concluido';
                  const totalSigners = env.signers.length;
                  const signedCount = env.signers.filter(s => s.status === 'assinado').length;
                  const percent = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;
                  const isExpanded = expandedEnvelopeId === env.id;

                  return (
                    <React.Fragment key={env.id}>
                      <tr 
                        onClick={() => handleViewDocument(env)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group/row"
                        title="Clique na linha para visualizar o documento completo"
                      >
                        
                        {/* 1. Documento (Apenas o nome, abre ao clicar) */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-extrabold text-slate-900 text-xs group-hover/row:text-emerald-700 transition-colors">
                            {env.title}
                          </div>
                        </td>

                        {/* 2. Fluxo (Apenas o tipo de fluxo) */}
                        <td className="py-3.5 px-3 align-top">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {env.sendSequence === 'sequencial' ? 'Sequencial (1 a 1)' : 'Simultâneo'}
                          </span>
                        </td>

                        {/* 3. Signatários & Progresso (Clicável na barra para expandir) */}
                        <td className="py-3.5 px-4 align-top" onClick={(e) => e.stopPropagation()}>
                          <div 
                            onClick={() => setExpandedEnvelopeId(isExpanded ? null : env.id)}
                            className="space-y-1.5 min-w-[150px] cursor-pointer group/bar select-none"
                            title="Clique para ver ou ocultar os signatários"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700 font-mono group-hover/bar:text-emerald-700 transition-colors">
                                {signedCount} de {totalSigners} assinados
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-800">
                                {percent}%
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-300/40 group-hover/bar:ring-emerald-400 transition-all">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300 group-hover/bar:bg-emerald-600"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 4. Status (Ícone que expande texto no hover) */}
                        <td className="py-3.5 px-3 align-top" onClick={(e) => e.stopPropagation()}>
                          {isCompleted ? (
                            <div 
                              className="group flex items-center h-8 w-8 hover:w-28 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-default shadow-2xs overflow-hidden shrink-0"
                              title="Documento Concluído"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold text-emerald-800 transition-opacity duration-300">
                                Concluído
                              </span>
                            </div>
                          ) : (
                            <div 
                              className="group flex items-center h-8 w-8 hover:w-26 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 px-2 transition-all duration-300 ease-in-out cursor-default shadow-2xs overflow-hidden shrink-0"
                              title="Documento Pendente"
                            >
                              <Clock className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold text-amber-800 transition-opacity duration-300">
                                Pendente
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 5. Ações (Apenas ícones que expandem no hover) */}
                        <td className="py-3.5 px-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            
                            {/* Baixar PDF Completo (Documento + Certificado) */}
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(env)}
                              className="group flex items-center h-8 w-8 hover:w-24 rounded-xl bg-slate-100 hover:bg-emerald-50 active:scale-95 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Baixar PDF Completo com Certificado"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-700" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Baixar
                              </span>
                            </button>

                            {/* Reenviar (Se houver pendentes - Reenvia apenas para quem ainda não assinou) */}
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleResendInvitation(env.id)}
                                className="group flex items-center h-8 w-8 hover:w-26 rounded-xl bg-slate-100 hover:bg-emerald-50 active:scale-95 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                title="Reenviar e-mail de lembrete (apenas para signatários pendentes)"
                              >
                                <Send className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-slate-500 group-hover:text-emerald-600" />
                                <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                  Reenviar
                                </span>
                              </button>
                            )}

                            {/* Posições (Aparece APENAS se ninguém ainda tiver assinado) */}
                            {signedCount === 0 && (
                              <button
                                type="button"
                                onClick={() => setViewingPlacementEnvelope(env)}
                                className="group flex items-center h-8 w-8 hover:w-26 rounded-xl bg-slate-100 hover:bg-emerald-50 active:scale-95 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                title="Posicionamento de Assinaturas (Disponível antes do primeiro signatário assinar)"
                              >
                                <MapPin className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-600" />
                                <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                  Posições
                                </span>
                              </button>
                            )}

                            {/* Histórico */}
                            <button
                              type="button"
                              onClick={() => setViewingAuditEnvelope(env)}
                              className="group flex items-center h-8 w-8 hover:w-26 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 border border-emerald-200 hover:border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Trilha de Auditoria & Hashes"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-700" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Histórico
                              </span>
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => setEnvelopeToDelete(env)}
                              className="group flex items-center h-8 w-8 hover:w-24 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 hover:border-rose-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Excluir Envelope"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-rose-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Excluir
                              </span>
                            </button>

                          </div>
                        </td>

                      </tr>

                      {/* Linha Expansível: Detalhes dos Signatários */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={5} className="py-3 px-6 border-y border-slate-200/80">
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                                Signatários do Envelope ({totalSigners})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {env.signers.map((signer, idx) => {
                                  const isSigned = signer.status === 'assinado';
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                        isSigned 
                                          ? 'bg-emerald-50/60 border-emerald-200' 
                                          : 'bg-white border-slate-200'
                                      }`}
                                    >
                                      <div className="truncate mr-2">
                                        <p className="font-bold text-slate-800 truncate">{signer.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{signer.email}</p>
                                        <span className="text-[9px] text-slate-400 font-mono">{signer.role}</span>
                                      </div>
                                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block ${
                                          isSigned 
                                            ? 'bg-emerald-100 text-emerald-800' 
                                            : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {isSigned ? 'Assinado' : 'Pendente'}
                                        </span>
                                        {isSigned && signer.signedAt && (
                                          <span className="text-[9px] text-slate-400 font-mono block">
                                            {new Date(signer.signedAt).toLocaleDateString('pt-BR')}
                                          </span>
                                        )}
                                        {!isSigned && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleResendInvitation(env.id, signer.id);
                                            }}
                                            className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                            title={`Reenviar e-mail de lembrete para ${signer.name}`}
                                          >
                                            <Send className="w-2.5 h-2.5 text-emerald-700" />
                                            <span>Reenviar</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: NOVO ENVELOPE */}
      <NewEnvelopeModal
        isOpen={isNewEnvelopeModalOpen}
        onClose={() => setIsNewEnvelopeModalOpen(false)}
        companyName={companyName}
        cnpj={cnpj}
        creatorName={currentUser?.name || 'Administrador'}
        creatorEmail={currentUser?.email || 'admin@empresa.com.br'}
        onEnvelopeCreated={(newEnv) => {
          loadEnvelopes();

          // Verifica se o usuário logado precisa assinar o novo documento
          const userSigner = newEnv.signers.find(s => s.status === 'pendente' && (
            (currentUser?.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (currentUser?.name && s.name.toLowerCase() === currentUser.name.toLowerCase())
          ));

          if (userSigner) {
            setPromptSelfSign({ envelope: newEnv, signer: userSigner });
          } else {
            setFeedbackModal({
              isOpen: true,
              title: 'Envelope Criado com Sucesso!',
              description: `O envelope "${newEnv.title}" foi registrado e as notificações por e-mail foram disparadas para os signatários.`,
              type: 'success'
            });
          }
        }}
      />

      {/* MODAL: IDENTIFICAÇÃO AUTOMÁTICA DE ASSINATURA PARA O USUÁRIO LOGADO */}
      {promptSelfSign && (
        <StandardModal
          isOpen={true}
          onClose={() => setPromptSelfSign(null)}
          title="Assinar Documento Agora?"
          type="info"
          description={`Você é um dos signatários pendentes do envelope "${promptSelfSign.envelope.title}". Deseja registrar a sua assinatura digital agora com fé pública?`}
          confirmLabel="Sim, Assinar Agora"
          cancelLabel="Assinar Mais Tarde"
          onConfirm={() => {
            const target = promptSelfSign;
            setPromptSelfSign(null);
            setSigningTarget({ envelope: target.envelope, signer: target.signer });
          }}
        />
      )}

      {/* MODAL 2: ASSINATURA DIGITAL INTERATIVA COM 2 OPÇÕES (DESENHO OU PADRÃO TIPOGRÁFICO) */}
      {signingTarget && (
        <DigitalSignatureModal
          isOpen={!!signingTarget}
          onClose={() => setSigningTarget(null)}
          documentTitle={signingTarget.envelope.title}
          initialSignerName={signingTarget.signer.name}
          initialSignerCpf={signingTarget.signer.cpf || '123.456.789-00'}
          initialSignerRole={signingTarget.signer.role}
          initialSignerEmail={signingTarget.signer.email}
          onConfirmSignature={handleConfirmSignature}
        />
      )}

      {/* MODAL 3: AUDIT TRAIL / FOLHA DE AUDITORIA & HASHES LEGAIS */}
      <SignatureAuditTrailModal
        envelope={viewingAuditEnvelope}
        isOpen={!!viewingAuditEnvelope}
        onClose={() => setViewingAuditEnvelope(null)}
      />

      {/* MODAL 3.5: POSICIONAMENTO VISUAL DE ASSINATURAS (DOCUSIGN / D4SIGN) */}
      <SignaturePlacementModal
        envelope={viewingPlacementEnvelope}
        isOpen={!!viewingPlacementEnvelope}
        onClose={() => setViewingPlacementEnvelope(null)}
        onSave={() => {
          loadEnvelopes();
          setFeedbackModal({
            isOpen: true,
            title: 'Posições de Assinatura Atualizadas!',
            description: 'Os locais onde os signatários devem assinar foram gravados com sucesso no envelope.',
            type: 'success'
          });
        }}
      />

      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO DE ENVELOPE (HEADER VERMELHO PADRONIZADO) */}
      <StandardModal
        isOpen={!!envelopeToDelete}
        onClose={() => setEnvelopeToDelete(null)}
        type="confirm_delete"
        title="Confirmar Exclusão de Envelope"
        description={envelopeToDelete ? `Tem certeza que deseja excluir permanentemente o envelope "${envelopeToDelete.title}"? Todos os registros e hashes associados serão revogados.` : ''}
        confirmLabel="Sim, Excluir Envelope"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
      />

      {/* MODAL 5: FEEDBACK DO SISTEMA */}
      <StandardModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        type={feedbackModal.type}
        title={feedbackModal.title}
        description={feedbackModal.description}
        confirmLabel="Compreendido"
      />

    </div>
  );
};
