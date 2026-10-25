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
  Layers
} from 'lucide-react';
import { 
  SignatureService, 
  getAvailableSystemTemplates, 
  SignatureEnvelope 
} from '../../services/signatureService';
import { generateCipaDocument } from '../../data/documentTemplates';
import { ApiService } from '../../services/apiService';

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

    // Lê texto ou converte para base64 e envia ao MinIO
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

  const handleSubmitEnvelope = async () => {
    if (signers.length === 0) {
      alert('Adicione pelo menos um signatário para o envelope.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Se for nativo e o conteúdo não foi gerado, gera agora
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
        creatorEmail
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        
        {/* Header Verde Padronizado */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center ring-1 ring-emerald-200 shadow-2xs">
              <Send className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                Novo Envelope de Assinaturas Digitais (Estilo DocuSign)
              </h3>
              <p className="text-[11px] text-slate-600 font-mono">
                Disparo automatizado por e-mail, rastreamento e hash SHA-256
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

        {/* Form Body com Etapas */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 [scrollbar-width:thin]">
          
          {/* PASSO 1: ORIGEM DO DOCUMENTO (NATIVO VS UPLOAD) */}
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

            {sourceType === 'sistema' ? (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Escolha o Modelo Oficial Integrado:
                </label>
                <select
                  value={selectedTemplateDocType}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {systemTemplates.map(tmpl => (
                    <option key={tmpl.docType} value={tmpl.docType}>
                      {tmpl.title} ({tmpl.normativeCode})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 font-mono">
                  * Os dados da empresa ativa ({companyName}) e colaboradores já serão vinculados no documento gerado.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,.doc,.txt,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50/70 transition-all text-center cursor-pointer space-y-1.5"
                >
                  <Upload className="w-6 h-6 text-emerald-600 mx-auto" />
                  <span className="font-bold text-slate-800 block text-xs">
                    {uploadedFileName ? `Arquivo: ${uploadedFileName}` : 'Clique para selecionar arquivo do computador'}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-mono">
                    Suporta PDF, Word (.docx), Imagens e TXT (Envio automático para o MinIO)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PASSO 2: CONFIGURAÇÃO DO ENVIO (SEQUENCIAL VS TODOS JUNTOS) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              2. Sequência de Assinaturas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                onClick={() => setSendSequence('todos_juntos')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                  sendSequence === 'todos_juntos'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="sendSequence"
                  checked={sendSequence === 'todos_juntos'}
                  onChange={() => setSendSequence('todos_juntos')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <strong className="text-slate-900 font-bold block text-xs">Todos ao Mesmo Tempo (Paralelo)</strong>
                  <span className="text-[11px] text-slate-500 block leading-relaxed mt-0.5">
                    Todos os signatários recebem o e-mail simultaneamente e podem assinar em qualquer ordem.
                  </span>
                </div>
              </div>

              <div
                onClick={() => setSendSequence('sequencial')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                  sendSequence === 'sequencial'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="sendSequence"
                  checked={sendSequence === 'sequencial'}
                  onChange={() => setSendSequence('sequencial')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <strong className="text-slate-900 font-bold block text-xs">Ordem Sequencial (1 a 1)</strong>
                  <span className="text-[11px] text-slate-500 block leading-relaxed mt-0.5">
                    O 2º signatário só recebe o e-mail após o 1º assinar, mantendo rigor regimental.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PASSO 3: SIGNATÁRIOS */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                3. Signatários Selecionados ({signers.length})
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold font-mono">
                {sendSequence === 'sequencial' ? 'Ordem de execução ativa' : 'Disparo simultâneo'}
              </span>
            </div>

            {/* Lista dos Signatários Configurados */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {signers.map((s, idx) => (
                <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold block truncate">{s.name}</strong>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {s.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">{s.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {sendSequence === 'sequencial' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMoveSigner(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                          title="Subir na fila"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSigner(idx, 'down')}
                          disabled={idx === signers.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                          title="Descer na fila"
                        >
                          ↓
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveSigner(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remover signatário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulário para Adicionar Signatário */}
            <form onSubmit={handleAddSigner} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Adicionar Outro Signatário:</span>
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

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmitEnvelope}
            disabled={isSubmitting || signers.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Disparando Convites...' : 'Disparar Envelope para Assinaturas'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
