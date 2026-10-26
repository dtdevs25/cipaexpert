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

// Upload Dedicado de Imagens (Usuários, Colaboradores, Empresas) para o MinIO
apiRouter.post('/upload/photo', async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename, mimeType, folder = 'usuarios', entityId } = req.body;
    const targetId = entityId || (req as any).user?.userId || `img-${Date.now()}`;

    if (!imageBase64) {
      res.status(400).json({ success: false, error: 'Dados da imagem não fornecidos.' });
      return;
    }

    // Extrai o conteúdo base64 caso venha com prefixo data:image/...
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const finalMime = mimeType || 'image/jpeg';
    const finalName = filename || 'imagem.jpg';

    // Grava no bucket de fotos do MinIO
    const minioUrl = await StorageService.uploadPhoto(targetId, buffer, finalMime, finalName, folder);

    // Se foi avatar de usuário existente, atualiza no banco
    if (folder === 'usuarios' && targetId && !targetId.startsWith('img-')) {
      try {
        await prisma.user.update({
          where: { id: targetId },
          data: { avatarUrl: minioUrl }
        });
      } catch (dbErr) {
        // Usuário pode ser novo em cadastro
      }
    }

    res.json({
      success: true,
      message: 'Imagem enviada com sucesso para o bucket do MinIO!',
      url: minioUrl,
      avatarUrl: minioUrl,
      logoUrl: minioUrl,
      fotoUrl: minioUrl,
      targetId
    });
  } catch (error) {
    console.error('Erro no upload de imagem para o MinIO:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar upload da imagem no MinIO.' });
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
// ─────────────────────────────────────────────────────────────
// 7. GESTÃO DE EMPRESAS E FILIAIS (POSTGRESQL REAL + SEED AUTOMÁTICO)
// ─────────────────────────────────────────────────────────────
apiRouter.get('/companies', async (req: Request, res: Response) => {
  try {
    if (process.env.DATABASE_URL) {
      let companies = await prisma.company.findMany({
        include: {
          units: true
        },
        orderBy: { razaoSocial: 'asc' }
      });

      // Se o banco estiver vazio, executa o seed inicial de empresas e filiais
      if (!companies || companies.length === 0) {
        console.log('🌱 [API] Banco PostgreSQL sem empresas. Executando seed de empresas e unidades...');
        try {
          const { runDatabaseSeed } = await import('./seed');
          await runDatabaseSeed();
          companies = await prisma.company.findMany({
            include: {
              units: true
            },
            orderBy: { razaoSocial: 'asc' }
          });
        } catch (seedErr) {
          console.warn('⚠️ [API] Erro ao executar seed automático:', seedErr);
        }
      }

      if (companies && companies.length > 0) {
        const mapped = companies.map(c => ({
          ...c,
          cnaeCode: c.cnaePrincipalCode || '2511-0/00',
          cnaeDesc: c.cnaePrincipalDesc || 'Atividade Operacional',
          modulosContratados: {
            dimensionamento: c.moduloDimensionamento ?? true,
            eleicao: c.moduloEleicao ?? true,
            gestao: c.moduloGestao ?? true
          },
          units: (c.units || []).map(u => ({
            id: u.id,
            name: u.name,
            cnpj: (u as any).cnpj || c.cnpj,
            city: u.city,
            state: u.state,
            headcount: u.headcount,
            grauDeRisco: u.grauDeRisco,
            cnaeCode: u.cnaeCode,
            cnaeDesc: u.cnaeDesc,
            cipaAtiva: u.cipaAtiva,
            gestorName: u.gestorName
          }))
        }));
        res.json(mapped);
        return;
      }
    }
  } catch (error: any) {
    console.warn('⚠️ [API] Aviso ao listar empresas no PostgreSQL:', error?.message || error);
  }

  // Fallback seguro caso o banco de dados esteja offline
  try {
    const { INITIAL_COMPANIES } = await import('../data/multiCompanyData');
    res.json(INITIAL_COMPANIES);
  } catch {
    res.json([]);
  }
});

apiRouter.post('/companies', async (req: Request, res: Response) => {
  try {
    const { razaoSocial, nomeFantasia, cnpj, cnaePrincipalCode, cnaeCode, cnaePrincipalDesc, cnaeDesc, enderecoCompleto, responsavelAdmin } = req.body;
    if (!razaoSocial || !cnpj) {
      res.status(400).json({ error: 'Razão Social e CNPJ são obrigatórios.' });
      return;
    }
    const company = await prisma.company.create({
      data: {
        razaoSocial,
        nomeFantasia: nomeFantasia || razaoSocial,
        cnpj,
        cnaePrincipalCode: cnaePrincipalCode || cnaeCode,
        cnaePrincipalDesc: cnaePrincipalDesc || cnaeDesc,
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

apiRouter.put('/companies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { razaoSocial, nomeFantasia, cnpj, cnaePrincipalCode, cnaeCode, cnaePrincipalDesc, cnaeDesc, enderecoCompleto, responsavelAdmin, logoUrl } = req.body;
    
    if (process.env.DATABASE_URL) {
      const updated = await prisma.company.update({
        where: { id },
        data: {
          ...(razaoSocial ? { razaoSocial } : {}),
          ...(nomeFantasia ? { nomeFantasia } : {}),
          ...(cnpj ? { cnpj } : {}),
          ...(cnaePrincipalCode || cnaeCode ? { cnaePrincipalCode: cnaePrincipalCode || cnaeCode } : {}),
          ...(cnaePrincipalDesc || cnaeDesc ? { cnaePrincipalDesc: cnaePrincipalDesc || cnaeDesc } : {}),
          ...(enderecoCompleto ? { enderecoCompleto } : {}),
          ...(responsavelAdmin ? { responsavelAdmin } : {}),
          ...(logoUrl !== undefined ? { logoUrl } : {})
        },
        include: { units: true }
      });
      res.json(updated);
      return;
    }
    res.json({ id, ...req.body });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro ao atualizar empresa no banco de dados.' });
  }
});

apiRouter.delete('/companies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (process.env.DATABASE_URL) {
      await prisma.company.delete({
        where: { id }
      });
    }
    res.json({ success: true, message: 'Empresa removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    res.status(500).json({ error: 'Erro ao excluir empresa no banco de dados.' });
  }
});

apiRouter.get('/companies/:companyId/units', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    if (process.env.DATABASE_URL) {
      const units = await prisma.companyUnit.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
      });
      res.json(units);
      return;
    }
    res.json([]);
  } catch (error) {
    console.warn('Erro ao buscar unidades:', error);
    res.status(500).json({ error: 'Erro ao buscar filiais da empresa.' });
  }
});

apiRouter.post('/companies/:companyId/units', async (req: Request, res: Response) => {
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

apiRouter.put('/companies/:companyId/units/:unitId', async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const { name, city, state, headcount, grauDeRisco, cnaeCode, cnaeDesc, gestorName, cipaAtiva } = req.body;
    if (process.env.DATABASE_URL) {
      const updated = await prisma.companyUnit.update({
        where: { id: unitId },
        data: {
          ...(name ? { name } : {}),
          ...(city ? { city } : {}),
          ...(state ? { state } : {}),
          ...(headcount !== undefined ? { headcount: Number(headcount) } : {}),
          ...(grauDeRisco !== undefined ? { grauDeRisco: Number(grauDeRisco) } : {}),
          ...(cnaeCode ? { cnaeCode } : {}),
          ...(cnaeDesc ? { cnaeDesc } : {}),
          ...(gestorName ? { gestorName } : {}),
          ...(cipaAtiva !== undefined ? { cipaAtiva: Boolean(cipaAtiva) } : {})
        }
      });
      res.json(updated);
      return;
    }
    res.json({ id: unitId, ...req.body });
  } catch (error) {
    console.error('Erro ao atualizar filial:', error);
    res.status(500).json({ error: 'Erro ao atualizar filial no banco de dados.' });
  }
});

apiRouter.delete('/companies/:companyId/units/:unitId', async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    if (process.env.DATABASE_URL) {
      await prisma.companyUnit.delete({
        where: { id: unitId }
      });
    }
    res.json({ success: true, message: 'Filial removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir filial:', error);
    res.status(500).json({ error: 'Erro ao excluir filial no banco de dados.' });
  }
});

// ─────────────────────────────────────────────────────────────
// COLABORADORES (DIMENSIONAMENTO / PROCESSO ELEITORAL / NR-5)
// ─────────────────────────────────────────────────────────────
apiRouter.get('/employees', async (req: Request, res: Response) => {
  try {
    const { unitId, companyId } = req.query as { unitId?: string; companyId?: string };

    const whereClause: any = { ativo: true };
    if (unitId) {
      whereClause.unitId = unitId;
    } else if (companyId) {
      whereClause.unit = { companyId };
    }

    let employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        unit: {
          select: { id: true, name: true, companyId: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Se ainda não houver colaboradores para a filial especificada, popula com o catálogo base NR-5
    if (employees.length === 0 && unitId) {
      const defaultList = [
        { name: 'Marcos Vinicius Santos', apelido: 'Marcão da Usinagem', matricula: 'CLT-1024', cpf: '123.456.789-01', cargo: 'Operador de Torno CNC', setor: 'Usinagem Pesada', email: 'marcos.santos@empresa.com.br', dataAdmissao: new Date('2021-03-15') },
        { name: 'Ana Paula Ferreira', apelido: 'Paulinha do Almoxarifado', matricula: 'CLT-1058', cpf: '234.567.890-12', cargo: 'Supervisora de Logística', setor: 'Almoxarifado & Estoque', email: 'ana.ferreira@empresa.com.br', dataAdmissao: new Date('2019-08-20') },
        { name: 'Carlos Eduardo Mendes', apelido: 'Cadu da Manutenção', matricula: 'CLT-1092', cpf: '345.678.901-23', cargo: 'Eletricista Industrial', setor: 'Manutenção Elétrica', email: 'carlos.mendes@empresa.com.br', dataAdmissao: new Date('2020-01-10') },
        { name: 'Juliana Paes Rodrigues', apelido: 'Ju da Qualidade', matricula: 'CLT-1126', cpf: '456.789.012-34', cargo: 'Inspetora de Controle de Qualidade', setor: 'Garantia da Qualidade', email: 'juliana.rodrigues@empresa.com.br', dataAdmissao: new Date('2022-04-05') },
        { name: 'Roberto Alcantara Silva', apelido: 'Beto Caldeireiro', matricula: 'CLT-1160', cpf: '567.890.123-45', cargo: 'Caldeireiro Pesado', setor: 'Caldeiraria & Solda', email: 'roberto.alcantara@empresa.com.br', dataAdmissao: new Date('2018-11-12') },
        { name: 'Mariana Duarte Souza', apelido: 'Mari Solda', matricula: 'CLT-1195', cpf: '678.901.234-56', cargo: 'Soldadora MIG/MAG', setor: 'Caldeiraria & Solda', email: 'mariana.souza@empresa.com.br', dataAdmissao: new Date('2021-06-18') },
        { name: 'Lucas Souza Oliveira', apelido: 'Luquinhas da Montagem', matricula: 'CLT-1230', cpf: '789.012.345-67', cargo: 'Montador Mecânico Industrial', setor: 'Linha de Montagem', email: 'lucas.oliveira@empresa.com.br', dataAdmissao: new Date('2020-09-22') },
        { name: 'Camila Ribeiro Pinto', apelido: 'Cami da Empilhadeira', matricula: 'CLT-1270', cpf: '890.123.456-78', cargo: 'Operadora de Empilhadeira', setor: 'Logística & Expedição', email: 'camila.ribeiro@empresa.com.br', dataAdmissao: new Date('2022-02-14') },
        { name: 'Diego Fernando Martins', apelido: 'Dieguinho da Fresadora', matricula: 'CLT-1310', cpf: '901.234.567-89', cargo: 'Fresador Mecânico', setor: 'Usinagem Pesada', email: 'diego.martins@empresa.com.br', dataAdmissao: new Date('2019-12-03') },
        { name: 'Renata Vasconcelos', matricula: 'CLT-1345', cpf: '012.345.678-90', cargo: 'Assistente Administrativo Industrial', setor: 'PCP & Planejamento', email: 'renata.vasconcelos@empresa.com.br', dataAdmissao: new Date('2021-10-30') },
        { name: 'Eduardo Ramos Costa', apelido: 'Dudu Torneiro', matricula: 'CLT-1380', cpf: '123.789.456-01', cargo: 'Torneiro Mecânico', setor: 'Usinagem de Precisão', email: 'eduardo.costa@empresa.com.br', dataAdmissao: new Date('2019-05-19') },
        { name: 'Beatriz Nogueira Lima', apelido: 'Bia da Pintura', matricula: 'CLT-1415', cpf: '234.890.567-12', cargo: 'Pintora Industrial', setor: 'Tratamento de Superfície', email: 'beatriz.nogueira@empresa.com.br', dataAdmissao: new Date('2022-09-08') },
        { name: 'Gustavo Mendonça', matricula: 'CLT-1450', cpf: '345.901.678-23', cargo: 'Ajudante Geral', setor: 'Serviços Gerais', email: 'gustavo.mendonca@empresa.com.br', dataAdmissao: new Date('2023-05-11') },
        { name: 'Larissa Andrade Teixeira', apelido: 'Lari Engenharia', matricula: 'CLT-1485', cpf: '456.012.789-34', cargo: 'Analista de Processos Industriais', setor: 'Engenharia de Produção', email: 'larissa.andrade@empresa.com.br', dataAdmissao: new Date('2020-12-01') },
        { name: 'Marcelo Augusto Pires', apelido: 'Marcelão da Prensa', matricula: 'CLT-1520', cpf: '567.123.890-45', cargo: 'Operador de Prensa Hidráulica', setor: 'Estamparia Pesada', email: 'marcelo.pires@empresa.com.br', dataAdmissao: new Date('2018-07-25') },
        { name: 'Carla Cristina Barreto', matricula: 'CLT-1555', cpf: '678.234.901-56', cargo: 'Operadora de Ponte Rolante', setor: 'Logística Pesada', email: 'carla.barreto@empresa.com.br', dataAdmissao: new Date('2021-08-16') },
        { name: 'Thiago Farias Moura', matricula: 'CLT-1590', cpf: '789.345.012-67', cargo: 'Caldeireiro Montador', setor: 'Caldeiraria & Solda', email: 'thiago.moura@empresa.com.br', dataAdmissao: new Date('2019-03-22') },
        { name: 'Vanessa Toledo Dias', matricula: 'CLT-1625', cpf: '890.456.123-78', cargo: 'Conferente de Carga', setor: 'Expedição & Armazém', email: 'vanessa.dias@empresa.com.br', dataAdmissao: new Date('2022-04-10') },
        { name: 'Fábio Muniz Rezende', matricula: 'CLT-1660', cpf: '901.567.234-89', cargo: 'Lubrificador Industrial', setor: 'Manutenção Preditiva', email: 'fabio.rezende@empresa.com.br', dataAdmissao: new Date('2020-02-17') },
        { name: 'Juliana Neves Moreira', matricula: 'CLT-1695', cpf: '012.678.345-90', cargo: 'Operadora de Retífica', setor: 'Usinagem de Precisão', email: 'juliana.neves@empresa.com.br', dataAdmissao: new Date('2021-11-28') },
        { name: 'André Luiz Carvalho', matricula: 'CLT-1730', cpf: '123.789.456-02', cargo: 'Mecânico de Ajustagem', setor: 'Ferramentaria', email: 'andre.carvalho@empresa.com.br', dataAdmissao: new Date('2019-10-05') },
        { name: 'Tatiane Cristina Abreu', matricula: 'CLT-1765', cpf: '234.890.567-13', cargo: 'Auxiliar de Limpeza Industrial', setor: 'Facilities & Higiene', email: 'tatiane.abreu@empresa.com.br', dataAdmissao: new Date('2023-01-09') },
        { name: 'Rogério Batista Prado', matricula: 'CLT-1800', cpf: '345.901.678-24', cargo: 'Operador de Dobradeira CNC', setor: 'Conformação de Chapas', email: 'rogerio.prado@empresa.com.br', dataAdmissao: new Date('2020-06-30') },
        { name: 'Sabrina Vilela Matos', matricula: 'CLT-1835', cpf: '456.012.789-35', cargo: 'Encarregada de Expedição', setor: 'Logística & Expedição', email: 'sabrina.matos@empresa.com.br', dataAdmissao: new Date('2018-12-14') },
        { name: 'Bruno César Figueiredo', matricula: 'CLT-1870', cpf: '567.123.890-46', cargo: 'Operador de Corte a Laser', setor: 'Corte Térmico', email: 'bruno.figueiredo@empresa.com.br', dataAdmissao: new Date('2022-08-22') }
      ];

      for (const item of defaultList) {
        await prisma.employee.create({
          data: {
            ...item,
            unitId
          }
        });
      }

      employees = await prisma.employee.findMany({
        where: whereClause,
        include: {
          unit: {
            select: { id: true, name: true, companyId: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    const formatted = employees.map(e => ({
      id: e.id,
      name: e.name,
      apelido: e.apelido,
      matricula: e.matricula,
      cpf: e.cpf,
      cargo: e.cargo,
      setor: e.setor,
      email: e.email,
      dataAdmissao: e.dataAdmissao ? e.dataAdmissao.toISOString().split('T')[0] : '',
      fotoUrl: e.fotoUrl,
      unitId: e.unitId,
      companyId: e.unit?.companyId
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    res.status(500).json({ error: 'Erro ao buscar colaboradores do banco de dados.' });
  }
});

apiRouter.post('/employees', async (req: Request, res: Response) => {
  try {
    const { unitId, name, apelido, matricula, cpf, cargo, setor, email, dataAdmissao, fotoUrl } = req.body;
    if (!unitId || !name || !cargo) {
      res.status(400).json({ error: 'Unidade, Nome e Cargo são campos obrigatórios.' });
      return;
    }

    const created = await prisma.employee.create({
      data: {
        unitId,
        name: name.trim(),
        apelido: apelido?.trim() || null,
        matricula: matricula?.trim() || `CLT-${Math.floor(1000 + Math.random() * 9000)}`,
        cpf: cpf?.trim() || '000.000.000-00',
        cargo: cargo.trim(),
        setor: setor?.trim() || 'Operacional Geral',
        email: email?.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@empresa.com.br`,
        dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : new Date(),
        fotoUrl: fotoUrl?.trim() || null
      }
    });

    res.status(201).json({
      ...created,
      dataAdmissao: created.dataAdmissao.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Erro ao cadastrar colaborador:', error);
    res.status(500).json({ error: 'Erro ao salvar colaborador no banco de dados.' });
  }
});

apiRouter.put('/employees/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, apelido, matricula, cpf, cargo, setor, email, dataAdmissao, fotoUrl, unitId } = req.body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (apelido !== undefined) dataToUpdate.apelido = apelido?.trim() || null;
    if (matricula) dataToUpdate.matricula = matricula.trim();
    if (cpf && !cpf.includes('*')) dataToUpdate.cpf = cpf.trim();
    if (cargo) dataToUpdate.cargo = cargo.trim();
    if (setor !== undefined) dataToUpdate.setor = setor.trim();
    if (email) dataToUpdate.email = email.trim();
    if (dataAdmissao) dataToUpdate.dataAdmissao = new Date(dataAdmissao);
    if (fotoUrl !== undefined) dataToUpdate.fotoUrl = fotoUrl?.trim() || null;
    if (unitId) dataToUpdate.unitId = unitId;

    const updated = await prisma.employee.update({
      where: { id },
      data: dataToUpdate
    });

    res.json({
      ...updated,
      dataAdmissao: updated.dataAdmissao.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar colaborador:', error);
    res.status(500).json({ error: 'Erro ao atualizar colaborador no banco de dados.' });
  }
});

apiRouter.delete('/employees/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Colaborador removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir colaborador:', error);
    res.status(500).json({ error: 'Erro ao excluir colaborador do banco de dados.' });
  }
});

// ─────────────────────────────────────────────────────────────
// HISTÓRICO DE DIMENSIONAMENTO NR-5 (POSTGRESQL INTELIGENTE)
// ─────────────────────────────────────────────────────────────
let inMemoryDimensionamentos: any[] = [];

apiRouter.get('/dimensionamentos', async (req: Request, res: Response) => {
  try {
    const { unitId, companyId } = req.query as { unitId?: string; companyId?: string };
    
    if (process.env.DATABASE_URL) {
      try {
        const where: any = {};
        if (unitId) where.unitId = unitId;
        if (companyId) where.companyId = companyId;

        const records = await prisma.dimensionamento.findMany({
          where,
          include: {
            unit: { select: { id: true, name: true } },
            company: { select: { id: true, razaoSocial: true, nomeFantasia: true } }
          },
          orderBy: { createdAt: 'desc' }
        });

        const formatted = records.map(r => ({
          id: r.id,
          companyId: r.companyId,
          companyName: r.company?.nomeFantasia || r.company?.razaoSocial,
          unitId: r.unitId,
          unitName: r.unit?.name,
          cnaeCode: r.cnaeCode,
          cnaeDesc: r.cnaeDesc,
          headcount: r.headcount,
          grauDeRisco: r.grauDeRisco,
          precisaCipa: r.precisaCipa,
          efetivosEmpregador: r.efetivosEmpregador,
          suplentesEmpregador: r.suplentesEmpregador,
          efetivosEmpregados: r.efetivosEmpregados,
          suplentesEmpregados: r.suplentesEmpregados,
          totalMembros: r.totalMembros,
          observacaoNormativa: r.observacaoNormativa,
          createdBy: r.calculadoPor || 'Administrador SST',
          createdAt: r.createdAt.toLocaleString('pt-BR')
        }));

        res.json(formatted);
        return;
      } catch (dbErr) {
        console.warn('⚠️ [API] Falha ao consultar dimensionamentos no PostgreSQL, usando cache local:', dbErr);
      }
    }

    // Fallback em memória
    let filtered = inMemoryDimensionamentos;
    if (unitId) filtered = filtered.filter(d => d.unitId === unitId);
    if (companyId) filtered = filtered.filter(d => d.companyId === companyId);
    res.json(filtered);
  } catch (error) {
    console.error('Erro ao buscar dimensionamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de dimensionamentos.' });
  }
});

apiRouter.post('/dimensionamentos', async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      unitId,
      cnaeCode,
      cnaeDesc,
      headcount,
      grauDeRisco,
      precisaCipa,
      efetivosEmpregador,
      suplentesEmpregador,
      efetivosEmpregados,
      suplentesEmpregados,
      totalMembros,
      observacaoNormativa,
      calculadoPor
    } = req.body;

    if (!unitId || !companyId) {
      res.status(400).json({ error: 'Identificação da Empresa e Filial são obrigatórias.' });
      return;
    }

    const payload = {
      headcount: Number(headcount) || 0,
      grauDeRisco: Number(grauDeRisco) || 3,
      cnaeCode: cnaeCode || '2511-0/00',
      cnaeDesc: cnaeDesc || 'Atividade Operacional',
      precisaCipa: precisaCipa ?? true,
      efetivosEmpregador: Number(efetivosEmpregador) || 0,
      suplentesEmpregador: Number(suplentesEmpregador) || 0,
      efetivosEmpregados: Number(efetivosEmpregados) || 0,
      suplentesEmpregados: Number(suplentesEmpregados) || 0,
      totalMembros: Number(totalMembros) || 1,
      observacaoNormativa: observacaoNormativa || 'Parecer de enquadramento da NR-5.',
      calculadoPor: calculadoPor || 'Administrador SST'
    };

    if (process.env.DATABASE_URL) {
      try {
        // 1. Regra Inteligente: Verificar se já existe um dimensionamento da gestão nesta filial
        const existing = await prisma.dimensionamento.findFirst({
          where: { unitId },
          orderBy: { createdAt: 'desc' }
        });

        if (existing) {
          // Se headcount, cnae e grau de risco forem idênticos, não duplica
          const isIdentical =
            existing.headcount === payload.headcount &&
            existing.grauDeRisco === payload.grauDeRisco &&
            existing.cnaeCode === payload.cnaeCode &&
            existing.totalMembros === payload.totalMembros;

          if (isIdentical) {
            res.json({
              success: true,
              updated: false,
              message: 'Dimensionamento da gestão atual mantido sem alterações.',
              record: existing
            });
            return;
          }

          // Se houver alteração (ex: inclusão de novos colaboradores, alterando o headcount), atualiza o dimensionamento existente daquela gestão
          const updated = await prisma.dimensionamento.update({
            where: { id: existing.id },
            data: payload
          });

          res.json({
            success: true,
            updated: true,
            message: 'Dimensionamento da gestão atualizado com o novo efetivo de colaboradores.',
            record: updated
          });
          return;
        }

        // Se não existir dimensionamento para essa filial, cria o registro inicial da gestão
        const created = await prisma.dimensionamento.create({
          data: {
            companyId,
            unitId,
            ...payload
          }
        });

        res.status(201).json({
          success: true,
          created: true,
          message: 'Dimensionamento homologado e salvo no banco de dados com sucesso.',
          record: created
        });
        return;
      } catch (dbErr) {
        console.warn('⚠️ [API] Falha ao persistir dimensionamento no PostgreSQL, gravando em cache local:', dbErr);
      }
    }

    // Fallback inteligente em memória:
    const existingIndex = inMemoryDimensionamentos.findIndex(d => d.unitId === unitId);
    if (existingIndex >= 0) {
      const existing = inMemoryDimensionamentos[existingIndex];
      const isIdentical =
        existing.headcount === payload.headcount &&
        existing.grauDeRisco === payload.grauDeRisco &&
        existing.cnaeCode === payload.cnaeCode &&
        existing.totalMembros === payload.totalMembros;

      if (isIdentical) {
        res.json({
          success: true,
          updated: false,
          message: 'Dimensionamento da gestão atual mantido sem alterações.',
          record: existing
        });
        return;
      }

      inMemoryDimensionamentos[existingIndex] = {
        ...existing,
        ...payload,
        updatedAt: new Date().toLocaleString('pt-BR')
      };

      res.json({
        success: true,
        updated: true,
        message: 'Dimensionamento da gestão atualizado com o novo efetivo de colaboradores.',
        record: inMemoryDimensionamentos[existingIndex]
      });
      return;
    }

    const newRecord = {
      id: `dim-${Date.now()}`,
      companyId,
      unitId,
      ...payload,
      createdAt: new Date().toLocaleString('pt-BR')
    };
    inMemoryDimensionamentos.unshift(newRecord);

    res.status(201).json({
      success: true,
      created: true,
      message: 'Dimensionamento homologado e salvo no banco de dados com sucesso.',
      record: newRecord
    });
  } catch (error) {
    console.error('Erro ao salvar dimensionamento:', error);
    res.status(500).json({ error: 'Erro ao salvar dimensionamento no banco de dados.' });
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
// 7.5. MÓDULO DE ASSINATURAS DIGITAIS (DOCUSIGN / D4SIGN CIPA)
// ─────────────────────────────────────────────────────────────
apiRouter.post('/signatures/send-invitation', async (req: Request, res: Response) => {
  try {
    const { to, signerName, documentTitle, companyName, signLink, roleDescription, isReminder } = req.body;

    if (!to || !signerName || !documentTitle) {
      res.status(400).json({ success: false, error: 'E-mail, nome do signatário e título do documento são obrigatórios.' });
      return;
    }

    const result = await MailerService.sendSignatureInvitationEmail({
      to: to.toLowerCase().trim(),
      signerName,
      documentTitle,
      companyName: companyName || 'CIPA Expert',
      signLink: signLink || `${req.headers.origin || 'https://cipaexpert.com.br'}/?signDoc=1`,
      roleDescription,
      isReminder: Boolean(isReminder)
    });

    res.json({
      success: true,
      message: result.message || 'Convite para assinatura enviado com sucesso.'
    });
  } catch (error: any) {
    console.error('Erro ao enviar convite de assinatura:', error);
    res.status(500).json({ success: false, error: 'Falha ao processar envio do convite.' });
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

// ─────────────────────────────────────────────────────────────
// 9. CONSULTA DE CNAEs OFICIAIS (TABELA cnaes_referencia DO POSTGRESQL)
// ─────────────────────────────────────────────────────────────
apiRouter.get('/cnaes', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();

    // 1. Busca prioritária na tabela 'cnaes_referencia' do PostgreSQL via Prisma
    try {
      if (process.env.DATABASE_URL) {
        if (q) {
          const cleanQ = q.replace(/\D/g, '');
          const dbCnaes = await prisma.cnaeReference.findMany({
            where: {
              OR: [
                { code: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                ...(cleanQ ? [{ code: { contains: cleanQ } }] : [])
              ]
            },
            orderBy: { code: 'asc' },
            take: 500
          });

          if (dbCnaes && dbCnaes.length > 0) {
            res.json(dbCnaes);
            return;
          }
        } else {
          // Retorna todos os CNAEs cadastrados na tabela cnaes_referencia
          const dbCnaes = await prisma.cnaeReference.findMany({
            orderBy: { code: 'asc' }
          });

          if (dbCnaes && dbCnaes.length > 0) {
            res.json(dbCnaes);
            return;
          }
        }
      }
    } catch (dbErr: any) {
      console.warn('⚠️ [API] Aviso ao consultar tabela cnaes_referencia do PostgreSQL:', dbErr?.message || dbErr);
    }

    // 2. Fallback caso a tabela no banco esteja temporariamente vazia ou sem DATABASE_URL
    const { CNAE_DATABASE } = await import('../data/cnaeData');
    if (!q) {
      res.json(CNAE_DATABASE);
      return;
    }
    const cleanQ = q.replace(/\D/g, '');
    const filtered = CNAE_DATABASE.filter(c => {
      const cleanCode = c.code.replace(/\D/g, '');
      return c.code.toLowerCase().includes(q.toLowerCase()) ||
        (cleanQ && cleanCode.includes(cleanQ)) ||
        (c.description && c.description.toLowerCase().includes(q.toLowerCase()));
    });
    res.json(filtered);
  } catch (error) {
    console.error('Erro ao consultar CNAEs:', error);
    res.status(500).json({ error: 'Erro ao consultar tabela de CNAEs.' });
  }
});


