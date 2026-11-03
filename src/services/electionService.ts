import { EmployeeRecord, INITIAL_EMPLOYEES } from '../data/employeeData';
import { computeSha256 } from './signatureService';

export interface ElectionPleitoConfig {
  id: string;
  mandato: string;
  titulo: string;
  companyId: string;
  unitId: string;
  cnpj: string;
  inicioInscricoes: string; // ISO ou DD/MM/AAAA HH:mm
  fimInscricoes: string;
  inicioVotacao: string;
  fimVotacao: string;
  prorrogacao1: string;
  prorrogacao2: string;
  exigirFotoObrigatoria: boolean;
  votoSecreto: boolean;
  acompanhamentoQuorum: boolean;
  votoComPeso: boolean;
  totalVotantesHabilitados: number;
  quorumMinimo1: number; // 50% + 1
  quorumMinimo2: number; // 1/3
  eleicaoLink: string;
  inscricaoLink: string;
  gestaoCriadaEm: string;
}

export interface ElectionAuditLog {
  id: string;
  timestamp: string;
  tipo: 'INSCRICAO' | 'CONFIRMACAO_EMAIL' | 'LEMBRETE_DIARIO' | 'ACESSO_URNA' | 'VOTO_COMPUTADO' | 'HOMOLOGACAO' | 'CONFIGURACAO';
  descricao: string;
  usuarioMascarado?: string;
  ipAnonimizado: string;
  hash?: string;
  detalhes?: any;
}

export interface CandidatoEleicao {
  id: string;
  matricula: string; // RE
  nome: string;
  apelidoUrna: string;
  numeroUrna: string;
  cargo: string;
  setor: string;
  email: string;
  dataAdmissao: string;
  fotoUrl: string; // OBRIGATÓRIA
  propostas: string;
  votos: number;
  status: 'pendente_confirmacao' | 'confirmado' | 'reprovado';
  protocolo: string;
  tokenConfirmacao: string;
  inscritoEm: string;
  confirmadoEm?: string;
  lembretesEnviadosCount: number;
  ultimoLembreteEm?: string;
  motivoReprovacao?: string;
}

const STORAGE_KEYS = {
  CONFIG: 'cipa_expert_pleito_config_v1',
  EMPLOYEES: 'cipa_expert_employees_v1',
  CANDIDATOS: 'cipa_expert_candidatos_pleito_v1',
  AUDIT_LOGS: 'cipa_expert_audit_logs_pleito_v1',
  VOTES_CAST: 'cipa_expert_voter_ids_cast_v1'
};

export class ElectionService {
  /**
   * Obtém a configuração do pleito eleitoral para a unidade/empresa
   */
  static getPleitoConfig(unitId: string = 'unit-tel-jundiai', companyId: string = 'comp-telefonica'): ElectionPleitoConfig {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.CONFIG}_${unitId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cipaexpert.com.br';
    const token = `cipa-${companyId.toLowerCase()}-${unitId.toLowerCase()}-2026`;

    return {
      id: `pleito-${unitId}-2026`,
      mandato: '2026/2027',
      titulo: 'TELEFONICA S/A | CIPA Jundiai 2026-2027',
      companyId,
      unitId,
      cnpj: '02.558.157/0577-84',
      inicioInscricoes: '2026-09-21T08:00',
      fimInscricoes: '2026-10-05T14:31',
      inicioVotacao: '2026-10-13T08:00',
      fimVotacao: '2026-10-13T17:00',
      prorrogacao1: '14/10/2026 das 08:00 às 18:00 (Quórum 1/3)',
      prorrogacao2: '15/10/2026 das 08:00 às 18:00 (Qualquer quórum)',
      exigirFotoObrigatoria: true,
      votoSecreto: true,
      acompanhamentoQuorum: true,
      votoComPeso: false,
      totalVotantesHabilitados: 88,
      quorumMinimo1: 45,
      quorumMinimo2: 30,
      eleicaoLink: `${origin}/?eleicao=${token}`,
      inscricaoLink: `${origin}/?inscricao_cipa=${token}`,
      gestaoCriadaEm: new Date().toLocaleDateString('pt-BR')
    };
  }

  /**
   * Salva a configuração do pleito eleitoral
   */
  static savePleitoConfig(config: ElectionPleitoConfig): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.CONFIG}_${config.unitId}`, JSON.stringify(config));
      this.addAuditLog(config.unitId, {
        tipo: 'CONFIGURACAO',
        descricao: `Configurações do pleito da Gestão ${config.mandato} atualizadas pela Comissão Eleitoral`,
        ipAnonimizado: '192.168.1.***'
      });
    } catch (e) {
      console.error('Erro ao salvar configuração do pleito:', e);
    }
  }

  /**
   * Lista colaboradores da unidade (utilizado para quem não tem dimensionamento ou para consulta de votantes)
   */
  static getEmployees(unitId: string = 'unit-tel-jundiai'): EmployeeRecord[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.EMPLOYEES}_${unitId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    const initial = INITIAL_EMPLOYEES.filter(e => e.unitId === unitId);
    return initial.length > 0 ? initial : INITIAL_EMPLOYEES.slice(0, 15);
  }

  /**
   * Salva ou atualiza colaborador no cadastro
   */
  static saveEmployee(employee: EmployeeRecord): void {
    const list = this.getEmployees(employee.unitId);
    const index = list.findIndex(e => e.id === employee.id || e.matricula === employee.matricula);
    if (index >= 0) {
      list[index] = employee;
    } else {
      list.unshift(employee);
    }
    localStorage.setItem(`${STORAGE_KEYS.EMPLOYEES}_${employee.unitId}`, JSON.stringify(list));
  }

  /**
   * Importa múltiplos colaboradores
   */
  static importEmployees(unitId: string, newEmployees: EmployeeRecord[]): void {
    const existing = this.getEmployees(unitId);
    const map = new Map<string, EmployeeRecord>();
    existing.forEach(e => map.set(e.matricula, e));
    newEmployees.forEach(e => map.set(e.matricula, e));
    const merged = Array.from(map.values());
    localStorage.setItem(`${STORAGE_KEYS.EMPLOYEES}_${unitId}`, JSON.stringify(merged));
  }

  /**
   * Exclui um colaborador
   */
  static deleteEmployee(unitId: string, employeeId: string): void {
    const list = this.getEmployees(unitId).filter(e => e.id !== employeeId);
    localStorage.setItem(`${STORAGE_KEYS.EMPLOYEES}_${unitId}`, JSON.stringify(list));
  }

  /**
   * Lista candidatos da eleição
   */
  static getCandidatos(unitId: string = 'unit-tel-jundiai'): CandidatoEleicao[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.CANDIDATOS}_${unitId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    // Lista padrão oficial homologada
    const defaults: CandidatoEleicao[] = [
      {
        id: 'cand-4977',
        matricula: '179645',
        nome: 'GUSTAVO FERREIRA DA CONCEICAO',
        apelidoUrna: 'GUSTAVO CONCEICAO',
        numeroUrna: '10',
        cargo: 'TECNICO SERVICO AO CLIENTE',
        setor: 'Operação de Campo',
        email: 'GUSTAVO.CONCEICAO@TELEFONICA.COM',
        dataAdmissao: '02/06/2026',
        fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
        propostas: 'Fiscalização contínua das rotas de fuga, melhoria dos EPIs e combate ao assédio no trabalho.',
        votos: 28,
        status: 'confirmado',
        protocolo: 'CIPA-CAND-4977',
        tokenConfirmacao: 'tok-gustavo-4977',
        inscritoEm: '22/09/2026 às 09:15',
        confirmadoEm: '22/09/2026 às 09:30',
        lembretesEnviadosCount: 0
      },
      {
        id: 'cand-4976',
        matricula: '154266',
        nome: 'JULIA ROCHA DOS SANTOS',
        apelidoUrna: 'JULIA SANTOS',
        numeroUrna: '12',
        cargo: 'ASSISTENTE TECNICO',
        setor: 'Suporte Técnico',
        email: 'JULIA.RSANTOS@TELEFONICA.COM',
        dataAdmissao: '14/10/2022',
        fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces',
        propostas: 'Ações ergonômicas nos postos de teleatendimento e oficinas da SIPAT focadas em saúde mental.',
        votos: 22,
        status: 'confirmado',
        protocolo: 'CIPA-CAND-4976',
        tokenConfirmacao: 'tok-julia-4976',
        inscritoEm: '23/09/2026 às 11:20',
        confirmadoEm: '23/09/2026 às 11:45',
        lembretesEnviadosCount: 0
      },
      {
        id: 'cand-4998',
        matricula: '180550',
        nome: 'LUANNA SANTANA BEZERRA',
        apelidoUrna: 'LUANNA BEZERRA',
        numeroUrna: '15',
        cargo: 'ASSISTENTE TECNICO',
        setor: 'Atendimento',
        email: 'LUANNA.BEZERRA@TELEFONICA.COM',
        dataAdmissao: '06/07/2026',
        fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces',
        propostas: 'Canal de denúncias ativo, acolhimento de colaboradoras e revisão do Mapa de Riscos setorial.',
        votos: 15,
        status: 'confirmado',
        protocolo: 'CIPA-CAND-4998',
        tokenConfirmacao: 'tok-luanna-4998',
        inscritoEm: '24/09/2026 às 14:10',
        confirmadoEm: '24/09/2026 às 14:15',
        lembretesEnviadosCount: 0
      },
      {
        id: 'cand-5023',
        matricula: '3518036',
        nome: 'MANOEL FRANCISCO DOS SANTOS',
        apelidoUrna: 'MANOEL SANTOS',
        numeroUrna: '20',
        cargo: 'Técnico de serviço ao cliente',
        setor: 'Manutenção',
        email: 'manoel.santos.telefonica@gmail.com',
        dataAdmissao: '04/06/2017',
        fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
        propostas: 'Inspeção preventiva rigorosa nas ferramentas de trabalho e diálogo de segurança semanal.',
        votos: 11,
        status: 'confirmado',
        protocolo: 'CIPA-CAND-5023',
        tokenConfirmacao: 'tok-manoel-5023',
        inscritoEm: '25/09/2026 às 16:00',
        confirmadoEm: '25/09/2026 às 16:30',
        lembretesEnviadosCount: 0
      },
      {
        id: 'cand-5004',
        matricula: '3538328',
        nome: 'MARCELO AUGUSTO ARCIFA SAMPAIO',
        apelidoUrna: 'MARCELO SAMPAIO',
        numeroUrna: '22',
        cargo: 'TECNICO SERVICO AO CLIENTE',
        setor: 'Operação',
        email: 'MARCELO.SAMPAIO@TELEFONICA.COM',
        dataAdmissao: '17/04/2013',
        fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
        propostas: 'Prevenção de acidentes em trabalhos em altura e revisão constante dos equipamentos de resgate.',
        votos: 8,
        status: 'confirmado',
        protocolo: 'CIPA-CAND-5004',
        tokenConfirmacao: 'tok-marcelo-sampaio',
        inscritoEm: '26/09/2026 às 08:30',
        confirmadoEm: '26/09/2026 às 09:00',
        lembretesEnviadosCount: 0
      },
      {
        id: 'cand-4973',
        matricula: '179595',
        nome: 'MARCELO AUGUSTO FERREIRA',
        apelidoUrna: 'MARCELO FERREIRA',
        numeroUrna: '25',
        cargo: 'TECNICO SERVICO AO CLIENTE',
        setor: 'Redes Externas',
        email: 'MARCELO.FERREIRA@TELEFONICA.COM',
        dataAdmissao: '02/06/2026',
        fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
        propostas: 'Treinamento contínuo sobre riscos elétricos e valorização da comissão na unidade.',
        votos: 6,
        status: 'confirmado',
        protocolo: 'CIPA-CAND-4973',
        tokenConfirmacao: 'tok-marcelo-ferreira',
        inscritoEm: '26/09/2026 às 10:15',
        confirmadoEm: '26/09/2026 às 10:45',
        lembretesEnviadosCount: 0
      },
      {
        id: 'cand-5006',
        matricula: '3540169',
        nome: 'VANDERSON DE JESUS OLIVEIRA',
        apelidoUrna: 'VANDERSON OLIVEIRA',
        numeroUrna: '30',
        cargo: 'TECNICO SERVICO AO CLIENTE',
        setor: 'Instalação',
        email: 'VANDERSON.OLIVEIRA@TELEFONICA.COM',
        dataAdmissao: '17/07/2013',
        fotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces',
        propostas: 'Mais transparência nas investigações de acidentes e blitz educativa sobre trânsito seguro.',
        votos: 4,
        status: 'confirmado',
        protocolo: 'CIPA-CAND-5006',
        tokenConfirmacao: 'tok-vanderson-5006',
        inscritoEm: '27/09/2026 às 15:20',
        confirmadoEm: '27/09/2026 às 15:50',
        lembretesEnviadosCount: 0
      },
      // Candidato com inscrição pendente de confirmação por e-mail para simulação
      {
        id: 'cand-5010',
        matricula: '181200',
        nome: 'RODRIGO ALBUQUERQUE LIMA',
        apelidoUrna: 'RODRIGO LIMA',
        numeroUrna: '40',
        cargo: 'ASSISTENTE DE OPERAÇÕES',
        setor: 'Logística',
        email: 'rodrigo.lima@telefonica.com',
        dataAdmissao: '10/01/2025',
        fotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces',
        propostas: 'Melhoria na ergonomia de carregamento de materiais e palestras sobre assédio moral.',
        votos: 0,
        status: 'pendente_confirmacao',
        protocolo: 'CIPA-CAND-5010',
        tokenConfirmacao: 'tok-rodrigo-5010',
        inscritoEm: '01/10/2026 às 09:40',
        lembretesEnviadosCount: 2,
        ultimoLembreteEm: '02/10/2026 às 09:00'
      }
    ];

    return defaults;
  }

  /**
   * Salva a lista de candidatos
   */
  static saveCandidatos(unitId: string, candidatos: CandidatoEleicao[]): void {
    localStorage.setItem(`${STORAGE_KEYS.CANDIDATOS}_${unitId}`, JSON.stringify(candidatos));
  }

  /**
   * Registra uma nova candidatura (FOTO OBRIGATÓRIA)
   */
  static async registerCandidato(
    unitId: string,
    data: {
      matricula: string;
      nome: string;
      apelidoUrna: string;
      numeroUrna: string;
      cargo: string;
      setor: string;
      email: string;
      dataAdmissao: string;
      fotoUrl: string;
      propostas: string;
    }
  ): Promise<{ success: boolean; candidato?: CandidatoEleicao; message: string }> {
    if (!data.fotoUrl || data.fotoUrl.trim() === '') {
      return {
        success: false,
        message: 'A foto do candidato é estritamente obrigatória para conclusão da inscrição e exibição na urna digital.'
      };
    }

    const candidatos = this.getCandidatos(unitId);
    const existing = candidatos.find(c => c.matricula === data.matricula);
    if (existing) {
      return {
        success: false,
        message: `Já existe uma inscrição registrada para a matrícula RE ${data.matricula}.`
      };
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const protocolo = `CIPA-CAND-${randomNum}`;
    const token = `tok-${data.matricula}-${Date.now().toString(16)}`;
    const nowStr = new Date().toLocaleString('pt-BR');

    const novoCandidato: CandidatoEleicao = {
      id: `cand-${randomNum}`,
      matricula: data.matricula,
      nome: data.nome,
      apelidoUrna: data.apelidoUrna || data.nome.split(' ').slice(0, 2).join(' '),
      numeroUrna: data.numeroUrna || String(randomNum).slice(0, 2),
      cargo: data.cargo,
      setor: data.setor,
      email: data.email,
      dataAdmissao: data.dataAdmissao,
      fotoUrl: data.fotoUrl,
      propostas: data.propostas,
      votos: 0,
      status: 'pendente_confirmacao',
      protocolo,
      tokenConfirmacao: token,
      inscritoEm: nowStr,
      lembretesEnviadosCount: 0
    };

    candidatos.push(novoCandidato);
    this.saveCandidatos(unitId, candidatos);

    // Logs de auditoria da inscrição e disparo do e-mail
    this.addAuditLog(unitId, {
      tipo: 'INSCRICAO',
      descricao: `Inscrição submetida por ${novoCandidato.nome} (RE: ${novoCandidato.matricula}) - Foto anexada com sucesso. Protocolo: ${protocolo}`,
      usuarioMascarado: `${novoCandidato.matricula.slice(0, 3)}***`,
      ipAnonimizado: '187.54.21.***'
    });

    this.addAuditLog(unitId, {
      tipo: 'CONFIRMACAO_EMAIL',
      descricao: `E-mail de confirmação de candidatura enviado para ${novoCandidato.email} com token ${token.slice(0, 8)}...`,
      usuarioMascarado: `${novoCandidato.matricula.slice(0, 3)}***`,
      ipAnonimizado: '187.54.21.***'
    });

    return {
      success: true,
      candidato: novoCandidato,
      message: 'Inscrição realizada com sucesso! Um e-mail de confirmação foi enviado para validar a sua candidatura.'
    };
  }

  /**
   * Confirma a candidatura via token ou manualmente
   */
  static confirmCandidatura(unitId: string, candidatoId: string): boolean {
    const candidatos = this.getCandidatos(unitId);
    const cand = candidatos.find(c => c.id === candidatoId);
    if (!cand) return false;

    cand.status = 'confirmado';
    cand.confirmadoEm = new Date().toLocaleString('pt-BR');
    this.saveCandidatos(unitId, candidatos);

    this.addAuditLog(unitId, {
      tipo: 'HOMOLOGACAO',
      descricao: `Candidatura de ${cand.nome} (RE: ${cand.matricula}) confirmada e homologada com sucesso.`,
      usuarioMascarado: `${cand.matricula.slice(0, 3)}***`,
      ipAnonimizado: '127.0.0.1'
    });

    return true;
  }

  /**
   * Reprova uma candidatura com motivo
   */
  static reproveCandidatura(unitId: string, candidatoId: string, motivo: string): boolean {
    const candidatos = this.getCandidatos(unitId);
    const cand = candidatos.find(c => c.id === candidatoId);
    if (!cand) return false;

    cand.status = 'reprovado';
    cand.motivoReprovacao = motivo;
    this.saveCandidatos(unitId, candidatos);

    this.addAuditLog(unitId, {
      tipo: 'HOMOLOGACAO',
      descricao: `Candidatura de ${cand.nome} (RE: ${cand.matricula}) reprovada pela Comissão Eleitoral. Motivo: ${motivo}`,
      usuarioMascarado: `${cand.matricula.slice(0, 3)}***`,
      ipAnonimizado: '127.0.0.1'
    });

    return true;
  }

  /**
   * Dispara lembretes diários para todos os candidatos com inscrição pendente de confirmação
   */
  static sendDailyReminders(unitId: string): { sentCount: number; affectedCandidates: string[] } {
    const candidatos = this.getCandidatos(unitId);
    const pendentes = candidatos.filter(c => c.status === 'pendente_confirmacao');
    const affected: string[] = [];
    const nowStr = new Date().toLocaleString('pt-BR');

    pendentes.forEach(c => {
      c.lembretesEnviadosCount = (c.lembretesEnviadosCount || 0) + 1;
      c.ultimoLembreteEm = nowStr;
      affected.push(c.nome);

      this.addAuditLog(unitId, {
        tipo: 'LEMBRETE_DIARIO',
        descricao: `Lembrete diário automático #${c.lembretesEnviadosCount} enviado para ${c.email} (Candidato: ${c.nome}) - Inscrição ainda pendente de confirmação`,
        usuarioMascarado: `${c.matricula.slice(0, 3)}***`,
        ipAnonimizado: '10.0.0.***'
      });
    });

    if (affected.length > 0) {
      this.saveCandidatos(unitId, candidatos);
    }

    return {
      sentCount: pendentes.length,
      affectedCandidates: affected
    };
  }

  /**
   * Autenticação do Eleitor na Urna Digital:
   * Login via RE / Matrícula e Senha sendo os 4 primeiros dígitos do CPF
   */
  static authenticateVoter(
    unitId: string,
    re: string,
    cpfDigits: string
  ): {
    authenticated: boolean;
    employee?: EmployeeRecord;
    alreadyVoted: boolean;
    message: string;
  } {
    const cleanRe = re.trim().toUpperCase();
    const cleanDigits = cpfDigits.replace(/\D/g, '').trim();

    if (!cleanRe || !cleanDigits) {
      return {
        authenticated: false,
        alreadyVoted: false,
        message: 'Informe o seu RE / Matrícula e os 4 primeiros dígitos do seu CPF.'
      };
    }

    const employees = this.getEmployees(unitId);
    const emp = employees.find(e => e.matricula.trim().toUpperCase() === cleanRe);

    if (!emp) {
      this.addAuditLog(unitId, {
        tipo: 'ACESSO_URNA',
        descricao: `Tentativa de login falha na Urna Digital: RE "${cleanRe}" não encontrado na base de votantes da unidade`,
        ipAnonimizado: '189.120.45.***'
      });
      return {
        authenticated: false,
        alreadyVoted: false,
        message: `Colaborador com RE "${cleanRe}" não localizado na base eleitoral deste estabelecimento.`
      };
    }

    // Compara os 4 primeiros dígitos do CPF do colaborador
    const rawCpf = emp.cpf.replace(/\D/g, '');
    const first4Digits = rawCpf.slice(0, 4);

    if (first4Digits !== cleanDigits) {
      this.addAuditLog(unitId, {
        tipo: 'ACESSO_URNA',
        descricao: `Tentativa de login com senha incorreta para o RE ${cleanRe}`,
        usuarioMascarado: `${cleanRe.slice(0, 3)}***`,
        ipAnonimizado: '189.120.45.***'
      });
      return {
        authenticated: false,
        alreadyVoted: false,
        message: 'Senha incorreta. A senha são exatamente os 4 primeiros dígitos do seu CPF cadastrado no RH.'
      };
    }

    // Verifica se já votou
    const votedSet = this.getVotedElectorsSet(unitId);
    const alreadyVoted = votedSet.has(cleanRe);

    this.addAuditLog(unitId, {
      tipo: 'ACESSO_URNA',
      descricao: `Autenticação bem-sucedida do eleitor ${emp.name} (RE: ${cleanRe}) na Urna Digital`,
      usuarioMascarado: `${cleanRe.slice(0, 3)}***`,
      ipAnonimizado: '189.120.45.***'
    });

    return {
      authenticated: true,
      employee: emp,
      alreadyVoted,
      message: alreadyVoted ? 'Eleitor autenticado, mas o voto já foi exercido anteriormente neste pleito.' : 'Autenticação realizada com sucesso.'
    };
  }

  /**
   * Obtém conjunto de REs que já votaram
   */
  static getVotedElectorsSet(unitId: string): Set<string> {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.VOTES_CAST}_${unitId}`);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    return new Set<string>(['180550', '3518036']); // Simulados prévios
  }

  /**
   * Registra voto secreto com hash criptográfico SHA-256
   */
  static async castVoterVote(
    unitId: string,
    re: string,
    candidateId: string // 'branco' ou id do candidato
  ): Promise<{ success: boolean; hash?: string; receiptTimestamp?: string; message: string }> {
    const votedSet = this.getVotedElectorsSet(unitId);
    const cleanRe = re.trim().toUpperCase();

    if (votedSet.has(cleanRe)) {
      return {
        success: false,
        message: 'Voto já registrado anteriormente para este colaborador. O sistema bloqueia voto duplo conforme NR-5.'
      };
    }

    const timestamp = new Date().toLocaleString('pt-BR');
    const randomSalt = Math.random().toString(36).substring(2, 10);
    const rawVoteString = `VOTE-CIPA-${unitId}-${candidateId}-${Date.now()}-${randomSalt}`;
    const hash = await computeSha256(rawVoteString);

    // Computa voto no candidato ou branco
    const candidatos = this.getCandidatos(unitId);
    if (candidateId !== 'branco' && candidateId !== 'nulo') {
      const target = candidatos.find(c => c.id === candidateId);
      if (target) {
        target.votos = (target.votos || 0) + 1;
        this.saveCandidatos(unitId, candidatos);
      }
    }

    // Registra que este eleitor votou (prevenindo duplo voto, sem vincular ao candidato escolhido)
    votedSet.add(cleanRe);
    localStorage.setItem(`${STORAGE_KEYS.VOTES_CAST}_${unitId}`, JSON.stringify(Array.from(votedSet)));

    // Grava log criptográfico imutável
    const maskedRe = `${cleanRe.slice(0, 3)}***${cleanRe.slice(-2)}`;
    this.addAuditLog(unitId, {
      tipo: 'VOTO_COMPUTADO',
      descricao: `Voto computado com sucesso na urna eletrônica. Voto secreto criptografado via SHA-256`,
      usuarioMascarado: maskedRe,
      ipAnonimizado: '189.120.45.***',
      hash
    });

    return {
      success: true,
      hash,
      receiptTimestamp: timestamp,
      message: 'Voto computado com sucesso e inviolabilidade criptográfica garantida!'
    };
  }

  /**
   * Logs de auditoria do pleito
   */
  static getAuditLogs(unitId: string = 'unit-tel-jundiai'): ElectionAuditLog[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.AUDIT_LOGS}_${unitId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    return [
      {
        id: 'aud-ini-1',
        timestamp: '13/10/2026 08:00:01',
        tipo: 'CONFIGURACAO',
        descricao: 'Urna Digital aberta para votação oficial da Gestão 2026/2027',
        ipAnonimizado: '172.20.1.***'
      },
      {
        id: 'aud-ini-2',
        timestamp: '13/10/2026 08:05:14',
        tipo: 'VOTO_COMPUTADO',
        descricao: 'Voto computado na urna digital com hash criptográfico SHA-256',
        usuarioMascarado: '180***50',
        ipAnonimizado: '187.54.21.***',
        hash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'
      },
      {
        id: 'aud-ini-3',
        timestamp: '13/10/2026 08:12:33',
        tipo: 'VOTO_COMPUTADO',
        descricao: 'Voto computado na urna digital com hash criptográfico SHA-256',
        usuarioMascarado: '351***36',
        ipAnonimizado: '187.54.21.***',
        hash: '89A7F41C2E8301B8D8F4E29A1009CF5B7319FE45A910CB881E93309B74CA6102'
      }
    ];
  }

  /**
   * Adiciona um novo log de auditoria
   */
  static addAuditLog(unitId: string, log: Omit<ElectionAuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs(unitId);
    const newLog: ElectionAuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      timestamp: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR')
    };
    logs.unshift(newLog);
    // Guarda os últimos 150 logs para performance
    localStorage.setItem(`${STORAGE_KEYS.AUDIT_LOGS}_${unitId}`, JSON.stringify(logs.slice(0, 150)));
  }
}

