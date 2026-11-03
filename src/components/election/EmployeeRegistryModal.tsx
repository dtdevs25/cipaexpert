import React, { useState } from 'react';
import { 
  X, 
  User, 
  Upload, 
  Camera, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  Mail, 
  Calendar, 
  Hash, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { EmployeeRecord } from '../../data/employeeData';

interface EmployeeRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: EmployeeRecord) => void;
  unitId: string;
  companyId: string;
  employeeToEdit?: EmployeeRecord | null;
}

export const EmployeeRegistryModal: React.FC<EmployeeRegistryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  unitId,
  companyId,
  employeeToEdit
}) => {
  const [name, setName] = useState(employeeToEdit?.name || '');
  const [apelido, setApelido] = useState(employeeToEdit?.apelido || '');
  const [matricula, setMatricula] = useState(employeeToEdit?.matricula || '');
  const [cpf, setCpf] = useState(employeeToEdit?.cpf || '');
  const [cargo, setCargo] = useState(employeeToEdit?.cargo || '');
  const [setor, setSetor] = useState(employeeToEdit?.setor || '');
  const [email, setEmail] = useState(employeeToEdit?.email || '');
  const [dataAdmissao, setDataAdmissao] = useState(employeeToEdit?.dataAdmissao || '01/02/2024');
  const [fotoUrl, setFotoUrl] = useState(employeeToEdit?.fotoUrl || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Formatação de CPF: 000.000.000-00
  const handleCpfChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 9) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
    } else if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}`;
    }
    setCpf(formatted);
  };

  // Upload de foto do colaborador (converte para base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Informe o nome completo do colaborador.');
      return;
    }
    if (!matricula.trim()) {
      setError('Informe o RE / Matrícula funcional.');
      return;
    }
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length < 4) {
      setError('O CPF deve conter pelo menos os 4 primeiros dígitos para permitir a senha do eleitor na urna.');
      return;
    }

    const employee: EmployeeRecord = {
      id: employeeToEdit?.id || `emp-${Date.now()}`,
      name: name.trim().toUpperCase(),
      apelido: apelido.trim() || undefined,
      matricula: matricula.trim().toUpperCase(),
      cpf: cpf.trim(),
      cargo: cargo.trim() || 'Colaborador',
      setor: setor.trim() || 'Geral',
      email: email.trim().toLowerCase() || `${matricula.toLowerCase()}@empresa.com.br`,
      dataAdmissao: dataAdmissao.trim(),
      fotoUrl: fotoUrl || undefined,
      unitId,
      companyId,
      ativo: true
    };

    onSave(employee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* CABEÇALHO */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {employeeToEdit ? 'Editar Colaborador / Eleitor' : 'Novo Colaborador / Eleitor'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Cadastro de base eleitoral · Votação CIPA NR-05
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* FOTO DO COLABORADOR */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 border-2 border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative shadow-inner">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <label className="text-xs font-bold text-slate-800 block">
                Foto do Colaborador (Exibida na Urna e Inscrições)
              </label>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Enviar Foto</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {fotoUrl && (
                  <button
                    type="button"
                    onClick={() => setFotoUrl('')}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-600 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                  >
                    Remover
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                Formatos: JPG ou PNG. Recomendado formato 1:1 (quadrado).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nome Completo: *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: CARLOS ALBERTO SILVA"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl uppercase font-semibold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Apelido de Urna / Social:
              </label>
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex: CARLINHOS"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl uppercase text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                RE / Matrícula Funcional (Usuário na Urna): *
              </label>
              <input
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: 179645"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                CPF (Senha na Urna = Primeiros 4 Dígitos): *
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                required
              />
              <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                Senha inicial: <strong>{cpf.replace(/\D/g, '').slice(0, 4) || '----'}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Cargo / Função:
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Técnico de Serviço ao Cliente"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Setor / Departamento:
              </label>
              <input
                type="text"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex: Operação / Campo"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                E-mail Corporativo:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@empresa.com.br"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Data de Admissão:
              </label>
              <input
                type="text"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          {/* RODAPÉ DO FORMULÁRIO */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Colaborador</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

