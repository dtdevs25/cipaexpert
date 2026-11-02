import { Company, AuthUser } from '../types/auth';
import { INITIAL_COMPANIES, DEMO_USERS } from '../data/multiCompanyData';
import { 
  DimensionamentoResult, 
  Candidato, 
  VotoAuditoria, 
  AtaReuniao, 
  PlanoAcao5W2H, 
  ReuniaoCalendario 
} from '../types/cipa';

export interface SavedDimensionamento {
  id: string;
  companyId: string;
  unitId: string;
  cnaeCode: string;
  cnaeDesc: string;
  headcount: number;
  grauDeRisco: number;
  precisaCipa: boolean;
  efetivosEmpregador: number;
  suplentesEmpregador: number;
  efetivosEmpregados: number;
  suplentesEmpregados: number;
  totalMembros: number;
  createdAt: string;
  createdBy: string;
}

export interface RiskMapPoint {
  id: string;
  companyId: string;
  unitId: string;
  setor: string;
  tipoRisco: 'fisico' | 'quimico' | 'biologico' | 'ergonomico' | 'acidente';
  grauGravidade: 'pequeno' | 'medio' | 'grande';
  agenteIdentificado: string;
  medidasPreventivas: string;
  xPercent: number; // Posição X no layout (0-100)
  yPercent: number; // Posição Y no layout (0-100)
}

export interface SavedVote {
  id: string;
  companyId: string;
  unitId: string;
  electionId: string;
  candidatoId: string; // 'branco', 'nulo' ou ID do candidato
  voterUserId: string;
  timestamp: string;
  hashComprovante: string;
}

const STORAGE_KEYS = {
  COMPANIES: 'cipa_expert_companies_v1',
  USERS: 'cipa_expert_users_v1',
  DIMENSIONAMENTOS: 'cipa_expert_dimensionamentos_v1',
  CANDIDATOS: 'cipa_expert_candidatos_v1',
  VOTOS: 'cipa_expert_votos_v1',
  ATAS: 'cipa_expert_atas_v1',
  PLANOS_5W2H: 'cipa_expert_planos5w2h_v1',
  REUNIOES: 'cipa_expert_reunioes_v1',
  RISCOS: 'cipa_expert_riscos_v1',
  ASSINATURAS: 'cipa_expert_assinaturas_v1'
};

// Dados semente para candidatos
export const INITIAL_CANDIDATOS: Candidato[] = [
  {
    id: '4977',
    nome: 'GUSTAVO FERREIRA DA CONCEICAO',
    apelido: 'GUSTAVO CONCEICAO',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Operação de Campo',
    tempoEmpresa: '5 meses',
    dataAdmissao: '02/06/2026',
    fotoUrl: undefined,
    numero: '10',
    propostas: 'Foco na segurança em trabalho em altura e inspeção veicular periódica.',
    votos: 42,
    email: 'GUSTAVO.CONCEICAO@TELEFONICA.COM',
    matricula: '179645',
    status: 'confirmado',
    termoAceito: true,
    metodoInscricao: 'online',
    confirmadoEm: '22/09/2026 09:15'
  },
  {
    id: '4976',
    nome: 'JULIA ROCHA DOS SANTOS',
    apelido: 'JULIA SANTOS',
    cargo: 'ASSISTENTE TECNICO',
    setor: 'Suporte Técnico',
    tempoEmpresa: '4 anos',
    dataAdmissao: '14/10/2022',
    fotoUrl: undefined,
    numero: '12',
    propostas: 'Ergonomia em postos informatizados e campanhas permanentes contra o assédio.',
    votos: 38,
    email: 'JULIA.RSANTOS@TELEFONICA.COM',
    matricula: '154266',
    status: 'confirmado',
    termoAceito: true,
    metodoInscricao: 'online',
    confirmadoEm: '22/09/2026 10:40'
  },
  {
    id: '4998',
    nome: 'LUANNA SANTANA BEZERRA',
    apelido: 'LUANNA BEZERRA',
    cargo: 'ASSISTENTE TECNICO',
    setor: 'Engenharia de Redes',
    tempoEmpresa: '3 meses',
    dataAdmissao: '06/07/2026',
    fotoUrl: undefined,
    numero: '15',
    propostas: 'Renovação imediata de EPIs e capacitação prática contínua.',
    votos: 35,
    email: 'LUANNA.BEZERRA@TELEFONICA.COM',
    matricula: '180550',
    status: 'confirmado',
    termoAceito: true,
    metodoInscricao: 'online',
    confirmadoEm: '23/09/2026 11:20'
  },
  {
    id: '5023',
    nome: 'MANOEL FRANCISCO DOS SANTOS',
    apelido: 'MANOEL SANTOS',
    cargo: 'Técnico de serviço ao cliente.',
    setor: 'Atendimento Externo',
    tempoEmpresa: '9 anos',
    dataAdmissao: '15/03/2011',
    fotoUrl: undefined,
    numero: '20',
    propostas: 'Segurança elétrica em rede aérea e redução de acidentes de trânsito.',
    votos: 29,
    email: 'MANOEL.SANTOS@TELEFONICA.COM',
    matricula: '3518036',
    status: 'confirmado',
    termoAceito: true,
    metodoInscricao: 'manual',
    confirmadoEm: '24/09/2026 14:10'
  },
  {
    id: '5004',
    nome: 'MARCELO AUGUSTO ARCIFA SAMPAIO',
    apelido: 'MARCELO SAMPAIO',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Manutenção de Rede',
    tempoEmpresa: '13 anos',
    dataAdmissao: '17/04/2013',
    fotoUrl: undefined,
    numero: '22',
    propostas: 'Inspeção e substituição periódica de escadas e trava-quedas.',
    votos: 25,
    email: 'MARCELO.SAMPAIO@TELEFONICA.COM',
    matricula: '3538328',
    status: 'confirmado',
    termoAceito: true,
    metodoInscricao: 'online',
    confirmadoEm: '24/09/2026 16:30'
  },
  {
    id: '4973',
    nome: 'MARCELO AUGUSTO FERREIRA',
    apelido: 'MARCELO FERREIRA',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Implantação',
    tempoEmpresa: '5 meses',
    dataAdmissao: '02/06/2026',
    fotoUrl: undefined,
    numero: '25',
    propostas: 'Pausas térmicas, pontos de hidratação e proteção solar nas rotas externas.',
    votos: 22,
    email: 'MARCELO.FERREIRA@TELEFONICA.COM',
    matricula: '179595',
    status: 'confirmado',
    termoAceito: true,
    metodoInscricao: 'online',
    confirmadoEm: '25/09/2026 09:05'
  },
  {
    id: '5006',
    nome: 'VANDERSON DE JESUS OLIVEIRA',
    apelido: 'VANDERSON OLIVEIRA',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Infraestrutura',
    tempoEmpresa: '13 anos',
    dataAdmissao: '17/07/2013',
    fotoUrl: undefined,
    numero: '30',
    propostas: 'Suporte psicológico, saúde mental e adequação das ferramentas ergonômicas.',
    votos: 20,
    email: 'VANDERSON.OLIVEIRA@TELEFONICA.COM',
    matricula: '3540169',
    status: 'confirmado',
    termoAceito: true,
    metodoInscricao: 'online',
    confirmadoEm: '25/09/2026 14:22'
  },
  {
    id: '5003',
    nome: 'ALINE DE PAULA SANTOS',
    apelido: 'ALINE PAULA',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Atendimento',
    tempoEmpresa: '2 anos',
    dataAdmissao: '12/09/2024',
    fotoUrl: undefined,
    numero: '99',
    propostas: 'Candidatura descontinuada por transferência de base.',
    votos: 0,
    email: 'ALINEP.SANTOS@TELEFONICA.COM',
    matricula: 'CLT-5003',
    status: 'rejeitado',
    motivoReprovacao: 'Colaboradora informou que passou em processo seletivo para outro cargo e irá trocar de base.',
    termoAceito: false,
    metodoInscricao: 'online'
  }
];

export const INITIAL_PLANOS_5W2H: PlanoAcao5W2H[] = [
  {
    id: 'act-1',
    oQue: 'Instalação de exaustores axiais no setor de solda',
    porQue: 'Reduzir concentração de fumos metálicos e poeiras tóxicas',
    onde: 'Galpão 03 - Linha de Caldeiraria',
    quem: 'Eng. Paulo (Manutenção) + Cipeiro Thiago',
    quando: '2026-11-15',
    como: 'Aquisição e montagem de 4 exaustores com filtro HEPA industrial',
    quanto: 'R$ 14.800,00',
    status: 'em_andamento',
    categoria: 'prevencao_acidentes',
    evidencia: 'Orçamento aprovado e ordens de serviço abertas'
  },
  {
    id: 'act-2',
    oQue: 'Treinamento obrigatório: Prevenção ao Assédio Sexual e Moral',
    porQue: 'Conformidade legal plena com a Lei 14.457/2022',
    onde: 'Auditório Principal e plataforma online',
    quem: 'Dra. Cristina (RH) + SESMT',
    quando: '2026-10-30',
    como: 'Workshops práticos para 100% dos colaboradores com certificado emitido',
    quanto: 'R$ 3.500,00',
    status: 'concluido',
    categoria: 'prevencao_assedio',
    evidencia: 'Lista de presença e atas assinadas anexadas'
  },
  {
    id: 'act-3',
    oQue: 'Substituição de cadeiras e suportes ergonômicos',
    porQue: 'Mitigar queixas de dores lombares e LER/DORT (NR-17)',
    onde: 'Setor Administrativo e Faturamento',
    quem: 'Juliana Paes (Gestora Unidade)',
    quando: '2026-12-05',
    como: 'Compra de 25 cadeiras ergonômicas certificadas NR-17',
    quanto: 'R$ 18.250,00',
    status: 'pendente',
    categoria: 'ergonomia'
  }
];

export const INITIAL_RISCOS: RiskMapPoint[] = [
  {
    id: 'risk-1',
    companyId: 'emp-1',
    unitId: 'unit-1-matriz',
    setor: 'Usinagem & Caldeiraria',
    tipoRisco: 'fisico',
    grauGravidade: 'grande',
    agenteIdentificado: 'Ruído contínuo e calor elevado (fornos/solda)',
    medidasPreventivas: 'Uso obrigatório de protetor auricular tipo concha + plug e revezamento',
    xPercent: 28,
    yPercent: 35
  },
  {
    id: 'risk-2',
    companyId: 'emp-1',
    unitId: 'unit-1-matriz',
    setor: 'Pintura & Tratamento Térmico',
    tipoRisco: 'quimico',
    grauGravidade: 'medio',
    agenteIdentificado: 'Solventes, vapores orgânicos e névoas de tinta',
    medidasPreventivas: 'Cabine de pintura com cortina de água e máscara com filtro químico',
    xPercent: 72,
    yPercent: 40
  },
  {
    id: 'risk-3',
    companyId: 'emp-1',
    unitId: 'unit-1-matriz',
    setor: 'Almoxarifado & Logística',
    tipoRisco: 'acidente',
    grauGravidade: 'medio',
    agenteIdentificado: 'Trânsito contínuo de empilhadeiras e risco de queda de materiais',
    medidasPreventivas: 'Faixas de pedestres demarcadas, espelhos convexos e velocidade max 10km/h',
    xPercent: 45,
    yPercent: 75
  },
  {
    id: 'risk-4',
    companyId: 'emp-1',
    unitId: 'unit-1-matriz',
    setor: 'Escritório & Engenharia',
    tipoRisco: 'ergonomico',
    grauGravidade: 'pequeno',
    agenteIdentificado: 'Postura sentada prolongada e esforço visual em monitores',
    medidasPreventivas: 'Ginástica laboral diária e ajuste de monitores na altura dos olhos',
    xPercent: 15,
    yPercent: 80
  }
];

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.warn(`Erro ao carregar chave ${key} do localStorage:`, err);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Erro ao salvar chave ${key} no localStorage:`, err);
  }
}

export const MockStorageService = {
  // Inicialização
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
      safeSet(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      safeSet(STORAGE_KEYS.USERS, Object.values(DEMO_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CANDIDATOS)) {
      safeSet(STORAGE_KEYS.CANDIDATOS, INITIAL_CANDIDATOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PLANOS_5W2H)) {
      safeSet(STORAGE_KEYS.PLANOS_5W2H, INITIAL_PLANOS_5W2H);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RISCOS)) {
      safeSet(STORAGE_KEYS.RISCOS, INITIAL_RISCOS);
    }
  },

  // Reset Geral para padrão inicial
  resetAll() {
    safeSet(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    safeSet(STORAGE_KEYS.USERS, Object.values(DEMO_USERS));
    safeSet(STORAGE_KEYS.CANDIDATOS, INITIAL_CANDIDATOS);
    safeSet(STORAGE_KEYS.PLANOS_5W2H, INITIAL_PLANOS_5W2H);
    safeSet(STORAGE_KEYS.RISCOS, INITIAL_RISCOS);
    safeSet(STORAGE_KEYS.DIMENSIONAMENTOS, []);
    safeSet(STORAGE_KEYS.VOTOS, []);
    safeSet(STORAGE_KEYS.ATAS, []);
    safeSet(STORAGE_KEYS.REUNIOES, []);
    safeSet(STORAGE_KEYS.ASSINATURAS, {});
  },

  // Empresas
  getCompanies(): Company[] {
    return safeGet<Company[]>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
  },
  saveCompany(company: Company): void {
    const list = this.getCompanies();
    const idx = list.findIndex(c => c.id === company.id);
    if (idx >= 0) {
      list[idx] = company;
    } else {
      list.push(company);
    }
    safeSet(STORAGE_KEYS.COMPANIES, list);
  },

  // Usuários
  getUsers(): AuthUser[] {
    return safeGet<AuthUser[]>(STORAGE_KEYS.USERS, Object.values(DEMO_USERS));
  },
  saveUser(user: AuthUser): void {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push(user);
    }
    safeSet(STORAGE_KEYS.USERS, list);
  },

  // Dimensionamentos Salvos
  getDimensionamentos(): SavedDimensionamento[] {
    return safeGet<SavedDimensionamento[]>(STORAGE_KEYS.DIMENSIONAMENTOS, []);
  },
  saveDimensionamento(dim: SavedDimensionamento): void {
    const list = this.getDimensionamentos();
    const idx = list.findIndex(d => d.id === dim.id);
    if (idx >= 0) {
      list[idx] = dim;
    } else {
      list.unshift(dim);
    }
    safeSet(STORAGE_KEYS.DIMENSIONAMENTOS, list);
  },

  // Candidatos & Votos
  getCandidatos(): Candidato[] {
    return safeGet<Candidato[]>(STORAGE_KEYS.CANDIDATOS, INITIAL_CANDIDATOS);
  },
  saveCandidato(candidato: Candidato): void {
    const list = this.getCandidatos();
    const idx = list.findIndex(c => c.id === candidato.id);
    if (idx >= 0) {
      list[idx] = candidato;
    } else {
      list.push(candidato);
    }
    safeSet(STORAGE_KEYS.CANDIDATOS, list);
  },
  getVotes(): SavedVote[] {
    return safeGet<SavedVote[]>(STORAGE_KEYS.VOTOS, []);
  },
  registerVote(vote: SavedVote): boolean {
    const votes = this.getVotes();
    // Bloqueio de voto duplo por usuário na mesma eleição
    const alreadyVoted = votes.some(
      v => v.voterUserId === vote.voterUserId && v.electionId === vote.electionId
    );
    if (alreadyVoted) {
      return false;
    }
    votes.push(vote);
    safeSet(STORAGE_KEYS.VOTOS, votes);

    // Incrementar votos do candidato
    if (vote.candidatoId !== 'branco' && vote.candidatoId !== 'nulo') {
      const candidatos = this.getCandidatos();
      const target = candidatos.find(c => c.id === vote.candidatoId);
      if (target) {
        target.votos = (target.votos || 0) + 1;
        safeSet(STORAGE_KEYS.CANDIDATOS, candidatos);
      }
    }
    return true;
  },
  hasUserVoted(voterUserId: string, electionId: string): boolean {
    const votes = this.getVotes();
    return votes.some(v => v.voterUserId === voterUserId && v.electionId === electionId);
  },
  getUserVoteReceipt(voterUserId: string, electionId: string): SavedVote | undefined {
    return this.getVotes().find(
      v => v.voterUserId === voterUserId && v.electionId === electionId
    );
  },

  // Planos de Ação 5W2H
  getPlanos5W2H(): PlanoAcao5W2H[] {
    return safeGet<PlanoAcao5W2H[]>(STORAGE_KEYS.PLANOS_5W2H, INITIAL_PLANOS_5W2H);
  },
  savePlano5W2H(plano: PlanoAcao5W2H): void {
    const list = this.getPlanos5W2H();
    const idx = list.findIndex(p => p.id === plano.id);
    if (idx >= 0) {
      list[idx] = plano;
    } else {
      list.unshift(plano);
    }
    safeSet(STORAGE_KEYS.PLANOS_5W2H, list);
  },
  deletePlano5W2H(id: string): void {
    const list = this.getPlanos5W2H().filter(p => p.id !== id);
    safeSet(STORAGE_KEYS.PLANOS_5W2H, list);
  },

  // Mapa de Riscos
  getRiskPoints(): RiskMapPoint[] {
    return safeGet<RiskMapPoint[]>(STORAGE_KEYS.RISCOS, INITIAL_RISCOS);
  },
  saveRiskPoint(point: RiskMapPoint): void {
    const list = this.getRiskPoints();
    const idx = list.findIndex(p => p.id === point.id);
    if (idx >= 0) {
      list[idx] = point;
    } else {
      list.push(point);
    }
    safeSet(STORAGE_KEYS.RISCOS, list);
  },
  deleteRiskPoint(id: string): void {
    const list = this.getRiskPoints().filter(p => p.id !== id);
    safeSet(STORAGE_KEYS.RISCOS, list);
  },

  // Assinaturas Digitais
  getSignatures(): Record<string, { hash: string; timestamp: string; signerName: string }> {
    return safeGet<Record<string, { hash: string; timestamp: string; signerName: string }>>(
      STORAGE_KEYS.ASSINATURAS,
      {
        'ata-1': {
          hash: 'EC-4F91B883C1A2E0942B',
          timestamp: '05/10/2026 15:35',
          signerName: 'Carlos Mendes'
        }
      }
    );
  },
  saveSignature(id: string, signature: { hash: string; timestamp: string; signerName: string }): void {
    const signatures = this.getSignatures();
    signatures[id] = signature;
    safeSet(STORAGE_KEYS.ASSINATURAS, signatures);
  }
};
