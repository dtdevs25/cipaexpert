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
    sindicatoNome?: string; 
    sindicatoEmail?: string;
    cronogramaDatas?: {
      inscricaoInicio?: string;
      inscricaoFim?: string;
      eleicao?: string;
      apuracao?: string;
      treinamento?: string;
      posse?: string;
    };
  }
): GeneratedDocument {
  const formattedDate = new Date(dataBase).toLocaleDateString('pt-BR');
  const nomeSindicato = extraData?.sindicatoNome || 'Sindicato Profissional da Categoria dos Trabalhadores';
  const c = extraData?.cronogramaDatas;

  switch (tipo) {
    case 'comunicado_sindicato':
      return {
        title: 'COMUNICAÇÃO DE INÍCIO DO PROCESSO ELEITORAL AO SINDICATO',
        category: 'Comunicação Sindical',
        normativeCode: 'NR-5 · Prazos & Calendário Oficial',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `À Diretoria do ${nomeSindicato}:`,
          `Comunicamos o início oficial do Processo Eleitoral para constituição da CIPA da empresa ${companyName}, inscrita no CNPJ sob o nº ${cnpj}.`,
          `Seguem as datas dos principais marcos do processo eleitoral para conhecimento e acompanhamento dessa entidade sindical:`,
          `• PERÍODO DE INSCRIÇÃO DE CANDIDATOS: de ${c?.inscricaoInicio || 'Início das Inscrições'} até ${c?.inscricaoFim || 'Término das Inscrições'}`,
          `• DIA DA ELEIÇÃO (VOTAÇÃO): ${c?.eleicao || formattedDate}`,
          `• DIA DA APURAÇÃO E DIVULGAÇÃO DO RESULTADO: ${c?.apuracao || formattedDate}`,
          `• PERÍODO DE TREINAMENTO OBRIGATÓRIO: ${c?.treinamento || 'Anterior à Posse'}`,
          `• DIA DA INSTALAÇÃO E POSSE SOLENE: ${c?.posse || formattedDate}`,
          `A votação será realizada via sistema eletrônico seguro CIPA Expert com sigilo absoluto do voto.`
        ],
        signatories: [
          'Representante Legal da Empresa',
          `Protocolo de Recebimento do ${nomeSindicato}`
        ]
      };

    case 'edital_convocacao':
      return {
        title: 'EDITAL DE CONVOCAÇÃO PARA ELEIÇÃO DA CIPA',
        category: 'Processo Eleitoral',
        normativeCode: 'NR-5 - Item 5.5.1',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `Ficam convocados todos os empregados da empresa ${companyName}, inscrita no CNPJ sob o nº ${cnpj}, para a eleição dos representantes dos empregados na Comissão Interna de Prevenção de Acidentes e Assédio (CIPA), para a gestão 2026/2027.`,
          `A presente convocação é realizada em estrita observância à Norma Regulamentadora nº 05 (NR-5) do Ministério do Trabalho e Emprego e à Lei Federal nº 14.457/2022.`,
          `O processo eleitoral será conduzido pela Comissão Eleitoral constituída, e a votação será realizada através do sistema de votação eletrônica segura CIPA Expert, garantindo escrutínio secreto, unicidade de voto e inviolabilidade da urna digital.`,
          `Prazos regimentais: Inscrições abertas a partir do 15º dia após a publicação deste edital, com duração mínima de 15 (quinze) dias corridos. Todos os colaboradores em regime CLT têm o direito de se candidatar, independentemente de filiação sindical.`
        ],
        signatories: [
          'Diretoria Executiva / Empregador',
          'Coordenador do SESMT / Segurança do Trabalho'
        ]
      };

    case 'comissao_eleitoral':
      return {
        title: 'PORTARIA DE CONSTITUIÇÃO DA COMISSÃO ELEITORAL DA CIPA',
        category: 'Comissão Eleitoral',
        normativeCode: 'NR-5 - Item 5.5.2',
        companyName,
        cnpj,
        dateGenerated: formattedDate,
        content: [
          `A empresa ${companyName}, no uso de suas prerrogativas legais e em cumprimento ao item 5.5.2 da NR-5, constitui formalmente a Comissão Eleitoral (CE) encarregada de organizar, conduzir e homologar o processo eleitoral da CIPA referente ao mandato 2026/2027.`,
          `Ficam nomeados como membros titulares da Comissão Eleitoral:`,
          `1. Carlos Alberto Mendes - Coordenador da Comissão Eleitoral (Representante dos Empregadores)`,
          `2. Mariana Fonseca de Souza - Secretária da Comissão (Representante dos Empregados)`,
          `3. Roberto Silveira Lima - Vogal e Auditor de Tecnologia Eleitoral`,
          `Compete à Comissão Eleitoral zelar pelo sigilo do voto, publicar listas de inscritos, receber e deliberar sobre impugnações em até 24h, supervisionar a urna eletrônica auditada e lavrar a respectiva ata de apuração.`
        ],
        signatories: [
          'Representante Legal da Empresa',
          'Coordenador da Comissão Eleitoral',
          'Secretária da Comissão Eleitoral'
        ]
      };

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
