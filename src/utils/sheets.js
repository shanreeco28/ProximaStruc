// Sheet register: every workspace module is filed like a sheet in a drawing register.
// Practice areas use ISO 21502 terminology; information naming follows ISO 19650.
// References describe the local framework a sheet supports; they are not certifications.
export const SHEETS = {
  dashboard: { code: 'CTL-00', area: 'Project control', ref: 'Practice-area control matrix' },
  calendar: { code: 'SCH-01', area: 'Schedule', ref: 'Lookahead · make-ready · Gantt' },
  inspections: { code: 'QA-02', area: 'Quality', ref: 'BCA · RE / RTO inspections' },
  materials: { code: 'RES-03', area: 'Resources & procurement', ref: 'BBS · concrete · delivery orders' },
  diary: { code: 'INF-04', area: 'Information & communication', ref: 'ISO 19650 · daily site records' },
  lifting: { code: 'WSH-05', area: 'Risk · workplace safety & health', ref: 'MOM WSH · lifting permit-to-work' },
  users: { code: 'STK-06', area: 'Stakeholders & access', ref: 'Appointed parties · bizSAFE · CSOC' },
  monitoring: { code: 'ADM-07', area: 'Site observations', ref: 'Admin-confirmed readings' },
  access: { code: 'ADM-00', area: 'Site administration', ref: 'Site owner project access' },
};

export const sheetFor = id => SHEETS[id] || { code: 'PRJ', area: 'Project workspace', ref: '' };
export const sheetCode = (id, part) => `${sheetFor(id).code}${part ? `.${part}` : ''}`;
