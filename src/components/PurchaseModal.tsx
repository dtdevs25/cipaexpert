import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  Building2, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Sparkles,
  Lock,
  ArrowRight,
  Vote,
  Users,
  Zap,
  Calculator,
  FileSignature
} from 'lucide-react';
import { CipaModuleId } from '../types/cipa';

export interface VoterPackageTier {
  id: string;
  maxVoters: number;
  label: string;
  annualPrice: number;
  monthlyPrice: number;
}

export const VOTER_TIERS: VoterPackageTier[] = [
  { id: '50', maxVoters: 50, label: 'Até 50 votantes', annualPrice: 139, monthlyPrice: 179 },
  { id: '150', maxVoters: 150, label: 'Até 150 votantes', annualPrice: 159, monthlyPrice: 199 },
  { id: '250', maxVoters: 250, label: 'Até 250 votantes', annualPrice: 179, monthlyPrice: 229 },
  { id: '500', maxVoters: 500, label: 'Até 500 votantes', annualPrice: 229, monthlyPrice: 289 },
  { id: '1000', maxVoters: 1000, label: 'Até 1.000 votantes', annualPrice: 289, monthlyPrice: 359 },
  { id: 'plus', maxVoters: 99999, label: 'Acima de 1.000', annualPrice: 369, monthlyPrice: 459 },
];

export const getElectionPriceByVoters = (voters: number, period: 'mensal' | 'anual'): number => {
  const tier = VOTER_TIERS.find(t => voters <= t.maxVoters) || VOTER_TIERS[VOTER_TIERS.length - 1];
  return period === 'anual' ? tier.annualPrice : tier.monthlyPrice;
};

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedModules?: CipaModuleId[];
  initialVoterCount?: number;
  billingPeriod?: 'mensal' | 'anual';
  onPurchaseComplete?: (companyData: {
    razaoSocial: string;
    cnpj: string;
    email: string;
    modules: CipaModuleId[];
    voterCount?: number;
    billingPeriod: 'mensal' | 'anual';
  }) => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  initialSelectedModules = ['dimensionamento', 'eleicao', 'gestao'],
  initialVoterCount = 250,
  billingPeriod = 'anual',
  onPurchaseComplete
}) => {
  const [selectedModules, setSelectedModules] = useState<Record<CipaModuleId, boolean>>({
    dimensionamento: initialSelectedModules.includes('dimensionamento'),
    eleicao: initialSelectedModules.includes('eleicao'),
    gestao: initialSelectedModules.includes('gestao'),
  });

  const [voterCount, setVoterCount] = useState<number>(initialVoterCount);
  const [period, setPeriod] = useState<'mensal' | 'anual'>(billingPeriod);
  const [razaoSocial, setRazaoSocial] = useState('Indústrias Alfa Brasil S.A.');
  const [cnpj, setCnpj] = useState('12.345.678/0001-90');
  const [email, setEmail] = useState('contato@alfabrasil.com.br');
  const [telefone, setTelefone] = useState('(11) 98765-4321');
  const [paymentMethod, setPaymentMethod] = useState<'boleto' | 'pix' | 'cartao'>('pix');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const toggleModule = (mod: CipaModuleId) => {
    setSelectedModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  const electionPrice = getElectionPriceByVoters(voterCount, period);
  const isCombo = selectedModules.dimensionamento && selectedModules.eleicao && selectedModules.gestao;
  
  // Base prices
  const basePrices = {
    dimensionamento: period === 'anual' ? 119 : 149,
    eleicao: electionPrice,
    gestao: period === 'anual' ? 159 : 199,
  };

  // Combo Fixo conforme pacote original (R$ 389/mês anual ou R$ 489/mês mensal)
  const comboPrice = period === 'anual' ? 389 : 489;

  const currentTotal = isCombo 
    ? comboPrice 
    : (
        (selectedModules.dimensionamento ? basePrices.dimensionamento : 0) +
        (selectedModules.eleicao ? basePrices.eleicao : 0) +
        (selectedModules.gestao ? basePrices.gestao : 0)
      );

  const activeCount = Object.values(selectedModules).filter(Boolean).length;
  const isFormValid = activeCount > 0;

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      if (onPurchaseComplete) {
        const mods = (Object.keys(selectedModules) as CipaModuleId[]).filter(k => selectedModules[k]);
        onPurchaseComplete({ 
          razaoSocial, 
          cnpj, 
          email, 
          modules: mods,
          voterCount: selectedModules.eleicao ? voterCount : undefined,
          billingPeriod: period
        });
      }
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        
        {/* Header com CIPA Expert */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/logocompleto.png" 
              alt="CIPA Expert" 
              className="h-8 w-auto max-w-[180px] object-contain" 
            />
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 leading-tight">
                Contratação de Módulos
              </h3>
              <p className="text-[11px] text-slate-600 font-mono">
                Conformidade imediata com a NR-5 e ativação instantânea
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isSuccess ? (
          <form onSubmit={handleConfirmPurchase} className="p-5 sm:p-6 overflow-y-auto space-y-5">
            
            {/* SELEÇÃO POR MÓDULOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Módulos Desejados:
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPeriod('mensal')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      period === 'mensal' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('anual')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      period === 'anual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Anual (-20% OFF)
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* MÓDULO 1 */}
                <label className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedModules.dimensionamento ? 'border-emerald-500 bg-emerald-50/30 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedModules.dimensionamento}
                      onChange={() => toggleModule('dimensionamento')}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Módulo 1: Dimensionamento & Cronograma NR-5</span>
                        <span className="text-[10px] text-slate-500">Cálculo de cipeiros, tabela C-1 e cronograma legal</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    R$ {basePrices.dimensionamento}/mês
                  </span>
                </label>

                {/* MÓDULO 2 COM SELETOR DE PESSOAS VOTANTES */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  selectedModules.eleicao ? 'border-emerald-500 bg-emerald-50/30 shadow-xs' : 'border-slate-200 bg-white'
                }`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedModules.eleicao}
                        onChange={() => toggleModule('eleicao')}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          <Vote className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Módulo 2: Eleição Online & Urna Criptográfica</span>
                          <span className="text-[10px] text-slate-500">Votação secreta, quórum em tempo real e atas oficiais</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      R$ {basePrices.eleicao}/mês
                    </span>
                  </label>

                  {/* Configuração de Pessoas Votantes (Abre quando selecionado) */}
                  {selectedModules.eleicao && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Número de Pessoas Votantes da Eleição:</span>
                        </span>
                        <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">
                          {voterCount} votantes · R$ {basePrices.eleicao}/mês
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {/* Campo numérico para digitar exatamente */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={10000}
                            value={voterCount}
                            onChange={(e) => setVoterCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="Ex: 150"
                          />
                          <span className="text-[11px] text-slate-500 font-medium">pessoas</span>
                        </div>

                        {/* Pacotes rápidos de seleção */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {[50, 150, 250, 500, 1000].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setVoterCount(count)}
                              className={`px-2 py-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer ${
                                voterCount === count
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500">
                        O valor do Módulo de Eleição altera automaticamente com base no número de pessoas votantes informado.
                      </p>
                    </div>
                  )}
                </div>

                {/* MÓDULO 3 */}
                <label className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedModules.gestao ? 'border-emerald-500 bg-emerald-50/30 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedModules.gestao}
                      onChange={() => toggleModule('gestao')}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <FileSignature className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Módulo 3: Gestão, Atas & Assinatura Digital</span>
                        <span className="text-[10px] text-slate-500">12 reuniões mensais, combate ao assédio e planos 5W2H</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    R$ {basePrices.gestao}/mês
                  </span>
                </label>
              </div>

              {isCombo && (
                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>Desconto Combo CIPA 360° Aplicado!</span>
                  </span>
                  <span className="text-emerald-800 font-mono">
                    Todos os 3 módulos inclusos
                  </span>
                </div>
              )}
            </div>

            {/* Company Form Data */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Dados da Organização:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Razão Social</label>
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">E-mail do Responsável SST/RH</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Forma de Faturamento Corporativo:
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  ⚡ PIX Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('boleto')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    paymentMethod === 'boleto' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  📄 Boleto Faturado
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cartao')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    paymentMethod === 'cartao' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  💳 Cartão de Crédito
                </button>
              </div>
            </div>

            {/* Investment Summary Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block font-mono">
                  Investimento Calculado ({activeCount} {activeCount === 1 ? 'módulo' : 'módulos'})
                </span>
                <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  R$ {currentTotal}
                </span>
                <span className="text-xs text-slate-400">/mês ({period})</span>
                {selectedModules.eleicao && (
                  <span className="text-[11px] text-emerald-300 block font-mono">
                    ✓ Eleição ajustada para {voterCount} pessoas votantes
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="px-5 sm:px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <span>Processando...</span>
                ) : (
                  <>
                    <span>Confirmar & Ativar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Contratação Realizada com Sucesso!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Os módulos selecionados foram habilitados para <strong>{razaoSocial}</strong>. 
              {selectedModules.eleicao && ` A urna eletrônica configurada para ${voterCount} votantes e as credenciais foram emitidas.`}
              As credenciais de acesso do administrador e a nota fiscal foram enviadas para <strong>{email}</strong>.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Concluir e Voltar à Plataforma
              </button>
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
          Garantia de conformidade legal com a NR-5 (Portaria MTP 4.219/2022) · CIPA Expert
        </div>

      </div>
    </div>
  );
};
