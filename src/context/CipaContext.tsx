import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, CompanyUnit, AuthUser } from '../types/auth';
import { Candidato, PlanoAcao5W2H } from '../types/cipa';
import { 
  MockStorageService, 
  SavedDimensionamento, 
  RiskMapPoint, 
  SavedVote 
} from '../services/mockStorage';
import { DEMO_USERS } from '../data/multiCompanyData';

interface CipaContextType {
  // Empresas e Unidades
  companies: Company[];
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  activeCompany: Company;
  selectedUnitId: string;
  setSelectedUnitId: (id: string) => void;
  activeUnit: CompanyUnit;
  saveCompany: (company: Company) => void;

  // Autenticação & Usuários
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  users: AuthUser[];
  saveUser: (user: AuthUser) => void;

  // Dimensionamento
  dimensionamentos: SavedDimensionamento[];
  saveDimensionamento: (dim: SavedDimensionamento) => void;

  // Eleição & Votação
  candidatos: Candidato[];
  saveCandidato: (candidato: Candidato) => void;
  castVote: (candidatoId: string, electionId?: string) => { success: boolean; hash?: string; message: string };
  hasVoted: (electionId?: string) => boolean;
  getVoteReceipt: (electionId?: string) => SavedVote | undefined;

  // Gestão CIPA & 5W2H
  planos5W2H: PlanoAcao5W2H[];
  savePlano5W2H: (plano: PlanoAcao5W2H) => void;
  deletePlano5W2H: (id: string) => void;

  // Mapa de Riscos
  riskPoints: RiskMapPoint[];
  saveRiskPoint: (point: RiskMapPoint) => void;
  deleteRiskPoint: (id: string) => void;

  // Assinaturas Digitais
  signedAtas: Record<string, { hash: string; timestamp: string; signerName: string }>;
  saveSignature: (ataId: string, data: { hash: string; timestamp: string; signerName: string }) => void;

  // Ações de Sistema
  resetAllData: () => void;
}

const CipaContext = createContext<CipaContextType | undefined>(undefined);

export const CipaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização do storage local
  useEffect(() => {
    MockStorageService.init();
  }, []);

  const [companies, setCompanies] = useState<Company[]>(() => MockStorageService.getCompanies());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(DEMO_USERS.master);
  
  const initialCompany = companies.find(c => c.id === currentUser?.companyId) || companies[0];
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialCompany?.id || 'emp-1');
  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    currentUser?.unitId || activeCompany?.units[0]?.id || ''
  );
  const activeUnit = activeCompany?.units.find(u => u.id === selectedUnitId) || activeCompany?.units[0];

  const [users, setUsers] = useState<AuthUser[]>(() => MockStorageService.getUsers());
  const [dimensionamentos, setDimensionamentos] = useState<SavedDimensionamento[]>(() => MockStorageService.getDimensionamentos());
  const [candidatos, setCandidatos] = useState<Candidato[]>(() => MockStorageService.getCandidatos());
  const [planos5W2H, setPlanos5W2H] = useState<PlanoAcao5W2H[]>(() => MockStorageService.getPlanos5W2H());
  const [riskPoints, setRiskPoints] = useState<RiskMapPoint[]>(() => MockStorageService.getRiskPoints());
  const [signedAtas, setSignedAtas] = useState<Record<string, { hash: string; timestamp: string; signerName: string }>>(() => 
    MockStorageService.getSignatures()
  );

  // Atualizar unidade ao mudar empresa selecionada
  useEffect(() => {
    if (activeCompany && (!activeUnit || !activeCompany.units.some(u => u.id === selectedUnitId))) {
      setSelectedUnitId(activeCompany.units[0]?.id || '');
    }
  }, [selectedCompanyId, activeCompany]);

  // Ações de persistência
  const saveCompany = (company: Company) => {
    MockStorageService.saveCompany(company);
    setCompanies(MockStorageService.getCompanies());
  };

  const saveUser = (user: AuthUser) => {
    MockStorageService.saveUser(user);
    setUsers(MockStorageService.getUsers());
  };

  const saveDimensionamento = (dim: SavedDimensionamento) => {
    MockStorageService.saveDimensionamento(dim);
    setDimensionamentos(MockStorageService.getDimensionamentos());
  };

  const saveCandidato = (candidato: Candidato) => {
    MockStorageService.saveCandidato(candidato);
    setCandidatos(MockStorageService.getCandidatos());
  };

  const castVote = (candidatoId: string, electionId = 'eleicao-2026') => {
    if (!currentUser) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    if (MockStorageService.hasUserVoted(currentUser.id, electionId)) {
      return { success: false, message: 'Você já exerceu seu voto nesta eleição!' };
    }

    // Gerar hash SHA-256 simulado de auditoria
    const timestamp = new Date().toLocaleString('pt-BR');
    const randomHex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    const hash = `VOTE-NR5-${randomHex}-${Date.now().toString(16).toUpperCase()}`;

    const newVote: SavedVote = {
      id: `vote-${Date.now()}`,
      companyId: selectedCompanyId,
      unitId: selectedUnitId,
      electionId,
      candidatoId,
      voterUserId: currentUser.id,
      timestamp,
      hashComprovante: hash
    };

    const registered = MockStorageService.registerVote(newVote);
    if (registered) {
      setCandidatos(MockStorageService.getCandidatos());
      return { success: true, hash, message: 'Voto computado com sucesso na urna eletrônica!' };
    }

    return { success: false, message: 'Falha ao registrar voto.' };
  };

  const hasVoted = (electionId = 'eleicao-2026') => {
    if (!currentUser) return false;
    return MockStorageService.hasUserVoted(currentUser.id, electionId);
  };

  const getVoteReceipt = (electionId = 'eleicao-2026') => {
    if (!currentUser) return undefined;
    return MockStorageService.getUserVoteReceipt(currentUser.id, electionId);
  };

  const savePlano5W2H = (plano: PlanoAcao5W2H) => {
    MockStorageService.savePlano5W2H(plano);
    setPlanos5W2H(MockStorageService.getPlanos5W2H());
  };

  const deletePlano5W2H = (id: string) => {
    MockStorageService.deletePlano5W2H(id);
    setPlanos5W2H(MockStorageService.getPlanos5W2H());
  };

  const saveRiskPoint = (point: RiskMapPoint) => {
    MockStorageService.saveRiskPoint(point);
    setRiskPoints(MockStorageService.getRiskPoints());
  };

  const deleteRiskPoint = (id: string) => {
    MockStorageService.deleteRiskPoint(id);
    setRiskPoints(MockStorageService.getRiskPoints());
  };

  const saveSignature = (ataId: string, data: { hash: string; timestamp: string; signerName: string }) => {
    MockStorageService.saveSignature(ataId, data);
    setSignedAtas({ ...MockStorageService.getSignatures() });
  };

  const resetAllData = () => {
    MockStorageService.resetAll();
    setCompanies(MockStorageService.getCompanies());
    setUsers(MockStorageService.getUsers());
    setCandidatos(MockStorageService.getCandidatos());
    setPlanos5W2H(MockStorageService.getPlanos5W2H());
    setRiskPoints(MockStorageService.getRiskPoints());
    setDimensionamentos(MockStorageService.getDimensionamentos());
    setSignedAtas(MockStorageService.getSignatures());
  };

  return (
    <CipaContext.Provider
      value={{
        companies,
        selectedCompanyId,
        setSelectedCompanyId,
        activeCompany,
        selectedUnitId,
        setSelectedUnitId,
        activeUnit,
        saveCompany,
        currentUser,
        setCurrentUser,
        users,
        saveUser,
        dimensionamentos,
        saveDimensionamento,
        candidatos,
        saveCandidato,
        castVote,
        hasVoted,
        getVoteReceipt,
        planos5W2H,
        savePlano5W2H,
        deletePlano5W2H,
        riskPoints,
        saveRiskPoint,
        deleteRiskPoint,
        signedAtas,
        saveSignature,
        resetAllData
      }}
    >
      {children}
    </CipaContext.Provider>
  );
};

export const useCipa = () => {
  const context = useContext(CipaContext);
  if (!context) {
    throw new Error('useCipa deve ser utilizado dentro de um CipaProvider');
  }
  return context;
};
