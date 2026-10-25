import React, { useState } from 'react';
import { useCipa } from '../../../context/CipaContext';
import { RiskMapPoint } from '../../../services/mockStorage';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  X, 
  Printer, 
  Info, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

const RISCO_CORES: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  fisico: {
    label: 'Risco Físico',
    bg: 'bg-emerald-500',
    border: 'border-emerald-600',
    text: 'text-emerald-950',
    dot: 'bg-emerald-500'
  },
  quimico: {
    label: 'Risco Químico',
    bg: 'bg-rose-500',
    border: 'border-rose-600',
    text: 'text-rose-950',
    dot: 'bg-rose-500'
  },
  biologico: {
    label: 'Risco Biológico',
    bg: 'bg-amber-800',
    border: 'border-amber-900',
    text: 'text-amber-950',
    dot: 'bg-amber-800'
  },
  ergonomico: {
    label: 'Risco Ergonômico',
    bg: 'bg-amber-400',
    border: 'border-amber-500',
    text: 'text-amber-950',
    dot: 'bg-amber-400'
  },
  acidente: {
    label: 'Risco de Acidentes',
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-blue-950',
    dot: 'bg-blue-500'
  }
};

const GRAU_TAMANHOS: Record<string, { label: string; sizeClass: string; px: number }> = {
  pequeno: { label: 'Pequeno (Leve)', sizeClass: 'w-7 h-7 text-[10px]', px: 28 },
  medio: { label: 'Médio (Moderado)', sizeClass: 'w-11 h-11 text-xs', px: 44 },
  grande: { label: 'Grande (Grave)', sizeClass: 'w-16 h-16 text-sm', px: 64 }
};

export const InteractiveRiskMap: React.FC = () => {
  const { riskPoints, saveRiskPoint, deleteRiskPoint, activeCompany, activeUnit } = useCipa();

  // Filtrar riscos da unidade atual
  const unitRisks = riskPoints.filter(
    r => !r.unitId || r.unitId === activeUnit.id
  );

  const [selectedPoint, setSelectedPoint] = useState<RiskMapPoint | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formSetor, setFormSetor] = useState('Usinagem & Caldeiraria');
  const [formTipo, setFormTipo] = useState<'fisico' | 'quimico' | 'biologico' | 'ergonomico' | 'acidente'>('fisico');
  const [formGravidade, setFormGravidade] = useState<'pequeno' | 'medio' | 'grande'>('medio');
  const [formAgente, setFormAgente] = useState('');
  const [formMedidas, setFormMedidas] = useState('');
  const [clickPos, setClickPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setClickPos({ x, y });
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgente.trim()) return;

    const newPoint: RiskMapPoint = {
      id: `risk-${Date.now()}`,
      companyId: activeCompany.id,
      unitId: activeUnit.id,
      setor: formSetor,
      tipoRisco: formTipo,
      grauGravidade: formGravidade,
      agenteIdentificado: formAgente.trim(),
      medidasPreventivas: formMedidas.trim() || 'Uso contínuo de EPI e EPC apropriados.',
      xPercent: clickPos.x,
      yPercent: clickPos.y
    };

    saveRiskPoint(newPoint);
    setIsAddModalOpen(false);
    setFormAgente('');
    setFormMedidas('');
    setSelectedPoint(newPoint);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Mapa de Riscos Ocupacionais Interativo</span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Portaria NR-5
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {activeCompany.nomeFantasia} · {activeUnit.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Imprimir Mapa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setClickPos({ x: 50, y: 50 });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Risco</span>
          </button>
        </div>
      </div>

      {/* Legenda Oficial das Cores da NR-5 */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          Classificação Oficial das Cores dos Riscos (Portaria 25/1994 - NR-5):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {Object.entries(RISCO_CORES).map(([key, item]) => (
            <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className={`w-3.5 h-3.5 rounded-full ${item.bg} shrink-0 shadow-2xs`} />
              <div className="min-w-0">
                <strong className="text-slate-800 block text-[11px] truncate">{item.label}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Principal: Planta do Layout & Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Planta Baixa Interativa (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Layout dos Setores (Clique no mapa para posicionar um risco)</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {unitRisks.length} círculos mapeados
            </span>
          </div>

          <div 
            onClick={handleMapClick}
            className="relative w-full h-[460px] bg-slate-900/5 cursor-crosshair overflow-hidden border-b border-slate-200 select-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Setores Demarcados no Layout */}
            <div className="absolute inset-4 grid grid-cols-2 grid-rows-2 gap-4 pointer-events-none">
              <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white/40">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Setor 01: Usinagem & Montagem
                </span>
              </div>
              <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white/40">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Setor 02: Pintura & Tratamento Térmico
                </span>
              </div>
              <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white/40">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Setor 03: Almoxarifado & Logística
                </span>
              </div>
              <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white/40">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Setor 04: Administração & Engenharia
                </span>
              </div>
            </div>

            {/* Círculos de Riscos Mapeados */}
            {unitRisks.map((risk) => {
              const cor = RISCO_CORES[risk.tipoRisco] || RISCO_CORES.fisico;
              const grav = GRAU_TAMANHOS[risk.grauGravidade] || GRAU_TAMANHOS.medio;
              const isSelected = selectedPoint?.id === risk.id;

              return (
                <div
                  key={risk.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPoint(risk);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer flex items-center justify-center font-bold text-white shadow-md transition-transform hover:scale-115 active:scale-95 ${cor.bg} ${grav.sizeClass} ${
                    isSelected ? 'ring-4 ring-slate-900 ring-offset-2 scale-110' : ''
                  }`}
                  style={{ left: `${risk.xPercent}%`, top: `${risk.yPercent}%` }}
                  title={`${cor.label}: ${risk.agenteIdentificado}`}
                >
                  <span className="capitalize">{risk.grauGravidade[0]}</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Dica: Letra no círculo indica o grau (P = Pequeno, M = Médio, G = Grande).</span>
            <span className="font-bold text-emerald-800">Conforme NR-5 Quadro de Riscos Ambientais</span>
          </div>
        </div>

        {/* Painel Lateral: Detalhes do Ponto Selecionado (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Detalhes do Ponto Mapeado
            </h4>
            {selectedPoint && (
              <button
                type="button"
                onClick={() => {
                  deleteRiskPoint(selectedPoint.id);
                  setSelectedPoint(null);
                }}
                className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Excluir este ponto do mapa"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
              </button>
            )}
          </div>

          {selectedPoint ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${RISCO_CORES[selectedPoint.tipoRisco]?.bg}`} />
                <span className="font-bold text-slate-900 text-sm">
                  {RISCO_CORES[selectedPoint.tipoRisco]?.label}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 ml-auto">
                  Grau {selectedPoint.grauGravidade}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Setor / Local</span>
                <p className="font-semibold text-slate-800">{selectedPoint.setor}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Agente Nocivo Identificado</span>
                <p className="text-slate-700 leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50">
                  {selectedPoint.agenteIdentificado}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Medidas de Controle Recomendadas</span>
                <p className="text-slate-700 leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200/50">
                  {selectedPoint.medidasPreventivas}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Info className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">
                Clique em qualquer círculo no mapa para visualizar sua análise detalhada e recomendações do SESMT/CIPA.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Modal para Adicionar Ponto de Risco */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-700" />
                <span>Adicionar Ponto ao Mapa de Riscos</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Setor da Planta</label>
                <select
                  value={formSetor}
                  onChange={(e) => setFormSetor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Usinagem & Caldeiraria">Setor 01: Usinagem & Caldeiraria</option>
                  <option value="Pintura & Tratamento Térmico">Setor 02: Pintura & Tratamento Térmico</option>
                  <option value="Almoxarifado & Logística">Setor 03: Almoxarifado & Logística</option>
                  <option value="Administração & Engenharia">Setor 04: Administração & Engenharia</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Grupo de Risco (Cor)</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="fisico">Verde · Físico</option>
                    <option value="quimico">Vermelho · Químico</option>
                    <option value="biologico">Marrom · Biológico</option>
                    <option value="ergonomico">Amarelo · Ergonômico</option>
                    <option value="acidente">Azul · Acidentes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Grau de Gravidade</label>
                  <select
                    value={formGravidade}
                    onChange={(e) => setFormGravidade(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pequeno">Pequeno (Leve)</option>
                    <option value="medio">Médio (Moderado)</option>
                    <option value="grande">Grande (Crítico)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Agente Nocivo Identificado</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ruído contínuo de prensas (89 dB), solventes, poeira..."
                  value={formAgente}
                  onChange={(e) => setFormAgente(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Medidas Preventivas Propostas</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Protetor auricular tipo concha + plug, exaustor axial..."
                  value={formMedidas}
                  onChange={(e) => setFormMedidas(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs active:scale-95"
                >
                  Salvar no Mapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
