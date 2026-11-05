import { useEffect, useRef, useState } from 'react';
import { isIosHomeScreenApp } from '../utils/briefPdf';

const saveFile = file => {
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: file.name, rel: 'noopener' });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

/**
 * Print, download and share actions for a generated PDF. `build` returns the PDF blob; `key` changes whenever the
 * content does. iOS only opens the share sheet straight from a tap, so the home-screen app keeps the PDF ready in
 * advance rather than building it after the tap, and Print shares the PDF there (window.print() does nothing).
 */
export function usePdfExport({ build, fileName, title, key, ready = true }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [homeScreenApp] = useState(isIosHomeScreenApp);
  const builder = useRef(build);
  const prepared = useRef({ key: '', file: null });
  useEffect(() => { builder.current = build; });

  useEffect(() => {
    if (!homeScreenApp || !ready) return undefined;
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const blob = await builder.current();
        if (live) prepared.current = { key, file: new File([blob], fileName, { type: 'application/pdf' }) };
      } catch { /* built again on tap */ }
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [homeScreenApp, ready, key, fileName]);

  const pdfFile = async () => {
    if (prepared.current.key === key && prepared.current.file) return prepared.current.file;
    return new File([await builder.current()], fileName, { type: 'application/pdf' });
  };

  // Share sheet first (it offers Print, Save to Files, Mail…); a plain download where sharing files is unsupported.
  const sharePdf = async () => {
    if (busy) return;
    setBusy(true); setStatus('Preparing PDF…');
    try {
      const file = await pdfFile();
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title });
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
  return { busy, status, homeScreenApp, print, downloadPdf };
}
