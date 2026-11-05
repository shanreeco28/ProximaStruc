import React, { useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { RecordModal } from './RecordForm';
import ProjectTimeline from './ProjectTimeline';
import { BRIEF_NOTE, BRIEF_SECTIONS, BRIEF_STORAGE_KEY, buildBrief, normaliseBriefSections } from '../utils/executiveBrief';
import { briefFileName, createBriefPdf } from '../utils/briefPdf';
import { usePdfExport } from '../hooks/usePdfExport';

function readSavedSections() {
  try { return normaliseBriefSections(JSON.parse(localStorage.getItem(BRIEF_STORAGE_KEY))); }
  catch { return normaliseBriefSections(null); }
}

function BriefRecord({ title, children }) {
  return <li className="rounded-xl border px-4 py-3 print-break-inside-avoid" style={{ borderColor: 'var(--border)' }}>
    <p className="font-medium [overflow-wrap:anywhere]">{title}</p>
    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-2">{children}</dl>
  </li>;
}
function BriefField({ label, wide = false, children }) {
  return <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}><dt className="meta-label !mb-0.5">{label}</dt><dd className="[overflow-wrap:anywhere]">{children}</dd></div>;
}

export default function ExecutiveReportModal({ onClose, projectName, tasks = [], inspections = [], weatherLogs = [], materials = [], lifts = [], people = [] }) {
  const [sections, setSections] = useState(readSavedSections);
  const brief = useMemo(() => buildBrief({ projectName, tasks, inspections, diary: weatherLogs, materials, lifts, people }), [projectName, tasks, inspections, weatherLogs, materials, lifts, people]);
  const include = id => sections.includes(id);
  const nothingSelected = !sections.length;
  const { busy, status, homeScreenApp, print, downloadPdf } = usePdfExport({
    build: () => createBriefPdf(brief, sections), fileName: briefFileName(brief), title: `${brief.projectName} executive brief`,
    key: `${sections.join(',')}|${JSON.stringify(brief)}`, ready: !nothingSelected,
  });

  useEffect(() => { try { localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(sections)); } catch { /* preference only */ } }, [sections]);

  const toggle = id => setSections(current => normaliseBriefSections(current.includes(id) ? current.filter(s => s !== id) : [...current, id]));

  const constraintRows = [
    include('blocked') && ['Blocked activities', brief.blocked.length ? brief.blocked.join('; ') : 'None recorded.'],
    include('materials') && ['Delayed / rejected materials', brief.materials.length ? brief.materials.join('; ') : 'None recorded.'],
    include('lifting') && ['Lifting permits', brief.lifting],
  ].filter(Boolean);

  return <RecordModal title={`${brief.projectName} — Site progress summary`} onClose={onClose} wide>
    <div className="executive-report-content space-y-6">
      <fieldset className="brief-checklist no-print">
        <legend className="font-semibold text-sm">Include in this brief</legend>
        <div className="flex flex-wrap gap-2 mt-1 mb-3">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSections(normaliseBriefSections(null))} disabled={sections.length === BRIEF_SECTIONS.length}>Select all</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSections([])} disabled={nothingSelected}>Clear</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {BRIEF_SECTIONS.map(section => <label key={section.id} className="brief-option">
            <input type="checkbox" checked={include(section.id)} onChange={() => toggle(section.id)} />
            <span><span className="block font-medium text-sm">{section.label}</span><span className="hidden sm:block text-xs text-muted">{section.hint}</span></span>
          </label>)}
        </div>
      </fieldset>

      <p className="eyebrow" style={{ color: 'var(--accent-text)' }}>Site monitoring · {brief.date}</p>
      {nothingSelected && <p className="empty-state">Select at least one item above to build the brief.</p>}

      {include('summary') && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-break-inside-avoid">{brief.metrics.map(([label, value]) => <div key={label} className="rounded-xl p-3.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}><span className="meta-label">{label}</span><span className="block text-lg font-bold tabular mt-1">{value}</span></div>)}</div>}

      {include('gantt') && <ProjectTimeline compact tasks={tasks} inspections={inspections} materials={materials} diary={weatherLogs} lifts={lifts} />}

      {(!!constraintRows.length || include('inspections') || include('diary')) && <div className="space-y-5 text-sm">
        {!!constraintRows.length && <>
          <h3 className="font-semibold text-base">Recorded constraints & site activity</h3>
          <dl className="rounded-xl border divide-y" style={{ borderColor: 'var(--border)' }}>
            {constraintRows.map(([label, value]) => <div key={label} className="grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 px-4 py-3" style={{ borderColor: 'var(--border)' }}><dt className="text-muted font-medium">{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </>}
        {include('inspections') && <section aria-labelledby="brief-rfis" className="space-y-2">
          <h3 id="brief-rfis" className="font-semibold text-base">Open inspections (RFIs) <span className="text-muted font-normal">({brief.openInspections.length})</span></h3>
          {brief.openInspections.length ? <ul className="space-y-2">{brief.openInspections.map(rfi => <BriefRecord key={rfi.id} title={<><span className="font-mono">{rfi.id}</span> · {rfi.element}</>}>
            <BriefField label="Current stage">{rfi.stage}</BriefField>
            <BriefField label="Responsible">{rfi.responsible}</BriefField>
            <BriefField label="Last updated" wide><span className="tabular">{rfi.lastUpdated}</span></BriefField>
            <BriefField label="Last comment" wide>{rfi.lastComment ? <>&ldquo;{rfi.lastComment.text}&rdquo; <span className="block text-xs text-muted mt-0.5">{rfi.lastComment.meta}</span></> : <span className="text-muted">No comments recorded.</span>}</BriefField>
          </BriefRecord>)}</ul> : <p className="text-muted">No open RFIs recorded.</p>}
        </section>}
        {include('diary') && <section aria-labelledby="brief-diary" className="space-y-2">
          <h3 id="brief-diary" className="font-semibold text-base">Recent diary entries</h3>
          {brief.diary.length ? <ul className="space-y-2">{brief.diary.map(d => <BriefRecord key={d.id} title={d.title}>
            <BriefField label="Date / time"><span className="tabular">{d.date} · {d.time}</span></BriefField>
            <BriefField label="Created by">{d.createdBy}</BriefField>
            <BriefField label="Follow-up / responsible" wide>{d.followUp}</BriefField>
            {d.details && <BriefField label="Details" wide><span className="whitespace-pre-wrap">{d.details}</span></BriefField>}
          </BriefRecord>)}</ul> : <p className="text-muted">No site diary entries recorded.</p>}
        </section>}
      </div>}
      {!nothingSelected && <p className="form-hint">{BRIEF_NOTE}</p>}

      <div className="no-print space-y-2">
        <div className="form-actions">
          {!homeScreenApp && <button type="button" onClick={downloadPdf} disabled={busy || nothingSelected} className="btn btn-secondary"><Download size={15} aria-hidden="true" />Download PDF</button>}
          <button type="button" onClick={print} disabled={busy || nothingSelected} className="btn btn-primary"><Printer size={15} aria-hidden="true" />{homeScreenApp ? 'Print / Share PDF' : 'Print / Export PDF'}</button>
        </div>
        {homeScreenApp && <p className="form-hint">On the Home Screen app, Print opens the share sheet with the brief as a PDF — choose Print, Save to Files or Mail.</p>}
        {status && <p role="status" className="form-hint">{status}</p>}
      </div>
    </div>
  </RecordModal>;
}
