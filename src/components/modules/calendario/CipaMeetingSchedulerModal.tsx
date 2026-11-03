import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  X, 
  ChevronRight, 
  Info, 
  Check,
  Edit3
} from 'lucide-react';
import { 
  ScheduledMeeting, 
  generate12MeetingsSchedule, 
  isBrazilianHoliday,
  PAUTAS_PADRAO_12_MESES 
} from '../../../utils/businessDays';
import { generateCipaDocument, GeneratedDocument } from '../../../data/documentTemplates';
import { PdfService } from '../../../services/pdfService';
import { SignatureEnvelope } from '../../../services/signatureService';

interface CipaMeetingSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  posseDate: string; // ex: '17/07/2026' ou '2026-07-17'
  companyName: string;
  cnpj: string;
  unitName: string;
  unitAddress?: string;
  unitCity?: string;
  unitState?: string;
  hasModuloGestao: boolean;
  sindicatoNome?: string;
  sindicatoSigla?: string;
  onNavigateToGestao?: () => void;
  onViewDocument?: (doc: GeneratedDocument) => void;
  onSaveSchedule?: (schedule: ScheduledMeeting[], diaUtil: number) => void;
  initialDiaUtil?: number;
  initialHorario?: string;
  initialLocal?: string;
  initialSchedule?: ScheduledMeeting[];
  presidenteNome?: string;
  vicePresidenteNome?: string;
  secretarioNome?: string;
  logoUrl?: string;
}

export const CipaMeetingSchedulerModal: React.FC<CipaMeetingSchedulerModalProps> = ({
  isOpen,
  onClose,
  posseDate,
  companyName,
  cnpj,
  unitName,
  unitAddress = 'Endereço da Unidade',
  unitCity = 'São Paulo',
  unitState = 'SP',
  hasModuloGestao,
  sindicatoNome,
  sindicatoSigla,
  onNavigateToGestao,
  onViewDocument,
  onSaveSchedule,
  initialDiaUtil = 5,
  initialHorario = '10:00 às 11:30',
  initialLocal,
  initialSchedule,
  presidenteNome = 'Rosangela Aparecida Santos Marcelino',
  vicePresidenteNome = 'Luis Carlos Gomes Da Silva',
  secretarioNome = 'Sidney Vida Barbalho Felipe De Souza',
  logoUrl
}) => {
  const [diaUtil, setDiaUtil] = useState<number>(initialDiaUtil);
  const [horario, setHorario] = useState<string>(initialHorario);
  const [local, setLocal] = useState<string>(initialLocal || `${unitName} - Sala de Treinamentos e Reuniões (Presencial)`);
  const [sipatMonthIndex, setSipatMonthIndex] = useState<number>(4); // Reunião nº 4 (Novembro)
  const [schedule, setSchedule] = useState<ScheduledMeeting[]>([]);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editPauta, setEditPauta] = useState<string>('');
  const [syncedWithGestao, setSyncedWithGestao] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Inicializar ou recalcular reuniões quando parâmetros principais mudam
  useEffect(() => {
    if (initialSchedule && initialSchedule.length === 12 && diaUtil === initialDiaUtil) {
      setSchedule(initialSchedule);
    } else {
      const generated = generate12MeetingsSchedule(posseDate, diaUtil, horario, local, sipatMonthIndex);
      setSchedule(generated);
    }
  }, [posseDate, diaUtil, horario, local, sipatMonthIndex]);

  // Verificar se já existe sincronização prévia salva no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cipa_expert_reunioes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSyncedWithGestao(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  if (!isOpen) return null;

  // Atualizar pauta individual de uma reunião
  const handleSaveIndividualPauta = (id: string) => {
    setSchedule(prev => prev.map(m => m.id === id ? { ...m, pauta: editPauta } : m));
    setEditingMeetingId(null);
  };

  // Sincronizar com o Módulo de Gestão da CIPA (Módulo 3)
  const handleSyncWithGestao = () => {
    if (!hasModuloGestao) return;

    try {
      const meetingsForGestao = schedule.map((m) => ({
        id: `cal-${m.numero}`,
        titulo: `${m.numero}ª Reunião Ordinária da CIPA${m.isSipat ? ' (SIPAT)' : ''}`,
        data: m.data,
        tipo: (m.isSipat ? 'sipat' : 'ordinaria') as 'ordinaria' | 'extraordinaria' | 'sipat',
        horario: m.horario,
        local: m.local,
        concluida: false,
        lembreteAtivo: true,
        pauta: m.pauta
      }));

      localStorage.setItem('cipa_expert_reunioes_v1', JSON.stringify(meetingsForGestao));
      localStorage.setItem('cipa_expert_reunioes_dia_util', String(diaUtil));
      localStorage.setItem('cipa_expert_reunioes_updated_at', new Date().toISOString());

      // Dispara evento customizado para notificar abas/componentes
      window.dispatchEvent(new CustomEvent('cipa_reunioes_updated', { detail: { meetings: meetingsForGestao } }));

      setSyncedWithGestao(true);
      setSyncToast('As 12 reuniões ordinárias foram sincronizadas com sucesso no Módulo de Gestão (Módulo 3)!');
      setTimeout(() => setSyncToast(null), 5000);

      if (onSaveSchedule) {
        onSaveSchedule(schedule, diaUtil);
      }
    } catch (e) {
      console.error('Erro ao sincronizar com Módulo de Gestão:', e);
    }
  };

  // Gerar e visualizar documento oficial para protocolo do sindicato
  const handleOpenOfficialDocument = () => {
    const doc = generateCipaDocument(
      'calendario_reunioes',
      companyName,
      cnpj,
      '2026/2027',
      schedule.length,
      {
        cronogramaDatas: { posse: posseDate },
        unitName,
        unitCnpj: cnpj,
        unitAddress,
        unitCity,
        unitState,
        sindicatoNome,
        sindicatoSigla,
        diaUtilEscolhido: diaUtil,
        horarioPadrao: horario,
        localPadrao: local,
        reunioesAgendadas: schedule,
        presidenteCipaNome: presidenteNome,
        vicePresidenteCipaNome: vicePresidenteNome,
        secretarioCipaNome: secretarioNome,
        gestaoAno: '2026/2027',
        logoUrl
      }
    );

    if (onViewDocument) {
      onViewDocument(doc);
    }
  };

  // Baixar PDF Oficial do Calendário Anual
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const doc = generateCipaDocument(
        'calendario_reunioes',
        companyName,
        cnpj,
        '2026/2027',
        schedule.length,
        {
          cronogramaDatas: { posse: posseDate },
          unitName,
          unitCnpj: cnpj,
          unitAddress,
          unitCity,
          unitState,
          sindicatoNome,
          sindicatoSigla,
          diaUtilEscolhido: diaUtil,
          horarioPadrao: horario,
          localPadrao: local,
          reunioesAgendadas: schedule,
          presidenteCipaNome: presidenteNome,
          vicePresidenteCipaNome: vicePresidenteNome,
          secretarioCipaNome: secretarioNome,
          gestaoAno: '2026/2027',
          logoUrl
        }
      );

      const envelope: SignatureEnvelope = {
        id: `env-calendario-reunioes-${Date.now()}`,
        title: doc.title,
        category: doc.category,
        normativeCode: doc.normativeCode,
        sourceType: 'sistema',
        docType: 'calendario_reunioes',
        companyName,
        unitName,
        cnpj,
        createdAt: new Date().toLocaleString('pt-BR'),
        updatedAt: new Date().toLocaleString('pt-BR'),
        content: doc.content,
        signers: doc.signatories.map((sig, idx) => ({
          id: `sig-cal-${idx}`,
          name: sig.includes('-') ? sig.split('-')[0].trim() : (sig.includes('(') ? sig.split('(')[0].trim() : sig),
          email: `cipeiro${idx + 1}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'empresa'}.com.br`,
          role: sig,
          order: idx + 1,
          status: 'assinado' as const,
          signedAt: new Date().toLocaleDateString('pt-BR') + ' às 10:00'
        })),
        sendSequence: 'todos_juntos',
        status: 'concluido',
        documentHash: 'CAL-NR5-' + Date.now(),
        auditEvents: []
      };

      await PdfService.downloadEnvelopePdf(envelope);
    } catch (e) {
      console.error('Erro ao baixar PDF:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
        {/* TOAST FLUTUANTE DE SUCESSO */}
        {syncToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-60 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold border border-emerald-700 animate-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncToast}</span>
            {onNavigateToGestao && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToGestao();
                }}
                className="ml-2 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
              >
                Abrir Módulo 3
              </button>
            )}
          </div>
        )}

        {/* CABEÇALHO */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Calendário Anual de Reuniões Ordinárias da CIPA
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                NR-05 (Subitens 5.6.1 e 5.8.1) · Gestão 2026/2027 · Lei Federal nº 14.457/2022
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-slate-200 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* BANNER DE VÍNCULO COM O MÓDULO 3 (GESTÃO DA CIPA) */}
          {hasModuloGestao ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">
                      Módulo de Gestão da CIPA: Contratado & Ativo
                    </span>
                    {syncedWithGestao && (
                      <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Sincronizado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                    Este calendário programa automaticamente todas as 12 reuniões ordinárias mensais com disparo de alertas e minutas de ata digitais no Módulo 3.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncWithGestao}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{syncedWithGestao ? 'Atualizar Sincronização' : 'Sincronizar com Módulo 3'}</span>
                </button>
                {onNavigateToGestao && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToGestao();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Abrir Módulo 3</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-amber-950 block">
                    Módulo de Gestão da CIPA não contratado neste plano
                  </span>
                  <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                    O calendário programado atende 100% aos requisitos legais da NR-05 (subitem 5.6.1) para geração de documento e protocolo junto ao sindicato. Para gerenciamento online contínuo com geração de atas mensais e alertas automáticos, contrate o Módulo 3.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PAINEL DE CONFIGURAÇÃO DO DIA ÚTIL E PARÂMETROS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Parâmetros Normativos do Motor de Agendamento
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Data Base de Posse: <strong className="text-slate-800">{posseDate}</strong>
              </span>
            </div>

            {/* SELEÇÃO DO DIA ÚTIL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Em qual dia útil de cada mês ocorrerão as reuniões ordinárias?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiaUtil(d)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      diaUtil === d
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span>{d}º dia útil</span>
                    {d === 5 && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${diaUtil === 5 ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        Padrão
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>O motor exclui automaticamente fins de semana e feriados nacionais oficiais (Leis nº 662/49 e nº 14.759/23).</span>
              </p>
            </div>

            {/* HORÁRIO, LOCAL E MÊS DA SIPAT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Horário das Reuniões (NR-5 subitem 5.6.2)
                </label>
                <select
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-emerald-500"
                >
                  <option value="09:00 às 10:30">09:00 às 10:30 (Manhã)</option>
                  <option value="10:00 às 11:30">10:00 às 11:30 (Manhã - Recomendado)</option>
                  <option value="14:00 às 15:30">14:00 às 15:30 (Tarde)</option>
                  <option value="15:00 às 16:30">15:00 às 16:30 (Tarde)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Local / Sala de Realização
                </label>
                <input
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Sala de Reuniões / Presencial"
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Mês Fixado para a SIPAT Anual
                </label>
                <select
                  value={sipatMonthIndex}
                  onChange={(e) => setSipatMonthIndex(Number(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-emerald-500"
                >
                  <option value={3}>3ª Reunião (Planejamento preliminar)</option>
                  <option value={4}>4ª Reunião (Novembro - Semana SIPAT)</option>
                  <option value={5}>5ª Reunião (Dezembro - SIPAT)</option>
                  <option value={8}>8ª Reunião (Março - SIPAT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABELA DAS 12 REUNIÕES PROGRAMADAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                Cronograma Detalhado das 12 Reuniões Ordinárias da Gestão
              </h4>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold">
                12 Reuniões · Portaria MTP nº 4.219/2022
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2.5 px-3 text-center w-12">Nº</th>
                      <th className="py-2.5 px-3 w-28">Mês / Ano</th>
                      <th className="py-2.5 px-3 w-32">Data Prevista</th>
                      <th className="py-2.5 px-3 w-28">Dia Semana</th>
                      <th className="py-2.5 px-3 w-32">Horário</th>
                      <th className="py-2.5 px-3">Pauta Principal & Lei 14.457/2022</th>
                      <th className="py-2.5 px-3 text-center w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedule.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          item.isSipat ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                          {item.numero}ª
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.mesAno}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                          {item.dataFormatada}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {item.diaSemana}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] font-mono">
                          {item.horario}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {editingMeetingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editPauta}
                                onChange={(e) => setEditPauta(e.target.value)}
                                className="w-full text-xs border border-emerald-500 rounded px-2 py-1 bg-white"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveIndividualPauta(item.id)}
                                className="text-white bg-emerald-600 hover:bg-emerald-700 p-1 rounded cursor-pointer"
                                title="Salvar pauta"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-1.5">
                              {item.isSipat && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 font-mono">
                                  ★ SIPAT
                                </span>
                              )}
                              <span className="line-clamp-2 text-slate-700 leading-snug">
                                {item.pauta}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMeetingId(item.id);
                              setEditPauta(item.pauta);
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Editar pauta da reunião"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ COM AÇÕES */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Mandato: <strong className="text-slate-800">2026/2027</strong> · Subitem 5.6.1 da NR-05
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleOpenOfficialDocument}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Ver Documento Oficial</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{isDownloadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSaveSchedule) {
                  onSaveSchedule(schedule, diaUtil);
                }
                if (hasModuloGestao) {
                  handleSyncWithGestao();
                }
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar e Programar Calendário</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
