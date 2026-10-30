export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function formatPhone(value) {
  const digits = digitsOnly(value);
  if (digits.length > 11) return digits;
  if (digits.length < 3) return digits;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}${digits.length > 6 ? `-${digits.slice(6, 10)}` : ''}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}${digits.length > 7 ? `-${digits.slice(7, 11)}` : ''}`;
}

export function normalizeEmail(value) {
  const normalized = String(value ?? '').trim().toLocaleLowerCase('pt-BR');
  return normalized || null;
}
