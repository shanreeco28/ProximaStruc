import React from 'react';
import { UserRound } from 'lucide-react';
import { usePeople } from '../contexts/PeopleContext';
import { creatorName } from '../utils/siteData';

/** "Created by <name>" line shown on every operational record. */
export default function CreatedBy({ record, className = '' }) {
  const name = creatorName(record, usePeople());
  return (
    <span className={`text-xs text-muted inline-flex items-center gap-1.5 min-w-0 [overflow-wrap:anywhere] ${className}`}>
      <UserRound size={12} aria-hidden="true" className="shrink-0" />
      <span>Created by <strong className="font-semibold" style={{ color: 'var(--text)' }}>{name || 'Not recorded'}</strong></span>
    </span>
  );
}
