import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Plus, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Printer, 
  Eye, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Users, 
  Search, 
  RotateCw, 
  Mail, 
  Layers, 
  FileCheck, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  KeyRound,
  MapPin
} from 'lucide-react';
import { 
  SignatureService, 
  SignatureEnvelope, 
  SignatureSigner 
} from '../../services/signatureService';
import { GeneratedDocument } from '../../data/documentTemplates';
import { NewEnvelopeModal } from './NewEnvelopeModal';
import { SignatureAuditTrailModal } from './SignatureAuditTrailModal';
import { SignaturePlacementModal } from './SignaturePlacementModal';
import { DigitalSignatureModal } from '../DigitalSignatureModal';
import { StandardModal } from '../common/StandardModal';

interface SignaturePortalProps {
  companyName: string;
  cnpj: string;
  onOpenDocument: (doc: GeneratedDocument) => void;
  onOpenSignatureModal?: (ataId: string, title: string) => void;
  signedAtas?: Record<string, { hash: string; timestamp: string; signerName: string }>;
  onBackToMenu: () => void;
}

export const SignaturePortal: React.FC<SignaturePortalProps> = ({
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
    const data = SignatureService.getEnvelopes(companyName, cnpj);
    setEnvelopes(data);
  };

  useEffect(() => {
    loadEnvelopes();
  }, [companyName, cnpj]);

  // Estatísticas do Portal
  const totalEnvelopes = envelopes.length;
  const concluidosCount = envelopes.filter(e => e.status === 'concluido').length;
  const pendentesCount = envelopes.filter(e => e.status !== 'concluido').length;
  const totalSignaturesColetadas = envelopes.reduce((acc, env) => {
    return acc + env.signers.filter(s => s.status === 'assinado').length;
  }, 0);
  const totalSignaturesNecessarias = envelopes.reduce((acc, env) => acc + env.signers.length, 0);
  const globalCompletionRate = totalSignaturesNecessarias > 0 
    ? Math.round((totalSignaturesColetadas / totalSignaturesNecessarias) * 100) 
    : 0;

  // Filtros e Pesquisa
  const filteredEnvelopes = envelopes.filter(env => {
    if (filter === 'pendentes' && env.status === 'concluido') return false;
    if (filter === 'concluidos' && env.status !== 'concluido') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = env.title.toLowerCase().includes(q);
      const matchCategory = env.category.toLowerCase().includes(q);
      const matchSigner = env.signers.some(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
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
    const isSigned = envelope.status === 'concluido' || envelope.signers.some(s => s.status === 'assinado');
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

        {/* Botão Principal: + Envelope */}
        <button
          type="button"
          onClick={() => setIsNewEnvelopeModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Envelope</span>
        </button>
      </div>

      {/* 2. Cartões de Métricas e Indicadores de Assinatura */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total de Envelopes</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalEnvelopes}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Documentos gerenciados</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assinados (100%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{concluidosCount}</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Homologados com fé pública</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pendentes de Assinatura</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">{pendentesCount}</div>
          <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Aguardando signatários</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Progresso de Assinaturas</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 font-mono">{globalCompletionRate}%</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {totalSignaturesColetadas} de {totalSignaturesNecessarias} assinaturas
          </span>
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
                  <th className="py-3 px-3">Origem & Fluxo</th>
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
                  const nextPendingSigner = env.signers.find(s => s.status === 'pendente');

                  return (
                    <React.Fragment key={env.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* 1. Documento (Apenas o nome) */}
                        <td className="py-3.5 px-4 align-top">
                          <div 
                            className="font-extrabold text-slate-900 text-xs hover:text-emerald-800 transition-colors cursor-pointer" 
                            onClick={() => handleViewDocument(env)}
                            title="Clique para visualizar o documento"
                          >
                            {env.title}
                          </div>
                        </td>

                        {/* 2. Origem & Fluxo */}
                        <td className="py-3.5 px-3 align-top">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {env.sourceType === 'sistema' ? 'Sistema CIPA' : 'Arquivo Externo'}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-medium">
                              {env.sendSequence === 'sequencial' ? 'Sequencial (1 a 1)' : 'Simultâneo'}
                            </span>
                          </div>
                        </td>

                        {/* 3. Signatários & Progresso */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1.5 min-w-[150px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700 font-mono">
                                {signedCount} de {totalSigners} assinados
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-800">
                                {percent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedEnvelopeId(isExpanded ? null : env.id)}
                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer pt-0.5"
                            >
                              <span>{isExpanded ? 'Ocultar signatários' : 'Ver signatários'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        {/* 4. Status (Ícone que expande texto no hover) */}
                        <td className="py-3.5 px-3 align-top">
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

                        {/* 5. Ações (Nomes pequenos e diretos) */}
                        <td className="py-3.5 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            
                            {/* Assinar */}
                            {!isCompleted && nextPendingSigner && (
                              <button
                                type="button"
                                onClick={() => setSigningTarget({ envelope: env, signer: nextPendingSigner })}
                                className="group flex items-center h-8 w-8 hover:w-24 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white border border-emerald-600 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                title={`Assinar como ${nextPendingSigner.name}`}
                              >
                                <FileCheck className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-white" />
                                <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                  Assinar
                                </span>
                              </button>
                            )}

                            {/* Reenviar */}
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleResendInvitation(env.id)}
                                className="group flex items-center h-8 w-8 hover:w-26 rounded-xl bg-slate-100 hover:bg-emerald-50 active:scale-95 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                                title="Reenviar e-mails para pendentes"
                              >
                                <Send className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-slate-500 group-hover:text-emerald-600" />
                                <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                  Reenviar
                                </span>
                              </button>
                            )}

                            {/* Posições */}
                            <button
                              type="button"
                              onClick={() => setViewingPlacementEnvelope(env)}
                              className="group flex items-center h-8 w-8 hover:w-26 rounded-xl bg-slate-100 hover:bg-emerald-50 active:scale-95 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Posicionamento de Assinaturas"
                            >
                              <MapPin className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-emerald-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Posições
                              </span>
                            </button>

                            {/* Ver */}
                            <button
                              type="button"
                              onClick={() => handleViewDocument(env)}
                              className="group flex items-center h-8 w-8 hover:w-20 rounded-xl bg-slate-100 hover:bg-blue-50 active:scale-95 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 px-2 transition-all duration-300 ease-in-out cursor-pointer shadow-2xs overflow-hidden shrink-0"
                              title="Visualizar Documento"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 text-blue-600" />
                              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-1.5 text-xs font-bold transition-opacity duration-300">
                                Ver
                              </span>
                            </button>

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
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {env.signers.map((s, idx) => {
                                  const isSignerSigned = s.status === 'assinado';
                                  const isSignerWaiting = s.status === 'aguardando_turno';

                                  return (
                                    <div key={s.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{idx + 1}. {s.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono truncate">{s.email}</p>
                                        <p className="text-[10px] text-emerald-700 font-medium">{s.role}</p>
                                      </div>
                                      <div className="shrink-0">
                                        {isSignerSigned ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Assinado
                                          </span>
                                        ) : isSignerWaiting ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold text-slate-500 bg-slate-100">
                                            Aguardando
                                          </span>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200">
                                              Pendente
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleResendInvitation(env.id, s.id)}
                                              className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-emerald-50 cursor-pointer"
                                              title="Reenviar e-mail"
                                            >
                                              <Mail className="w-3 h-3" />
                                            </button>
                                          </div>
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
        creatorName="Daniele Santos (Administrador)"
        creatorEmail="daniele.santos@empresa.com.br"
        onEnvelopeCreated={(newEnv) => {
          loadEnvelopes();
          setFeedbackModal({
            isOpen: true,
            title: 'Envelope Criado com Sucesso!',
            description: `O envelope "${newEnv.title}" foi registrado e as notificações por e-mail foram disparadas para os signatários.`,
            type: 'success'
          });
        }}
      />

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
