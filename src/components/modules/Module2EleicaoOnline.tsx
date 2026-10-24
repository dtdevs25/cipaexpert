import React, { useState } from 'react';
import { Candidato, VotoAuditoria } from '../../types/cipa';
import { generateCipaDocument, GeneratedDocument } from '../../data/documentTemplates';
import { useCipa } from '../../context/CipaContext';
import { 
  Vote, 
  ShieldCheck, 
  Lock, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Hash, 
  Clock, 
  ChevronRight,
  User,
  Fingerprint,
  Printer,
  Check,
  RotateCcw
} from 'lucide-react';

interface Module2EleicaoOnlineProps {
  onOpenDocument: (doc: GeneratedDocument) => void;
  companyName: string;
  cnpj: string;
  totalEleitoresAptos?: number;
}

export const Module2EleicaoOnline: React.FC<Module2EleicaoOnlineProps> = ({
  onOpenDocument,
  companyName,
  cnpj,
  totalEleitoresAptos = 145
}) => {
  const { 
    candidatos, 
    castVote, 
    hasVoted, 
    getVoteReceipt, 
    currentUser,
    activeCompany,
    activeUnit
  } = useCipa();

  const [votosBrancosNulos, setVotosBrancosNulos] = useState<number>(3);
  const [matriculaVotante, setMatriculaVotante] = useState(
    currentUser?.role === 'eleitor' ? 'CLT-1042' : 'COLAB-4819'
  );
  const [candidatoSelecionadoId, setCandidatoSelecionadoId] = useState<string>(
    candidatos[0]?.id || 'branco'
  );
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  // Verifica se o usuário atual já votou no contexto persistente
  const jaVotou = hasVoted('eleicao-2026');
  const comprovanteSalvo = getVoteReceipt('eleicao-2026');

  // Logs simulados de auditoria imutável
  const [auditLogs, setAuditLogs] = useState<VotoAuditoria[]>([
    {
      id: 'aud-1',
      timestamp: '2026-10-10 09:12:44',
      hashComprovante: '9A7F41C2E8301B8D8F4E29A1009CF5B731',
      eleitorMatriculaMascarada: 'COLAB-***2',
      ipOrigemAnonimizado: '192.168.10.***',
      status: 'computado'
    },
    {
      id: 'aud-2',
      timestamp: '2026-10-10 09:15:10',
      hashComprovante: '3B8D991A54FE67C29A10DF88029A7B3E41',
      eleitorMatriculaMascarada: 'COLAB-***9',
      ipOrigemAnonimizado: '192.168.10.***',
      status: 'computado'
    },
    {
      id: 'aud-3',
      timestamp: '2026-10-10 09:21:05',
      hashComprovante: 'FE45A910CB881E93309B74CA6102DE4B92',
      eleitorMatriculaMascarada: 'COLAB-***1',
      ipOrigemAnonimizado: '192.168.10.***',
      status: 'computado'
    }
  ]);

  // Cálculos de votos e quorum
  const totalVotos = candidatos.reduce((acc, c) => acc + (c.votos || 0), 0) + votosBrancosNulos;
  const quorumMinimo = Math.floor(totalEleitoresAptos / 2) + 1; // 50% + 1
  const quorumAtingido = totalVotos >= quorumMinimo;
  const quorumPercentual = Math.min(100, Math.round((totalVotos / totalEleitoresAptos) * 100));

  // Ordenar candidatos por votos apurados
  const candidatosOrdenados = [...candidatos].sort((a, b) => (b.votos || 0) - (a.votos || 0));

  // Ação de votar
  const handleVotar = () => {
    if (!candidatoSelecionadoId) return;

    if (candidatoSelecionadoId === 'branco') {
      setVotosBrancosNulos((prev) => prev + 1);
    }

    const res = castVote(candidatoSelecionadoId, 'eleicao-2026');
    if (res.success && res.hash) {
      const novoRegistro: VotoAuditoria = {
        id: 'aud-' + (auditLogs.length + 1),
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        hashComprovante: res.hash,
        eleitorMatriculaMascarada: matriculaVotante.slice(0, 6) + '***' + matriculaVotante.slice(-1),
        ipOrigemAnonimizado: '172.20.1.***',
        status: 'computado'
      };
      setAuditLogs((prev) => [novoRegistro, ...prev]);
      setLocalFeedback('Voto registrado e auditado com sucesso na urna criptográfica!');
    } else {
      setLocalFeedback(res.message);
    }
  };

  const handleEmitirAtaEleicao = () => {
    const doc = generateCipaDocument(
      'ata_eleicao', 
      companyName || activeCompany.razaoSocial, 
      cnpj || activeCompany.cnpj, 
      new Date().toISOString(), 
      8
    );
    onOpenDocument(doc);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-150">
      
      {/* Module Top Bar: Verde Claro Padronizado */}
      <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <Vote className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Módulo 2 · Eleição Online Auditada & Urna Digital
            </h2>
            <p className="text-xs text-slate-500">
              {activeCompany.nomeFantasia} · {activeUnit.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEmitirAtaEleicao}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Emitir Ata de Apuração Oficial</span>
          </button>
        </div>
      </div>

      {/* Quorum and KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Votes */}
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between border border-slate-200">
          <div className="bg-emerald-50/80 px-4 py-3 border-b border-emerald-200/70 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Total de Votos</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Urna Fechada
            </span>
          </div>
          <div className="p-4 sm:p-5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalVotos}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              de {totalEleitoresAptos} aptos
            </span>
          </div>
        </div>

        {/* Quorum Status */}
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between border border-slate-200">
          <div className="bg-emerald-50/80 px-4 py-3 border-b border-emerald-200/70 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Quórum Legal (NR-5)</span>
            </span>
            <span
              className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold border ${
                quorumAtingido
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              {quorumAtingido ? 'Atingido (≥50%)' : 'Pendente'}
            </span>
          </div>
          <div className="p-4 sm:p-5 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {quorumPercentual}%
              </span>
              <span className="text-xs text-slate-500">
                Mínimo: {quorumMinimo} votos
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quorumAtingido ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${quorumPercentual}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Candidate */}
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between border border-slate-200">
          <div className="bg-emerald-50/80 px-4 py-3 border-b border-emerald-200/70 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Líder da Apuração</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              1º Lugar
            </span>
          </div>
          <div className="p-4 sm:p-5 space-y-1">
            <div className="text-sm font-bold text-slate-900 truncate">
              {candidatosOrdenados[0]?.nome || 'Aguardando votos'}
            </div>
            <p className="text-xs text-slate-500">
              {candidatosOrdenados[0]?.votos || 0} votos ({totalVotos > 0 ? Math.round(((candidatosOrdenados[0]?.votos || 0) / totalVotos) * 100) : 0}%)
            </p>
          </div>
        </div>

        {/* Security / Immutability */}
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between border border-slate-200">
          <div className="bg-emerald-50/80 px-4 py-3 border-b border-emerald-200/70 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Auditoria Digital</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Ativa
            </span>
          </div>
          <div className="p-4 sm:p-5 space-y-1">
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Urna Segura & Homologada</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              SHA-256 Zero-Knowledge Hash
            </p>
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Voting Booth & Real-time Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Voting Booth Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col border border-slate-200">
          <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-700" />
              <span>Cabine de Votação do Colaborador</span>
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Voto Secreto
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {jaVotou && comprovanteSalvo ? (
              /* Voto já realizado: exibe comprovante inviolável com hash */
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 border border-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Voto Computado com Sucesso!
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Seu voto foi registrado com sigilo absoluto e garantia de inviolabilidade criptográfica conforme a NR-5 e LGPD.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 text-[10px] uppercase">Eleitor</span>
                    <span className="font-bold text-emerald-400">{currentUser?.name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 text-[10px] uppercase">Data/Hora</span>
                    <span className="text-slate-300 text-[11px]">{comprovanteSalvo.timestamp}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase block">Hash do Comprovante</span>
                    <div className="p-2 bg-slate-800 rounded text-[10px] text-emerald-300 break-all border border-slate-700">
                      {comprovanteSalvo.hashComprovante}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    A escolha do candidato é protegida por desacoplamento de chave pública. Apenas o fato do voto e a auditoria foram registrados.
                  </span>
                </div>
              </div>
            ) : (
              /* Formulário interativo de votação */
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Matrícula do Eleitor
                  </label>
                  <input
                    type="text"
                    value={matriculaVotante}
                    onChange={(e) => setMatriculaVotante(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Conectado como: <strong>{currentUser?.name}</strong> ({currentUser?.roleLabel})
                  </p>
                </div>

                {/* Candidate Radio List */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Escolha seu Candidato:
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {candidatos.map((c) => (
                      <label
                        key={c.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          candidatoSelecionadoId === c.id
                            ? 'border-emerald-500 bg-emerald-50/70'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="candidato"
                          value={c.id}
                          checked={candidatoSelecionadoId === c.id}
                          onChange={() => setCandidatoSelecionadoId(c.id)}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 truncate">{c.nome}</span>
                            <span className="font-mono text-xs font-semibold text-slate-600 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                              Nº {c.numero}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{c.cargo} · {c.setor}</p>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
                            "{c.propostas}"
                          </p>
                        </div>
                      </label>
                    ))}

                    {/* White/Null Vote Option */}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        candidatoSelecionadoId === 'branco'
                          ? 'border-slate-500 bg-slate-100'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="candidato"
                        value="branco"
                        checked={candidatoSelecionadoId === 'branco'}
                        onChange={() => setCandidatoSelecionadoId('branco')}
                        className="text-slate-600 focus:ring-slate-500"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Votar em Branco / Nulo
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Vote Button */}
                <button
                  type="button"
                  onClick={handleVotar}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar e Registrar Voto na Urna</span>
                </button>

                {localFeedback && (
                  <p className="text-xs font-bold text-center text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    {localFeedback}
                  </p>
                )}
              </>
            )}

          </div>
        </div>

        {/* Right: Apuração Oficial e Classificação de Eleitos (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-200/70 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                Classificação Oficial dos Candidatos (NR-5)
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200">
                {totalVotos} votos apurados
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">

            {/* Candidates Ranked Table */}
            <div className="space-y-2.5">
              {candidatosOrdenados.map((c, index) => {
                const percentual = totalVotos > 0 ? Math.round(((c.votos || 0) / totalVotos) * 100) : 0;
                const isTitular = index < 3; // Top 3 titulares
                const isSuplente = index >= 3 && index < 5; // Next 2 suplentes

                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}º
                        </span>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{c.nome}</span>
                          <span className="text-[11px] text-slate-500">
                            {c.cargo} · {c.setor} · {c.tempoEmpresa} de empresa
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {c.votos || 0} votos
                        </span>
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {percentual}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar and Status Tag */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                          isTitular
                            ? 'bg-emerald-100 text-emerald-800'
                            : isSuplente
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isTitular ? 'Eleito Titular' : isSuplente ? 'Eleito Suplente' : 'Não Eleito'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Audit Trail Snippet */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-700" />
                <span>Trilha de Auditoria Criptográfica (Logs Recentes)</span>
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-slate-900 text-slate-300 text-[10px] font-mono flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-400">{log.timestamp}</span>
                    <span className="text-emerald-400 font-bold truncate">{log.hashComprovante}</span>
                    <span className="text-slate-400">{log.eleitorMatriculaMascarada}</span>
                  </div>
                ))}
              </div>
            </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
