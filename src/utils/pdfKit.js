// Shared A4 layout helpers for the PDFs the app generates (executive brief, printable RFI).
export const PAGE = { w: 210, h: 297, m: 15 };
export const CONTENT = PAGE.w - PAGE.m * 2;
export const INK = [20, 32, 43], MUTED = [89, 98, 107], RULE = [184, 177, 161], SOFT = [236, 233, 223], SURFACE = [248, 246, 240];
export const ACCENT = [194, 65, 12], ACCENT_SOFT = [246, 214, 198], MILESTONE = [201, 138, 11], TODAY = [200, 50, 31], DANGER = [168, 38, 27];

// The PDF's built-in Helvetica covers Latin-1 only; swap the few typographic characters the app uses.
export const clean = value => String(value ?? '').replace(/\r\n?/g, '\n')
  .replace(/[→⟶]/g, '->').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...')
  .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '?');

export const pdfFileName = (name, suffix, date) => `${clean(name).replace(/[^A-Za-z0-9 _-]+/g, '').trim().replace(/\s+/g, '-') || 'project'}-${suffix}${date ? `-${date}` : ''}.pdf`;

/** A cursor-based writer over a jsPDF document: text flows down the page and breaks onto new pages. */
export function createPdfWriter(doc) {
  const w = { doc, y: PAGE.m };
  w.font = (size, style = 'normal', color = INK) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); };
  w.lineHeight = size => size * 0.3528 * 1.35;
  w.ensure = height => { if (w.y + height > PAGE.h - PAGE.m - 8) { doc.addPage(); w.y = PAGE.m; return true; } return false; };
  w.lines = (text, width, size = 9.5, style = 'normal') => { w.font(size, style); return doc.splitTextToSize(clean(text), width); };
  w.paragraph = (text, { size = 9.5, style = 'normal', color = INK, x = PAGE.m, width = CONTENT, gap = 1.5 } = {}) => {
    const lines = w.lines(text, width, size, style);
    w.font(size, style, color);
    for (const line of lines) { w.ensure(w.lineHeight(size)); doc.text(line, x, w.y + w.lineHeight(size) * 0.8); w.y += w.lineHeight(size); }
    w.y += gap;
  };
  w.heading = text => {
    w.ensure(14); w.y += 3;
    w.font(11, 'bold'); doc.text(clean(text).toUpperCase(), PAGE.m, w.y + 4);
    w.y += 6; doc.setDrawColor(...RULE); doc.setLineWidth(0.3); doc.line(PAGE.m, w.y, PAGE.m + CONTENT, w.y); w.y += 3;
  };
  w.bullets = (items, empty) => {
    if (!items.length) { w.paragraph(empty, { color: MUTED }); return; }
    for (const item of items) {
      const lines = w.lines(item, CONTENT - 5);
      w.ensure(w.lineHeight(9.5));
      doc.setFillColor(...MUTED); doc.circle(PAGE.m + 1.3, w.y + w.lineHeight(9.5) * 0.55, 0.6, 'F');
      w.font(9.5);
      for (const line of lines) { w.ensure(w.lineHeight(9.5)); doc.text(line, PAGE.m + 5, w.y + w.lineHeight(9.5) * 0.8); w.y += w.lineHeight(9.5); }
      w.y += 1;
    }
    w.y += 1;
  };
  /** Label / value rows: a small muted label column and a wrapped value column. */
  w.fields = (rows, { x = PAGE.m, width = CONTENT, labelW = 34, size = 9 } = {}) => {
    for (const [label, value] of rows) {
      const lines = w.lines(value || '-', width - labelW - 2, size);
      w.ensure(w.lineHeight(size) * Math.min(lines.length, 3));
      w.font(7, 'bold', MUTED); doc.text(clean(label).toUpperCase(), x, w.y + w.lineHeight(size) * 0.8);
      w.font(size);
      for (const line of lines) { w.ensure(w.lineHeight(size)); doc.text(line, x + labelW + 2, w.y + w.lineHeight(size) * 0.8); w.y += w.lineHeight(size); }
      w.y += 0.8;
    }
  };
  /** A titled record (an RFI, a diary entry, a stage) with an accent rule down its left edge. */
  w.record = (title, rows, { subtitle = '', color = ACCENT, labelW = 32 } = {}) => {
    w.ensure(w.lineHeight(10) + w.lineHeight(9) * Math.min(rows.length, 3) + 2);
    const top = w.y, page = doc.getNumberOfPages();
    w.paragraph(title, { size: 10, style: 'bold', x: PAGE.m + 4, width: CONTENT - 4, gap: subtitle ? 0.3 : 0.8 });
    if (subtitle) w.paragraph(subtitle, { size: 8, color: MUTED, x: PAGE.m + 4, width: CONTENT - 4, gap: 0.8 });
    w.fields(rows, { x: PAGE.m + 4, width: CONTENT - 4, labelW });
    // The rule is drawn on the page the record started on, down to where it ended (or the page bottom).
    const end = doc.getNumberOfPages() === page ? w.y : PAGE.h - PAGE.m - 8;
    const current = doc.getNumberOfPages();
    doc.setPage(page); doc.setFillColor(...color); doc.rect(PAGE.m, top, 1.2, Math.max(2, end - top - 0.8), 'F'); doc.setPage(current);
    w.y += 2.5;
  };
  w.titleBlock = (eyebrow, title, subtitle) => {
    doc.setFillColor(...ACCENT); doc.rect(PAGE.m, w.y, 3, 17, 'F');
    w.font(8, 'bold', ACCENT); doc.text(clean(eyebrow).toUpperCase(), PAGE.m + 6, w.y + 4);
    w.font(17, 'bold'); doc.text(doc.splitTextToSize(clean(title), CONTENT - 6)[0], PAGE.m + 6, w.y + 11);
    w.font(9, 'normal', MUTED); doc.text(doc.splitTextToSize(clean(subtitle), CONTENT - 6)[0], PAGE.m + 6, w.y + 16.5);
    w.y += 23;
  };
  /** Footer on every page: the given text and "Page n of N". */
  w.footer = text => {
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.line(PAGE.m, PAGE.h - 11, PAGE.m + CONTENT, PAGE.h - 11);
      w.font(7.5, 'normal', MUTED);
      doc.text(doc.splitTextToSize(clean(text), CONTENT - 25)[0], PAGE.m, PAGE.h - 7);
      doc.text(`Page ${p} of ${pages}`, PAGE.m + CONTENT, PAGE.h - 7, { align: 'right' });
    }
  };
  return w;
}

export async function newA4Pdf() {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'mm', format: 'a4', compress: true });
}
