export type UserRole = 
  | 'master'           // Master: vê tudo, todas as empresas e unidades, métricas globais
  | 'admin_empresa'    // Administrador da Empresa: gerencia sua empresa e todas as filiais
  | 'gestor_unidade'   // Gestor de Unidade: responsável apenas pela sua filial/unidade
  | 'tecnico_sst'      // Técnico de SST: sobe dados, organiza eleição, emite guias e atas
  | 'cipeiro'          // Cipeiro: eleito/indicado, assina atas, cria planos de ação 5W2H
  | 'eleitor';         // Eleitor: colaborador geral, vota durante a eleição e vê comprovante

export interface CompanyUnit {
  id: string;
  name: string;
  cnpj?: string;
  city: string;
  state: string;
  headcount: number;
  grauDeRisco: 1 | 2 | 3 | 4;
  cnaeCode: string;
  cnaeDesc: string;
  cipaAtiva: boolean;
  gestorName: string;
}

export interface Company {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  logoUrl?: string;
  cnaeCode?: string;
  cnaeDesc?: string;
  enderecoCompleto?: string;
  modulosContratados: {
    dimensionamento: boolean;
    eleicao: boolean;
    gestao: boolean;
  };
  units: CompanyUnit[];
  responsavelAdmin: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  roleDescription: string;
  companyId?: string;       // Presente se vinculado a uma empresa principal
  unitId?: string;          // Presente se vinculado a uma unidade específica
  companyIds?: string[];    // Vínculo a múltiplas empresas
  unitIds?: string[];       // Vínculo a múltiplas filiais/unidades
  cpf?: string;             // CPF do usuário formatado 000.000.000-00
  avatarInitials: string;
  avatarUrl?: string;       // Foto de perfil do usuário
}
