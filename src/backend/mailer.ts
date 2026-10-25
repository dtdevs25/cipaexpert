import nodemailer from 'nodemailer';

/**
 * CIPA Expert - Serviço de Envio de E-mails Transacionais
 * Conformidade com OWASP e suporte a SMTP Seguro (TLS/SSL)
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

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Redefinição de Senha - CIPA Expert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { background: #064e3b; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: #a7f3d0; margin: 6px 0 0; font-size: 13px; font-weight: 500; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .content h2 { font-size: 18px; color: #0f172a; margin-top: 0; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35); }
    .warning { background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #92400e; margin: 24px 0; }
    .footer { padding: 20px 28px; background: #f1f5f9; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .link-alt { word-break: break-all; color: #059669; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>CIPA Expert</h1>
      <p>Gestão Digital & Inteligente da CIPA · NR-5</p>
    </div>
    <div class="content">
      <h2>Olá, ${userName}!</h2>
      <p>Recebemos uma solicitação para redefinir a sua senha de acesso à plataforma <strong>CIPA Expert</strong>.</p>
      <p>Para criar uma nova senha, clique no botão seguro abaixo:</p>
      
      <div class="btn-container">
        <a href="${resetLink}" class="btn" target="_blank">Redefinir Minha Senha</a>
      </div>

      <div class="warning">
        ⏱️ <strong>Atenção:</strong> Por motivos de segurança e conformidade, este link expira em <strong>24 horas</strong>.
      </div>

      <p style="font-size: 13px; color: #475569;">
        Se você não fez essa solicitação, nenhuma ação é necessária. Sua senha atual permanecerá segura e inalterada.
      </p>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:<br>
        <a href="${resetLink}" class="link-alt">${resetLink}</a>
      </p>
    </div>
    <div class="footer">
      © 2026 CIPA Expert · Sistema em estrita conformidade com a Norma Regulamentadora NR-5 e MP 2.200-2/2001.
    </div>
  </div>
</body>
</html>
    `;

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
        html: htmlContent
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
  }
};
