export interface ScheduledMeeting {
  id: string;
  numero: number;
  mesAno: string;
  data: string; // YYYY-MM-DD
  dataFormatada: string; // DD/MM/YYYY
  diaSemana: string; // Segunda-feira, etc.
  horario: string;
  local: string;
  modalidade: string;
  pauta: string;
  isSipat?: boolean;
}

export const PAUTAS_PADRAO_12_MESES: string[] = [
  'Análise inicial dos riscos operacionais da gestão, estruturação do comitê paritário e divulgação do Canal de Denúncias e acolhimento (Lei nº 14.457/2022).',
  'Acompanhamento das notificações de quase-acidentes, inspeção nos sistemas de extintores e verificação dos equipamentos de proteção individual (EPIs).',
  'Planejamento preliminar da SIPAT (Semana Interna de Prevenção de Acidentes e Assédio) e campanha educativa sobre ergonomia nos postos de trabalho.',
  'Avaliação dos postos de trabalho operacionais e revisão do Plano de Ação 5W2H preventivo em conjunto com o SESMT.',
  'Ações educativas de combate ao assédio sexual e violência moral no ambiente de trabalho (Lei nº 14.457/2022) e vistoria nas rotas de fuga.',
  'Balanço semestral de ocorrências, revisão crítica do Mapa de Riscos setorial e acompanhamento das manutenções prediais preventivas.',
  'Inspeção sanitária e ergonômica em refeitórios, vestiários e áreas de convivência; acompanhamento do PCMSO e exames periódicos.',
  'Fechamento da grade de palestras e oficinas da SIPAT anual e blitz de segurança sobre direção defensiva e deslocamento seguro.',
  'Realização e apuração dos resultados da SIPAT da gestão; avaliação das sugestões dos colaboradores colhidas na caixa de ideias.',
  'Vistoria técnica e teste hidrostático em hidrantes, mangueiras e alarme de incêndio com simulado de evacuação e primeiros socorros.',
  'Deflagração dos preparativos preliminares para o próximo processo eleitoral da CIPA (60 dias antes do término) e revisão de metas anuais.',
  'Apresentação do Relatório Final de Encerramento de Mandato, prestação de contas das ações 5W2H e transição solene para a comissão sucessora.'
];

/**
 * Feriados nacionais oficiais brasileiros fixos (Lei Federal nº 662/1949, Lei nº 6.802/1980 e Lei nº 14.759/2023)
 */
export function isBrazilianHoliday(date: Date): boolean {
  const m = date.getMonth(); // 0-11
  const d = date.getDate();
  if (m === 0 && d === 1) return true; // Confraternização Universal (01/01)
  if (m === 3 && d === 21) return true; // Tiradentes (21/04)
  if (m === 4 && d === 1) return true; // Dia do Trabalho (01/05)
  if (m === 8 && d === 7) return true; // Independência do Brasil (07/09)
  if (m === 9 && d === 12) return true; // N. Sra. Aparecida (12/10)
  if (m === 10 && d === 2) return true; // Finados (02/11)
  if (m === 10 && d === 15) return true; // Proclamação da República (15/11)
  if (m === 10 && d === 20) return true; // Dia da Consciência Negra (20/11 - Lei nº 14.759/23)
  if (m === 11 && d === 25) return true; // Natal (25/12)
  return false;
}

/**
 * Calcula o N-ésimo dia útil de um mês e ano, pulando fins de semana e feriados nacionais brasileiros.
 */
export function getNthBusinessDay(year: number, month: number, n: number): Date {
  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
  const isBusiness = (date: Date) => !isWeekend(date) && !isBrazilianHoliday(date);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const candidate = new Date(year, month, day);
    if (isBusiness(candidate)) {
      count++;
      if (count === n) {
        return candidate;
      }
    }
  }

  // Se n for maior que os dias úteis disponíveis, retorna o último dia útil do mês
  for (let day = daysInMonth; day >= 1; day--) {
    const candidate = new Date(year, month, day);
    if (isBusiness(candidate)) {
      return candidate;
    }
  }

  return new Date(year, month, daysInMonth);
}

/**
 * Gera a agenda completa das 12 reuniões ordinárias anuais da CIPA com base na data da posse
 * e no parâmetro do dia útil de cada mês (ex: 5º dia útil).
 */
export function generate12MeetingsSchedule(
  posseDateStr: string,
  diaUtil: number = 5,
  horario: string = '14:00 às 15:30',
  local: string = 'Sala de Treinamento e Reuniões - Presencial',
  sipatMonthOffset: number = 4
): ScheduledMeeting[] {
  let dateBase = new Date();
  if (posseDateStr) {
    if (posseDateStr.includes('/')) {
      const parts = posseDateStr.split('/');
      if (parts.length === 3) {
        dateBase = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    } else {
      const parsed = new Date(posseDateStr);
      if (!isNaN(parsed.getTime())) dateBase = parsed;
    }
  }

  const startYear = dateBase.getFullYear();
  const startMonth = dateBase.getMonth(); // 0-indexed

  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const schedule: ScheduledMeeting[] = [];

  for (let i = 1; i <= 12; i++) {
    const targetMonthIndex = (startMonth + i) % 12;
    const yearOffset = Math.floor((startMonth + i) / 12);
    const targetYear = startYear + yearOffset;

    const meetingDate = getNthBusinessDay(targetYear, targetMonthIndex, diaUtil);
    const diaNome = diasSemana[meetingDate.getDay()];
    const mesNome = mesesNomes[targetMonthIndex];
    const dataFormatada = meetingDate.toLocaleDateString('pt-BR');
    const yyyy = meetingDate.getFullYear();
    const mm = String(meetingDate.getMonth() + 1).padStart(2, '0');
    const dd = String(meetingDate.getDate()).padStart(2, '0');
    const dataIso = `${yyyy}-${mm}-${dd}`;

    const isSipat = i === sipatMonthOffset;

    schedule.push({
      id: `reuniao-${i}`,
      numero: i,
      mesAno: `${mesNome}/${targetYear}`,
      data: dataIso,
      dataFormatada,
      diaSemana: diaNome,
      horario,
      local,
      modalidade: 'Presencial Obrigatória (NR-05)',
      pauta: PAUTAS_PADRAO_12_MESES[i - 1] || 'Pauta ordinária preventiva NR-5 e combate ao assédio.',
      isSipat
    });
  }

  return schedule;
}

