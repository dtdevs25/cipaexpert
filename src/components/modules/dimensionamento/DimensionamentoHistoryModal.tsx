import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Calculator, 
  Calendar, 
  Printer, 
  Building2, 
  ShieldCheck, 
  Loader2, 
  RefreshCw, 
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useCipa } from '../../../context/CipaContext';
import { SavedDimensionamento } from '../../../services/mockStorage';
import { ApiService } from '../../../services/apiService';

interface DimensionamentoHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDimensionamento?: (dim: any) => void;
  unitId?: string;
  companyId?: string;
  companyName?: string;
  unitName?: string;
}

export const DimensionamentoHistoryModal: React.FC<DimensionamentoHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectDimensionamento,
  unitId,
  companyId,
  companyName,
  unitName
}) => {
  const { dimensionamentos: localDimensionamentos, activeCompany, activeUnit } = useCipa();
  const [dbRecords, setDbRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const targetCompanyId = companyId || activeCompany.id;
  const targetUnitId = unitId || activeUnit?.id;
  const displayCompanyName = companyName || activeCompany.nomeFantasia || activeCompany.razaoSocial;

  // Carregar histórico real do banco de dados PostgreSQL
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getDimensionamentos(targetUnitId, targetCompanyId);
      if (Array.isArray(data)) {
        setDbRecords(data);
      } else {
        setDbRecords([]);
      }
    } catch (err: any) {
      console.warn('Erro ao carregar histórico do banco:', err);
      setError('Não foi possível carregar os registros diretamente do banco. Mostrando dados locais.');
      // Fallback para os dados locais do contexto
      const fallback = localDimensionamentos.filter(
        d => (!targetCompanyId || d.companyId === targetCompanyId) &&
             (!targetUnitId || d.unitId === targetUnitId)
      );
      setDbRecords(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, targetUnitId, targetCompanyId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center ring-1 ring-emerald-200 shadow-2xs">
              <History className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                  Histórico de Dimensionamentos NR-5
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-bold">
                  <Database className="w-3 h-3" />
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Cálculos paritários homologados para {displayCompanyName} {unitName ? `· ${unitName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-white/60 transition-colors cursor-pointer disabled:opacity-50"
              title="Atualizar dados do banco"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 [scrollbar-width:thin]">
          {error && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 px-4">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Consultando dimensionamentos no banco de dados...</p>
            </div>
          ) : dbRecords.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum dimensionamento homologado para esta filial</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ao avançar no Passo 2 ou ir para o Calendário Eleitoral, o sistema salva e homologa automaticamente o dimensionamento da gestão no banco de dados.
              </p>
            </div>
          ) : (
            dbRecords.map((dim, idx) => (
              <div 
                key={dim.id || idx}
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
                    <span className="text-xs text-slate-600 font-bold">
                      {dim.headcount} colaboradores
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Gestão Vigente
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

                {dim.observacaoNormativa && (
                  <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-200/60 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-700">Parecer Normativo NR-5: </span>
                    {dim.observacaoNormativa}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Calculado e homologado por: <strong>{dim.createdBy || dim.calculadoPor || 'Administrador SST'}</strong></span>
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
            Total de dimensionamentos da gestão: <strong>{dbRecords.length}</strong>
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
