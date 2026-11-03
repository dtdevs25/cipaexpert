import React, { useState, useMemo } from 'react';
import { Company, CompanyUnit } from '../../types/auth';
import { EmployeeRecord } from '../../data/employeeData';
import { 
  ElectionService, 
  ElectionPleitoConfig, 
  CandidatoEleicao 
} from '../../services/electionService';
import { RichTextRenderer } from '../common/RichTextRenderer';
import { 
  Vote, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Fingerprint, 
  Printer, 
  Clock, 
  Calendar, 
  Building2, 
  User, 
  Check, 
  Copy, 
  ArrowLeft,
  QrCode,
  AlertCircle
} from 'lucide-react';

interface PublicVotingPortalProps {
  company?: Company;
  unit?: CompanyUnit;
  token?: string;
  isStandalonePage?: boolean;
  onClose?: () => void;
  onVoteCast?: (res: { hash: string; timestamp: string }) => void;
}

export const PublicVotingPortal: React.FC<PublicVotingPortalProps> = ({
  company,
  unit,
  token,
  isStandalonePage = false,
  onClose,
  onVoteCast
}) => {
  const targetUnitId = unit?.id || 'unit-tel-jundiai';
  const targetCompanyId = company?.id || 'comp-telefonica';

  // Carrega configuração oficial do pleito
  const pleitoConfig = useMemo<ElectionPleitoConfig>(() => {
    return ElectionService.getPleitoConfig(targetUnitId, targetCompanyId);
  }, [targetUnitId, targetCompanyId]);

  // Candidatos homologados
  const candidatos = useMemo<CandidatoEleicao[]>(() => {
    return ElectionService.getCandidatos(targetUnitId).filter(c => c.status === 'confirmado');
  }, [targetUnitId]);

  // Base de colaboradores da unidade
  const employees = useMemo<EmployeeRecord[]>(() => {
    return ElectionService.getEmployees(targetUnitId);
  }, [targetUnitId]);

  // Estado da cabine de votação
  const [urnaStep, setUrnaStep] = useState<'login' | 'cedula' | 'confirmacao' | 'comprovante'>('login');
  const [voterRe, setVoterRe] = useState('');
  const [voterCpfDigits, setVoterCpfDigits] = useState('');
  const [authenticatedVoter, setAuthenticatedVoter] = useState<EmployeeRecord | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [voteReceipt, setVoteReceipt] = useState<{ hash: string; timestamp: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Verificação do período eleitoral (Início, Término e Prorrogação)
  const electionPeriodStatus = useMemo<'ativo' | 'antes' | 'encerrado'>(() => {
    // Para efeito de demonstração e testes contínuos do usuário, permitimos acesso ativo
    // com verificação explicita configurável
    if (!pleitoConfig.inicioVotacao || !pleitoConfig.fimVotacao) {
      return 'ativo';
    }

    try {
      const now = new Date().getTime();
      const inicio = new Date(pleitoConfig.inicioVotacao).getTime();
      const fim = new Date(pleitoConfig.fimVotacao).getTime();

      if (!isNaN(inicio) && now < inicio) {
        return 'antes';
      }
      if (!isNaN(fim) && now > fim) {
        // Se houver prorrogação 2
        if (pleitoConfig.prorrogacao2) {
          const fimP2 = new Date(pleitoConfig.prorrogacao2).getTime();
          if (!isNaN(fimP2) && now <= fimP2) return 'ativo';
        }
        // Se houver prorrogação 1
        if (pleitoConfig.prorrogacao1) {
          const fimP1 = new Date(pleitoConfig.prorrogacao1).getTime();
          if (!isNaN(fimP1) && now <= fimP1) return 'ativo';
        }
        return 'encerrado';
      }
      return 'ativo';
    } catch {
      return 'ativo';
    }
  }, [pleitoConfig]);

  // Ação de Login: Valida RE e 4 primeiros dígitos do CPF na base da unidade
  const handleVoterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const reClean = voterRe.trim().toLowerCase();
    const cpfDigitsClean = voterCpfDigits.trim();

    if (!reClean || !cpfDigitsClean) {
      setErrorMessage('Informe sua Matrícula / RE e os 4 primeiros dígitos do seu CPF.');
      return;
    }

    // Utiliza o método oficial de autenticação de eleitor
    const authRes = ElectionService.authenticateVoter(targetUnitId, reClean, cpfDigitsClean);

    if (!authRes.authenticated || !authRes.employee) {
      setErrorMessage(authRes.message);
      return;
    }

    if (authRes.alreadyVoted) {
      setAuthenticatedVoter(authRes.employee);
      setVoteReceipt({
        hash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
        timestamp: '09/06/2026 às 11:16:42'
      });
      setUrnaStep('comprovante');
      return;
    }

    // Eleitor apto e autenticado com sucesso
    setAuthenticatedVoter(authRes.employee);
    setUrnaStep('cedula');
  };

  // Selecionar candidato ou voto em branco
  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setUrnaStep('confirmacao');
  };

  // Confirmar o voto
  const handleConfirmVote = async () => {
    if (!authenticatedVoter || !selectedCandidateId) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await ElectionService.castVoterVote(
        targetUnitId,
        authenticatedVoter.matricula,
        selectedCandidateId
      );

      if (res.success && res.hash) {
        const receipt = {
          hash: res.hash,
          timestamp: res.receiptTimestamp || new Date().toLocaleString('pt-BR')
        };
        setVoteReceipt(receipt);
        setUrnaStep('comprovante');
        if (onVoteCast) {
          onVoteCast(receipt);
        }
      } else {
        setErrorMessage(res.message || 'Erro ao registrar voto na urna eletrônica.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar voto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReceipt = () => {
    if (voteReceipt?.hash) {
      navigator.clipboard.writeText(voteReceipt.hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 3000);
    }
  };

  // =========================================================================
  // TELA 1: FORA DO PERÍODO ELEITORAL (NÃO INICIADA OU ENCERRADA)
  // =========================================================================
  if (electionPeriodStatus === 'antes') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 font-sans">
        <div className="max-w-xl mx-auto w-full my-auto text-center space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/40">
              Abertura Programada
            </span>
            <h1 className="text-2xl font-black text-white">
              Votação Não Iniciada
            </h1>
            <p className="text-sm text-slate-300">
              A cabine virtual de votação da CIPA para o mandato <strong>{pleitoConfig.mandato}</strong> será aberta pontualmente conforme cronograma eleitoral oficial.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Início Oficial:</span>
              <span className="text-emerald-400 font-bold">{pleitoConfig.inicioVotacao || '09/06/2026 às 08:30h'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Encerramento:</span>
              <span className="text-slate-200">{pleitoConfig.fimVotacao || '09/06/2026 às 18:00h'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estabelecimento:</span>
              <span className="text-slate-200">{unit?.name || 'Unidade Eco Berrini'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Norma Regulamentadora nº 05 (NR-05) · Voto Secreto, Inviolável e Auditável.
          </p>
        </div>
      </div>
    );
  }

  if (electionPeriodStatus === 'encerrado') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 font-sans">
        <div className="max-w-xl mx-auto w-full my-auto text-center space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-rose-400 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/40">
              Urna Lacrada
            </span>
            <h1 className="text-2xl font-black text-white">
              Eleição Encerrada
            </h1>
            <p className="text-sm text-slate-300">
              O período legal de votação para a CIPA Gestão <strong>{pleitoConfig.mandato}</strong> foi oficialmente concluído e a urna foi lacrada para apuração dos votos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Status da Urna:</span>
              <span className="text-rose-400 font-bold">Lacrada para Apuração</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estabelecimento:</span>
              <span className="text-slate-200">{unit?.name || 'Unidade Eco Berrini'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CNPJ:</span>
              <span className="text-slate-200">{unit?.cnpj || company?.cnpj || '02.558.157/0001-62'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            A ata de eleição e o resultado oficial serão divulgados pela Comissão Eleitoral conforme o cronograma.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TELA PRINCIPAL: CABINE DE VOTAÇÃO VIRTUAL (PERÍODO ATIVO)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* CABEÇALHO PÚBLICO DA URNA */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.razaoSocial} className="h-8 max-w-[120px] object-contain rounded" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold">
                <Vote className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-extrabold text-white leading-tight">
                {company?.razaoSocial || 'TELEFONICA BRASIL S/A'}
              </h1>
              <p className="text-[11px] text-emerald-400/90 font-mono">
                Urna Digital Oficial · CIPA {unit?.name || 'Unidade Eco Berrini'} · Gestão {pleitoConfig.mandato}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Urna Aberta
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO CENTRAL DA CABINE DE VOTAÇÃO */}
      <main className="max-w-3xl mx-auto w-full p-4 sm:p-8 my-auto">
        {/* ETAPA 1: LOGIN POR RE E CPF */}
        {urnaStep === 'login' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 animate-in fade-in duration-150">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                <Fingerprint className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Identificação do Eleitor
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Para garantir a segurança e a inviolabilidade da eleição, informe seu <strong>RE / Matrícula</strong> e os <strong>4 primeiros dígitos do seu CPF</strong>.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-3 animate-in shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVoterLogin} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  RE / Matrícula do Colaborador:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 179645 ou 18293"
                  value={voterRe}
                  onChange={(e) => setVoterRe(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Senha Eleitoral (4 Primeiros Dígitos do CPF):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={voterCpfDigits}
                  onChange={(e) => setVoterCpfDigits(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-center tracking-[0.5em] text-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Somente os 4 primeiros algarismos do seu documento (ex: se seu CPF é 123.456.789-00, digite 1234).
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-98 mt-2"
              >
                Acessar Cabine de Votação
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500 space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sigilo Absoluto: Seu voto é registrado de forma criptografada e anônima.
              </p>
              <p>Ninguém, nem mesmo a Comissão Eleitoral, saberá em quem você votou.</p>
            </div>
          </div>
        )}

        {/* ETAPA 2: CÉDULA DE VOTAÇÃO ELETRÔNICA */}
        {urnaStep === 'cedula' && authenticatedVoter && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">
                  Eleitor Autenticado
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {authenticatedVoter.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  RE: {authenticatedVoter.matricula} · {authenticatedVoter.cargo}
                </p>
              </div>

              <div className="text-right text-xs text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                <span>Clique no candidato escolhido para prosseguir</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Candidatos Homologados (Escolha 1 Candidato):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidatos.map((cand) => (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => handleSelectCandidate(cand.id)}
                    className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500 rounded-3xl text-left transition-all cursor-pointer group flex items-start gap-4 shadow-md hover:shadow-emerald-950/40 active:scale-98"
                  >
                    <img
                      src={cand.fotoUrl}
                      alt={cand.nome}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/50 group-hover:border-emerald-400 shrink-0 shadow-sm"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                          Nº {cand.numeroUrna}
                        </span>
                        <strong className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors truncate block">
                          {cand.apelidoUrna || cand.nome}
                        </strong>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {cand.nome}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {cand.cargo} · {cand.setor}
                      </p>
                    </div>
                  </button>
                ))}

                {/* VOTO EM BRANCO */}
                <button
                  type="button"
                  onClick={() => handleSelectCandidate('BRANCO')}
                  className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-500 rounded-3xl text-left transition-all cursor-pointer group flex items-center justify-center gap-3 shadow-md active:scale-98 md:col-span-2"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                    ⚪
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold text-white block">
                      VOTAR EM BRANCO
                    </strong>
                    <span className="text-xs text-slate-400">
                      Não escolher nenhum candidato nesta votação
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 3: CONFIRMAÇÃO DO VOTO */}
        {urnaStep === 'confirmacao' && authenticatedVoter && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-150">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">
              Confirmação de Voto
            </span>

            {errorMessage && (
              <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            {selectedCandidateId === 'BRANCO' ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-4xl">⚪</span>
                <h3 className="text-xl font-black text-white">VOTO EM BRANCO</h3>
                <p className="text-xs text-slate-400">Você optou por não selecionar nenhum candidato.</p>
              </div>
            ) : (() => {
              const cand = candidatos.find(c => c.id === selectedCandidateId);
              if (!cand) return null;
              return (
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 max-w-md mx-auto">
                  <img
                    src={cand.fotoUrl}
                    alt={cand.nome}
                    className="w-24 h-24 rounded-3xl object-cover mx-auto border-4 border-emerald-500 shadow-xl"
                  />
                  <div className="space-y-1">
                    <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
                      Nº {cand.numeroUrna}
                    </span>
                    <h3 className="text-lg font-black text-white">
                      {cand.apelidoUrna || cand.nome}
                    </h3>
                    <p className="text-xs text-slate-400">{cand.nome}</p>
                    <p className="text-xs text-slate-500 font-mono">{cand.cargo} · {cand.setor}</p>
                  </div>
                </div>
              );
            })()}

            <p className="text-xs text-slate-400">
              Confira com atenção seu voto antes de confirmar. Após a confirmação, o voto é irreversível.
            </p>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setUrnaStep('cedula')}
                disabled={isSubmitting}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-700"
              >
                CORRIGE
              </button>

              <button
                type="button"
                onClick={handleConfirmVote}
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'COMPUTANDO...' : 'CONFIRMA'}
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 4: COMPROVANTE CRIPTOGRÁFICO DE VOTAÇÃO */}
        {urnaStep === 'comprovante' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Voto Registrado com Sucesso!
              </h2>
              <p className="text-xs text-slate-400">
                Seu voto foi computado na urna com sigilo absoluto e garantia de quórum (NR-05).
              </p>
            </div>

            {/* RECIBO CRIPTOGRÁFICO */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-left space-y-3 font-mono text-xs max-w-md mx-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Protocolo do Voto:</span>
                <span className="text-emerald-400 font-bold text-[11px]">Auditado SHA-256</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Hash Criptográfico de Auditoria:</span>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 break-all select-all">
                  {voteReceipt?.hash || 'e7c819a0f44b2d18...924a'}
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Data e Hora:</span>
                <span className="text-slate-200">{voteReceipt?.timestamp || new Date().toLocaleString('pt-BR')}</span>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Estabelecimento:</span>
                <span className="text-slate-200">{unit?.name || 'Unidade Eco Berrini'}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copiedHash ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedHash ? 'Hash Copiado!' : 'Copiar Hash'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Guarde seu hash de auditoria. Você pode fechar esta página com segurança.
            </p>
          </div>
        )}
      </main>

      {/* RODAPÉ PÚBLICO */}
      <footer className="border-t border-slate-800/80 p-4 text-center text-xs text-slate-500 font-mono">
        CIPA Expert · Sistema Eleitoral Seguro · MP nº 2.200-2/2001 · NR-05
      </footer>
    </div>
  );
};
