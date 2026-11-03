export function formatDate(value, fallback = 'Não informado') {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : fallback;
}

export function formatWallDateTime(value, fallback = 'Data indisponível') {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}` : fallback;
}

export function formatCurrency(value, currency = 'BRL') {
  const amount = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(amount)) return 'Não informado';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
}
