// Draws the executive brief as an A4 PDF. Used where the browser cannot print the page itself
// (an iPhone/iPad home-screen web app ignores window.print()) and for "Download PDF".
import { BRIEF_NOTE } from './executiveBrief.js';
import { ganttWindow, GANTT_PADDING_DAYS } from './siteData.js';
import { ACCENT, ACCENT_SOFT, CONTENT, INK, MILESTONE, MUTED, PAGE, RULE, SOFT, SURFACE, TODAY, clean, createPdfWriter, newA4Pdf, pdfFileName } from './pdfKit.js';

export const briefFileName = brief => pdfFileName(brief.projectName, 'executive-brief', brief.date);

export async function createBriefPdf(brief, sections) {
  const doc = await newA4Pdf();
  const w = createPdfWriter(doc);
  const include = id => sections.includes(id);
  const { font, ensure, paragraph, heading, bullets } = w;

  w.titleBlock('Executive brief  ·  Site monitoring', brief.projectName, `Site progress summary  ·  ${brief.date}`);

  if (include('summary')) {
    heading('Progress summary');
    const gap = 3, cw = (CONTENT - gap * 3) / 4, h = 17;
    ensure(h + 2);
    brief.metrics.forEach(([label, value], i) => {
      const x = PAGE.m + i * (cw + gap);
      doc.setFillColor(...SURFACE); doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.roundedRect(x, w.y, cw, h, 1.5, 1.5, 'FD');
      font(7, 'bold', MUTED); doc.text(clean(label).toUpperCase(), x + 3, w.y + 5.5);
      font(13, 'bold'); doc.text(clean(value), x + 3, w.y + 13);
    });
    w.y += h + 4;
  }

  if (include('gantt')) drawGantt();
  if (include('blocked')) { heading('Blocked activities'); bullets(brief.blocked, 'None recorded.'); }
  if (include('materials')) { heading('Delayed / rejected materials'); bullets(brief.materials, 'None recorded.'); }
  if (include('inspections')) {
    heading('Open inspections (RFIs)');
    if (!brief.openInspections.length) paragraph('No open RFIs recorded.', { color: MUTED });
    brief.openInspections.forEach(rfi => w.record(`${rfi.id}: ${rfi.element}`, [
      ['Current stage', rfi.stage],
      ['Responsible', rfi.responsible],
      ['Last updated', rfi.lastUpdated],
      ['Last comment', rfi.lastComment ? `"${rfi.lastComment.text}" - ${rfi.lastComment.meta}` : 'No comments recorded.'],
    ]));
  }
  if (include('lifting')) { heading('Lifting permits'); paragraph(brief.lifting); }
  if (include('diary')) {
    heading('Recent diary entries');
    if (!brief.diary.length) paragraph('No site diary entries recorded.', { color: MUTED });
    brief.diary.forEach(d => w.record(d.title, [
      ['Date / time', `${d.date} ${d.time}`],
      ['Created by', d.createdBy],
      ['Follow-up / responsible', d.followUp],
      ...(d.details ? [['Details', d.details]] : []),
    ], { color: RULE, labelW: 40 }));
  }
  w.y += 2; paragraph(BRIEF_NOTE, { size: 8, color: MUTED });

  w.footer(`ProximaStruc  ·  ${brief.projectName}  ·  Generated from recorded project data`);
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
      font(7, 'bold', MUTED); doc.text('ACTIVITY / RECORD', PAGE.m, w.y + 8.5);
      doc.setDrawColor(...RULE); doc.setLineWidth(0.2);
      axis.months.forEach((m, i) => {
        const x = xOf(m.left), mw = chartW * m.width / 100;
        if (i) doc.line(x, w.y, x, w.y + 5);
        font(6.5, 'bold', INK);
        const label = doc.getTextWidth(m.label) < mw - 2 ? m.label : doc.getTextWidth(m.short) < mw - 1 ? m.short : '';
        if (label) doc.text(label.toUpperCase(), x + 1, w.y + 3.6);
      });
      doc.line(chartX, w.y + 5, chartX + chartW, w.y + 5);
      if (showWeeks) {
        font(5.5, 'normal', MUTED);
        axis.weeks.forEach(week => { const x = xOf(week.left); if (x > chartX + 1.5 && x < chartX + chartW - 1.5) doc.text(week.label, x, w.y + 8.6, { align: 'center' }); });
      }
      w.y += headH;
      doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(PAGE.m, w.y, PAGE.m + CONTENT, w.y);
    };
    const gridlines = (top, bottom) => {
      doc.setLineWidth(0.15);
      doc.setDrawColor(...SOFT); doc.setLineDashPattern([0.6, 0.8], 0);
      axis.weeks.forEach(week => doc.line(xOf(week.left), top, xOf(week.left), bottom));
      doc.setLineDashPattern([], 0); doc.setDrawColor(...RULE);
      axis.months.slice(1).forEach(m => doc.line(xOf(m.left), top, xOf(m.left), bottom));
      if (axis.today) { doc.setDrawColor(...TODAY); doc.setLineWidth(0.45); doc.line(xOf(axis.today.left), top, xOf(axis.today.left), bottom); }
    };

    ensure(headH + rowH * Math.min(rows.length, 3));
    const bottom = PAGE.h - PAGE.m - 8;
    for (let index = 0; index < rows.length;) {
      if (index) { doc.addPage(); w.y = PAGE.m; }
      header();
      // Rows that fit on this page: backgrounds first, then gridlines, then bars on top.
      const count = Math.max(1, Math.min(rows.length - index, Math.floor((bottom - w.y) / rowH)));
      const top = w.y, page = rows.slice(index, index + count);
      page.forEach((_, i) => {
        if ((index + i) % 2) { doc.setFillColor(...SURFACE); doc.rect(PAGE.m, top + i * rowH, CONTENT, rowH, 'F'); }
        doc.setDrawColor(...SOFT); doc.setLineWidth(0.15); doc.line(PAGE.m, top + (i + 1) * rowH, PAGE.m + CONTENT, top + (i + 1) * rowH);
      });
      gridlines(top, top + count * rowH);
      page.forEach(row => {
        font(7.5, 'bold'); doc.text(doc.splitTextToSize(clean(row.label), labelW)[0], PAGE.m, w.y + 3);
        font(6, 'normal', MUTED); doc.text(doc.splitTextToSize(clean(`${row.kind} · ${row.detail}`), labelW)[0], PAGE.m, w.y + 5.9);
        const { left, width } = axis.position(row.start, row.end);
        if (row.kind === 'Activity') {
          const x = xOf(left), bw = Math.max(0.8, chartW * width / 100);
          doc.setFillColor(...ACCENT_SOFT); doc.setDrawColor(...ACCENT); doc.setLineWidth(0.2); doc.rect(x, w.y + 1.8, bw, 3.4, 'FD');
          if (row.progress > 0) { doc.setFillColor(...ACCENT); doc.rect(x, w.y + 1.8, bw * row.progress / 100, 3.4, 'F'); }
          font(5.5, 'normal', MUTED);
          const tag = `${row.progress}%`;
          if (x + bw + 1 + doc.getTextWidth(tag) < chartX + chartW) doc.text(tag, x + bw + 1, w.y + 4.6);
        } else {
          const cx = xOf(left + width / 2), cy = w.y + rowH / 2, r = 1.7;
          doc.setFillColor(...MILESTONE);
          doc.triangle(cx - r, cy, cx, cy - r, cx + r, cy, 'F');
          doc.triangle(cx - r, cy, cx, cy + r, cx + r, cy, 'F');
        }
        w.y += rowH;
      });
      index += count;
    }
    w.y += 2;
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
