import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Calculator, 
  Vote, 
  FileSignature, 
  CheckCircle2, 
  Users, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  Layers, 
  Building2, 
  Check, 
  Clock, 
  FileCheck, 
  HardHat, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  Bell, 
  CalendarCheck, 
  RotateCw, 
  FileText, 
  BadgeCheck, 
  Zap, 
  Leaf, 
  CreditCard,
  ShoppingCart
} from 'lucide-react';
import { CipaModuleId } from '../types/cipa';
import { 
  PurchaseModal, 
  getElectionPriceByVoters, 
  VOTER_TIERS 
} from './PurchaseModal';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin
}) => {
  // Billing cycle toggle
  const [billingPeriod, setBillingPeriod] = useState<'mensal' | 'anual'>('anual');

  // Voter count on landing page election card
  const [voterCount, setVoterCount] = useState<number>(250);

  // Interactive FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Flip card mobile toggle states
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseInitialModules, setPurchaseInitialModules] = useState<CipaModuleId[]>([
    'dimensionamento',
    'eleicao',
    'gestao'
  ]);

  const toggleCardFlip = (cardKey: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const handleOpenPurchase = (
    modules: CipaModuleId[] = ['dimensionamento', 'eleicao', 'gestao']
  ) => {
    setPurchaseInitialModules(modules);
    setIsPurchaseModalOpen(true);
  };

  const faqs = [
    {
      q: 'Como funcionam os Pacotes de Eleição Avulsa por número de votantes?',
      a: 'Se a sua organização precisa realizar a eleição pontual de uma filial sem contratar uma assinatura mensal de 12 meses, você pode adquirir o Pacote de Eleição Avulsa por Faixa de Votantes (Até 50, Até 250, Até 1.000 ou Acima de 1.000 colaboradores). É um pagamento único por eleição, com urna eletrônica auditada, voto secreto criptografado, acompanhamento de quórum ao vivo, geração automática de todas as atas e guarda legal por 5 anos.'
    },
    {
      q: 'A eleição online da CIPA tem validade jurídica perante o MTE e fiscalizações?',
      a: 'Sim, 100%! O sistema CIPA Expert atende com rigor aos itens 5.5 e subitens da Norma Regulamentadora NR-5 (Portaria MTP nº 4.219/2022). A votação online garante escrutínio secreto, unicidade de voto por matrícula, apuração auditável com hash criptográfico SHA-256 e guarda permanente de registros digitais.'
    },
    {
      q: 'Como a plataforma atende à Lei Federal 14.457/2022 sobre combate ao assédio no trabalho?',
      a: 'A Lei 14.457/2022 transformou a comissão na Comissão Interna de Prevenção de Acidentes e Assédio. Nosso Módulo 3 já conta com pautas obrigatórias para as 12 reuniões mensais dedicadas à prevenção e combate ao assédio sexual e moral, planos de ação preventivos 5W2H e registro formal de conformidade.'
    },
    {
      q: 'A assinatura digital integrada elimina a necessidade de imprimir papéis físicos?',
      a: 'Sim! Todas as atas e editais gerados no CIPA Expert contam com assinatura eletrônica na tela com validade jurídica comprovada pela Medida Provisória nº 2.200-2/2001 e pela Lei nº 14.063/2020, com carimbo de tempo e hash de integridade inviolável.'
    },
    {
      q: 'O sistema funciona para consultorias de SST e empresas com múltiplas filiais (Multi-Empresas)?',
      a: 'Perfeitamente. O CIPA Expert possui arquitetura multi-empresas e multi-unidades, permitindo gerenciar matriz e filiais em um único painel centralizado, delegando acessos específicos para Gestores de Unidade e Técnicos de Segurança de cada localidade.'
    },
    {
      q: 'Como funcionam os lembretes e mensagens para não perder prazos legais?',
      a: 'O sistema possui um motor inteligente de alertas que calcula as datas oficiais da NR-5 e envia notificações automáticas para que sua equipe nunca perca os prazos de convocação (60 dias), inscrições, votação e reuniões mensais.'
    }
  ];

  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">

      {/* HERO SECTION - Começando a partir de 'A gestão da CIPA...' com maior largura */}
      <section className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200">
        
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>SISTEMA 100% DIGITAL E ONLINE · ZERO PAPEL & CONFORMIDADE REGULATÓRIA</span>
          </div>

          {/* Headline começando a partir de 'A gestão da CIPA...', com maior largura horizontal */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.12] max-w-5xl lg:max-w-6xl mx-auto text-balance">
            A gestão da CIPA <span className="text-emerald-600">100% digital</span> que sua empresa merece.
          </h1>

          {/* Frase abaixo ocupando um pouco mais de espaço na tela em largura */}
          <p className="text-base sm:text-xl text-slate-600 max-w-4xl lg:max-w-5xl mx-auto leading-relaxed text-balance">
            Esqueça atas impressas em pastas perdidas, cédulas manuais de votação e o pânico de prazos vencidos. O <strong>CIPA Expert</strong> é a plataforma online que automatiza o dimensionamento normativo por CNAE, realiza eleições digitais seguras e gerencia os 12 meses de mandato com assinatura eletrônica e alertas automáticos — <strong>tudo no mesmo sistema</strong>.
          </p>

          {/* Quick value badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold text-slate-700 max-w-5xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Dimensionamento por CNAE
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-xs">
              <Vote className="w-3.5 h-3.5 text-emerald-600" />
              Eleição Online & Urna Criptográfica
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-xs">
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
              Lembretes & Mensagens de Prazos
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-xs">
              <FileSignature className="w-3.5 h-3.5 text-emerald-600" />
              Assinatura Digital MP 2.200-2
            </span>
          </div>

          {/* Direct CTA to Pricing */}
          <div className="pt-2">
            <a
              href="#planos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Conhecer Planos · Adquira Já</span>
            </a>
          </div>

          {/* Mockup Preview Card */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800 text-left space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-mono text-slate-400 ml-2 truncate">
                    cipaexpert.com.br · Gestão Digital da CIPA (NR-5 & Lei 14.457/22)
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ambiente Online Auditado SHA-256</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                <div className="md:col-span-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                  <div className="text-[10px] uppercase font-mono font-bold text-slate-500 px-2">Empresa Ativa</div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 font-bold text-white text-xs truncate">
                    Indústrias Alfa Brasil S.A.
                  </div>
                  <div className="space-y-1 pt-2">
                    <div className="p-2 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800 text-[11px] font-semibold flex items-center justify-between">
                      <span>Módulo 1: Dimensionamento</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="p-2 rounded bg-slate-900 text-slate-300 text-[11px] font-semibold flex items-center justify-between">
                      <span>Módulo 2: Eleição Online</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="p-2 rounded bg-slate-900 text-slate-300 text-[11px] font-semibold flex items-center justify-between">
                      <span>Módulo 3: Gestão & Atas</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-9 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                      <span className="text-[11px] text-slate-400 block">Quórum Eleitoral (NR-5)</span>
                      <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">79% Válido</span>
                      <span className="text-[10px] text-slate-400 block">114 votos computados</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                      <span className="text-[11px] text-slate-400 block">Dimensionamento CIPA</span>
                      <span className="text-xl font-bold font-mono text-white tabular-nums">8 Membros</span>
                      <span className="text-[10px] text-slate-400 block">Paridade Empregador x Empregados</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                      <span className="text-[11px] text-slate-400 block">Atas & Assinaturas</span>
                      <span className="text-xl font-bold font-mono text-sky-400 tabular-nums">100% em Dia</span>
                      <span className="text-[10px] text-slate-400 block">Validade MP 2.200-2</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Editais, portarias, atas de posse e planos de ação centralizados em um só lugar.</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Zero Papel
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* CENTRAL DE GESTÃO: LEMBRETES, ATAS, 5W2H E ASSINATURA TUDO NO MESMO SISTEMA */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest font-mono">
              GESTÃO INTEGRADA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Tudo o que sua CIPA precisa, exatamente no mesmo sistema
            </h2>
            <p className="text-sm text-slate-600">
              Chega de usar planilhas dispersas, emails esquecidos e aplicativos desconectados. O CIPA Expert centraliza cada fase do mandato.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Lembretes & Mensagens</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O sistema dispara avisos automáticos para você nunca perder nenhum prazo legal (60 dias, inscrições, votação e reuniões).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Agenda de Reuniões</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Agenda todas as 12 reuniões ordinárias anuais e sessões extraordinárias da CIPA, notificando todos os cipeiros convocados.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Planos de Ação 5W2H</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cria e acompanha medidas preventivas contra acidentes e assédio com responsáveis, prazos e status em tempo real.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileSignature className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Assinatura Digital Integrada</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Colete e valide as assinaturas eletrônicas com validade jurídica (MP 2.200-2) direto na tela, sem sair do sistema.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SUÍTE MODULAR COM 3D FLIP CARDS */}
      <section id="modulos" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest font-mono">
            SUÍTE MODULAR COMPLETA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Os 3 Módulos Independentes
          </h2>
          <p className="text-sm text-slate-600">
            <strong>Passe o mouse (ou toque no card)</strong> para ver na parte de trás os documentos oficiais gerados por cada módulo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* FLIP CARD 1 */}
          <div 
            onClick={() => toggleCardFlip('mod1')}
            className="perspective-1000 group min-h-[460px] cursor-pointer"
          >
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
              flippedCards['mod1'] ? 'rotate-y-180' : 'group-hover:rotate-y-180'
            }`}>
              
              {/* FRONT */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase">Módulo 1</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">
                      Dimensionamento & Cronograma
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cruza o CNAE da sua empresa e número de colaboradores para calcular paritariamente os titulares e suplentes da NR-5 ou indicar a necessidade de Designado de CIPA.
                  </p>
                  
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Classificação automática de Grau de Risco (1 a 4)</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Prazos regressivos oficiais (60, 55, 45 e 30 dias)</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Disparo de lembretes e mensagens de alerta</span></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    Passe o mouse para ver documentos gerados
                  </span>
                  <span>↻</span>
                </div>
              </div>

              {/* BACK */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">Documentos Oficiais Gerados</span>
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  
                  <h4 className="text-sm font-bold text-white">
                    Editais & Atas Emitidos Automaticamente:
                  </h4>

                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Edital de Convocação de Eleição</strong>
                        <span className="text-[11px] text-slate-400 font-mono">NR-5 Item 5.5.1 · Com antecedência de 60 dias</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Portaria da Comissão Eleitoral (CE)</strong>
                        <span className="text-[11px] text-slate-400 font-mono">NR-5 Item 5.5.2 · Composição paritária</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Edital de Inscrição de Candidatos</strong>
                        <span className="text-[11px] text-slate-400 font-mono">NR-5 Item 5.5.3 · Prazo mínimo de 15 dias</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Ata de Instalação e Posse da CIPA</strong>
                        <span className="text-[11px] text-slate-400 font-mono">NR-5 Item 5.5.10 · 1º dia útil após mandato</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 text-[11px] text-emerald-400 font-mono flex items-center justify-between">
                  <span>Pronto para impressão ou assinatura digital</span>
                  <span>✓ 100% Válido</span>
                </div>
              </div>

            </div>
          </div>

          {/* FLIP CARD 2 */}
          <div 
            onClick={() => toggleCardFlip('mod2')}
            className="perspective-1000 group min-h-[460px] cursor-pointer"
          >
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
              flippedCards['mod2'] ? 'rotate-y-180' : 'group-hover:rotate-y-180'
            }`}>
              
              {/* FRONT */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Vote className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase">Módulo 2</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">
                      Eleição Online & Urna Criptográfica
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistema 100% digital e seguro de votação. Os colaboradores votam pelo celular ou computador corporativo, com sigilo de voto e quórum em tempo real.
                  </p>
                  
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Quórum Eleitoral de 50%+1 automático (Item 5.5.4)</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Comprovante de voto individual com hash SHA-256</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Apuração com desempate por tempo de empresa</span></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    Passe o mouse para ver documentos gerados
                  </span>
                  <span>↻</span>
                </div>
              </div>

              {/* BACK */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">Documentos Oficiais Gerados</span>
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  
                  <h4 className="text-sm font-bold text-white">
                    Registros da Eleição Digital Emitidos:
                  </h4>

                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Ata de Eleição e Apuração dos Votos</strong>
                        <span className="text-[11px] text-slate-400 font-mono">NR-5 Item 5.5.4 a 5.5.9 · Classificação de eleitos</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Comprovante de Votação com Hash SHA-256</strong>
                        <span className="text-[11px] text-slate-400 font-mono">Emitido em tempo real para cada colaborador</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Relatório de Trilha de Auditoria Digital</strong>
                        <span className="text-[11px] text-slate-400 font-mono">Inviolável · Registros cronológicos de cada voto</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Cédula Oficial Homologada de Candidatos</strong>
                        <span className="text-[11px] text-slate-400 font-mono">Com foto, setor, cargo e propostas</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 text-[11px] text-emerald-400 font-mono flex items-center justify-between">
                  <span>Auditoria permanente contra impugnação</span>
                  <span>✓ Blindado</span>
                </div>
              </div>

            </div>
          </div>

          {/* FLIP CARD 3 */}
          <div 
            onClick={() => toggleCardFlip('mod3')}
            className="perspective-1000 group min-h-[460px] cursor-pointer"
          >
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
              flippedCards['mod3'] ? 'rotate-y-180' : 'group-hover:rotate-y-180'
            }`}>
              
              {/* FRONT */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <FileSignature className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase">Módulo 3</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">
                      Gestão Contínua, 5W2H & Assinatura Digital
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Acompanhamento completo dos 12 meses de mandato: emissão de atas mensais com pauta de combate ao assédio, calendário de reuniões, planos 5W2H e pad digital.
                  </p>
                  
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>12 Atas mensais ordinárias com pauta da Lei 14.457/22</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Calendário inteligente com lembretes automáticos e SIPAT</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Assinatura eletrônica na tela conforme MP 2.200-2</span></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    Passe o mouse para ver documentos gerados
                  </span>
                  <span>↻</span>
                </div>
              </div>

              {/* BACK */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">Documentos Oficiais Gerados</span>
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  
                  <h4 className="text-sm font-bold text-white">
                    Gestão dos 12 Meses de Mandato:
                  </h4>

                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">12 Atas Mensais Ordinárias da CIPA</strong>
                        <span className="text-[11px] text-slate-400 font-mono">NR-5 Item 5.6.1 · Pauta obrigatória de combate ao assédio</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Atas de Reuniões Extraordinárias</strong>
                        <span className="text-[11px] text-slate-400 font-mono">NR-5 Item 5.6.2 · Para acidentes graves ou risco iminente</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Planos de Ação 5W2H com Evidências</strong>
                        <span className="text-[11px] text-slate-400 font-mono">Medidas preventivas com status, prazos e custos</span>
                      </div>
                    </li>
                    <li className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Certificados de Assinatura Digital MP 2.200-2</strong>
                        <span className="text-[11px] text-slate-400 font-mono">Assinado na tela com carimbo e hash criptográfico</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 text-[11px] text-emerald-400 font-mono flex items-center justify-between">
                  <span>Todas as atas arquivadas no mesmo sistema</span>
                  <span>✓ Sem Papéis</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* ÁREA DE PLANOS & COMPRA DOS MÓDULOS */}
      <section id="planos" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest font-mono">
              CONTRATAÇÃO ONLINE FLEXÍVEL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Planos & Módulos para Cada Necessidade
            </h2>
            <p className="text-sm text-slate-600">
              Contrate apenas os módulos necessários ou a suíte completa CIPA 360° para a gestão anual da sua organização.
            </p>

            {/* Toggle Mensal / Anual */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-medium ${billingPeriod === 'mensal' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                Faturamento Mensal
              </span>
              <button
                type="button"
                onClick={() => setBillingPeriod(billingPeriod === 'mensal' ? 'anual' : 'mensal')}
                className="w-12 h-6 bg-slate-900 rounded-full p-1 transition-colors relative cursor-pointer"
              >
                <div
                  className={`w-4 h-4 bg-emerald-400 rounded-full transition-transform ${
                    billingPeriod === 'anual' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
              <span className={`text-xs font-medium flex items-center gap-1 ${billingPeriod === 'anual' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                <span>Faturamento Anual</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -20% OFF
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* PLANO MÓDULO 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Módulo 1 Avulso</h3>
                  <p className="text-[11px] text-slate-500">Dimensionamento & Cronograma</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                      R$ {billingPeriod === 'anual' ? '119' : '149'}
                    </span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Para dimensionar e emitir editais</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Cálculo por CNAE e Grau de Risco</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Cronograma de 60 dias da NR-5</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Edital de Convocação e Posse</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Exportação oficial em PDF</span></li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenPurchase(['dimensionamento'])}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Adquira Já o Módulo 1</span>
                </button>
              </div>
            </div>

            {/* PLANO MÓDULO 2 COM SELETOR DE VOTANTES */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all ring-1 ring-emerald-500/20">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Módulo 2 Avulso</h3>
                  <p className="text-[11px] text-slate-500">Eleição Online & Urna Criptográfica</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
                      R$ {getElectionPriceByVoters(voterCount, billingPeriod)}
                    </span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Preço ajustado por votantes</span>
                </div>

                {/* Seletor dinâmico de votantes no próprio card do Módulo 2 */}
                <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pessoas Votantes:</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-800">
                      {voterCount} pessoas
                    </span>
                  </div>

                  {/* Botões de pacotes rápidos */}
                  <div className="grid grid-cols-5 gap-1">
                    {[50, 150, 250, 500, 1000].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setVoterCount(count)}
                        className={`py-1 text-[10px] font-mono rounded-lg border text-center transition-all cursor-pointer ${
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

                <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Voto secreto pelo celular ou PC</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Quórum 50%+1 da NR-5 ao vivo</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Comprovante com hash SHA-256</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Ata de apuração oficial inviolável</span></li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenPurchase(['eleicao'])}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                  <span>Adquira Já o Módulo 2</span>
                </button>
              </div>
            </div>

            {/* PLANO MÓDULO 3 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Módulo 3 Avulso</h3>
                  <p className="text-[11px] text-slate-500">Gestão, Atas & Assinatura</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                      R$ {billingPeriod === 'anual' ? '159' : '199'}
                    </span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Para os 12 meses de mandato</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>12 Atas mensais antiassédio</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Agenda de reuniões e alertas</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Planos 5W2H preventivos em tempo real</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Assinatura digital na tela (MP 2.200-2)</span></li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenPurchase(['gestao'])}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Adquira Já o Módulo 3</span>
                </button>
              </div>
            </div>

            {/* COMBO COMPLETO CIPA 360° */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border-2 border-emerald-500 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                Mais Vendido
              </div>

              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Combo CIPA 360°</h3>
                  <p className="text-[11px] text-emerald-400 font-semibold">Os 3 Módulos Integrados</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                      R$ {billingPeriod === 'anual' ? '389' : '489'}
                    </span>
                    <span className="text-xs text-slate-400">/mês</span>
                  </div>
                  <span className="text-[11px] text-emerald-300">Economia máxima e suíte completa</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /><span>Todos os recursos dos Módulos 1, 2 e 3</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /><span>Suporte prioritário de especialistas em SST</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /><span>Usuários ilimitados para eleição</span></li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /><span>Arquivamento digital de todas as atas</span></li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenPurchase(['dimensionamento', 'eleicao', 'gestao'])}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Adquira Já · Combo Completo</span>
                </button>
              </div>
            </div>

          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 max-w-2xl mx-auto">
            ⚡ Ativação imediata online · Pagamento via PIX, Boleto Faturado ou Cartão · Sem carência de permanência
          </div>

        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest font-mono">
              TIRA-DÚVIDAS
            </span>
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Perguntas Frequentes sobre o CIPA Expert
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
        <img 
          src="/logocompleto.png" 
          alt="CIPA Expert" 
          className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" 
        />
        <p>© 2026 CIPA Expert · Todos os direitos reservados.</p>
      </footer>

      {/* PURCHASE / CHECKOUT MODAL */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        initialSelectedModules={purchaseInitialModules}
        initialVoterCount={voterCount}
        billingPeriod={billingPeriod}
      />

    </div>
  );
};

