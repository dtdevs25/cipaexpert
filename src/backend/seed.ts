import { prisma } from './db';
import { SecurityService } from './security';
import { calcularPrazosCronogramaNR5 } from './nr5Rules';

export const OFFICIAL_CNAES = [
  { code: '4120-4/00', description: 'Construção de edifícios', grauDeRisco: 3, sectorGroup: 'C-18' },
  { code: '4211-1/01', description: 'Construção de rodovias e ferrovias', grauDeRisco: 4, sectorGroup: 'C-18' },
  { code: '1011-2/01', description: 'Frigorífico - abate de bovinos', grauDeRisco: 3, sectorGroup: 'C-2' },
  { code: '8610-1/01', description: 'Atividades de atendimento hospitalar', grauDeRisco: 3, sectorGroup: 'C-31' },
  { code: '8630-5/03', description: 'Atividade médica ambulatorial com recursos cirúrgicos', grauDeRisco: 3, sectorGroup: 'C-31' },
  { code: '6201-5/01', description: 'Desenvolvimento de programas de computador sob encomenda (TI)', grauDeRisco: 1, sectorGroup: 'C-34' },
  { code: '6202-3/00', description: 'Desenvolvimento e licenciamento de softwares customizáveis', grauDeRisco: 1, sectorGroup: 'C-34' },
  { code: '4711-3/02', description: 'Comércio varejista de mercadorias em geral (Supermercados)', grauDeRisco: 2, sectorGroup: 'C-24' },
  { code: '4712-1/00', description: 'Comércio varejista de mercadorias (Minimercados)', grauDeRisco: 2, sectorGroup: 'C-24' },
  { code: '4930-2/02', description: 'Transporte rodoviário de carga intermunicipal e interestadual', grauDeRisco: 3, sectorGroup: 'C-21' },
  { code: '2511-0/00', description: 'Fabricação de estruturas metálicas e caldeiraria pesada', grauDeRisco: 4, sectorGroup: 'C-13' },
  { code: '2910-7/01', description: 'Fabricação de automóveis, camionetas e utilitários', grauDeRisco: 3, sectorGroup: 'C-14' },
  { code: '8520-1/00', description: 'Ensino médio e fundamental (Escolas)', grauDeRisco: 2, sectorGroup: 'C-30' },
  { code: '8532-5/00', description: 'Educação superior - graduação e pós-graduação', grauDeRisco: 2, sectorGroup: 'C-30' },
  { code: '5611-2/01', description: 'Restaurantes e similares', grauDeRisco: 2, sectorGroup: 'C-27' },
  { code: '8011-1/01', description: 'Atividades de vigilância e segurança privada', grauDeRisco: 3, sectorGroup: 'C-32' },
  { code: '8121-4/00', description: 'Limpeza em prédios e em domicílios (Serviços Gerais)', grauDeRisco: 3, sectorGroup: 'C-32' },
  { code: '0111-3/01', description: 'Cultivo de arroz e cereais (Agricultura)', grauDeRisco: 3, sectorGroup: 'C-1' },
  { code: '1921-7/00', description: 'Fabricação de produtos do refino de petróleo (Petroquímica)', grauDeRisco: 3, sectorGroup: 'C-8' },
  { code: '2029-1/00', description: 'Fabricação de produtos químicos orgânicos', grauDeRisco: 4, sectorGroup: 'C-8' },
  { code: '6422-1/00', description: 'Bancos múltiplos com carteira comercial', grauDeRisco: 1, sectorGroup: 'C-33' },
  { code: '6911-7/01', description: 'Serviços advocatícios e consultoria jurídica', grauDeRisco: 1, sectorGroup: 'C-34' }
];

export async function runDatabaseSeed(): Promise<void> {
  console.log('🌱 [SEED] Iniciando carga de dados e conformidade da NR-5...');

  // 1. Carga de CNAEs Oficiais
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
  console.log(`✅ [SEED] ${OFFICIAL_CNAES.length} CNAEs oficiais catalogados.`);

  // 2. Criação da Empresa Alfa Brasil S.A.
  const empresaAlfa = await prisma.company.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      razaoSocial: 'Indústrias Metalmecânicas Alfa Brasil S.A.',
      nomeFantasia: 'Alfa Brasil Industrial',
      cnpj: '12.345.678/0001-90',
      cnaePrincipalCode: '2511-0/00',
      cnaePrincipalDesc: 'Fabricação de estruturas metálicas',
      enderecoCompleto: 'Av. das Indústrias, 1500, Distrito Industrial, São Paulo - SP',
      responsavelAdmin: 'Roberto Alcantara (Diretor de Operações)',
      moduloDimensionamento: true,
      moduloEleicao: true,
      moduloGestao: true
    }
  });

  // 3. Unidades Operacionais (Filiais)
  const filialMatriz = await prisma.companyUnit.upsert({
    where: { id: 'unit-1-matriz' },
    update: {},
    create: {
      id: 'unit-1-matriz',
      companyId: empresaAlfa.id,
      name: 'Matriz Corporativa & Linha 01 (São Paulo - SP)',
      city: 'São Paulo',
      state: 'SP',
      headcount: 145,
      grauDeRisco: 3,
      cnaeCode: '2511-0/00',
      cnaeDesc: 'Fabricação de estruturas metálicas',
      cipaAtiva: true,
      gestorName: 'Juliana Paes'
    }
  });

  await prisma.companyUnit.upsert({
    where: { id: 'unit-1-betim' },
    update: {},
    create: {
      id: 'unit-1-betim',
      companyId: empresaAlfa.id,
      name: 'Planta de Fundição & Usinagem (Betim - MG)',
      city: 'Betim',
      state: 'MG',
      headcount: 320,
      grauDeRisco: 4,
      cnaeCode: '2511-0/00',
      cnaeDesc: 'Fabricação de estruturas metálicas e fundição',
      cipaAtiva: true,
      gestorName: 'Marcos Vinicius'
    }
  });

  // 4. Usuários com senhas hash bcrypt 12 rounds
  const defaultPasswordHash = await SecurityService.hashPassword('CipaExpert@2026');

  // Master
  await prisma.user.upsert({
    where: { email: 'dani.master@cipaexpert.com.br' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: 'Dani Santos',
      email: 'dani.master@cipaexpert.com.br',
      passwordHash: defaultPasswordHash,
      role: 'master'
    }
  });

  // Admin Empresa
  await prisma.user.upsert({
    where: { email: 'roberto.alcantara@alfabrasil.com.br' },
    update: { passwordHash: defaultPasswordHash, companyId: empresaAlfa.id },
    create: {
      name: 'Roberto Alcântara',
      email: 'roberto.alcantara@alfabrasil.com.br',
      passwordHash: defaultPasswordHash,
      role: 'admin_empresa',
      companyId: empresaAlfa.id
    }
  });

  // Técnico de SST
  await prisma.user.upsert({
    where: { email: 'carlos.mendes@alfabrasil.com.br' },
    update: { passwordHash: defaultPasswordHash, companyId: empresaAlfa.id, unitId: filialMatriz.id },
    create: {
      name: 'Carlos Alberto Mendes',
      email: 'carlos.mendes@alfabrasil.com.br',
      passwordHash: defaultPasswordHash,
      role: 'tecnico_sst',
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      matricula: 'SST-0041'
    }
  });

  // Gestor de Unidade
  await prisma.user.upsert({
    where: { email: 'juliana.paes@alfabrasil.com.br' },
    update: { passwordHash: defaultPasswordHash, companyId: empresaAlfa.id, unitId: filialMatriz.id },
    create: {
      name: 'Juliana Paes',
      email: 'juliana.paes@alfabrasil.com.br',
      passwordHash: defaultPasswordHash,
      role: 'gestor_unidade',
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      matricula: 'GST-0012'
    }
  });

  // Cipeiro
  await prisma.user.upsert({
    where: { email: 'renata.vasconcelos@alfabrasil.com.br' },
    update: { passwordHash: defaultPasswordHash, companyId: empresaAlfa.id, unitId: filialMatriz.id },
    create: {
      name: 'Renata Vasconcelos',
      email: 'renata.vasconcelos@alfabrasil.com.br',
      passwordHash: defaultPasswordHash,
      role: 'cipeiro',
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      matricula: 'CIP-0089'
    }
  });

  // Eleitor Colaborador
  const eleitorUser = await prisma.user.upsert({
    where: { email: 'lucas.souza@alfabrasil.com.br' },
    update: { passwordHash: defaultPasswordHash, companyId: empresaAlfa.id, unitId: filialMatriz.id },
    create: {
      name: 'Lucas Souza',
      email: 'lucas.souza@alfabrasil.com.br',
      passwordHash: defaultPasswordHash,
      role: 'eleitor',
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      matricula: 'CLT-1042'
    }
  });

  // 5. Eleição com Cronograma Oficial da NR-5
  const terminoMandato = new Date('2026-11-20T00:00:00Z');
  const prazos = calcularPrazosCronogramaNR5(terminoMandato);

  const eleicaoAtiva = await prisma.eleicao.upsert({
    where: { id: 'eleicao-2026-matriz' },
    update: {},
    create: {
      id: 'eleicao-2026-matriz',
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      titulo: 'Eleição CIPA - Gestão 2026/2027',
      status: 'votacao_aberta',
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

  // 6. Candidatos da Eleição
  const candidatosSemente = [
    {
      id: 'cand-1',
      nome: 'Mariana Silveira',
      cargo: 'Operadora de Máquinas CNC',
      setor: 'Usinagem Pesada',
      tempoEmpresa: '4 anos',
      numero: '10',
      propostas: 'Foco na renovação de EPIs acústicos, melhoria de ventilação no galpão 02 e combate ao assédio.',
      totalVotos: 48,
      fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'cand-2',
      nome: 'Rodrigo Albuquerque',
      cargo: 'Técnico de Manutenção Mecânica',
      setor: 'Manutenção Geral',
      tempoEmpresa: '6 anos',
      numero: '22',
      propostas: 'Revisão periódica de bloqueios de energia LOTO e inspeção quinzenal de escadas.',
      totalVotos: 39,
      fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'cand-3',
      nome: 'Beatriz Fagundes',
      cargo: 'Analista de Logística e Expedição',
      setor: 'Centro de Distribuição',
      tempoEmpresa: '3 anos',
      numero: '15',
      propostas: 'Adequação ergonômica nos postos de etiquetagem e pausas ativas na expedição.',
      totalVotos: 31,
      fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
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

  // 7. Mapa de Riscos Ocupacionais (NR-5)
  const riscosIniciais = [
    {
      id: 'risk-1',
      setor: 'Usinagem & Caldeiraria',
      tipoRisco: 'fisico' as const,
      grauGravidade: 'grande' as const,
      agenteIdentificado: 'Ruído contínuo elevado e calor de fornos',
      medidasPreventivas: 'Uso obrigatório de protetor auricular tipo concha + plug e rodízio.',
      xPercent: 28,
      yPercent: 35
    },
    {
      id: 'risk-2',
      setor: 'Pintura & Tratamento Térmico',
      tipoRisco: 'quimico' as const,
      grauGravidade: 'medio' as const,
      agenteIdentificado: 'Vapores de solventes e tintas',
      medidasPreventivas: 'Cabine de pintura com cortina d’água e máscara com filtro químico.',
      xPercent: 72,
      yPercent: 40
    },
    {
      id: 'risk-3',
      setor: 'Almoxarifado & Logística',
      tipoRisco: 'acidente' as const,
      grauGravidade: 'medio' as const,
      agenteIdentificado: 'Tráfego contínuo de empilhadeiras e risco de queda de paletes',
      medidasPreventivas: 'Sinalização visual, faixas de pedestres e velocidade máxima de 10 km/h.',
      xPercent: 45,
      yPercent: 75
    },
    {
      id: 'risk-4',
      setor: 'Escritório & Engenharia',
      tipoRisco: 'ergonomico' as const,
      grauGravidade: 'pequeno' as const,
      agenteIdentificado: 'Postura sentada prolongada e esforço visual',
      medidasPreventivas: 'Ginástica laboral diária e ajuste ergonômico de monitores e cadeiras.',
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

  // 8. Planos de Ação 5W2H
  await prisma.planoAcao5W2H.upsert({
    where: { id: 'plano-1-grade' },
    update: {},
    create: {
      id: 'plano-1-grade',
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      oQue: 'Instalação de grade de proteção física e sensor fotoelétrico na Prensa 04',
      porQue: 'Prevenção de amputação e adequação rigorosa à NR-12 e apontamento de risco da CIPA',
      onde: 'Setor de Estamparia / Galpão 2',
      quem: 'Engenharia de Manutenção (Resp: Lucas)',
      quando: new Date('2026-11-15'),
      como: 'Fabricação interna com trava de segurança categoria 4 intertravada',
      quanto: 'R$ 4.800,00',
      status: 'em_andamento',
      categoria: 'prevencao_acidentes'
    }
  });

  await prisma.planoAcao5W2H.upsert({
    where: { id: 'plano-2-assedio' },
    update: {},
    create: {
      id: 'plano-2-assedio',
      companyId: empresaAlfa.id,
      unitId: filialMatriz.id,
      oQue: 'Treinamento obrigatório: Prevenção e Combate ao Assédio Sexual e Moral',
      porQue: 'Cumprimento estrito da Lei Federal 14.457/2022 e exigência da nova NR-5',
      onde: 'Auditório Principal e Plataforma Online',
      quem: 'RH & Comissão da CIPA (Resp: Dra. Cristina)',
      quando: new Date('2026-10-30'),
      como: 'Workshops práticos para 100% dos empregados com lista de presença e certificados',
      quanto: 'R$ 3.500,00',
      status: 'concluido',
      categoria: 'prevencao_assedio'
    }
  });

  console.log('✨ [SEED] Carga concluída com sucesso! Banco pronto para uso.');
}
