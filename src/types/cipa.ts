export type CipaModuleId = 'dimensionamento' | 'eleicao' | 'gestao';

export interface CipaModuleInfo {
  id: CipaModuleId;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  normativeReference: string;
}

export interface CnaeEntry {
  code: string;
  description: string;
  grauDeRisco: 1 | 2 | 3 | 4;
  sectorGroup: string; // ex: C-1, C-2, etc. correspondente ao Quadro I da NR-5
}

export interface DimensionamentoResult {
  cnae: CnaeEntry;
  headcount: number;
  grauDeRisco: number;
  precisaCipa: boolean; // Se false, é Designado de CIPA
  efetivosEmpregador: number;
  suplentesEmpregador: number;
  efetivosEmpregados: number;
  suplentesEmpregados: number;
  totalMembros: number;
  observacaoNormativa: string;
}

export interface CronogramaItem {
  id: string;
  fase: string;
  descricao: string;
  diasLimite: number; // dias em relação ao término do mandato ou início
  prazoRelativo: string;
  dataCalculada: string;
  status: 'concluido' | 'em_andamento' | 'pendente';
  documentoTipo: 'edital_convocacao' | 'comissao_eleitoral' | 'edital_inscricao' | 'ata_eleicao' | 'ata_posse' | 'outro';
}

export interface Candidato {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  tempoEmpresa: string;
  fotoUrl: string;
  numero: string;
  propostas: string;
  votos: number;
}

export interface VotoAuditoria {
  id: string;
  timestamp: string;
  hashComprovante: string;
  eleitorMatriculaMascarada: string;
  ipOrigemAnonimizado: string;
  status: 'computado';
}

export interface AtaReuniao {
  id: string;
  numero: number;
  tipo: 'ordinaria' | 'extraordinaria';
  data: string;
  horario: string;
  local: string;
  pauta: string;
  deliberacoes: string;
  participantes: { nome: string; cargo: string; papel: string; assinado: boolean }[];
  status: 'rascunho' | 'assinada' | 'arquivada';
  hashAssinatura?: string;
  dataAssinatura?: string;
}

export interface PlanoAcao5W2H {
  id: string;
  oQue: string; // What
  porQue: string; // Why
  onde: string; // Where
  quem: string; // Who
  quando: string; // When
  como: string; // How
  quanto: string; // How much
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
  categoria: 'prevencao_acidentes' | 'prevencao_assedio' | 'ergonomia' | 'epis_epcs' | 'treinamento';
  evidencia?: string;
}

export interface ReuniaoCalendario {
  id: string;
  titulo: string;
  data: string;
  tipo: 'ordinaria' | 'extraordinaria' | 'sipat';
  horario: string;
  local: string;
  concluida: boolean;
  lembreteAtivo: boolean;
}
