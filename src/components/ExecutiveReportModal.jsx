import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { RecordModal } from './RecordForm';
import ProjectTimeline from './ProjectTimeline';
import { BRIEF_NOTE, BRIEF_SECTIONS, BRIEF_STORAGE_KEY, buildBrief, normaliseBriefSections } from '../utils/executiveBrief';
import { briefFileName, createBriefPdf, isIosHomeScreenApp } from '../utils/briefPdf';

function readSavedSections() {
  try { return normaliseBriefSections(JSON.parse(localStorage.getItem(BRIEF_STORAGE_KEY))); }
  catch { return normaliseBriefSections(null); }
}

export default function ExecutiveReportModal({ onClose, projectName, tasks = [], inspections = [], weatherLogs = [], materials = [], lifts = [] }) {
  const [sections, setSections] = useState(readSavedSections);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [homeScreenApp] = useState(isIosHomeScreenApp);
  const brief = useMemo(() => buildBrief({ projectName, tasks, inspections, diary: weatherLogs, materials, lifts }), [projectName, tasks, inspections, weatherLogs, materials, lifts]);
  const include = id => sections.includes(id);
  const nothingSelected = !sections.length;

  // iOS only opens the share sheet straight from a tap, so the home-screen app keeps the PDF ready
  // in advance rather than building it after the tap.
  const prepared = useRef({ key: '', file: null });
  const key = `${sections.join(',')}|${JSON.stringify(brief)}`;
  useEffect(() => {
    if (!homeScreenApp || nothingSelected) return;
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const blob = await createBriefPdf(brief, sections);
        if (live) prepared.current = { key, file: new File([blob], briefFileName(brief), { type: 'application/pdf' }) };
      } catch { /* built again on tap */ }
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [homeScreenApp, nothingSelected, brief, sections, key]);

  useEffect(() => { try { localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(sections)); } catch { /* preference only */ } }, [sections]);

  const toggle = id => setSections(current => normaliseBriefSections(current.includes(id) ? current.filter(s => s !== id) : [...current, id]));

  const pdfFile = async () => {
    if (prepared.current.key === key && prepared.current.file) return prepared.current.file;
    const blob = await createBriefPdf(brief, sections);
    return new File([blob], briefFileName(brief), { type: 'application/pdf' });
  };

  const saveFile = file => {
    const url = URL.createObjectURL(file);
    const link = Object.assign(document.createElement('a'), { href: url, download: file.name, rel: 'noopener' });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  // Share sheet first (it offers Print, Save to Files, Mail…); a plain download where sharing files is unsupported.
  const sharePdf = async () => {
    if (busy) return;
    setBusy(true); setStatus('Preparing PDF…');
    try {
      const file = await pdfFile();
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${brief.projectName} executive brief` });
          setStatus('');
          return;
        } catch (error) {
          if (error?.name === 'AbortError') { setStatus(''); return; }
          if (error?.name === 'NotAllowedError') { setStatus('The PDF is ready. Tap the button again to open the share sheet, then choose Print.'); return; }
        }
      }
      saveFile(file);
      setStatus('PDF downloaded.');
    } catch {
      setStatus('The PDF could not be created. Please retry.');
    } finally { setBusy(false); }
  };

  const downloadPdf = async () => {
    if (busy) return;
    setBusy(true); setStatus('Preparing PDF…');
    try { saveFile(await pdfFile()); setStatus('PDF downloaded.'); }
    catch { setStatus('The PDF could not be created. Please retry.'); }
    finally { setBusy(false); }
  };

  const print = () => { if (homeScreenApp) sharePdf(); else window.print(); };

  const constraintRows = [
    include('blocked') && ['Blocked activities', brief.blocked.length ? brief.blocked.join('; ') : 'None recorded.'],
    include('materials') && ['Delayed / rejected materials', brief.materials.length ? brief.materials.join('; ') : 'None recorded.'],
    include('inspections') && ['Open inspections (RFIs)', brief.openInspections.length ? brief.openInspections.join('; ') : 'No open RFIs recorded.'],
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

      {(!!constraintRows.length || include('diary')) && <div className="space-y-4 text-sm">
        {!!constraintRows.length && <>
          <h3 className="font-semibold text-base">Recorded constraints & site activity</h3>
          <dl className="rounded-xl border divide-y" style={{ borderColor: 'var(--border)' }}>
            {constraintRows.map(([label, value]) => <div key={label} className="grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 px-4 py-3" style={{ borderColor: 'var(--border)' }}><dt className="text-muted font-medium">{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </>}
        {include('diary') && <div>
          <p className="font-medium mb-2">Recent diary entries:</p>
          {brief.diary.length ? <ul className="space-y-1.5 list-disc pl-5 marker:text-[var(--muted)]">{brief.diary.map(d => <li key={d.id}><span className="tabular text-muted">{d.date}</span> · <span className="font-medium">{d.title}</span>{d.details ? `: ${d.details}` : ''}</li>)}</ul> : <p className="text-muted">No site diary entries recorded.</p>}
        </div>}
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
