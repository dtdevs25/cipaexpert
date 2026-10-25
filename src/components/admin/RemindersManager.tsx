import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  Clock, 
  Send, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  X, 
  Mail, 
  MessageSquare, 
  Users, 
  ShieldCheck,
  Check,
  Trash2,
  Eye,
  Edit3,
  CalendarClock
} from 'lucide-react';
import { StandardModal } from '../common/StandardModal';

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'nr5_legal' | 'reuniao' | 'eleicao' | 'customizado';
  channel: 'email' | 'whatsapp' | 'sistema' | 'todos';
  targetAudience: string;
  status: 'agendado' | 'disparado' | 'pendente';
  message: string;
}

interface RemindersManagerProps {
  companyName: string;
  onBackToMenu: () => void;
}

export const RemindersManager: React.FC<RemindersManagerProps> = ({
  companyName,
  onBackToMenu
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 'rem-1',
      title: 'Convocação do Processo Eleitoral (NR-5 Item 5.5.1)',
      date: '15/10/2026',
      time: '08:00',
      type: 'nr5_legal',
      channel: 'todos',
      targetAudience: 'Empregador, Gestores e RH',
      status: 'agendado',
      message: 'Aviso legal obrigatório: Faltam exatamente 60 dias para o término do mandato atual da CIPA. O edital de convocação deve ser publicado hoje.'
    },
    {
      id: 'rem-2',
      title: 'Abertura das Inscrições de Candidatos (15 dias)',
      date: '25/10/2026',
      time: '09:00',
      type: 'eleicao',
      channel: 'todos',
      targetAudience: 'Todos os Colaboradores Elegíveis (CLT)',
      status: 'agendado',
      message: 'Inscrições abertas para a CIPA gestão 2026/2027. Inscreva-se pelo portal CIPA Expert até 10/11/2026.'
    },
    {
      id: 'rem-3',
      title: 'Reunião Ordinária CIPA do Mês (Pauta Antiassédio)',
      date: '10/11/2026',
      time: '14:30',
      type: 'reuniao',
      channel: 'email',
      targetAudience: 'Membros Titulares e Suplentes da CIPA',
      status: 'agendado',
      message: 'Convocação da 11ª Reunião Ordinária da CIPA na Sala de Treinamentos e Online via CIPA Expert. Pauta: Lei 14.457/22 e plano 5W2H.'
    },
    {
      id: 'rem-4',
      title: 'Vencimento de Ação Preventiva 5W2H (Guarda-corpo Linha 2)',
      date: '02/11/2026',
      time: '17:00',
      type: 'customizado',
      channel: 'sistema',
      targetAudience: 'Técnico de SST e Manutenção',
      status: 'agendado',
      message: 'Prazo limite para implementação e envio de evidências fotográficas da adequação de segurança da Linha 2.'
    }
  ]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-11-15');
  const [newTime, setNewTime] = useState('09:00');
  const [newChannel, setNewChannel] = useState<'email' | 'whatsapp' | 'sistema' | 'todos'>('todos');
  const [newTarget, setNewTarget] = useState('Todos os Cipeiros');
  const [newMessage, setNewMessage] = useState('');
  
  // Standardized Modals State
  const [viewingReminder, setViewingReminder] = useState<Reminder | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [systemFeedback, setSystemFeedback] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'error';
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'success'
  });

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessage) return;

    const newRem: Reminder = {
      id: `rem-${Date.now()}`,
      title: newTitle,
      date: newDate.split('-').reverse().join('/'),
      time: newTime,
      type: 'customizado',
      channel: newChannel,
      targetAudience: newTarget,
      status: 'agendado',
      message: newMessage
    };

    setReminders([newRem, ...reminders]);
    setIsNewModalOpen(false);
    setNewTitle('');
    setNewMessage('');

    setSystemFeedback({
      isOpen: true,
      title: 'Lembrete Agendado!',
      description: `O alerta "${newRem.title}" foi programado com sucesso para ${newRem.date} às ${newRem.time}.`,
      type: 'success'
    });
  };

  const handleDispatchNow = (id: string, title: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'disparado' } : r));
    setSystemFeedback({
      isOpen: true,
      title: 'Disparo Efetuado com Sucesso!',
      description: `Notificações para o lembrete "${title}" foram enviadas aos destinatários via múltiplos canais criptografados.`,
      type: 'success'
    });
  };

  const handleConfirmDeleteReminder = () => {
    if (!reminderToDelete) return;
    const title = reminderToDelete.title;
    setReminders(reminders.filter(r => r.id !== reminderToDelete.id));
    setReminderToDelete(null);
    setSystemFeedback({
      isOpen: true,
      title: 'Lembrete Excluído',
      description: `O lembrete "${title}" foi removido do cronograma de alertas.`,
      type: 'success'
    });
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* Header Bar: Verde Mais Vibrante e Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 py-2.5 px-4 sm:px-5 rounded-xl border border-emerald-300 shadow-xs w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CalendarClock className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight">
            Central de Lembretes & Alertas NR-5
          </h2>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Novo Lembrete</span>
        </button>
      </div>

      {/* Grid de Cards de Lembretes: 100% Responsivo em Toda a Largura */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
        {reminders.map((rem) => {
          const isDispatched = rem.status === 'disparado';

          return (
            <div
              key={rem.id}
              className={`bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group ${
                isDispatched ? 'opacity-85' : ''
              }`}
            >
              {/* Header na cor verde claro idêntico ao dashboard */}
              <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Bell className="w-4 h-4 text-emerald-700" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-950 truncate">
                    {rem.type === 'nr5_legal' && 'Obrigatório NR-5'}
                    {rem.type === 'reuniao' && 'Reunião CIPA'}
                    {rem.type === 'eleicao' && 'Eleição Digital'}
                    {rem.type === 'customizado' && 'Ação Preventiva'}
                  </span>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/90 text-slate-700 border border-slate-200 shrink-0">
                  {rem.date} · {rem.time}
                </span>
              </div>

              {/* Conteúdo interno */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {rem.title}
                  </h3>

                  {/* Mensagem */}
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3">
                    "{rem.message}"
                  </p>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{rem.targetAudience}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="capitalize truncate">{rem.channel === 'todos' ? 'E-mail, WhatsApp & App' : rem.channel}</span>
                    </div>
                  </div>
                </div>

              {/* Botões de Ação Padronizados: Visualizar, Excluir, Disparar */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                
                {/* Botões Visualizar e Excluir */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewingReminder(rem)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
                    title="Visualizar Detalhes"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setReminderToDelete(rem)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                    title="Excluir Lembrete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>

                {/* Botão de Disparo */}
                <button
                  onClick={() => handleDispatchNow(rem.id, rem.title)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3 h-3 text-emerald-400" />
                  <span>{isDispatched ? 'Reenviar' : 'Disparar Agora'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>

      {/* MODAL PADRONIZADO: VISUALIZAR LEMBRETE */}
      {viewingReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-700" />
                Detalhes do Lembrete
              </h3>
              <button onClick={() => setViewingReminder(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assunto</span>
                <strong className="text-sm font-bold text-slate-900 block">{viewingReminder.title}</strong>
                <div className="flex items-center gap-4 text-slate-600 pt-1 font-mono text-xs">
                  <span>📅 {viewingReminder.date}</span>
                  <span>⏰ {viewingReminder.time}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Conteúdo da Notificação</span>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {viewingReminder.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Público-Alvo</span>
                  <strong className="text-slate-800 text-xs block">{viewingReminder.targetAudience}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Canais</span>
                  <strong className="text-slate-800 text-xs block capitalize">{viewingReminder.channel}</strong>
                </div>
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingReminder(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PADRONIZADO: EXCLUIR LEMBRETE */}
      <StandardModal
        isOpen={!!reminderToDelete}
        onClose={() => setReminderToDelete(null)}
        type="confirm_delete"
        title="Confirmar Exclusão de Lembrete"
        description={
          reminderToDelete 
            ? `Tem certeza que deseja cancelar e excluir o alerta "${reminderToDelete.title}"?`
            : ''
        }
        confirmLabel="Sim, Excluir Lembrete"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDeleteReminder}
      />

      {/* MODAL PADRONIZADO: FEEDBACK GERAL */}
      <StandardModal
        isOpen={systemFeedback.isOpen}
        onClose={() => setSystemFeedback({ ...systemFeedback, isOpen: false })}
        type={systemFeedback.type}
        title={systemFeedback.title}
        description={systemFeedback.description}
        confirmLabel="Compreendido"
      />

      {/* MODAL CRIAR LEMBRETE */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-emerald-200/80 bg-emerald-50/80 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-700" />
                Agendar Novo Lembrete / Alerta
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Título do Alerta / Assunto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alerta de prazo da 7ª Reunião Ordinária"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Data do Disparo</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Horário</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Canal de Envio</label>
                  <select
                    value={newChannel}
                    onChange={e => setNewChannel(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="todos">Todos (E-mail + WhatsApp + App)</option>
                    <option value="email">Apenas E-mail</option>
                    <option value="whatsapp">Apenas WhatsApp Corporativo</option>
                    <option value="sistema">Apenas Notificação no Sistema</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Destinatários</label>
                  <input
                    type="text"
                    required
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    placeholder="Ex: Cipeiros Titulares"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Texto da Mensagem</label>
                <textarea
                  required
                  rows={3}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escreva a mensagem que será entregue aos colaboradores..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Agendar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
