import { CompanyUnit, Company } from '../types/auth';
import { INITIAL_COMPANIES } from './multiCompanyData';

export interface EmployeeRecord {
  id: string;
  name: string;
  apelido?: string;
  matricula: string; // RE / Matrícula
  cpf: string;
  cargo: string;
  setor: string;
  email: string;
  dataAdmissao: string;
  fotoUrl?: string;
  unitId: string;
  companyId: string;
  ativo: boolean;
}

// Catálogo base de colaboradores por empresa e unidade
export const INITIAL_EMPLOYEES: EmployeeRecord[] = [
  // ─────────────────────────────────────────────────────────────
  // TELEFÔNICA BRASIL S.A. - UNIDADE JUNDIAÍ VILA (unit-tel-jundiai / CNPJ: 02.558.157/0577-84)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'emp-tel-jun-1',
    name: 'GUSTAVO FERREIRA DA CONCEICAO',
    apelido: 'GUSTAVO CONCEICAO',
    matricula: '179645',
    cpf: '345.678.901-22',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Operação de Campo',
    email: 'GUSTAVO.CONCEICAO@TELEFONICA.COM',
    dataAdmissao: '02/06/2026',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-2',
    name: 'JULIA ROCHA DOS SANTOS',
    apelido: 'JULIA SANTOS',
    matricula: '154266',
    cpf: '234.567.890-11',
    cargo: 'ASSISTENTE TECNICO',
    setor: 'Suporte Técnico',
    email: 'JULIA.RSANTOS@TELEFONICA.COM',
    dataAdmissao: '14/10/2022',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-3',
    name: 'LUANNA SANTANA BEZERRA',
    apelido: 'LUANNA BEZERRA',
    matricula: '180550',
    cpf: '456.789.012-33',
    cargo: 'ASSISTENTE TECNICO',
    setor: 'Engenharia de Redes',
    email: 'LUANNA.BEZERRA@TELEFONICA.COM',
    dataAdmissao: '06/07/2026',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-4',
    name: 'MANOEL FRANCISCO DOS SANTOS',
    apelido: 'MANOEL SANTOS',
    matricula: '3518036',
    cpf: '567.890.123-44',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Atendimento Externo',
    email: 'MANOEL.SANTOS@TELEFONICA.COM',
    dataAdmissao: '15/03/2011',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-5',
    name: 'MARCELO AUGUSTO ARCIFA SAMPAIO',
    apelido: 'MARCELO SAMPAIO',
    matricula: '3538328',
    cpf: '678.901.234-55',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Manutenção de Rede',
    email: 'MARCELO.SAMPAIO@TELEFONICA.COM',
    dataAdmissao: '17/04/2013',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-6',
    name: 'MARCELO AUGUSTO FERREIRA',
    apelido: 'MARCELO FERREIRA',
    matricula: '179595',
    cpf: '789.012.345-66',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Operação de Campo',
    email: 'MARCELO.FERREIRA@TELEFONICA.COM',
    dataAdmissao: '02/06/2026',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-7',
    name: 'VANDERSON DE JESUS OLIVEIRA',
    apelido: 'VANDERSON OLIVEIRA',
    matricula: '3540169',
    cpf: '890.123.456-77',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Atendimento ao Cliente',
    email: 'VANDERSON.OLIVEIRA@TELEFONICA.COM',
    dataAdmissao: '17/07/2013',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-8',
    name: 'PEDRO LOBEIRO',
    apelido: 'PEDRO LOBEIRO',
    matricula: '198421',
    cpf: '901.234.567-88',
    cargo: 'COORDENADOR DE OPERACOES',
    setor: 'Gestão Operacional',
    email: 'PEDRO.LOBEIRO@TELEFONICA.COM',
    dataAdmissao: '10/01/2018',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-9',
    name: 'FABIANA ALVES LIMA',
    apelido: 'FABI SESMT',
    matricula: '201844',
    cpf: '012.345.678-99',
    cargo: 'ANALISTA DE SEGURANCA DO TRABALHO',
    setor: 'SESMT',
    email: 'FABIANA.ALVES@TELEFONICA.COM',
    dataAdmissao: '12/03/2021',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-jun-10',
    name: 'RICARDO SOUZA LIMA',
    apelido: 'RICARDO LIMA',
    matricula: '203991',
    cpf: '123.456.789-00',
    cargo: 'TECNICO DE REDE EXTERNA',
    setor: 'Manutenção de Rede',
    email: 'RICARDO.LIMA@TELEFONICA.COM',
    dataAdmissao: '19/08/2020',
    unitId: 'unit-tel-jundiai',
    companyId: 'comp-telefonica',
    ativo: true
  },

  // ─────────────────────────────────────────────────────────────
  // TELEFÔNICA BRASIL S.A. - UNIDADE PIRACICABA (unit-tel-piracicaba / CNPJ: 02.558.157/0593-02)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'emp-tel-pir-1',
    name: 'LUIZ ALBERTO DE BARROS JUNIOR',
    apelido: 'LUIZ BARROS',
    matricula: '161905',
    cpf: '234.890.123-11',
    cargo: 'GERENTE DE OPERACOES',
    setor: 'Gestão Regional Piracicaba',
    email: 'LUIZ.BARROS@TELEFONICA.COM',
    dataAdmissao: '18/06/2015',
    unitId: 'unit-tel-piracicaba',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-pir-2',
    name: 'MARCIEL PEREIRA SILVA',
    apelido: 'MARCIEL SILVA',
    matricula: '3519920',
    cpf: '345.901.234-22',
    cargo: 'SUPERVISOR TECNICO',
    setor: 'Manutenção de Infraestrutura',
    email: 'MARCIEL.SILVA@TELEFONICA.COM',
    dataAdmissao: '22/09/2016',
    unitId: 'unit-tel-piracicaba',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-pir-3',
    name: 'CARLOS EDUARDO PIRACICABA',
    apelido: 'CADU PIRACICABA',
    matricula: '201455',
    cpf: '456.012.345-33',
    cargo: 'TECNICO DE REDE',
    setor: 'Operação e Manutenção',
    email: 'CARLOS.PIRACICABA@TELEFONICA.COM',
    dataAdmissao: '03/05/2022',
    unitId: 'unit-tel-piracicaba',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-pir-4',
    name: 'PATRICIA SILVEIRA',
    apelido: 'PATI SILVEIRA',
    matricula: '204588',
    cpf: '567.123.456-44',
    cargo: 'ASSISTENTE ADMINISTRATIVO',
    setor: 'Administrativo Regional',
    email: 'PATRICIA.SILVEIRA@TELEFONICA.COM',
    dataAdmissao: '11/11/2021',
    unitId: 'unit-tel-piracicaba',
    companyId: 'comp-telefonica',
    ativo: true
  },

  // ─────────────────────────────────────────────────────────────
  // TELEFÔNICA BRASIL S.A. - UNIDADE MARQUÊS DE SÃO VICENTE (unit-tel-marques / CNPJ: 02.558.157/0773-86)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'emp-tel-mar-1',
    name: 'CESAR BUENO',
    apelido: 'CESAR BUENO',
    matricula: '188402',
    cpf: '678.234.567-55',
    cargo: 'ENGENHEIRO DE TELECOM',
    setor: 'Engenharia Central',
    email: 'CESAR.BUENO@TELEFONICA.COM',
    dataAdmissao: '05/04/2019',
    unitId: 'unit-tel-marques',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-mar-2',
    name: 'ALINE DE PAULA SANTOS',
    apelido: 'ALINE SANTOS',
    matricula: '5003',
    cpf: '789.345.678-66',
    cargo: 'TECNICO SERVICO AO CLIENTE',
    setor: 'Atendimento Especializado',
    email: 'ALINEP.SANTOS@TELEFONICA.COM',
    dataAdmissao: '12/09/2024',
    unitId: 'unit-tel-marques',
    companyId: 'comp-telefonica',
    ativo: true
  },
  {
    id: 'emp-tel-mar-3',
    name: 'RENATO SILVA MENDES',
    apelido: 'RENATO MENDES',
    matricula: '189552',
    cpf: '890.456.789-77',
    cargo: 'ANALISTA DE SISTEMAS',
    setor: 'Tecnologia da Informação',
    email: 'RENATO.MENDES@TELEFONICA.COM',
    dataAdmissao: '01/02/2020',
    unitId: 'unit-tel-marques',
    companyId: 'comp-telefonica',
    ativo: true
  },

  // ─────────────────────────────────────────────────────────────
  // ALFA BRASIL INDUSTRIAL - MATRIZ SÃO PAULO (unit-1-matriz / CNPJ: 12.345.678/0001-90)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'emp-alfa-mat-1',
    name: 'MARCOS VINICIUS SANTOS',
    apelido: 'MARCÃO DA USINAGEM',
    matricula: 'CLT-1024',
    cpf: '123.456.789-01',
    cargo: 'Operador de Torno CNC',
    setor: 'Usinagem Pesada',
    email: 'marcos.santos@alfabrasil.com.br',
    dataAdmissao: '2021-03-15',
    unitId: 'unit-1-matriz',
    companyId: 'emp-1',
    ativo: true
  },
  {
    id: 'emp-alfa-mat-2',
    name: 'ANA PAULA FERREIRA',
    apelido: 'PAULINHA DO ALMOXARIFADO',
    matricula: 'CLT-1058',
    cpf: '234.567.890-12',
    cargo: 'Supervisora de Logística',
    setor: 'Almoxarifado & Estoque',
    email: 'ana.ferreira@alfabrasil.com.br',
    dataAdmissao: '2019-08-20',
    unitId: 'unit-1-matriz',
    companyId: 'emp-1',
    ativo: true
  },
  {
    id: 'emp-alfa-mat-3',
    name: 'CARLOS EDUARDO MENDES',
    apelido: 'CADU DA MANUTENÇÃO',
    matricula: 'CLT-1092',
    cpf: '345.678.901-23',
    cargo: 'Eletricista Industrial',
    setor: 'Manutenção Elétrica',
    email: 'carlos.mendes@alfabrasil.com.br',
    dataAdmissao: '2020-01-10',
    unitId: 'unit-1-matriz',
    companyId: 'emp-1',
    ativo: true
  },
  {
    id: 'emp-alfa-mat-4',
    name: 'JULIANA PAES RODRIGUES',
    apelido: 'JU DA QUALIDADE',
    matricula: 'CLT-1126',
    cpf: '456.789.012-34',
    cargo: 'Inspetora de Controle de Qualidade',
    setor: 'Garantia da Qualidade',
    email: 'juliana.rodrigues@alfabrasil.com.br',
    dataAdmissao: '2022-04-05',
    unitId: 'unit-1-matriz',
    companyId: 'emp-1',
    ativo: true
  },

  // ─────────────────────────────────────────────────────────────
  // ALFA BRASIL INDUSTRIAL - BETIM (unit-1-betim / CNPJ: 12.345.678/0002-71)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'emp-alfa-bet-1',
    name: 'FELIPE AUGUSTO BETIM',
    apelido: 'FELIPE BETIM',
    matricula: 'CLT-2010',
    cpf: '567.890.123-45',
    cargo: 'Fundidor Especializado',
    setor: 'Fundição',
    email: 'felipe.betim@alfabrasil.com.br',
    dataAdmissao: '2020-05-18',
    unitId: 'unit-1-betim',
    companyId: 'emp-1',
    ativo: true
  },
  {
    id: 'emp-alfa-bet-2',
    name: 'VITORIA ANDRADE BETIM',
    apelido: 'VICK USINAGEM',
    matricula: 'CLT-2025',
    cpf: '678.901.234-56',
    cargo: 'Operadora de Fresadora',
    setor: 'Usinagem',
    email: 'vitoria.andrade@alfabrasil.com.br',
    dataAdmissao: '2021-09-12',
    unitId: 'unit-1-betim',
    companyId: 'emp-1',
    ativo: true
  }
];

export interface ValidationResult {
  valid: boolean;
  status: 'success' | 'wrong_unit' | 'not_found' | 'name_mismatch' | 'already_registered' | 'inactive';
  employee?: EmployeeRecord;
  employeeUnit?: CompanyUnit;
  employeeCompany?: Company;
  targetUnit?: CompanyUnit;
  targetCompany?: Company;
  message: string;
}

// Normaliza strings para comparação insensível a acentos e maiúsculas
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Validador oficial de elegibilidade eleitoral da NR-05:
 * Garante que o colaborador existe, confere o RE com o Nome e
 * BLOQUEIA se pertencer a uma unidade diferente da unidade do link.
 */
export function validateCandidateEligibility(
  inputRe: string,
  inputName: string,
  targetCompanyId: string,
  targetUnitId: string,
  allEmployees: EmployeeRecord[] = INITIAL_EMPLOYEES,
  existingCandidates: Array<{ matricula?: string; nome?: string; unitId?: string }> = []
): ValidationResult {
  const cleanRe = inputRe.trim().toUpperCase();
  const cleanName = normalizeText(inputName);

  const targetCompany = INITIAL_COMPANIES.find(c => c.id === targetCompanyId);
  const targetUnit = targetCompany?.units.find(u => u.id === targetUnitId);

  // 1. Busca colaborador pelo RE / Matrícula
  const employee = allEmployees.find(e => 
    e.matricula.trim().toUpperCase() === cleanRe
  );

  if (!employee) {
    return {
      valid: false,
      status: 'not_found',
      targetUnit,
      targetCompany,
      message: `Colaborador não localizado. O RE/Matrícula "${cleanRe}" não consta na base de funcionários ativos do sistema. Verifique a digitação ou procure o RH/SST.`
    };
  }

  // 2. Valida correspondência do Nome
  const empNameNorm = normalizeText(employee.name);
  const empApelidoNorm = employee.apelido ? normalizeText(employee.apelido) : '';
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  
  // Confere se pelo menos duas partes do nome ou o primeiro nome conferem
  const isNameMatching = nameParts.length > 0 && nameParts.every(part => empNameNorm.includes(part) || empApelidoNorm.includes(part));

  if (!isNameMatching && !empNameNorm.includes(cleanName) && !cleanName.includes(empNameNorm)) {
    return {
      valid: false,
      status: 'name_mismatch',
      employee,
      targetUnit,
      targetCompany,
      message: `Divergência cadastral: O nome informado ("${inputName}") não coincide com o titular registrado para o RE ${cleanRe}.`
    };
  }

  // 3. Localiza empresa e unidade cadastrada do colaborador
  let empCompany = INITIAL_COMPANIES.find(c => c.id === employee.companyId);
  let empUnit = empCompany?.units.find(u => u.id === employee.unitId);

  if (!empUnit) {
    // Busca em todas as empresas caso o companyId divirja
    for (const comp of INITIAL_COMPANIES) {
      const u = comp.units.find(un => un.id === employee.unitId);
      if (u) {
        empUnit = u;
        empCompany = comp;
        break;
      }
    }
  }

  // 4. VALIDAÇÃO CRÍTICA DE LOTAÇÃO (NR-05 Subitem 5.5):
  // O colaborador precisa estar lotado EXATAMENTE na unidade da eleição!
  if (employee.unitId !== targetUnitId || (employee.companyId && targetCompanyId && employee.companyId !== targetCompanyId)) {
    const unitCadastradaNome = empUnit?.name || employee.unitId;
    const unitCadastradaCnpj = empUnit?.cnpj || empCompany?.cnpj || 'não informado';
    const unitLinkNome = targetUnit?.name || targetUnitId;
    const unitLinkCnpj = targetUnit?.cnpj || targetCompany?.cnpj || 'não informado';

    return {
      valid: false,
      status: 'wrong_unit',
      employee,
      employeeUnit: empUnit,
      employeeCompany: empCompany,
      targetUnit,
      targetCompany,
      message: `ACESSO NÃO AUTORIZADO (NR-05): O colaborador ${employee.name} (RE: ${employee.matricula}) está lotado na "${unitCadastradaNome}" (CNPJ: ${unitCadastradaCnpj}). Não é permitida a inscrição para a eleição da "${unitLinkNome}" (CNPJ: ${unitLinkCnpj}). Conforme o item 5.5 da NR-05, a participação eleitoral é restrita aos trabalhadores lotados no CNPJ do respectivo estabelecimento.`
    };
  }

  // 5. Verifica se já está cadastrado/inscrito
  const isAlreadyRegistered = existingCandidates.some(c => 
    (c.matricula && c.matricula.trim().toUpperCase() === cleanRe) ||
    (c.nome && normalizeText(c.nome) === empNameNorm)
  );

  if (isAlreadyRegistered) {
    return {
      valid: false,
      status: 'already_registered',
      employee,
      employeeUnit: empUnit,
      employeeCompany: empCompany,
      targetUnit,
      targetCompany,
      message: `O colaborador ${employee.name} (RE: ${employee.matricula}) já possui inscrição registrada para o processo eleitoral da CIPA nesta unidade!`
    };
  }

  // 6. Colaborador Válido e Apto!
  return {
    valid: true,
    status: 'success',
    employee,
    employeeUnit: empUnit,
    employeeCompany: empCompany,
    targetUnit,
    targetCompany,
    message: `Identidade e lotação confirmadas com sucesso! Colaborador apto para inscrição na CIPA.`
  };
}
