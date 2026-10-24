import React from 'react';
import { X, History, Calculator, Calendar, Printer, Building2, ShieldCheck, Trash2 } from 'lucide-react';
import { useCipa } from '../../../context/CipaContext';
import { SavedDimensionamento } from '../../../services/mockStorage';

interface DimensionamentoHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDimensionamento?: (dim: SavedDimensionamento) => void;
}

export const DimensionamentoHistoryModal: React.FC<DimensionamentoHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectDimensionamento
}) => {
  const { dimensionamentos, activeCompany, activeUnit } = useCipa();

  if (!isOpen) return null;

  // Filtrar pela empresa ativa
  const companyDimensions = dimensionamentos.filter(
    d => !d.companyId || d.companyId === activeCompany.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200 shadow-2xs">
              <History className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Histórico de Dimensionamentos NR-5
              </h3>
              <p className="text-xs text-slate-500">
                Cálculos e enquadramentos paritários homologados para {activeCompany.nomeFantasia}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 [scrollbar-width:thin]">
          {companyDimensions.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum dimensionamento salvo ainda</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ao concluir o Passo 2 do cálculo normativo, clique em "Salvar no Histórico" para arquivar o parecer técnico desta unidade.
              </p>
            </div>
          ) : (
            companyDimensions.map((dim) => (
              <div 
                key={dim.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider border border-emerald-200">
                      CNAE {dim.cnaeCode}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Grau de Risco {dim.grauDeRisco}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {dim.headcount} colaboradores
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dim.createdAt}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Efetivos Empregados</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{dim.efetivosEmpregados}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Suplentes Empregados</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{dim.suplentesEmpregados}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Efetivos Empregador</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{dim.efetivosEmpregador}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">Total Comissão</span>
                    <span className="text-lg font-black text-emerald-950 font-mono">{dim.totalMembros}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Calculado por: <strong>{dim.createdBy}</strong></span>
                  </div>

                  {onSelectDimensionamento && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDimensionamento(dim);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-xs transition-all cursor-pointer"
                    >
                      Carregar Dados
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total de registros: <strong>{companyDimensions.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
