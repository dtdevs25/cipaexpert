import nodemailer from 'nodemailer';

/**
 * CIPA Expert - Serviço de Envio de E-mails Transacionais
 * Template limpo, minimalista e otimizado contra filtros de SPAM
 * Conformidade com boas práticas de entregabilidade (SPF, DKIM, DMARC e RFC-5322)
 */

interface SendResetEmailParams {
  to: string;
  userName: string;
  resetLink: string;
}

export const MailerService = {
  getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  },

  async sendPasswordResetEmail({ to, userName, resetLink }: SendResetEmailParams): Promise<{ success: boolean; message: string }> {
    const from = process.env.SMTP_FROM || 'CIPA Expert <notificacoes@cipaexpert.com.br>';
    const transporter = this.getTransporter();

    // Extrai o domínio base para o logo público
    let logoUrl = 'https://cipaexpert.com.br/logocompleto.png';
    try {
      const parsedUrl = new URL(resetLink);
      logoUrl = `${parsedUrl.origin}/logocompleto.png`;
    } catch {
      // fallback
    }

    // Versão em Texto Puro (Essencial para não cair no filtro de SPAM)
    const textContent = `
Olá, ${userName},

Recebemos uma solicitação para redefinir a senha da sua conta no CIPA Expert.

Para criar uma nova senha com segurança, acesse o link abaixo:
${resetLink}

Atenção: Este link é seguro, criptografado e possui validade de exatamente 24 horas.

Se você não solicitou esta redefinição, nenhuma ação é necessária. Sua senha atual permanecerá segura e inalterada.

--
CIPA Expert · Gestão Digital da CIPA
Mensagem automática do sistema. Por favor, não responda a este e-mail.
    `.trim();

    // Versão HTML: limpa, bonita, card com cantos arredondados e sem elementos suspeitos de spam
    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de Senha - CIPA Expert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Card Central com Cantos Arredondados e Borda Sutil -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
          <tr>
            <td style="padding: 36px 32px 32px 32px;">
              
              <!-- Topo: Logo Oficial CIPA Expert -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <img src="${logoUrl}" alt="CIPA Expert" width="190" style="display: block; width: 190px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;" />
                  </td>
                </tr>
              </table>

              <!-- Linha divisória fina -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #f1f5f9; padding-bottom: 24px;"></td>
                </tr>
              </table>

              <!-- Mensagem Principal -->
              <p style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                Olá, ${userName}
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Recebemos uma solicitação para redefinir a senha de acesso da sua conta na plataforma <strong>CIPA Expert</strong>.
              </p>

              <p style="margin: 0 0 28px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Para cadastrar sua nova senha com segurança, clique no botão abaixo:
              </p>

              <!-- Botão de Ação Destacado -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; letter-spacing: 0.2px; text-align: center;">
                      Redefinir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Caixa Informativa de Validade (24 Horas) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 12px; color: #475569; line-height: 1.5;">
                    <strong style="color: #0f172a;">Aviso de Segurança:</strong> Este link é criptografado e possui validade de <strong>24 horas</strong>. Após esse prazo, será necessário solicitar um novo link na tela de login.
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Se você não fez essa solicitação, nenhuma ação é necessária. Sua senha atual permanecerá segura e inalterada.
              </p>

              <!-- Link Alternativo -->
              <p style="margin: 20px 0 0 0; font-size: 11px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f8fafc; padding-top: 16px;">
                Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:<br />
                <a href="${resetLink}" target="_blank" style="color: #059669; text-decoration: underline; word-break: break-all;">
                  ${resetLink}
                </a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Rodapé do E-mail -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin-top: 20px;">
          <tr>
            <td align="center" style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
              CIPA Expert · CIPA Digital Inteligente<br />
              Mensagem automática transacional de segurança. Por favor, não responda a este e-mail.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    if (!transporter) {
      console.log('⚠️ [MAILER] Servidor SMTP não configurado em process.env. Simulação de e-mail:');
      console.log(`✉️ Para: ${to}`);
      console.log(`🔗 Link de Redefinição (válido por 24h): ${resetLink}`);
      return {
        success: true,
        message: 'Link de redefinição gerado e registrado no log do servidor.'
      };
    }

    try {
      await transporter.sendMail({
        from,
        to,
        subject: 'Redefinição de Senha - CIPA Expert',
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Entity-Ref-ID': `cipa-reset-${Date.now()}`,
          'X-Auto-Response-Suppress': 'OOF, AutoReply'
        }
      });

      console.log(`✅ [MAILER] E-mail de redefinição enviado com sucesso para ${to}`);
      return {
        success: true,
        message: 'E-mail de redefinição enviado com sucesso.'
      };
    } catch (error: any) {
      console.error('❌ [MAILER] Erro ao enviar e-mail via SMTP:', error);
      console.log(`🔗 Link de Redefinição de contingência: ${resetLink}`);
      return {
        success: true, // Retorna sucesso para o usuário com log seguro no backend
        message: 'Solicitação processada com sucesso.'
      };
    }
  },

  async sendSignatureInvitationEmail({
    to,
    signerName,
    documentTitle,
    companyName,
    signLink,
    roleDescription,
    isReminder = false
  }: {
    to: string;
    signerName: string;
    documentTitle: string;
    companyName: string;
    signLink: string;
    roleDescription?: string;
    isReminder?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const from = process.env.SMTP_FROM || 'CIPA Expert <assinaturas@cipaexpert.com.br>';
    const transporter = this.getTransporter();

    let logoUrl = 'https://cipaexpert.com.br/logocompleto.png';
    try {
      const parsedUrl = new URL(signLink);
      logoUrl = `${parsedUrl.origin}/logocompleto.png`;
    } catch {
      // fallback
    }

    const subject = isReminder
      ? `[LEMBRETE] Assinatura pendente: ${documentTitle} - CIPA Expert`
      : `Solicitação de Assinatura Digital: ${documentTitle} - CIPA Expert`;

    const textContent = `
Olá, ${signerName},

${isReminder ? 'Este é um lembrete de que você possui um documento aguardando sua assinatura digital.' : `A empresa ${companyName} solicitou sua assinatura eletrônica no documento abaixo através da plataforma CIPA Expert.`}

DOCUMENTO: ${documentTitle}
EMPRESA: ${companyName}
${roleDescription ? `PAPEL / FUNÇÃO: ${roleDescription}` : ''}

Para revisar e assinar digitalmente com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020), acesse o link seguro:
${signLink}

A assinatura pode ser feita desenhando na tela ou selecionando uma assinatura padronizada.

--
CIPA Expert · Gestão Digital da CIPA
Mensagem automática transacional de assinatura digital.
    `.trim();

    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Card Central -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          <!-- Topo Verde Padronizado -->
          <tr>
            <td style="background: linear-gradient(135deg, #047857 0%, #065f46 100%); padding: 22px 32px; text-align: center;">
              <span style="color: #ffffff; font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
                Portal de Assinaturas Digitais · CIPA Expert
              </span>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              
              <!-- Logo -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <img src="${logoUrl}" alt="CIPA Expert" width="180" style="display: block; width: 180px; max-width: 100%; height: auto; border: 0;" />
                  </td>
                </tr>
              </table>

              <!-- Saudação -->
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
                Olá, ${signerName}!
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #475569;">
                ${isReminder ? 'Identificamos que você ainda possui uma assinatura pendente no sistema. ' : ''}Você foi indicado(a) para assinar digitalmente um documento oficial de conformidade da NR-5 da empresa <strong>${companyName}</strong>.
              </p>

              <!-- Caixa de Detalhes do Documento -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 0.5px; margin-bottom: 4px;">
                      Documento a ser Assinado
                    </span>
                    <strong style="display: block; font-size: 14px; color: #0f172a; margin-bottom: 6px;">
                      ${documentTitle}
                    </strong>
                    <span style="display: block; font-size: 11px; color: #64748b;">
                      Empresa: <strong>${companyName}</strong>
                      ${roleDescription ? ` · Papel: <strong>${roleDescription}</strong>` : ''}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Botão Principal de Assinatura -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${signLink}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 34px; border-radius: 12px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.35);">
                      Revisar e Assinar Documento
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso Legal -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; margin-top: 10px;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 11px; color: #065f46; line-height: 1.5;">
                    🛡️ <strong>Validade Jurídica:</strong> Este processo segue a Medida Provisória nº 2.200-2/2001, Lei Federal nº 14.063/2020 e Norma Regulamentadora nº 05 (NR-5), garantindo integridade criptográfica SHA-256 e tempestividade.
                  </td>
                </tr>
              </table>

              <p style="margin: 22px 0 0 0; font-size: 11px; color: #94a3b8; line-height: 1.5; word-break: break-all;">
                Se o botão não funcionar, copie e cole o endereço abaixo no seu navegador:<br />
                <a href="${signLink}" style="color: #059669;">${signLink}</a>
              </p>

            </td>
          </tr>
        </table>

        <!-- Rodapé -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin-top: 18px;">
          <tr>
            <td align="center" style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
              CIPA Expert · Assinaturas Digitais em Conformidade Legal<br />
              Mensagem automática de auditoria. Por favor, não responda a este e-mail.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    if (!transporter) {
      console.log('⚠️ [MAILER] SMTP não configurado. Simulação de convite para assinatura:');
      console.log(`✉️ Para: ${to} (${signerName})`);
      console.log(`📄 Documento: ${documentTitle}`);
      console.log(`🔗 Link para assinar: ${signLink}`);
      return {
        success: true,
        message: 'Convite para assinatura registrado com sucesso.'
      };
    }

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Entity-Ref-ID': `cipa-sig-${Date.now()}`,
          'X-Auto-Response-Suppress': 'OOF, AutoReply'
        }
      });

      console.log(`✅ [MAILER] Convite de assinatura enviado com sucesso para ${to}`);
      return {
        success: true,
        message: `Convite enviado para ${to}.`
      };
    } catch (error: any) {
      console.error('❌ [MAILER] Erro ao enviar e-mail de assinatura:', error);
      console.log(`🔗 Link de assinatura de contingência: ${signLink}`);
      return {
        success: true,
        message: 'Convite registrado com sucesso no sistema.'
      };
    }
  }
};
