/**
 * Utilitários de validação e formatação de documentos brasileiros (CPF, CNPJ, CNAE).
 * Conforme regras e algoritmos matemáticos oficiais da Receita Federal do Brasil.
 */

/**
 * Valida se um CPF é matematicamente autêntico.
 * Rejeita valores com tamanho incorreto, sequências com todos os dígitos iguais e dígitos verificadores inconsistentes.
 */
export const validateCPF = (cpf: string | null | undefined): boolean => {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  // Rejeita sequências repetidas como 111.111.111-11, 000.000.000-00, etc.
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // 1º Dígito Verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.charAt(9), 10)) return false;

  // 2º Dígito Verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.charAt(10), 10)) return false;

  return true;
};

/**
 * Valida se um CNPJ é matematicamente autêntico.
 * Rejeita valores com tamanho incorreto, sequências com todos os dígitos iguais e dígitos verificadores inconsistentes.
 */
export const validateCNPJ = (cnpj: string | null | undefined): boolean => {
  if (!cnpj) return false;
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;

  // Rejeita sequências repetidas como 11.111.111/1111-11, 00.000.000/0000-00, etc.
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // 1º Dígito Verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean.charAt(i), 10) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(clean.charAt(12), 10)) return false;

  // 2º Dígito Verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean.charAt(i), 10) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(clean.charAt(13), 10)) return false;

  return true;
};

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 */
export const formatCNPJ = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export const formatCPF = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

/**
 * Aplica máscara de CNAE (0000-0/00)
 */
export const formatCNAE = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 7);
  if (digits.length <= 4) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5, 7)}`;
};

/**
 * Mascara CPF conforme regras da LGPD, exibindo apenas os 3 últimos dígitos numéricos.
 * Exemplo: 123.456.789-01 -> ***.***.**9-01
 */
export const maskCPFLGPD = (cpf?: string | null): string => {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length < 3) return '***.***.***-**';
  if (clean.length !== 11) {
    const last3 = clean.slice(-3);
    return `***.***.**${last3[0] || '*'}-${last3.slice(1)}`;
  }
  return `***.***.**${clean.charAt(8)}-${clean.slice(9, 11)}`;
};

