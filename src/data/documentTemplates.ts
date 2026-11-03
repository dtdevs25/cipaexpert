import { generate12MeetingsSchedule, ScheduledMeeting } from '../utils/businessDays';

export interface GeneratedDocument {
  title: string;
  category: string;
  normativeCode: string;
  companyName: string;
  cnpj: string;
  dateGenerated: string;
  content: string[];
  signatories: string[];
  logoUrl?: string;
  unitName?: string;
  unitAddress?: string;
  unitCity?: string;
  unitState?: string;
  unitCep?: string;
  gestaoAno?: string;
  eleicaoLink?: string;
  electionToken?: string;
  qrCodeDataUrl?: string;
}

export interface CipaTrainingWorkload {
  totalHoras: number;
  horasEad: number;
  horasPresencial: number;
  modalidade: string;
  baseLegal: string;
  observacao: string;
}

/**
 * Retorna a carga horária normativa obrigatória do treinamento da CIPA
 * com base no Grau de Risco (NR-05, subitem 5.7.4 e alíneas).
 * - Grau 1: 8 horas (pode ser 100% EAD)
 * - Grau 2: 12 horas (mínimo 4h presenciais)
 * - Grau 3: 16 horas (mínimo 8h presenciais)
 * - Grau 4: 20 horas (mínimo 8h presenciais)
 */
export function getCipaTrainingHours(grauDeRisco: number): CipaTrainingWorkload {
  const gr = Number(grauDeRisco) || 3;
  switch (gr) {
    case 1:
      return {
        totalHoras: 8,
        horasEad: 8,
        horasPresencial: 0,
        modalidade: 'Ensino a Distância (EAD) ou Presencial',
        baseLegal: 'NR-05, subitem 5.7.4, alínea "a"',
        observacao: 'Grau de Risco 1: Carga horária mínima de 8 horas, podendo ser realizada integralmente na modalidade EAD.'
      };
    case 2:
      return {
        totalHoras: 12,
        horasEad: 8,
        horasPresencial: 4,
        modalidade: 'Semipresencial (8h EAD + 4h Presencial)',
        baseLegal: 'NR-05, subitem 5.7.4, alínea "b" e 5.7.4.2',
        observacao: 'Grau de Risco 2: Carga horária mínima de 12 horas, sendo no mínimo 4 horas presenciais.'
      };
    case 3:
      return {
        totalHoras: 16,
        horasEad: 8,
        horasPresencial: 8,
        modalidade: 'Semipresencial (8h EAD + 8h Presencial)',
        baseLegal: 'NR-05, subitem 5.7.4, alínea "c" e 5.7.4.2',
        observacao: 'Grau de Risco 3: Carga horária mínima de 16 horas, sendo no mínimo 8 horas presenciais.'
      };
    case 4:
    default:
      return {
        totalHoras: 20,
        horasEad: 12,
        horasPresencial: 8,
        modalidade: 'Semipresencial (12h EAD + 8h Presencial)',
        baseLegal: 'NR-05, subitem 5.7.4, alínea "d" e 5.7.4.2',
        observacao: 'Grau de Risco 4: Carga horária mínima de 20 horas, sendo no mínimo 8 horas presenciais.'
      };
  }
}

export function generateCipaDocument(
  tipo: string,
  companyName: string = 'Indústrias Alfa Brasil S.A.',
  cnpj: string = '12.345.678/0001-90',
  dataBase: string = '2026-10-15',
  membrosCount: number = 8,
  extraData?: {
    logoUrl?: string;
    sindicatoSigla?: string;
    sindicatoNome?: string;
    sindicatoEmail?: string;
    unitName?: string;
    unitState?: string;
    unitCity?: string;
    unitAddress?: string;
    unitCep?: string;
    unitCnpj?: string;
    gestaoAno?: string;
    emailContato?: string;
    telefoneContato?: string;
    comissaoPresidente?: string;
    comissaoPresidenteRe?: string;
    comissaoPresidenteEmail?: string;
    comissaoVice?: string;
    comissaoViceRe?: string;
    comissaoViceEmail?: string;
    electionToken?: string;
    eleicaoLink?: string;
    qrCodeDataUrl?: string;
    candidatoNome?: string;
    candidatoCargo?: string;
    candidatoMatricula?: string;
    candidatoSetor?: string;
    candidatoEmail?: string;
    candidatoPropostas?: string;
    geradoPor?: string;
    aprovadoPor?: string;
    votantesHabilitados?: number;
    quorumMinimo?: number;
    candidatosAprovados?: Array<{
      id: string;
      nome: string;
      email?: string;
      cargo: string;
      dataAdmissao?: string;
      apelido?: string;
      matricula?: string;
      fotoUrl?: string;
    }>;
    candidatosReprovados?: Array<{
      id: string;
      nome: string;
      email?: string;
      cargo: string;
      dataAdmissao?: string;
      motivo?: string;
    }>;
    cronogramaDatas?: {
      convocacao?: string;
      comunicadoSindicato?: string;
      comissaoEleitoral?: string;
      editalInscricao?: string;
      periodoInscricoes?: string;
      inscricaoInicio?: string;
      inscricaoFim?: string;
      listaCandidatos?: string;
      eleicao?: string;
      eleicaoProrrogada?: string;
      apuracao?: string;
      treinamento?: string;
      treinamentoPresencial?: string;
      posse?: string;
      envioSindicato?: string;
    };
    apuracao?: {
      isOnline?: boolean;
      totalEleitoresAptos?: number;
      totalVotantes?: number;
      votosBrancos?: number;
      votosNulos?: number;
      votosValidos?: number;
      quorumMinimo?: number;
      quorumAtingido?: boolean;
      percentualQuorum?: number;
      lacreUrna?: string;
      localUrna?: string;
      horarioAbertura?: string;
      horarioEncerramento?: string;
      presidenteMesa?: string;
      secretarioMesa?: string;
      fiscaisPresentes?: string;
      candidatosResultados?: Array<{
        id?: string;
        matricula?: string;
        nome: string;
        cargo: string;
        email?: string;
        votos: number;
        percentual?: number;
        classificacao?: number;
        situacao?: string;
        dataAdmissao?: string;
      }>;
      titulares?: string[];
      suplentes?: string[];
    };
    grauDeRisco?: number;
    cnaeCode?: string;
    cnaeDesc?: string;
    horasTreinamentoTotal?: number;
    horasTreinamentoEad?: number;
    horasTreinamentoPresencial?: number;
    colaboradorTreinadoNome?: string;
    colaboradorTreinadoMatricula?: string;
    colaboradorTreinadoCargo?: string;
    periodoTreinamento?: string;
    dataConclusaoTreinamento?: string;
    diaUtilEscolhido?: number | string;
    horarioPadrao?: string;
    localPadrao?: string;
    reunioesAgendadas?: ScheduledMeeting[];
    presidenteCipaNome?: string;
    vicePresidenteCipaNome?: string;
    secretarioCipaNome?: string;
    votantesList?: Array<{
      id?: string | number;
      nome: string;
      matricula?: string;
      cnpj?: string;
      entidade?: string;
      email?: string;
      telefone?: string;
      ip?: string;
      dataHora?: string;
      tipoAcesso?: string;
      votou?: boolean;
      primeiroAcesso?: string;
      ultimoAcesso?: string;
    }>;
    hashZeramento?: string;
    periodoEleicao?: string;
    prorrogacao1Periodo?: string;
    prorrogacao1Quorum?: string;
    prorrogacao2Periodo?: string;
    prorrogacao2Quorum?: string;
  }
): GeneratedDocument {
  const formattedDate = new Date(dataBase).toLocaleDateString('pt-BR');
  const c = extraData?.cronogramaDatas;

  const buildDoc = (): GeneratedDocument => {
    switch (tipo) {
      case 'comunicado_sindicato': {
        const unitName = extraData?.unitName || 'Unidade Marquês';
        const unitCity = extraData?.unitCity || 'São Paulo';
        const unitState = extraData?.unitState || 'SP';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const unitAddress = extraData?.unitAddress || 'Avenida Marquês de São Vicente, 288, São Paulo - SP';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0773-86';
        const emailContato = extraData?.emailContato || 'cesar.bueno@telefonica.com';
        const telefoneContato = extraData?.telefoneContato || '(11) 91763-9084';
        const sindicatoSigla = extraData?.sindicatoSigla || 'SINTTEL';
        const sindicatoNome = extraData?.sindicatoNome || 'Sindicato dos Trabalhadores em Empresas de Telecomunicações do Estado de São Paulo';

        const periodoInscricoes = c?.periodoInscricoes || (c?.inscricaoInicio && c?.inscricaoFim ? `${c.inscricaoInicio} a ${c.inscricaoFim}` : '22/10/2026 a 05/11/2026');
        const dataConvocacao = c?.convocacao || formattedDate || '20/10/2026';
        const dataComissao = c?.comissaoEleitoral || '20/10/2026';
        const dataEditalInscricao = c?.editalInscricao || '19/10/2026';
        const dataListaInscritos = c?.listaCandidatos || '09/11/2026';
        const dataEleicao = c?.eleicao || '16/11/2026';
        const dataApuracao = c?.apuracao || '23/11/2026';
        const dataTreinamento = c?.treinamento || '26/11/2026 a 30/11/2026';
        const dataTreinamentoPresencial = c?.treinamentoPresencial || '08/12/2026';
        const dataPosse = c?.posse || '21/12/2026';

        const dateObj = new Date(dataBase);
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mesExtenso = isNaN(dateObj.getTime()) ? 'Outubro' : months[dateObj.getMonth()];
        const anoNum = isNaN(dateObj.getTime()) ? '2026' : dateObj.getFullYear();
        const localEData = `${unitCity}, ${mesExtenso}/${anoNum}.`;

        return {
          title: 'Comunicação de Renovação de CIPA ao Sindicato',
          category: 'Comunicação Sindical',
          normativeCode: 'NR-5 · Subitem 5.5.1.1',
          companyName: companyName || 'Telefônica Brasil S.A',
          cnpj: unitCnpj,
          dateGenerated: dataConvocacao,
          content: [
            localEData,
            `Ao ${sindicatoSigla}`,
            `${sindicatoNome}.`,
            `Assunto: Comunicação de Renovação de CIPA`,
            `Em conformidade com a NR-5, subitem 5.5.1.1, comunicamos o início do Processo Eleitoral para membros da CIPA (Gestão ${gestaoAno}) da ${unitName} inscrita no CNPJ ${unitCnpj} localizada na ${unitAddress}.`,
            `A eleição será realizada no dia ${dataEleicao}, de forma eletrônica.`,
            `Este processo será acompanhado pelo signatário e quaisquer dúvidas poderão ser esclarecidas através dos contatos ${emailContato} Telefone: ${telefoneContato}.`,
            `Abaixo cronograma:`,
            `EDITAL DE CONVOCAÇÃO: ${dataConvocacao}`,
            `Formação comissão eleitoral: ${dataComissao}`,
            `Divulgação do edital de inscrição: ${dataEditalInscricao}`,
            `Período de inscrições: ${periodoInscricoes}`,
            `Publicação inscritos: ${dataListaInscritos}`,
            `Eleição: ${dataEleicao}`,
            `Apuração dos votos: ${dataApuracao}`,
            `Treinamento dos membros da CIPA (${extraData?.horasTreinamentoTotal || getCipaTrainingHours(extraData?.grauDeRisco || 3).totalHoras}h): ${dataTreinamento}`,
            `Posse: ${dataPosse}`
          ],
          signatories: [
            `${companyName || 'Telefônica Brasil S.A'} - Representante Legal da Empresa`
          ]
        };
      }

      case 'edital_convocacao': {
        const unitName = extraData?.unitName || 'Unidade Piracicaba';
        const unitState = extraData?.unitState || 'São Paulo';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const unitAddress = extraData?.unitAddress || 'Rua São João, nº 1913, Piracicaba – SP';
        const unitCep = extraData?.unitCep || '13432-009';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0593-02';
        const emailContato = extraData?.emailContato || 'cipa.br@telefonica.com ou pedro.lobeiro.ext@telefonica.com';
        const telefoneContato = extraData?.telefoneContato || '19 99784-1065';
        const periodoInscricoes = c?.periodoInscricoes || (c?.inscricaoInicio && c?.inscricaoFim ? `${c.inscricaoInicio} a ${c.inscricaoFim}` : '26/10/2026 a 09/11/2026');
        const dataConvocacao = c?.convocacao || formattedDate || '19/10/2026';
        const dataComissao = c?.comissaoEleitoral || '19/10/2026';
        const dataEditalInscricao = c?.editalInscricao || '20/10/2026';
        const dataListaInscritos = c?.listaCandidatos || '10/11/2026';
        const dataEleicao = c?.eleicao || '16/11/2026';
        const dataEleicaoProrrogada = c?.eleicaoProrrogada || '19/11/2026';
        const dataApuracao = c?.apuracao || '19/11/2026';
        const dataTreinamento = c?.treinamento || '30/11/2026 a 04/12/2026';
        const dataTreinamentoPresencial = c?.treinamentoPresencial || '15/12/2026';
        const dataPosse = c?.posse || '22/12/2026';

        return {
          title: `Edital de Convocação da CIPA - ${unitName}`,
          category: 'Processo Eleitoral',
          normativeCode: 'NR-05 · Portaria MTP nº 4.219/2022 · Lei 14.457/2022',
          companyName,
          cnpj: unitCnpj,
          dateGenerated: dataConvocacao,
          content: [
            `Começou a renovação da CIPA da ${unitName} e os colaboradores interessados poderão se candidatar ao processo eleitoral, formalizando seu interesse conforme as seguintes orientações:`,
            `• A renovação da CIPA segue as determinações da Norma NR-05 e Lei 14.457/2022;`,
            `• A eleição ocorrerá de forma virtual;`,
            `• Os colaboradores inscritos terão estabilidade empregatícia a partir da data de inscrição até o dia da eleição;`,
            `• Os colaboradores eleitos terão estabilidade empregatícia de 02 (dois) anos a partir da posse da referida CIPA;`,
            `• Os colaboradores devem estar com a lotação correta junto ao sistema SAP / RH;`,
            `• Colaboradores que não estiverem lotados na ${unitName} – Endereço: ${unitAddress}, CNPJ: ${unitCnpj}, de acordo com o PO atual, não poderão participar do processo;`,
            `• O treinamento para novos membros acontecerá conforme cronograma.`,
            `Confira o cronograma a seguir:`,
            `EDITAL DE CONVOCAÇÃO: ${dataConvocacao}`,
            `Formação comissão eleitoral: ${dataComissao}`,
            `Divulgação do edital de inscrição: ${dataEditalInscricao}`,
            `Período de inscrições: ${periodoInscricoes}`,
            `Publicação inscritos: ${dataListaInscritos}`,
            `Eleição: ${dataEleicao} *`,
            `Apuração dos votos: ${dataApuracao}`,
            `Treinamento dos membros da CIPA (${extraData?.horasTreinamentoTotal || getCipaTrainingHours(extraData?.grauDeRisco || 3).totalHoras}h): ${dataTreinamento}`,
            `Posse: ${dataPosse}`,
            `* A data da eleição poderá ser prorrogada até o dia ${dataEleicaoProrrogada} caso não seja atingido o número de votantes válidos necessários, conforme o disposto no item 5.5 da NR 5: 1º dia: 50% dos empregados; 2º dia: 1/3 dos empregados; 3º dia: Qualquer valor da população do prédio.`,
            `Obs.: Processo não elegível para colaboradores em regime 100% Remoto.`,
            `Em caso de dúvidas, entre em contato com ${emailContato} | Telefone: ${telefoneContato}`,
            `${unitName} · Endereço: ${unitAddress} · CEP: ${unitCep} · CNPJ: ${unitCnpj}`
          ],
          signatories: [
            'Presidente da Comissão Eleitoral - Condução do Processo Eleitoral',
            'Representante Legal da Empresa - Diretoria Executiva / Empregador'
          ]
        };
      }

      case 'comissao_eleitoral': {
        const unitName = extraData?.unitName || 'Unidade SP Jundiaí Vila';
        const unitCity = extraData?.unitCity || 'Jundiaí';
        const unitState = extraData?.unitState || 'SP';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const unitAddress = extraData?.unitAddress || 'Avenida Fernando Arens, 470, Vila Arens II';
        const unitCep = extraData?.unitCep || '13.202-570';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0577-84';
        const presidenteNome = extraData?.comissaoPresidente || 'Luiz Alberto De Barros Junior';
        const presidenteRe = extraData?.comissaoPresidenteRe || '161905';
        const viceNome = extraData?.comissaoVice || 'Marciel Pereira Silva';
        const viceRe = extraData?.comissaoViceRe || '3519920';
        const dataReuniao = c?.comissaoEleitoral || formattedDate || '14/09/2026';

        const compNome = companyName || 'Telefônica Brasil S/A';

        // Parsing data para dia, mês por extenso e ano: "Aos 14 dias do mês de setembro de 2026"
        let diaExtenso = '14';
        let mesExtenso = 'setembro';
        let anoExtenso = '2026';
        try {
          const parts = dataReuniao.includes('/') ? dataReuniao.split('/') : null;
          if (parts && parts.length === 3) {
            diaExtenso = parts[0];
            const mIdx = parseInt(parts[1], 10) - 1;
            const monthsLower = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            mesExtenso = monthsLower[mIdx] || 'setembro';
            anoExtenso = parts[2];
          }
        } catch { }

        return {
          title: 'ATA DE FORMAÇÃO DA COMISSÃO ELEITORAL',
          category: 'Comissão Eleitoral',
          normativeCode: 'NR-5 · Subitem 5.5.2',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataReuniao,
          content: [
            `Aos ${diaExtenso} dias do mês de ${mesExtenso} de ${anoExtenso}, de forma virtual via TEAMS (ferramenta de comunicação digital) da empresa ${compNome} ${unitName}, CNPJ ${unitCnpj}, situada à ${unitAddress}, CEP ${unitCep}, ${unitCity} - ${unitState} - Gestão ${gestaoAno} - iniciou-se às 14:00 a reunião para formação da Comissão Eleitoral e definição das regras do processo.`,
            `Foram definidos os seguintes membros para formarem esta comissão:`,
            `• Presidente – ${presidenteNome} RE ${presidenteRe}`,
            `• Vice presidente – ${viceNome} RE ${viceRe}`,
            `Na ocasião ficaram também definidas as seguintes regras para os candidatos, as quais serão entregues por ocasião da inscrição.`,
            `O que você pode fazer:`,
            `• Apresentar seu plano de trabalho aos colegas, sempre com foco na prevenção de acidentes e doenças no trabalho.`,
            `• Circular pelas áreas da empresa para divulgar sua candidatura, com bom senso e respeito ao ambiente de trabalho.`,
            `• Usar o WhatsApp para divulgar sua candidatura e propostas, desde que respeite todas as demais regras.`,
            `O que não pode:`,
            `• Usar canais da empresa (como e-mail corporativo, Teams, Workplace ou murais) para pedir votos ou divulgar sua candidatura.`,
            `• Oferecer brindes ou favores em troca de votos — nada de canetas, canecas, churrascos, festas, etc.`,
            `• Fazer "boca de urna" ou forçar alguém a votar na sua frente.`,
            `• Usar sua posição na empresa para pressionar ou ameaçar colegas.`,
            `• Pedir prova de voto, como fotos ou prints de tela.`,
            `• Interromper o trabalho (seu ou de colegas) para fazer campanha.`,
            `Sem mais assuntos a serem tratados, a reunião deu-se por encerrada às 14:20. Lavrou-se por mim, Presidente da Comissão CIPA, ${presidenteNome}, esta Ata da Comissão Eleitoral.`,
            `Anexos: Print – Reunião de Comissão Eleitoral`,
            `***Este documento está classificado como USO INTERNO por ${compNome.toUpperCase()}.`
          ],
          signatories: [
            `${presidenteNome} - Presidente da Comissão Eleitoral`,
            `${viceNome} - Vice-Presidente da CIPA`
          ]
        };
      }

      case 'edital_inscricao': {
        const unitName = extraData?.unitName || 'Unidade Jundiaí';
        const unitState = extraData?.unitState || 'SP';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const unitAddress = extraData?.unitAddress || 'Avenida Fernando Arens, nº 470, Jundiaí - SP';
        const unitCep = extraData?.unitCep || '13.202-570';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0577-84';
        const compNome = companyName || 'Telefônica Brasil S/A';
        const emailContato = extraData?.emailContato || 'cipa.br@telefonica.com ou pedro.lobeiro.ext@telefonica.com';
        const telefoneContato = extraData?.telefoneContato || '19 99784-1065';
        const presidenteNome = extraData?.comissaoPresidente || 'Luiz Alberto De Barros Junior';
        const presidenteEmail = extraData?.comissaoPresidenteEmail || 'luiza.junior@telefonica.com';
        const viceNome = extraData?.comissaoVice || 'Marciel Pereira Silva';
        const viceEmail = extraData?.comissaoViceEmail || 'Marciel.Silva@telefonica.com';

        // Cronograma
        const c = extraData?.cronogramaDatas;
        const periodoInscricoes = c?.periodoInscricoes || (c?.inscricaoInicio && c?.inscricaoFim ? `${c.inscricaoInicio} a ${c.inscricaoFim}` : '21/09/2026 a 05/10/2026');
        const dataEleicao = c?.eleicao || '12/10/2026';
        const dataEleicaoProrrogada = c?.eleicaoProrrogada || '15/10/2026';
        const dataTreinamentoOnline = c?.treinamento || '26/10/2026 a 30/10/2026';
        const dataTreinamentoPresencial = c?.treinamentoPresencial || '11/10/2026';

        // Link e QR Code únicos e exclusivos gerados diretamente pela plataforma CIPA Expert
        const appOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://cipaexpert.com.br';
        const cleanComp = (compNome || 'empresa').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanUnit = (unitName || 'unidade').toLowerCase().replace(/[^a-z0-9]/g, '');
        const defaultToken = `cipa-${cleanComp}-${cleanUnit}-${gestaoAno.replace(/[^0-9]/g, '')}`;
        const electionToken = extraData?.electionToken || defaultToken;
        const linkInscricao = extraData?.eleicaoLink || `${appOrigin}/eleicao/${cleanComp}/${cleanUnit}/inscricao?token=${electionToken}`;

        return {
          title: `Edital de Inscrições da CIPA ${gestaoAno}`,
          category: 'Inscrições e Eleição',
          normativeCode: 'NR-5 · Subitem 5.5.2.1',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: c?.editalInscricao || formattedDate || '21/09/2026',
          content: [
            `A renovação da CIPA da ${unitName} foi iniciada, assim, os colaboradores interessados em candidatar-se ao processo eleitoral, devem formalizar seu interesse através do link ou QR Code abaixo:`,
            `${linkInscricao}`,
            `Ou`,
            `Scan me`,
            `🔒 ATENÇÃO - SEGURANÇA E VALIDADE CRONOLÓGICA: O link e o QR Code acima são gerados de forma única e exclusiva para a eleição desta unidade. O acesso é sincronizado eletronicamente com o cronograma oficial e permanecerá bloqueado fora dos prazos, sendo liberado exclusivamente nos dias e horários estipulados para inscrição e votação.`,
            `Período de Inscrição: ${periodoInscricoes} até às 17:00 – Impreterivelmente`,
            `Data da Eleição: ${dataEleicao}*`,
            `Sistema de Votação: On-line`,
            `Período do Treinamento on-line: ${dataTreinamentoOnline}`,
            `Período do Treinamento presencial: ${dataTreinamentoPresencial}`,
            `*A data da eleição poderá ser prorrogada até o dia ${dataEleicaoProrrogada} caso não seja atingindo o número de votantes válidos necessários, conforme o disposto no item 5.5 da NR 5:`,
            `• 1º dia: 50% dos empregados;`,
            `• 2º dia: 1/3 dos empregados;`,
            `• 3º dia: Qualquer valor da população do prédio.`,
            `Participam do processo de inscrição e votação somente os colaboradores que se encontram lotados no CNPJ do referido prédio.`,
            `Você sabia o que cabe ao Cipeiro?`,
            `• Realizar treinamento(*) de 20 horas antes do início do mandato;`,
            `• Participar das reuniões mensais, registrar e controlar as atas;`,
            `• Identificar riscos inerentes ao trabalho;`,
            `• Elaborar plano de trabalho e mapa de riscos que possibilitem ações preventivas voltadas à saúde e segurança;`,
            `• Controlar e participar das definições de prevenção e avaliação das prioridades de ações de melhoria nos locais de trabalho;`,
            `• A cada reunião, avaliar o cumprimento das metas fixadas no plano de trabalho e discutir ações para mitigação de riscos;`,
            `• Entre outras atribuições inerentes a Cipeiro.`,
            `Obs.: Processo não elegível para colaboradores em regime 100% Remoto.`,
            `Em caso de dúvidas, entre em contato com ${emailContato}`,
            `Telefone ${telefoneContato}`,
            `COMISSÃO ELEITORAL:`,
            `Presidente: ${presidenteNome} – ${presidenteEmail}`,
            `Vice-presidente: ${viceNome} – ${viceEmail}`,
            `${unitName}`,
            `Endereço: ${unitAddress}`,
            `CEP: ${unitCep}`,
            `CNPJ: ${unitCnpj}`
          ],
          signatories: [
            `${presidenteNome} - Presidente da Comissão Eleitoral`,
            `${viceNome} - Vice-Presidente da CIPA`
          ]
        };
      }

      case 'ata_eleicao': {
        const unitName = extraData?.unitName || 'Unidade SP JUNDIAÍ VILA';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'Telefônica Brasil S/A';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0577-84';
        const dataApuracao = extraData?.cronogramaDatas?.apuracao || formattedDate || '23/11/2026';

        const ap = extraData?.apuracao;
        const isOnline = ap?.isOnline ?? true;
        const totalAptos = ap?.totalEleitoresAptos || extraData?.votantesHabilitados || 88;
        const totalVotantes = ap?.totalVotantes || 75;
        const quorumMinimo = ap?.quorumMinimo || Math.floor(totalAptos / 2) + 1;
        const quorumAtingido = ap?.quorumAtingido ?? (totalVotantes >= quorumMinimo);
        const percentualQuorum = ap?.percentualQuorum || Math.round((totalVotantes / totalAptos) * 100);
        const votosBrancos = ap?.votosBrancos ?? 2;
        const votosNulos = ap?.votosNulos ?? 1;
        const votosValidos = ap?.votosValidos ?? (totalVotantes - votosBrancos - votosNulos);
        const lacre = ap?.lacreUrna || 'LACRE-URNA-74829';
        const localUrna = ap?.localUrna || 'Sala de Treinamento / Refeitório da Unidade';
        const horarioEncerramento = ap?.horarioEncerramento || '17:00';
        const presidenteMesa = ap?.presidenteMesa || extraData?.comissaoPresidente || 'Luiz Alberto De Barros Junior';
        const secretarioMesa = ap?.secretarioMesa || extraData?.comissaoVice || 'Marciel Pereira Silva';

        // Candidatos e votos apurados
        const resultados = ap?.candidatosResultados || [
          { classificacao: 1, matricula: '179645', nome: 'GUSTAVO FERREIRA DA CONCEICAO', cargo: 'TECNICO SERVICO AO CLIENTE', votos: 24, percentual: 33.3, situacao: '1º Titular Eleito' },
          { classificacao: 2, matricula: '154266', nome: 'JULIA ROCHA DOS SANTOS', cargo: 'ASSISTENTE TECNICO', votos: 18, percentual: 25.0, situacao: '2º Titular Eleito' },
          { classificacao: 3, matricula: '180550', nome: 'LUANNA SANTANA BEZERRA', cargo: 'ASSISTENTE TECNICO', votos: 12, percentual: 16.7, situacao: '1º Suplente Eleito' },
          { classificacao: 4, matricula: '3518036', nome: 'MANOEL FRANCISCO DOS SANTOS', cargo: 'TECNICO SERVICO AO CLIENTE', votos: 8, percentual: 11.1, situacao: '2º Suplente Eleito' },
          { classificacao: 5, matricula: '3538328', nome: 'MARCELO AUGUSTO ARCIFA SAMPAIO', cargo: 'TECNICO SERVICO AO CLIENTE', votos: 5, percentual: 6.9, situacao: 'Não Eleito' },
          { classificacao: 6, matricula: '179595', nome: 'MARCELO AUGUSTO FERREIRA', cargo: 'TECNICO SERVICO AO CLIENTE', votos: 3, percentual: 4.2, situacao: 'Não Eleito' },
          { classificacao: 7, matricula: '3540169', nome: 'VANDERSON DE JESUS OLIVEIRA', cargo: 'TECNICO SERVICO AO CLIENTE', votos: 2, percentual: 2.8, situacao: 'Não Eleito' }
        ];

        const titularesList = resultados.filter(r => r.situacao?.includes('Titular')).map(r => `• ${r.classificacao}º Lugar: ${r.nome} (RE: ${r.matricula || '-'}, Cargo: ${r.cargo}) – ${r.votos} votos válidos`);
        const suplentesList = resultados.filter(r => r.situacao?.includes('Suplente')).map(r => `• ${r.classificacao}º Lugar: ${r.nome} (RE: ${r.matricula || '-'}, Cargo: ${r.cargo}) – ${r.votos} votos válidos`);

        return {
          title: `ATA DE ELEIÇÃO E APURAÇÃO DOS VOTOS DA CIPA - ${unitName}`,
          category: 'Ata Eleitoral e Homologação de Resultado',
          normativeCode: 'NR-05 · Subitens 5.5.3, 5.5.4 a 5.5.9',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataApuracao,
          content: [
            `ATA DE ELEIÇÃO E APURAÇÃO DOS VOTOS DOS REPRESENTANTES DOS EMPREGADOS NA CIPA`,
            `${unitName} · Gestão ${gestaoAno}`,
            `Aos ${dataApuracao}, às ${horarioEncerramento} horas, nas dependências da empresa ${compNome}, estabelecimento ${unitName}, inscrita no CNPJ sob o nº ${unitCnpj}, reuniu-se a Comissão Eleitoral juntamente com a Mesa Apuradora para realizar a apuração dos votos da eleição para membros representantes dos empregados na Comissão Interna de Prevenção de Acidentes e Assédio (CIPA) - Gestão ${gestaoAno}.`,
            isOnline
              ? `MODALIDADE DE VOTAÇÃO: Votação Eletrônica Online via Urna Digital CIPA Expert com registro individualizado, sigilo criptográfico inviolável e auditoria em tempo real.`
              : `MODALIDADE DE VOTAÇÃO: Votação Presencial via Urna Física Convencional, instalada em ${localUrna}, com verificação formal e rompimento do Lacre de Segurança nº ${lacre} na presença dos mesários e fiscais de pleito.`,
            `MESA APURADORA E FISCAIS:`,
            `• Presidente da Mesa Apuradora: ${presidenteMesa}`,
            `• Secretário / Mesário: ${secretarioMesa}`,
            `• Fiscais do Pleito: Representantes dos empregados e da empresa`,
            `VERIFICAÇÃO DO QUÓRUM LEGAL (NR-5, SUBITEM 5.5.4):`,
            `• Total de Empregados Aptos a Votar na Unidade: ${totalAptos} colaboradores`,
            `• Quórum Mínimo Exigido para Validade em 1º Escrutínio (50% + 1): ${quorumMinimo} votantes`,
            `• Total de Empregados que Votaram: ${totalVotantes} participantes (${percentualQuorum}% de participação)`,
            quorumAtingido
              ? `• PARECER DO QUÓRUM: QUÓRUM LEGAL ATINGIDO COM SUCESSO EM 1º ESCRUTÍNIO, convalidando a apuração em conformidade com o subitem 5.5.4 da Norma Regulamentadora nº 05.`
              : `• PARECER DO QUÓRUM: Quórum legal não atingido no 1º dia. Conforme subitem 5.5.4.1 da NR-5, fica convocada a prorrogação para o 2º dia com quórum mínimo de 1/3.`,
            `MAPA GERAL DE APURAÇÃO DOS VOTOS:`,
            `• Total de Votos Válidos (Nominais aos Candidatos): ${votosValidos}`,
            `• Votos em Branco: ${votosBrancos}`,
            `• Votos Nulos: ${votosNulos}`,
            `• Total Geral de Votos Apurados na Urna: ${totalVotantes}`,
            `RESULTADO DA VOTAÇÃO POR CANDIDATO:`,
            `| Classificação | RE | Candidato | Cargo | Votos | % Válidos | Situação Oficial |`,
            `|---|---|---|---|---|---|---|`,
            ...resultados.map(r => `| ${r.classificacao}º | ${r.matricula || '-'} | ${r.nome} | ${r.cargo} | ${r.votos} | ${r.percentual !== undefined ? r.percentual.toFixed(1) + '%' : '-'} | ${r.situacao || '-'} |`),
            `PROCLAMAÇÃO DOS ELEITOS (REPRESENTANTES DOS EMPREGADOS):`,
            `MEMBROS TITULARES ELEITOS:`,
            ...(titularesList.length > 0 ? titularesList : ['Nenhum titular classificado']),
            `MEMBROS SUPLENTES ELEITOS:`,
            ...(suplentesList.length > 0 ? suplentesList : ['Nenhum suplente classificado']),
            `CRITÉRIO DE DESEMPATE NORMATIVO (NR-5):`,
            `Em cumprimento ao disposto na NR-5, em caso de empate na contagem de votos, assume preferência o candidato com maior tempo de serviço no estabelecimento.`,
            `GARANTIA DE ESTABILIDADE PROVISÓRIA NO EMPREGO:`,
            `Conforme preceitua o artigo 10, inciso II, alínea "a" do Ato das Disposições Constitucionais Transitórias (ADCT) da Constituição Federal e subitem 5.4.12 da NR-5, é vedada a dispensa arbitrária ou sem justa causa dos empregados eleitos para cargo de direção de CIPA, desde o registro de sua candidatura até um ano após o final do mandato.`,
            `Nada mais havendo a constar, encerrou-se a apuração e lavrou-se a presente ata, que lida e achada conforme, vai assinada pelos membros da mesa apuradora e pelos eleitos.`
          ],
          signatories: [
            `${presidenteMesa} - Presidente da Mesa Apuradora`,
            `${secretarioMesa} - Secretário da Mesa Apuradora`,
            `${resultados[0]?.nome || 'Representante dos Empregados'} - Cipeiro Mais Votado`,
            `${compNome} - Representante Legal da Empresa`
          ]
        };
      }

      case 'ata_posse': {
        const c = extraData?.cronogramaDatas;
        const unitName = extraData?.unitName || 'Unidade Eco Berrini';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0001-62';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const dataPosseRaw = c?.posse || '17/07/2026';

        // Converte a data da posse para data por extenso
        const parts = dataPosseRaw.split('/');
        const diaP = parts[0] ? parseInt(parts[0], 10) : 17;
        const mesIdx = parts[1] ? parseInt(parts[1], 10) - 1 : 6;
        const anoP = parts[2] || '2026';
        const mesesNomes = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const mesExtenso = mesesNomes[mesIdx] || 'julho';

        // Lista de presentes na sessão solene de posse
        const presentesLista = [
          'Abel Silva Fortes Cardoso',
          'Adson Filipe Junior',
          'Andressa Cristine Nunes De Carvalho',
          'Angela Margarida Ramos Dos Santos',
          'Ariane Lima De Souza',
          'Bruna Goncalves De Oliveira',
          'Carlos Silmar Scapim',
          'Charles Goncalves Dos Santos',
          'Cristiane Cruz De Souza',
          'Douglas De Jesus',
          'Fabio Lins Estanizio',
          'Felipe Leandro Ferreira Muniz',
          'Gilberto Carlos Dos Santos',
          'Iracema Duarte',
          'Josias Altimiro De Oliveira',
          'Josilene Alves Liontas',
          'Karina Karla De Moura',
          'Luciana Dos Santos',
          'Luis Carlos Gomes Da Silva',
          'Marcia Conessa Alvares',
          'Marcos Gomes Da Silva',
          'Mauricio Dos Santos',
          'Natalino Hofer Junior',
          'Nubia Cristina Lisboa De Souza',
          'Paolo Alves Da Hora',
          'Raimundo Paulo Borges Dos Santos',
          'Rosangela Aparecida Santos Marcelino',
          'Sidney Vida Barbalho Felipe De Souza',
          'Tamires Santos De Souza',
          'Tiago Antonio De Sousa',
          'Walmir Manoel Da Cruz'
        ].join(', ');

        const presidenteSessao = 'Tamires Santos de Souza';
        const presidenteCipa = 'Marcia Conessa Alvares';
        const vicePresidenteCipa = 'Luis Carlos Gomes Da Silva';
        const secretariosCipa = 'Sidney Vida Barbalho Felipe De Souza, Bruna Goncalves De Oliveira e Angela Margarida Ramos Dos Santos';

        // Candidatos Eleitos (Representantes dos Empregados)
        const empregadosTitulares = [
          '1 – Luis Carlos Gomes Da Silva – 262 Votos',
          '2 – Walmir Manoel Da Cruz – 148 Votos',
          '3 – Charles Goncalves Dos Santos – 113 Votos',
          '4 – Paolo Alves Da Hora – 99 Votos',
          '5 – Douglas De Jesus – 97 Votos',
          '6 – Abel Silva Fortes Cardoso – 93 Votos',
          '7 – Mauro Faustino – 91 Votos',
          '8 – Josias Altimiro De Oliveira – 86 Votos',
          '9 – Iracema Duarte – 81 Votos',
          '10 – Sidney Vida Barbalho Felipe De Souza – 80 Votos'
        ];

        const empregadosSuplentes = [
          '1 – Bruna Goncalves De Oliveira – 80 Votos',
          '2 – Andressa Cristine Nunes – 77 Votos',
          '3 – Gilberto Carlos Dos Santos – 71 Votos',
          '4 – Carlos Silmar Scapim – 69 Votos',
          '5 – Tiago Antonio De Sousa – 67 Votos',
          '6 – Andre Luiz Dos Santos – 64 Votos',
          '7 – Fabio Lins Estanizio – 57 Votos',
          '8 – Josilene Alves Liontas – 53 Votos'
        ];

        // Indicados pelo Empregador
        const empregadorTitulares = [
          '1 – Rosangela Aparecida Santos Marcelino',
          '2 – Cristiane Cruz Modesto De Souza',
          '3 – Angela Margarida Ramos Dos Santos',
          '4 – Ariane Lima De Souza',
          '5 – Alessandra Name Cheid Sacco',
          '6 – Marcia Conessa Alvares',
          '7 – Raimundo Paulo Borges Dos Santos',
          '8 – Marcos Gomes Da Silva',
          '9 – Felipe Leandro Ferreira Muniz',
          '10 – Maria Ligia Santos Castelhano'
        ];

        const empregadorSuplentes = [
          '1 – Karina Karla De Moura',
          '2 – Jucilene Evangelista Pereira Dos Anjos',
          '3 – Natalino Hofer Junior',
          '4 – Mauricio Dos Santos',
          '5 – Adson Filipe Junior',
          '6 – Luciana Dos Santos',
          '7 – Nubia Cristina Lisboa De Souza',
          '8 – Tamires Santos de Souza'
        ];

        return {
          title: 'ATA DE INSTALAÇÃO E POSSE DOS EMPREGADOS',
          category: 'Ata de Posse e Mandato NR-05',
          normativeCode: 'NR-5 · Subitem 5.5.5 e Portaria nº 33 de 27/10/1983',
          companyName,
          cnpj: unitCnpj,
          dateGenerated: dataPosseRaw,
          unitName,
          unitAddress: extraData?.unitAddress,
          unitCity: extraData?.unitCity,
          unitState: extraData?.unitState,
          logoUrl: extraData?.logoUrl,
          gestaoAno,
          content: [
            `ATA DE INSTALAÇÃO E POSSE DOS EMPREGADOS`,
            `CIPA ${unitName} - GESTÃO ${gestaoAno}`,
            `Aos ${diaP} dias do mês de ${mesExtenso} de ${anoP}, nas dependências da empresa ${companyName}, Unidade ${unitName}, CNPJ: ${unitCnpj}, com a presença dos(as) Srs(as), ${presentesLista}, deu-se a Instalação e Posse da CIPA desta empresa, conforme o estabelecido pela Portaria nº 33, de 27/10/1983 e Norma Regulamentadora NR-05. A Sra. ${presidenteSessao}, presidente desta sessão, declarou abertos os trabalhos, lembrando a todos os objetivos da reunião, quais sejam: Instalação e Posse dos componentes da CIPA. Continuando, declarou instalada a Comissão e empossados os membros da CIPA da ${unitName} - CNPJ: ${unitCnpj} Gestão ${gestaoAno}.`,
            `REPRESENTANTES DOS EMPREGADOS:`,
            `Titulares:`,
            ...empregadosTitulares,
            `Suplentes:`,
            ...empregadosSuplentes,
            `REPRESENTANTES DO EMPREGADOR:`,
            `Titulares:`,
            ...empregadorTitulares,
            `Suplentes:`,
            ...empregadorSuplentes,
            `Fica também definido nesta reunião de posse da CIPA para o direcionamento desta gestão:`,
            `1. Presidente da CIPA: ${presidenteCipa}`,
            `2. Vice-Presidente da CIPA escolhido entre os titulares eleitos por parte dos empregados: ${vicePresidenteCipa}`,
            `3. Secretários(as): ${secretariosCipa}.`,
            `Acordou-se ainda a realização do calendário anual de reuniões ordinárias, ficando estabelecido as seguintes datas:`,
            `Os membros da CIPA deverão participar da reunião ordinária mensal, que ocorrerá exclusivamente de forma presencial, conforme calendário de reuniões.`,
            `| Nº | QUANDO / MÊS | QUANDO / DATA | HORÁRIO | QUEM | ONDE |`,
            `| :---: | :---: | :---: | :---: | :--- | :--- |`,
            `| 1 | Julho | 17/07/2026 | 15h00 as 16h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 2 | Agosto | 11/08/2026 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 3 | Setembro | 08/09/2026 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 4 | Outubro | 13/10/2026 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 5 | Novembro | 10/11/2026 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 6 | Dezembro | 08/12/2026 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 7 | Janeiro | 12/01/2027 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 8 | Fevereiro | 16/02/2027 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 9 | Março | 09/03/2027 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 10 | Abril | 13/04/2027 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 11 | Maio | 11/05/2027 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `| 12 | Junho | 15/06/2027 | 10h00 as 11h00 | Titulares, suplentes, Membros designados de empresas e convidados. | ${unitName} |`,
            `Nada mais havendo para tratar, se dá por encerrada esta reunião de posse, lembrando a todos que o período da gestão da CIPA ora instalada será de 01 (um) ano a contar da presente data.`,
            `Para constar lavrou-se a presente ata, que lida e aprovada vai assinada por mim, Presidente da Comissão Eleitoral e por todos os representantes dos empregados (ELEITOS) e representantes do empregador (INDICADOS), titulares e suplentes.`,
            `COMISSÃO ELEITORAL:`,
            `| Presidente da Comissão Eleitoral | Vice-presidente da Comissão Eleitoral |`,
            `| :--- | :--- |`,
            `| ${presidenteCipa} | ${vicePresidenteCipa} |`,
            `REPRESENTANTES DOS EMPREGADOS:`,
            `| TITULARES | SUPLENTES |`,
            `| :--- | :--- |`,
            `| LUIS CARLOS GOMES DA SILVA | BRUNA GONCALVES DE OLIVEIRA |`,
            `| WALMIR MANOEL DA CRUZ | ANDRESSA CRISTINE NUNES |`,
            `| CHARLES GONCALVES DOS SANTOS | GILBERTO CARLOS DOS SANTOS |`,
            `| PAOLO ALVES DA HORA | CARLOS SILMAR SCAPIM |`,
            `| DOUGLAS DE JESUS | TIAGO ANTONIO DE SOUSA |`,
            `| ABEL SILVA FORTES CARDOSO (AUSENTE) | ANDRE LUIZ DOS SANTOS (AUSENTE) |`,
            `| MAURO FAUSTINO | FABIO LINS ESTANIZIO |`,
            `| JOSIAS ALTIMIRO DE OLIVEIRA | JOSILENE ALVES LIONTAS |`,
            `| IRACEMA DUARTE | - |`,
            `| SIDNEY VIDA BARBALHO FELIPE DE SOUZA | - |`,
            `REPRESENTANTES DO EMPREGADOR:`,
            `| TITULARES | SUPLENTES |`,
            `| :--- | :--- |`,
            `| ROSANGELA APARECIDA SANTOS MARCELINO | KARINA KARLA DE MOURA |`,
            `| CRISTIANE CRUZ MODESTO DE SOUZA (AUSENTE) | JUCILENE EVANGELISTA PEREIRA DOS ANJOS |`,
            `| ANGELA MARGARIDA RAMOS DOS SANTOS | NATALINO HOFER JUNIOR |`,
            `| ARIANE LIMA DE SOUZA (AUSENTE) | MAURICIO DOS SANTOS |`,
            `| ALESSANDRA NAME CHEID SACCO | ADSON FILIPE JUNIOR |`,
            `| MARCIA CONESSA ALVARES | LUCIANA DOS SANTOS |`,
            `| RAIMUNDO PAULO BORGES DOS SANTOS | NUBIA CRISTINA LISBOA DE SOUZA |`,
            `| MARCOS GOMES DA SILVA | TAMIRES SANTOS DE SOUZA |`,
            `| FELIPE LEANDRO FERREIRA MUNIZ (AUSENTE) | - |`,
            `| MARIA LIGIA SANTOS CASTELHANO | - |`
          ],
          signatories: [
            `${presidenteCipa} - Presidente da CIPA`,
            `${vicePresidenteCipa} - Vice-Presidente da CIPA`,
            'Tamires Santos de Souza - Presidente da Sessão de Posse',
            'Sidney Vida Barbalho Felipe De Souza - Secretário(a)',
            'Bruna Goncalves De Oliveira - Secretária Substituta',
            'Rosangela Aparecida Santos Marcelino - Representante Empregador Titular',
            'Luis Carlos Gomes Da Silva - Representante Empregados Titular'
          ]
        };
      }

      case 'comprovante_inscricao': {
        const candidatoNome = extraData?.candidatoNome || 'Colaborador Candidato';
        const candidatoCargo = extraData?.candidatoCargo || 'Operador';
        const candidatoMatricula = extraData?.candidatoMatricula || 'CLT-1042';
        const candidatoSetor = extraData?.candidatoSetor || 'Operacional';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'Telefônica Brasil S/A';
        const presidenteNome = extraData?.comissaoPresidente || 'Luiz Alberto De Barros Junior';

        return {
          title: 'Confirmação de Inscrição & Termo de Aceite – Regras do Candidato',
          category: 'Confirmação e Termo de Aceite',
          normativeCode: 'NR-5 · Subitem 5.5.2.3',
          companyName: compNome,
          cnpj,
          dateGenerated: formattedDate,
          content: [
            `Prezado Colaborador,`,
            `Parabéns! Sua candidatura para CIPA foi validada com sucesso!`,
            `Candidato: ${candidatoNome} | Matrícula: ${candidatoMatricula} | Cargo: ${candidatoCargo} | Setor: ${candidatoSetor} - Gestão ${gestaoAno}`,
            `Agora que você está oficialmente no processo, é fundamental conhecer e seguir as regras da eleição para que tudo corra de forma justa e tranquila.`,
            `Fique ligado : Candidatos têm estabilidade no emprego até o dia da eleição —exceto em casos previstos na NR 5 ou em situações de descumprimento das regras, avaliadas pela Comissão Eleitoral .`,
            `CIPA – Comissão Interna de Prevenção de Acidentes e Assédio`,
            `Termo de aceite – Regras do Candidato`,
            `O que você pode fazer:`,
            `• Apresentar seu plano de trabalho aos colegas, sempre com foco na prevenção de acidentes e doenças no trabalho.`,
            `• Circular pelas áreas da empresa para divulgar sua candidatura, com bom senso e respeito ao ambiente de trabalho.`,
            `• Usar o WhatsApp para divulgar sua candidatura e propostas, desde que respeite todas as demais regras.`,
            `O que não pode:`,
            `• Usar canais da empresa (como e-mail corporativo, Teams, WorkVivo ou murais) para pedir votos ou divulgar sua candidatura.`,
            `• Oferecer brindes ou favores em troca de votos — nada de canetas, canecas, churrascos, festas, etc.`,
            `• Fazer "boca de urna" ou forçar alguém a votar na sua frente.`,
            `• Usar sua posição na empresa para pressionar ou ameaçar colegas.`,
            `• Pedir prova de voto, como fotos ou prints de tela.`,
            `• Interromper o trabalho (seu ou de colegas) para fazer campanha.`,
            `Obs.: Processo não elegível para colaboradores em regime 100% Remoto.`,
            `Importante:`,
            `As denúncias somente serão verificadas se realizadas dentro do período Eleitoral, até a divulgação dos eleitos e acompanhadas de evidências.`,
            `Descumprir essas regras pode levar a punições e até à exclusão do processo eleitoral. Se tiver dúvidas, é só chamar: cipa.br@telefonica.com Boa sorte!`,
            `O Processo de eleição é submetido à auditoria e conduzido de forma ética com base nos Princípios de Negócios Responsável.`
          ],
          signatories: [
            `${candidatoNome} - Candidato(a) Validado(a)`,
            `${presidenteNome} - Presidente da Comissão Eleitoral`
          ]
        };
      }

      case 'ficha_inscricao_manual': {
        const candidatoNome = extraData?.candidatoNome || 'Colaborador Candidato';
        const candidatoCargo = extraData?.candidatoCargo || 'Operador';
        const candidatoMatricula = extraData?.candidatoMatricula || 'CLT-1042';
        const candidatoSetor = extraData?.candidatoSetor || 'Operacional';
        const candidatoEmail = extraData?.candidatoEmail || 'candidato@empresa.com.br';
        const candidatoPropostas = extraData?.candidatoPropostas || 'Atuação preventiva e participação ativa nas reuniões da CIPA.';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'Telefônica Brasil S/A';
        const unitName = extraData?.unitName || 'Unidade Local';
        const presidenteNome = extraData?.comissaoPresidente || 'Luiz Alberto De Barros Junior';

        return {
          title: 'FICHA DE INSCRIÇÃO MANUAL DE CANDIDATO À CIPA',
          category: 'Inscrição Manual e Homologação',
          normativeCode: 'NR-5 · Subitem 5.5.2.2 e 5.5.2.3',
          companyName: compNome,
          cnpj,
          dateGenerated: formattedDate,
          content: [
            `FICHA DE INSCRIÇÃO INDIVIDUAL DE CANDIDATO À CIPA - GESTÃO ${gestaoAno}`,
            `EMPRESA: ${compNome} | CNPJ: ${cnpj} | ESTABELECIMENTO: ${unitName}`,
            `1. DADOS CADASTRAIS DO CANDIDATO:`,
            `• Nome Completo: ${candidatoNome}`,
            `• Matrícula Funcional CLT: ${candidatoMatricula}`,
            `• Cargo / Função: ${candidatoCargo}`,
            `• Setor / Lotação: ${candidatoSetor}`,
            `• E-mail para Notificações: ${candidatoEmail}`,
            `• Proposta e Foco de Atuação: ${candidatoPropostas}`,
            `2. DECLARAÇÃO DE CIÊNCIA E REGRAS ELEITORAIS:`,
            `Declaro que formalizo livremente minha inscrição como candidato(a) a representante dos empregados na CIPA, estando ciente da estabilidade provisória no emprego desde a data desta inscrição até o término do pleito (e por 2 anos após a posse caso eleito titular ou suplente), nos termos do Art. 10, II, 'a' do ADCT e da NR-5.`,
            `Termo de aceite – Regras do Candidato:`,
            `• O que pode fazer: Apresentar plano de trabalho com foco em prevenção; circular pelas áreas com bom senso e respeito ao trabalho; usar WhatsApp particular respeitando as regras.`,
            `• O que não pode: Usar canais corporativos (e-mail, Teams, WorkVivo, murais); oferecer brindes/churrascos/favores; boca de urna; pressão hierárquica; exigir print ou prova de voto; interromper o trabalho alheio.`,
            `Obs.: Processo não elegível para colaboradores em regime 100% Remoto.`,
            `Encaminhe-se esta ficha devidamente assinada para a Comissão Eleitoral para fins de homologação e emissão do comprovante de protocolo.`
          ],
          signatories: [
            `${candidatoNome} - Candidato(a) Requerente`,
            `${presidenteNome} - Presidente da Comissão Eleitoral`
          ]
        };
      }

      case 'relatorio_aprovacao_inscricoes':
      case 'lista_candidatos': {
        const unitName = extraData?.unitName || 'Unidade Jundiai';
        const gestaoAno = extraData?.gestaoAno || '2026-2027';
        const compNome = companyName || 'TELEFONICA S/A';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0577-84';
        const geradoPor = extraData?.geradoPor || extraData?.comissaoPresidente || 'Pedro Lobeiro';
        const aprovadoPor = extraData?.aprovadoPor || extraData?.comissaoPresidente || 'Pedro Lobeiro';

        const c = extraData?.cronogramaDatas;
        const dataGeracao = c?.listaCandidatos ? `${c.listaCandidatos} às 11:14` : '07/10/2026 às 11:14';
        const dataEleicao = c?.eleicao ? `${c.eleicao} das 08:00h às 18:00h` : '13/10/2026 das 08:00h às 18:00h';
        const dataProrrogacao1 = '14/10/2026(qua) das 08:00h às 18:00h';
        const dataProrrogacao2 = c?.eleicaoProrrogada ? `${c.eleicaoProrrogada}(qui) das 08:00h às 18:00h` : '15/10/2026(qui) das 08:00h às 18:00h';
        const inscricaoInicio = c?.inscricaoInicio ? `${c.inscricaoInicio} às 08:00` : '21/09/2026 às 08:00';
        const inscricaoFim = c?.inscricaoFim ? `${c.inscricaoFim} às 14:31` : '05/10/2026 às 14:31';

        const votantesHabilitados = extraData?.votantesHabilitados || 88;
        const quorumMinimo = extraData?.quorumMinimo || Math.ceil(votantesHabilitados / 2);

        const aprovados = extraData?.candidatosAprovados && extraData.candidatosAprovados.length > 0
          ? extraData.candidatosAprovados
          : [
            { id: '4977', nome: 'GUSTAVO FERREIRA DA CONCEICAO', email: 'GUSTAVO.CONCEICAO@TELEFONICA.COM', cargo: 'TECNICO SERVICO AO CLIENTE', dataAdmissao: '02/06/2026', apelido: 'GUSTAVO CONCEICAO' },
            { id: '4976', nome: 'JULIA ROCHA DOS SANTOS', email: 'JULIA.RSANTOS@TELEFONICA.COM', cargo: 'ASSISTENTE TECNICO', dataAdmissao: '14/10/2022', apelido: 'JULIA SANTOS' },
            { id: '4998', nome: 'LUANNA SANTANA BEZERRA', email: 'LUANNA.BEZERRA@TELEFONICA.COM', cargo: 'ASSISTENTE TECNICO', dataAdmissao: '06/07/2026', apelido: 'LUANNA BEZERRA' },
            { id: '5023', nome: 'MANOEL FRANCISCO DOS SANTOS', email: 'manoel.santos.telefonica@gmail.com', cargo: 'Técnico de serviço ao cliente.', dataAdmissao: '04/06/2017', apelido: 'MANOEL SANTOS' },
            { id: '5004', nome: 'MARCELO AUGUSTO ARCIFA SAMPAIO', email: 'MARCELO.SAMPAIO@TELEFONICA.COM', cargo: 'TECNICO SERVICO AO CLIENTE', dataAdmissao: '17/04/2013', apelido: 'MARCELO SAMPAIO' },
            { id: '4973', nome: 'MARCELO AUGUSTO FERREIRA', email: 'MARCELO.FERREIRA@TELEFONICA.COM', cargo: 'TECNICO SERVICO AO CLIENTE', dataAdmissao: '02/06/2026', apelido: 'MARCELO FERREIRA' },
            { id: '5006', nome: 'VANDERSON DE JESUS OLIVEIRA', email: 'VANDERSON.OLIVEIRA@TELEFONICA.COM', cargo: 'TECNICO SERVICO AO CLIENTE', dataAdmissao: '17/07/2013', apelido: 'VANDERSON OLIVEIRA' }
          ];

        const reprovados = extraData?.candidatosReprovados && extraData.candidatosReprovados.length > 0
          ? extraData.candidatosReprovados
          : [
            { id: '5003', nome: 'ALINE DE PAULA SANTOS', email: 'ALINEP.SANTOS@TELEFONICA.COM', cargo: 'TECNICO SERVICO AO CLIENTE', dataAdmissao: '12/09/2024', motivo: 'Colaboradora informou que passou em processo seletivo para outro cargo e irá trocar de base.' }
          ];

        return {
          title: 'RELATÓRIO DE APROVAÇÃO DE INSCRIÇÕES',
          category: 'Homologação e Publicação de Candidaturas',
          normativeCode: 'NR-5 · Subitem 5.5.2.4 e 5.5.3.2',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: c?.listaCandidatos || formattedDate || '07/10/2026',
          content: [
            `DATA DE GERAÇÃO: ${dataGeracao}`,
            `GERADO POR: ${geradoPor} | APROVADO POR: ${aprovadoPor}`,
            `PROCESSO ELEITORAL: CIPA ${unitName} - Gestão ${gestaoAno}`,
            `PERÍODO DE REALIZAÇÃO DA VOTAÇÃO: ${dataEleicao}`,
            `PERÍODO DA 1º PRORROGAÇÃO: ${dataProrrogacao1}`,
            `PERÍODO DA 2º PRORROGAÇÃO: ${dataProrrogacao2}`,
            `VOTANTES HABILITADOS: ${votantesHabilitados} colaboradores`,
            `QUÓRUM MÍNIMO REGULAMENTAR: ${quorumMinimo} votos (50% + 1)`,
            `VOTO SECRETO: SIM | SISTEMA DE VOTAÇÃO: ELETRÔNICA AUDITADA`,
            `PERÍODO DE INSCRIÇÕES: ${inscricaoInicio} até ${inscricaoFim}`,
            `INSCRIÇÕES APROVADAS: ${aprovados.length}`,
            `| ID | NOME | EMAIL | CARGO | DATA DE ADMISSÃO |`,
            `|---|---|---|---|---|`,
            ...aprovados.map(a => `| ${a.id} | ${a.nome} | ${a.email || '-'} | ${a.cargo} | ${a.dataAdmissao || '-'} |`),
            `INSCRIÇÕES REPROVADAS: ${reprovados.length}`,
            `| ID | NOME | EMAIL | CARGO | DATA DE ADMISSÃO | MOTIVO |`,
            `|---|---|---|---|---|---|`,
            ...reprovados.map(r => `| ${r.id} | ${r.nome} | ${r.email || '-'} | ${r.cargo} | ${r.dataAdmissao || '-'} | ${r.motivo || '-'} |`),
            `CANDIDATOS CADASTRADOS NA VOTAÇÃO`,
            ...aprovados.flatMap(a => [
              `NOME DO CANDIDATO: ${a.nome}`,
              `DESCRIÇÃO DO CANDIDATO: Apelido: ${a.apelido || a.nome.split(' ').slice(0, 2).join(' ')} | Cargo: ${a.cargo}`
            ]),
            `Gerado em ${c?.listaCandidatos || '07/10/2026'} por https://grtsdigital.com.br GRTS Digital`,
            `Para verificação do certificado digital deste documento acesse: https://validar.iti.gov.br`
          ],
          signatories: [
            `${aprovadoPor} - Presidente da Comissão Eleitoral`,
            `${compNome} - Representante Legal da Empresa`
          ]
        };
      }

      case 'cedula_urna':
      case 'edital_votacao': {
        const unitName = extraData?.unitName || 'Unidade SP JUNDIAÍ VILA';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'Telefônica Brasil S/A';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0577-84';
        const emailContato = extraData?.emailContato || 'cipa.br@telefonica.com ou pedro.lobeiro.ext@telefonica.com';
        const telefoneContato = extraData?.telefoneContato || '(19)99784-1065';
        const unitAddress = extraData?.unitAddress || 'AVENIDA FERNANDO ARENS , nº470 , JUNDIAÍ– SP';
        const unitCep = extraData?.unitCep || '13202-570';

        const c = extraData?.cronogramaDatas;
        const dataEleicao = c?.eleicao || '13/10/2026';
        const dataEleicaoProrrogada = c?.eleicaoProrrogada || '15/10/2026';

        const candidatosEleicao = extraData?.candidatosAprovados && extraData.candidatosAprovados.length > 0
          ? extraData.candidatosAprovados
          : [
            { id: '179595', matricula: '179595', nome: 'MARCELO AUGUSTO FERREIRA', email: 'MARCELO.FERREIRA@TELEFONICA.COM', dataAdmissao: '02/06/2026', cargo: 'TECNICO SERVICO AO CLIENTE' },
            { id: '154266', matricula: '154266', nome: 'JULIA ROCHA DOS SANTOS', email: 'JULIA.RSANTOS@TELEFONICA.COM', dataAdmissao: '14/10/2022', cargo: 'ASSISTENTE TECNICO' },
            { id: '179645', matricula: '179645', nome: 'GUSTAVO FERREIRA DA CONCEICAO', email: 'GUSTAVO.CONCEICAO@TELEFONICA.COM', dataAdmissao: '02/06/2026', cargo: 'TECNICO SERVICO AO CLIENTE' },
            { id: '180550', matricula: '180550', nome: 'LUANNA SANTANA BEZERRA', email: 'LUANNA.BEZERRA@TELEFONICA.COM', dataAdmissao: '06/07/2026', cargo: 'ASSISTENTE TECNICO' },
            { id: '3538328', matricula: '3538328', nome: 'MARCELO AUGUSTO ARCIFA SAMPAIO', email: 'MARCELO.SAMPAIO@TELEFONICA.COM', dataAdmissao: '17/04/2013', cargo: 'TECNICO SERVICO AO CLIENTE' },
            { id: '3540169', matricula: '3540169', nome: 'VANDERSON DE JESUS OLIVEIRA', email: 'VANDERSON.OLIVEIRA@TELEFONICA.COM', dataAdmissao: '17/07/2013', cargo: 'TECNICO SERVICO AO CLIENTE' },
            { id: '3518036', matricula: '3518036', nome: 'MANOEL FRANCISCO DOS SANTOS', email: 'MANOEL.SANTOS@TELEFONICA.COM', dataAdmissao: '15/03/2011', cargo: 'TECNICO SERVICO AO CLIENTE' }
          ];

        return {
          title: `Votação da CIPA (on-line) - ${unitName}`,
          category: 'Convocação para Votação e Cédula Eleitoral',
          normativeCode: 'NR-05 · Subitem 5.5.3 e 5.5.3.1',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataEleicao,
          content: [
            `Chegou o momento de votar no seu representante da CIPA!`,
            `A votação será registrada de forma online e é exclusiva para colaboradores lotados no CNPJ ${unitCnpj}.`,
            `O link para votação será encaminhado diretamente pela plataforma virtual, atente-se ao remetente Assembleias Virtuais.`,
            `Relembre quem são os candidatos da CIPA:`,
            `| RE | Foto | Nome | E-mail | Admissão | Cargo |`,
            `|---|---|---|---|---|---|`,
            ...candidatosEleicao.map(cand => `| ${cand.matricula || cand.id} | 👤 | ${cand.nome} | ${cand.email || '-'} | ${cand.dataAdmissao || '-'} | ${cand.cargo} |`),
            `Confira os detalhes sobre a eleição e programe-se para a votação:`,
            `Data da Eleição: ${dataEleicao}`,
            `Horário: das 08:00 às 17:00`,
            `Sistema de Votação: On-line`,
            `*A data da eleição poderá ser prorrogada até o dia ${dataEleicaoProrrogada} caso não seja atingindo o número de votantes válidos necessários, conforme o disposto no item 5.5 da NR 5:`,
            `• 1º dia: 50% dos empregados;`,
            `• 2º dia: 1/3 dos empregados;`,
            `• 3º dia: Qualquer valor da população do prédio.`,
            `Em caso de dúvidas, entre em contato com ${emailContato}`,
            `Telefone ${telefoneContato}`,
            `${unitName}`,
            `Endereço: ${unitAddress}`,
            `CEP ${unitCep}`,
            `CNPJ: ${unitCnpj}`
          ],
          signatories: [
            'Presidente da Comissão Eleitoral',
            `${compNome} - Representante Legal da Empresa`
          ]
        };
      }

      case 'certificado_treinamento': {
        const unitName = extraData?.unitName || 'Unidade Eco Berrini';
        const unitCity = extraData?.unitCity || 'São Paulo';
        const unitState = extraData?.unitState || 'SP';
        const unitAddress = extraData?.unitAddress || 'Av. Eng. Luís Carlos Berrini, 1376';
        const unitCep = extraData?.unitCep || '04571-936';
        const compNome = companyName || 'Telefônica Brasil S.A.';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0001-62';

        // Grau de Risco e Carga Horária Normativa NR-05
        const gr = extraData?.grauDeRisco || 3;
        const defaultWorkload = getCipaTrainingHours(gr);
        const horasTotal = extraData?.horasTreinamentoTotal || defaultWorkload.totalHoras;
        const horasEad = extraData?.horasTreinamentoEad !== undefined ? extraData.horasTreinamentoEad : defaultWorkload.horasEad;
        const horasPresencial = extraData?.horasTreinamentoPresencial !== undefined ? extraData.horasTreinamentoPresencial : defaultWorkload.horasPresencial;

        const colaboradorNome = extraData?.colaboradorTreinadoNome || 
          extraData?.candidatosAprovados?.[0]?.nome || 
          'JOSILENE ALVES LIONTAS';
        const colaboradorMatricula = extraData?.colaboradorTreinadoMatricula || 
          extraData?.candidatosAprovados?.[0]?.matricula || 
          '136064';

        const c = extraData?.cronogramaDatas;
        const periodoTreinamento = extraData?.periodoTreinamento || c?.treinamento || 'De 23/06/2025 a 27/06/2025';
        const dataPresencial = extraData?.dataConclusaoTreinamento || c?.treinamentoPresencial || '08/07/2026';

        return {
          title: `CERTIFICADO DE TREINAMENTO DA CIPA (NR-05) - ${unitName}`,
          category: 'Capacitação e Treinamento',
          normativeCode: `NR-05 (Itens 5.7.1, 5.7.2, 5.7.4) e Lei nº 14.457/2022`,
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataPresencial,
          content: [
            `CERTIFICADO`,
            `Certificamos que:`,
            `NOME: ${colaboradorNome}`,
            `CIDADE: ${unitCity} - ${unitState}`,
            `MATRÍCULA: ${colaboradorMatricula}`,
            `CARGA HORÁRIA PLATAFORMA EAD: ${horasEad}h`,
            `CARGA HORÁRIA PRESENCIAL: ${horasPresencial}h`,
            `CARGA HORÁRIA TOTAL: ${horasTotal}h`,
            `PERÍODO PLATAFORMA EAD: ${periodoTreinamento}`,
            `DATA PRESENCIAL / CONCLUSÃO: ${dataPresencial}`,
            `Concluiu com êxito o treinamento da CIPA – COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E ASSÉDIO (NR-5) da empresa ${compNome}, com carga horária de ${horasEad}h realizadas na plataforma EAD e ${horasPresencial}h presencial realizado na ${unitAddress} – ${unitCep} | ${unitCity} - ${unitState}, em atendimento aos itens 5.7.2 e 5.7.4.2 da NR-05 – Portaria 3.214/78 do Ministério do Trabalho e Lei nº 14.457/2022.`,
            `CONTEÚDO PROGRAMÁTICO – Plataforma EAD / Formação Teórica`,
            `• Estudo do Ambiente, das condições de trabalho, inspeção de segurança, bem como os riscos originados do processo produtivo;`,
            `• Noções sobre acidentes e doenças relacionadas ao trabalho decorrentes das condições de trabalho e da exposição aos riscos existentes no estabelecimento e suas medidas de prevenção;`,
            `• Metodologia de investigação e análise de acidentes e doenças relacionadas ao trabalho;`,
            `• Princípios gerais de higiene do trabalho e de medidas de prevenção dos riscos;`,
            `• Noções sobre as legislações trabalhista e previdenciária relativas à segurança e saúde no trabalho;`,
            `• Noções sobre a inclusão de pessoas com deficiência e reabilitados nos processos de trabalho;`,
            `• Organização da CIPA e outros assuntos necessários ao exercício das atribuições da Comissão;`,
            `CONTEÚDO PROGRAMÁTICO – Treinamento Presencial / Vivência Prática`,
            `• Prevenção e combate ao assédio sexual e a outras formas de violência no trabalho (Lei nº 14.457/2022);`,
            `• Atribuições e funcionamento das reuniões ordinárias;`,
            `• Acidentes de trabalho: conceitos e comunicação (CAT);`,
            `• Mapa de Riscos;`,
            `• Inspeções;`,
            `• Exercícios;`,
            `• Sistema de Gestão de Saúde e Segurança do Trabalho (SGSST) – ISO 45.001.`
          ],
          signatories: [
            'Responsável Técnico pelo Treinamento - Gerente de Segurança do Trabalho',
            'Instrutor Responsável pelo Treinamento - Téc. de Segurança do Trabalho',
            'Dir. Pessoas - Recursos Humanos',
            `${colaboradorNome} - Assinatura do colaborador capacitado`
          ]
        };
      }

      case 'calendario_reunioes': {
        const c = extraData?.cronogramaDatas;
        const unitName = extraData?.unitName || 'Unidade Principal';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0001-62';
        const unitAddress = extraData?.unitAddress || 'Endereço da Unidade';
        const unitCity = extraData?.unitCity || 'São Paulo';
        const unitState = extraData?.unitState || 'SP';
        const compNome = companyName || 'Telefônica Brasil S/A';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const sindicato = extraData?.sindicatoNome ? `${extraData.sindicatoNome} (${extraData?.sindicatoSigla || 'Sindicato'})` : 'Sindicato dos Trabalhadores';
        const diaUtilNum = Number(extraData?.diaUtilEscolhido || 5);
        const horarioDef = extraData?.horarioPadrao || '10:00 às 11:30';
        const localDef = extraData?.localPadrao || `${unitName} - Sala de Treinamentos e Reuniões`;
        const dataPosse = c?.posse || '17/07/2026';

        // Recupera ou gera as 12 reuniões ordinárias
        const reunioes: ScheduledMeeting[] = (extraData?.reunioesAgendadas && Array.isArray(extraData.reunioesAgendadas) && extraData.reunioesAgendadas.length === 12)
          ? extraData.reunioesAgendadas
          : generate12MeetingsSchedule(dataPosse, diaUtilNum, horarioDef, localDef);

        const presCipa = extraData?.presidenteCipaNome || 'Rosangela Aparecida Santos Marcelino';
        const vicePresCipa = extraData?.vicePresidenteCipaNome || 'Luis Carlos Gomes Da Silva';
        const secCipa = extraData?.secretarioCipaNome || 'Sidney Vida Barbalho Felipe De Souza';

        const reunioesRows = reunioes.map(r => 
          `| ${r.numero}ª | ${r.mesAno} | ${r.dataFormatada} | ${r.diaSemana} | ${r.horario} | ${r.isSipat ? '★ SIPAT - ' : ''}${r.pauta} | ${r.local} |`
        );

        return {
          title: `CALENDÁRIO ANUAL DE REUNIÕES ORDINÁRIAS DA CIPA - GESTÃO ${gestaoAno}`,
          category: 'Planejamento e Gestão Anual',
          normativeCode: 'NR-05 · Subitem 5.6.1, 5.8.1 e Lei Federal nº 14.457/2022',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: formattedDate,
          content: [
            `CALENDÁRIO OFICIAL DE REUNIÕES ORDINÁRIAS DA CIPA - GESTÃO ${gestaoAno}`,
            `EMPRESA: ${compNome} | CNPJ: ${unitCnpj}`,
            `ESTABELECIMENTO: ${unitName} - ${unitAddress} - ${unitCity}/${unitState}`,
            `REGISTRO E HOMOLOGAÇÃO NORMATIVA:`,
            `Em estrito cumprimento ao subitem 5.6.1 da Norma Regulamentadora nº 05 (Portaria MTP nº 4.219/2022 e Portaria GM nº 3.214/1978), a Comissão Interna de Prevenção de Acidentes e Assédio (CIPA) desta unidade homologa formalmente o Cronograma Anual de Reuniões Ordinárias da Gestão ${gestaoAno}.`,
            `REGRA GERAL DE PERIODICIDADE E HORÁRIO:`,
            `As reuniões ordinárias mensais realizar-se-ão impreterivelmente no ${diaUtilNum}º DIA ÚTIL de cada mês, durante o expediente normal de trabalho da empresa (NR-05 subitem 5.6.2), com participação obrigatória e paritária dos membros representantes do empregador e dos empregados.`,
            `CRONOGRAMA DAS 12 REUNIÕES ORDINÁRIAS MENSAIS:`,
            `| Reunião | Mês / Ano | Data Oficial | Dia da Semana | Horário | Pauta Principal e Foco Preventivo | Local / Sala |`,
            `| :---: | :---: | :---: | :---: | :---: | :--- | :--- |`,
            ...reunioesRows,
            `PAUTA PERMANENTE - COMBATE AO ASSÉDIO SEXUAL E MORAL (LEI Nº 14.457/2022):`,
            `Nos termos da Lei Federal nº 14.457/2022, todas as 12 reuniões ordinárias da CIPA contemplarão, em caráter mandatório, pauta específica dedicada ao acompanhamento de denúncias, promoção de palestras e ações preventivas de acolhimento e combate à violência e ao assédio no ambiente laboral.`,
            `SEMANA INTERNA DE PREVENÇÃO DE ACIDENTES E ASSÉDIO (SIPAT):`,
            `A SIPAT do mandato ${gestaoAno} está fixada no mês assinalado com estrela (★) no cronograma acima, sendo responsabilidade da comissão e do SESMT estruturar a grade de palestras técnicas, dinâmicas de segurança e campanhas educativas.`,
            `REUNIÕES EXTRAORDINÁRIAS (NR-05, SUBITEM 5.6.4):`,
            `Caso ocorra acidente de trabalho grave ou fatal, ou risco iminente tecnicamente fundamentado, será convocada Reunião Extraordinária no prazo máximo de 48 (quarenta e oito) horas.`,
            `TRANSMISSÃO AO SINDICATO DA CATEGORIA (NR-05, SUBITEM 5.8.1):`,
            `O presente calendário é remetido formalmente ao Sindicato dos Trabalhadores (${sindicato}) no prazo de até 10 (dez) dias úteis contados da posse solene da CIPA, permanecendo arquivado pelo prazo mínimo de 5 (cinco) anos à disposição da Auditoria Fiscal do Trabalho.`
          ],
          signatories: [
            `${presCipa} - Presidente da CIPA (Representante do Empregador)`,
            `${vicePresCipa} - Vice-Presidente da CIPA (Representante dos Empregados)`,
            `${secCipa} - Secretário(a) da CIPA`,
            `${compNome} - Representante Legal da Empresa`
          ]
        };
      }

      case 'zeresima': {
        const unitName = extraData?.unitName || 'Unidade Eco Berrini';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'TELEFONICA BRASIL S/A';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0001-62';
        const unitAddress = extraData?.unitAddress || 'Av. Engenheiro Luiz Carlos Berrini, 1376 - São Paulo - SP';
        const ap = extraData?.apuracao;
        const totalAptos = ap?.totalEleitoresAptos || extraData?.votantesHabilitados || 88;
        const quorumMinimo = ap?.quorumMinimo || Math.floor(totalAptos / 2) + 1;
        const dataAbertura = extraData?.cronogramaDatas?.eleicao || formattedDate;
        const horaAbertura = ap?.horarioAbertura || '08:30';
        const hashZeramento = extraData?.hashZeramento || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        const presComissao = extraData?.comissaoPresidente || 'Tamires Santos de Souza';
        const secComissao = extraData?.comissaoVice || 'Luiz Alberto De Barros Junior';

        // Candidatos inscritos
        const cands = extraData?.candidatosAprovados || ap?.candidatosResultados || [
          { matricula: '179645', nome: 'LUIS CARLOS GOMES DA SILVA', cargo: 'TECNICO SERVICO AO CLIENTE' },
          { matricula: '154266', nome: 'WALMIR MANOEL DA CRUZ', cargo: 'ASSISTENTE TECNICO' },
          { matricula: '180550', nome: 'CHARLES GONCALVES DOS SANTOS', cargo: 'ANALISTA DE SUPORTE' },
          { matricula: '3518036', nome: 'PAOLO ALVES DA HORA', cargo: 'TECNICO SERVICO AO CLIENTE' },
          { matricula: '3538328', nome: 'DOUGLAS DE JESUS', cargo: 'ESPECIALISTA TECNICO' },
          { matricula: '179595', nome: 'ABEL SILVA FORTES CARDOSO', cargo: 'TECNICO DE REDES' },
          { matricula: '3540169', nome: 'MAURO FAUSTINO', cargo: 'ANALISTA OPERACIONAL' },
          { matricula: '3541288', nome: 'JOSIAS ALTIMIRO DE OLIVEIRA', cargo: 'TECNICO SERVICO AO CLIENTE' },
          { matricula: '3542901', nome: 'IRACEMA DUARTE', cargo: 'ASSISTENTE ADMINISTRATIVO' },
          { matricula: '3543110', nome: 'SIDNEY VIDA BARBALHO FELIPE DE SOUZA', cargo: 'ANALISTA DE PROCESSOS' }
        ];

        return {
          title: `RELATÓRIO DE ZERÉSIMA DA URNA ELETRÔNICA - ${unitName}`,
          category: 'Auditoria e Integridade da Urna Digital',
          normativeCode: 'NR-05 · Portaria MTP nº 422/2021 · Resolução TSE / Auditoria Digital',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataAbertura,
          content: [
            `RELATÓRIO DE ZERÉSIMA DA URNA ELETRÔNICA - ELEIÇÃO CIPAA`,
            `IDENTIFICAÇÃO DO PLEITO:`,
            `• Entidade / Empregador: ${compNome}`,
            `• Estabelecimento / Unidade: ${unitName}`,
            `• Endereço: ${unitAddress}`,
            `• CNPJ do Realizador: ${unitCnpj}`,
            `• Mandato / Gestão: ${gestaoAno}`,
            `• Data e Horário de Abertura da Urna: ${dataAbertura} às ${horaAbertura} (Horário de Brasília - BRT)`,
            `• Sistema Eleitoral Oficial: CIPA Expert - Módulo Urna Digital Criptografada`,
            `DADOS CADASTRAIS DO PLEITO:`,
            `• Total de Colaboradores Cadastrados na Base: ${totalAptos}`,
            `• Colaboradores Habilitados ao Voto: ${totalAptos}`,
            `• Quórum Mínimo Exigido em 1º Escrutínio (50% + 1): ${quorumMinimo} votantes`,
            `• Voto Secreto e Inviolável: SIM (Garantia pelo subitem 5.5.3 da NR-05)`,
            `• Acompanhamento do Quórum em Tempo Real: SIM`,
            `• Acompanhamento Parcial do Resultado: NÃO (Apuração mantida sigilosa até o fechamento da urna)`,
            `• Alteração de Base de Eleitores Após Início: NÃO (Base de dados congelada e assinada)`,
            `CERTIFICAÇÃO DO ESTADO DA URNA (ZERAMENTO):`,
            `A Comissão Eleitoral e os Fiscais designados atestam formalmente que foi realizada a verificação prévia do banco de dados e do repositório criptográfico de votos, constatando-se rigorosamente que NÃO HÁ NENHUM VOTO computado para quaisquer candidatos ou votos em branco/nulo, conforme demonstrado a seguir:`,
            `• TOTAL DE VOTOS NOMINAIS COMPUTADOS: 0 (ZERO)`,
            `• TOTAL DE VOTOS EM BRANCO: 0 (ZERO)`,
            `• TOTAL DE VOTOS NULOS: 0 (ZERO)`,
            `• TOTAL GERAL DE VOTOS NA URNA: 0 (ZERO VOTOS)`,
            `MAPA DE CANDIDATOS HABILITADOS E VOTAÇÃO INICIAL:`,
            `| Nº | Matrícula / RE | Candidato Registrado | Cargo / Função | Votos Iniciais | Status da Urna |`,
            `| :---: | :---: | :--- | :--- | :---: | :---: |`,
            ...cands.map((c: any, idx: number) => `| ${idx + 1} | ${c.matricula || '-'} | ${c.nome} | ${c.cargo || '-'} | 0 | Habilitado / Zerado |`),
            `REGISTRO CRIPTOGRÁFICO DE INTEGRIDADE:`,
            `• Algoritmo de Hashing: SHA-256 (NIST FIPS PUB 180-4)`,
            `• Hash de Zeramento da Urna: ${hashZeramento}`,
            `• Carimbo do Tempo (Timestamp Authority): ${dataAbertura} ${horaAbertura}:00 BRT`,
            `DECLARAÇÃO FORMAL DA COMISSÃO ELEITORAL:`,
            `Certificamos sob as penas da lei que às ${horaAbertura} do dia ${dataAbertura}, imediatamente antes de autorizada a liberação do link de votação e o primeiro acesso dos eleitores à cabine virtual, procedeu-se à extração da presente Zerésima. Constatou-se a absoluta inexistência de registros de sufrágio no banco de dados, estando a Urna Digital devidamente zerada, lacrada eletronicamente e pronta para o início seguro da eleição.`,
            `DOCUMENTO COM VALIDADE JURÍDICA: Assinado digitalmente nos termos da Medida Provisória nº 2.200-2/2001 e NR-05 subitem 5.5.3. Para verificação acesse https://validar.iti.gov.br/`
          ],
          signatories: [
            `${presComissao} - Presidente da Comissão Eleitoral`,
            `${secComissao} - Secretário(a) da Comissão Eleitoral`,
            `${compNome} - Representante Legal do Empregador`,
            `Fiscal do Pleito - Representante dos Empregados`
          ]
        };
      }

      case 'relatorio_votacao': {
        const unitName = extraData?.unitName || 'Unidade Eco Berrini';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'TELEFONICA BRASIL S/A';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0001-62';
        const unitAddress = extraData?.unitAddress || 'Av. Engenheiro Luiz Carlos Berrini, 1376 - São Paulo - SP';
        const ap = extraData?.apuracao;
        const totalAptos = ap?.totalEleitoresAptos || extraData?.votantesHabilitados || 7964;
        const totalVotantes = ap?.totalVotantes || 2919;
        const quorumMinimo = ap?.quorumMinimo || Math.floor(totalAptos / 2) + 1;
        const percentualQuorum = ap?.percentualQuorum || (totalAptos > 0 ? ((totalVotantes / totalAptos) * 100).toFixed(2) : '36.65');
        const votosBrancos = ap?.votosBrancos ?? 112;
        const votosNulos = ap?.votosNulos ?? 0;
        const votosValidos = ap?.votosValidos ?? (totalVotantes - votosBrancos - votosNulos);
        const dataGeracao = formattedDate + ' às 18:00';
        const periodoEleicao = extraData?.periodoEleicao || (extraData?.cronogramaDatas?.eleicao ? `${extraData.cronogramaDatas.eleicao} das 08:30h às 18:00h` : '09/06/2026 das 08:30h às 18:00h');
        const prorrogacao1 = extraData?.prorrogacao1Periodo || '10/06/2026(qua) das 08:30h às 18:00h';
        const quorum1 = extraData?.prorrogacao1Quorum || '31.72%';
        const prorrogacao2 = extraData?.prorrogacao2Periodo || '11/06/2026(qui) das 08:30h às 18:00h';
        const quorum2 = extraData?.prorrogacao2Quorum || '36.65%';
        const presComissao = extraData?.comissaoPresidente || 'Tamires Santos de Souza';
        const secComissao = extraData?.comissaoVice || 'Luiz Alberto De Barros Junior';

        const resultados = ap?.candidatosResultados || [
          { classificacao: 1, nome: 'LUIS CARLOS GOMES DA SILVA', dataAdmissao: '10/02/1982', votos: 262, percentual: 9.33, situacao: '1º Titular' },
          { classificacao: 2, nome: 'WALMIR MANOEL DA CRUZ', dataAdmissao: '14/11/2017', votos: 148, percentual: 5.27, situacao: '2º Titular' },
          { classificacao: 3, nome: 'CHARLES GONCALVES DOS SANTOS', dataAdmissao: '17/01/1996', votos: 113, percentual: 4.03, situacao: '3º Titular' },
          { classificacao: 4, nome: 'PAOLO ALVES DA HORA', dataAdmissao: '01/09/2021', votos: 99, percentual: 3.53, situacao: '4º Titular' },
          { classificacao: 5, nome: 'DOUGLAS DE JESUS', dataAdmissao: '03/09/2018', votos: 97, percentual: 3.46, situacao: '5º Titular' },
          { classificacao: 6, nome: 'ABEL SILVA FORTES CARDOSO', dataAdmissao: '03/09/2009', votos: 93, percentual: 3.31, situacao: '6º Titular' },
          { classificacao: 7, nome: 'MAURO FAUSTINO', dataAdmissao: '11/02/2021', votos: 91, percentual: 3.24, situacao: '7º Titular' },
          { classificacao: 8, nome: 'JOSIAS ALTIMIRO DE OLIVEIRA', dataAdmissao: '12/12/2014', votos: 86, percentual: 3.06, situacao: '8º Titular' },
          { classificacao: 9, nome: 'IRACEMA DUARTE', dataAdmissao: '01/09/2004', votos: 81, percentual: 2.89, situacao: '9º Titular' },
          { classificacao: 10, nome: 'SIDNEY VIDA BARBALHO FELIPE DE SOUZA', dataAdmissao: '06/06/2013', votos: 80, percentual: 2.85, situacao: '10º Titular' },
          { classificacao: 11, nome: 'BRUNA GONCALVES DE OLIVEIRA', dataAdmissao: '04/11/2019', votos: 80, percentual: 2.85, situacao: '1º Suplente' },
          { classificacao: 12, nome: 'ANDRESSA CRISTINE NUNES', dataAdmissao: '10/02/2014', votos: 77, percentual: 2.74, situacao: '2º Suplente' },
          { classificacao: 13, nome: 'GILBERTO CARLOS DOS SANTOS', dataAdmissao: '04/06/2001', votos: 71, percentual: 2.53, situacao: '3º Suplente' },
          { classificacao: 14, nome: 'CARLOS SILMAR SCAPIM', dataAdmissao: '13/02/2017', votos: 69, percentual: 2.46, situacao: '4º Suplente' },
          { classificacao: 15, nome: 'TIAGO ANTONIO DE SOUSA', dataAdmissao: '04/07/2022', votos: 67, percentual: 2.39, situacao: '5º Suplente' },
          { classificacao: 16, nome: 'ANDRE LUIZ DOS SANTOS', dataAdmissao: '08/10/2013', votos: 64, percentual: 2.28, situacao: '6º Suplente' },
          { classificacao: 17, nome: 'FABIO LINS ESTANIZIO', dataAdmissao: '02/04/2025', votos: 57, percentual: 2.03, situacao: '7º Suplente' },
          { classificacao: 18, nome: 'JOSILENE ALVES LIONTAS', dataAdmissao: '04/10/2021', votos: 53, percentual: 1.89, situacao: '8º Suplente' },
          { classificacao: 19, nome: 'LUANA SILVA MENDONCA', dataAdmissao: '06/12/2024', votos: 53, percentual: 1.89, situacao: 'Não Eleito' },
          { classificacao: 20, nome: 'EUDES UZAI JUNIOR', dataAdmissao: '05/04/2017', votos: 50, percentual: 1.78, situacao: 'Não Eleito' }
        ];

        const titulares = resultados.filter(r => r.situacao?.includes('Titular'));
        const suplentes = resultados.filter(r => r.situacao?.includes('Suplente'));
        const naoEleitos = resultados.filter(r => r.situacao?.includes('Não Eleito') || (!r.situacao?.includes('Titular') && !r.situacao?.includes('Suplente')));

        return {
          title: `RELATÓRIO DE ELEIÇÃO VIRTUAL DE MEMBROS DA CIPAA - RESULTADO`,
          category: 'Resultado Oficial da Eleição Virtual',
          normativeCode: 'NR-05 · Subitens 5.5.4 a 5.5.9',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataGeracao,
          content: [
            `RELATÓRIO DE ELEIÇÃO VIRTUAL DE MEMBROS DA CIPAA - RESULTADO`,
            `DADOS DO EVENTO ELEITORAL (Horário de Brasília - BRT):`,
            `• DATA DE GERAÇÃO: ${dataGeracao}`,
            `• GERADO POR: Assembleias Virtuais / CIPA Expert`,
            `• NOME: ${compNome} | CIPA - ${unitName} ${gestaoAno}`,
            `• PERÍODO DE REALIZAÇÃO DA ELEIÇÃO: ${periodoEleicao}`,
            `• QUÓRUM ATINGIDO: ${percentualQuorum}%`,
            ...(extraData?.prorrogacao1Periodo ? [
              `• PERÍODO DA 1º PRORROGAÇÃO: ${prorrogacao1}`,
              `• QUÓRUM ATINGIDO NA 1º PRORROGAÇÃO: ${quorum1}`,
              `• PERÍODO DA 2º PRORROGAÇÃO: ${prorrogacao2}`,
              `• QUÓRUM ATINGIDO NA 2º PRORROGAÇÃO: ${quorum2}`
            ] : []),
            `• DESCRIÇÃO: VOTAÇÃO - CIPA On-line - ${unitName} - ${unitAddress} - Gestão ${gestaoAno} - CNPJ: ${unitCnpj}`,
            `• REALIZADOR DA VOTAÇÃO: ${compNome} CIPA ${unitName}`,
            `• CNPJ DO REALIZADOR: ${unitCnpj}`,
            `PARÂMETROS DE AUDITORIA E QUÓRUM:`,
            `• TOTAL DE COLABORADORES: ${totalAptos}`,
            `• COLABORADORES HABILITADOS AO VOTO: ${totalAptos}`,
            `• QUÓRUM MÍNIMO EXIGIDO: ${quorumMinimo}`,
            `• QUÓRUM DA VOTAÇÃO (TOTAL DE VOTANTES): ${totalVotantes}`,
            `• VOTO SECRETO: SIM`,
            `• ACOMPANHAMENTO DE QUÓRUM: SIM`,
            `• ACOMPANHAMENTO DO RESULTADO: NÃO`,
            `• ALTERAÇÃO APÓS EVENTO INICIADO? NÃO`,
            `RESUMO DOS VOTOS APURADOS NA CIPAA:`,
            `• VOTOS VÁLIDOS (NOMINAIS AOS CANDIDATOS): ${votosValidos}`,
            `• VOTOS EM BRANCO: ${votosBrancos}`,
            `• VOTOS EM NULO: ${votosNulos === 0 ? 'NÃO HABILITADO' : votosNulos}`,
            `REPRESENTANTES DOS EMPREGADOS - TITULARES:`,
            `| Classificação | Candidato | Data Admissão | Qtd de Votos | % |`,
            `| :---: | :--- | :---: | :---: | :---: |`,
            ...titulares.map(r => `| ${r.classificacao}º Titular | ${r.nome} | ${r.dataAdmissao || '-'} | ${r.votos} | ${typeof r.percentual === 'number' ? r.percentual.toFixed(2) + '%' : r.percentual} |`),
            `REPRESENTANTES DOS EMPREGADOS - SUPLENTES:`,
            `| Classificação | Candidato | Data Admissão | Qtd de Votos | % |`,
            `| :---: | :--- | :---: | :---: | :---: |`,
            ...suplentes.map(r => `| ${r.classificacao}º Suplente | ${r.nome} | ${r.dataAdmissao || '-'} | ${r.votos} | ${typeof r.percentual === 'number' ? r.percentual.toFixed(2) + '%' : r.percentual} |`),
            ...(naoEleitos.length > 0 ? [
              `DEMAIS CANDIDATOS NÃO ELEITOS:`,
              `| Candidato | Data Admissão | Qtd de Votos | % |`,
              `| :--- | :---: | :---: | :---: |`,
              ...naoEleitos.map(r => `| ${r.nome} | ${r.dataAdmissao || '-'} | ${r.votos} | ${typeof r.percentual === 'number' ? r.percentual.toFixed(2) + '%' : r.percentual} |`)
            ] : []),
            `CRITÉRIOS DE DESEMPATE E ESTABILIDADE PROVISÓRIA (NR-05):`,
            `Em estrita observância à NR-05, no caso de empate entre candidatos com igual votação, o desempate obedece ao critério legal de maior tempo de admissão na empresa. Todos os membros titulares e suplentes ora proclamados gozam da estabilidade provisória prevista no artigo 10, II, alínea 'a' do ADCT da Constituição Federal.`,
            `Para verificação do certificado digital deste documento acesse: https://validar.iti.gov.br/`
          ],
          signatories: [
            `${presComissao} - Presidente da Comissão Eleitoral`,
            `${secComissao} - Técnico de Segurança do Trabalho / Secretário`,
            `${compNome} - Representante Legal da Empresa`
          ]
        };
      }

      case 'relatorio_votantes': {
        const unitName = extraData?.unitName || 'Unidade Eco Berrini';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'TELEFONICA BRASIL S/A';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0001-62';
        const unitAddress = extraData?.unitAddress || 'Av. Engenheiro Luiz Carlos Berrini, 1376 - São Paulo - SP';
        const ap = extraData?.apuracao;
        const totalAptos = ap?.totalEleitoresAptos || extraData?.votantesHabilitados || 7964;
        const totalVotantes = ap?.totalVotantes || 2919;
        const quorumMinimo = ap?.quorumMinimo || Math.floor(totalAptos / 2) + 1;
        const percentualQuorum = ap?.percentualQuorum || (totalAptos > 0 ? ((totalVotantes / totalAptos) * 100).toFixed(2) : '36.65');
        const dataGeracao = formattedDate + ' às 18:00';
        const periodoEleicao = extraData?.periodoEleicao || (extraData?.cronogramaDatas?.eleicao ? `${extraData.cronogramaDatas.eleicao} das 08:30h às 18:00h` : '09/06/2026 das 08:30h às 18:00h');
        const presComissao = extraData?.comissaoPresidente || 'Tamires Santos de Souza';
        const secComissao = extraData?.comissaoVice || 'Luiz Alberto De Barros Junior';

        // Lista de votantes fornecida ou gerada
        const votantes = extraData?.votantesList || [
          { id: '2277846', nome: 'ABEL SILVA FORTES CARDOSO', matricula: '18293', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ABEL.CARDOSO@TELEFONICA.COM', telefone: '-', ip: '162.10.28.18', dataHora: '09/06/2026 às 11:16:42', tipoAcesso: 'Link de Convocação' },
          { id: '2277850', nome: 'ABNER RODRIGUES DA SILVA', matricula: '95797', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ABNER.RSILVA@TELEFONICA.COM', telefone: '-', ip: '162.10.30.45', dataHora: '09/06/2026 às 11:22:15', tipoAcesso: 'Link de Convocação' },
          { id: '2277855', nome: 'ADRIANA DIAS DE MORAES', matricula: '44812', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ADRIANA.MORAES@TELEFONICA.COM', telefone: '-', ip: '177.18.99.102', dataHora: '09/06/2026 às 11:35:08', tipoAcesso: 'Link de Convocação' },
          { id: '2277861', nome: 'ADRIANO DOS SANTOS SILVA', matricula: '63201', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ADRIANO.SSILVA@TELEFONICA.COM', telefone: '-', ip: '189.44.12.87', dataHora: '09/06/2026 às 11:41:50', tipoAcesso: 'Link de Convocação' },
          { id: '2277870', nome: 'ALAN DE SOUZA OLIVEIRA', matricula: '77410', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ALAN.SOUZA@TELEFONICA.COM', telefone: '-', ip: '162.10.28.19', dataHora: '09/06/2026 às 11:58:33', tipoAcesso: 'Link de Convocação' },
          { id: '2277879', nome: 'ALESSANDRO RICARDO PINTO', matricula: '38192', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ALESSANDRO.PINTO@TELEFONICA.COM', telefone: '-', ip: '179.184.21.05', dataHora: '09/06/2026 às 12:04:19', tipoAcesso: 'Link de Convocação' },
          { id: '2277884', nome: 'ALINE CRISTINA DE SOUZA', matricula: '51902', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ALINE.SOUZA@TELEFONICA.COM', telefone: '-', ip: '162.10.35.12', dataHora: '09/06/2026 às 12:15:02', tipoAcesso: 'Link de Convocação' },
          { id: '2277892', nome: 'ANA PAULA FERREIRA LIMA', matricula: '82143', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ANA.LIMA@TELEFONICA.COM', telefone: '-', ip: '186.204.11.90', dataHora: '09/06/2026 às 12:30:44', tipoAcesso: 'Link de Convocação' },
          { id: '2277901', nome: 'ANDERSON LUIS RODRIGUES', matricula: '29871', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ANDERSON.RODRIGUES@TELEFONICA.COM', telefone: '-', ip: '162.10.28.22', dataHora: '09/06/2026 às 12:45:11', tipoAcesso: 'Link de Convocação' },
          { id: '2277915', nome: 'ANDRESSA CRISTINE NUNES', matricula: '19045', cnpj: unitCnpj, entidade: 'SP MTZ ECOBERRI', email: 'ANDRESSA.NUNES@TELEFONICA.COM', telefone: '-', ip: '177.102.44.18', dataHora: '09/06/2026 às 13:01:29', tipoAcesso: 'Link de Convocação' }
        ];

        return {
          title: `RELATÓRIO DE ELEIÇÃO VIRTUAL DE MEMBROS DA CIPAA - QUÓRUM`,
          category: 'Auditoria de Quórum e Votantes',
          normativeCode: 'NR-05 · Subitem 5.5.4 · Sigilo do Voto',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataGeracao,
          content: [
            `RELATÓRIO DE ELEIÇÃO VIRTUAL DE MEMBROS DA CIPAA - QUÓRUM`,
            `DADOS DO EVENTO ELEITORAL (Horário de Brasília - BRT):`,
            `• DATA DE GERAÇÃO: ${dataGeracao}`,
            `• GERADO POR: Assembleias Virtuais / CIPA Expert`,
            `• NOME: ${compNome} | CIPA - ${unitName} ${gestaoAno}`,
            `• PERÍODO DE REALIZAÇÃO DA ELEIÇÃO: ${periodoEleicao}`,
            `• QUÓRUM ATINGIDO: ${percentualQuorum}%`,
            `• DESCRIÇÃO: VOTAÇÃO - CIPA On-line - ${unitName} - ${unitAddress} - Gestão ${gestaoAno} - CNPJ: ${unitCnpj}`,
            `• REALIZADOR DA VOTAÇÃO: ${compNome} CIPA ${unitName}`,
            `• CNPJ DO REALIZADOR: ${unitCnpj}`,
            `• TOTAL DE COLABORADORES: ${totalAptos}`,
            `• COLABORADORES HABILITADOS AO VOTO: ${totalAptos}`,
            `• QUÓRUM MÍNIMO EXIGIDO: ${quorumMinimo}`,
            `• QUÓRUM DA VOTAÇÃO (TOTAL DE VOTANTES): ${totalVotantes}`,
            `• VOTO SECRETO: SIM`,
            `• ACOMPANHAMENTO DE QUÓRUM: SIM`,
            `• ACOMPANHAMENTO DO RESULTADO: NÃO`,
            `• ALTERAÇÃO APÓS EVENTO INICIADO? NÃO`,
            `MEMBROS DA COMISSÃO ELEITORAL:`,
            `| Nome | Cargo / Função |`,
            `| :--- | :--- |`,
            `| ${presComissao} | Presidente da Comissão Eleitoral |`,
            `| ${secComissao} | Secretário(a) / Técnico de Segurança do Trabalho |`,
            `RELAÇÃO NOMINAL DOS VOTANTES NO PLEITO (${periodoEleicao}):`,
            `| ID | Nome do Colaborador | Código de Acesso (RE) | CNPJ | Entidade Representada | E-mail | IP de Origem | Data/Hora da Votação | Tipo de Acesso |`,
            `| :---: | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :---: |`,
            ...votantes.map(v => `| ${v.id || '-'} | ${v.nome} | ${v.matricula || '-'} | ${v.cnpj || unitCnpj} | ${v.entidade || unitName} | ${v.email || '-'} | ${v.ip || '162.10.28.18'} | ${v.dataHora || '09/06/2026 às 11:16:42'} | ${v.tipoAcesso || 'Link de Convocação'} |`),
            `GARANTIA DE SIGILO ABSOLUTO DO VOTO (NR-05):`,
            `Em conformidade com as diretrizes do subitem 5.5.3 da NR-05 e as melhores práticas mundiais de segurança da informação eleitoral, este relatório atesta UNICAMENTE o comparecimento e exercício de voto para fins de apuração de quórum legal. É tecnicamente impossível associar qualquer eleitor ao seu voto individual, preservando a inviolabilidade do sufrágio.`,
            `Para verificação do certificado digital deste documento acesse: https://validar.iti.gov.br/`
          ],
          signatories: [
            `${presComissao} - Presidente da Comissão Eleitoral`,
            `${secComissao} - Técnico de Segurança do Trabalho / Secretário`,
            `${compNome} - Representante Legal da Empresa`
          ]
        };
      }

      case 'relatorio_participantes': {
        const unitName = extraData?.unitName || 'Unidade Eco Berrini';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'TELEFONICA BRASIL S/A';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0001-62';
        const unitAddress = extraData?.unitAddress || 'Av. Engenheiro Luiz Carlos Berrini, 1376 - São Paulo - SP';
        const ap = extraData?.apuracao;
        const totalAptos = ap?.totalEleitoresAptos || extraData?.votantesHabilitados || 7964;
        const totalVotantes = ap?.totalVotantes || 2919;
        const totalAcessos = Math.round(totalVotantes * 1.01);
        const quorumMinimo = ap?.quorumMinimo || Math.floor(totalAptos / 2) + 1;
        const dataGeracao = formattedDate + ' às 18:00';
        const periodoEleicao = extraData?.periodoEleicao || (extraData?.cronogramaDatas?.eleicao ? `${extraData.cronogramaDatas.eleicao} das 08:30h às 18:00h` : '09/06/2026 das 08:30h às 18:00h');
        const presComissao = extraData?.comissaoPresidente || 'Tamires Santos de Souza';
        const secComissao = extraData?.comissaoVice || 'Luiz Alberto De Barros Junior';

        const participantes = extraData?.votantesList || [
          { id: '2277846', nome: 'ABEL SILVA FORTES CARDOSO', matricula: '18293', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ABEL.CARDOSO@TELEFONICA.COM', telefone: '-', votou: true, ip: '162.10.28.18', primeiroAcesso: '09/06/2026 às 11:15:20', ultimoAcesso: '09/06/2026 às 11:16:42' },
          { id: '2277850', nome: 'ABNER RODRIGUES DA SILVA', matricula: '95797', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ABNER.RSILVA@TELEFONICA.COM', telefone: '-', votou: true, ip: '162.10.30.45', primeiroAcesso: '09/06/2026 às 11:20:10', ultimoAcesso: '09/06/2026 às 11:22:15' },
          { id: '2277855', nome: 'ADRIANA DIAS DE MORAES', matricula: '44812', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ADRIANA.MORAES@TELEFONICA.COM', telefone: '-', votou: true, ip: '177.18.99.102', primeiroAcesso: '09/06/2026 às 11:32:04', ultimoAcesso: '09/06/2026 às 11:35:08' },
          { id: '2277861', nome: 'ADRIANO DOS SANTOS SILVA', matricula: '63201', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ADRIANO.SSILVA@TELEFONICA.COM', telefone: '-', votou: true, ip: '189.44.12.87', primeiroAcesso: '09/06/2026 às 11:39:15', ultimoAcesso: '09/06/2026 às 11:41:50' },
          { id: '2277868', nome: 'AGATA BEATRIZ SANTOS', matricula: '88124', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'AGATA.SANTOS@TELEFONICA.COM', telefone: '-', votou: false, ip: '177.20.15.33', primeiroAcesso: '09/06/2026 às 14:10:02', ultimoAcesso: '09/06/2026 às 14:11:15' },
          { id: '2277870', nome: 'ALAN DE SOUZA OLIVEIRA', matricula: '77410', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ALAN.SOUZA@TELEFONICA.COM', telefone: '-', votou: true, ip: '162.10.28.19', primeiroAcesso: '09/06/2026 às 11:55:00', ultimoAcesso: '09/06/2026 às 11:58:33' },
          { id: '2277875', nome: 'ALBERTO MENDES VIEIRA', matricula: '61209', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ALBERTO.VIEIRA@TELEFONICA.COM', telefone: '-', votou: false, ip: '189.30.12.98', primeiroAcesso: '09/06/2026 às 16:02:11', ultimoAcesso: '09/06/2026 às 16:03:40' },
          { id: '2277879', nome: 'ALESSANDRO RICARDO PINTO', matricula: '38192', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ALESSANDRO.PINTO@TELEFONICA.COM', telefone: '-', votou: true, ip: '179.184.21.05', primeiroAcesso: '09/06/2026 às 12:00:22', ultimoAcesso: '09/06/2026 às 12:04:19' },
          { id: '2277884', nome: 'ALINE CRISTINA DE SOUZA', matricula: '51902', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ALINE.SOUZA@TELEFONICA.COM', telefone: '-', votou: true, ip: '162.10.35.12', primeiroAcesso: '09/06/2026 às 12:12:40', ultimoAcesso: '09/06/2026 às 12:15:02' },
          { id: '2277892', nome: 'ANA PAULA FERREIRA LIMA', matricula: '82143', entidade: 'SP MTZ ECOBERRI', cnpj: unitCnpj, email: 'ANA.LIMA@TELEFONICA.COM', telefone: '-', votou: true, ip: '186.204.11.90', primeiroAcesso: '09/06/2026 às 12:28:19', ultimoAcesso: '09/06/2026 às 12:30:44' }
        ];

        return {
          title: `RELATÓRIO DE ACESSOS DOS PARTICIPANTES`,
          category: 'Auditoria de Acessos e Participação',
          normativeCode: 'NR-05 · Auditoria Digital de Sistemas Eleitorais',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataGeracao,
          content: [
            `RELATÓRIO DE ACESSOS DOS PARTICIPANTES`,
            `DADOS DO EVENTO ELEITORAL (Horário de Brasília - BRT):`,
            `• DATA DE GERAÇÃO: ${dataGeracao}`,
            `• GERADO POR: Assembleias Virtuais / CIPA Expert`,
            `• NOME DA VOTAÇÃO: ${compNome} | CIPA - ${unitName} ${gestaoAno}`,
            `• PERÍODO DE REALIZAÇÃO DA VOTAÇÃO: ${periodoEleicao}`,
            `• DESCRIÇÃO DA VOTAÇÃO: VOTAÇÃO - CIPA On-line - ${unitName} - ${unitAddress} - Gestão ${gestaoAno} - CNPJ: ${unitCnpj}`,
            `• REALIZADOR DA VOTAÇÃO: ${compNome} CIPA ${unitName}`,
            `• CNPJ DO REALIZADOR: ${unitCnpj}`,
            `PARÂMETROS DE CONTROLE E ACESSOS:`,
            `• VOTO EM SEPARADO: NÃO`,
            `• TOTAL DE COLABORADORES: ${totalAptos}`,
            `• COLABORADORES HABILITADOS AO VOTO: ${totalAptos}`,
            `• QUÓRUM MÍNIMO: ${quorumMinimo}`,
            `• ACESSOS À VOTAÇÃO: ${totalAcessos}`,
            `• QUÓRUM DA VOTAÇÃO: ${totalVotantes}`,
            `• VOTAÇÃO COM PESO: NÃO`,
            `• VOTO SECRETO: SIM`,
            `• ACOMPANHAMENTO DE QUÓRUM: SIM`,
            `• REALIZAÇÃO DE VÍDEOCONFERÊNCIA INTEGRADA: NÃO`,
            `• ALTERAÇÃO APÓS EVENTO INICIADO? NÃO`,
            `MEMBROS DA COMISSÃO ELEITORAL:`,
            `| Nome | Cargo |`,
            `| :--- | :--- |`,
            `| ${presComissao} | Técnico de Segurança do Trabalho / Presidente da Comissão |`,
            `| ${secComissao} | Representante dos Empregados / Secretário |`,
            `LOG COMPLETO DE ACESSO DOS PARTICIPANTES:`,
            `| ID | Nome do Colaborador | Código de Acesso (RE) | Entidade Representada | CNPJ | E-mail | Registro de Voto | IP de Acesso | Primeiro Acesso | Último Acesso |`,
            `| :---: | :--- | :---: | :--- | :---: | :--- | :---: | :---: | :---: | :---: |`,
            ...participantes.map(p => `| ${p.id || '-'} | ${p.nome} | ${p.matricula || '-'} | ${p.entidade || unitName} | ${p.cnpj || unitCnpj} | ${p.email || '-'} | ${p.votou ? 'Votou' : 'Não Votou'} | ${p.ip || '162.10.28.18'} | ${p.primeiroAcesso || '09/06/2026 às 11:15:20'} | ${p.ultimoAcesso || '09/06/2026 às 11:16:42'} |`),
            `CERTIFICAÇÃO DE REGISTRO E ACESSO AUDITÁVEL:`,
            `O sistema CIPA Expert armazena os metadados de tráfego, headers HTTP, carimbo UTC/BRT e endereçamento IP em conformidade com o Marco Civil da Internet (Lei 12.965/2014) e LGPD (Lei 13.709/2018), resguardando o direito ao voto secreto e à auditoria técnica forense.`,
            `Para verificação do certificado digital deste documento acesse: https://validar.iti.gov.br/`
          ],
          signatories: [
            `${presComissao} - Presidente da Comissão Eleitoral`,
            `${secComissao} - Secretário(a) da Comissão Eleitoral`,
            `${compNome} - Representante Legal da Empresa`
          ]
        };
      }

      case 'relatorio_permissao_acesso': {
        const unitName = extraData?.unitName || 'Unidade Eco Berrini';
        const gestaoAno = extraData?.gestaoAno || '2026/2027';
        const compNome = companyName || 'TELEFONICA BRASIL S/A';
        const unitCnpj = extraData?.unitCnpj || cnpj || '02.558.157/0001-62';
        const unitAddress = extraData?.unitAddress || 'Av. Engenheiro Luiz Carlos Berrini, 1376 - São Paulo - SP';
        const ap = extraData?.apuracao;
        const totalAptos = ap?.totalEleitoresAptos || extraData?.votantesHabilitados || 7964;
        const quorumMinimo = ap?.quorumMinimo || Math.floor(totalAptos / 2) + 1;
        const dataGeracao = formattedDate + ' às 18:00';
        const periodoEleicao = extraData?.periodoEleicao || (extraData?.cronogramaDatas?.eleicao ? `${extraData.cronogramaDatas.eleicao} das 08:30h às 18:00h` : '09/06/2026 das 08:30h às 18:00h');
        const prorrogacao1 = extraData?.prorrogacao1Periodo || '10/06/2026(qua) das 08:30h às 18:00h';
        const prorrogacao2 = extraData?.prorrogacao2Periodo || '11/06/2026(qui) das 08:30h às 18:00h';
        const presComissao = extraData?.comissaoPresidente || 'Tamires Santos de Souza';
        const secComissao = extraData?.comissaoVice || 'Luiz Alberto De Barros Junior';

        return {
          title: `RELATÓRIO DE ALTERAÇÃO DE PERMISSÃO DE ACESSO`,
          category: 'Segurança e Auditoria de Acesso',
          normativeCode: 'NR-05 · Portaria MTP nº 422/2021 · ICP-Brasil MP 2.200-2/2001',
          companyName: compNome,
          cnpj: unitCnpj,
          dateGenerated: dataGeracao,
          content: [
            `RELATÓRIO DE ALTERAÇÃO DE PERMISSÃO DE ACESSO`,
            `DADOS DO EVENTO ELEITORAL (Horário de Brasília - BRT):`,
            `• DATA DE GERAÇÃO: ${dataGeracao}`,
            `• GERADO POR: Assembleias Virtuais / CIPA Expert`,
            `• NOME DA VOTAÇÃO: ${compNome} | CIPA - ${unitName} ${gestaoAno}`,
            `• PERÍODO DE REALIZAÇÃO DA VOTAÇÃO: ${periodoEleicao}`,
            ...(extraData?.prorrogacao1Periodo ? [
              `• PERÍODO DA 1º PRORROGAÇÃO: ${prorrogacao1}`,
              `• PERÍODO DA 2º PRORROGAÇÃO: ${prorrogacao2}`
            ] : []),
            `• DESCRIÇÃO DA VOTAÇÃO: VOTAÇÃO - CIPA On-line - ${unitName} - ${unitAddress} - Gestão ${gestaoAno} - CNPJ: ${unitCnpj}`,
            `• REALIZADOR DA VOTAÇÃO: ${compNome} CIPA ${unitName}`,
            `• CNPJ DO REALIZADOR: ${unitCnpj}`,
            `PARÂMETROS DE CONTROLE E SEGURANÇA:`,
            `• VOTO EM SEPARADO: NÃO`,
            `• INCLUSÃO DE PAUTAS DURANTE A VOTAÇÃO: NÃO`,
            `• VOTAÇÃO COM PESO: NÃO`,
            `• VOTO SECRETO: SIM`,
            `• ACOMPANHAMENTO DE QUÓRUM: SIM`,
            `• CONVOCAÇÃO DE VOTAÇÃO: SIM`,
            `• TOTAL DE PARTICIPANTES: ${totalAptos}`,
            `• PARTICIPANTES HABILITADOS AO VOTO: ${totalAptos}`,
            `• QUÓRUM MÍNIMO: ${quorumMinimo}`,
            `• REALIZAÇÃO DE VÍDEOCONFERÊNCIA INTEGRADA: NÃO`,
            `• ALTERAÇÃO APÓS EVENTO INICIADO? NÃO`,
            `CERTIFICAÇÃO TÉCNICA DE AUDITORIA:`,
            `SEM ALTERAÇÃO NA PERMISSÃO DE ACESSO DOS PARTICIPANTES`,
            `Atesta-se perante os órgãos fiscalizadores do trabalho, sindicatos e comunidade interna que a base de dados de eleitores habilitados permaneceu integralmente congelada e inalterada durante toda a realização do escrutínio. Nenhuma conta de usuário ou permissão de acesso foi adicionada, revogada ou editada após a abertura oficial do certame eleitoral, garantindo a lisura, imparcialidade e conformidade absoluta com a Norma Regulamentadora nº 05 do Ministério do Trabalho e Emprego.`,
            `Para verificação do certificado digital deste documento acesse: https://validar.iti.gov.br/`
          ],
          signatories: [
            `${presComissao} - Presidente da Comissão Eleitoral`,
            `${secComissao} - Secretário(a) da Comissão Eleitoral`,
            `${compNome} - Representante Legal da Empresa`
          ]
        };
      }

      default:
        return {
          title: 'ATA DE REUNIÃO ORDINÁRIA DA CIPA',
          category: 'Reunião Mensal',
          normativeCode: 'NR-5 - Item 5.6.1 e Lei 14.457/2022',
          companyName,
          cnpj,
          dateGenerated: formattedDate,
          content: [
            `Reuniram-se ordinariamente os membros da Comissão Interna de Prevenção de Acidentes e Assédio da ${companyName}.`,
            `PAUTA: 1. Acompanhamento dos indicadores de acidentes e quase-acidentes do mês anterior; 2. Avaliação do Mapa de Riscos e inspeções setoriais realizadas; 3. Implementação e revisão do Canal de Denúncias e ações preventivas contra assédio moral e sexual no ambiente de trabalho (Lei 14.457/22); 4. Status de execução do Plano de Ação 5W2H; 5. Programação preliminar da SIPAT 2026.`,
            `DELIBERAÇÕES: Aprovadas as medidas corretivas para o setor produtivo; deliberada a realização de blitz educativa sobre assédio em parceria com o RH; agendada vistoria conjunta com o SESMT para a próxima terça-feira.`,
            `DOCUMENTO COM VALIDADE JURÍDICA: Esta ata é lavrada em conformidade com o Artigo 10 da MP 2.200-2/2001 e NR-5 item 5.6.3, assinada digitalmente pelos participantes cadastrados na plataforma CIPA Expert.`
          ],
          signatories: [
            'Presidente da CIPA',
            'Vice-Presidente da CIPA',
            'Secretário(a) da CIPA',
            'Membros Participantes'
          ]
        };
    }
  };

  const rawDoc = buildDoc();
  return {
    ...rawDoc,
    logoUrl: extraData?.logoUrl,
    unitName: extraData?.unitName,
    unitAddress: extraData?.unitAddress,
    unitCity: extraData?.unitCity,
    unitState: extraData?.unitState,
    unitCep: extraData?.unitCep,
    gestaoAno: extraData?.gestaoAno || '2026/2027',
    eleicaoLink: extraData?.eleicaoLink || rawDoc.eleicaoLink,
    electionToken: extraData?.electionToken || rawDoc.electionToken,
    qrCodeDataUrl: extraData?.qrCodeDataUrl
  };
}
