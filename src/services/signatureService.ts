import { GeneratedDocument, generateCipaDocument } from '../data/documentTemplates';
import { ApiService } from './apiService';

export interface SignatureSigner {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  role: string;
  order: number;
  status: 'pendente' | 'assinado' | 'aguardando_turno';
  signedAt?: string;
  signatureType?: 'desenhada' | 'padrao_cursiva';
  signatureDataUrl?: string;
  hash?: string;
  ipAddress?: string;
  userAgent?: string;
  emailSentAt?: string;
  emailCount?: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  actorName?: string;
  actorEmail?: string;
  ipAddress?: string;
  hash?: string;
}

export interface SignatureTagPosition {
  id: string;
  signerEmail: string;
  signerName: string;
  type: 'assinatura' | 'rubrica' | 'data';
  page: number; // Página 1, 2...
  posX: number; // Percentual X (0 a 100)
  posY: number; // Percentual Y (0 a 100)
  widthPercent?: number;
  heightPercent?: number;
  scale?: number; // Escala de tamanho (ex: 0.75, 1.0, 1.25)
}

export interface SignatureEnvelope {
  id: string;
  title: string;
  category: string;
  normativeCode?: string;
  sourceType: 'sistema' | 'upload';
  docType?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  companyId?: string; // ID da empresa (ex: emp-1, emp-2)
  companyName: string;
  cnpj: string;
  unitId?: string; // ID da filial ativa (ex: unit-1-matriz, unit-1-betim, unit-1-cajamar)
  unitName?: string; // Nome da filial
  createdAt: string;
  updatedAt: string;
  content: string[];
  signers: SignatureSigner[];
  sendSequence: 'todos_juntos' | 'sequencial';
  status: 'rascunho' | 'em_andamento' | 'concluido' | 'cancelado';
  documentHash: string;
  finalHash?: string;
  completedAt?: string;
  auditEvents: AuditEvent[];
  signaturePositions?: SignatureTagPosition[];
}

const STORAGE_KEY = 'cipa_expert_signature_envelopes_v2';

// Cálculo nativo e seguro de SHA-256
export async function computeSha256(text: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  } catch (err) {
    console.warn('Fallback SHA-256:', err);
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 'SHA256-' + Math.abs(hash).toString(16).padStart(16, '0').toUpperCase() + Date.now().toString(16).toUpperCase();
}

// Sementes iniciais estruturadas por empresa e filial para demonstração realista
function getInitialEnvelopes(): SignatureEnvelope[] {
  return [
    // =========================================================================
    // FILIAL 1: MATRIZ SÃO PAULO (emp-1 · unit-1-matriz)
    // =========================================================================
    {
      id: 'env-matriz-ata10',
      title: 'Ata da 10ª Reunião Ordinária da CIPA (Outubro/2026)',
      category: 'Atas Mensais Obrigatórias',
      normativeCode: 'NR-5 Item 5.6.1 · Lei 14.457/2022',
      sourceType: 'sistema',
      docType: 'ata_reuniao',
      companyId: 'emp-1',
      companyName: 'Indústrias Metalmecânicas Alfa Brasil S.A.',
      cnpj: '12.345.678/0001-90',
      unitId: 'unit-1-matriz',
      unitName: 'Matriz Corporativa & Linha 01 (São Paulo - SP)',
      createdAt: '05/10/2026 14:30',
      updatedAt: '05/10/2026 15:45',
      content: [
        'Aos cinco dias do mês de outubro de 2026, reuniu-se ordinariamente a Comissão Interna de Prevenção de Acidentes e Assédio - CIPA da Matriz Corporativa.',
        'Pauta: Avaliação das medidas de proteção coletiva na Linha de Montagem 01 e fiscalização dos registros de quase-acidentes.',
        'Deliberações: Aprovado o cronograma de inspeções setoriais e confirmada a realização das palestras da SIPAT.',
        'Nada mais havendo a constar, lavrou-se a presente ata que vai devidamente assinada por todos os presentes com fé pública e validade jurídica.'
      ],
      documentHash: 'B82C9854A2D4092E21B9FA5D9E22019A82D16279E4582AA5D9088198592318B4',
      sendSequence: 'todos_juntos',
      status: 'concluido',
      finalHash: 'F5910A2B49129E992389DCB019284AC182019482810982AB1982701928347AC1',
      completedAt: '05/10/2026 15:45',
      signers: [
        {
          id: 'sig-m1',
          name: 'Carlos Alberto Mendes',
          email: 'carlos.mendes@alfabrasil.com.br',
          role: 'Presidente da CIPA',
          order: 1,
          status: 'assinado',
          signedAt: '05/10/2026 14:40',
          signatureType: 'padrao_cursiva',
          hash: '4A1B892C7812903847BAC091823901482019482810982AB1982701928347AC12',
          ipAddress: '189.40.12.88',
          emailSentAt: '05/10/2026 14:30',
          emailCount: 1
        },
        {
          id: 'sig-m2',
          name: 'Mariana Fonseca de Souza',
          email: 'mariana.fonseca@alfabrasil.com.br',
          role: 'Vice-Presidente da CIPA',
          order: 2,
          status: 'assinado',
          signedAt: '05/10/2026 15:10',
          signatureType: 'desenhada',
          hash: '7C129084BAC901823901482019482810982AB1982701928347AC124A1B892CD9',
          ipAddress: '177.18.99.14',
          emailSentAt: '05/10/2026 14:30',
          emailCount: 1
        }
      ],
      auditEvents: [
        {
          id: 'aud-m1',
          timestamp: '05/10/2026 14:30:10',
          action: 'ENVELOPE_CRIADO',
          description: 'Ata da 10ª Reunião da Matriz homologada para coleta de assinaturas.',
          actorName: 'Carlos Alberto Mendes',
          actorEmail: 'carlos.mendes@alfabrasil.com.br'
        }
      ]
    },
    {
      id: 'env-matriz-edital',
      title: 'Edital de Convocação da Eleição CIPA Mandato 2026/2027',
      category: 'Processo Eleitoral',
      normativeCode: 'NR-5 Item 5.5.1 · Antecedência Obrigatória de 60 Dias',
      sourceType: 'sistema',
      docType: 'edital_convocacao',
      companyId: 'emp-1',
      companyName: 'Indústrias Metalmecânicas Alfa Brasil S.A.',
      cnpj: '12.345.678/0001-90',
      unitId: 'unit-1-matriz',
      unitName: 'Matriz Corporativa & Linha 01 (São Paulo - SP)',
      createdAt: '15/10/2026 09:00',
      updatedAt: '15/10/2026 10:15',
      content: [
        'A empresa convoca todos os colaboradores da Matriz Corporativa para a eleição dos representantes dos empregados na CIPA.',
        'Período de Inscrição: de 20 a 30 de outubro de 2026, pelo portal do colaborador.',
        'Data da Votação Eletrônica: 10 de novembro de 2026, com escrutínio em tempo real.',
        'Garantias: Estabilidade provisória assegurada nos termos do art. 10, II, "a" do ADCT.'
      ],
      documentHash: 'A1B2C3D4E5F60718293A4B5C6D7E8F90123456789ABCDEF0123456789ABCDEF0',
      sendSequence: 'sequencial',
      status: 'em_andamento',
      signers: [
        {
          id: 'sig-me-1',
          name: 'Roberto Alcântara',
          email: 'roberto.alcantara@alfabrasil.com.br',
          role: 'Diretor / Representante do Empregador',
          order: 1,
          status: 'assinado',
          signedAt: '15/10/2026 10:15',
          signatureType: 'padrao_cursiva',
          hash: '5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F',
          ipAddress: '189.40.12.88',
          emailSentAt: '15/10/2026 09:00',
          emailCount: 1
        },
        {
          id: 'sig-me-2',
          name: 'Carlos Alberto Mendes',
          email: 'carlos.mendes@alfabrasil.com.br',
          role: 'Coordenador do SESMT / SST',
          order: 2,
          status: 'pendente',
          emailSentAt: '15/10/2026 10:15',
          emailCount: 1
        }
      ],
      auditEvents: [
        {
          id: 'aud-me-1',
          timestamp: '15/10/2026 09:00:00',
          action: 'ENVELOPE_CRIADO',
          description: 'Edital oficial de eleição CIPA gerado na Matriz SP.',
          actorName: 'Roberto Alcântara',
          actorEmail: 'roberto.alcantara@alfabrasil.com.br'
        }
      ]
    },

    // =========================================================================
    // FILIAL 2: PLANTA DE BETIM - MG (emp-1 · unit-1-betim)
    // =========================================================================
    {
      id: 'env-betim-inspecao',
      title: 'Ata de Inspeção Extraordinária de Fundição e Ruído (NR-15/NR-5)',
      category: 'Inspeções de Segurança',
      normativeCode: 'NR-5 Item 5.3.1 · NR-15 Anexo 01',
      sourceType: 'sistema',
      companyId: 'emp-1',
      companyName: 'Indústrias Metalmecânicas Alfa Brasil S.A.',
      cnpj: '12.345.678/0001-90',
      unitId: 'unit-1-betim',
      unitName: 'Planta de Fundição & Usinagem (Betim - MG)',
      createdAt: '18/10/2026 11:20',
      updatedAt: '18/10/2026 11:20',
      content: [
        'Realizada vistoria técnica no setor de Fornos e Fundição Contínua da Unidade Betim - MG.',
        'Constatações: Identificada necessidade de reforço no enclausuramento acústico do compressor de ar da Linha 03.',
        'Plano 5W2H: Manutenção corretiva agendada para 28/10 com troca das mantas isolantes térmicas e acústicas.',
        'Documento emitido para homologação formal da CIPA Betim e gerência industrial local.'
      ],
      documentHash: 'D9088198592318B4B82C9854A2D4092E21B9FA5D9E22019A82D16279E4582AA5',
      sendSequence: 'todos_juntos',
      status: 'em_andamento',
      signers: [
        {
          id: 'sig-b1',
          name: 'Marcos Vinicius',
          email: 'marcos.vinicius@alfabrasil.com.br',
          role: 'Gerente Industrial (Betim)',
          order: 1,
          status: 'pendente',
          emailSentAt: '18/10/2026 11:20',
          emailCount: 1
        },
        {
          id: 'sig-b2',
          name: 'Fernanda Lima Ribeiro',
          email: 'fernanda.ribeiro@alfabrasil.com.br',
          role: 'Membro CIPA / Soldador TIG',
          order: 2,
          status: 'pendente',
          emailSentAt: '18/10/2026 11:20',
          emailCount: 1
        }
      ],
      auditEvents: [
        {
          id: 'aud-b1',
          timestamp: '18/10/2026 11:20:00',
          action: 'ENVELOPE_CRIADO',
          description: 'Ata de inspeção setorial gerada para a Planta de Betim.',
          actorName: 'Marcos Vinicius',
          actorEmail: 'marcos.vinicius@alfabrasil.com.br'
        }
      ]
    },
    {
      id: 'env-betim-posse',
      title: 'Termo de Posse da Comissão CIPA Betim Mandato Atual',
      category: 'Posse e Mandato',
      normativeCode: 'NR-5 Item 5.5.10',
      sourceType: 'sistema',
      companyId: 'emp-1',
      companyName: 'Indústrias Metalmecânicas Alfa Brasil S.A.',
      cnpj: '12.345.678/0001-90',
      unitId: 'unit-1-betim',
      unitName: 'Planta de Fundição & Usinagem (Betim - MG)',
      createdAt: '01/09/2026 09:30',
      updatedAt: '01/09/2026 10:45',
      content: [
        'Aos primeiro dias do mês de setembro de 2026, foram empossados os membros eleitos e indicados da CIPA da Planta Betim.',
        'Mandato oficial: Vigência 2026/2027 com garantia legal de estabilidade aos cipeiros titulares e suplentes.',
        'Compromissos firmados para a redução do índice de frequência e gravidade de acidentes de trabalho.'
      ],
      documentHash: '7AC1F5910A2B49129E992389DCB019284AC182019482810982AB198270192834',
      sendSequence: 'todos_juntos',
      status: 'concluido',
      finalHash: '9E0F1A2B3C4D5E6F5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D',
      completedAt: '01/09/2026 10:45',
      signers: [
        {
          id: 'sig-bp1',
          name: 'Marcos Vinicius',
          email: 'marcos.vinicius@alfabrasil.com.br',
          role: 'Gerente Industrial (Betim)',
          order: 1,
          status: 'assinado',
          signedAt: '01/09/2026 10:00',
          signatureType: 'padrao_cursiva',
          hash: '6F5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E',
          ipAddress: '189.40.12.90'
        },
        {
          id: 'sig-bp2',
          name: 'Diego Henrique Silveira',
          email: 'diego.silveira@alfabrasil.com.br',
          role: 'Presidente da CIPA Betim',
          order: 2,
          status: 'assinado',
          signedAt: '01/09/2026 10:45',
          signatureType: 'desenhada',
          hash: 'B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0',
          ipAddress: '189.40.12.92'
        }
      ],
      auditEvents: [
        {
          id: 'aud-bp1',
          timestamp: '01/09/2026 09:30:00',
          action: 'ENVELOPE_HOMOLOGADO',
          description: 'Termo de posse 100% assinado para a Planta Betim.',
          actorName: 'Marcos Vinicius'
        }
      ]
    },

    // =========================================================================
    // FILIAL 3: CENTRO LOGÍSTICO CAJAMAR (emp-1 · unit-1-cajamar)
    // =========================================================================
    {
      id: 'env-cajamar-logistica',
      title: 'Procedimento Operacional Padrão de Movimentação de Cargas (NR-11)',
      category: 'Procedimentos de Segurança',
      normativeCode: 'NR-11 · Armazenamento e Transporte de Materiais',
      sourceType: 'sistema',
      companyId: 'emp-1',
      companyName: 'Indústrias Metalmecânicas Alfa Brasil S.A.',
      cnpj: '12.345.678/0001-90',
      unitId: 'unit-1-cajamar',
      unitName: 'Centro Logístico e Distribuição (Cajamar - SP)',
      createdAt: '21/10/2026 16:00',
      updatedAt: '21/10/2026 16:00',
      content: [
        'Instrução formal de segurança sobre operação de empilhadeiras e transpaleteiras elétricas no armazém central.',
        'Obrigatória a inspeção de checklist diário e velocidade máxima de 10 km/h nas vias internas de expedição.',
        'Homologação com ciência do gestor da unidade e comissão da CIPA Cajamar.'
      ],
      documentHash: '4BAC901823901482019482810982AB1982701928347AC124A1B892CD97C12908',
      sendSequence: 'todos_juntos',
      status: 'em_andamento',
      signers: [
        {
          id: 'sig-c1',
          name: 'Fernanda Lima',
          email: 'fernanda.lima@alfabrasil.com.br',
          role: 'Supervisora Logística (Cajamar)',
          order: 1,
          status: 'pendente',
          emailSentAt: '21/10/2026 16:00',
          emailCount: 1
        },
        {
          id: 'sig-c2',
          name: 'Sabrina Vilela Matos',
          email: 'sabrina.matos@alfabrasil.com.br',
          role: 'Encarregada / Cipeira Cajamar',
          order: 2,
          status: 'pendente',
          emailSentAt: '21/10/2026 16:00',
          emailCount: 1
        }
      ],
      auditEvents: [
        {
          id: 'aud-c1',
          timestamp: '21/10/2026 16:00:00',
          action: 'ENVELOPE_CRIADO',
          description: 'Documento criado para o Centro Logístico Cajamar.',
          actorName: 'Fernanda Lima'
        }
      ]
    },

    // =========================================================================
    // EMPRESA 2: HOSPITAL SÃO LUCAS (emp-2 · unit-2-central)
    // =========================================================================
    {
      id: 'env-hospital-biosseguranca',
      title: 'Plano Anual de Prevenção de Riscos Biológicos NR-32',
      category: 'Biossegurança Hospitalar',
      normativeCode: 'NR-32 · Segurança e Saúde no Trabalho em Serviços de Saúde',
      sourceType: 'sistema',
      companyId: 'emp-2',
      companyName: 'Rede Hospitalar e Cuidados Médicos São Lucas S.A.',
      cnpj: '98.765.432/0001-10',
      unitId: 'unit-2-central',
      unitName: 'Hospital Geral Central (Curitiba - PR)',
      createdAt: '10/10/2026 08:30',
      updatedAt: '10/10/2026 09:15',
      content: [
        'Diretrizes obrigatórias de descarte de perfurocortantes, uso de EPIs com proteção biológica e fluxo de vacinação ocupacional.',
        'Homologação formal pelo Diretor Clínico e pela Comissão da CIPA do Hospital São Lucas.'
      ],
      documentHash: 'E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F5E6F7A8B9C0D1',
      sendSequence: 'todos_juntos',
      status: 'concluido',
      finalHash: 'F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F5E6F7A8B9C0D1E2F3A4B5C6D7E8',
      completedAt: '10/10/2026 09:15',
      signers: [
        {
          id: 'sig-h1',
          name: 'Dra. Cristina Medeiros',
          email: 'cristina.medeiros@saolucas.com.br',
          role: 'Diretora Geral',
          order: 1,
          status: 'assinado',
          signedAt: '10/10/2026 09:00',
          signatureType: 'padrao_cursiva',
          hash: 'A6B7C8D9E0F1A2B3C4D5E6F5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5',
          ipAddress: '201.55.12.44'
        },
        {
          id: 'sig-h2',
          name: 'Dr. Paulo Siqueira',
          email: 'paulo.siqueira@saolucas.com.br',
          role: 'Gestor da Unidade Central',
          order: 2,
          status: 'assinado',
          signedAt: '10/10/2026 09:15',
          signatureType: 'desenhada',
          hash: 'C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F5E6F7A8B9',
          ipAddress: '201.55.12.46'
        }
      ],
      auditEvents: [
        {
          id: 'aud-h1',
          timestamp: '10/10/2026 08:30:00',
          action: 'ENVELOPE_HOMOLOGADO',
          description: 'Documento homologado para o Hospital Geral Central.',
          actorName: 'Dra. Cristina Medeiros'
        }
      ]
    }
  ];
}

export const SignatureService = {
  // Retorna TODO o acervo sem filtros para operações internas de persistência
  getAllRawEnvelopes(): SignatureEnvelope[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler envelopes do storage:', e);
    }
    const initial = getInitialEnvelopes();
    this.saveAllEnvelopes(initial);
    return initial;
  },

  // Retorna envelopes com isolamento estrito por Empresa e por Filial
  getEnvelopes(companyId?: string, unitId?: string, companyName?: string, cnpj?: string): SignatureEnvelope[] {
    const all = this.getAllRawEnvelopes();

    return all.filter(env => {
      // 1. Isolamento por Empresa (Multiempresas)
      if (companyId) {
        const matchCompany = env.companyId === companyId || (!env.companyId && (env.cnpj === cnpj || env.companyName === companyName));
        if (!matchCompany) return false;
      } else if (cnpj) {
        if (env.cnpj !== cnpj) return false;
      }

      // 2. Isolamento por Filial (Multifiliais)
      if (unitId) {
        if (env.unitId) {
          return env.unitId === unitId;
        }
        // Legados associam-se à matriz
        return unitId === 'unit-1-matriz' || unitId.includes('matriz');
      }

      return true;
    });
  },

  saveAllEnvelopes(envelopes: SignatureEnvelope[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelopes));
    } catch (e) {
      console.warn('Erro ao salvar envelopes:', e);
    }
  },

  async createEnvelope(params: {
    title: string;
    category: string;
    normativeCode?: string;
    sourceType: 'sistema' | 'upload';
    docType?: string;
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    content: string[];
    companyId?: string;
    companyName: string;
    cnpj: string;
    unitId?: string;
    unitName?: string;
    signers: Array<{ name: string; email: string; cpf?: string; role: string }>;
    sendSequence: 'todos_juntos' | 'sequencial';
    creatorName: string;
    creatorEmail: string;
    signaturePositions?: SignatureTagPosition[];
  }): Promise<SignatureEnvelope> {
    const now = new Date().toLocaleString('pt-BR');
    const docHash = await computeSha256(params.content.join('\n\n') + params.title + params.companyName);

    const signersList: SignatureSigner[] = params.signers.map((s, idx) => ({
      id: `sig-${Date.now()}-${idx}`,
      name: s.name.trim(),
      email: s.email.toLowerCase().trim(),
      cpf: s.cpf?.trim(),
      role: s.role.trim(),
      order: idx + 1,
      status: params.sendSequence === 'sequencial' && idx > 0 ? 'aguardando_turno' : 'pendente',
      emailSentAt: params.sendSequence === 'sequencial' && idx > 0 ? undefined : now,
      emailCount: params.sendSequence === 'sequencial' && idx > 0 ? 0 : 1
    }));

    const newEnvelope: SignatureEnvelope = {
      id: `env-${Date.now()}`,
      title: params.title.trim(),
      category: params.category.trim(),
      normativeCode: params.normativeCode,
      sourceType: params.sourceType,
      docType: params.docType,
      fileName: params.fileName,
      fileUrl: params.fileUrl,
      fileType: params.fileType,
      companyId: params.companyId,
      companyName: params.companyName,
      cnpj: params.cnpj,
      unitId: params.unitId,
      unitName: params.unitName,
      createdAt: now,
      updatedAt: now,
      content: params.content,
      signers: signersList,
      sendSequence: params.sendSequence,
      status: 'em_andamento',
      documentHash: docHash,
      signaturePositions: params.signaturePositions || [],
      auditEvents: [
        {
          id: `aud-${Date.now()}-1`,
          timestamp: now,
          action: 'ENVELOPE_CRIADO',
          description: `Envelope criado por ${params.creatorName} na filial ${params.unitName || 'Principal'}.`,
          actorName: params.creatorName,
          actorEmail: params.creatorEmail
        },
        {
          id: `aud-${Date.now()}-2`,
          timestamp: now,
          action: 'NOTIFICACOES_INICIAIS',
          description: params.sendSequence === 'sequencial'
            ? `E-mail de convocação enviado para o 1º signatário da fila (${signersList[0].name}).`
            : `E-mails disparados simultaneamente para todos os ${signersList.length} signatários.`
        }
      ]
    };

    // Dispara e-mails reais via backend
    const signersToNotify = params.sendSequence === 'sequencial' ? [signersList[0]] : signersList;
    for (const signer of signersToNotify) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cipaexpert.com.br';
        const signLink = `${origin}/?envelopeId=${newEnvelope.id}&signerId=${signer.id}`;
        await ApiService.sendSignatureInvitation({
          to: signer.email,
          signerName: signer.name,
          documentTitle: newEnvelope.title,
          companyName: newEnvelope.companyName,
          signLink,
          roleDescription: signer.role
        });
      } catch (err) {
        console.warn('Erro ao disparar e-mail de convite:', err);
      }
    }

    const all = this.getAllRawEnvelopes();
    const updated = [newEnvelope, ...all];
    this.saveAllEnvelopes(updated);
    return newEnvelope;
  },

  async signDocument(
    envelopeId: string,
    signerId: string,
    signatureDetails: {
      signerName: string;
      signerCpf?: string;
      signerRole: string;
      signatureType: 'desenhada' | 'padrao_cursiva';
      signatureDataUrl: string;
      ipAddress?: string;
    }
  ): Promise<SignatureEnvelope> {
    const envelopes = this.getAllRawEnvelopes();
    const envIndex = envelopes.findIndex(e => e.id === envelopeId);
    if (envIndex === -1) {
      throw new Error('Envelope não encontrado.');
    }

    const env = { ...envelopes[envIndex] };
    const now = new Date().toLocaleString('pt-BR');
    const signerIndex = env.signers.findIndex(s => s.id === signerId);
    if (signerIndex === -1) {
      throw new Error('Signatário não encontrado neste envelope.');
    }

    const signer = { ...env.signers[signerIndex] };
    signer.status = 'assinado';
    signer.signedAt = now;
    signer.signatureType = signatureDetails.signatureType;
    signer.signatureDataUrl = signatureDetails.signatureDataUrl;
    signer.ipAddress = signatureDetails.ipAddress || '189.40.12.88';
    signer.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser';

    const textToHash = `${env.id}|${signer.id}|${signer.name}|${signer.email}|${now}|${env.documentHash}`;
    signer.hash = await computeSha256(textToHash);
    env.signers[signerIndex] = signer;

    env.auditEvents.push({
      id: `aud-${Date.now()}-signed`,
      timestamp: now,
      action: 'ASSINATURA_REGISTRADA',
      description: `${signer.name} assinou digitalmente com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).`,
      actorName: signer.name,
      actorEmail: signer.email,
      ipAddress: signer.ipAddress,
      hash: signer.hash
    });

    // Se fluxo for sequencial, acorda o próximo
    if (env.sendSequence === 'sequencial') {
      const nextSignerIndex = env.signers.findIndex(s => s.status === 'aguardando_turno');
      if (nextSignerIndex !== -1) {
        env.signers[nextSignerIndex].status = 'pendente';
        env.signers[nextSignerIndex].emailSentAt = now;
        env.signers[nextSignerIndex].emailCount = 1;

        env.auditEvents.push({
          id: `aud-${Date.now()}-next`,
          timestamp: now,
          action: 'NOTIFICACAO_SEQUENCIAL',
          description: `Turno avançado para ${env.signers[nextSignerIndex].name} (${env.signers[nextSignerIndex].email}).`,
          actorEmail: env.signers[nextSignerIndex].email
        });

        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cipaexpert.com.br';
          const nextSignLink = `${origin}/?envelopeId=${env.id}&signerId=${env.signers[nextSignerIndex].id}`;
          await ApiService.sendSignatureInvitation({
            to: env.signers[nextSignerIndex].email,
            signerName: env.signers[nextSignerIndex].name,
            documentTitle: env.title,
            companyName: env.companyName,
            signLink: nextSignLink,
            roleDescription: env.signers[nextSignerIndex].role
          });
        } catch (err) {
          console.warn('Erro ao notificar próximo signatário sequencial:', err);
        }
      }
    }

    // Verifica se todos assinaram
    const pendingSigners = env.signers.filter(s => s.status !== 'assinado');
    if (pendingSigners.length === 0) {
      env.status = 'concluido';
      env.completedAt = now;
      const allHashes = env.signers.map(s => s.hash).join('-') + env.documentHash;
      env.finalHash = await computeSha256(allHashes);

      env.auditEvents.push({
        id: `aud-${Date.now()}-done`,
        timestamp: now,
        action: 'ENVELOPE_HOMOLOGADO',
        description: `Todas as ${env.signers.length} assinaturas foram devidamente coletadas. Documento final 100% homologado.`,
        hash: env.finalHash
      });
    }

    env.updatedAt = now;
    envelopes[envIndex] = env;
    this.saveAllEnvelopes(envelopes);
    return env;
  },

  async resendInvitation(envelopeId: string, signerId?: string): Promise<{ success: boolean; count: number; message: string }> {
    const envelopes = this.getAllRawEnvelopes();
    const envIndex = envelopes.findIndex(e => e.id === envelopeId);
    if (envIndex === -1) {
      throw new Error('Envelope não encontrado.');
    }

    const env = { ...envelopes[envIndex] };
    const now = new Date().toLocaleString('pt-BR');
    let targetSigners = env.signers.filter(s => s.status === 'pendente');

    if (signerId) {
      targetSigners = targetSigners.filter(s => s.id === signerId);
    }

    if (targetSigners.length === 0) {
      return {
        success: false,
        count: 0,
        message: 'Nenhum signatário pendente disponível para reenvio no momento.'
      };
    }

    let sentCount = 0;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cipaexpert.com.br';

    for (const signer of targetSigners) {
      try {
        const signLink = `${origin}/?envelopeId=${env.id}&signerId=${signer.id}`;
        await ApiService.sendSignatureInvitation({
          to: signer.email,
          signerName: signer.name,
          documentTitle: env.title,
          companyName: env.companyName,
          signLink,
          roleDescription: signer.role,
          isReminder: true
        });

        signer.emailSentAt = now;
        signer.emailCount = (signer.emailCount || 1) + 1;
        sentCount++;
      } catch (err) {
        console.warn('Erro ao reenviar convite:', err);
      }
    }

    env.auditEvents.push({
      id: `aud-${Date.now()}-resend`,
      timestamp: now,
      action: 'LEMBRETE_REENVIADO',
      description: `Lembrete de assinatura reenviado para ${sentCount} signatário(s) pendente(s).`
    });

    env.updatedAt = now;
    envelopes[envIndex] = env;
    this.saveAllEnvelopes(envelopes);

    return {
      success: true,
      count: sentCount,
      message: sentCount === 1 
        ? `Lembrete reenviado com sucesso para ${targetSigners[0].name} (${targetSigners[0].email})!`
        : `Lembretes reenviados com sucesso para todos os ${sentCount} signatários pendentes!`
    };
  },

  updateEnvelopeSigners(envelopeId: string, updatedSigners: SignatureSigner[]): SignatureEnvelope {
    const envelopes = this.getAllRawEnvelopes();
    const index = envelopes.findIndex(e => e.id === envelopeId);
    if (index === -1) {
      throw new Error('Envelope não encontrado.');
    }
    const env = { ...envelopes[index] };
    if (env.status === 'concluido') {
      throw new Error('Documentos 100% assinados possuem fé pública e não podem ser alterados.');
    }

    // Preservar integridade: quem já assinou não pode ser removido
    const alreadySigned = env.signers.filter(s => s.status === 'assinado');
    for (const signed of alreadySigned) {
      const existsInUpdated = updatedSigners.some(u => u.id === signed.id);
      if (!existsInUpdated) {
        throw new Error(`O signatário ${signed.name} já assinou o documento e não pode ser removido.`);
      }
    }

    env.signers = updatedSigners;
    env.updatedAt = new Date().toLocaleString('pt-BR');
    env.auditEvents.push({
      id: `aud-${Date.now()}-edit-signers`,
      timestamp: env.updatedAt,
      action: 'SIGNATARIOS_ATUALIZADOS',
      description: `Lista de signatários atualizada. Total: ${updatedSigners.length} signatário(s).`
    });

    envelopes[index] = env;
    this.saveAllEnvelopes(envelopes);
    return env;
  },

  updateSignaturePositions(envelopeId: string, positions: SignatureTagPosition[]): boolean {
    const envelopes = this.getAllRawEnvelopes();
    const index = envelopes.findIndex(e => e.id === envelopeId);
    if (index === -1) return false;
    envelopes[index].signaturePositions = positions;
    envelopes[index].updatedAt = new Date().toLocaleString('pt-BR');
    this.saveAllEnvelopes(envelopes);
    return true;
  },

  deleteEnvelope(envelopeId: string): void {
    const envelopes = this.getAllRawEnvelopes();
    const env = envelopes.find(e => e.id === envelopeId);
    if (env && env.status === 'concluido') {
      throw new Error('Documentos 100% assinados possuem fé pública e não podem ser excluídos.');
    }
    const filtered = envelopes.filter(e => e.id !== envelopeId);
    this.saveAllEnvelopes(filtered);
  }
};
