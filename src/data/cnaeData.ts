import { CnaeEntry, DimensionamentoResult, CronogramaItem } from '../types/cipa';

// Lista de CNAEs reais frequentes com classificação oficial de Grau de Risco (NR-4/NR-5)
export const CNAE_DATABASE: CnaeEntry[] = [
  { code: '4120-4/00', description: 'Construção de edifícios', grauDeRisco: 3, sectorGroup: 'C-18' },
  { code: '4211-1/01', description: 'Construção de rodovias e ferrovias', grauDeRisco: 4, sectorGroup: 'C-18' },
  { code: '1011-2/01', description: 'Frigorífico - abate de bovinos', grauDeRisco: 3, sectorGroup: 'C-2' },
  { code: '8610-1/01', description: 'Atividades de atendimento hospitalar', grauDeRisco: 3, sectorGroup: 'C-31' },
  { code: '8630-5/03', description: 'Atividade médica ambulatorial com recursos para realização de procedimentos cirúrgicos', grauDeRisco: 3, sectorGroup: 'C-31' },
  { code: '6201-5/01', description: 'Desenvolvimento de programas de computador sob encomenda (Tecnologia/TI)', grauDeRisco: 1, sectorGroup: 'C-34' },
  { code: '6202-3/00', description: 'Desenvolvimento e licenciamento de programas de computador customizáveis', grauDeRisco: 1, sectorGroup: 'C-34' },
  { code: '4711-3/02', description: 'Comércio varejista de mercadorias em geral (Supermercados)', grauDeRisco: 2, sectorGroup: 'C-24' },
  { code: '4712-1/00', description: 'Comércio varejista de mercadorias em geral (Minimercados)', grauDeRisco: 2, sectorGroup: 'C-24' },
  { code: '4930-2/02', description: 'Transporte rodoviário de carga intermunicipal e interestadual', grauDeRisco: 3, sectorGroup: 'C-21' },
  { code: '2511-0/00', description: 'Fabricação de estruturas metálicas', grauDeRisco: 4, sectorGroup: 'C-13' },
  { code: '2910-7/01', description: 'Fabricação de automóveis, camionetas e utilitários', grauDeRisco: 3, sectorGroup: 'C-14' },
  { code: '8520-1/00', description: 'Ensino médio e fundamental (Escolas)', grauDeRisco: 2, sectorGroup: 'C-30' },
  { code: '8532-5/00', description: 'Educação superior - graduação e pós-graduação', grauDeRisco: 2, sectorGroup: 'C-30' },
  { code: '5611-2/01', description: 'Restaurantes e similares', grauDeRisco: 2, sectorGroup: 'C-27' },
  { code: '8011-1/01', description: 'Atividades de vigilância e segurança privada', grauDeRisco: 3, sectorGroup: 'C-32' },
  { code: '8121-4/00', description: 'Limpeza em prédios e em domicílios (Serviços Gerais)', grauDeRisco: 3, sectorGroup: 'C-32' },
  { code: '0111-3/01', description: 'Cultivo de arroz (Agricultura)', grauDeRisco: 3, sectorGroup: 'C-1' },
  { code: '1921-7/00', description: 'Fabricação de produtos do refino de petróleo (Petroquímica)', grauDeRisco: 3, sectorGroup: 'C-8' },
  { code: '2029-1/00', description: 'Fabricação de produtos químicos orgânicos não especificados', grauDeRisco: 4, sectorGroup: 'C-8' },
  { code: '6422-1/00', description: 'Bancos múltiplos com carteira comercial (Instituições Financeiras)', grauDeRisco: 1, sectorGroup: 'C-33' },
  { code: '6911-7/01', description: 'Serviços advocatícios e consultoria jurídica', grauDeRisco: 1, sectorGroup: 'C-34' },
];

/**
 * Calcula o dimensionamento da CIPA conforme a Norma Regulamentadora NR-5
 * (Quadro I e regras de dimensionamento para graus de risco 1 a 4).
 */
export function calcularDimensionamentoNR5(cnae: CnaeEntry, headcount: number): DimensionamentoResult {
  const gr = cnae.grauDeRisco;

  // Regra geral da NR-5:
  // Se número de empregados for menor que 20 (ou até o limite de dispensa do grupo),
  // a empresa é dispensada de constituir CIPA formal, devendo nomear 1 Designado de CIPA
  // (cumprindo treinamento da NR-5 de 20h para GR3/4, 16h para GR2, 8h para GR1).
  if (headcount < 20) {
    return {
      cnae,
      headcount,
      grauDeRisco: gr,
      precisaCipa: false,
      efetivosEmpregador: 0,
      suplentesEmpregador: 0,
      efetivosEmpregados: 0,
      suplentesEmpregados: 0,
      totalMembros: 1, // 1 Designado
      observacaoNormativa: 'Empresa com até 19 colaboradores: dispensada de constituição de CIPA eleita. Conforme item 5.6.4 da NR-5, a organização deve nomear 1 (um) Designado de CIPA com treinamento anual obrigatório (NR-5).'
    };
  }

  // Tabela simplificada representativa do Quadro I da NR-5
  // Dimensionamento por faixa e grau de risco (Efetivos por parte)
  let efetivosPorParte = 1;
  let suplentesPorParte = 1;

  if (gr === 1) {
    if (headcount <= 50) {
      efetivosPorParte = 1;
      suplentesPorParte = 1;
    } else if (headcount <= 100) {
      efetivosPorParte = 2;
      suplentesPorParte = 2;
    } else if (headcount <= 250) {
      efetivosPorParte = 3;
      suplentesPorParte = 3;
    } else if (headcount <= 500) {
      efetivosPorParte = 4;
      suplentesPorParte = 3;
    } else {
      efetivosPorParte = 5;
      suplentesPorParte = 4;
    }
  } else if (gr === 2) {
    if (headcount <= 50) {
      efetivosPorParte = 1;
      suplentesPorParte = 1;
    } else if (headcount <= 100) {
      efetivosPorParte = 2;
      suplentesPorParte = 2;
    } else if (headcount <= 250) {
      efetivosPorParte = 4;
      suplentesPorParte = 3;
    } else if (headcount <= 500) {
      efetivosPorParte = 5;
      suplentesPorParte = 4;
    } else {
      efetivosPorParte = 6;
      suplentesPorParte = 5;
    }
  } else if (gr === 3) {
    if (headcount <= 29) {
      efetivosPorParte = 1;
      suplentesPorParte = 1;
    } else if (headcount <= 50) {
      efetivosPorParte = 2;
      suplentesPorParte = 2;
    } else if (headcount <= 100) {
      efetivosPorParte = 3;
      suplentesPorParte = 3;
    } else if (headcount <= 250) {
      efetivosPorParte = 5;
      suplentesPorParte = 4;
    } else if (headcount <= 500) {
      efetivosPorParte = 6;
      suplentesPorParte = 5;
    } else {
      efetivosPorParte = 8;
      suplentesPorParte = 6;
    }
  } else {
    // Grau de Risco 4
    if (headcount <= 29) {
      efetivosPorParte = 1;
      suplentesPorParte = 1;
    } else if (headcount <= 50) {
      efetivosPorParte = 3;
      suplentesPorParte = 3;
    } else if (headcount <= 100) {
      efetivosPorParte = 4;
      suplentesPorParte = 3;
    } else if (headcount <= 250) {
      efetivosPorParte = 6;
      suplentesPorParte = 5;
    } else if (headcount <= 500) {
      efetivosPorParte = 7;
      suplentesPorParte = 6;
    } else {
      efetivosPorParte = 9;
      suplentesPorParte = 7;
    }
  }

  const total = (efetivosPorParte + suplentesPorParte) * 2;

  return {
    cnae,
    headcount,
    grauDeRisco: gr,
    precisaCipa: true,
    efetivosEmpregador: efetivosPorParte,
    suplentesEmpregador: suplentesPorParte,
    efetivosEmpregados: efetivosPorParte,
    suplentesEmpregados: suplentesPorParte,
    totalMembros: total,
    observacaoNormativa: `Constituição Obrigatória da CIPA (NR-5): A comissão será composta paritariamente por ${efetivosPorParte} titulares e ${suplentesPorParte} suplentes indicados pelo empregador, e ${efetivosPorParte} titulares e ${suplentesPorParte} suplentes eleitos pelos colaboradores em escrutínio secreto.`
  };
}

/**
 * Calcula o cronograma eleitoral da CIPA com base na data de término do mandato atual
 * Conforme itens 5.5 e subitens da NR-5.
 */
export function calcularCronogramaEleitoral(dataTerminoMandatoStr: string): CronogramaItem[] {
  const dataFim = new Date(dataTerminoMandatoStr);
  const addDays = (date: Date, days: number): string => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'cron-1',
      fase: 'Convocação da Eleição',
      descricao: 'Publicação do Edital de Convocação das Eleições da CIPA e comunicação ao sindicato laboral.',
      diasLimite: -60,
      prazoRelativo: '60 dias antes do fim do mandato',
      dataCalculada: addDays(dataFim, -60),
      status: 'concluido',
      documentoTipo: 'edital_convocacao'
    },
    {
      id: 'cron-2',
      fase: 'Constituição da Comissão Eleitoral (CE)',
      descricao: 'Designação da Comissão Eleitoral paritária responsável por organizar e acompanhar todo o pleito.',
      diasLimite: -55,
      prazoRelativo: '55 dias antes do fim do mandato',
      dataCalculada: addDays(dataFim, -55),
      status: 'concluido',
      documentoTipo: 'comissao_eleitoral'
    },
    {
      id: 'cron-3',
      fase: 'Abertura de Inscrições de Candidatos',
      descricao: 'Publicação do Edital de Inscrições (período mínimo obrigatório de 15 dias corridos de inscrição).',
      diasLimite: -45,
      prazoRelativo: '45 dias antes do fim do mandato',
      dataCalculada: addDays(dataFim, -45),
      status: 'em_andamento',
      documentoTipo: 'edital_inscricao'
    },
    {
      id: 'cron-4',
      fase: 'Encerramento e Homologação de Candidaturas',
      descricao: 'Verificação da lista de inscritos, divulgação da cédula oficial e início do período de campanha.',
      diasLimite: -35,
      prazoRelativo: '35 dias antes do fim do mandato',
      dataCalculada: addDays(dataFim, -35),
      status: 'pendente',
      documentoTipo: 'outro'
    },
    {
      id: 'cron-5',
      fase: 'Realização da Eleição Online (Votação Secreta)',
      descricao: 'Votação digital auditada com apuração instantânea e verificação de quórum mínimo (50% + 1).',
      diasLimite: -30,
      prazoRelativo: 'Pelo menos 30 dias antes do fim do mandato',
      dataCalculada: addDays(dataFim, -30),
      status: 'pendente',
      documentoTipo: 'ata_eleicao'
    },
    {
      id: 'cron-6',
      fase: 'Treinamento Obrigatório dos Eleitos e Indicados',
      descricao: 'Curso preparatório conforme Grau de Risco e exigências da nova NR-5 (com tema Prevenção do Assédio - Lei 14.457/22).',
      diasLimite: -10,
      prazoRelativo: 'Antes da posse dos membros',
      dataCalculada: addDays(dataFim, -10),
      status: 'pendente',
      documentoTipo: 'outro'
    },
    {
      id: 'cron-7',
      fase: 'Ata de Instalação e Posse',
      descricao: 'Cerimônia formal de posse da nova gestão da CIPA, registro do Presidente e Vice-Presidente.',
      diasLimite: 1,
      prazoRelativo: 'Primeiro dia útil após término do mandato',
      dataCalculada: addDays(dataFim, 1),
      status: 'pendente',
      documentoTipo: 'ata_posse'
    }
  ];
}
