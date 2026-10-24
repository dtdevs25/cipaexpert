import React, { useState } from 'react';
import { AtaReuniao, PlanoAcao5W2H, ReuniaoCalendario } from '../../types/cipa';
import { generateCipaDocument, GeneratedDocument } from '../../data/documentTemplates';
import { 
  FileCheck, 
  Calendar, 
  CheckSquare, 
  ShieldCheck, 
  Plus, 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Printer, 
  Filter,
  UserCheck,
  Building,
  Target,
  ShieldAlert
} from 'lucide-react';
import { useCipa } from '../../context/CipaContext';
import { InteractiveRiskMap } from './gestao/InteractiveRiskMap';

interface Module3GestaoCIPAProps {
  onOpenDocument: (doc: GeneratedDocument) => void;
  onOpenSignatureModal: (ataId: string, docTitle: string) => void;
  companyName: string;
  cnpj: string;
  signedAtas: Record<string, { hash: string; timestamp: string; signerName: string }>;
}

export const Module3GestaoCIPA: React.FC<Module3GestaoCIPAProps> = ({
  onOpenDocument,
  onOpenSignatureModal,
  companyName,
  cnpj,
  signedAtas
}) => {
  const { planos5W2H, savePlano5W2H } = useCipa();
  const [activeSubTab, setActiveSubTab] = useState<'atas' | 'calendario' | 'planos' | 'maparisco'>('atas');

  // List of Monthly Meeting Minutes
  const [atas, setAtas] = useState<AtaReuniao[]>([
    {
      id: 'ata-1',
      numero: 1,
      tipo: 'ordinaria',
      data: '2026-10-05',
      horario: '14:00 às 15:30',
      local: 'Sala de Treinamento e Videoconferência',
      pauta: '1. Acompanhamento dos quase-acidentes de Setembro; 2. Campanha de prevenção ao assédio moral e sexual (Lei 14.457/22); 3. Inspeção de extintores e hidrantes.',
      deliberacoes: 'Aprovada a colocação de novos cartazes do canal anônimo de denúncias; programada blitz de segurança na linha de montagem com o SESMT.',
      participantes: [
        { nome: 'Carlos Mendes', cargo: 'Presidente', papel: 'Empregador', assinado: true },
        { nome: 'Renata Vasconcelos', cargo: 'Vice-Presidente', papel: 'Empregados', assinado: true },
        { nome: 'Mariana Souza', cargo: 'Secretária', papel: 'Membro', assinado: false }
      ],
      status: 'assinada',
      hashAssinatura: 'EC-4F91B883C1A2E0942B',
      dataAssinatura: '05/10/2026 15:35'
    },
    {
      id: 'ata-2',
      numero: 2,
      tipo: 'ordinaria',
      data: '2026-11-04',
      horario: '14:00 às 15:30',
      local: 'Sala de Reuniões da Diretoria',
      pauta: '1. Avaliação do Mapa de Riscos do setor de Logística; 2. Treinamento de primeiros socorros para brigada; 3. Definição do tema da SIPAT 2026.',
      deliberacoes: 'Mapa de riscos atualizado com inclusão de riscos psicossociais; orçamento preliminar da SIPAT encaminhado à diretoria.',
      participantes: [
        { nome: 'Carlos Mendes', cargo: 'Presidente', papel: 'Empregador', assinado: false },
        { nome: 'Renata Vasconcelos', cargo: 'Vice-Presidente', papel: 'Empregados', assinado: false }
      ],
      status: 'rascunho'
    }
  ]);

  // Calendar of Meetings with Reminders
  const [calendario, setCalendario] = useState<ReuniaoCalendario[]>([
    {
      id: 'cal-1',
      titulo: '1ª Reunião Ordinária da CIPA',
      data: '2026-10-05',
      tipo: 'ordinaria',
      horario: '14:00',
      local: 'Sala de Treinamentos A',
      concluida: true,
      lembreteAtivo: true
    },
    {
      id: 'cal-2',
      titulo: '2ª Reunião Ordinária da CIPA',
      data: '2026-11-04',
      tipo: 'ordinaria',
      horario: '14:00',
      local: 'Sala de Reuniões',
      concluida: false,
      lembreteAtivo: true
    },
    {
      id: 'cal-3',
      titulo: '3ª Reunião Ordinária da CIPA',
      data: '2026-12-02',
      tipo: 'ordinaria',
      horario: '14:00',
      local: 'Sala de Treinamentos A',
      concluida: false,
      lembreteAtivo: true
    },
    {
      id: 'cal-sipat',
      titulo: 'SIPAT 2026 - Semana Interna de Prevenção de Acidentes e Assédio',
      data: '2026-12-14',
      tipo: 'sipat',
      horario: '08:00 às 17:00',
      local: 'Auditório Principal',
      concluida: false,
      lembreteAtivo: true
    },
    {
      id: 'cal-4',
      titulo: '4ª Reunião Ordinária da CIPA',
      data: '2027-01-08',
      tipo: 'ordinaria',
      horario: '14:00',
      local: 'Sala de Reuniões',
      concluida: false,
      lembreteAtivo: false
    }
  ]);

  // 5W2H Action Plans
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao5W2H[]>([
    {
      id: 'pl-1',
      oQue: 'Instalação de grade de proteção física e sensor fotoelétrico na Prensa 04',
      porQue: 'Prevenção de amputação e adequação rigorosa à NR-12 e apontamento de risco da CIPA',
      onde: 'Setor de Estamparia / Galpão 2',
      quem: 'Engenharia de Manutenção (Resp: Lucas)',
      quando: '2026-10-25',
      como: 'Fabricação interna com trava intertravada de segurança categoria 4',
      quanto: 'R$ 4.800,00',
      status: 'em_andamento',
      categoria: 'prevencao_acidentes'
    },
    {
      id: 'pl-2',
      oQue: 'Workshop obrigatório sobre Prevenção e Combate ao Assédio Sexual e Moral',
      porQue: 'Cumprimento da Lei Federal 14.457/2022 e exigência do subitem da NR-5',
      onde: 'Auditório e Plataforma Online para colaboradores remotos',
      quem: 'RH & Comissão da CIPA (Resp: Renata)',
      quando: '2026-10-30',
      como: 'Palestra com especialista externa em psicologia do trabalho e dinâmicas de acolhimento',
      quanto: 'R$ 2.200,00',
      status: 'pendente',
      categoria: 'prevencao_assedio'
    },
    {
      id: 'pl-3',
      oQue: 'Substituição de protetores auriculares tipo plugue por concha com atenuação de 24dB',
      porQue: 'Nível de ruído aferido acima do limite de tolerância (89 dBA) no setor de usinagem',
      onde: 'Linha de Usinagem CNC',
      quem: 'Técnico de Segurança do Trabalho (Resp: Silva)',
      quando: '2026-10-12',
      como: 'Compra corporativa e entrega individual com ficha de EPI assinada digitalmente',
      quanto: 'R$ 1.650,00',
      status: 'concluido',
      categoria: 'epis_epcs'
    }
  ]);

  // Form state for creating a new action plan
  const [showNewPlanoForm, setShowNewPlanoForm] = useState(false);
  const [novoOQue, setNovoOQue] = useState('');
  const [novoQuem, setNovoQuem] = useState('');
  const [novoQuando, setNovoQuando] = useState('');
  const [novoCategoria, setNovoCategoria] = useState<PlanoAcao5W2H['categoria']>('prevencao_acidentes');

  // Form state for creating a new minutes
  const [showNewAtaForm, setShowNewAtaForm] = useState(false);
  const [novaPauta, setNovaPauta] = useState('');
  const [novaData, setNovaData] = useState('2026-11-20');

  const handleToggleLembrete = (id: string) => {
    setCalendario((prev) =>
      prev.map((item) => (item.id === id ? { ...item, lembreteAtivo: !item.lembreteAtivo } : item))
    );
  };

  const handleAddPlano = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoOQue || !novoQuem) return;

    const novoPlano: PlanoAcao5W2H = {
      id: 'pl-' + (planosAcao.length + 1),
      oQue: novoOQue,
      porQue: 'Ação preventiva deliberada pela CIPA para controle de riscos ocupacionais',
      onde: 'Áreas operacionais da empresa',
      quem: novoQuem,
      quando: novoQuando || '2026-11-15',
      como: 'Implementação monitorada com registro fotográfico e checklist',
      quanto: 'R$ 0,00 (Recurso Interno)',
      status: 'pendente',
      categoria: novoCategoria
    };

    setPlanosAcao([novoPlano, ...planosAcao]);
    setNovoOQue('');
    setNovoQuem('');
    setShowNewPlanoForm(false);
  };

  const handleAddAta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaPauta) return;

    const novaAta: AtaReuniao = {
      id: 'ata-' + (atas.length + 1),
      numero: atas.length + 1,
      tipo: 'ordinaria',
      data: novaData,
      horario: '14:00 às 15:30',
      local: 'Sala de Treinamentos Principal',
      pauta: novaPauta,
      deliberacoes: 'Ata registrada e encaminhada para colheita de assinaturas eletrônicas.',
      participantes: [
        { nome: 'Carlos Mendes', cargo: 'Presidente da CIPA', papel: 'Empregador', assinado: false },
        { nome: 'Renata Vasconcelos', cargo: 'Vice-Presidente', papel: 'Empregados', assinado: false }
      ],
      status: 'rascunho'
    };

    setAtas([novaAta, ...atas]);
    setNovaPauta('');
    setShowNewAtaForm(false);
  };

  const handleOpenAtaDoc = (ata: AtaReuniao) => {
    const isSigned = !!signedAtas[ata.id] || ata.status === 'assinada';
    const sigInfo = signedAtas[ata.id];

    const doc: GeneratedDocument = {
      title: `ATA DA ${ata.numero}ª REUNIÃO ${ata.tipo.toUpperCase()} DA CIPA`,
      category: 'Reunião Mensal CIPA',
      normativeCode: 'NR-5 - Item 5.6.1 & Lei 14.457/2022',
      companyName,
      cnpj,
      dateGenerated: new Date(ata.data).toLocaleDateString('pt-BR'),
      content: [
        `Aos dias ${new Date(ata.data).toLocaleDateString('pt-BR')}, no horário de ${ata.horario}, no local ${ata.local}, reuniu-se a Comissão Interna de Prevenção de Acidentes e Assédio da empresa ${companyName}.`,
        `PAUTA DISCUTIDA:\n${ata.pauta}`,
        `DELIBERAÇÕES E ENCAMINHAMENTOS:\n${ata.deliberacoes}`,
        `CLÁUSULA DE CONFORMIDADE COM A LEI 14.457/2022: Restou registrado o acompanhamento contínuo das medidas de prevenção ao assédio e a garantia de funcionamento irrestrito do canal anônimo de denúncias sem retaliação.`,
        `Esta ata é lavrada em conformidade com o Artigo 10 da MP 2.200-2/2001 e NR-5 item 5.6.3, possuindo plena validade jurídica após aposição de assinatura digital pela plataforma CIPA Expert.`
      ],
      signatories: ata.participantes.map((p) => `${p.nome} (${p.cargo})`)
    };

    onOpenDocument(doc);
  };

  const handleUpdateStatusPlano = (id: string, status: PlanoAcao5W2H['status']) => {
    setPlanosAcao((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-150">
      
      {/* Module Top Bar: Verde Claro Padronizado */}
      <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Módulo 3 · Gestão Contínua, Atas & Assinatura Digital
          </h2>
        </div>
      </div>

      {/* Guias do Módulo fora do card de título (igual à página de Cadastros Gerais) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full py-1">
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('atas')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'atas'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atas das Reuniões
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('calendario')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'calendario'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calendário & Alertas
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('planos')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'planos'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Planos de Ação 5W2H
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('maparisco')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'maparisco'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mapa de Riscos (NR-5)
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ATAS DAS REUNIÕES */}
      {activeSubTab === 'atas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Atas Mensais da CIPA (Ordinárias & Extraordinárias)
            </h3>
            <button
              onClick={() => setShowNewAtaForm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Ata de Reunião</span>
            </button>
          </div>

          {/* New Minute Form Modal/Drawer */}
          {showNewAtaForm && (
            <form onSubmit={handleAddAta} className="bg-slate-50 p-5 rounded-xl border border-slate-300 space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold uppercase text-slate-800">Registrar Nova Ata de Reunião</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data da Reunião</label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pauta e Tópicos Discutidos</label>
                  <input
                    type="text"
                    placeholder="Ex: Análise dos postos de trabalho, medidas antiassédio e EPIs..."
                    value={novaPauta}
                    onChange={(e) => setNovaPauta(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAtaForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Salvar Rascunho da Ata
                </button>
              </div>
            </form>
          )}

          {/* Minutes Cards */}
          <div className="grid grid-cols-1 gap-4">
            {atas.map((ata) => {
              const isAssinada = ata.status === 'assinada' || !!signedAtas[ata.id];
              const sigData = signedAtas[ata.id];

              return (
                <div
                  key={ata.id}
                  className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Header na cor verde claro idêntico ao dashboard */}
                  <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        <FileText className="w-4 h-4 text-emerald-700" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        ATA Nº {ata.numero.toString().padStart(2, '0')} · Reunião {ata.tipo === 'ordinaria' ? 'Ordinária Mensal' : 'Extraordinária'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 bg-white/90 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                      {new Date(ata.data).toLocaleDateString('pt-BR')} ({ata.horario})
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <p className="text-xs text-slate-600 line-clamp-2">
                        <strong>Pauta:</strong> {ata.pauta}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <span>Local: {ata.local}</span>
                        <span>·</span>
                        <span>Participantes: {ata.participantes.map(p => p.nome).join(', ')}</span>
                      </div>

                      {isAssinada && (
                        <div className="text-[11px] text-emerald-700 font-mono flex items-center gap-1.5 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            Assinatura Eletrônica Válida ({sigData?.hash || ata.hashAssinatura || 'EC-VALIDATED'})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenAtaDoc(ata)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Visualizar / Imprimir</span>
                      </button>

                      {!isAssinada ? (
                        <button
                          onClick={() => onOpenSignatureModal(ata.id, `Ata nº ${ata.numero} - ${new Date(ata.data).toLocaleDateString('pt-BR')}`)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Assinar Digitalmente</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Assinada</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CALENDÁRIO & ALERTAS */}
      {activeSubTab === 'calendario' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
            <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Calendário Anual de Reuniões Obrigatórias da CIPA
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                12 Reuniões Anuais + SIPAT
              </span>
            </div>

            <div className="p-5 sm:p-6 divide-y divide-slate-100">
              {calendario.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{item.titulo}</span>
                      {item.tipo === 'sipat' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase font-mono">
                          Semana SIPAT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span className="font-mono">{new Date(item.data).toLocaleDateString('pt-BR')} às {item.horario}</span>
                      <span>·</span>
                      <span>Local: {item.local}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLembrete(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        item.lembreteAtivo
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{item.lembreteAtivo ? 'Lembrete Ativo' : 'Ativar Lembrete'}</span>
                    </button>

                    {item.concluida ? (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Realizada
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Pendente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PLANOS DE AÇÃO 5W2H */}
      {activeSubTab === 'planos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Plano de Ação Preventivo da CIPA (Metodologia 5W2H)
            </h3>
            <button
              onClick={() => setShowNewPlanoForm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Ação 5W2H</span>
            </button>
          </div>

          {/* New Action Form */}
          {showNewPlanoForm && (
            <form onSubmit={handleAddPlano} className="bg-slate-50 p-5 rounded-xl border border-slate-300 space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold uppercase text-slate-800">Adicionar Medida Preventiva</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">O que será feito? (What)</label>
                  <input
                    type="text"
                    placeholder="Descrição da ação de segurança ou combate ao assédio..."
                    value={novoOQue}
                    onChange={(e) => setNovoOQue(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria de Risco</label>
                  <select
                    value={novoCategoria}
                    onChange={(e) => setNovoCategoria(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="prevencao_acidentes">Prevenção de Acidentes</option>
                    <option value="prevencao_assedio">Combate ao Assédio (Lei 14.457/22)</option>
                    <option value="ergonomia">Ergonomia e Conforto</option>
                    <option value="epis_epcs">EPIs e EPCs</option>
                    <option value="treinamento">Treinamentos e Diálogos</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Responsável (Who)</label>
                  <input
                    type="text"
                    placeholder="Ex: SESMT / Eng. Carlos"
                    value={novoQuem}
                    onChange={(e) => setNovoQuem(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prazo Limite (When)</label>
                  <input
                    type="date"
                    value={novoQuando}
                    onChange={(e) => setNovoQuando(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPlanoForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Criar Ação 5W2H
                </button>
              </div>
            </form>
          )}

          {/* Action Plans Table */}
          <div className="space-y-4">
            {planosAcao.map((plano) => (
              <div
                key={plano.id}
                className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Header na cor verde claro idêntico ao dashboard */}
                <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-950 truncate">
                      {plano.categoria === 'prevencao_assedio'
                        ? '🛡️ Combate ao Assédio (Lei 14.457/22)'
                        : plano.categoria === 'prevencao_acidentes'
                        ? '⚠️ Prevenção de Acidentes'
                        : plano.categoria === 'epis_epcs'
                        ? '🧤 Proteção Individual & Coletiva'
                        : '📋 Norma Regulamentadora'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 font-medium">Status:</span>
                    <select
                      value={plano.status}
                      onChange={(e) => handleUpdateStatusPlano(plano.id, e.target.value as any)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        plano.status === 'concluido'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : plano.status === 'em_andamento'
                          ? 'bg-sky-100 text-sky-900 border-sky-300'
                          : plano.status === 'atrasado'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="atrasado">Em Atraso</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{plano.oQue}</h4>
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-800">Motivo (Why):</strong> {plano.porQue}
                    </p>
                  </div>

                  {/* 5W2H Quick Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Quem (Who)</span>
                      <span className="font-semibold text-slate-800 truncate block">{plano.quem}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Onde (Where)</span>
                      <span className="font-semibold text-slate-800 truncate block">{plano.onde}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Quando (When)</span>
                      <span className="font-mono font-semibold text-slate-800">{new Date(plano.quando).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Custo (How much)</span>
                      <span className="font-mono font-semibold text-slate-800">{plano.quanto}</span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MAPA DE RISCOS INTERATIVO (NR-5) */}
      {activeSubTab === 'maparisco' && (
        <InteractiveRiskMap />
      )}

    </div>
  );
};
