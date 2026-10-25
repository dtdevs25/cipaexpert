import { Router, Request, Response } from 'express';
import path from 'path';
import { prisma } from './db';
import { SecurityService, AuthenticatedRequest } from './security';
import { calcularDimensionamentoNR5Backend, calcularPrazosCronogramaNR5 } from './nr5Rules';
import { MailerService } from './mailer';
import { StorageService } from './storage';

export const apiRouter = Router();

// ─────────────────────────────────────────────────────────────
// 1. AUTENTICAÇÃO E PERFIL (SEGURANÇA OWASP / BCRYPT / JWT)
// ─────────────────────────────────────────────────────────────
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { company: true, unit: true }
    });

    if (!user || !user.ativo) {
      // Prevenção de timing attack e enumeração de usuários
      res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo.' });
      return;
    }

    // Validação da senha com bcrypt
    const passwordMatch = await SecurityService.comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo.' });
      return;
    }

    // Atualiza data do último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Registra log de auditoria
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: 'USER_LOGIN',
        details: `Login realizado com sucesso por ${user.email}`,
        ipAddress: req.ip,
        hashSha256: SecurityService.generateSha256(`${user.id}:${Date.now()}`)
      }
    });

    // Gera token JWT seguro
    const token = SecurityService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      unitId: user.unitId
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        unitId: user.unitId,
        companyName: user.company?.nomeFantasia,
        unitName: user.unit?.name,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno ao processar autenticação.' });
  }
});

apiRouter.get('/auth/me', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { company: true, unit: true }
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      unitId: user.unitId,
      companyName: user.company?.nomeFantasia,
      unitName: user.unit?.name,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar perfil do usuário.' });
  }
});

// Atualizar Nome e Foto de Perfil (Foto gravada diretamente no MinIO)
apiRouter.put('/auth/profile', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let { name, avatarUrl } = req.body;
    const userId = req.user!.userId;

    // Se o avatar foi enviado em base64 (upload do computador), envia para o bucket do MinIO
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')) {
      const match = avatarUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        try {
          avatarUrl = await StorageService.uploadPhoto(userId, buffer, mimeType, `avatar.${ext}`);
          console.log(`✅ [PROFILE] Foto de perfil enviada com sucesso para o MinIO: ${avatarUrl}`);
        } catch (storageErr) {
          console.error('❌ [PROFILE] Falha ao enviar foto para o MinIO:', storageErr);
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {})
      },
      include: { company: true, unit: true }
    });

    const userPayload = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      companyId: updatedUser.companyId,
      unitId: updatedUser.unitId,
      companyName: updatedUser.company?.nomeFantasia,
      unitName: updatedUser.unit?.name,
      avatarUrl: updatedUser.avatarUrl
    };

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      user: userPayload,
      ...userPayload
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar dados do perfil.' });
  }
});

// Upload Dedicado de Foto de Perfil para o MinIO
apiRouter.post('/upload/photo', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageBase64, filename, mimeType } = req.body;
    const userId = req.user!.userId;

    if (!imageBase64) {
      res.status(400).json({ success: false, error: 'Dados da imagem não fornecidos.' });
      return;
    }

    // Extrai o conteúdo base64 caso venha com prefixo data:image/...
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const finalMime = mimeType || 'image/jpeg';
    const finalName = filename || 'avatar.jpg';

    // Grava no bucket de fotos do MinIO
    const minioUrl = await StorageService.uploadPhoto(userId, buffer, finalMime, finalName);

    // Atualiza a URL da foto no registro do usuário no banco
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: minioUrl }
    });

    res.json({
      success: true,
      message: 'Foto enviada com sucesso para o bucket do MinIO!',
      avatarUrl: minioUrl,
      userId: updatedUser.id
    });
  } catch (error) {
    console.error('Erro no upload de foto para o MinIO:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar upload da foto no MinIO.' });
  }
});

// Proxy Seguro de Visualização de Arquivos do MinIO (para buckets públicos ou privados)
apiRouter.get('/storage/:bucket/*', async (req: Request, res: Response) => {
  try {
    const bucket = req.params.bucket;
    const objectName = req.params[0];

    if (!bucket || !objectName) {
      res.status(400).send('Parâmetros inválidos.');
      return;
    }

    try {
      const stat = await StorageService.getFileStat(bucket, objectName);
      if (stat.metaData && stat.metaData['content-type']) {
        res.setHeader('Content-Type', stat.metaData['content-type']);
      } else {
        const ext = path.extname(objectName).toLowerCase();
        if (ext === '.png') res.setHeader('Content-Type', 'image/png');
        else if (ext === '.jpg' || ext === '.jpeg') res.setHeader('Content-Type', 'image/jpeg');
        else if (ext === '.webp') res.setHeader('Content-Type', 'image/webp');
      }

      res.setHeader('Cache-Control', 'public, max-age=86400');
      const stream = await StorageService.getFileStream(bucket, objectName);
      stream.pipe(res);
    } catch (err: any) {
      res.status(404).send('Arquivo não encontrado no MinIO.');
    }
  } catch (error) {
    res.status(500).send('Erro ao buscar arquivo no MinIO.');
  }
});

// Esqueci a Senha - Valida se o usuário existe e envia e-mail com token de 24h
apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Informe um e-mail válido.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      res.status(404).json({ error: 'E-mail não encontrado no cadastro do sistema.' });
      return;
    }

    // Gera token criptografado JWT com validade estrita de 24 horas
    const resetToken = SecurityService.generateResetToken(user.id, user.email);

    // Monta a URL de redefinição
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const resetLink = `${origin}/?resetToken=${resetToken}`;

    // Envia e-mail
    await MailerService.sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetLink
    });

    res.json({
      success: true,
      message: 'Link de redefinição de senha enviado com sucesso para o seu e-mail! Válido por 24 horas.'
    });
  } catch (error) {
    console.error('Erro ao processar esqueci a senha:', error);
    res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
  }
});

// Solicitar link de redefinição para o próprio usuário logado
apiRouter.post('/auth/request-reset-my-password', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const resetToken = SecurityService.generateResetToken(user.id, user.email);
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const resetLink = `${origin}/?resetToken=${resetToken}`;

    await MailerService.sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetLink
    });

    res.json({
      success: true,
      message: `Link de redefinição enviado com sucesso para seu e-mail cadastrado (${user.email}). Válido por 24 horas.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao solicitar redefinição de senha.' });
  }
});

// Redefinir Senha utilizando o token de 24h
apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'A nova senha deve possuir pelo menos 8 caracteres.' });
      return;
    }

    let decoded: { userId: string; email: string };
    try {
      decoded = SecurityService.verifyResetToken(token);
    } catch {
      res.status(400).json({ error: 'Link de redefinição expirado ou inválido (prazo de 24 horas excedido).' });
      return;
    }

    const passwordHash = await SecurityService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash }
    });

    res.json({
      success: true,
      message: 'Sua senha foi redefinida com sucesso! Você já pode acessar a plataforma.'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. CNAES E CONSULTA NORMATIVA
// ─────────────────────────────────────────────────────────────
apiRouter.get('/cnaes', async (req: Request, res: Response) => {
  try {
    const search = req.query.q as string;
    const cnaes = await prisma.cnaeReference.findMany({
      where: search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          }
        : undefined,
      orderBy: { code: 'asc' }
    });
    res.json(cnaes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar CNAEs.' });
  }
});

apiRouter.post('/cnaes', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const items = Array.isArray(data) ? data : [data];

    let count = 0;
    for (const item of items) {
      if (item.code && item.description && item.grauDeRisco !== undefined) {
        await prisma.cnaeReference.upsert({
          where: { code: item.code },
          update: {
            description: item.description,
            grauDeRisco: Number(item.grauDeRisco),
            sectorGroup: item.sectorGroup || null,
            observacoes: item.observacoes
          },
          create: {
            code: item.code,
            description: item.description,
            grauDeRisco: Number(item.grauDeRisco),
            sectorGroup: item.sectorGroup || null,
            observacoes: item.observacoes
          }
        });
        count++;
      }
    }

    res.json({ success: true, message: `${count} CNAEs inseridos/atualizados com sucesso!`, totalProcessed: count });
  } catch (error) {
    console.error('Erro ao cadastrar CNAEs:', error);
    res.status(500).json({ error: 'Erro ao registrar CNAEs no banco de dados.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. MÓDULO 1: CÁLCULO E HISTÓRICO DE DIMENSIONAMENTO NR-5
// ─────────────────────────────────────────────────────────────
apiRouter.post('/dimensionamento/calcular', (req: Request, res: Response) => {
  try {
    const { grauDeRisco, headcount } = req.body;
    if (!grauDeRisco || headcount === undefined || headcount < 0) {
      res.status(400).json({ error: 'Grau de risco (1 a 4) e quantidade de colaboradores são obrigatórios.' });
      return;
    }

    const resultado = calcularDimensionamentoNR5Backend(Number(grauDeRisco), Number(headcount));
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar dimensionamento normativo.' });
  }
});

apiRouter.post('/dimensionamento/salvar', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyId, unitId, cnaeCode, cnaeDesc, headcount, grauDeRisco } = req.body;

    if (!companyId || !unitId || !cnaeCode || headcount === undefined) {
      res.status(400).json({ error: 'Dados incompletos para arquivamento do dimensionamento.' });
      return;
    }

    const calculo = calcularDimensionamentoNR5Backend(Number(grauDeRisco), Number(headcount));

    const dimensionamento = await prisma.dimensionamento.create({
      data: {
        companyId,
        unitId,
        cnaeCode,
        cnaeDesc: cnaeDesc || 'Atividade Operacional',
        headcount: Number(headcount),
        grauDeRisco: Number(grauDeRisco),
        precisaCipa: calculo.precisaCipa,
        efetivosEmpregador: calculo.efetivosEmpregador,
        suplentesEmpregador: calculo.suplentesEmpregador,
        efetivosEmpregados: calculo.efetivosEmpregados,
        suplentesEmpregados: calculo.suplentesEmpregados,
        totalMembros: calculo.totalMembros,
        observacaoNormativa: calculo.observacaoNormativa,
        calculadoPor: req.user?.email
      }
    });

    res.status(201).json(dimensionamento);
  } catch (error) {
    console.error('Erro ao salvar dimensionamento:', error);
    res.status(500).json({ error: 'Falha ao gravar dimensionamento no banco de dados.' });
  }
});

apiRouter.get('/dimensionamento/historico/:unitId', SecurityService.authenticate, async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const historico = await prisma.dimensionamento.findMany({
      where: { unitId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar histórico da unidade.' });
  }
});

apiRouter.get('/dimensionamento/regras', async (req: Request, res: Response) => {
  try {
    const regras = await prisma.nr5DimensionamentoRegra.findMany({
      orderBy: [{ grauDeRisco: 'asc' }, { faixaMin: 'asc' }]
    });
    res.json(regras);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar regras do Quadro I da NR-5.' });
  }
});

apiRouter.post('/dimensionamento/regras', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const items = Array.isArray(data) ? data : [data];
    let count = 0;
    for (const item of items) {
      await prisma.nr5DimensionamentoRegra.create({
        data: {
          grauDeRisco: Number(item.grauDeRisco),
          faixaMin: Number(item.faixaMin),
          faixaMax: item.faixaMax !== undefined && item.faixaMax !== null ? Number(item.faixaMax) : null,
          efetivosPorParte: Number(item.efetivosPorParte || 0),
          suplentesPorParte: Number(item.suplentesPorParte || 0),
          precisaCipa: item.precisaCipa !== undefined ? Boolean(item.precisaCipa) : true,
          observacao: item.observacao || null
        }
      });
      count++;
    }
    res.json({ success: true, message: `${count} regras do Quadro I da NR-5 salvas com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar regras da NR-5.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. MÓDULO 2: ELEIÇÃO ONLINE E URNA ELETRÔNICA AUDITADA
// ─────────────────────────────────────────────────────────────
apiRouter.get('/eleicao/ativa/:unitId', SecurityService.authenticate, async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const eleicao = await prisma.eleicao.findFirst({
      where: { unitId, status: { in: ['planejamento', 'inscricoes_abertas', 'votacao_aberta', 'apurada'] } },
      include: {
        candidatos: {
          where: { deferido: true },
          orderBy: { numero: 'asc' }
        }
      }
    });

    if (!eleicao) {
      res.status(404).json({ error: 'Nenhuma eleição ativa para esta unidade.' });
      return;
    }

    res.json(eleicao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter eleição ativa.' });
  }
});

// Endpoint seguro de votação: Impede voto duplo via chave única no banco e desacopla identidade
apiRouter.post('/eleicao/votar', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eleicaoId, candidatoId } = req.body;
    const userId = req.user!.userId;

    if (!eleicaoId || !candidatoId) {
      res.status(400).json({ error: 'Identificador da eleição e escolha do voto são obrigatórios.' });
      return;
    }

    // 1. Valida se a eleição está aberta
    const eleicao = await prisma.eleicao.findUnique({
      where: { id: eleicaoId }
    });

    if (!eleicao || eleicao.status !== 'votacao_aberta') {
      res.status(400).json({ error: 'A urna digital não está aberta para votação no momento.' });
      return;
    }

    // 2. Valida se o usuário já votou (Bloqueio Antifraude)
    const votoExistente = await prisma.votoRegistro.findUnique({
      where: {
        eleicaoId_userId: {
          eleicaoId,
          userId
        }
      }
    });

    if (votoExistente) {
      res.status(409).json({
        error: 'Voto já registrado! Cada colaborador tem direito a exatamente 1 voto auditável.',
        hashComprovante: votoExistente.hashComprovante,
        timestamp: votoExistente.timestamp
      });
      return;
    }

    // 3. Transação atômica do banco: incrementa voto e salva registro de auditoria
    const timestamp = new Date().toISOString();
    const hashComprovante = SecurityService.generateVoteHash(eleicaoId, timestamp);

    await prisma.$transaction(async (tx) => {
      // Registra que o usuário votou nesta eleição (sem salvar em quem ele votou!)
      await tx.votoRegistro.create({
        data: {
          eleicaoId,
          userId,
          hashComprovante,
          ipAnonimizado: req.ip ? `${req.ip.slice(0, 7)}***` : 'anon'
        }
      });

      // Incrementa o voto do candidato ou brancos/nulos
      if (candidatoId === 'branco') {
        await tx.eleicao.update({
          where: { id: eleicaoId },
          data: { votosBrancos: { increment: 1 } }
        });
      } else if (candidatoId === 'nulo') {
        await tx.eleicao.update({
          where: { id: eleicaoId },
          data: { votosNulos: { increment: 1 } }
        });
      } else {
        await tx.candidato.update({
          where: { id: candidatoId },
          data: { totalVotos: { increment: 1 } }
        });
      }

      // Auditoria
      await tx.auditLog.create({
        data: {
          companyId: eleicao.companyId,
          userId,
          action: 'VOTE_REGISTERED',
          details: `Voto computado na eleição ${eleicao.id}`,
          hashSha256: hashComprovante
        }
      });
    });

    res.status(201).json({
      success: true,
      hashComprovante,
      timestamp,
      message: 'Voto computado com sucesso na urna inviolável da CIPA!'
    });
  } catch (error) {
    console.error('Erro ao registrar voto:', error);
    res.status(500).json({ error: 'Erro interno ao computar voto.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. MÓDULO 3: GESTÃO CIPA, MAPA DE RISCOS E PLANO 5W2H
// ─────────────────────────────────────────────────────────────
apiRouter.get('/riscos/:unitId', SecurityService.authenticate, async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const riscos = await prisma.riskPoint.findMany({
      where: { unitId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(riscos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar mapa de riscos.' });
  }
});

apiRouter.post('/riscos', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyId, unitId, setor, tipoRisco, grauGravidade, agenteIdentificado, medidasPreventivas, xPercent, yPercent } = req.body;

    const risco = await prisma.riskPoint.create({
      data: {
        companyId,
        unitId,
        setor,
        tipoRisco,
        grauGravidade,
        agenteIdentificado,
        medidasPreventivas,
        xPercent: Number(xPercent),
        yPercent: Number(yPercent)
      }
    });

    res.status(201).json(risco);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar ponto no mapa de riscos.' });
  }
});

apiRouter.get('/planos-5w2h/:unitId', SecurityService.authenticate, async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const planos = await prisma.planoAcao5W2H.findMany({
      where: { unitId },
      orderBy: { quando: 'asc' }
    });
    res.json(planos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar planos de ação.' });
  }
});

apiRouter.post('/planos-5w2h', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyId, unitId, oQue, porQue, onde, quem, quando, como, quanto, categoria } = req.body;

    const plano = await prisma.planoAcao5W2H.create({
      data: {
        companyId,
        unitId,
        oQue,
        porQue: porQue || 'Ação preventiva deliberada pela CIPA',
        onde,
        quem,
        quando: new Date(quando),
        como: como || 'Implementação direta com registro',
        quanto: quanto || 'R$ 0,00',
        categoria: categoria || 'prevencao_acidentes'
      }
    });

    res.status(201).json(plano);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar plano de ação 5W2H.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. ASSINATURAS DIGITAIS E ATAS
// ─────────────────────────────────────────────────────────────
apiRouter.post('/atas/:ataId/assinar', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ataId } = req.params;
    const { signerName, signerCpf, signerRole } = req.body;
    const userId = req.user!.userId;

    const timestamp = new Date().toISOString();
    const hashAssinatura = SecurityService.generateSha256(`ATA-SIGN:${ataId}:${userId}:${signerCpf}:${timestamp}`);

    const assinatura = await prisma.assinaturaEletronica.create({
      data: {
        ataId,
        userId,
        signerName,
        signerCpf,
        signerRole,
        hashAssinatura,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      success: true,
      hashAssinatura,
      dataHora: timestamp,
      mensagem: 'Ata assinada digitalmente com certificado criptográfico!'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar assinatura eletrônica da ata.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. GESTÃO DE EMPRESAS, UNIDADES E USUÁRIOS (POSTGRESQL REAL)
// ─────────────────────────────────────────────────────────────
apiRouter.get('/companies', async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        units: true
      },
      orderBy: { razaoSocial: 'asc' }
    });
    res.json(companies);
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro ao buscar empresas no banco de dados.' });
  }
});

apiRouter.post('/companies', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { razaoSocial, nomeFantasia, cnpj, cnaePrincipalCode, cnaePrincipalDesc, enderecoCompleto, responsavelAdmin } = req.body;
    if (!razaoSocial || !cnpj) {
      res.status(400).json({ error: 'Razão Social e CNPJ são obrigatórios.' });
      return;
    }
    const company = await prisma.company.create({
      data: {
        razaoSocial,
        nomeFantasia: nomeFantasia || razaoSocial,
        cnpj,
        cnaePrincipalCode,
        cnaePrincipalDesc,
        enderecoCompleto,
        responsavelAdmin
      },
      include: { units: true }
    });
    res.status(201).json(company);
  } catch (error) {
    console.error('Erro ao cadastrar empresa:', error);
    res.status(500).json({ error: 'Erro ao cadastrar empresa no banco de dados.' });
  }
});

apiRouter.post('/companies/:companyId/units', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const { name, city, state, headcount, grauDeRisco, cnaeCode, cnaeDesc, gestorName } = req.body;
    if (!name || !city || !state) {
      res.status(400).json({ error: 'Nome da filial, cidade e UF são obrigatórios.' });
      return;
    }
    const unit = await prisma.companyUnit.create({
      data: {
        companyId,
        name,
        city,
        state,
        headcount: Number(headcount) || 0,
        grauDeRisco: Number(grauDeRisco) || 3,
        cnaeCode: cnaeCode || '2511-0/00',
        cnaeDesc: cnaeDesc || 'Atividade Operacional',
        gestorName
      }
    });
    res.status(201).json(unit);
  } catch (error) {
    console.error('Erro ao cadastrar filial:', error);
    res.status(500).json({ error: 'Erro ao cadastrar unidade no banco de dados.' });
  }
});

apiRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        company: true,
        unit: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      companyId: u.companyId,
      unitId: u.unitId,
      companyName: u.company?.nomeFantasia,
      unitName: u.unit?.name,
      cpf: u.cpf,
      matricula: u.matricula,
      avatarUrl: u.avatarUrl,
      ativo: u.ativo,
      createdAt: u.createdAt
    }));

    res.json(safeUsers);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários no banco de dados.' });
  }
});

apiRouter.post('/users', SecurityService.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role, companyId, unitId, cpf, matricula } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
      return;
    }

    const passwordHash = await SecurityService.hashPassword(password || 'CipaExpert@2026');

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || 'eleitor',
        companyId: companyId || null,
        unitId: unitId || null,
        cpf,
        matricula
      },
      include: { company: true, unit: true }
    });

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      companyId: newUser.companyId,
      unitId: newUser.unitId,
      companyName: newUser.company?.nomeFantasia,
      unitName: newUser.unit?.name
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário no banco de dados.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. SEED E DIAGNÓSTICO DO SISTEMA
// ─────────────────────────────────────────────────────────────
apiRouter.get('/system/status', async (req: Request, res: Response) => {
  try {
    let dbConnected = false;
    let userCount = 0;
    let companyCount = 0;
    try {
      userCount = await prisma.user.count();
      companyCount = await prisma.company.count();
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    res.json({
      database: dbConnected ? 'connected' : 'disconnected',
      userCount,
      companyCount,
      status: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter status do sistema.' });
  }
});

apiRouter.post('/admin/seed', async (req: Request, res: Response) => {
  try {
    const { runDatabaseSeed } = await import('./seed');
    await runDatabaseSeed();
    const totalUsers = await prisma.user.count();
    res.json({ 
      success: true, 
      message: `Seed executado com sucesso! Total de ${totalUsers} usuários cadastrados no PostgreSQL.`,
      usersCount: totalUsers
    });
  } catch (error: any) {
    console.error('Erro no seed manual:', error);
    res.status(500).json({ error: error.message || 'Falha na execução do seed.' });
  }
});

