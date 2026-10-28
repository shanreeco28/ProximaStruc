import React from 'react';
import { Building2, DraftingCompass, ClipboardCheck, BrickWall, NotebookPen, HardHat, Ruler } from 'lucide-react';

function Crane({ size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 21h18M9 21V7m5 14V7M3 7h18L14 3H9L3 7Zm2 0v6m-2 0h4M9 11h5m-5 5h5M21 7v4" /></svg>;
}

const ICONS = { dashboard: Building2, calendar: DraftingCompass, inspections: ClipboardCheck, materials: BrickWall, diary: NotebookPen, lifting: Crane, users: HardHat, monitoring: Ruler };
export default function ConstructionIcon({ name, ...props }) {
  const Icon = ICONS[name] || Building2;
  return <Icon strokeWidth={1.75} aria-hidden="true" {...props} />;
}
