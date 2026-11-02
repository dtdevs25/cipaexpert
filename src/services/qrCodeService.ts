import QRCode from 'qrcode';

export class QrCodeService {
  /**
   * Gera uma imagem DataURL (PNG Base64) escaneável para qualquer URL ou texto.
   * Suporta renderização em telas (HTML <img>) e inserção direta em PDFs (jsPDF doc.addImage).
   */
  static async generateDataUrl(text: string, size = 220): Promise<string> {
    try {
      if (!text) return '';
      return await QRCode.toDataURL(text, {
        width: size,
        margin: 1,
        color: {
          dark: '#0f172a', // Slate 900
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (err) {
      console.warn('Erro ao gerar QRCode DataURL:', err);
      return '';
    }
  }

  /**
   * Gera código SVG vetorial puro do QR Code para exibição nítida em qualquer resolução.
   */
  static async generateSvg(text: string): Promise<string> {
    try {
      if (!text) return '';
      return await QRCode.toString(text, {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.warn('Erro ao gerar QRCode SVG:', err);
      return '';
    }
  }
}
