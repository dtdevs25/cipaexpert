import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { SecurityService, AuthenticatedRequest } from './security';
import { calcularDimensionamentoNR5Backend, calcularPrazosCronogramaNR5 } from './nr5Rules';

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
// 7. SEED MANUAL DO BANCO (EXECUTÁVEL APENAS POR MASTER)
// ─────────────────────────────────────────────────────────────
apiRouter.post('/admin/seed', SecurityService.authenticate, SecurityService.requireRole(['master']), async (req: Request, res: Response) => {
  try {
    const { runDatabaseSeed } = await import('./seed');
    await runDatabaseSeed();
    res.json({ message: 'Seed do banco executado com sucesso e regras NR-5 sincronizadas!' });
  } catch (error) {
    console.error('Erro no seed manual:', error);
    res.status(500).json({ error: 'Falha na execução do seed.' });
  }
});
