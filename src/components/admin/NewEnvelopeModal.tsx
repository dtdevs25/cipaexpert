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
  Info, 
  ArrowRight, 
  ArrowLeft, 
  MapPin,
  Check
} from 'lucide-react';
import { 
  SignatureService, 
  SignatureEnvelope,
  SignatureTagPosition
} from '../../services/signatureService';
import { ApiService } from '../../services/apiService';
import { SignaturePlacementEditor } from './SignaturePlacementEditor';

interface NewEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  companyName: string;
  unitId?: string;
  unitName?: string;
  cnpj: string;
  creatorName: string;
  creatorEmail: string;
  onEnvelopeCreated: (envelope: SignatureEnvelope) => void;
}

export const NewEnvelopeModal: React.FC<NewEnvelopeModalProps> = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  unitId,
  unitName,
  cnpj,
  creatorName,
  creatorEmail,
  onEnvelopeCreated
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Etapa Atual do Wizard (1: Upload do Documento, 2: Signatários, 3: Posicionar Assinaturas)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Dados do Documento (Apenas Upload)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Documento Externo CIPA');
  const [normativeCode, setNormativeCode] = useState('Gestão Documental CIPA · MP 2.200-2/2001');
  const [documentContent, setDocumentContent] = useState<string[]>([]);
  
  // Upload state
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sequência e Signatários
  const [sendSequence, setSendSequence] = useState<'todos_juntos' | 'sequencial'>('todos_juntos');
  const [signers, setSigners] = useState<Array<{ name: string; email: string; cpf?: string; role: string }>>([
    { name: 'Carlos Alberto Mendes', email: 'carlos.mendes@empresa.com.br', cpf: '123.456.789-01', role: 'Presidente da CIPA' },
    { name: 'Mariana Fonseca de Souza', email: 'mariana.fonseca@empresa.com.br', cpf: '987.654.321-09', role: 'Vice-Presidente da CIPA' }
  ]);

  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [newSignerRole, setNewSignerRole] = useState('Membro da CIPA');
  const [newSignerCpf, setNewSignerCpf] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Posições das Assinaturas no Documento (Estilo DocuSign / D4Sign)
  const [signaturePositions, setSignaturePositions] = useState<SignatureTagPosition[]>([]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    
    // Sugere o título automaticamente removendo a extensão do arquivo
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTitle(cleanTitle);

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
        `Documento oficial protocolado: ${file.name}`,
        `Tamanho do arquivo: ${(file.size / 1024).toFixed(1)} KB`,
        `Empresa: ${companyName} · CNPJ: ${cnpj}`,
        `Documento encaminhado para coleta de assinaturas digitais com integridade criptográfica SHA-256 e conformidade regulamentar conforme MP 2.200-2/2001 e Lei 14.063/2020.`
      ]);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveFile = () => {
    setUploadedFileName('');
    setUploadedFileSize(0);
    setUploadedFileUrl('');
    setTitle('');
    setDocumentContent([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    setNewSignerRole('Membro da CIPA');
    setNewSignerCpf('');
  };

  const handleRemoveSigner = (index: number) => {
    const signerToRemove = signers[index];
    setSigners(signers.filter((_, idx) => idx !== index));
    // Remove tags do signatário excluído
    if (signerToRemove) {
      setSignaturePositions(prev => prev.filter(p => p.signerEmail !== signerToRemove.email));
    }
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
    if (!uploadedFileName) {
      alert('Faça upload de um documento antes de enviar.');
      return;
    }
    if (signers.length === 0) {
      alert('Adicione pelo menos um signatário para o envelope.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalContent = documentContent.length > 0 
        ? documentContent 
        : [
            `Documento oficial protocolado: ${uploadedFileName}`,
            `Empresa: ${companyName} · CNPJ: ${cnpj}`,
            `Documento submetido para coleta de assinaturas digitais conforme MP 2.200-2/2001 e Lei 14.063/2020.`
          ];

      const created = await SignatureService.createEnvelope({
        title: title.trim() || uploadedFileName.replace(/\.[^/.]+$/, ''),
        category: category.trim() || 'Documento Externo CIPA',
        normativeCode,
        sourceType: 'upload',
        fileName: uploadedFileName,
        fileUrl: uploadedFileUrl || undefined,
        content: finalContent,
        companyId,
        companyName,
        unitId,
        unitName,
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
              <Upload className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                  Novo Envelope · Upload de Documento
                </h3>
                {unitName && (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                    {unitName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 font-mono">
                {currentStep === 1 && 'Etapa 1 de 3: Upload do documento e dados do envelope'}
                {currentStep === 2 && 'Etapa 2 de 3: Signatários e ordem de assinatura'}
                {currentStep === 3 && 'Etapa 3 de 3: Posicionamento das assinaturas'}
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

        {/* Stepper Wizard Bar */}
        <div className="px-5 sm:px-6 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
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
              <span>Upload Documento</span>
            </button>

            <span className="text-slate-300">/</span>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => {
                if (uploadedFileName) setCurrentStep(2);
              }}
              disabled={!uploadedFileName}
              className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                currentStep === 2 ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800 disabled:opacity-40'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 2 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                2
              </span>
              <span>Signatários</span>
            </button>

            <span className="text-slate-300">/</span>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => {
                if (uploadedFileName) handleProceedToPlacement();
              }}
              disabled={!uploadedFileName || signers.length === 0}
              className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                currentStep === 3 ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800 disabled:opacity-40'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 3 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                3
              </span>
              <span>Posicionar</span>
            </button>

          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Passo {currentStep} de 3
          </span>
        </div>

        {/* Form Body com Etapas */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 [scrollbar-width:thin]">
          
          {/* ========================================================================= */}
          {/* ETAPA 1: UPLOAD DO DOCUMENTO */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
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

              {!uploadedFileName ? (
                /* ÁREA DE DRAG & DROP / SELEÇÃO */
                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isDragOver 
                      ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]' 
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/50'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {isUploading ? 'Processando arquivo...' : 'Arraste o arquivo ou clique para selecionar'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      Formatos aceitos: PDF, DOCX, DOC, TXT, PNG, JPG. O documento receberá integridade criptográfica SHA-256 e conformidade regulamentar.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all pointer-events-none"
                  >
                    Selecionar Arquivo
                  </button>
                </div>
              ) : (
                /* CARD DE ARQUIVO JÁ ANEXADO */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-xs text-emerald-950 truncate">
                            {uploadedFileName}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                            <Check className="w-3 h-3" /> Pronto
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {(uploadedFileSize / 1024).toFixed(1)} KB · Armazenamento Seguro MinIO
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        Trocar
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Remover arquivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* CAMPOS DE METADADOS DO ENVELOPE */}
                  <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Título do Documento / Envelope
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Ata de Reunião CIPA, Contrato SST..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Categoria do Documento
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                        >
                          <option value="Documento Externo CIPA">Documento Externo CIPA</option>
                          <option value="Atas Mensais Obrigatórias">Atas Mensais Obrigatórias</option>
                          <option value="Processo Eleitoral">Processo Eleitoral</option>
                          <option value="Treinamento e Capacitação">Treinamento e Capacitação</option>
                          <option value="Certificados SST">Certificados SST</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Referência Normativa / Legal
                        </label>
                        <input
                          type="text"
                          value={normativeCode}
                          onChange={(e) => setNormativeCode(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2: SIGNATÁRIOS & SEQUÊNCIA */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Ordem de Envio */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fluxo e Ordem de Assinatura</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendSequence('todos_juntos')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      sendSequence === 'todos_juntos'
                        ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-200'
                        : 'bg-white/80 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900">Em Paralelo (Todos Juntos)</p>
                    <p className="text-[11px] text-slate-500">Todos os signatários recebem o documento ao mesmo tempo.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSendSequence('sequencial')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      sendSequence === 'sequencial'
                        ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-200'
                        : 'bg-white/80 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900">Sequencial (Ordem da Lista)</p>
                    <p className="text-[11px] text-slate-500">O próximo signatário só é notificado após o anterior assinar.</p>
                  </button>
                </div>
              </div>

              {/* Lista Atual de Signatários */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Signatários deste Envelope ({signers.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Arraste para reordenar se for sequencial</span>
                </div>

                <div className="space-y-2">
                  {signers.map((signer, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{signer.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{signer.email} · <span className="text-emerald-700 font-semibold">{signer.role}</span></p>
                          {signer.cpf && <p className="text-[10px] text-slate-400 font-mono">CPF: {signer.cpf}</p>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSigner(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Remover signatário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulário para Adicionar Novo Signatário */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Adicionar Novo Signatário</span>
                <form onSubmit={handleAddSigner} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome completo do signatário *"
                      value={newSignerName}
                      onChange={(e) => setNewSignerName(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="email"
                      placeholder="E-mail corporativo ou pessoal *"
                      value={newSignerEmail}
                      onChange={(e) => setNewSignerEmail(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Cargo (ex: Presidente da CIPA, Titular Eleito)"
                      value={newSignerRole}
                      onChange={(e) => setNewSignerRole(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="CPF (Opcional para validação legal)"
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
                    Posicione as marcas de assinatura onde cada signatário deve assinar no documento.
                  </p>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  {signaturePositions.length} campo(s) marcado(s)
                </span>
              </div>

              {/* Editor Visual de Posicionamento */}
              <SignaturePlacementEditor
                documentTitle={title || uploadedFileName}
                documentContent={
                  documentContent.length > 0 
                    ? documentContent 
                    : [
                        `Documento oficial protocolado: ${uploadedFileName}`,
                        `Empresa: ${companyName} · CNPJ: ${cnpj}`,
                        `Protocolo digital de assinaturas com conformidade legal.`
                      ]
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
              disabled={!uploadedFileName || isUploading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{isUploading ? 'Processando...' : 'Avançar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleProceedToPlacement}
              disabled={signers.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Avançar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              onClick={handleSubmitEnvelope}
              disabled={isSubmitting || signers.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Enviando...' : 'Enviar Envelope'}</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
