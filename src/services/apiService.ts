/**
 * CIPA Expert - Serviço Unificado de API REST
 * Comunicação direta com o backend Node.js / PostgreSQL
 */

import { AuthUser, Company } from '../types/auth';

const TOKEN_KEY = 'cipa_token';
const USER_KEY = 'cipa_user';

export const ApiService = {
  // Gestão de Token JWT
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  clearAuth(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  },

  getStoredUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user: AuthUser): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  },

  // Helper base para requisições com headers de autorização
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const storedUser = this.getStoredUser();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(storedUser?.id ? { 'x-user-id': storedUser.id } : {}),
      ...(storedUser?.email ? { 'x-user-email': storedUser.email } : {}),
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMessage = errorJson.error;
      } catch {
        // fallback
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // 1. Autenticação Real no PostgreSQL
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const data = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    this.setToken(data.token);

    const formattedUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      companyId: data.user.companyId,
      unitId: data.user.unitId,
      roleLabel: data.user.role,
      avatarUrl: data.user.avatarUrl
    };

    this.setStoredUser(formattedUser);
    return { token: data.token, user: formattedUser };
  },

  async getMe(): Promise<AuthUser> {
    return this.request<AuthUser>('/api/auth/me');
  },

  async updateProfile(profileData: { name?: string; avatarUrl?: string }): Promise<{ success: boolean; user: AuthUser; message?: string }> {
    const data = await this.request<any>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    const userObj = data.user || data;
    const current = this.getStoredUser();
    const updated: AuthUser = {
      ...(current || {}),
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      avatarUrl: userObj.avatarUrl,
      companyId: userObj.companyId,
      unitId: userObj.unitId
    } as AuthUser;
    this.setStoredUser(updated);
    return {
      success: true,
      user: updated,
      message: data.message || 'Perfil atualizado com sucesso!'
    };
  },

  async uploadPhotoToMinio(
    imageBase64: string,
    filename?: string,
    mimeType?: string,
    folder: 'usuarios' | 'colaboradores' | 'empresas' = 'usuarios',
    entityId?: string
  ): Promise<{ success: boolean; url: string; avatarUrl: string; logoUrl: string; fotoUrl: string; message: string }> {
    return this.request('/api/upload/photo', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, filename, mimeType, folder, entityId })
    });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async requestResetMyPassword(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/request-reset-my-password', {
      method: 'POST'
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  },

  // 2. Empresas e Filiais do PostgreSQL
  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/api/companies');
  },

  async createCompany(companyData: Partial<Company>): Promise<Company> {
    return this.request<Company>('/api/companies', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });
  },

  async updateCompany(id: string, companyData: Partial<Company>): Promise<Company> {
    return this.request<Company>(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData)
    });
  },

  async deleteCompany(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/companies/${id}`, {
      method: 'DELETE'
    });
  },

  async getUnits(companyId: string): Promise<any[]> {
    return this.request<any[]>(`/api/companies/${companyId}/units`);
  },

  async createUnit(companyId: string, unitData: any): Promise<any> {
    return this.request<any>(`/api/companies/${companyId}/units`, {
      method: 'POST',
      body: JSON.stringify(unitData)
    });
  },

  async updateUnit(companyId: string, unitId: string, unitData: any): Promise<any> {
    return this.request<any>(`/api/companies/${companyId}/units/${unitId}`, {
      method: 'PUT',
      body: JSON.stringify(unitData)
    });
  },

  async deleteUnit(companyId: string, unitId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/companies/${companyId}/units/${unitId}`, {
      method: 'DELETE'
    });
  },

  // 3. Usuários do PostgreSQL
  async getUsers(): Promise<AuthUser[]> {
    return this.request<AuthUser[]>('/api/users');
  },

  async createUser(userData: {
    name: string;
    email: string;
    password?: string;
    role: string;
    companyId?: string;
    unitId?: string;
    cpf?: string;
    matricula?: string;
  }): Promise<AuthUser> {
    return this.request<AuthUser>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // 4. Status e Seed do Banco
  async getSystemStatus(): Promise<{ database: string; userCount: number; companyCount: number; status: string }> {
    return this.request('/api/system/status');
  },

  async runSeed(): Promise<{ success: boolean; message: string; usersCount: number }> {
    return this.request('/api/admin/seed', {
      method: 'POST'
    });
  },

  // 5. Eleição e Votação
  async getEleicaoAtiva(unitId: string): Promise<any> {
    return this.request(`/api/eleicao/ativa/${unitId}`);
  },

  async votar(eleicaoId: string, candidatoId: string): Promise<{ success: boolean; hashComprovante: string; timestamp: string; message: string }> {
    return this.request('/api/eleicao/votar', {
      method: 'POST',
      body: JSON.stringify({ eleicaoId, candidatoId })
    });
  },

  // 6. Mapa de Riscos
  async getRiscos(unitId: string): Promise<any[]> {
    return this.request(`/api/riscos/${unitId}`);
  },

  async salvarRisco(riscoData: any): Promise<any> {
    return this.request('/api/riscos', {
      method: 'POST',
      body: JSON.stringify(riscoData)
    });
  },

  // 7. Planos 5W2H
  async getPlanos5W2H(unitId: string): Promise<any[]> {
    return this.request(`/api/planos-5w2h/${unitId}`);
  },

  async salvarPlano5W2H(planoData: any): Promise<any> {
    return this.request('/api/planos-5w2h', {
      method: 'POST',
      body: JSON.stringify(planoData)
    });
  },

  // 8. Consulta de CNAEs do PostgreSQL
  async getCnaes(query?: string): Promise<any[]> {
    const url = query ? `/api/cnaes?q=${encodeURIComponent(query)}` : '/api/cnaes';
    return this.request<any[]>(url);
  },

  // 9. Envio de Convite de Assinatura Digital
  async sendSignatureInvitation(params: {
    to: string;
    signerName: string;
    documentTitle: string;
    companyName: string;
    signLink: string;
    roleDescription?: string;
    isReminder?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/signatures/send-invitation', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // 10. Colaboradores (Dimensionamento e Processo Eleitoral NR-5)
  async getEmployees(unitId?: string, companyId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (unitId) params.append('unitId', unitId);
    if (companyId) params.append('companyId', companyId);
    const qs = params.toString();
    return this.request<any[]>(`/api/employees${qs ? `?${qs}` : ''}`);
  },

  async createEmployee(data: any): Promise<any> {
    return this.request('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateEmployee(id: string, data: any): Promise<any> {
    return this.request(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/employees/${id}`, {
      method: 'DELETE'
    });
  }
};
