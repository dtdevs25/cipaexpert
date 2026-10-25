import React, { useState, useRef } from 'react';
import { 
  X, 
  Send, 
  FileText, 
  Upload, 
  Users, 
  Plus, 
  Trash2, 
  ArrowUpDown, 
  CheckCircle2, 
  Shield, 
  Sparkles,
  Info,
  Clock,
  Layers,
  ArrowRight,
  ArrowLeft,
  PenTool,
  MapPin
} from 'lucide-react';
import { 
  SignatureService, 
  getAvailableSystemTemplates, 
  SignatureEnvelope,
  SignatureTagPosition
} from '../../services/signatureService';
import { generateCipaDocument } from '../../data/documentTemplates';
import { ApiService } from '../../services/apiService';
import { SignaturePlacementEditor } from './SignaturePlacementEditor';

interface NewEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  cnpj: string;
  creatorName: string;
  creatorEmail: string;
  onEnvelopeCreated: (envelope: SignatureEnvelope) => void;
}

export const NewEnvelopeModal: React.FC<NewEnvelopeModalProps> = ({
  isOpen,
  onClose,
  companyName,
  cnpj,
  creatorName,
  creatorEmail,
  onEnvelopeCreated
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Etapa Atual do Wizard (1: Documento, 2: Signatários, 3: Posicionar Assinaturas)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [sourceType, setSourceType] = useState<'sistema' | 'upload'>('sistema');
  const [selectedTemplateDocType, setSelectedTemplateDocType] = useState('ata_reuniao');
  
  // Dados do Documento
  const [title, setTitle] = useState('Ata da Reunião Mensal Ordinária da CIPA');
  const [category, setCategory] = useState('Atas Mensais Obrigatórias');
  const [normativeCode, setNormativeCode] = useState('NR-5 Item 5.6.1 · Lei 14.457/2022');
  const [documentContent, setDocumentContent] = useState<string[]>([]);
  
  // Upload state
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Sequência e Signatários
  const [sendSequence, setSendSequence] = useState<'todos_juntos' | 'sequencial'>('todos_juntos');
  const [signers, setSigners] = useState<Array<{ name: string; email: string; cpf?: string; role: string }>>([
    { name: 'Carlos Alberto Mendes', email: 'carlos.mendes@empresa.com.br', cpf: '123.456.789-01', role: 'Presidente da CIPA' },
    { name: 'Mariana Fonseca de Souza', email: 'mariana.fonseca@empresa.com.br', cpf: '987.654.321-09', role: 'Vice-Presidente da CIPA' },
    { name: 'Fernanda Rocha Lima', email: 'fernanda.rocha@empresa.com.br', cpf: '456.789.123-55', role: 'Secretária da CIPA' }
  ]);

  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [newSignerRole, setNewSignerRole] = useState('Membro da CIPA');
  const [newSignerCpf, setNewSignerCpf] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Posições das Assinaturas no Documento (Estilo DocuSign / D4Sign)
  const [signaturePositions, setSignaturePositions] = useState<SignatureTagPosition[]>([]);

  const systemTemplates = getAvailableSystemTemplates();

  // Quando escolhe um template do sistema, preenche automaticamente os dados e signatários sugeridos
  const handleSelectTemplate = (docType: string) => {
    setSelectedTemplateDocType(docType);
    const tmpl = systemTemplates.find(t => t.docType === docType);
    if (tmpl) {
      setTitle(tmpl.title);
      setCategory(tmpl.category);
      setNormativeCode(tmpl.normativeCode);
      const generated = generateCipaDocument(docType, companyName, cnpj);
      setDocumentContent(generated.content);

      // Preenche os signatários sugeridos pelo template
      const suggestedSigners = tmpl.defaultRoles.map((role, idx) => ({
        name: idx === 0 ? 'Carlos Alberto Mendes' : idx === 1 ? 'Mariana Fonseca' : `Signatário ${idx + 1}`,
        email: idx === 0 ? 'carlos.mendes@empresa.com.br' : idx === 1 ? 'mariana.fonseca@empresa.com.br' : `signatario${idx + 1}@empresa.com.br`,
        role
      }));
      setSigners(suggestedSigners);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadedFileName(file.name);
    setTitle(`Documento: ${file.name.replace(/\.[^/.]+$/, '')}`);
    setCategory('Documento Externo Anexado');
    setNormativeCode('Gestão Documental CIPA');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const uploadRes = await ApiService.uploadPhotoToMinio(dataUrl, file.name, file.type, 'usuarios');
        setUploadedFileUrl(uploadRes.url || dataUrl);
      } catch {
        setUploadedFileUrl(dataUrl);
      }
      setDocumentContent([
        `Documento oficial enviado para coleta de assinaturas digitais: ${file.name}`,
        `Tamanho do arquivo: ${(file.size / 1024).toFixed(1)} KB`,
        `Este documento possui integridade criptográfica SHA-256 e foi protocolado no CIPA Expert.`
      ]);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSigner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignerName.trim() || !newSignerEmail.trim()) return;

    setSigners([
      ...signers,
      {
        name: newSignerName.trim(),
        email: newSignerEmail.toLowerCase().trim(),
        role: newSignerRole.trim() || 'Signatário',
        cpf: newSignerCpf.trim()
      }
    ]);

    setNewSignerName('');
    setNewSignerEmail('');
    setNewSignerCpf('');
  };

  const handleRemoveSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const handleMoveSigner = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= signers.length) return;
    const copy = [...signers];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSigners(copy);
  };

  // Garante posições default ao avançar para a etapa 3 de posicionamento
  const handleProceedToPlacement = () => {
    if (signers.length === 0) {
      alert('Adicione ao menos um signatário antes de prosseguir.');
      return;
    }

    if (signaturePositions.length === 0) {
      // Auto-distribui campos no rodapé
      const defaultPositions: SignatureTagPosition[] = signers.map((s, idx) => ({
        id: `tag-default-${idx}`,
        signerEmail: s.email,
        signerName: s.name,
        type: 'assinatura',
        page: 1,
        posX: idx % 2 === 0 ? 15 : 55,
        posY: idx >= 2 ? 88 : 78
      }));
      setSignaturePositions(defaultPositions);
    }

    setCurrentStep(3);
  };

  const handleSubmitEnvelope = async () => {
    if (signers.length === 0) {
      alert('Adicione pelo menos um signatário para o envelope.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalContent = documentContent.length > 0 
        ? documentContent 
        : generateCipaDocument(selectedTemplateDocType, companyName, cnpj).content;

      const created = await SignatureService.createEnvelope({
        title,
        category,
        normativeCode,
        sourceType,
        docType: sourceType === 'sistema' ? selectedTemplateDocType : undefined,
        fileName: uploadedFileName || undefined,
        fileUrl: uploadedFileUrl || undefined,
        content: finalContent,
        companyName,
        cnpj,
        signers,
        sendSequence,
        creatorName,
        creatorEmail,
        signaturePositions
      });

      onEnvelopeCreated(created);
      onClose();
    } catch (err: any) {
      alert(`Erro ao criar envelope: ${err.message || 'Falha ao processar.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`bg-white rounded-3xl shadow-2xl border border-slate-200 w-full ${currentStep === 3 ? 'max-w-5xl' : 'max-w-2xl'} overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh] transition-all`}>
        
        {/* Header Verde Padronizado */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center ring-1 ring-emerald-200 shadow-2xs">
              <Send className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                Novo Envelope de Assinaturas Digitais (Estilo DocuSign & D4Sign)
              </h3>
              <p className="text-[11px] text-slate-600 font-mono">
                {currentStep === 1 && 'Etapa 1 de 3: Seleção e integração de documentos'}
                {currentStep === 2 && 'Etapa 2 de 3: Definição dos signatários e ordem de envio'}
                {currentStep === 3 && 'Etapa 3 de 3: Posicionamento visual das assinaturas no documento'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Wizard Bar (Padrão DocuSign) */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 w-full max-w-lg">
            
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                currentStep === 1 ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 1 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                1
              </span>
              <span>Documento</span>
            </button>

            <span className="text-slate-300">/</span>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                currentStep === 2 ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 2 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                2
              </span>
              <span>Signatários & Envio</span>
            </button>

            <span className="text-slate-300">/</span>

            {/* Step 3 */}
            <button
              type="button"
              onClick={handleProceedToPlacement}
              className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                currentStep === 3 ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 3 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                3
              </span>
              <span className="flex items-center gap-1">
                <span>Posicionar Assinaturas</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-mono">D4Sign</span>
              </span>
            </button>

          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Passo {currentStep} de 3
          </span>
        </div>

        {/* Form Body com Etapas */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 [scrollbar-width:thin]">
          
          {/* ========================================================================= */}
          {/* ETAPA 1: DOCUMENTO */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  1. Selecionar Documento a ser Assinado
                </span>

                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSourceType('sistema')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      sourceType === 'sistema'
                        ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Documento do Sistema CIPA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('upload')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      sourceType === 'upload'
                        ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fazer Upload de Arquivo</span>
                  </button>
                </div>
              </div>

              {/* OPÇÃO A: DOCUMENTO NATIVO DO SISTEMA CIPA */}
              {sourceType === 'sistema' ? (
                <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Modelos Oficiais do Sistema CIPA Expert (Sem necessidade de upload)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {systemTemplates.map((t) => (
                      <button
                        key={t.docType}
                        type="button"
                        onClick={() => handleSelectTemplate(t.docType)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedTemplateDocType === t.docType
                            ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-200 text-emerald-950'
                            : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
                        }`}
                      >
                        <p className="font-bold text-xs leading-tight mb-1">{t.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{t.category}</p>
                        <p className="text-[10px] text-emerald-700 mt-1 font-medium">{t.defaultRoles.join(', ')}</p>
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-[11px] text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800">{title}</div>
                    <p className="text-slate-500 font-mono">Normativa: {normativeCode}</p>
                    <p className="text-emerald-700 font-medium">Os signatários e cargos recomendados pela NR-5 serão pré-configurados automaticamente na próxima etapa.</p>
                  </div>
                </div>
              ) : (
                /* OPÇÃO B: UPLOAD DE ARQUIVOS EXTERNOS */
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload de Arquivo Externo (PDF, DOCX, TXT ou Imagem)</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-2xl p-6 text-center transition-colors cursor-pointer space-y-2"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-800">
                      {isUploading ? 'Processando e enviando para o MinIO...' : uploadedFileName ? `Arquivo: ${uploadedFileName}` : 'Clique aqui para selecionar seu arquivo'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Formatos aceitos: PDF, DOCX, DOC, TXT, PNG, JPG (Armazenamento seguro MinIO e hash SHA-256)
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">Título do Envelope</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Contrato de Prestação de Serviços SST"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2: SIGNATÁRIOS & SEQUÊNCIA */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Modo de Envio: Todos ao mesmo tempo ou Sequencial */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Ordem e Modo de Assinatura
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendSequence('todos_juntos')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      sendSequence === 'todos_juntos'
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-xs ring-2 ring-emerald-200 text-emerald-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Todos ao Mesmo Tempo (Paralelo)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Dispara e-mail para todos os signatários simultaneamente. Quem assinar primeiro já computa no envelope.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSendSequence('sequencial')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      sendSequence === 'sequencial'
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-xs ring-2 ring-emerald-200 text-emerald-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Sequência de Assinatura (1 a 1)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      O 2º só recebe o convite após o 1º assinar, garantindo estrita hierarquia de validação.
                    </p>
                  </button>
                </div>
              </div>

              {/* Lista de Signatários Configurados */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Signatários do Envelope ({signers.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {sendSequence === 'sequencial' ? 'Ordem de cima para baixo' : 'Envio simultâneo'}
                  </span>
                </div>

                <div className="space-y-2">
                  {signers.map((s, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 font-mono">
                          {idx + 1}º
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{s.name}</p>
                          <p className="text-[11px] text-slate-600 font-mono">{s.email}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">{s.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {sendSequence === 'sequencial' && (
                          <div className="flex flex-col mr-1">
                            <button
                              type="button"
                              onClick={() => handleMoveSigner(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                              title="Subir na fila"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSigner(idx, 'down')}
                              disabled={idx === signers.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                              title="Descer na fila"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSigner(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remover signatário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adicionar Novo Signatário */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Adicionar Outro Signatário
                </span>
                
                <form onSubmit={handleAddSigner} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome Completo *"
                      value={newSignerName}
                      onChange={(e) => setNewSignerName(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="email"
                      placeholder="E-mail Corporativo *"
                      value={newSignerEmail}
                      onChange={(e) => setNewSignerEmail(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Função / Cargo (ex: Cipeiro Titular)"
                      value={newSignerRole}
                      onChange={(e) => setNewSignerRole(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="CPF (opcional)"
                      value={newSignerCpf}
                      onChange={(e) => setNewSignerCpf(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!newSignerName.trim() || !newSignerEmail.trim()}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Incluir Signatário</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 3: POSICIONAMENTO DAS ASSINATURAS NO DOCUMENTO (DOCUSIGN / D4SIGN) */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Onde cada pessoa assina no documento</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Clique na folha para adicionar a tag do signatário selecionado, ou use o botão rápido de distribuir no rodapé.
                  </p>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  {signaturePositions.length} campo(s) marcado(s)
                </span>
              </div>

              {/* Editor Visual de Posicionamento */}
              <SignaturePlacementEditor
                documentTitle={title}
                documentContent={
                  documentContent.length > 0 
                    ? documentContent 
                    : generateCipaDocument(selectedTemplateDocType, companyName, cnpj).content
                }
                companyName={companyName}
                cnpj={cnpj}
                normativeCode={normativeCode}
                signers={signers.map(s => ({ name: s.name, email: s.email, role: s.role }))}
                positions={signaturePositions}
                onChangePositions={setSignaturePositions}
              />
            </div>
          )}

        </div>

        {/* Footer com Botões do Wizard */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          
          {/* Botão Esquerdo */}
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev > 1 ? (prev - 1 as 1 | 2 | 3) : 1))}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          )}

          {/* Botão Direito */}
          {currentStep === 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Avançar para Signatários</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleProceedToPlacement}
              disabled={signers.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Avançar para Posicionar Assinaturas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              onClick={handleSubmitEnvelope}
              disabled={isSubmitting || signers.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Disparando Convites...' : 'Disparar Envelope para Assinaturas'}</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
