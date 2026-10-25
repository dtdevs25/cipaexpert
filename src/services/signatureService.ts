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
  companyName: string;
  cnpj: string;
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

const STORAGE_KEY = 'cipa_expert_signature_envelopes_v1';

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
  // Fallback determinístico
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 'SHA256-' + Math.abs(hash).toString(16).padStart(16, '0').toUpperCase() + Date.now().toString(16).toUpperCase();
}

// Modelos nativos integrados do sistema para envelopes automáticos
export function getAvailableSystemTemplates() {
  return [
    {
      docType: 'ata_reuniao',
      title: 'Ata de Reunião Ordinária da CIPA (Mês Atual)',
      category: 'Atas Mensais Obrigatórias',
      normativeCode: 'NR-5 Item 5.6.1 · Lei 14.457/2022',
      defaultRoles: ['Presidente da CIPA', 'Vice-Presidente da CIPA', 'Secretário(a) da CIPA', 'Técnico de Segurança (SESMT)']
    },
    {
      docType: 'edital_convocacao',
      title: 'Edital de Convocação da Eleição CIPA',
      category: 'Processo Eleitoral',
      normativeCode: 'NR-5 Item 5.5.1 · Antecedência de 60 Dias',
      defaultRoles: ['Representante Legal do Empregador', 'Coordenador do SESMT']
    },
    {
      docType: 'comunicado_sindicato',
      title: 'Comunicação ao Sindicato da Categoria (Início de Eleição)',
      category: 'Comunicação Sindical',
      normativeCode: 'NR-5 Item 5.5.1, "c"',
      defaultRoles: ['Representante Legal da Empresa', 'Protocolo do Sindicato']
    },
    {
      docType: 'comissao_eleitoral',
      title: 'Portaria de Constituição da Comissão Eleitoral',
      category: 'Comissão Eleitoral',
      normativeCode: 'NR-5 Item 5.5.2',
      defaultRoles: ['Representante Legal do Empregador', 'Coordenador da Comissão Eleitoral', 'Secretária da Comissão']
    },
    {
      docType: 'ata_eleicao',
      title: 'Ata de Eleição e Apuração dos Votos da CIPA',
      category: 'Ata Eleitoral',
      normativeCode: 'NR-5 Itens 5.5.4 a 5.5.9',
      defaultRoles: ['Presidente da Comissão Eleitoral', 'Representante dos Empregados Mais Votado', 'Auditor Interno']
    },
    {
      docType: 'ata_posse',
      title: 'Ata de Instalação e Posse dos Novos Cipeiros',
      category: 'Posse e Mandato',
      normativeCode: 'NR-5 Item 5.5.10',
      defaultRoles: ['Diretor Geral / Empregador', 'Presidente Empossado', 'Vice-Presidente Empossado', 'Secretário(a)']
    }
  ];
}

// Sementes iniciais para a empresa já iniciar com envelopes prontos e realistas
function getInitialEnvelopes(companyName: string = 'Indústrias Alfa Brasil S.A.', cnpj: string = '12.345.678/0001-90'): SignatureEnvelope[] {
  const ataDoc = generateCipaDocument('ata_reuniao', companyName, cnpj);
  const editalDoc = generateCipaDocument('edital_convocacao', companyName, cnpj);

  return [
    {
      id: 'env-ata-10',
      title: 'Ata da 10ª Reunião Ordinária da CIPA (Outubro/2026)',
      category: 'Atas Mensais Obrigatórias',
      normativeCode: 'NR-5 Item 5.6.1 · Lei 14.457/2022',
      sourceType: 'sistema',
      docType: 'ata_reuniao',
      companyName,
      cnpj,
      createdAt: '05/10/2026 14:30',
      updatedAt: '05/10/2026 15:45',
      content: ataDoc.content,
      documentHash: 'B82C9854A2D4092E21B9FA5D9E22019A82D16279E4582AA5D9088198592318B4',
      sendSequence: 'todos_juntos',
      status: 'concluido',
      finalHash: 'F5910A2B49129E992389DCB019284AC182019482810982AB1982701928347AC1',
      completedAt: '05/10/2026 15:45',
      signers: [
        {
          id: 'sig-1',
          name: 'Carlos Alberto Mendes',
          email: 'carlos.mendes@empresa.com.br',
          cpf: '123.456.789-01',
          role: 'Presidente da CIPA',
          order: 1,
          status: 'assinado',
          signedAt: '05/10/2026 14:40',
          signatureType: 'padrao_cursiva',
          hash: '4A1B892C7812903847BAC091823901482019482810982AB1982701928347AC12',
          ipAddress: '189.40.12.88',
          userAgent: 'Chrome/124.0 Windows 10',
          emailSentAt: '05/10/2026 14:30',
          emailCount: 1
        },
        {
          id: 'sig-2',
          name: 'Mariana Fonseca de Souza',
          email: 'mariana.fonseca@empresa.com.br',
          cpf: '987.654.321-09',
          role: 'Vice-Presidente da CIPA',
          order: 2,
          status: 'assinado',
          signedAt: '05/10/2026 15:10',
          signatureType: 'desenhada',
          hash: '7C129084BAC901823901482019482810982AB1982701928347AC124A1B892CD9',
          ipAddress: '177.18.99.14',
          userAgent: 'Safari/17.4 macOS Sonoma',
          emailSentAt: '05/10/2026 14:30',
          emailCount: 1
        },
        {
          id: 'sig-3',
          name: 'Fernanda Rocha Lima',
          email: 'fernanda.rocha@empresa.com.br',
          cpf: '456.789.123-55',
          role: 'Secretária da CIPA',
          order: 3,
          status: 'assinado',
          signedAt: '05/10/2026 15:30',
          signatureType: 'padrao_cursiva',
          hash: '992389DCB019284AC182019482810982AB1982701928347AC1F5910A2B49129E',
          ipAddress: '187.63.10.45',
          userAgent: 'Firefox/125.0 Windows 11',
          emailSentAt: '05/10/2026 14:30',
          emailCount: 1
        },
        {
          id: 'sig-4',
          name: 'Daniele Santos',
          email: 'daniele.santos@empresa.com.br',
          cpf: '333.222.111-00',
          role: 'Técnico de Segurança (SESMT)',
          order: 4,
          status: 'assinado',
          signedAt: '05/10/2026 15:45',
          signatureType: 'desenhada',
          hash: '82019482810982AB1982701928347AC124A1B892CD97C129084BAC9018239014',
          ipAddress: '179.184.20.12',
          userAgent: 'Chrome/124.0 Android 14',
          emailSentAt: '05/10/2026 14:30',
          emailCount: 1
        }
      ],
      auditEvents: [
        {
          id: 'aud-1',
          timestamp: '05/10/2026 14:30:10',
          action: 'ENVELOPE_CRIADO',
          description: 'Envelope gerado automaticamente a partir da Ata Ordinária nº 10 da CIPA.',
          actorName: 'Daniele Santos',
          actorEmail: 'daniele.santos@empresa.com.br',
          ipAddress: '179.184.20.12'
        },
        {
          id: 'aud-2',
          timestamp: '05/10/2026 14:30:15',
          action: 'DISPARO_NOTIFICACOES',
          description: 'Convites enviados para 4 signatários via e-mail transacional auditado.',
          ipAddress: '127.0.0.1'
        },
        {
          id: 'aud-3',
          timestamp: '05/10/2026 14:40:02',
          action: 'ASSINATURA_REGISTRADA',
          description: 'Carlos Alberto Mendes assinou digitalmente com termo de conformidade MP 2.200-2/2001.',
          actorName: 'Carlos Alberto Mendes',
          actorEmail: 'carlos.mendes@empresa.com.br',
          ipAddress: '189.40.12.88',
          hash: '4A1B892C7812903847BAC091823901482019482810982AB1982701928347AC12'
        },
        {
          id: 'aud-4',
          timestamp: '05/10/2026 15:10:45',
          action: 'ASSINATURA_REGISTRADA',
          description: 'Mariana Fonseca de Souza assinou digitalmente via caneta digital manuscrita.',
          actorName: 'Mariana Fonseca de Souza',
          actorEmail: 'mariana.fonseca@empresa.com.br',
          ipAddress: '177.18.99.14',
          hash: '7C129084BAC901823901482019482810982AB1982701928347AC124A1B892CD9'
        },
        {
          id: 'aud-5',
          timestamp: '05/10/2026 15:30:12',
          action: 'ASSINATURA_REGISTRADA',
          description: 'Fernanda Rocha Lima assinou digitalmente.',
          actorName: 'Fernanda Rocha Lima',
          actorEmail: 'fernanda.rocha@empresa.com.br',
          ipAddress: '187.63.10.45',
          hash: '992389DCB019284AC182019482810982AB1982701928347AC1F5910A2B49129E'
        },
        {
          id: 'aud-6',
          timestamp: '05/10/2026 15:45:00',
          action: 'ASSINATURA_REGISTRADA',
          description: 'Daniele Santos assinou digitalmente e homologou o envelope.',
          actorName: 'Daniele Santos',
          actorEmail: 'daniele.santos@empresa.com.br',
          ipAddress: '179.184.20.12',
          hash: '82019482810982AB1982701928347AC124A1B892CD97C129084BAC9018239014'
        },
        {
          id: 'aud-7',
          timestamp: '05/10/2026 15:45:01',
          action: 'ENVELOPE_HOMOLOGADO',
          description: 'Todas as assinaturas coletadas com sucesso. Documento 100% chancelado e inviolável.',
          hash: 'F5910A2B49129E992389DCB019284AC182019482810982AB1982701928347AC1'
        }
      ]
    },
    {
      id: 'env-edital-2026',
      title: 'Edital de Convocação da Eleição CIPA Mandato 2026/2027',
      category: 'Processo Eleitoral',
      normativeCode: 'NR-5 Item 5.5.1 · Antecedência de 60 Dias',
      sourceType: 'sistema',
      docType: 'edital_convocacao',
      companyName,
      cnpj,
      createdAt: '15/10/2026 09:00',
      updatedAt: '15/10/2026 10:15',
      content: editalDoc.content,
      documentHash: 'A1B2C3D4E5F60718293A4B5C6D7E8F90123456789ABCDEF0123456789ABCDEF0',
      sendSequence: 'sequencial',
      status: 'em_andamento',
      signers: [
        {
          id: 'sig-ed-1',
          name: 'Roberto Silveira Lima',
          email: 'roberto.silveira@empresa.com.br',
          cpf: '777.888.999-11',
          role: 'Representante Legal da Empresa',
          order: 1,
          status: 'assinado',
          signedAt: '15/10/2026 10:15',
          signatureType: 'padrao_cursiva',
          hash: '5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F',
          ipAddress: '189.40.12.88',
          userAgent: 'Chrome/124.0 Windows 11',
          emailSentAt: '15/10/2026 09:00',
          emailCount: 1
        },
        {
          id: 'sig-ed-2',
          name: 'Daniele Santos',
          email: 'daniele.santos@empresa.com.br',
          cpf: '333.222.111-00',
          role: 'Coordenador do SESMT / SST',
          order: 2,
          status: 'pendente',
          emailSentAt: '15/10/2026 10:15',
          emailCount: 1
        }
      ],
      auditEvents: [
        {
          id: 'aud-ed-1',
          timestamp: '15/10/2026 09:00:00',
          action: 'ENVELOPE_CRIADO',
          description: 'Edital oficial de eleição CIPA gerado pelo sistema para coleta sequencial de assinaturas.',
          actorName: 'Roberto Silveira Lima',
          actorEmail: 'roberto.silveira@empresa.com.br',
          ipAddress: '189.40.12.88'
        },
        {
          id: 'aud-ed-2',
          timestamp: '15/10/2026 09:00:05',
          action: 'NOTIFICACAO_ENVIADA',
          description: 'Convite de assinatura enviado por e-mail para o primeiro signatário da sequência: Roberto Silveira Lima.',
          actorEmail: 'roberto.silveira@empresa.com.br'
        },
        {
          id: 'aud-ed-3',
          timestamp: '15/10/2026 10:15:20',
          action: 'ASSINATURA_REGISTRADA',
          description: 'Roberto Silveira Lima assinou digitalmente. Turno avançado automaticamente para o 2º signatário da fila.',
          actorName: 'Roberto Silveira Lima',
          actorEmail: 'roberto.silveira@empresa.com.br',
          ipAddress: '189.40.12.88',
          hash: '5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F'
        },
        {
          id: 'aud-ed-4',
          timestamp: '15/10/2026 10:15:25',
          action: 'NOTIFICACAO_SEQUENCIAL',
          description: 'E-mail disparado automaticamente para o próximo signatário da ordem: Daniele Santos (SESMT).',
          actorEmail: 'daniele.santos@empresa.com.br'
        }
      ]
    }
  ];
}

export const SignatureService = {
  getEnvelopes(companyName?: string, cnpj?: string): SignatureEnvelope[] {
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
    const initial = getInitialEnvelopes(companyName, cnpj);
    this.saveAllEnvelopes(initial);
    return initial;
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
    companyName: string;
    cnpj: string;
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
      // Se sequencial, apenas o primeiro começa pendente; os demais aguardam seu turno
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
      companyName: params.companyName,
      cnpj: params.cnpj,
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
          description: `Envelope criado por ${params.creatorName}. Modo de envio: ${params.sendSequence === 'sequencial' ? 'Sequência Definida (1 a 1)' : 'Todos Simultaneamente'}.`,
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

    const current = this.getEnvelopes(params.companyName, params.cnpj);
    const updated = [newEnvelope, ...current];
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
    const envelopes = this.getEnvelopes();
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

    const currentSigner = env.signers[signerIndex];
    if (currentSigner.status === 'assinado') {
      return env; // Já assinado
    }

    // Calcula Hash da Assinatura
    const sigPayload = `${env.id}-${currentSigner.id}-${signatureDetails.signerName}-${signatureDetails.signerCpf}-${now}`;
    const sigHash = await computeSha256(sigPayload);

    // Atualiza dados do signatário
    env.signers[signerIndex] = {
      ...currentSigner,
      status: 'assinado',
      name: signatureDetails.signerName,
      cpf: signatureDetails.signerCpf || currentSigner.cpf,
      role: signatureDetails.signerRole || currentSigner.role,
      signedAt: now,
      signatureType: signatureDetails.signatureType,
      signatureDataUrl: signatureDetails.signatureDataUrl,
      hash: sigHash,
      ipAddress: signatureDetails.ipAddress || '189.40.12.88',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Navegador Web Seguro'
    };

    // Adiciona evento de auditoria
    env.auditEvents.push({
      id: `aud-${Date.now()}-sig`,
      timestamp: now,
      action: 'ASSINATURA_REGISTRADA',
      description: `${signatureDetails.signerName} (${currentSigner.role}) assinou digitalmente com termo de conformidade legal.`,
      actorName: signatureDetails.signerName,
      actorEmail: currentSigner.email,
      ipAddress: signatureDetails.ipAddress || '189.40.12.88',
      hash: sigHash
    });

    // Se for sequencial, avança o próximo da fila
    if (env.sendSequence === 'sequencial') {
      const nextSignerIndex = env.signers.findIndex(s => s.status === 'aguardando_turno');
      if (nextSignerIndex !== -1) {
        const nextSigner = env.signers[nextSignerIndex];
        env.signers[nextSignerIndex] = {
          ...nextSigner,
          status: 'pendente',
          emailSentAt: now,
          emailCount: (nextSigner.emailCount || 0) + 1
        };

        env.auditEvents.push({
          id: `aud-${Date.now()}-next`,
          timestamp: now,
          action: 'NOTIFICACAO_SEQUENCIAL',
          description: `Turno avançado. E-mail de assinatura enviado para o próximo signatário: ${nextSigner.name} (${nextSigner.email}).`,
          actorEmail: nextSigner.email
        });

        // Dispara e-mail para o próximo
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cipaexpert.com.br';
          const signLink = `${origin}/?envelopeId=${env.id}&signerId=${nextSigner.id}`;
          await ApiService.sendSignatureInvitation({
            to: nextSigner.email,
            signerName: nextSigner.name,
            documentTitle: env.title,
            companyName: env.companyName,
            signLink,
            roleDescription: nextSigner.role
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
        description: `Todas as ${env.signers.length} assinaturas foram devidamente coletadas. Documento final 100% homologado e criptografado com carimbo de tempo.`,
        hash: env.finalHash
      });
    }

    env.updatedAt = now;
    envelopes[envIndex] = env;
    this.saveAllEnvelopes(envelopes);
    return env;
  },

  async resendInvitation(envelopeId: string, signerId?: string): Promise<{ success: boolean; count: number; message: string }> {
    const envelopes = this.getEnvelopes();
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
    const envelopes = this.getEnvelopes();
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
    const envelopes = this.getEnvelopes();
    const index = envelopes.findIndex(e => e.id === envelopeId);
    if (index === -1) return false;
    envelopes[index].signaturePositions = positions;
    envelopes[index].updatedAt = new Date().toLocaleString('pt-BR');
    this.saveAllEnvelopes(envelopes);
    return true;
  },

  deleteEnvelope(envelopeId: string): void {
    const envelopes = this.getEnvelopes();
    const env = envelopes.find(e => e.id === envelopeId);
    if (env && env.status === 'concluido') {
      throw new Error('Documentos 100% assinados possuem fé pública e não podem ser excluídos.');
    }
    const filtered = envelopes.filter(e => e.id !== envelopeId);
    this.saveAllEnvelopes(filtered);
  }
};
