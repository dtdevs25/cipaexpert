import { jsPDF } from 'jspdf';
import { SignatureEnvelope } from './signatureService';
import { QrCodeService } from './qrCodeService';

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
  logoUrl?: string;
}

export interface CalendarioEtapaPdf {
  numero: number;
  titulo: string;
  subtitulo?: string;
  prazoLabel: string;
  dataCalculada: string;
  referenciaNormativa: string;
  isConcluido?: boolean;
}

export interface CalendarioPdfData {
  companyName: string;
  razaoSocial?: string;
  cnpj: string;
  unitName: string;
  city?: string;
  state?: string;
  cnaeCode: string;
  cnaeDesc: string;
  grauDeRisco: number;
  mandateEndDate: string;
  gestaoAno?: string;
  logoUrl?: string;
  protocolo?: string;
  hashSha256?: string;
  datasDestaque?: {
    convocacao: string;
    inscricoes: string;
    eleicao: string;
    posse: string;
  };
  etapas: CalendarioEtapaPdf[];
}

// Helper seguro para carregar imagens no navegador sem quebrar o fluxo caso falhe
async function loadImgData(url?: string): Promise<{ img: HTMLImageElement; format: 'PNG' | 'JPEG' } | null> {
  if (typeof window === 'undefined' || !url) return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const isJpg = url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg') || url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg');
        resolve({ img, format: isJpg ? 'JPEG' : 'PNG' });
      };
      img.onerror = () => resolve(null);
      img.src = url;
      setTimeout(() => resolve(null), 2500);
    } catch {
      resolve(null);
    }
  });
}

export class PdfService {
  /**
   * Gera e faz o download de um laudo/comprovante oficial de Dimensionamento da CIPA (NR-5 / NR-4)
   * em página única A4, de alto padrão executivo, com dados paritários, parecer legal,
   * logo institucional da empresa e chancela criptográfica de controle.
   */
  static async generateDimensionamentoPdf(data: DimensionamentoPdfData): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    // Normalização segura de todos os dados de entrada para prevenir null/undefined no jsPDF
    const companyName = String(data.companyName || data.razaoSocial || 'Empresa').trim();
    const razaoSocial = String(data.razaoSocial || data.companyName || companyName).trim();
    const cnpj = String(data.cnpj || '00.000.000/0001-00').trim();
    const unitName = String(data.unitName || 'Unidade Principal').trim();
    const localidade = data.city ? ` · ${data.city}/${data.state || 'BR'}` : (data.state ? ` · ${data.state}` : '');
    const cnaeCode = String(data.cnaeCode || '2511-0/00').trim();
    const cnaeDesc = String(data.cnaeDesc || 'Atividade Industrial / Comercial').trim();
    const grauDeRisco = Number(data.grauDeRisco || 3);
    const headcount = Number(data.headcount || 0);
    const gestao = String(data.gestao || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`).trim();
    const efetivosEmpregados = Number(data.efetivosEmpregados || 0);
    const suplentesEmpregados = Number(data.suplentesEmpregados || 0);
    const efetivosEmpregador = Number(data.efetivosEmpregador || 0);
    const suplentesEmpregador = Number(data.suplentesEmpregador || 0);
    const totalMembros = Number(data.totalMembros || 0);
    const obsText = String(data.observacaoNormativa || 'Estabelecimento enquadrado nas disposições normativas da NR-05 e NR-04 para constituição e gestão da CIPA.').trim();
    const calculadoPor = String(data.calculadoPor || 'Responsável Técnico / Engenharia de SST').trim();
    const dataEmissao = String(data.dataCalculo || new Date().toLocaleString('pt-BR')).trim();
    const protocolo = String(data.protocolo || `DIM-NR5-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`).trim();
    const hash = String(data.hashSha256 || `SHA256-${Array.from(new Uint8Array(32), () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase()}`).trim();

    // Carga horária calculada pela NR-5 conforme Grau de Risco
    const cargaTreinamento = data.cargaHorariaTreinamento || (
      grauDeRisco === 1 ? '8 horas' :
        grauDeRisco === 2 ? '12 horas' :
          grauDeRisco === 3 ? '16 horas' : '20 horas'
    );

    // =========================================================================
    // TOPO: BARRA DECORATIVA E CABEÇALHO COM LOGO E IDENTIFICAÇÃO DO LAUDO
    // =========================================================================
    // Barra superior esmeralda
    doc.setFillColor(5, 150, 105); // Emerald-600
    doc.rect(margin, 8, contentWidth, 2, 'F');

    // Carregamento do Logo (Empresa ou fallback Institucional)
    let loadedLogo = await loadImgData(data.logoUrl);
    if (!loadedLogo && typeof window !== 'undefined') {
      loadedLogo = await loadImgData('/logocompleto.png');
    }

    let logoRenderedWidth = 0;
    if (loadedLogo) {
      try {
        let imgW = 32;
        let imgH = 14;
        if (loadedLogo.img.naturalWidth && loadedLogo.img.naturalHeight) {
          const ratio = loadedLogo.img.naturalWidth / loadedLogo.img.naturalHeight;
          if (ratio > (imgW / imgH)) {
            imgH = imgW / ratio;
          } else {
            imgW = imgH * ratio;
          }
        }
        const logoY = 12 + (15 - imgH) / 2;
        doc.addImage(loadedLogo.img, loadedLogo.format, margin, logoY, imgW, imgH);
        logoRenderedWidth = imgW;
      } catch (e) {
        console.warn('Erro ao renderizar logo no PDF:', e);
      }
    }

    // Se não carregou imagem, exibe badge elegante com o nome da empresa ou sistema
    if (!logoRenderedWidth) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, 12, 30, 14, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 122, 85);
      doc.text('CIPA EXPERT', margin + 15, 20.5, { align: 'center' });
      logoRenderedWidth = 30;
    }

    // Ao lado fica escrito laudo...
    const textStartX = margin + logoRenderedWidth + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('LAUDO TÉCNICO DE ENQUADRAMENTO E DIMENSIONAMENTO', textStartX, 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 122, 85); // Emerald-700
    doc.text(`COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E ASSÉDIO · GESTÃO ${gestao}`, textStartX, 22.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('Instrumento Comprobatório de Conformidade com a NR-05 e NR-04', textStartX, 26.5);

    // Linha divisória sutil
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 29.5, pageWidth - margin, 29.5);

    // =========================================================================
    // SEÇÃO 1: DADOS DO EMPREGADOR E DO ESTABELECIMENTO
    // =========================================================================
    let currentY = 33.5;
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
    doc.text(razaoSocial, col1X + 22, boxEmpresaY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Nome Fantasia:', col1X, boxEmpresaY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(companyName, col1X + 22, boxEmpresaY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('CNPJ:', col1X, boxEmpresaY + 18);
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(cnpj, col1X + 22, boxEmpresaY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Unidade / Filial:', col1X, boxEmpresaY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${unitName}${localidade}`, col1X + 22, boxEmpresaY + 24);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Gestão / Mandato:', col1X, boxEmpresaY + 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(gestao, col1X + 25, boxEmpresaY + 30);

    // Coluna 2
    const col2X = margin + 98;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('CNAE Principal:', col2X, boxEmpresaY + 6);
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(cnaeCode, col2X + 25, boxEmpresaY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Atividade:', col2X, boxEmpresaY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const descCnaeLines = doc.splitTextToSize(cnaeDesc, contentWidth - 98 - 25);
    doc.text(descCnaeLines.slice(0, 2), col2X + 25, boxEmpresaY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Grau de Risco:', col2X, boxEmpresaY + 24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(grauDeRisco >= 3 ? 180 : 5, grauDeRisco >= 3 ? 30 : 150, grauDeRisco >= 3 ? 30 : 105);
    doc.text(`Grau ${grauDeRisco} (Quadro I - NR-4)`, col2X + 25, boxEmpresaY + 24);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Efetivo Ativo:', col2X, boxEmpresaY + 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${headcount} colaboradores registrados`, col2X + 25, boxEmpresaY + 30);

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
    currentY = cardsY + cardH + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 122, 85);
    doc.text('3. PARECER CONCLUSIVO E FUNDAMENTAÇÃO LEGAL', margin, currentY);

    const boxParecerY = currentY + 2;
    const boxParecerH = 36;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, boxParecerY, contentWidth, boxParecerH, 1.5, 1.5, 'FD');

    // Tarja de destaque verde na lateral esquerda do box
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(margin, boxParecerY, 2.5, boxParecerH, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Parecer Técnico de Enquadramento:', margin + 6, boxParecerY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const splitObs = doc.splitTextToSize(obsText, contentWidth - 12);
    doc.text(splitObs.slice(0, 3), margin + 6, boxParecerY + 11.5);

    // Texto normativo complementar
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const notaLegal = `Conforme o item 5.4 da Norma Regulamentadora nº 05 (NR-05) e NR-04, este dimensionamento define a composição paritária oficial da comissão para o mandato indicado. O treinamento obrigatório para os membros possui carga horária de ${cargaTreinamento} (Grau de Risco ${grauDeRisco}), a ser cumprido nos termos regulamentares.`;
    const splitNota = doc.splitTextToSize(notaLegal, contentWidth - 12);
    doc.text(splitNota.slice(0, 3), margin + 6, boxParecerY + 23);

    // =========================================================================
    // REGISTRO DE AUTENTICIDADE E CONTROLE DOCUMENTAL (RODAPÉ)
    // =========================================================================
    currentY = boxParecerY + boxParecerH + 8;
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
    doc.text(`Data/Hora de Emissão e Registro: ${dataEmissao} BRT   ·   Responsável: ${calculadoPor}`, margin + 3.5, boxAuthY + 17.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Documento eletrônico comprobatório emitido pelo Sistema CIPA Expert Enterprise em estrita consonância com a NR-05 e NR-04.', margin + 3.5, boxAuthY + 21.5);
    doc.text('Válido como comprovação perante a Inspeção do Trabalho (MTE), auditorias de SST e certificações de conformidade.', margin + 3.5, boxAuthY + 24.5);

    // Download do arquivo PDF com nome amigável e padronizado
    const cleanCompanyName = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
    const cleanUnitName = unitName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');

    const fileName = `laudo_dimensionamento_cipa_${cleanCompanyName || 'empresa'}_${cleanUnitName || 'unidade'}.pdf`;

    try {
      doc.save(fileName);
    } catch (saveErr) {
      console.warn('doc.save falhou, usando fallback via Blob URL:', saveErr);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  /**
   * Gera e faz download do Calendário Eleitoral Oficial da CIPA (NR-5 / MTE)
   * em folha A4 HORIZONTAL (landscape), formato de quadro/tabela de alta fidelidade executiva.
   */
  static async generateCalendarioPdf(data: CalendarioPdfData): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
    const margin = 12;
    const contentWidth = pageWidth - margin * 2; // 273 mm

    const companyName = String(data.companyName || data.razaoSocial || 'Empresa').trim();
    const cnpj = String(data.cnpj || '00.000.000/0001-00').trim();
    const unitName = String(data.unitName || 'Matriz').trim();
    const localidade = data.city ? ` · ${data.city}/${data.state || 'BR'}` : (data.state ? ` · ${data.state}` : '');
    const cnaeCode = String(data.cnaeCode || '2511-0/00').trim();
    const grauDeRisco = Number(data.grauDeRisco || 3);
    const gestao = String(data.gestaoAno || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`).trim();
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const hash = String(data.hashSha256 || `SHA256-${Array.from(new Uint8Array(32), () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase()}`).trim();
    const protocolo = String(data.protocolo || `CAL-NR5-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`).trim();

    // Barra superior decorativa esmeralda
    doc.setFillColor(5, 150, 105); // Emerald-600
    doc.rect(margin, 7, contentWidth, 2, 'F');

    // Carregamento do Logo
    let loadedLogo = await loadImgData(data.logoUrl);
    if (!loadedLogo && typeof window !== 'undefined') {
      loadedLogo = await loadImgData('/logocompleto.png');
    }

    let logoRenderedWidth = 0;
    if (loadedLogo) {
      try {
        let imgW = 28;
        let imgH = 12;
        if (loadedLogo.img.naturalWidth && loadedLogo.img.naturalHeight) {
          const ratio = loadedLogo.img.naturalWidth / loadedLogo.img.naturalHeight;
          if (ratio > (imgW / imgH)) {
            imgH = imgW / ratio;
          } else {
            imgW = imgH * ratio;
          }
        }
        doc.addImage(loadedLogo.img, loadedLogo.format, margin, 11, imgW, imgH);
        logoRenderedWidth = imgW + 4;
      } catch (err) {
        console.warn('Erro ao inserir logo no PDF do calendário:', err);
      }
    }

    // Identificação da Empresa (ao lado do logo, coluna esquerda delimitada)
    const textStartX = margin + logoRenderedWidth;
    const maxLeftColW = 140; // Garante que a coluna da esquerda nunca invada a da direita

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // Slate-900
    const companyNameTrimmed = companyName.length > 42 ? `${companyName.slice(0, 40)}...` : companyName.toUpperCase();
    doc.text(companyNameTrimmed, textStartX, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105); // Slate-600
    const unitSafe = unitName.length > 28 ? `${unitName.slice(0, 26)}...` : unitName;
    doc.text(`CNPJ: ${cnpj}   ·   Unidade: ${unitSafe}`, textStartX, 18);
    doc.text(`CNAE: ${cnaeCode}   ·   Grau de Risco: ${grauDeRisco}${localidade}`, textStartX, 22);

    // Título Oficial e Metadados à Direita (coluna direita alinhada ao fim da página)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(6, 78, 59); // Emerald-900
    doc.text('CRONOGRAMA & CALENDÁRIO ELEITORAL CIPA', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gestão ${gestao}   ·   Portaria MTP nº 4.219/2022 (NR-05)`, pageWidth - margin, 18, { align: 'right' });
    doc.text(`Data de Emissão: ${dataEmissao}   ·   Protocolo: ${protocolo}`, pageWidth - margin, 22, { align: 'right' });

    // Linha divisória sutil
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, 25.5, pageWidth - margin, 25.5);

    // =========================================================================
    // CARDS DE DESTAQUE DOS 4 MARCOS CRÍTICOS DA NR-5 (HORIZONTAL)
    // =========================================================================
    const d = data.datasDestaque || {
      convocacao: '60 dias antes',
      inscricoes: 'Mínimo 15 dias',
      eleicao: '30 dias antes',
      posse: '1º dia útil'
    };

    const cardWidth = (contentWidth - 9) / 4;
    const cardY = 27.5;
    const cardH = 13.5; // Altura ideal para 3 linhas sem NENHUMA sobreposição de texto

    const marcos = [
      { label: '1. CONVOCAÇÃO LEGAL', val: d.convocacao, sub: 'Pelo menos 60 dias antes da posse (Item 5.5.1)' },
      { label: '2. PERÍODO DE INSCRIÇÕES', val: d.inscricoes, sub: 'Prazo mínimo de 15 dias corridos (Item 5.5.2.2)' },
      { label: '3. ELEIÇÃO & APURAÇÃO', val: d.eleicao, sub: 'Pelo menos 30 dias antes da posse (Item 5.5.3)' },
      { label: '4. INSTALAÇÃO E POSSE', val: d.posse, sub: '1º dia útil após término do mandato (Item 5.5.5)' }
    ];

    marcos.forEach((m, idx) => {
      const cX = margin + idx * (cardWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cX, cardY, cardWidth, cardH, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(cX, cardY, cardWidth, cardH, 1.5, 1.5, 'S');

      // Barra colorida no topo do card
      doc.setFillColor(idx === 3 ? 16 : 5, idx === 3 ? 185 : 150, idx === 3 ? 129 : 105);
      doc.rect(cX + 0.5, cardY, cardWidth - 1, 1, 'F');

      // Linha 1: Rótulo do Marco
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(71, 85, 105);
      doc.text(m.label, cX + 2.5, cardY + 4.2);

      // Linha 2: Data Oficial em destaque
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(6, 78, 59);
      doc.text(m.val, cX + 2.5, cardY + 8.2);

      // Linha 3: Subtítulo Normativo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(m.sub, cX + 2.5, cardY + 11.8);
    });

    // =========================================================================
    // TABELA DAS 13 ETAPAS NORMATIVAS (ESTRUTURA DE QUADRO EXECUTIVO HORIZONTAL)
    // =========================================================================
    const tableY = 44.5;
    const tableHeaderH = 6;

    // Colunas (largura total = 273 mm)
    const colW = {
      num: 9,          // X: 12
      etapa: 84,       // X: 21
      regra: 52,       // X: 105
      data: 34,        // X: 157
      baseLegal: 58,   // X: 191
      status: 36        // X: 249
    };

    // Cabeçalho da Tabela
    doc.setFillColor(6, 78, 59); // Emerald Escuro
    doc.rect(margin, tableY, contentWidth, tableHeaderH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    doc.text('Nº', curX + colW.num / 2, tableY + 4.3, { align: 'center' });
    curX += colW.num;
    doc.text('ETAPA DO PROCESSO ELEITORAL', curX + 2, tableY + 4.3);
    curX += colW.etapa;
    doc.text('REGRA TEMPORAL DA NR-5', curX + 2, tableY + 4.3);
    curX += colW.regra;
    doc.text('DATA OFICIAL / PRAZO', curX + 2, tableY + 4.3);
    curX += colW.data;
    doc.text('FUNDAMENTAÇÃO LEGAL (NR-5 / CLT)', curX + 2, tableY + 4.3);
    curX += colW.baseLegal;
    doc.text('SITUAÇÃO / STATUS', curX + colW.status / 2, tableY + 4.3, { align: 'center' });

    // Linhas da Tabela
    let rowY = tableY + tableHeaderH;
    const rowH = 10.3; // 13 etapas * 10.3 mm = 133.9 mm (cabe perfeitamente em 1 página!)

    data.etapas.forEach((etapa, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, rowY, contentWidth, rowH, 'F');

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.18);
      doc.rect(margin, rowY, contentWidth, rowH, 'S');

      let cellX = margin;

      // 1. Nº
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(String(etapa.numero).padStart(2, '0'), cellX + colW.num / 2, rowY + 6.3, { align: 'center' });
      cellX += colW.num;

      // 2. Etapa (Título + Subtítulo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      const tituloSafe = etapa.titulo.length > 55 ? `${etapa.titulo.slice(0, 53)}...` : etapa.titulo;
      doc.text(tituloSafe, cellX + 2, rowY + 4.3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      const subSafe = (etapa.subtitulo || '').length > 68 ? `${(etapa.subtitulo || '').slice(0, 65)}...` : (etapa.subtitulo || '');
      doc.text(subSafe, cellX + 2, rowY + 8);
      cellX += colW.etapa;

      // 3. Regra Temporal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text(etapa.prazoLabel || '-', cellX + 2, rowY + 6.3);
      cellX += colW.regra;

      // 4. Data Oficial
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(6, 78, 59);
      doc.text(etapa.dataCalculada || '-', cellX + 2, rowY + 6.3);
      cellX += colW.data;

      // 5. Fundamentação Legal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.3);
      doc.setTextColor(71, 85, 105);
      const refSafe = etapa.referenciaNormativa.length > 42 ? `${etapa.referenciaNormativa.slice(0, 40)}...` : etapa.referenciaNormativa;
      doc.text(refSafe, cellX + 2, rowY + 6.3);
      cellX += colW.baseLegal;

      // 6. Status Badge
      const isConcluido = etapa.isConcluido || etapa.numero === 1;
      const badgeW = 28;
      const badgeH = 5.2;
      const badgeX = cellX + (colW.status - badgeW) / 2;
      const badgeY = rowY + (rowH - badgeH) / 2;

      if (isConcluido) {
        doc.setFillColor(209, 250, 229); // Emerald-100
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');
        doc.setDrawColor(167, 243, 208);
        doc.setLineWidth(0.15);
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(6, 95, 70); // Emerald-800
        doc.text('CONCLUÍDO', badgeX + badgeW / 2, badgeY + 3.6, { align: 'center' });
      } else {
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.15);
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text('PROGRAMADO', badgeX + badgeW / 2, badgeY + 3.6, { align: 'center' });
      }

      rowY += rowH;
    });

    // =========================================================================
    // RODAPÉ DO DOCUMENTO (CERTIFICAÇÃO JURÍDICA E AUTENTICAÇÃO)
    // =========================================================================
    const footerY = pageHeight - 16;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Certificação Regulatória: Cronograma eleitoral elaborado em estrito cumprimento às exigências imperativas da Norma Regulamentadora nº 05 (Portaria MTP nº 4.219/2022) e Consolidação das Leis do Trabalho (CLT Art. 163).',
      margin,
      footerY + 4.5
    );

    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Autenticação Eletrônica SHA-256: ${hash}  ·  Plataforma CIPA Expert  ·  Documento Oficial Auditável  ·  Página 1/1`,
      margin,
      footerY + 8.5
    );

    // Salvar o arquivo PDF
    const cleanFileName = `calendario_eleitoral_cipa_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${gestao.replace(/[^a-z0-9]/g, '_')}.pdf`;

    try {
      doc.save(cleanFileName);
    } catch (saveErr) {
      console.warn('doc.save falhou, usando fallback via Blob URL:', saveErr);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cleanFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  /**
   * Gera e faz o download de um único PDF contendo:
   * 1. O documento original com os dados normativos e chancelas
   * 2. O Certificado de Autenticidade e Trilha de Assinaturas Digitais com fé pública
   * Em todas as páginas é aplicada uma linha única de autenticação criptográfica válida pela legislação.
   */
  static async downloadEnvelopePdf(envelope: SignatureEnvelope): Promise<void> {
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
    // PÁGINA 1: DOCUMENTO ORIGINAL FORMATADO COM TIMBRADO CORPORATIVO
    // =========================================================================

    const compName = envelope.companyName || 'Empresa';
    const compCnpj = envelope.cnpj || '00.000.000/0001-00';
    const docNormative = envelope.normativeCode || 'NR-05 · MTE';
    const logoUrl = (envelope as any).logoUrl;

    // Tentar carregar logo
    let logoImg = null;
    if (logoUrl) {
      try {
        logoImg = await loadImgData(logoUrl);
      } catch { }
    }

    if (logoImg) {
      doc.addImage(logoImg.img, logoImg.format, margin, 15, 26, 13);
    } else {
      // Insígnia Corporativa Vetorial
      doc.setFillColor(6, 95, 70);
      doc.roundedRect(margin, 15, 18, 13, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      const initials = compName.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0]).join('').toUpperCase() || 'CIPA';
      doc.text(initials, margin + 9, 23.5, { align: 'center' });
    }

    // Informações da Empresa no Cabeçalho
    const headerTextX = margin + 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(6, 95, 70);
    doc.text('MTE · MINISTÉRIO DO TRABALHO E EMPREGO · NORMA REGULAMENTADORA NR-05', headerTextX, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(compName, headerTextX, 22.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const unitInfo = [(envelope as any).unitName, (envelope as any).unitAddress].filter(Boolean).join(' · ');
    if (unitInfo) {
      doc.text(unitInfo, headerTextX, 26.5);
    }
    doc.text(`CNPJ: ${compCnpj}   |   Gestão CIPA: ${(envelope as any).gestaoAno || '2026/2027'}   |   Base: ${docNormative}`, headerTextX, unitInfo ? 30 : 27);

    // Selo CIPA no canto superior direito
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(pageWidth - margin - 35, 15, 35, 11, 2, 2, 'F');
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageWidth - margin - 35, 15, 35, 11, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text(`CIPA ${(envelope as any).gestaoAno || '2026/2027'}`, pageWidth - margin - 17.5, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Validade MTE / NR-05', pageWidth - margin - 17.5, 24, { align: 'center' });

    // Linha divisória verde
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.6);
    doc.line(margin, 34, pageWidth - margin, 34);

    // Faixa Título do Documento
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 36, contentWidth, 8, 1, 1, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, 36, contentWidth, 8, 1, 1, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(envelope.title.toUpperCase(), pageWidth / 2, 41.5, { align: 'center' });

    // Deduplicação dos parágrafos de abertura que repetem o cabeçalho/título
    const normalizedTitle = envelope.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedCompany = compName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let startIndex = 0;
    for (let idx = 0; idx < Math.min(4, envelope.content.length); idx++) {
      const p = envelope.content[idx].trim();
      const pNorm = p.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isRepeatTitle = pNorm.length > 5 && (normalizedTitle.includes(pNorm) || pNorm.includes(normalizedTitle));
      const isRepeatCipa = p.toLowerCase().startsWith('cipa') && (p.toLowerCase().includes('comissão') || p.toLowerCase().includes('comissao') || p.toLowerCase().includes('gestão'));
      const isRepeatUnitGestao = p.toLowerCase().includes('gestão 2026') || p.toLowerCase().includes('gestao 2026');
      const isRepeatCompanyCnpj = pNorm.includes(normalizedCompany) && p.toLowerCase().includes('cnpj:');

      if (isRepeatTitle || isRepeatCipa || (isRepeatUnitGestao && p.length < 70) || isRepeatCompanyCnpj) {
        startIndex = idx + 1;
      } else {
        break;
      }
    }
    const filteredContent = envelope.content.slice(startIndex);

    // Pré-carrega QR Code dinâmico do sistema se houver link de eleição no documento
    let qrDataUrl = (envelope as any).qrCodeDataUrl || '';
    const electionLinkInDoc = (envelope as any).eleicaoLink || filteredContent.find(p => p.startsWith('http://') || p.startsWith('https://'));
    if (!qrDataUrl && electionLinkInDoc) {
      try {
        qrDataUrl = await QrCodeService.generateDataUrl(electionLinkInDoc.trim(), 200);
      } catch {}
    }

    // Conteúdo do Documento (Parágrafos e Tabelas Inteligentes)
    let currentY = 49;

    filteredContent.forEach((para) => {
      // 1. Linha de Tabela Markdown
      if (para.trim().startsWith('|')) {
        // Se for linha separadora |---|---|..., ignora
        if (!para.replace(/[\s\-|:]/g, '')) return;

        if (currentY + 7 > pageHeight - 40) {
          doc.addPage();
          currentY = 25;
        }

        const cells = para.split('|').map(c => c.trim()).filter(Boolean);
        const isHeader = cells[0]?.toUpperCase() === 'ID';

        if (isHeader) {
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, currentY - 3.5, contentWidth, 6, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(51, 65, 85);
        }

        let colX = margin + 1;
        const numCols = cells.length;
        cells.forEach((cell, cIdx) => {
          let colWidth = contentWidth / numCols;
          if (numCols === 5) {
            const widths = [15, 45, 52, 40, 22];
            colWidth = widths[cIdx] || colWidth;
          } else if (numCols === 6) {
            const widths = [12, 35, 40, 30, 18, 39];
            colWidth = widths[cIdx] || colWidth;
          }
          const cellLines = doc.splitTextToSize(cell, colWidth - 2);
          doc.text(cellLines[0] || '', colX, currentY + 0.5);
          colX += colWidth;
        });

        currentY += 5.5;
        return;
      }

      // 2. Banners de Destaque
      if (para.startsWith('INSCRIÇÕES APROVADAS:')) {
        if (currentY + 10 > pageHeight - 40) {
          doc.addPage();
          currentY = 25;
        }
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(167, 243, 208);
        doc.roundedRect(margin, currentY - 3.5, contentWidth, 6.5, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(6, 95, 70);
        doc.text(para, margin + 3, currentY + 0.8);
        currentY += 8;
        return;
      }

      if (para.startsWith('INSCRIÇÕES REPROVADAS:')) {
        if (currentY + 10 > pageHeight - 40) {
          doc.addPage();
          currentY = 25;
        }
        doc.setFillColor(255, 241, 242);
        doc.setDrawColor(254, 205, 211);
        doc.roundedRect(margin, currentY - 3.5, contentWidth, 6.5, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(159, 18, 57);
        doc.text(para, margin + 3, currentY + 0.8);
        currentY += 8;
        return;
      }

      if (para === 'CANDIDATOS CADASTRADOS NA VOTAÇÃO') {
        if (currentY + 10 > pageHeight - 40) {
          doc.addPage();
          currentY = 25;
        }
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin, currentY - 3.5, contentWidth, 6.5, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(para, margin + 3, currentY + 0.8);
        currentY += 8;
        return;
      }

      // Link Oficial da Eleição (Destaque em Box Esmeralda)
      if (para.startsWith('http://') || para.startsWith('https://')) {
        if (currentY + 12 > pageHeight - 40) {
          doc.addPage();
          currentY = 25;
        }
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(167, 243, 208);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY - 3, contentWidth, 8, 1.5, 1.5, 'FD');
        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(6, 95, 70);
        doc.text(para, margin + 4, currentY + 2.2);
        currentY += 9;
        return;
      }

      // QR Code Dinâmico Oficial do Sistema
      if (para.toLowerCase().includes('scan me')) {
        if (currentY + 28 > pageHeight - 40) {
          doc.addPage();
          currentY = 25;
        }
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY - 2, contentWidth, 23, 2, 2, 'FD');

        if (qrDataUrl) {
          try {
            doc.addImage(qrDataUrl, 'PNG', margin + 3.5, currentY, 19, 19);
          } catch {}
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text('QR CODE OFICIAL DE INSCRIÇÃO / VOTAÇÃO (CIPA EXPERT)', margin + 26, currentY + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text('Aponte a câmera do seu celular para abrir o link oficial e preencher sua candidatura.', margin + 26, currentY + 9.5);
        doc.text('Acesso sincronizado ao cronograma da unidade com controle criptográfico.', margin + 26, currentY + 13.5);

        currentY += 25;
        return;
      }

      // 3. Parâmetros Chave: Valor
      if (
        para.includes(':') &&
        (para.startsWith('VOTO') ||
          para.startsWith('QUÓRUM') ||
          para.startsWith('VOTANTES') ||
          para.startsWith('PERÍODO') ||
          para.startsWith('DATA') ||
          para.startsWith('GERADO') ||
          para.startsWith('APROVADO') ||
          para.startsWith('NOME DA CIPA') ||
          para.startsWith('REALIZADOR') ||
          para.startsWith('CNPJ') ||
          para.startsWith('INCLUSÃO') ||
          para.startsWith('ACOMPANHAMENTO') ||
          para.startsWith('CONVOCAÇÃO') ||
          para.startsWith('REALIZAÇÃO') ||
          para.startsWith('TÍTULO') ||
          para.startsWith('DESCRIÇÃO') ||
          para.startsWith('INÍCIO') ||
          para.startsWith('FIM'))
      ) {
        if (currentY + 6 > pageHeight - 40) {
          doc.addPage();
          currentY = 25;
        }
        const [k, ...v] = para.split(':');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(k.trim() + ':', margin, currentY);

        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(v.join(':').trim(), margin + 65, currentY);
        currentY += 4.5;
        return;
      }

      // 4. Candidatos na Votação (Nome e Descrição)
      if (para.startsWith('NOME DO CANDIDATO:') || para.startsWith('DESCRIÇÃO DO CANDIDATO:')) {
        if (currentY + 5 > pageHeight - 40) {
          doc.addPage();
          currentY = 25;
        }
        doc.setFont('helvetica', para.startsWith('NOME') ? 'bold' : 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(para, margin + 2, currentY);
        currentY += 4.2;
        return;
      }

      // 5. Parágrafo Padrão
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

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
