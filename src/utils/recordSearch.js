const normalize = value => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

// Each search word may match a different field; existing panel filters still apply.
export function matchesRecordSearch(query, fields) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fields.map(normalize).join(' ');
  return words.every(word => text.includes(word));
}
