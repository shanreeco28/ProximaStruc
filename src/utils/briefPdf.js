// Draws the executive brief as an A4 PDF. Used where the browser cannot print the page itself
// (an iPhone/iPad home-screen web app ignores window.print()) and for "Download PDF".
import { BRIEF_NOTE } from './executiveBrief.js';
import { ganttWindow, GANTT_PADDING_DAYS } from './siteData.js';

const PAGE = { w: 210, h: 297, m: 15 };
const CONTENT = PAGE.w - PAGE.m * 2;
const INK = [20, 32, 43], MUTED = [89, 98, 107], RULE = [184, 177, 161], SOFT = [236, 233, 223], SURFACE = [248, 246, 240];
const ACCENT = [194, 65, 12], ACCENT_SOFT = [246, 214, 198], MILESTONE = [201, 138, 11], TODAY = [200, 50, 31];

// The PDF's built-in Helvetica covers Latin-1 only; swap the few typographic characters the app uses.
const clean = value => String(value ?? '')
  .replace(/[→⟶]/g, '->').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...')
  .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');

export const briefFileName = brief => `${clean(brief.projectName).replace(/[^A-Za-z0-9 _-]+/g, '').trim().replace(/\s+/g, '-') || 'project'}-executive-brief-${brief.date}.pdf`;

export async function createBriefPdf(brief, sections) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const include = id => sections.includes(id);
  let y = PAGE.m;

  const font = (size, style = 'normal', color = INK) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); };
  const lineHeight = size => size * 0.3528 * 1.35;
  const ensure = height => { if (y + height > PAGE.h - PAGE.m - 8) { doc.addPage(); y = PAGE.m; } };
  const paragraph = (text, { size = 9.5, style = 'normal', color = INK, x = PAGE.m, width = CONTENT, gap = 1.5 } = {}) => {
    font(size, style, color);
    const lines = doc.splitTextToSize(clean(text), width);
    for (const line of lines) { ensure(lineHeight(size)); doc.text(line, x, y + lineHeight(size) * 0.8); y += lineHeight(size); }
    y += gap;
  };
  const heading = text => {
    ensure(14); y += 3;
    font(11, 'bold'); doc.text(clean(text).toUpperCase(), PAGE.m, y + 4);
    y += 6; doc.setDrawColor(...RULE); doc.setLineWidth(0.3); doc.line(PAGE.m, y, PAGE.m + CONTENT, y); y += 3;
  };
  const bullets = (items, empty) => {
    if (!items.length) { paragraph(empty, { color: MUTED }); return; }
    for (const item of items) {
      font(9.5); const lines = doc.splitTextToSize(clean(item), CONTENT - 5);
      ensure(lineHeight(9.5));
      doc.setFillColor(...MUTED); doc.circle(PAGE.m + 1.3, y + lineHeight(9.5) * 0.55, 0.6, 'F');
      for (const line of lines) { ensure(lineHeight(9.5)); doc.text(line, PAGE.m + 5, y + lineHeight(9.5) * 0.8); y += lineHeight(9.5); }
      y += 1;
    }
    y += 1;
  };

  // Title block
  doc.setFillColor(...ACCENT); doc.rect(PAGE.m, y, 3, 17, 'F');
  font(8, 'bold', ACCENT); doc.text('EXECUTIVE BRIEF  ·  SITE MONITORING', PAGE.m + 6, y + 4);
  font(17, 'bold'); doc.text(doc.splitTextToSize(clean(brief.projectName), CONTENT - 6)[0], PAGE.m + 6, y + 11);
  font(9, 'normal', MUTED); doc.text(`Site progress summary  ·  ${brief.date}`, PAGE.m + 6, y + 16.5);
  y += 23;

  if (include('summary')) {
    heading('Progress summary');
    const gap = 3, w = (CONTENT - gap * 3) / 4, h = 17;
    ensure(h + 2);
    brief.metrics.forEach(([label, value], i) => {
      const x = PAGE.m + i * (w + gap);
      doc.setFillColor(...SURFACE); doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
      font(7, 'bold', MUTED); doc.text(clean(label).toUpperCase(), x + 3, y + 5.5);
      font(13, 'bold'); doc.text(clean(value), x + 3, y + 13);
    });
    y += h + 4;
  }

  if (include('gantt')) drawGantt();
  if (include('blocked')) { heading('Blocked activities'); bullets(brief.blocked, 'None recorded.'); }
  if (include('materials')) { heading('Delayed / rejected materials'); bullets(brief.materials, 'None recorded.'); }
  if (include('inspections')) { heading('Open inspections (RFIs)'); bullets(brief.openInspections, 'No open RFIs recorded.'); }
  if (include('lifting')) { heading('Lifting permits'); paragraph(brief.lifting); }
  if (include('diary')) {
    heading('Recent diary entries');
    bullets(brief.diary.map(d => `${d.date} · ${d.title}${d.details ? `: ${d.details}` : ''}`), 'No site diary entries recorded.');
  }
  y += 2; paragraph(BRIEF_NOTE, { size: 8, color: MUTED });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.line(PAGE.m, PAGE.h - 11, PAGE.m + CONTENT, PAGE.h - 11);
    font(7.5, 'normal', MUTED);
    doc.text(clean(`ProximaStruc  ·  ${brief.projectName}  ·  Generated from recorded project data`), PAGE.m, PAGE.h - 7);
    doc.text(`Page ${p} of ${pages}`, PAGE.m + CONTENT, PAGE.h - 7, { align: 'right' });
  }
  return doc.output('blob');

  function drawGantt() {
    heading('Project Gantt chart');
    const rows = brief.schedule;
    const axis = ganttWindow(rows, { at: brief.date });
    if (!axis) { paragraph('No dated records yet.', { color: MUTED }); return; }
    const labelW = 52, chartX = PAGE.m + labelW + 3, chartW = CONTENT - labelW - 3, rowH = 7, headH = 10;
    const xOf = pct => chartX + chartW * pct / 100;
    const showWeeks = axis.span <= 200;

    const header = () => {
      font(7, 'bold', MUTED); doc.text('ACTIVITY / RECORD', PAGE.m, y + 8.5);
      doc.setDrawColor(...RULE); doc.setLineWidth(0.2);
      axis.months.forEach((m, i) => {
        const x = xOf(m.left), w = chartW * m.width / 100;
        if (i) doc.line(x, y, x, y + 5);
        font(6.5, 'bold', INK);
        const label = doc.getTextWidth(m.label) < w - 2 ? m.label : doc.getTextWidth(m.short) < w - 1 ? m.short : '';
        if (label) doc.text(label.toUpperCase(), x + 1, y + 3.6);
      });
      doc.line(chartX, y + 5, chartX + chartW, y + 5);
      if (showWeeks) {
        font(5.5, 'normal', MUTED);
        axis.weeks.forEach(w => { const x = xOf(w.left); if (x > chartX + 1.5 && x < chartX + chartW - 1.5) doc.text(w.label, x, y + 8.6, { align: 'center' }); });
      }
      y += headH;
      doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(PAGE.m, y, PAGE.m + CONTENT, y);
    };
    const gridlines = (top, bottom) => {
      doc.setLineWidth(0.15);
      doc.setDrawColor(...SOFT); doc.setLineDashPattern([0.6, 0.8], 0);
      axis.weeks.forEach(w => doc.line(xOf(w.left), top, xOf(w.left), bottom));
      doc.setLineDashPattern([], 0); doc.setDrawColor(...RULE);
      axis.months.slice(1).forEach(m => doc.line(xOf(m.left), top, xOf(m.left), bottom));
      if (axis.today) { doc.setDrawColor(...TODAY); doc.setLineWidth(0.45); doc.line(xOf(axis.today.left), top, xOf(axis.today.left), bottom); }
    };

    ensure(headH + rowH * Math.min(rows.length, 3));
    const bottom = PAGE.h - PAGE.m - 8;
    for (let index = 0; index < rows.length;) {
      if (index) { doc.addPage(); y = PAGE.m; }
      header();
      // Rows that fit on this page: backgrounds first, then gridlines, then bars on top.
      const count = Math.max(1, Math.min(rows.length - index, Math.floor((bottom - y) / rowH)));
      const top = y, page = rows.slice(index, index + count);
      page.forEach((_, i) => {
        if ((index + i) % 2) { doc.setFillColor(...SURFACE); doc.rect(PAGE.m, top + i * rowH, CONTENT, rowH, 'F'); }
        doc.setDrawColor(...SOFT); doc.setLineWidth(0.15); doc.line(PAGE.m, top + (i + 1) * rowH, PAGE.m + CONTENT, top + (i + 1) * rowH);
      });
      gridlines(top, top + count * rowH);
      page.forEach(row => {
        font(7.5, 'bold'); doc.text(doc.splitTextToSize(clean(row.label), labelW)[0], PAGE.m, y + 3);
        font(6, 'normal', MUTED); doc.text(doc.splitTextToSize(clean(`${row.kind} · ${row.detail}`), labelW)[0], PAGE.m, y + 5.9);
        const { left, width } = axis.position(row.start, row.end);
        if (row.kind === 'Activity') {
          const x = xOf(left), w = Math.max(0.8, chartW * width / 100);
          doc.setFillColor(...ACCENT_SOFT); doc.setDrawColor(...ACCENT); doc.setLineWidth(0.2); doc.rect(x, y + 1.8, w, 3.4, 'FD');
          if (row.progress > 0) { doc.setFillColor(...ACCENT); doc.rect(x, y + 1.8, w * row.progress / 100, 3.4, 'F'); }
          font(5.5, 'normal', MUTED);
          const tag = `${row.progress}%`;
          if (x + w + 1 + doc.getTextWidth(tag) < chartX + chartW) doc.text(tag, x + w + 1, y + 4.6);
        } else {
          const cx = xOf(left + width / 2), cy = y + rowH / 2, r = 1.7;
          doc.setFillColor(...MILESTONE);
          doc.triangle(cx - r, cy, cx, cy - r, cx + r, cy, 'F');
          doc.triangle(cx - r, cy, cx, cy + r, cx + r, cy, 'F');
        }
        y += rowH;
      });
      index += count;
    }
    y += 2;
    paragraph(`Chart window ${axis.startIso} to ${axis.endIso} (${GANTT_PADDING_DAYS}-day buffer either side of recorded dates).${axis.today ? ' Red line marks today.' : ''} Bars show recorded activity progress; diamonds are dated site milestones.`, { size: 7.5, color: MUTED });
  }
}

/** True for an iPhone/iPad web app opened from the Home Screen, where window.print() does nothing. */
export function isIosHomeScreenApp() {
  if (typeof window === 'undefined') return false;
  if (window.navigator.standalone === true) return true;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && !!window.matchMedia?.('(display-mode: standalone)').matches;
}
