import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  List, 
  ListOrdered, 
  Table, 
  Eye, 
  Edit3, 
  Upload, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { RichTextRenderer } from './RichTextRenderer';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  allowMediaUpload?: boolean;
  className?: string;
  helperText?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Digite seu texto aqui com formatação livre, links, caracteres especiais e mídias...',
  minHeight = '180px',
  allowMediaUpload = true,
  className = '',
  helperText
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showSymbols, setShowSymbols] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Caracteres e símbolos especiais comuns na CIPA / Legislação
  const specialSymbols = [
    { label: '§ (Parágrafo)', val: '§ ' },
    { label: '° (Grau)', val: '°' },
    { label: 'ª (Ordinal)', val: 'ª' },
    { label: '• (Marcador)', val: '• ' },
    { label: '✓ (Check)', val: '✓ ' },
    { label: '★ (Estrela)', val: '★ ' },
    { label: '⚠️ (Aviso)', val: '⚠️ ' },
    { label: '⚖️ (Norma)', val: '⚖️ ' },
    { label: '🏢 (Empresa)', val: '🏢 ' },
    { label: '📅 (Data)', val: '📅 ' },
    { label: '🗳️ (Votação)', val: '🗳️ ' },
    { label: '👥 (Comissão)', val: '👥 ' }
  ];

  // Inserir texto ou wrapper na posição do cursor
  const insertAtCursor = (prefix: string, suffix: string = '', defaultContent: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + prefix + defaultContent + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultContent;
    const replacement = prefix + selectedText + suffix;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      setShowLinkModal(false);
      return;
    }
    const txt = linkText.trim() || linkUrl.trim();
    insertAtCursor(`[${txt}](`, ')', linkUrl.trim());
    setLinkText('');
    setLinkUrl('');
    setShowLinkModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Por favor, selecione uma imagem de até 2MB para garantir boa performance.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        insertAtCursor(`\n![${file.name.replace(/\.[^/.]+$/, "")}](`, ')\n', base64);
      }
    };
    reader.readAsDataURL(file);

    // Limpa o input para permitir selecionar o mesmo arquivo novamente se desejar
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertTableTemplate = () => {
    const tableTemplate = 
`\n| Item | Descrição / Pauta | Responsável | Status |
| :--- | :--- | :--- | :--- |
| 01 | Exemplo de item com link ou formatação | Comissão | Concluído ✓ |
| 02 | Ação de segurança e prevenção | SESMT | Em andamento |\n`;
    insertAtCursor(tableTemplate);
  };

  return (
    <div className={`rich-text-editor border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 ${className}`}>
      {/* Cabeçalho com label e abas */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 gap-2">
        {label && (
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {label}
          </label>
        )}

        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 p-0.5 rounded-md ml-auto">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'write'
                ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Escrever
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visualizar Postagem
          </button>
        </div>
      </div>

      {/* Barra de Ferramentas de Formatação (ativa apenas na aba Escrever) */}
      {activeTab === 'write' && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs">
          {/* Negrito */}
          <button
            type="button"
            onClick={() => insertAtCursor('**', '**', 'texto em negrito')}
            title="Negrito (**texto**)"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Itálico */}
          <button
            type="button"
            onClick={() => insertAtCursor('*', '*', 'texto em itálico')}
            title="Itálico (*texto*)"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <Italic className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Link */}
          <button
            type="button"
            onClick={() => {
              const sel = textareaRef.current
                ? value.substring(textareaRef.current.selectionStart, textareaRef.current.selectionEnd)
                : '';
              setLinkText(sel);
              setShowLinkModal(true);
            }}
            title="Inserir Link clicável"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium transition"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Link
          </button>

          {/* Mídia / Imagem */}
          {allowMediaUpload && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Inserir Foto/Mídia do Computador"
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-medium transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Mídia / Foto
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}

          {/* URL de Imagem direta */}
          <button
            type="button"
            onClick={() => {
              const url = prompt('Digite o endereço (URL) da imagem:');
              if (url) {
                insertAtCursor(`\n![Imagem](`, ')\n', url);
              }
            }}
            title="Inserir imagem via URL"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Listas */}
          <button
            type="button"
            onClick={() => insertAtCursor('\n- ', '', 'Item da lista')}
            title="Lista com Marcadores"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => insertAtCursor('\n1. ', '', 'Primeiro item')}
            title="Lista Numerada"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Tabela */}
          <button
            type="button"
            onClick={insertTableTemplate}
            title="Inserir Tabela Formatada"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 transition"
          >
            <Table className="w-3.5 h-3.5" />
            Tabela
          </button>

          <span className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Menu Dropdown de Símbolos Especiais */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSymbols(!showSymbols)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-400 font-medium transition"
              title="Inserir Caracteres Especiais (Legislação, Símbolos)"
            >
              <span>§ Especiais</span>
            </button>

            {showSymbols && (
              <div 
                className="absolute top-full left-0 mt-1 w-64 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-30 grid grid-cols-2 gap-1.5"
                onMouseLeave={() => setShowSymbols(false)}
              >
                <div className="col-span-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                  Caracteres e Símbolos
                </div>
                {specialSymbols.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      insertAtCursor(item.val);
                      setShowSymbols(false);
                    }}
                    className="flex items-center gap-1.5 text-xs p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-left text-gray-800 dark:text-gray-200"
                  >
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.val.trim()}</span>
                    <span className="truncate text-[11px] text-gray-600 dark:text-gray-400">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Adicionar Link */}
      {showLinkModal && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[140px]">
            <input
              type="text"
              placeholder="Texto visível do link (Ex: Acesse o Edital)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <input
              type="url"
              placeholder="URL de destino (Ex: https://meusite.com.br/arquivo.pdf)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleApplyLink}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm"
            >
              Inserir Link
            </button>
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Área de Conteúdo: Textarea vs Pré-visualização */}
      <div className="relative">
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full p-3.5 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed resize-y"
          />
        ) : (
          <div 
            style={{ minHeight }}
            className="p-3.5 bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto"
          >
            {value.trim() ? (
              <RichTextRenderer content={value} />
            ) : (
              <div className="text-gray-400 text-sm italic py-6 text-center">
                Nenhum texto digitado ainda para pré-visualização. Digite na aba "Escrever".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rodapé informativo */}
      <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Suporta formatação rica, caracteres especiais (`ç`, `ã`, `§`, `°`), links clicáveis, imagens e tabelas.</span>
        </div>
        {helperText && <span className="font-medium text-emerald-600 dark:text-emerald-400">{helperText}</span>}
      </div>
    </div>
  );
};
