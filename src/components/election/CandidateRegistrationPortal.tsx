import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Vote, 
  FileText, 
  Mail, 
  Building2, 
  Clock, 
  Lock, 
  X, 
  Printer, 
  BadgeAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { Company, CompanyUnit } from '../../types/auth';
import { Candidato } from '../../types/cipa';
import { 
  EmployeeRecord, 
  INITIAL_EMPLOYEES, 
  validateCandidateEligibility,
  ValidationResult 
} from '../../data/employeeData';
import { INITIAL_COMPANIES } from '../../data/multiCompanyData';

interface CandidateRegistrationPortalProps {
  company?: Company;
  unit?: CompanyUnit;
  token?: string;
  onSuccess?: (candidato: Candidato) => void;
  onClose?: () => void;
  isStandalonePage?: boolean;
  existingCandidates?: Candidato[];
}

export const CandidateRegistrationPortal: React.FC<CandidateRegistrationPortalProps> = ({
  company: initialCompany,
  unit: initialUnit,
  token,
  onSuccess,
  onClose,
  isStandalonePage = false,
  existingCandidates = []
}) => {
  // Determina empresa e unidade alvo (padrão Telefônica Jundiaí se não fornecido)
  const company = useMemo(() => {
    if (initialCompany) return initialCompany;
    return INITIAL_COMPANIES.find(c => c.id === 'comp-telefonica') || INITIAL_COMPANIES[0];
  }, [initialCompany]);

  const unit = useMemo(() => {
    if (initialUnit) return initialUnit;
    return company.units.find(u => u.id === 'unit-tel-jundiai') || company.units[0];
  }, [initialUnit, company]);

  // Steps: 1: Identificação (Nome + RE) | 2: Dados de Urna | 3: Regras (Lê como faz) | 4: Comprovante
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Step 1: Identificação
  const [inputRe, setInputRe] = useState('');
  const [inputName, setInputName] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Form Step 2: Dados de Urna e Propostas
  const [urnaNome, setUrnaNome] = useState('');
  const [urnaNumero, setUrnaNumero] = useState('');
  const [propostas, setPropostas] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  // Form Step 3: Aceite de Regras
  const [hasAgreedRules, setHasAgreedRules] = useState(false);

  // Form Step 4: Comprovante
  const [registeredCandidate, setRegisteredCandidate] = useState<Candidato | null>(null);
  const [protocolCode, setProtocolCode] = useState('');
  const [timestampBrasilia, setTimestampBrasilia] = useState('');

  // Lista de colaboradores disponíveis para ajuda/teste rápido
  const unitEmployees = useMemo(() => {
    return INITIAL_EMPLOYEES.filter(e => e.unitId === unit.id);
  }, [unit.id]);

  const otherUnitEmployees = useMemo(() => {
    return INITIAL_EMPLOYEES.filter(e => e.unitId !== unit.id);
  }, [unit.id]);

  // Executa validação de elegibilidade e lotação
  const handleValidateIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputRe.trim() || !inputName.trim()) {
      setValidationResult({
        valid: false,
        status: 'not_found',
        message: 'Por favor, informe seu RE/Matrícula e seu Nome Completo para prosseguir.'
      });
      return;
    }

    const result = validateCandidateEligibility(
      inputRe,
      inputName,
      company.id,
      unit.id,
      INITIAL_EMPLOYEES,
      existingCandidates
    );

    setValidationResult(result);

    if (result.valid && result.employee) {
      // Prepara dados para a etapa 2
      setUrnaNome(result.employee.apelido || result.employee.name.split(' ')[0] + ' ' + (result.employee.name.split(' ')[1] || ''));
      setUrnaNumero(String(Math.floor(10 + Math.random() * 89)));
      setPropostas('Compromisso com a prevenção ativa de acidentes, ergonomia nos postos de trabalho e combate permanente a todas as formas de assédio (Lei 14.457/2022).');
      setCurrentStep(2);
    }
  };

  // Preenche dados para teste rápido
  const handleSelectQuickTest = (emp: EmployeeRecord) => {
    setInputRe(emp.matricula);
    setInputName(emp.name);
    setValidationResult(null);
  };

  // Conclui e homologa a candidatura
  const handleFinalizeRegistration = () => {
    if (!validationResult?.employee) return;

    const emp = validationResult.employee;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = `${formattedDate} às ${formattedTime} (BRT)`;
    const proto = `CIPA-INSC-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newCandidate: Candidato = {
      id: emp.matricula || `cand-${Date.now()}`,
      nome: emp.name,
      apelido: urnaNome.trim() || emp.apelido || emp.name,
      cargo: emp.cargo,
      setor: emp.setor,
      tempoEmpresa: 'Mais de 1 ano',
      dataAdmissao: emp.dataAdmissao,
      email: emp.email,
      matricula: emp.matricula,
      fotoUrl: fotoUrl || undefined,
      numero: urnaNumero || '10',
      propostas: propostas.trim(),
      votos: 0,
      status: 'confirmado',
      termoAceito: true,
      metodoInscricao: 'online',
      confirmadoEm: fullTimestamp
    };

    setRegisteredCandidate(newCandidate);
    setProtocolCode(proto);
    setTimestampBrasilia(fullTimestamp);
    setCurrentStep(4);

    if (onSuccess) {
      onSuccess(newCandidate);
    }
  };

  return (
    <div className={`w-full ${isStandalonePage ? 'min-h-screen bg-slate-100 py-8 px-4 flex items-center justify-center' : 'p-1'}`}>
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col text-slate-800">
        
        {/* CABEÇALHO INSTITUCIONAL */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-8">
            <Vote className="w-48 h-48 text-emerald-400" />
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Processo Eleitoral Oficial NR-05
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  Gestão 2026/2027
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Inscrição de Candidatos à CIPA
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-200/90 pt-0.5">
                <span className="font-bold flex items-center gap-1 text-white">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  {company.razaoSocial}
                </span>
                <span>•</span>
                <span>{unit.name}</span>
                <span>•</span>
                <span className="font-mono text-emerald-300">CNPJ: {unit.cnpj || company.cnpj}</span>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* BARRA DE PROGRESSO DE ETAPAS */}
          <div className="grid grid-cols-4 gap-2 pt-6">
            {[
              { num: 1, label: 'Identificação & Lotação' },
              { num: 2, label: 'Confirmação de Dados' },
              { num: 3, label: 'Regras de Campanha' },
              { num: 4, label: 'Comprovante Oficial' }
            ].map(step => (
              <div key={step.num} className="space-y-1">
                <div className={`h-1.5 rounded-full transition-all ${
                  currentStep >= step.num ? 'bg-emerald-400' : 'bg-slate-700/60'
                }`} />
                <span className={`text-[10px] font-bold block truncate ${
                  currentStep === step.num ? 'text-emerald-300' : 'text-slate-400'
                }`}>
                  {step.num}. {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL DAS ETAPAS */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto">

          {/* ============================================================ */}
          {/* ETAPA 1: CONFIRMAÇÃO DE IDENTIDADE E VALIDAÇÃO DE LOTAÇÃO   */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Validação de Elegibilidade Obrigatória (NR-05 Subitem 5.5)
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para garantir a conformidade legal e impedir que colaboradores de outras filiais se inscrevam em eleições alheias, digite abaixo o seu <strong>RE (Registro do Empregado / Matrícula)</strong> e seu <strong>Nome Completo</strong> conforme consta no cadastro do RH.
                </p>
              </div>

              <form onSubmit={handleValidateIdentity} className="space-y-4 max-w-xl mx-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    RE / Matrícula do Colaborador: *
                  </label>
                  <input
                    type="text"
                    value={inputRe}
                    onChange={(e) => {
                      setInputRe(e.target.value);
                      setValidationResult(null);
                    }}
                    placeholder="Ex: 179645 ou CLT-1024"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all uppercase"
                    autoFocus
                  />
                  <span className="text-[10px] text-slate-500">
                    Insira o número do seu registro funcional exatamente como no seu crachá ou holerite.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nome Completo do Colaborador: *
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => {
                      setInputName(e.target.value);
                      setValidationResult(null);
                    }}
                    placeholder="Ex: GUSTAVO FERREIRA DA CONCEICAO"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all uppercase"
                  />
                  <span className="text-[10px] text-slate-500">
                    Digite seu nome como está registrado na empresa.
                  </span>
                </div>

                {/* ALERTA DE ERRO OU BLOQUEIO DE UNIDADE */}
                {validationResult && !validationResult.valid && (
                  <div className={`p-4 rounded-2xl border transition-all animate-in fade-in duration-200 ${
                    validationResult.status === 'wrong_unit'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-start gap-3">
                      {validationResult.status === 'wrong_unit' ? (
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 text-xs">
                        <strong className="font-extrabold text-sm block">
                          {validationResult.status === 'wrong_unit' 
                            ? 'Acesso Bloqueado por Incompatibilidade de Lotação (NR-05)' 
                            : 'Validação Não Aprovada'}
                        </strong>
                        <p className="leading-relaxed">
                          {validationResult.message}
                        </p>

                        {validationResult.status === 'wrong_unit' && validationResult.employee && (
                          <div className="p-3 bg-white/80 rounded-xl border border-rose-200 space-y-1 text-[11px] font-mono">
                            <div>• Colaborador: <strong>{validationResult.employee.name}</strong></div>
                            <div>• Matrícula/RE: <strong>{validationResult.employee.matricula}</strong></div>
                            <div>• Unidade de Lotação: <strong>{validationResult.employeeUnit?.name || validationResult.employee.unitId}</strong></div>
                            <div>• CNPJ da Lotação: <strong>{validationResult.employeeUnit?.cnpj || validationResult.employeeCompany?.cnpj}</strong></div>
                            <div className="text-rose-700 font-bold pt-1">
                              ✕ Esta eleição pertence a: {unit.name} (CNPJ: {unit.cnpj || company.cnpj})
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Validar Identidade e Acessar Inscrição</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* CARD DE TESTE RÁPIDO PARA AVALIAÇÃO / DEMO */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Atalhos de Simulação e Teste de Bloqueio da NR-05:
                  </span>
                  <span className="text-[10px] text-slate-400">Clique para testar validações</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Colaboradores Aptos desta Unidade */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <strong className="text-emerald-950 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Colaboradores Lotados nesta Unidade ({unit.name}):
                    </strong>
                    <div className="flex flex-wrap gap-1.5">
                      {unitEmployees.slice(0, 4).map(emp => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleSelectQuickTest(emp)}
                          className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-left"
                          title={`Lotado em ${unit.name}`}
                        >
                          {emp.name.split(' ')[0]} {emp.name.split(' ')[1]} (RE: {emp.matricula})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colaboradores de OUTRAS Unidades (Para testar o bloqueio) */}
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                    <strong className="text-rose-950 font-bold text-[11px] flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Testar Bloqueio com Colaboradores de Outra Unidade:
                    </strong>
                    <div className="flex flex-wrap gap-1.5">
                      {otherUnitEmployees.slice(0, 3).map(emp => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleSelectQuickTest(emp)}
                          className="px-2 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-left"
                          title="Clique para testar a rejeição de outra filial"
                        >
                          {emp.name.split(' ')[0]} (RE: {emp.matricula})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ETAPA 2: CONFIRMAÇÃO DE DADOS & PERSONALIZAÇÃO DE CAMPANHA   */}
          {/* ============================================================ */}
          {currentStep === 2 && validationResult?.employee && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-950">
                      Identidade e Lotação Verificadas com Sucesso!
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Você está apto a registrar sua candidatura à CIPA nesta unidade.
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-900">
                  RE: {validationResult.employee.matricula}
                </span>
              </div>

              {/* DADOS CADASTRAIS CONFERIDOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Nome Completo:</span>
                  <strong className="text-slate-900">{validationResult.employee.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Cargo Oficial:</span>
                  <strong className="text-slate-900">{validationResult.employee.cargo}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Área / Setor:</span>
                  <strong className="text-slate-900">{validationResult.employee.setor}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">E-mail Corporativo:</span>
                  <strong className="text-slate-900 font-mono">{validationResult.employee.email}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Data de Admissão:</span>
                  <strong className="text-slate-900">{validationResult.employee.dataAdmissao}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Lotação Validada:</span>
                  <strong className="text-emerald-700">{unit.name}</strong>
                </div>
              </div>

              {/* PERSONALIZAÇÃO DE CAMPANHA / URNA */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Vote className="w-4 h-4 text-emerald-600" />
                  Identificação na Cédula Eleitoral e Propostas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Nome de Urna (Como deseja ser identificado na votação): *
                    </label>
                    <input
                      type="text"
                      value={urnaNome}
                      onChange={(e) => setUrnaNome(e.target.value)}
                      placeholder="Ex: GUSTAVO CONCEICAO"
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Número do Candidato: *
                    </label>
                    <input
                      type="text"
                      value={urnaNumero}
                      onChange={(e) => setUrnaNumero(e.target.value)}
                      placeholder="Ex: 10"
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Proposta de Trabalho na CIPA (Foco em prevenção, saúde e segurança): *
                  </label>
                  <textarea
                    rows={3}
                    value={propostas}
                    onChange={(e) => setPropostas(e.target.value)}
                    placeholder="Descreva suas motivações e propostas para a gestão da CIPA..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500">
                    Estas propostas serão exibidas aos eleitores durante o período de votação.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!urnaNome.trim() || !propostas.trim()}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Prosseguir para Leitura das Regras</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ETAPA 3: "LÊ COMO FAZ" - REGRAS DE CAMPANHA & ATRIBUIÇÕES    */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Código de Conduta Eleitoral · NR-05
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Regras de Campanha e Atribuições do Cipeiro
                </h2>
                <p className="text-xs text-slate-500">
                  Leia com atenção as diretrizes obrigatórias antes de formalizar sua candidatura.
                </p>
              </div>

              {/* CARDS O QUE PODE / O QUE NÃO PODE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* O QUE VOCÊ PODE FAZER */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm border-b border-emerald-200 pb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>O que você PODE fazer:</span>
                  </div>
                  <ul className="space-y-2 text-emerald-950/90 leading-relaxed text-[11px]">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Apresentar seu plano de trabalho</strong> aos colegas, sempre com foco na prevenção de acidentes e doenças no trabalho.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Circular pelas áreas da empresa</strong> para divulgar sua candidatura, com bom senso e respeito ao ambiente de trabalho.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Usar o WhatsApp pessoal</strong> para divulgar sua candidatura e propostas, desde que respeite todas as regras de convivência ética.</span>
                    </li>
                  </ul>
                </div>

                {/* O QUE NÃO PODE */}
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-3">
                  <div className="flex items-center gap-2 text-rose-950 font-extrabold text-sm border-b border-rose-200 pb-2">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>O que NÃO pode:</span>
                  </div>
                  <ul className="space-y-2 text-rose-950/90 leading-relaxed text-[11px]">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span><strong>Usar canais da empresa</strong> (e-mail corporativo em massa, Teams corporativo, murais e intranet sem autorização da comissão).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span><strong>Promover reuniões em horário de trabalho</strong> ou interromper atividades produtivas sem consentimento da gestão.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span><strong>Campanhas difamatórias</strong>, promessas fora do escopo da CIPA ou assédio eleitoral de qualquer natureza.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ATRIBUIÇÕES DO CIPEIRO E ESTABILIDADE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* VOCÊ SABIA O QUE CABE AO CIPEIRO? */}
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-xs">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Você sabia o que cabe ao Cipeiro?</span>
                  </div>
                  <p className="text-[11px] text-indigo-900/90 leading-relaxed">
                    • Realizar treinamento obrigatório de 20 horas antes do início do mandato;<br />
                    • Participar ativamente das reuniões mensais e controlar as atas;<br />
                    • Identificar riscos inerentes ao trabalho e elaborar o Mapa de Riscos;<br />
                    • Investigar incidentes e atuar firmemente nas ações de prevenção e combate a qualquer tipo de assédio (Lei 14.457/2022).
                  </p>
                </div>

                {/* GARANTIA DE ESTABILIDADE */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Garantia de Estabilidade Provisória (ADCT / NR-5)</span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    • <strong>Durante a eleição:</strong> Os colaboradores inscritos têm estabilidade desde a candidatura até a divulgação do resultado.<br />
                    • <strong>Se eleito:</strong> O cipeiro eleito goza de estabilidade no emprego de <strong>02 (dois) anos</strong> (1 ano de mandato + 1 ano subsequente à posse, nos termos do art. 10, II, "a" do ADCT).
                  </p>
                </div>
              </div>

              {/* ACEITE DO TERMO */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAgreedRules}
                    onChange={(e) => setHasAgreedRules(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-800 leading-relaxed font-semibold">
                    Declaro que li, compreendi e concordo integralmente com as regras de campanha eleitoral da NR-05 e do Código de Ética da empresa. Confirmo que estou apto e comprometo-me a cumprir com dedicação o mandato de cipeiro caso eleito.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeRegistration}
                  disabled={!hasAgreedRules}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Confirmar Minha Inscrição na CIPA</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ETAPA 4: COMPROVANTE OFICIAL DE INSCRIÇÃO                    */}
          {/* ============================================================ */}
          {currentStep === 4 && registeredCandidate && (
            <div className="space-y-6 text-center max-w-xl mx-auto py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Inscrição Homologada com Sucesso
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  Parabéns, {registeredCandidate.apelido || registeredCandidate.nome}!
                </h2>
                <p className="text-xs text-slate-600">
                  Sua candidatura para a <strong>CIPA Gestão 2026/2027</strong> foi registrada oficialmente no sistema.
                </p>
              </div>

              {/* CARD DO COMPROVANTE COM TOKEN CRIPTOGRÁFICO */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700">Comprovante de Inscrição Eleitoral</span>
                  <span className="font-mono text-emerald-700 font-bold">{protocolCode}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Candidato:</span>
                    <strong className="text-slate-900">{registeredCandidate.nome}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">RE / Matrícula:</span>
                    <strong className="text-slate-900 font-mono">{registeredCandidate.matricula}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cargo:</span>
                    <strong className="text-slate-900">{registeredCandidate.cargo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Número de Urna:</span>
                    <strong className="text-emerald-700 font-mono text-xs">Nº {registeredCandidate.numero}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Empresa:</span>
                    <strong className="text-slate-900">{company.razaoSocial}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Unidade / Lotação:</span>
                    <strong className="text-slate-900">{unit.name}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Timestamp: {timestampBrasilia}</span>
                  <span className="text-emerald-700 font-bold">Estabilidade Ativa (Art. 10 ADCT)</span>
                </div>
              </div>

              {/* ALERTA DE ENVIO DE E-MAIL */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2 text-left">
                <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  O <strong>Termo de Aceite das Regras</strong> e o comprovante foram enviados para <strong>{registeredCandidate.email}</strong>.
                </span>
              </div>

              {/* AÇÕES FINAIS */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comprovante</span>
                </button>

                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                  >
                    Concluir e Fechar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setInputRe('');
                      setInputName('');
                      setValidationResult(null);
                    }}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                  >
                    Nova Inscrição
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RODAPÉ OFICIAL DA PLATAFORMA */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>CIPA Expert Enterprise · Sistema Certificado NR-05 e Lei 14.457/2022</span>
          </div>
          <span className="font-mono text-[10px]">
            Unidade: {unit.id} · Token: {token || 'NR5-SECURE'}
          </span>
        </div>

      </div>
    </div>
  );
};

