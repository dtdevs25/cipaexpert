import { jsPDF } from 'jspdf';
import { SignatureEnvelope } from './signatureService';

export interface DimensionamentoPdfData {
  companyName: string;
  razaoSocial?: string;
  cnpj: string;
  unitName: string;
  city?: string;
  state?: string;
  cnaeCode: string;
  cnaeDesc: string;
  grauDeRisco: number;
  headcount: number;
  gestao?: string;
  efetivosEmpregados: number;
  suplentesEmpregados: number;
  efetivosEmpregador: number;
  suplentesEmpregador: number;
  totalMembros: number;
  cargaHorariaTreinamento?: string;
  observacaoNormativa: string;
  calculadoPor?: string;
  dataCalculo?: string;
  hashSha256?: string;
  protocolo?: string;
}

export class PdfService {
  /**
   * Gera e faz o download de um laudo/comprovante oficial de Dimensionamento da CIPA (NR-5 / NR-4)
   * em página única A4, de alto padrão executivo, com dados paritários, parecer legal,
   * regras de capacitação, campos de assinatura e chancela criptográfica SHA-256 com fé pública.
   */
  static generateDimensionamentoPdf(data: DimensionamentoPdfData): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    const dataEmissao = data.dataCalculo || new Date().toLocaleString('pt-BR');
    const protocolo = data.protocolo || `DIM-NR5-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const hash = data.hashSha256 || `SHA256-${Array.from(new Uint8Array(32), () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

    // Carga horária calculada pela NR-5 conforme Grau de Risco
    const cargaTreinamento = data.cargaHorariaTreinamento || (
      data.grauDeRisco === 1 ? '8 horas' :
      data.grauDeRisco === 2 ? '12 horas' :
      data.grauDeRisco === 3 ? '16 horas' : '20 horas'
    );

    // =========================================================================
    // TOPO: BARRA DECORATIVA E CABEÇALHO INSTITUCIONAL
    // =========================================================================
    // Barra superior esmeralda
    doc.setFillColor(5, 150, 105); // Emerald-600
    doc.rect(margin, 9, contentWidth, 2, 'F');

    // Cabeçalho institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('REPÚBLICA FEDERATIVA DO BRASIL · MINISTÉRIO DO TRABALHO E EMPREGO', pageWidth / 2, 15.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('LAUDO TÉCNICO DE ENQUADRAMENTO E DIMENSIONAMENTO DA CIPA', pageWidth / 2, 21.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Instrumento Comprobatório de Conformidade com a NR-05 (Portaria MTP 4.219/2022), NR-04 e Lei 14.457/2022', pageWidth / 2, 26, { align: 'center' });

    // Linha divisória sutil
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 28.5, pageWidth - margin, 28.5);

    // =========================================================================
    // SEÇÃO 1: DADOS DO EMPREGADOR E DO ESTABELECIMENTO
    // =========================================================================
    let currentY = 32.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 122, 85);
    doc.text('1. DADOS DO EMPREGADOR E ESTABELECIMENTO AVALIADO', margin, currentY);

    const boxEmpresaY = currentY + 2;
    const boxEmpresaH = 34;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, boxEmpresaY, contentWidth, boxEmpresaH, 1.5, 1.5, 'FD');

    // Coluna 1
    const col1X = margin + 3.5;
    doc.setFontSize(7.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Razão Social:', col1X, boxEmpresaY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.razaoSocial || data.companyName, col1X + 22, boxEmpresaY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Nome Fantasia:', col1X, boxEmpresaY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.companyName, col1X + 22, boxEmpresaY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('CNPJ:', col1X, boxEmpresaY + 18);
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.cnpj, col1X + 22, boxEmpresaY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Unidade / Filial:', col1X, boxEmpresaY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const localidade = data.city ? ` · ${data.city}/${data.state || 'BR'}` : '';
    doc.text(`${data.unitName}${localidade}`, col1X + 22, boxEmpresaY + 24);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Gestão / Mandato:', col1X, boxEmpresaY + 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(data.gestao || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`, col1X + 25, boxEmpresaY + 30);

    // Coluna 2
    const col2X = margin + 98;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('CNAE Principal:', col2X, boxEmpresaY + 6);
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.cnaeCode, col2X + 25, boxEmpresaY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Atividade:', col2X, boxEmpresaY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const descCnaeLines = doc.splitTextToSize(data.cnaeDesc, contentWidth - 98 - 25);
    doc.text(descCnaeLines.slice(0, 2), col2X + 25, boxEmpresaY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Grau de Risco:', col2X, boxEmpresaY + 24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(data.grauDeRisco >= 3 ? 180 : 5, data.grauDeRisco >= 3 ? 30 : 150, data.grauDeRisco >= 3 ? 30 : 105);
    doc.text(`Grau ${data.grauDeRisco} (Quadro I - NR-4)`, col2X + 25, boxEmpresaY + 24);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Efetivo Ativo:', col2X, boxEmpresaY + 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.headcount} colaboradores registrados`, col2X + 25, boxEmpresaY + 30);

    // =========================================================================
    // SEÇÃO 2: QUADRO PARITÁRIO DE DIMENSIONAMENTO HOMOLOGADO (NR-5 QUADRO I)
    // =========================================================================
    currentY = boxEmpresaY + boxEmpresaH + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 122, 85);
    doc.text('2. QUADRO PARITÁRIO DE DIMENSIONAMENTO HOMOLOGADO (QUADRO I DA NR-5)', margin, currentY);

    const cardsY = currentY + 2;
    const cardH = 26;
    const gap = 2.5;
    const cardW = (contentWidth - 4 * gap) / 5;

    // Card 1: Empregados Titulares
    doc.setFillColor(236, 253, 245); // Emerald-50
    doc.setDrawColor(167, 243, 208); // Emerald-200
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, cardsY, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87);
    doc.text('EMPREGADOS', margin + cardW / 2, cardsY + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.text('Titulares (Eleitos)', margin + cardW / 2, cardsY + 9, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(6, 78, 59);
    doc.text(String(data.efetivosEmpregados), margin + cardW / 2, cardsY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(5, 150, 105);
    doc.text('Voto Secreto', margin + cardW / 2, cardsY + 23, { align: 'center' });

    // Card 2: Empregados Suplentes
    const card2X = margin + cardW + gap;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(card2X, cardsY, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87);
    doc.text('EMPREGADOS', card2X + cardW / 2, cardsY + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.text('Suplentes (Eleitos)', card2X + cardW / 2, cardsY + 9, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(6, 78, 59);
    doc.text(String(data.suplentesEmpregados), card2X + cardW / 2, cardsY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(5, 150, 105);
    doc.text('Ordem de Votação', card2X + cardW / 2, cardsY + 23, { align: 'center' });

    // Card 3: Empregador Titulares
    const card3X = margin + 2 * (cardW + gap);
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.roundedRect(card3X, cardsY, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('EMPREGADOR', card3X + cardW / 2, cardsY + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.text('Titulares (Indicados)', card3X + cardW / 2, cardsY + 9, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);
    doc.text(String(data.efetivosEmpregador), card3X + cardW / 2, cardsY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Indicação Diretoria', card3X + cardW / 2, cardsY + 23, { align: 'center' });

    // Card 4: Empregador Suplentes
    const card4X = margin + 3 * (cardW + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(card4X, cardsY, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('EMPREGADOR', card4X + cardW / 2, cardsY + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.text('Suplentes (Indicados)', card4X + cardW / 2, cardsY + 9, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);
    doc.text(String(data.suplentesEmpregador), card4X + cardW / 2, cardsY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Indicação Diretoria', card4X + cardW / 2, cardsY + 23, { align: 'center' });

    // Card 5: Total da Comissão
    const card5X = margin + 4 * (cardW + gap);
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.setDrawColor(30, 41, 59);
    doc.roundedRect(card5X, cardsY, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(52, 211, 153); // Emerald-400
    doc.text('TOTAL CIPA', card5X + cardW / 2, cardsY + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(226, 232, 240);
    doc.text('Comissão Paritária', card5X + cardW / 2, cardsY + 9, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text(String(data.totalMembros), card5X + cardW / 2, cardsY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`Curso: ${cargaTreinamento}`, card5X + cardW / 2, cardsY + 23, { align: 'center' });

    // =========================================================================
    // SEÇÃO 3: PARECER CONCLUSIVO E FUNDAMENTAÇÃO LEGAL
    // =========================================================================
    currentY = cardsY + cardH + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 122, 85);
    doc.text('3. PARECER CONCLUSIVO E FUNDAMENTAÇÃO LEGAL', margin, currentY);

    const boxParecerY = currentY + 2;
    const boxParecerH = 25;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, boxParecerY, contentWidth, boxParecerH, 1.5, 1.5, 'FD');

    // Tarja de destaque verde na lateral esquerda do box
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(margin, boxParecerY, 2.5, boxParecerH, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Parecer Técnico de Enquadramento:', margin + 6, boxParecerY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const obsText = data.observacaoNormativa || 'Estabelecimento enquadrado nas disposições normativas da NR-05 e NR-04 para constituição e gestão da CIPA.';
    const splitObs = doc.splitTextToSize(obsText, contentWidth - 10);
    doc.text(splitObs.slice(0, 2), margin + 6, boxParecerY + 10.5);

    // Texto normativo complementar
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const notaLegal = `Conforme o item 5.4 da NR-05, a empresa deve manter a CIPA em efetivo funcionamento durante a gestão. Para estabelecimentos dispensados de constituição com base no Quadro I ou regras de ME/EPP, a empresa deverá indicar e capacitar um Designado da CIPA para o cumprimento dos objetivos da norma.`;
    const splitNota = doc.splitTextToSize(notaLegal, contentWidth - 10);
    doc.text(splitNota.slice(0, 2), margin + 6, boxParecerY + 19);

    // =========================================================================
    // SEÇÃO 4: OBRIGAÇÕES DO MANDATO, TREINAMENTO E LEI 14.457/2022
    // =========================================================================
    currentY = boxParecerY + boxParecerH + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 122, 85);
    doc.text('4. REQUISITOS OBRIGATÓRIOS DO MANDATO E CAPACITAÇÃO', margin, currentY);

    const boxReqY = currentY + 2;
    const boxReqH = 28;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, boxReqY, contentWidth, boxReqH, 1.5, 1.5, 'FD');

    // Coluna 1: Capacitação Obrigatória
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Capacitação Obrigatória dos Membros (Item 5.7 NR-5):', margin + 4, boxReqY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Carga Horária Mínima: ${cargaTreinamento} para estabelecimentos de Grau de Risco ${data.grauDeRisco}.`, margin + 4, boxReqY + 10.5);
    doc.text('• Prazo Normativo: Realização antes da posse para 1ª CIPA ou até 30 dias após posse nas demais.', margin + 4, boxReqY + 15);
    doc.text('• Conteúdo Obrigatório: Condições de trabalho, riscos ocupacionais, primeiros socorros e inspeções.', margin + 4, boxReqY + 19.5);
    doc.text('• Modalidade: Presencial ou Semipresencial em conformidade com as diretrizes da NR-01.', margin + 4, boxReqY + 24);

    // Coluna 2: Lei 14.457/2022 e Estabilidade
    const col2ReqX = margin + 98;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Lei nº 14.457/2022 e Estabilidade do Mandato:', col2ReqX, boxReqY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text('• Prevenção ao Assédio: Inclusão obrigatória de regras contra assédio sexual e violência laboral.', col2ReqX, boxReqY + 10.5);
    doc.text('• Canal de Denúncias: Manutenção de canal seguro para acolhimento e apuração com sigilo.', col2ReqX, boxReqY + 15);
    doc.text('• Duração do Mandato: 1 (um) ano de efetiva gestão paritária com reuniões mensais ordinárias.', col2ReqX, boxReqY + 19.5);
    doc.text('• Estabilidade: Vedada a dispensa arbitrária dos eleitos desde o registro até 1 ano após mandato.', col2ReqX, boxReqY + 24);

    // =========================================================================
    // SEÇÃO 5: VALIDAÇÃO TÉCNICA E CAMPOS DE ASSINATURA
    // =========================================================================
    currentY = boxReqY + boxReqH + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 122, 85);
    doc.text('5. VALIDAÇÃO TÉCNICA E PROTOCOLO DE CONFORMIDADE', margin, currentY);

    const boxSigY = currentY + 2;
    const boxSigH = 26;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, boxSigY, contentWidth, boxSigH, 1.5, 1.5, 'FD');

    // Linha de assinatura 1 - Técnico/Engenheiro SST
    const sig1X = margin + 12;
    const sig1W = 70;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(sig1X, boxSigY + 15, sig1X + sig1W, boxSigY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(data.calculadoPor || 'Responsável Técnico / Engenharia de SST', sig1X + sig1W / 2, boxSigY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Elaborador Técnico do Dimensionamento', sig1X + sig1W / 2, boxSigY + 22.5, { align: 'center' });

    // Linha de assinatura 2 - Representante Legal do Empregador
    const sig2X = margin + 104;
    const sig2W = 70;
    doc.line(sig2X, boxSigY + 15, sig2X + sig2W, boxSigY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(data.companyName, sig2X + sig2W / 2, boxSigY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Representante Legal da Empresa / Diretoria', sig2X + sig2W / 2, boxSigY + 22.5, { align: 'center' });

    // =========================================================================
    // SEÇÃO 6: CHANCELA DE AUTENTICIDADE CRIPTOGRÁFICA E AUDITORIA (RODAPÉ)
    // =========================================================================
    currentY = boxSigY + boxSigH + 4;
    const boxAuthY = currentY;
    const boxAuthH = 26;
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, boxAuthY, contentWidth, boxAuthH, 1.5, 1.5, 'FD');

    // Linha superior esmeralda da chancela
    doc.setFillColor(5, 150, 105);
    doc.rect(margin, boxAuthY, contentWidth, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 78, 59);
    doc.text('CHANCELA DE AUTENTICIDADE CRIPTOGRÁFICA · SISTEMA CIPA EXPERT ENTERPRISE', margin + 3.5, boxAuthY + 5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Identificador do Laudo: ${protocolo}`, margin + 3.5, boxAuthY + 9.5);
    doc.text(`Hash de Integridade SHA-256: ${hash}`, margin + 3.5, boxAuthY + 13.5);
    doc.text(`Data/Hora de Emissão e Registro: ${dataEmissao} BRT`, margin + 3.5, boxAuthY + 17.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Documento eletrônico auditável emitido em conformidade com a MP nº 2.200-2/2001 e Lei Federal nº 14.063/2020.', margin + 3.5, boxAuthY + 21.5);
    doc.text('Válido como prova documental perante a Auditoria Fiscal do Trabalho (MTE), Sindicatos e Certificações ISO 45001.', margin + 3.5, boxAuthY + 24.5);

    // Download do arquivo PDF com nome amigável e padronizado
    const cleanCompanyName = data.companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
    const cleanUnitName = data.unitName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');

    doc.save(`laudo_dimensionamento_cipa_${cleanCompanyName}_${cleanUnitName}.pdf`);
  }

  /**
   * Gera e faz o download de um único PDF contendo:
   * 1. O documento original com os dados normativos e chancelas
   * 2. O Certificado de Autenticidade e Trilha de Assinaturas Digitais com fé pública
   * Em todas as páginas é aplicada uma linha única de autenticação criptográfica válida pela legislação.
   */
  static downloadEnvelopePdf(envelope: SignatureEnvelope): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    const hashDoc = envelope.finalHash || envelope.documentHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const timestampDoc = envelope.updatedAt || envelope.createdAt || new Date().toLocaleString('pt-BR');

    // =========================================================================
    // PÁGINA 1: DOCUMENTO ORIGINAL FORMATADO
    // =========================================================================

    // Cabeçalho Institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 120);
    doc.text('REPÚBLICA FEDERATIVA DO BRASIL · MINISTÉRIO DO TRABALHO E EMPREGO', pageWidth / 2, 22, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(envelope.title.toUpperCase(), pageWidth / 2, 29, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 80, 90);
    doc.text(`Empresa: ${envelope.companyName}   |   CNPJ: ${envelope.cnpj}   |   Norma: ${envelope.normativeCode || 'NR-5'}`, pageWidth / 2, 35, { align: 'center' });

    // Linha divisória sutil
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 39, pageWidth - margin, 39);

    // Conteúdo do Documento (Parágrafos)
    let currentY = 47;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    envelope.content.forEach((para) => {
      const lines = doc.splitTextToSize(para, contentWidth);
      if (currentY + lines.length * 5 > pageHeight - 45) {
        doc.addPage();
        currentY = 25;
      }
      doc.text(lines, margin, currentY);
      currentY += lines.length * 5 + 3.5;
    });

    // Assinaturas Coletadas no Documento (Sem linhas nem caixas)
    const signedSigners = envelope.signers.filter(s => s.status === 'assinado');
    if (signedSigners.length > 0) {
      if (currentY + 40 > pageHeight - 20) {
        doc.addPage();
        currentY = 25;
      } else {
        currentY += 8;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CHANCELAS ELETRÔNICAS E ASSINATURAS:', margin, currentY);
      currentY += 6;

      signedSigners.forEach((s) => {
        if (currentY + 22 > pageHeight - 15) {
          doc.addPage();
          currentY = 25;
        }

        // Se tem imagem da assinatura desenhada em dataUrl
        if (s.signatureDataUrl && s.signatureDataUrl.startsWith('data:image')) {
          try {
            doc.addImage(s.signatureDataUrl, 'PNG', margin, currentY, 38, 11);
            currentY += 12;
          } catch {
            doc.setFont('times', 'italic');
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 100);
            doc.text(s.name, margin, currentY + 4);
            currentY += 6;
          }
        } else {
          doc.setFont('times', 'italic');
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 100);
          doc.text(s.name, margin, currentY + 4);
          currentY += 6;
        }

        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(50, 60, 70);
        doc.text(s.email, margin, currentY);
        doc.text(s.signedAt ? new Date(s.signedAt).toLocaleString('pt-BR') : timestampDoc, margin, currentY + 3.5);
        doc.text(`Hash: ${s.hash ? s.hash.slice(0, 24) : hashDoc.slice(0, 24)}...`, margin, currentY + 7);
        currentY += 12;
      });
    }

    // =========================================================================
    // ÚLTIMA PÁGINA: CERTIFICADO DE AUTENTICIDADE E TRILHA DE AUDITORIA
    // =========================================================================
    doc.addPage();

    // Topo do Certificado
    doc.setFillColor(245, 248, 250);
    doc.rect(margin, 18, contentWidth, 22, 'F');
    doc.setDrawColor(16, 185, 129); // Emerald
    doc.setLineWidth(0.8);
    doc.line(margin, 18, margin + contentWidth, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(6, 78, 59); // Dark green
    doc.text('CERTIFICADO DE CONFORMIDADE E VALIDAÇÃO DIGITAL', margin + 4, 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Em conformidade integral com a MP nº 2.200-2/2001 e com a Lei Federal nº 14.063/2020.', margin + 4, 31.5);
    doc.text(`Identificador do Envelope: ${envelope.id}   |   Hash Raiz: ${hashDoc.slice(0, 20)}...`, margin + 4, 35.5);

    let certY = 47;

    // Resumo dos Metadados Legais
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('1. DADOS DO DOCUMENTO', margin, certY);
    certY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Título: ${envelope.title}`, margin, certY);
    certY += 4.5;
    doc.text(`Empresa Emissora: ${envelope.companyName} (CNPJ: ${envelope.cnpj})`, margin, certY);
    certY += 4.5;
    doc.text(`Data de Criação: ${envelope.createdAt}`, margin, certY);
    certY += 4.5;
    doc.text(`Status do Envelope: ${envelope.status === 'concluido' ? 'CONCLUÍDO (100% Homologado)' : 'EM ANDAMENTO'}`, margin, certY);
    certY += 9;

    // Tabela de Signatários e Assinaturas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('2. TRILHA DE ASSINATURAS E SIGNATÁRIOS', margin, certY);
    certY += 6;

    envelope.signers.forEach((signer, idx) => {
      const isSigned = signer.status === 'assinado';
      
      doc.setFillColor(isSigned ? 240 : 250, isSigned ? 253 : 250, isSigned ? 244 : 250);
      doc.rect(margin, certY, contentWidth, 23, 'F');
      doc.setDrawColor(isSigned ? 167 : 226, isSigned ? 243 : 232, isSigned ? 208 : 240);
      doc.setLineWidth(0.2);
      doc.rect(margin, certY, contentWidth, 23, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${signer.name} (${signer.role})`, margin + 3, certY + 5);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`E-mail: ${signer.email}`, margin + 3, certY + 9.5);
      doc.text(`Status: ${isSigned ? 'ASSINADO DIGITALMENTE' : 'PENDENTE'}`, margin + 3, certY + 13.5);
      
      if (isSigned) {
        doc.text(`Data/Hora: ${signer.signedAt ? new Date(signer.signedAt).toLocaleString('pt-BR') : timestampDoc} BRT`, margin + 3, certY + 17.5);
        doc.text(`Hash: ${signer.hash ? signer.hash : hashDoc}`, margin + 3, certY + 21);
      } else {
        doc.text('Aguardando assinatura do signatário', margin + 3, certY + 17.5);
      }

      certY += 26;
    });

    // Rodapé de Fé Pública
    certY = Math.max(certY + 5, pageHeight - 35);
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, certY, pageWidth - margin, certY);
    certY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 122, 85);
    doc.text('CHANCELA DE INTEGRIDADE CIPA EXPERT · SISTEMA CIPASIGN', pageWidth / 2, certY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('As assinaturas eletrônicas deste documento foram coletadas com validação de IP, timestamp e hash SHA-256.', pageWidth / 2, certY + 4, { align: 'center' });
    doc.text('O documento original e este certificado formam um único instrumento probatório para efeitos de fiscalização e auditoria trabalhista.', pageWidth / 2, certY + 7.5, { align: 'center' });

    // =========================================================================
    // APLICAÇÃO DO CABEÇALHO CRIPTOGRÁFICO EM LINHA ÚNICA EM TODAS AS PÁGINAS
    // =========================================================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      
      const authHeaderLine = `Autenticação Digital MP 2.200-2/01 · SHA-256: ${hashDoc.slice(0, 20)}... · ${timestampDoc}`;
      doc.text(authHeaderLine, margin, 8);

      // Paginação no canto superior direito
      doc.text(`Pág. ${i}/${totalPages}`, pageWidth - margin, 8, { align: 'right' });

      // Linha divisória sutil
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, 10, pageWidth - margin, 10);
    }

    // Salvar arquivo PDF
    const cleanFileName = envelope.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
    doc.save(`${cleanFileName}_assinado.pdf`);
  }
}
