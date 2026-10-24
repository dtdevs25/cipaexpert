var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/backend/db.ts
import { PrismaClient } from "@prisma/client";
var prisma;
var init_db = __esm({
  "src/backend/db.ts"() {
    prisma = globalThis.prismaGlobal ?? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
    });
    if (process.env.NODE_ENV !== "production") {
      globalThis.prismaGlobal = prisma;
    }
  }
});

// src/backend/security.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
var JWT_SECRET, BCRYPT_ROUNDS, SecurityService;
var init_security = __esm({
  "src/backend/security.ts"() {
    JWT_SECRET = process.env.JWT_SECRET || "cipa-expert-enterprise-ultra-secure-secret-key-2026-nr5";
    BCRYPT_ROUNDS = 12;
    SecurityService = {
      // Hash seguro de senhas com bcrypt (12 rounds)
      async hashPassword(password) {
        if (!password || password.length < 8) {
          throw new Error("A senha deve ter no m\xEDnimo 8 caracteres.");
        }
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        return bcrypt.hash(password, salt);
      },
      // Verificação segura de senha
      async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
      },
      // Geração de token JWT com expiração
      generateToken(payload, expiresIn = "12h") {
        return jwt.sign(payload, JWT_SECRET, { expiresIn });
      },
      // Verificação de token JWT
      verifyToken(token) {
        return jwt.verify(token, JWT_SECRET);
      },
      // Geração de Hash Criptográfico SHA-256 para Auditoria e Votação
      generateSha256(data) {
        return crypto.createHash("sha256").update(data).digest("hex").toUpperCase();
      },
      // Geração de Hash Inviolável para Voto Eletrônico (Zero-Knowledge)
      generateVoteHash(eleicaoId, timestamp) {
        const salt = crypto.randomBytes(16).toString("hex");
        const raw = `NR5-VOTE:${eleicaoId}:${timestamp}:${salt}`;
        return `VOTE-${this.generateSha256(raw).slice(0, 32)}`;
      },
      // Middleware de Autenticação JWT
      authenticate(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          res.status(401).json({ error: "Acesso negado: Token de autoriza\xE7\xE3o n\xE3o fornecido." });
          return;
        }
        const token = authHeader.split(" ")[1];
        try {
          const decoded = SecurityService.verifyToken(token);
          req.user = decoded;
          next();
        } catch {
          res.status(401).json({ error: "Token inv\xE1lido ou expirado. Fa\xE7a login novamente." });
        }
      },
      // Middleware de Autorização Baseada em Papel (RBAC)
      requireRole(allowedRoles) {
        return (req, res, next) => {
          if (!req.user) {
            res.status(401).json({ error: "N\xE3o autenticado." });
            return;
          }
          if (req.user.role === "master" || allowedRoles.includes(req.user.role)) {
            next();
          } else {
            res.status(403).json({ error: "Acesso proibido: Seu perfil n\xE3o possui permiss\xE3o para esta opera\xE7\xE3o." });
          }
        };
      }
    };
  }
});

// src/backend/nr5Rules.ts
function calcularDimensionamentoNR5Backend(grauDeRisco, headcount) {
  const horasTreinamento = grauDeRisco === 1 ? 8 : grauDeRisco === 2 ? 12 : grauDeRisco === 3 ? 16 : 20;
  if (headcount < 20) {
    return {
      precisaCipa: false,
      efetivosEmpregador: 0,
      suplentesEmpregador: 0,
      efetivosEmpregados: 0,
      suplentesEmpregados: 0,
      totalMembros: 1,
      // 1 Designado
      horasTreinamento,
      observacaoNormativa: `Estabelecimento com ${headcount} colaboradores (at\xE9 19): dispensado de constitui\xE7\xE3o parit\xE1ria de CIPA conforme item 5.6.4 da NR-5. A organiza\xE7\xE3o deve designar 1 (um) colaborador formal com treinamento obrigat\xF3rio de ${horasTreinamento} horas com m\xF3dulo de combate ao ass\xE9dio (Lei 14.457/22).`
    };
  }
  let efetivosPorParte = 1;
  let suplentesPorParte = 1;
  if (grauDeRisco === 1) {
    if (headcount <= 50) {
      efetivosPorParte = 1;
      suplentesPorParte = 1;
    } else if (headcount <= 100) {
      efetivosPorParte = 2;
      suplentesPorParte = 2;
    } else if (headcount <= 250) {
      efetivosPorParte = 3;
      suplentesPorParte = 3;
    } else if (headcount <= 500) {
      efetivosPorParte = 4;
      suplentesPorParte = 3;
    } else {
      efetivosPorParte = 5;
      suplentesPorParte = 4;
    }
  } else if (grauDeRisco === 2) {
    if (headcount <= 50) {
      efetivosPorParte = 1;
      suplentesPorParte = 1;
    } else if (headcount <= 100) {
      efetivosPorParte = 2;
      suplentesPorParte = 2;
    } else if (headcount <= 250) {
      efetivosPorParte = 4;
      suplentesPorParte = 3;
    } else if (headcount <= 500) {
      efetivosPorParte = 5;
      suplentesPorParte = 4;
    } else {
      efetivosPorParte = 6;
      suplentesPorParte = 5;
    }
  } else if (grauDeRisco === 3) {
    if (headcount <= 29) {
      efetivosPorParte = 1;
      suplentesPorParte = 1;
    } else if (headcount <= 50) {
      efetivosPorParte = 2;
      suplentesPorParte = 2;
    } else if (headcount <= 100) {
      efetivosPorParte = 3;
      suplentesPorParte = 3;
    } else if (headcount <= 250) {
      efetivosPorParte = 5;
      suplentesPorParte = 4;
    } else if (headcount <= 500) {
      efetivosPorParte = 6;
      suplentesPorParte = 5;
    } else {
      efetivosPorParte = 8;
      suplentesPorParte = 6;
    }
  } else {
    if (headcount <= 29) {
      efetivosPorParte = 1;
      suplentesPorParte = 1;
    } else if (headcount <= 50) {
      efetivosPorParte = 3;
      suplentesPorParte = 3;
    } else if (headcount <= 100) {
      efetivosPorParte = 4;
      suplentesPorParte = 3;
    } else if (headcount <= 250) {
      efetivosPorParte = 6;
      suplentesPorParte = 5;
    } else if (headcount <= 500) {
      efetivosPorParte = 7;
      suplentesPorParte = 6;
    } else {
      efetivosPorParte = 9;
      suplentesPorParte = 7;
    }
  }
  const total = (efetivosPorParte + suplentesPorParte) * 2;
  return {
    precisaCipa: true,
    efetivosEmpregador: efetivosPorParte,
    suplentesEmpregador: suplentesPorParte,
    efetivosEmpregados: efetivosPorParte,
    suplentesEmpregados: suplentesPorParte,
    totalMembros: total,
    horasTreinamento,
    observacaoNormativa: `Constitui\xE7\xE3o Obrigat\xF3ria da CIPA (NR-5 - Grau de Risco ${grauDeRisco}): Comiss\xE3o de ${total} cipeiros parit\xE1rios (${efetivosPorParte} titulares e ${suplentesPorParte} suplentes eleitos pelos trabalhadores em vota\xE7\xE3o secreta; igual n\xFAmero indicado pela organiza\xE7\xE3o). Treinamento obrigat\xF3rio de ${horasTreinamento} horas com inclus\xE3o de preven\xE7\xE3o e combate ao ass\xE9dio sexual e outras formas de viol\xEAncia no trabalho (Lei 14.457/2022).`
  };
}
function calcularPrazosCronogramaNR5(dataTerminoMandato) {
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  return {
    dataEditalConvocacao: addDays(dataTerminoMandato, -60),
    // Item 5.5.1: Mínimo 60 dias antes
    dataConstituicaoCE: addDays(dataTerminoMandato, -55),
    // Item 5.5.2: 55 dias antes
    dataInicioInscricoes: addDays(dataTerminoMandato, -45),
    // Mínimo 15 dias de período de inscrição
    dataFimInscricoes: addDays(dataTerminoMandato, -30),
    dataInicioVotacao: addDays(dataTerminoMandato, -30),
    // Item 5.5.3: Eleição no mínimo 30 dias antes do término
    dataFimVotacao: addDays(dataTerminoMandato, -28),
    dataTreinamento: addDays(dataTerminoMandato, -10),
    // Item 5.7.1: Treinamento antes da posse
    dataPosse: addDays(dataTerminoMandato, 1)
    // Item 5.5.5: Primeiro dia útil após o mandato anterior
  };
}
var init_nr5Rules = __esm({
  "src/backend/nr5Rules.ts"() {
  }
});

// src/backend/seed.ts
var seed_exports = {};
__export(seed_exports, {
  OFFICIAL_CNAES: () => OFFICIAL_CNAES,
  runDatabaseSeed: () => runDatabaseSeed
});
async function runDatabaseSeed() {
  console.log("\u{1F331} [SEED] Iniciando carga de dados e conformidade da NR-5...");
  for (const cnae of OFFICIAL_CNAES) {
    await prisma.cnaeReference.upsert({
      where: { code: cnae.code },
      update: {
        description: cnae.description,
        grauDeRisco: cnae.grauDeRisco,
        sectorGroup: cnae.sectorGroup
      },
      create: {
        code: cnae.code,
        description: cnae.description,
        grauDeRisco: cnae.grauDeRisco,
        sectorGroup: cnae.sectorGroup
      }
    });
  }
  console.log(`\u2705 [SEED] ${OFFICIAL_CNAES.length} CNAEs oficiais catalogados.`);
  const empresaAlfa = await prisma.company.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      razaoSocial: "Ind\xFAstrias Metalmec\xE2nicas Alfa Brasil S.A.",
      nomeFantasia: "Alfa Brasil Industrial",
      cnpj: "12.345.678/0001-90",
      cnaePrincipalCode: "2511-0/00",
      cnaePrincipalDesc: "Fabrica\xE7\xE3o de estruturas met\xE1licas",
      enderecoCompleto: "Av. das Ind\xFAstrias, 1500, Distrito Industrial, S\xE3o Paulo - SP",
      responsavelAdmin: "Roberto Alcantara (Diretor de Opera\xE7\xF5es)",
      moduloDimensionamento: true,
      moduloEleicao: true,
      moduloGestao: true
    }
  });
  const filialMatriz = await prisma.companyUnit.upsert({
    where: { id: "unit-1-matriz" },
    update: {},
    create: {
      id: "unit-1-matriz",
      companyId: empresaAlfa.id,
      name: "Matriz Corporativa & Linha 01 (S\xE3o Paulo - SP)",
      city: "S\xE3o Paulo",
      state: "SP",
      headcount: 145,
      grauDeRisco: 3,
      cnaeCode: "2511-0/00",
      cnaeDesc: "Fabrica\xE7\xE3o de estruturas met\xE1licas",
      cipaAtiva: true,
      gestorName: "Juliana Paes"
    }
  });
  await prisma.companyUnit.upsert({
    where: { id: "unit-1-betim" },
    update: {},
    create: {
      id: "unit-1-betim",
      companyId: empresaAlfa.id,
      name: "Planta de Fundi\xE7\xE3o & Usinagem (Betim - MG)",
      city: "Betim",
      state: "MG",
      headcount: 320,
      grauDeRisco: 4,
      cnaeCode: "2511-0/00",
      cnaeDesc: "Fabrica\xE7\xE3o de estruturas met\xE1licas e fundi\xE7\xE3o",
      cipaAtiva: true,
      gestorName: "Marcos Vinicius"
    }
  });
  const defaultPasswordHash = await SecurityService.hashPassword("CipaExpert@2026");
  await prisma.user.upsert({
    where: { email: "dani.master@cipaexpert.com.br" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: "Dani Santos",
      email: "dani.master@cipaexpert.com.br",
      passwordHash: defaultPasswordHash,
      role: "master"
    }
  });
  await prisma.user.upsert({
    where: { email: "roberto.alcantara@alfabrasil.com.br" },
    update: { passwordHash: defaultPasswordHash, companyId: empresaAlfa.id },
    create: {
      name: "Roberto Alc\xE2ntara",
      email: "roberto.alcantara@alfabrasil.com.br",
      passwordHash: defaultPasswordHash,
      role: "admin_empresa",
      companyId: empresaAlfa.id
    }
  });
  await prisma.user.upsert({
    where: { email: "carlos.mendes@alfabrasil.com.br" },
    update: { passwordHash: defaultPasswordHash, companyId: empresaAlfa.id, unitId: filialMatriz.id },
    create: {
      name: "Carlos Alberto Mendes",
      email: "carlos.mendes@alfabrasil.com.br",
      passwordHash: defaultPasswordHash,
      role: "tecnico_sst",
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      matricula: "SST-0041"
    }
  });
  const eleitorUser = await prisma.user.upsert({
    where: { email: "lucas.souza@alfabrasil.com.br" },
    update: { passwordHash: defaultPasswordHash, companyId: empresaAlfa.id, unitId: filialMatriz.id },
    create: {
      name: "Lucas Souza",
      email: "lucas.souza@alfabrasil.com.br",
      passwordHash: defaultPasswordHash,
      role: "eleitor",
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      matricula: "CLT-1042"
    }
  });
  const terminoMandato = /* @__PURE__ */ new Date("2026-11-20T00:00:00Z");
  const prazos = calcularPrazosCronogramaNR5(terminoMandato);
  const eleicaoAtiva = await prisma.eleicao.upsert({
    where: { id: "eleicao-2026-matriz" },
    update: {},
    create: {
      id: "eleicao-2026-matriz",
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      titulo: "Elei\xE7\xE3o CIPA - Gest\xE3o 2026/2027",
      status: "votacao_aberta",
      dataFimMandato: terminoMandato,
      dataEditalConvocacao: prazos.dataEditalConvocacao,
      dataConstituicaoCE: prazos.dataConstituicaoCE,
      dataInicioInscricoes: prazos.dataInicioInscricoes,
      dataFimInscricoes: prazos.dataFimInscricoes,
      dataInicioVotacao: prazos.dataInicioVotacao,
      dataFimVotacao: prazos.dataFimVotacao,
      dataTreinamento: prazos.dataTreinamento,
      dataPosse: prazos.dataPosse,
      totalEleitoresAptos: 145,
      quorumMinimo: 73,
      votosBrancos: 3,
      votosNulos: 1
    }
  });
  const candidatosSemente = [
    {
      id: "cand-1",
      nome: "Mariana Silveira",
      cargo: "Operadora de M\xE1quinas CNC",
      setor: "Usinagem Pesada",
      tempoEmpresa: "4 anos",
      numero: "10",
      propostas: "Foco na renova\xE7\xE3o de EPIs ac\xFAsticos, melhoria de ventila\xE7\xE3o no galp\xE3o 02 e combate ao ass\xE9dio.",
      totalVotos: 48,
      fotoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "cand-2",
      nome: "Rodrigo Albuquerque",
      cargo: "T\xE9cnico de Manuten\xE7\xE3o Mec\xE2nica",
      setor: "Manuten\xE7\xE3o Geral",
      tempoEmpresa: "6 anos",
      numero: "22",
      propostas: "Revis\xE3o peri\xF3dica de bloqueios de energia LOTO e inspe\xE7\xE3o quinzenal de escadas.",
      totalVotos: 39,
      fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "cand-3",
      nome: "Beatriz Fagundes",
      cargo: "Analista de Log\xEDstica e Expedi\xE7\xE3o",
      setor: "Centro de Distribui\xE7\xE3o",
      tempoEmpresa: "3 anos",
      numero: "15",
      propostas: "Adequa\xE7\xE3o ergon\xF4mica nos postos de etiquetagem e pausas ativas na expedi\xE7\xE3o.",
      totalVotos: 31,
      fotoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80"
    }
  ];
  for (const cand of candidatosSemente) {
    await prisma.candidato.upsert({
      where: { eleicaoId_numero: { eleicaoId: eleicaoAtiva.id, numero: cand.numero } },
      update: { totalVotos: cand.totalVotos },
      create: {
        id: cand.id,
        eleicaoId: eleicaoAtiva.id,
        nome: cand.nome,
        cargo: cand.cargo,
        setor: cand.setor,
        tempoEmpresa: cand.tempoEmpresa,
        numero: cand.numero,
        propostas: cand.propostas,
        totalVotos: cand.totalVotos,
        fotoUrl: cand.fotoUrl
      }
    });
  }
  const riscosIniciais = [
    {
      id: "risk-1",
      setor: "Usinagem & Caldeiraria",
      tipoRisco: "fisico",
      grauGravidade: "grande",
      agenteIdentificado: "Ru\xEDdo cont\xEDnuo elevado e calor de fornos",
      medidasPreventivas: "Uso obrigat\xF3rio de protetor auricular tipo concha + plug e rod\xEDzio.",
      xPercent: 28,
      yPercent: 35
    },
    {
      id: "risk-2",
      setor: "Pintura & Tratamento T\xE9rmico",
      tipoRisco: "quimico",
      grauGravidade: "medio",
      agenteIdentificado: "Vapores de solventes e tintas",
      medidasPreventivas: "Cabine de pintura com cortina d\u2019\xE1gua e m\xE1scara com filtro qu\xEDmico.",
      xPercent: 72,
      yPercent: 40
    },
    {
      id: "risk-3",
      setor: "Almoxarifado & Log\xEDstica",
      tipoRisco: "acidente",
      grauGravidade: "medio",
      agenteIdentificado: "Tr\xE1fego cont\xEDnuo de empilhadeiras e risco de queda de paletes",
      medidasPreventivas: "Sinaliza\xE7\xE3o visual, faixas de pedestres e velocidade m\xE1xima de 10 km/h.",
      xPercent: 45,
      yPercent: 75
    },
    {
      id: "risk-4",
      setor: "Escrit\xF3rio & Engenharia",
      tipoRisco: "ergonomico",
      grauGravidade: "pequeno",
      agenteIdentificado: "Postura sentada prolongada e esfor\xE7o visual",
      medidasPreventivas: "Gin\xE1stica laboral di\xE1ria e ajuste ergon\xF4mico de monitores e cadeiras.",
      xPercent: 15,
      yPercent: 80
    }
  ];
  for (const r of riscosIniciais) {
    await prisma.riskPoint.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        companyId: empresaAlfa.id,
        unitId: filialMatriz.id,
        setor: r.setor,
        tipoRisco: r.tipoRisco,
        grauGravidade: r.grauGravidade,
        agenteIdentificado: r.agenteIdentificado,
        medidasPreventivas: r.medidasPreventivas,
        xPercent: r.xPercent,
        yPercent: r.yPercent
      }
    });
  }
  await prisma.planoAcao5W2H.upsert({
    where: { id: "plano-1-grade" },
    update: {},
    create: {
      id: "plano-1-grade",
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      oQue: "Instala\xE7\xE3o de grade de prote\xE7\xE3o f\xEDsica e sensor fotoel\xE9trico na Prensa 04",
      porQue: "Preven\xE7\xE3o de amputa\xE7\xE3o e adequa\xE7\xE3o rigorosa \xE0 NR-12 e apontamento de risco da CIPA",
      onde: "Setor de Estamparia / Galp\xE3o 2",
      quem: "Engenharia de Manuten\xE7\xE3o (Resp: Lucas)",
      quando: /* @__PURE__ */ new Date("2026-11-15"),
      como: "Fabrica\xE7\xE3o interna com trava de seguran\xE7a categoria 4 intertravada",
      quanto: "R$ 4.800,00",
      status: "em_andamento",
      categoria: "prevencao_acidentes"
    }
  });
  await prisma.planoAcao5W2H.upsert({
    where: { id: "plano-2-assedio" },
    update: {},
    create: {
      id: "plano-2-assedio",
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      oQue: "Treinamento obrigat\xF3rio: Preven\xE7\xE3o e Combate ao Ass\xE9dio Sexual e Moral",
      porQue: "Cumprimento estrito da Lei Federal 14.457/2022 e exig\xEAncia da nova NR-5",
      onde: "Audit\xF3rio Principal e Plataforma Online",
      quem: "RH & Comiss\xE3o da CIPA (Resp: Dra. Cristina)",
      quando: /* @__PURE__ */ new Date("2026-10-30"),
      como: "Workshops pr\xE1ticos para 100% dos empregados com lista de presen\xE7a e certificados",
      quanto: "R$ 3.500,00",
      status: "concluido",
      categoria: "prevencao_assedio"
    }
  });
  console.log("\u2728 [SEED] Carga conclu\xEDda com sucesso! Banco pronto para uso.");
}
var OFFICIAL_CNAES;
var init_seed = __esm({
  "src/backend/seed.ts"() {
    init_db();
    init_security();
    init_nr5Rules();
    OFFICIAL_CNAES = [
      { code: "4120-4/00", description: "Constru\xE7\xE3o de edif\xEDcios", grauDeRisco: 3, sectorGroup: "C-18" },
      { code: "4211-1/01", description: "Constru\xE7\xE3o de rodovias e ferrovias", grauDeRisco: 4, sectorGroup: "C-18" },
      { code: "1011-2/01", description: "Frigor\xEDfico - abate de bovinos", grauDeRisco: 3, sectorGroup: "C-2" },
      { code: "8610-1/01", description: "Atividades de atendimento hospitalar", grauDeRisco: 3, sectorGroup: "C-31" },
      { code: "8630-5/03", description: "Atividade m\xE9dica ambulatorial com recursos cir\xFArgicos", grauDeRisco: 3, sectorGroup: "C-31" },
      { code: "6201-5/01", description: "Desenvolvimento de programas de computador sob encomenda (TI)", grauDeRisco: 1, sectorGroup: "C-34" },
      { code: "6202-3/00", description: "Desenvolvimento e licenciamento de softwares customiz\xE1veis", grauDeRisco: 1, sectorGroup: "C-34" },
      { code: "4711-3/02", description: "Com\xE9rcio varejista de mercadorias em geral (Supermercados)", grauDeRisco: 2, sectorGroup: "C-24" },
      { code: "4712-1/00", description: "Com\xE9rcio varejista de mercadorias (Minimercados)", grauDeRisco: 2, sectorGroup: "C-24" },
      { code: "4930-2/02", description: "Transporte rodovi\xE1rio de carga intermunicipal e interestadual", grauDeRisco: 3, sectorGroup: "C-21" },
      { code: "2511-0/00", description: "Fabrica\xE7\xE3o de estruturas met\xE1licas e caldeiraria pesada", grauDeRisco: 4, sectorGroup: "C-13" },
      { code: "2910-7/01", description: "Fabrica\xE7\xE3o de autom\xF3veis, camionetas e utilit\xE1rios", grauDeRisco: 3, sectorGroup: "C-14" },
      { code: "8520-1/00", description: "Ensino m\xE9dio e fundamental (Escolas)", grauDeRisco: 2, sectorGroup: "C-30" },
      { code: "8532-5/00", description: "Educa\xE7\xE3o superior - gradua\xE7\xE3o e p\xF3s-gradua\xE7\xE3o", grauDeRisco: 2, sectorGroup: "C-30" },
      { code: "5611-2/01", description: "Restaurantes e similares", grauDeRisco: 2, sectorGroup: "C-27" },
      { code: "8011-1/01", description: "Atividades de vigil\xE2ncia e seguran\xE7a privada", grauDeRisco: 3, sectorGroup: "C-32" },
      { code: "8121-4/00", description: "Limpeza em pr\xE9dios e em domic\xEDlios (Servi\xE7os Gerais)", grauDeRisco: 3, sectorGroup: "C-32" },
      { code: "0111-3/01", description: "Cultivo de arroz e cereais (Agricultura)", grauDeRisco: 3, sectorGroup: "C-1" },
      { code: "1921-7/00", description: "Fabrica\xE7\xE3o de produtos do refino de petr\xF3leo (Petroqu\xEDmica)", grauDeRisco: 3, sectorGroup: "C-8" },
      { code: "2029-1/00", description: "Fabrica\xE7\xE3o de produtos qu\xEDmicos org\xE2nicos", grauDeRisco: 4, sectorGroup: "C-8" },
      { code: "6422-1/00", description: "Bancos m\xFAltiplos com carteira comercial", grauDeRisco: 1, sectorGroup: "C-33" },
      { code: "6911-7/01", description: "Servi\xE7os advocat\xEDcios e consultoria jur\xEDdica", grauDeRisco: 1, sectorGroup: "C-34" }
    ];
  }
});

// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";

// src/backend/api.ts
init_db();
init_security();
init_nr5Rules();
import { Router } from "express";
var apiRouter = Router();
apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "E-mail e senha s\xE3o obrigat\xF3rios." });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { company: true, unit: true }
    });
    if (!user || !user.ativo) {
      res.status(401).json({ error: "Credenciais inv\xE1lidas ou usu\xE1rio inativo." });
      return;
    }
    const passwordMatch = await SecurityService.comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: "Credenciais inv\xE1lidas ou usu\xE1rio inativo." });
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: /* @__PURE__ */ new Date() }
    });
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: "USER_LOGIN",
        details: `Login realizado com sucesso por ${user.email}`,
        ipAddress: req.ip,
        hashSha256: SecurityService.generateSha256(`${user.id}:${Date.now()}`)
      }
    });
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
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno ao processar autentica\xE7\xE3o." });
  }
});
apiRouter.get("/auth/me", SecurityService.authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { company: true, unit: true }
    });
    if (!user) {
      res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
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
    res.status(500).json({ error: "Erro ao carregar perfil do usu\xE1rio." });
  }
});
apiRouter.get("/cnaes", async (req, res) => {
  try {
    const search = req.query.q;
    const cnaes = await prisma.cnaeReference.findMany({
      where: search ? {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      } : void 0,
      orderBy: { code: "asc" }
    });
    res.json(cnaes);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar CNAEs." });
  }
});
apiRouter.post("/dimensionamento/calcular", (req, res) => {
  try {
    const { grauDeRisco, headcount } = req.body;
    if (!grauDeRisco || headcount === void 0 || headcount < 0) {
      res.status(400).json({ error: "Grau de risco (1 a 4) e quantidade de colaboradores s\xE3o obrigat\xF3rios." });
      return;
    }
    const resultado = calcularDimensionamentoNR5Backend(Number(grauDeRisco), Number(headcount));
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: "Erro ao processar dimensionamento normativo." });
  }
});
apiRouter.post("/dimensionamento/salvar", SecurityService.authenticate, async (req, res) => {
  try {
    const { companyId, unitId, cnaeCode, cnaeDesc, headcount, grauDeRisco } = req.body;
    if (!companyId || !unitId || !cnaeCode || headcount === void 0) {
      res.status(400).json({ error: "Dados incompletos para arquivamento do dimensionamento." });
      return;
    }
    const calculo = calcularDimensionamentoNR5Backend(Number(grauDeRisco), Number(headcount));
    const dimensionamento = await prisma.dimensionamento.create({
      data: {
        companyId,
        unitId,
        cnaeCode,
        cnaeDesc: cnaeDesc || "Atividade Operacional",
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
    console.error("Erro ao salvar dimensionamento:", error);
    res.status(500).json({ error: "Falha ao gravar dimensionamento no banco de dados." });
  }
});
apiRouter.get("/dimensionamento/historico/:unitId", SecurityService.authenticate, async (req, res) => {
  try {
    const { unitId } = req.params;
    const historico = await prisma.dimensionamento.findMany({
      where: { unitId },
      orderBy: { createdAt: "desc" }
    });
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar hist\xF3rico da unidade." });
  }
});
apiRouter.get("/eleicao/ativa/:unitId", SecurityService.authenticate, async (req, res) => {
  try {
    const { unitId } = req.params;
    const eleicao = await prisma.eleicao.findFirst({
      where: { unitId, status: { in: ["planejamento", "inscricoes_abertas", "votacao_aberta", "apurada"] } },
      include: {
        candidatos: {
          where: { deferido: true },
          orderBy: { numero: "asc" }
        }
      }
    });
    if (!eleicao) {
      res.status(404).json({ error: "Nenhuma elei\xE7\xE3o ativa para esta unidade." });
      return;
    }
    res.json(eleicao);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter elei\xE7\xE3o ativa." });
  }
});
apiRouter.post("/eleicao/votar", SecurityService.authenticate, async (req, res) => {
  try {
    const { eleicaoId, candidatoId } = req.body;
    const userId = req.user.userId;
    if (!eleicaoId || !candidatoId) {
      res.status(400).json({ error: "Identificador da elei\xE7\xE3o e escolha do voto s\xE3o obrigat\xF3rios." });
      return;
    }
    const eleicao = await prisma.eleicao.findUnique({
      where: { id: eleicaoId }
    });
    if (!eleicao || eleicao.status !== "votacao_aberta") {
      res.status(400).json({ error: "A urna digital n\xE3o est\xE1 aberta para vota\xE7\xE3o no momento." });
      return;
    }
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
        error: "Voto j\xE1 registrado! Cada colaborador tem direito a exatamente 1 voto audit\xE1vel.",
        hashComprovante: votoExistente.hashComprovante,
        timestamp: votoExistente.timestamp
      });
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const hashComprovante = SecurityService.generateVoteHash(eleicaoId, timestamp);
    await prisma.$transaction(async (tx) => {
      await tx.votoRegistro.create({
        data: {
          eleicaoId,
          userId,
          hashComprovante,
          ipAnonimizado: req.ip ? `${req.ip.slice(0, 7)}***` : "anon"
        }
      });
      if (candidatoId === "branco") {
        await tx.eleicao.update({
          where: { id: eleicaoId },
          data: { votosBrancos: { increment: 1 } }
        });
      } else if (candidatoId === "nulo") {
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
      await tx.auditLog.create({
        data: {
          companyId: eleicao.companyId,
          userId,
          action: "VOTE_REGISTERED",
          details: `Voto computado na elei\xE7\xE3o ${eleicao.id}`,
          hashSha256: hashComprovante
        }
      });
    });
    res.status(201).json({
      success: true,
      hashComprovante,
      timestamp,
      message: "Voto computado com sucesso na urna inviol\xE1vel da CIPA!"
    });
  } catch (error) {
    console.error("Erro ao registrar voto:", error);
    res.status(500).json({ error: "Erro interno ao computar voto." });
  }
});
apiRouter.get("/riscos/:unitId", SecurityService.authenticate, async (req, res) => {
  try {
    const { unitId } = req.params;
    const riscos = await prisma.riskPoint.findMany({
      where: { unitId },
      orderBy: { createdAt: "desc" }
    });
    res.json(riscos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar mapa de riscos." });
  }
});
apiRouter.post("/riscos", SecurityService.authenticate, async (req, res) => {
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
    res.status(500).json({ error: "Erro ao salvar ponto no mapa de riscos." });
  }
});
apiRouter.get("/planos-5w2h/:unitId", SecurityService.authenticate, async (req, res) => {
  try {
    const { unitId } = req.params;
    const planos = await prisma.planoAcao5W2H.findMany({
      where: { unitId },
      orderBy: { quando: "asc" }
    });
    res.json(planos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar planos de a\xE7\xE3o." });
  }
});
apiRouter.post("/planos-5w2h", SecurityService.authenticate, async (req, res) => {
  try {
    const { companyId, unitId, oQue, porQue, onde, quem, quando, como, quanto, categoria } = req.body;
    const plano = await prisma.planoAcao5W2H.create({
      data: {
        companyId,
        unitId,
        oQue,
        porQue: porQue || "A\xE7\xE3o preventiva deliberada pela CIPA",
        onde,
        quem,
        quando: new Date(quando),
        como: como || "Implementa\xE7\xE3o direta com registro",
        quanto: quanto || "R$ 0,00",
        categoria: categoria || "prevencao_acidentes"
      }
    });
    res.status(201).json(plano);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar plano de a\xE7\xE3o 5W2H." });
  }
});
apiRouter.post("/atas/:ataId/assinar", SecurityService.authenticate, async (req, res) => {
  try {
    const { ataId } = req.params;
    const { signerName, signerCpf, signerRole } = req.body;
    const userId = req.user.userId;
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
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
        userAgent: req.headers["user-agent"]
      }
    });
    res.status(201).json({
      success: true,
      hashAssinatura,
      dataHora: timestamp,
      mensagem: "Ata assinada digitalmente com certificado criptogr\xE1fico!"
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao registrar assinatura eletr\xF4nica da ata." });
  }
});
apiRouter.post("/admin/seed", SecurityService.authenticate, SecurityService.requireRole(["master"]), async (req, res) => {
  try {
    const { runDatabaseSeed: runDatabaseSeed2 } = await Promise.resolve().then(() => (init_seed(), seed_exports));
    await runDatabaseSeed2();
    res.json({ message: "Seed do banco executado com sucesso e regras NR-5 sincronizadas!" });
  } catch (error) {
    console.error("Erro no seed manual:", error);
    res.status(500).json({ error: "Falha na execu\xE7\xE3o do seed." });
  }
});

// server.js
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = parseInt(process.env.PORT || "3000", 10);
var HOST = process.env.HOST || "0.0.0.0";
app.use(cors({
  origin: "*",
  // Em produção no CapRover pode ser restrito ao domínio configurado
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "CIPA Expert Enterprise API & Platform",
    standard: "NR-5 / NR-4 / Lei 14.457/2022"
  });
});
app.use("/api", apiRouter);
var distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, HOST, () => {
  console.log(`\u{1F680} [BACKEND] CIPA Expert em execu\xE7\xE3o na porta ${PORT} (${HOST})`);
  console.log(`\u{1F6E1}\uFE0F  [BACKEND] Autentica\xE7\xE3o e APIs ativas em /api`);
});
