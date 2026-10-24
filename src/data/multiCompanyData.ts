import { Company, AuthUser } from '../types/auth';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'emp-1',
    razaoSocial: 'Indústrias Metalmecânicas Alfa Brasil S.A.',
    nomeFantasia: 'Alfa Brasil Industrial',
    cnpj: '12.345.678/0001-90',
    logoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=120&h=120&q=80',
    cnaeCode: '2511-0/00',
    cnaeDesc: 'Fabricação de estruturas metálicas',
    enderecoCompleto: 'Av. das Indústrias, 1500, Distrito Industrial, São Paulo - SP, CEP 04795-100',
    modulosContratados: {
      dimensionamento: true,
      eleicao: true,
      gestao: true,
    },
    responsavelAdmin: 'Roberto Alcantara (Diretor de Operações)',
    units: [
      {
        id: 'unit-1-matriz',
        name: 'Matriz Corporativa & Linha 01 (São Paulo - SP)',
        city: 'São Paulo',
        state: 'SP',
        headcount: 145,
        grauDeRisco: 3,
        cnaeCode: '2511-0/00',
        cnaeDesc: 'Fabricação de estruturas metálicas',
        cipaAtiva: true,
        gestorName: 'Juliana Paes (Gerente de Unidade SP)'
      },
      {
        id: 'unit-1-betim',
        name: 'Planta de Fundição & Usinagem (Betim - MG)',
        city: 'Betim',
        state: 'MG',
        headcount: 320,
        grauDeRisco: 4,
        cnaeCode: '2511-0/00',
        cnaeDesc: 'Fabricação de estruturas metálicas e fundição',
        cipaAtiva: true,
        gestorName: 'Marcos Vinicius (Gerente Industrial Betim)'
      },
      {
        id: 'unit-1-cajamar',
        name: 'Centro Logístico e Distribuição (Cajamar - SP)',
        city: 'Cajamar',
        state: 'SP',
        headcount: 85,
        grauDeRisco: 2,
        cnaeCode: '4930-2/02',
        cnaeDesc: 'Transporte rodoviário de cargas',
        cipaAtiva: true,
        gestorName: 'Fernanda Lima (Supervisora Logística)'
      }
    ]
  },
  {
    id: 'emp-2',
    razaoSocial: 'Rede Hospitalar e Cuidados Médicos São Lucas S.A.',
    nomeFantasia: 'Hospital São Lucas',
    cnpj: '98.765.432/0001-10',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=120&h=120&q=80',
    cnaeCode: '8610-1/01',
    cnaeDesc: 'Atividades de atendimento hospitalar',
    enderecoCompleto: 'Rua Marechal Deodoro, 820, Centro Cívico, Curitiba - PR, CEP 80010-010',
    modulosContratados: {
      dimensionamento: true,
      eleicao: true,
      gestao: false, // Comprou só módulos 1 e 2
    },
    responsavelAdmin: 'Dra. Cristina Medeiros',
    units: [
      {
        id: 'unit-2-central',
        name: 'Hospital Geral Central (Curitiba - PR)',
        city: 'Curitiba',
        state: 'PR',
        headcount: 420,
        grauDeRisco: 3,
        cnaeCode: '8610-1/01',
        cnaeDesc: 'Atividades de atendimento hospitalar',
        cipaAtiva: true,
        gestorName: 'Dr. Paulo Siqueira'
      }
    ]
  },
  {
    id: 'emp-3',
    razaoSocial: 'LogTech Express Distribuição e Logística Ltda.',
    nomeFantasia: 'LogTech Brasil',
    cnpj: '45.123.789/0001-55',
    logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=120&h=120&q=80',
    cnaeCode: '4930-2/02',
    cnaeDesc: 'Transporte rodoviário de carga',
    enderecoCompleto: 'Rodovia Santos Dumont, Km 66, Viracopos, Campinas - SP, CEP 13055-900',
    modulosContratados: {
      dimensionamento: true,
      eleicao: false,
      gestao: true, // Comprou só módulos 1 e 3
    },
    responsavelAdmin: 'Eduardo Guedes',
    units: [
      {
        id: 'unit-3-campinas',
        name: 'Hub Operacional Aeroporto (Campinas - SP)',
        city: 'Campinas',
        state: 'SP',
        headcount: 195,
        grauDeRisco: 2,
        cnaeCode: '4930-2/02',
        cnaeDesc: 'Transporte rodoviário de carga',
        cipaAtiva: true,
        gestorName: 'Clarisse Moura'
      }
    ]
  }
];

export const DEMO_USERS: Record<string, AuthUser> = {
  master: {
    id: 'usr-master',
    name: 'Dani Santos',
    email: 'dani.master@cipaexpert.com.br',
    role: 'master',
    roleLabel: 'Usuário Master',
    roleDescription: 'Acesso total: visualiza e gerencia todas as empresas, filiais, contratos de módulos e auditoria global do SaaS.',
    avatarInitials: 'DS',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
  },
  admin_empresa: {
    id: 'usr-admin-empresa',
    name: 'Roberto Alcântara',
    email: 'roberto.alcantara@alfabrasil.com.br',
    role: 'admin_empresa',
    roleLabel: 'Administrador da Empresa',
    roleDescription: 'Responsável pela empresa e todas as suas unidades/filiais (SP, Betim, Cajamar). Gerencia módulos e gestores.',
    companyId: 'emp-1',
    avatarInitials: 'RA',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'
  },
  gestor_unidade: {
    id: 'usr-gestor-unidade',
    name: 'Juliana Paes',
    email: 'juliana.paes@alfabrasil.com.br',
    role: 'gestor_unidade',
    roleLabel: 'Gestor de Unidade',
    roleDescription: 'Acesso restrito à sua filial específica: monitora os processos da CIPA e indicadores locais desta unidade.',
    companyId: 'emp-1',
    unitId: 'unit-1-matriz',
    avatarInitials: 'JP',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80'
  },
  tecnico_sst: {
    id: 'usr-tecnico-sst',
    name: 'Carlos Alberto Mendes',
    email: 'carlos.mendes@alfabrasil.com.br',
    role: 'tecnico_sst',
    roleLabel: 'Técnico de SST',
    roleDescription: 'Operador técnico: sobe os dados da eleição, cadastra candidatos, emite atas e editais oficiais e envia para assinaturas.',
    companyId: 'emp-1',
    unitId: 'unit-1-matriz',
    avatarInitials: 'CM',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80'
  },
  cipeiro: {
    id: 'usr-cipeiro',
    name: 'Renata Vasconcelos',
    email: 'renata.vasconcelos@alfabrasil.com.br',
    role: 'cipeiro',
    roleLabel: 'Cipeiro',
    roleDescription: 'Membro eleito da CIPA: assina atas digitalmente, inclui e atualiza planos de ações preventivas (5W2H) e acompanha reuniões.',
    companyId: 'emp-1',
    unitId: 'unit-1-matriz',
    avatarInitials: 'RV',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80'
  },
  eleitor: {
    id: 'usr-eleitor',
    name: 'Lucas Souza',
    email: 'lucas.souza@alfabrasil.com.br',
    role: 'eleitor',
    roleLabel: 'Eleitor',
    roleDescription: 'Acesso pontual para época de eleição: visualiza candidatos, vota na urna segura com sigilo e obtém comprovante com hash.',
    companyId: 'emp-1',
    unitId: 'unit-1-matriz',
    avatarInitials: 'LS',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80'
  }
};

export const DEMO_COMPANIES = INITIAL_COMPANIES;
