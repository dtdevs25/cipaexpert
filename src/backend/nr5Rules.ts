export interface DimensionamentoInput {
  grauDeRisco: number;
  headcount: number;
}

export interface DimensionamentoOutput {
  precisaCipa: boolean;
  efetivosEmpregador: number;
  suplentesEmpregador: number;
  efetivosEmpregados: number;
  suplentesEmpregados: number;
  totalMembros: number;
  horasTreinamento: number;
  observacaoNormativa: string;
}

/**
 * Motor de Cálculo Normativo Oficial da CIPA conforme Quadro I da NR-5
 * Portaria MTP nº 422/2021 e atualizações da Lei 14.457/2022
 */
export function calcularDimensionamentoNR5Backend(
  grauDeRisco: number,
  headcount: number
): DimensionamentoOutput {
  // Carga horária de treinamento obrigatório conforme Grau de Risco (Item 5.7.4 da NR-5):
  // Grau de Risco 1: 8 horas
  // Grau de Risco 2: 12 horas
  // Grau de Risco 3: 16 horas
  // Grau de Risco 4: 20 horas
  const horasTreinamento =
    grauDeRisco === 1 ? 8 : grauDeRisco === 2 ? 12 : grauDeRisco === 3 ? 16 : 20;

  // Regra da NR-5 para estabelecimentos com até 19 colaboradores (ou faixa sem exigência do Quadro I):
  // Não constitui CIPA paritária; a organização deve nomear 1 Designado de CIPA
  if (headcount < 20) {
    return {
      precisaCipa: false,
      efetivosEmpregador: 0,
      suplentesEmpregador: 0,
      efetivosEmpregados: 0,
      suplentesEmpregados: 0,
      totalMembros: 1, // 1 Designado
      horasTreinamento,
      observacaoNormativa: `Estabelecimento com ${headcount} colaboradores (até 19): dispensado de constituição paritária de CIPA conforme item 5.6.4 da NR-5. A organização deve designar 1 (um) colaborador formal com treinamento obrigatório de ${horasTreinamento} horas com módulo de combate ao assédio (Lei 14.457/22).`
    };
  }

  let efetivosPorParte = 1;
  let suplentesPorParte = 1;

  if (grauDeRisco === 1) {
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
  } else if (grauDeRisco === 2) {
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
  } else if (grauDeRisco === 3) {
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
    precisaCipa: true,
    efetivosEmpregador: efetivosPorParte,
    suplentesEmpregador: suplentesPorParte,
    efetivosEmpregados: efetivosPorParte,
    suplentesEmpregados: suplentesPorParte,
    totalMembros: total,
    horasTreinamento,
    observacaoNormativa: `Constituição Obrigatória da CIPA (NR-5 - Grau de Risco ${grauDeRisco}): Comissão de ${total} cipeiros paritários (${efetivosPorParte} titulares e ${suplentesPorParte} suplentes eleitos pelos trabalhadores em votação secreta; igual número indicado pela organização). Treinamento obrigatório de ${horasTreinamento} horas com inclusão de prevenção e combate ao assédio sexual e outras formas de violência no trabalho (Lei 14.457/2022).`
  };
}

/**
 * Calcula os prazos regimentais e marcos temporais do processo eleitoral da CIPA
 * Conforme item 5.5 e subitens da NR-5
 */
export function calcularPrazosCronogramaNR5(dataTerminoMandato: Date) {
  const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  return {
    dataEditalConvocacao: addDays(dataTerminoMandato, -60), // Item 5.5.1: Mínimo 60 dias antes
    dataConstituicaoCE: addDays(dataTerminoMandato, -55),   // Item 5.5.2: 55 dias antes
    dataInicioInscricoes: addDays(dataTerminoMandato, -45), // Mínimo 15 dias de período de inscrição
    dataFimInscricoes: addDays(dataTerminoMandato, -30),
    dataInicioVotacao: addDays(dataTerminoMandato, -30),    // Item 5.5.3: Eleição no mínimo 30 dias antes do término
    dataFimVotacao: addDays(dataTerminoMandato, -28),
    dataTreinamento: addDays(dataTerminoMandato, -10),      // Item 5.7.1: Treinamento antes da posse
    dataPosse: addDays(dataTerminoMandato, 1)               // Item 5.5.5: Primeiro dia útil após o mandato anterior
  };
}
