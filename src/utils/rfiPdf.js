// Draws a single RFI as an A4 PDF: its details, current stage and the stage-by-stage record of who updated it
// and what was said. Used for "Download PDF" and where the browser cannot print (iPhone/iPad home-screen app).
import { ACCENT, DANGER, MUTED, RULE, createPdfWriter, newA4Pdf, pdfFileName } from './pdfKit.js';

export const rfiFileName = report => pdfFileName(report.id, 'rfi', '');

const stageTitle = stage => `${stage.number ? `Stage ${stage.number} · ` : ''}${stage.label}${stage.current ? '  (current stage)' : ''}`;
const who = item => `${item.by}${item.role ? ` (${item.role})` : ''}`;

export async function createRfiPdf(report) {
  const doc = await newA4Pdf();
  const w = createPdfWriter(doc);
  w.titleBlock(`RFI  ·  ${report.projectName}`, report.id, `${report.element}  ·  Printed ${report.printedAt} (SGT)`);

  w.heading('RFI details');
  w.fields(report.details, { labelW: 40 });
  w.y += 1;
  w.heading(`Attached PDFs (${report.attachments.length})`);
  w.bullets(report.attachments, 'No PDFs attached.');

  w.heading('Stage record: updates and comments');
  for (const stage of report.stages) {
    const updates = stage.updates.map(u => ['Updated by', `${who(u)} · ${u.when || 'time not recorded'}\n${u.action}${u.reason ? `\nReason: ${u.reason}` : ''}`]);
    const comments = stage.comments.map((c, i) => [`Comment ${i + 1}`, `${who(c)} · ${c.when || 'time not recorded'}\n${c.text}`]);
    const rows = [...updates, ...comments];
    w.record(stageTitle(stage), rows.length ? rows : [['Record', 'No updates or comments at this stage yet.']], {
      subtitle: `${stage.updates.length} update${stage.updates.length === 1 ? '' : 's'} · ${stage.comments.length} comment${stage.comments.length === 1 ? '' : 's'}`,
      color: stage.id === 'rejected' ? DANGER : stage.current ? ACCENT : RULE, labelW: 26,
    });
  }
  w.paragraph('Times are site time (SGT). Generated from the recorded RFI history; comments are filed under the stage the RFI was at when they were posted.', { size: 8, color: MUTED });
  w.footer(`ProximaStruc  ·  ${report.projectName}  ·  ${report.id}`);
  return doc.output('blob');
}
