export interface GeneratedDocument {
  title: string;
  category: string;
  normativeCode: string;
  companyName: string;
  cnpj: string;
  dateGenerated: string;
  content: string[];
  signatories: string[];
}

export function generateCipaDocument(
  tipo: string,
  companyName: string = 'Indústrias Alfa Brasil S.A.',
  cnpj: string = '12.345.678/0001-90',
  dataBase: string = '2026-10-15',
  membrosCount: number = 8,
  extraData?: { 
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
  }
): GeneratedDocument {
  const formattedDate = new Date(dataBase).toLocaleDateString('pt-BR');
  const c = extraData?.cronogramaDatas;

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
          `Treinamento membros 20h: ${dataTreinamento}`,
          `Treinamento presencial: ${dataTreinamentoPresencial}`,
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
          `CIPA · Comissão Interna de Prevenção de Acidentes e Assédio`,
          `${unitName} - Gestão ${gestaoAno}`,
          `Edital de Convocação da CIPA - ${unitName} - ${unitState}`,
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
          `Treinamento membros 20h: ${dataTreinamento}`,
          `Treinamento presencial 4h: ${dataTreinamentoPresencial}`,
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
      } catch {}

      return {
        title: 'ATA DE FORMAÇÃO DA COMISSÃO ELEITORAL',
        category: 'Comissão Eleitoral',
        normativeCode: 'NR-5 · Subitem 5.5.2',
        companyName: compNome,
        cnpj: unitCnpj,
        dateGenerated: dataReuniao,
        content: [
          `ATA DE FORMAÇÃO DA COMISSÃO ELEITORAL`,
          `${unitName.toUpperCase()}, ${unitCity.toUpperCase()} - ${unitState.toUpperCase()} - GESTÃO ${gestaoAno}`,
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

      // Link e QR Code únicos e exclusivos para a votação / eleição
      const electionToken = extraData?.electionToken || '2lsCc1wU4b3qgsXcjGJKVy6dUbqX0l';
      const linkInscricao = extraData?.eleicaoLink || `https://assembleia.grtsdigital.com.br/${electionToken}/preInscricao`;

      return {
        title: `Edital de Inscrições da CIPA ${gestaoAno}`,
        category: 'Inscrições e Eleição',
        normativeCode: 'NR-5 · Subitem 5.5.2.1',
        companyName: compNome,
        cnpj: unitCnpj,
        dateGenerated: c?.editalInscricao || formattedDate || '21/09/2026',
        content: [
          `Edital de Inscrições da CIPA ${gestaoAno}`,
          `Unidade ${unitName} - ${unitState}`,
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

    case 'ata_eleicao':
      return {
        title: 'ATA DE ELEIÇÃO E APURAÇÃO DOS VOTOS DA CIPA',
        category: 'Ata Eleitoral',
        normativeCode: 'NR-5 - Itens 5.5.4 a 5.5.9',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `Aos dias indicados, nas dependências da empresa ${companyName} e em sua plataforma eletrônica segura de votação auditada CIPA Expert, reuniu-se a Comissão Eleitoral para realizar a apuração dos votos da eleição para membros da CIPA - Gestão 2026/2027.`,
          `1. Quórum: Constatou-se a participação de mais de 50% dos empregados aptos a votar em primeiro escrutínio, cumprindo rigorosamente a exigência do subitem 5.5.4 da NR-5.`,
          `2. Apuração: Concluída a votação secreta, foram abertos os registros criptográficos dos votos gerados no sistema inviolável, sem qualquer voto em duplicidade.`,
          `3. Resultado: Proclamados os eleitos por ordem decrescente de votos recebidos, classificando-se como Membros Titulares e Membros Suplentes, registrando-se os critérios normativos de desempate por tempo de serviço na empresa.`
        ],
        signatories: [
          'Presidente da Comissão Eleitoral',
          'Representante dos Empregados Eleito Mais Votado',
          'Testemunha 1 (Auditor Interno)',
          'Testemunha 2 (Técnico de Segurança do Trabalho)'
        ]
      };

    case 'ata_posse':
      return {
        title: 'ATA DE INSTALAÇÃO E POSSE DA CIPA',
        category: 'Posse e Mandato',
        normativeCode: 'NR-5 - Item 5.5.10 e seguintes',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `No primeiro dia útil após o término do mandato anterior, reuniram-se os membros eleitos pelos empregados e os membros designados pelo empregador da empresa ${companyName} para a Sessão Solene de Instalação e Posse da CIPA para o mandato 2026/2027.`,
          `O Empregador designou para Presidente da CIPA o colaborador indicado nos termos da NR-5. Dentre os membros eleitos pelos trabalhadores, foi aclamado(a) o(a) Vice-Presidente da CIPA. Foram designados de comum acordo o Secretário e seu substituto.`,
          `Todos os membros concluíram o treinamento obrigatório de formação da CIPA (com carga horária normativa e módulo obrigatório sobre prevenção e combate ao assédio sexual e a outras formas de violência no trabalho, conforme Lei 14.457/2022).`,
          `Os empossados assumem o compromisso de zelar pela integridade física e psíquica de todos os trabalhadores da empresa.`
        ],
        signatories: [
          'Diretor Geral / Empregador',
          'Presidente Empossado da CIPA',
          'Vice-Presidente Empossado da CIPA',
          'Secretário(a) da CIPA'
        ]
      };

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
          `RELATÓRIO DE APROVAÇÃO DE INSCRIÇÕES`,
          `DATA DE GERAÇÃO (Horário de Brasília - BRT) ${dataGeracao}`,
          `GERADO POR: ${geradoPor}`,
          `NOME DA CIPAA ${compNome} | CIPA ${unitName} ${gestaoAno}`,
          `PERÍODO DE REALIZAÇÃO DA VOTAÇÃO (Horário de Brasília - BRT): ${dataEleicao}`,
          `PERÍODO DA 1º PRORROGAÇÃO (Horário de Brasília - BRT): ${dataProrrogacao1}`,
          `PERÍODO DA 2º PRORROGAÇÃO (Horário de Brasília - BRT): ${dataProrrogacao2}`,
          `DESCRIÇÃO DA CIPAA: Descrição do ${compNome} | CIPA ${unitName} ${gestaoAno}`,
          `REALIZADOR DA CIPAA ${compNome.toUpperCase()} CIPA - ${unitName.toUpperCase()}`,
          `CNPJ DO REALIZADOR ${unitCnpj}`,
          `INCLUSÃO DE PAUTAS DURANTE A VOTAÇÃO: NÃO`,
          `VOTAÇÃO COM PESO NÃO`,
          `VOTO SECRETO: SIM`,
          `ACOMPANHAMENTO DE QUÓRUM: SIM`,
          `CONVOCAÇÃO DE CIPAA: SIM`,
          `VOTANTES HABILITADOS: ${votantesHabilitados}`,
          `QUÓRUM MÍNIMO ${quorumMinimo}`,
          `REALIZAÇÃO DE VIDEO CONFERÊNCIA INTEGRADA NÃO`,
          `TÍTULO DA PAUTA: ${compNome} | CIPA ${unitName} ${gestaoAno}`,
          `DESCRIÇÃO DA PAUTA: Descrição do ${compNome} | CIPA ${unitName} ${gestaoAno}`,
          `ACOMPANHAMENTO DO RESULTADO DAS VOTAÇÕES: NÃO`,
          `INÍCIO DO PERÍODO DE INSCRIÇÕES: ${inscricaoInicio}`,
          `FIM DO PERÍODO DE INSCRIÇÕES: ${inscricaoFim}`,
          `APROVADO POR: ${aprovadoPor}`,
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
          `Votação da CIPA (on-line)`,
          `${unitName}`,
          `Gestão ${gestaoAno}`,
          `Chegou o momento de votar no seu representante da CIPA!`,
          `A votação será registrada de forma online e é exclusiva para colaboradores lotados no CNPJ ${unitCnpj}`,
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

    case 'certificado_treinamento':
      return {
        title: 'CERTIFICADO DE TREINAMENTO OBRIGATÓRIO DA CIPA',
        category: 'Capacitação e Treinamento',
        normativeCode: 'NR-5 - Item 5.7 & Lei 14.457/2022',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `Certificamos que os membros eleitos e indicados da CIPA da empresa ${companyName} concluíram com aproveitamento satisfatório o Treinamento Obrigatório para Membros da CIPA, com carga horária compatível com o Grau de Risco da unidade.`,
          `CONTEÚDO PROGRAMÁTICO OBRIGATÓRIO (NR-5 item 5.7):`,
          `a) Estudo do ambiente, das condições de trabalho e dos riscos originados do processo produtivo;`,
          `b) Metodologia de investigação e análise de acidentes e doenças relacionadas ao trabalho;`,
          `c) Noções sobre acidentes e doenças relacionadas ao trabalho decorrentes da exposição aos riscos;`,
          `d) Noções sobre inclusão de pessoas com deficiência e reabilitados nos processos de trabalho;`,
          `e) PREVENÇÃO E COMBATE AO ASSÉDIO SEXUAL E A TODAS AS FORMAS DE VIOLÊNCIA NO TRABALHO (Módulo Obrigatório Lei nº 14.457/2022);`,
          `f) Legislação trabalhista e previdenciária relativa à segurança e saúde no trabalho.`
        ],
        signatories: [
          'Instrutor Responsável / Engenheiro de Segurança',
          'Diretoria da Empresa / Empregador',
          'Presidente da CIPA'
        ]
      };

    case 'calendario_reunioes':
      return {
        title: 'CALENDÁRIO ANUAL DE REUNIÕES ORDINÁRIAS DA CIPA',
        category: 'Planejamento Anual',
        normativeCode: 'NR-5 - Item 5.6.1',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `Fica estabelecido o Calendário Anual de Reuniões Ordinárias da CIPA da empresa ${companyName} para o mandato 2026/2027.`,
          `As reuniões ordinárias serão realizadas mensalmente em dia e horário preestabelecidos durante o expediente normal de trabalho da empresa, com lavratura obrigatória de ata e envio para assinatura eletrônica de todos os presentes.`,
          `A pauta de todas as reuniões contemplará o acompanhamento das ações preventivas e do canal de denúncias previsto pela Lei 14.457/2022.`
        ],
        signatories: [
          'Presidente da CIPA',
          'Vice-Presidente da CIPA',
          'Secretário(a) da CIPA'
        ]
      };

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
}
