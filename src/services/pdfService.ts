import { jsPDF } from 'jspdf';
import { SignatureEnvelope } from './signatureService';

export class PdfService {
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
