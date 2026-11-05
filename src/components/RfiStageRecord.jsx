import React, { useMemo, useState } from 'react';
import { Download, MessageSquare, Printer } from 'lucide-react';
import { RecordModal } from './RecordForm';
import { usePeople } from '../contexts/PeopleContext';
import { buildRfiReport, rfiStageLog } from '../utils/rfiStages';
import { createRfiPdf, rfiFileName } from '../utils/rfiPdf';
import { usePdfExport } from '../hooks/usePdfExport';

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
const Who = ({ item }) => <span className="font-semibold text-xs" style={{ color: 'var(--text)' }}>{item.by}{item.role && <span className="badge ml-1.5">{item.role}</span>}</span>;

/** One stage: who moved the RFI into it (with any reason), then the comments posted while it was at that stage. */
function StageGroup({ stage }) {
  return <li className="stage-log" data-current={stage.current || undefined} data-tone={stage.id === 'rejected' ? 'danger' : undefined}>
    <div className="stage-log-head">
      <span className="step-index" aria-hidden="true">{stage.number ?? '!'}</span>
      <h4 className="font-semibold text-sm">{stage.number ? <span className="sr-only">Stage {stage.number}: </span> : null}{stage.label}</h4>
      {stage.current && <span className="badge" data-tone="info">Current stage</span>}
      <span className="text-xs text-muted ml-auto">{plural(stage.comments.length, 'comment')}</span>
    </div>
    {!!stage.updates.length && <div className="space-y-1.5">
      <p className="meta-label !mb-0">Stage updates</p>
      <ul className="space-y-1.5">{stage.updates.map((update, index) => <li key={index} className="feed-item" data-kind="history">
        <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-0.5"><Who item={update} /><span className="text-[11px] text-muted tabular">{update.when || 'Time not recorded'}</span></div>
        <p className="italic mt-0.5">{update.action}</p>
        {update.reason && <p className="mt-0.5 [overflow-wrap:anywhere]">Reason: {update.reason}</p>}
      </li>)}</ul>
    </div>}
    <div className="space-y-1.5">
      <p className="meta-label !mb-0">Comments at this stage</p>
      {stage.comments.length ? <ul className="space-y-1.5">{stage.comments.map((comment, index) => <li key={index} className="feed-item" data-kind="comment">
        <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-0.5"><Who item={comment} /><span className="text-[11px] text-muted tabular">{comment.when || 'Time not recorded'}</span></div>
        <p className="mt-0.5 whitespace-pre-wrap [overflow-wrap:anywhere]">{comment.text}</p>
      </li>)}</ul> : <p className="text-xs text-muted italic">No comments at this stage.</p>}
    </div>
  </li>;
}

/** Comments and stage updates on the RFI page, separated by stage. New comments are filed under the current stage. */
export function RfiStageComments({ rfi, canComment, comment, saving, onCommentChange, onComment }) {
  const people = usePeople();
  const [show, setShow] = useState('all');
  const stages = useMemo(() => rfiStageLog(rfi, people), [rfi, people]);
  const current = stages.find(stage => stage.current);
  const shown = show === 'current' ? stages.filter(stage => stage.current) : stages;
  const inputId = `rfi-comment-${rfi.id}`;
  return <section aria-labelledby={`${inputId}-title`} className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 id={`${inputId}-title`} className="meta-label !mb-0 flex items-center gap-1.5"><MessageSquare size={13} aria-hidden="true" />Comments & updates by stage ({plural((rfi.comments || []).length, 'comment')})</h3>
      <div className="chip-group" role="group" aria-label={`Stages shown for ${rfi.id}`}>
        <button type="button" className="chip" aria-pressed={show === 'all'} onClick={() => setShow('all')}>All stages</button>
        <button type="button" className="chip" aria-pressed={show === 'current'} onClick={() => setShow('current')}>Current stage only</button>
      </div>
    </div>
    <ol className="space-y-3" aria-label={`${rfi.id} stages`}>{shown.map(stage => <StageGroup key={stage.id} stage={stage} />)}</ol>
    {canComment && <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold block">Comment on {rfi.id} · current stage: {current?.label || 'Stage not recorded'}</label>
      <div className="flex gap-2 items-center">
        <input id={inputId} type="text" placeholder="Add a comment for this stage…" value={comment} onChange={e => onCommentChange(e.target.value)}
          className="field-control !mt-0 flex-1 min-w-0" onKeyDown={e => { if (e.key === 'Enter') onComment(rfi); }} />
        <button type="button" disabled={saving} onClick={() => onComment(rfi)} className="btn btn-dark">Send</button>
      </div>
    </div>}
  </section>;
}

/** Printable RFI: details, current stage and the stage-by-stage record. Print, or download / share as a PDF. */
export function RfiPrintModal({ rfi, projectName, onClose }) {
  const people = usePeople();
  const report = useMemo(() => buildRfiReport(rfi, { people, projectName }), [rfi, people, projectName]);
  const { busy, status, homeScreenApp, print, downloadPdf } = usePdfExport({
    build: () => createRfiPdf(report), fileName: rfiFileName(report), title: `${report.id} RFI`, key: JSON.stringify({ ...report, printedAt: '' }),
  });
  return <RecordModal title={`Print RFI ${report.id}`} onClose={onClose} wide>
    <div className="print-sheet rfi-print space-y-5 text-sm">
      <div className="space-y-1">
        <p className="eyebrow" style={{ color: 'var(--accent-text)' }}>RFI · {report.projectName}</p>
        <p className="font-mono font-semibold text-base [overflow-wrap:anywhere]">{report.id}</p>
        <p className="font-semibold text-lg [overflow-wrap:anywhere]">{report.element}</p>
        <p className="text-xs text-muted">Printed {report.printedAt} (SGT)</p>
      </div>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 inset p-3.5 print-break-inside-avoid">
        {report.details.map(([label, value]) => <div key={label} className="min-w-0"><dt className="meta-label !mb-0.5">{label}</dt><dd className="[overflow-wrap:anywhere]">{value}</dd></div>)}
      </dl>
      <div>
        <h3 className="font-semibold text-base mb-1.5">Attached PDFs ({report.attachments.length})</h3>
        {report.attachments.length ? <ul className="list-disc pl-5 space-y-0.5">{report.attachments.map((name, index) => <li key={index} className="[overflow-wrap:anywhere]">{name}</li>)}</ul> : <p className="text-muted">No PDFs attached.</p>}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-base">Stage record: updates and comments</h3>
        <ol className="space-y-3">{report.stages.map(stage => <StageGroup key={stage.id} stage={stage} />)}</ol>
      </div>
      <p className="form-hint">Times are site time (SGT). Comments are filed under the stage the RFI was at when they were posted.</p>
      <div className="no-print space-y-2">
        <div className="form-actions">
          {!homeScreenApp && <button type="button" onClick={downloadPdf} disabled={busy} className="btn btn-secondary"><Download size={15} aria-hidden="true" />Download PDF</button>}
          <button type="button" onClick={print} disabled={busy} className="btn btn-primary"><Printer size={15} aria-hidden="true" />{homeScreenApp ? 'Print / Share PDF' : 'Print RFI'}</button>
        </div>
        {homeScreenApp && <p className="form-hint">On the Home Screen app, Print opens the share sheet with the RFI as a PDF — choose Print, Save to Files or Mail.</p>}
        {status && <p role="status" className="form-hint">{status}</p>}
      </div>
    </div>
  </RecordModal>;
}
