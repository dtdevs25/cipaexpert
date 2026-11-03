import React from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

interface RichTextRendererProps {
  content: string | string[];
  className?: string;
  allowImages?: boolean;
}

/**
 * Renderizador de Texto Rico com suporte a:
 * - Links clicáveis diretos (https://...)
 * - Links em Markdown [Texto](url)
 * - Imagens e Mídias ![Legenda](url)
 * - Negrito (**texto**), Itálico (*texto*)
 * - Caracteres especiais (ç, ã, é, §, °, ª, ★, •, etc.)
 * - Tabelas em Markdown (| Col 1 | Col 2 |)
 * - Quebras de linha preservadas
 */
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = '',
  allowImages = true
}) => {
  const paragraphs = Array.isArray(content) ? content : content.split('\n\n');

  // Renderiza uma linha com markdown inline (links, bold, italic, code, imagens)
  const renderInlineFormatted = (text: string): React.ReactNode[] => {
    // Regex para identificar:
    // 1. Imagens markdown: !\[(.*?)\]\((.*?)\)
    // 2. Links markdown: \[(.*?)\]\((.*?)\)
    // 3. URLs puras: (https?:\/\/[^\s]+)
    // 4. Negrito: \*\*(.*?)\*\*
    // 5. Itálico: \*(.*?)\*
    const tokenRegex = /(!?\[(.*?)\]\((.*?)\))|(https?:\/\/[^\s]+)|(\*\*(.*?)\*\*)|(\*(.*?)\*)/g;
    
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      // Texto antes do token
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      const fullMatch = match[0];

      if (fullMatch.startsWith('![') && allowImages) {
        // Imagem Markdown ![alt](url)
        const alt = match[2] || 'Imagem anexa';
        const src = match[3];
        elements.push(
          <span key={match.index} className="inline-block my-2 max-w-full">
            <img
              src={src}
              alt={alt}
              className="rounded-xl border border-slate-300 max-h-64 object-contain shadow-xs bg-slate-50"
              loading="lazy"
            />
            {alt && <span className="block text-[10px] text-slate-500 mt-1 italic">{alt}</span>}
          </span>
        );
      } else if (fullMatch.startsWith('[')) {
        // Link Markdown [label](url)
        const label = match[2];
        const url = match[3];
        elements.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 hover:bg-emerald-50 px-1 py-0.5 rounded transition-colors"
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        );
      } else if (match[4]) {
        // URL pura (https://...)
        const url = match[4];
        elements.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 hover:text-emerald-900 underline truncate max-w-xs align-bottom"
          >
            <span className="truncate">{url}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        );
      } else if (match[5]) {
        // Negrito **texto**
        elements.push(
          <strong key={match.index} className="font-extrabold text-slate-900">
            {match[6]}
          </strong>
        );
      } else if (match[7]) {
        // Itálico *texto*
        elements.push(
          <em key={match.index} className="italic text-slate-800">
            {match[8]}
          </em>
        );
      }

      lastIndex = tokenRegex.lastIndex;
    }

    // Texto restante após último match
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements.length > 0 ? elements : [text];
  };

  // Helper para verificar se um bloco é uma tabela em markdown
  const isTableBlock = (lines: string[]): boolean => {
    return lines.length >= 2 && lines[0].includes('|') && lines[1].includes('|') && lines[1].includes('-');
  };

  // Renderiza tabela em Markdown
  const renderMarkdownTable = (tableLines: string[], key: number) => {
    const parseRow = (line: string) => line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1 || arr.length <= 2);
    const headers = parseRow(tableLines[0]);
    const rows = tableLines.slice(2).map(parseRow);

    return (
      <div key={key} className="my-3 overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
              {headers.map((h, i) => (
                <th key={i} className="py-2 px-3">
                  {renderInlineFormatted(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-2 px-3 text-slate-700">
                    {renderInlineFormatted(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`space-y-2.5 text-slate-700 leading-relaxed ${className}`}>
      {paragraphs.map((p, pIdx) => {
        if (!p || !p.trim()) return null;

        const lines = p.split('\n').map(l => l.trim()).filter(Boolean);

        // Se o bloco é uma tabela
        if (isTableBlock(lines)) {
          return renderMarkdownTable(lines, pIdx);
        }

        // Títulos Markdown (# Título, ## Subtítulo)
        if (p.startsWith('# ')) {
          return (
            <h1 key={pIdx} className="text-lg font-black text-slate-900 border-b border-slate-200 pb-1 mt-4 mb-2">
              {renderInlineFormatted(p.replace(/^#\s*/, ''))}
            </h1>
          );
        }
        if (p.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="text-base font-extrabold text-slate-900 mt-3 mb-1.5">
              {renderInlineFormatted(p.replace(/^##\s*/, ''))}
            </h2>
          );
        }
        if (p.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-sm font-bold text-slate-900 uppercase tracking-tight mt-2.5 mb-1">
              {renderInlineFormatted(p.replace(/^###\s*/, ''))}
            </h3>
          );
        }

        // Bullet points (• ou - ou *)
        if (lines.length > 1 && lines.every(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))) {
          return (
            <ul key={pIdx} className="space-y-1.5 pl-3 my-2 text-xs">
              {lines.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold leading-tight">•</span>
                  <span className="flex-1 leading-snug">
                    {renderInlineFormatted(item.replace(/^[•\-*]\s*/, ''))}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // Parágrafo individual que começa com bullet point
        if (p.startsWith('•') || p.startsWith('-')) {
          return (
            <div key={pIdx} className="flex items-start gap-2 pl-3 text-xs leading-relaxed">
              <span className="text-emerald-600 font-bold leading-tight">•</span>
              <span className="flex-1">
                {renderInlineFormatted(p.replace(/^[•\-]\s*/, ''))}
              </span>
            </div>
          );
        }

        // Imagem isolada em linha inteira
        if (p.startsWith('data:image/') || (allowImages && (p.endsWith('.png') || p.endsWith('.jpg') || p.endsWith('.jpeg')) && p.startsWith('http'))) {
          return (
            <div key={pIdx} className="my-3 text-center">
              <img
                src={p}
                alt="Mídia"
                className="max-h-72 mx-auto rounded-2xl border border-slate-200 shadow-xs object-contain"
              />
            </div>
          );
        }

        // Parágrafo normal com suporte a quebras de linha preservadas
        return (
          <p key={pIdx} className="text-xs leading-relaxed whitespace-pre-wrap">
            {renderInlineFormatted(p)}
          </p>
        );
      })}
    </div>
  );
};
