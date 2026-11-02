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
    comissaoVice?: string;
    comissaoViceRe?: string;
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

    case 'edital_inscricao':
      return {
        title: 'EDITAL DE ABERTURA DE INSCRIÇÃO DE CANDIDATOS À CIPA',
        category: 'Inscrições',
        normativeCode: 'NR-5 - Item 5.5.3',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `A Comissão Eleitoral da empresa ${companyName} comunica a todos os colaboradores que encontram-se abertas as inscrições para candidatos a representantes dos empregados na CIPA - Gestão 2026/2027.`,
          `1. Período de Inscrição: Duração de 15 (quinze) dias corridos a partir desta data, encerrando-se impreterivelmente às 18h00 do último dia útil do período.`,
          `2. Como se inscrever: Pela plataforma digital CIPA Expert, informando matrícula, CPF, foto e mini-currículo de prevenção.`,
          `3. Condições: Estar devidamente registrado como colaborador efetivo. É vedada qualquer discriminação ou impedimento unilateral por parte da liderança. O candidato inscrito goza de garantia provisória de emprego conforme artigo 10, II, "a" do ADCT e NR-5 item 5.4.12.`
        ],
        signatories: [
          'Presidente da Comissão Eleitoral',
          'Secretária da Comissão Eleitoral'
        ]
      };

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

    case 'comprovante_inscricao':
      return {
        title: 'COMPROVANTE DE INSCRIÇÃO DE CANDIDATO À CIPA',
        category: 'Inscrição Individual',
        normativeCode: 'NR-5 - Item 5.5.3.1',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `A Comissão Eleitoral da empresa ${companyName} certifica e protocola que o(a) colaborador(a) formalizou sua candidatura ao processo eleitoral da CIPA - Mandato 2026/2027.`,
          `PROTOCOLOS REGISTRADOS:`,
          `1. Identificação: Candidatura individual espontânea com envio tempestivo de dados cadastrais.`,
          `2. Garantia de Emprego: O candidato inscrito goza de estabilidade provisória no emprego desde a inscrição até um ano após o final do mandato, caso eleito, nos moldes do art. 10, II, 'a' do ADCT da CF/88 e item 5.4.12 da NR-5.`,
          `3. Compromisso: O candidato assume a obrigação de participar do treinamento obrigatório e cumprir as atribuições regimentais da CIPA e da Lei 14.457/2022.`
        ],
        signatories: [
          'Presidente da Comissão Eleitoral',
          'Candidato(a) Inscrito(a)'
        ]
      };

    case 'lista_candidatos':
      return {
        title: 'EDITAL COM RELAÇÃO OFICIAL DE CANDIDATOS INSCRITOS',
        category: 'Homologação de Candidaturas',
        normativeCode: 'NR-5 - Item 5.5.3.2',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `A Comissão Eleitoral da empresa ${companyName}, no uso de suas atribuições regimentais, torna pública a lista oficial dos candidatos deferidos para a eleição da CIPA - Gestão 2026/2027.`,
          `Todas as candidaturas foram validadas e cumpriram integralmente os requisitos de elegibilidade previstos na NR-5. Não houve impugnações no prazo legal de 24 horas.`,
          `A votação terá início conforme calendário eleitoral publicado, mediante cédula e urna eletrônica auditada CIPA Expert com escrutínio secreto.`
        ],
        signatories: [
          'Coordenador da Comissão Eleitoral',
          'Secretário da Comissão Eleitoral'
        ]
      };

    case 'cedula_urna':
      return {
        title: 'PROTOCOLO DE LACRAÇÃO E CÉDULA DA URNA ELETRÔNICA',
        category: 'Votação e Escrutínio',
        normativeCode: 'NR-5 - Item 5.5.4',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `Aos dias indicados, a Comissão Eleitoral da empresa ${companyName} realizou a cerimônia de 'Zerésima' e lacração da Urna Eletrônica Digital da plataforma CIPA Expert.`,
          `1. Zerésima: Constatou-se a inexistência de quaisquer votos prévios registrados no banco de dados.`,
          `2. Criptografia e Sigilo: O sistema garante o desacoplamento irreversível entre a identidade do votante e o voto computado, assegurando sigilo absoluto nos termos da NR-5 e LGPD.`,
          `3. Auditoria: Todo o processo eleitoral conta com trilha imutável de logs e chave hash criptográfica SHA-256.`
        ],
        signatories: [
          'Presidente da Comissão Eleitoral',
          'Auditor / Técnico SST',
          'Representante dos Empregados'
        ]
      };

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
