import { recorded } from './siteData';

export const MONITOR_FIELDS = [
  ['weather', 'Weather / lightning advisory', 'text', ''], ['temperature', 'Temperature', 'number', '°C'],
  ['noise', 'Boundary noise', 'number', 'dB(A)'], ['noiseLimit', 'Applicable noise limit', 'number', 'dB(A)'],
  ['tss', 'Silt trap TSS', 'number', 'mg/L'], ['tssLimit', 'Applicable TSS limit', 'number', 'mg/L'],
  ['dengue', 'Dengue / vector inspection finding', 'text', ''], ['headcount', 'Observed site headcount', 'number', 'people'],
  ['wind', 'Measured wind speed', 'number', 'km/h'], ['antiCollision', 'Crane anti-collision check', 'text', ''],
  ['incidentFreeSince', 'Incident-free since (verified date)', 'date', ''],
];
export function observationValue(observation, key, unit = '') {
  return recorded(observation?.[key]) ? `${observation[key]}${unit ? ` ${unit}` : ''}` : 'Not recorded';
}
