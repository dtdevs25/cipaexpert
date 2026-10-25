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
              Portal de Assinaturas Digitais (Estilo DocuSign & D4Sign)
            </h2>
            <p className="text-xs text-slate-600 font-mono">
              Envio de envelopes por e-mail, rastreamento de signatários e trilha de auditoria legal
            </p>
          </div>
        </div>

        {/* Botão Principal: Novo Envelope */}
        <button
          type="button"
          onClick={() => setIsNewEnvelopeModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Envelope / Enviar Documento</span>
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
            Assinados 100% ({concluidosCount})
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

      {/* 4. Lista de Envelopes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEnvelopes.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
            <PenTool className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">Nenhum envelope encontrado com os filtros aplicados</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crie um novo envelope ou alterne os filtros acima para visualizar os documentos em processo de assinatura.
            </p>
            <button
              type="button"
              onClick={() => setIsNewEnvelopeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase shadow-sm cursor-pointer"
            >
              Criar Novo Envelope
            </button>
          </div>
        ) : (
          filteredEnvelopes.map((env) => {
            const isCompleted = env.status === 'concluido';
            const totalSigners = env.signers.length;
            const signedCount = env.signers.filter(s => s.status === 'assinado').length;
            const percent = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;
            const isExpanded = expandedEnvelopeId === env.id;
            
            // Verifica o próximo da fila para assinar
            const nextPendingSigner = env.signers.find(s => s.status === 'pendente');

            return (
              <div
                key={env.id}
                className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group border border-slate-200"
              >
                {/* Header Padronizado com Gradiente Verde */}
                <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 px-5 py-3.5 border-b border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      <FileText className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-950 block truncate">
                        {env.category} {env.normativeCode ? `· ${env.normativeCode}` : ''}
                      </span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Homologado
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-amber-600" /> {signedCount}/{totalSigners} Assinados
                    </span>
                  )}
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Título Principal */}
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {env.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Origem: <strong>{env.sourceType === 'sistema' ? 'Nativo CIPA Expert' : 'Arquivo Externo'}</strong></span>
                        <span>•</span>
                        <span>Fluxo: <strong>{env.sendSequence === 'sequencial' ? 'Sequencial (1 a 1)' : 'Simultâneo'}</strong></span>
                      </div>
                    </div>

                    {/* Barra de Progresso de Assinaturas */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          Controle de Signatários
                        </span>
                        <span className="font-bold font-mono text-emerald-800">
                          {signedCount} de {totalSigners} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Lista Rápida / Expansível de Signatários */}
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setExpandedEnvelopeId(isExpanded ? null : env.id)}
                        className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
                      >
                        <span>Ver lista de signatários ({totalSigners})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden animate-in fade-in duration-150">
                          {env.signers.map((s, idx) => {
                            const isSignerSigned = s.status === 'assinado';
                            const isSignerWaiting = s.status === 'aguardando_turno';

                            return (
                              <div key={s.id} className="p-2.5 bg-white flex items-center justify-between gap-2 text-xs">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <strong className="text-slate-900 truncate">{s.name}</strong>
                                    <span className="text-[10px] text-slate-500 font-mono truncate">({s.role})</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block truncate pl-5">{s.email}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isSignerSigned ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {s.signedAt ? s.signedAt.split(' ')[0] : 'Assinado'}
                                    </span>
                                  ) : isSignerWaiting ? (
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                      Aguardando Turno
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        Pendente
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleResendInvitation(env.id, s.id)}
                                        className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                                        title="Reenviar e-mail de cobrança para este signatário"
                                      >
                                        <Mail className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de Ações do Envelope */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Botão Assinar Agora se houver pendente */}
                      {!isCompleted && nextPendingSigner && (
                        <button
                          type="button"
                          onClick={() => setSigningTarget({ envelope: env, signer: nextPendingSigner })}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                          title={`Assinar como ${nextPendingSigner.name}`}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Assinar na Tela</span>
                        </button>
                      )}

                      {/* Reenviar E-mail para Todos os Pendentes */}
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleResendInvitation(env.id)}
                          className="px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Reenviar e-mail de notificação para todos os signatários pendentes"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>Reenviar E-mails</span>
                        </button>
                      )}

                      {/* Posicionamento de Assinaturas (Estilo DocuSign / D4Sign) */}
                      <button
                        type="button"
                        onClick={() => setViewingPlacementEnvelope(env)}
                        className="px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Definir ou visualizar o local exato onde as assinaturas aparecem no documento"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Locais de Assinatura</span>
                      </button>

                      {/* Visualizar Documento */}
                      <button
                        type="button"
                        onClick={() => handleViewDocument(env)}
                        className="px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-blue-800 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Visualizar documento na íntegra"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Visualizar</span>
                      </button>

                      {/* Histórico Legal & Hashes */}
                      <button
                        type="button"
                        onClick={() => setViewingAuditEnvelope(env)}
                        className="px-2.5 py-1.5 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Ver trilha de auditoria e hashes criptográficas legais"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Histórico & Hashes</span>
                      </button>
                    </div>

                    {/* Botão Excluir Padronizado */}
                    <button
                      type="button"
                      onClick={() => setEnvelopeToDelete(env)}
                      className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Excluir Envelope"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: NOVO ENVELOPE (ESTILO DOCUSIGN / D4SIGN) */}
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
