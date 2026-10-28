import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, FileText, FolderOpen, LogOut, UserRound, Moon, Sun } from 'lucide-react';
import useTheme, { SHOW_THEME_SHORTCUT } from '../hooks/useTheme';
import ProfileEditor from './ProfileEditor';
import { RecordModal } from './RecordForm';

export default function AccountControls({ user, profile, projectName, onSaveProfile, onLogout, onProjects, onExecutiveBrief }) {
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const root = useRef(null), menuButton = useRef(null), profileButton = useRef(null);
  const menuId = useId();
  const focusItem = index => {
    const items = root.current?.querySelectorAll('[role="menuitem"]');
    items?.[(index + items.length) % items.length]?.focus();
  };
  useEffect(() => {
    if (!menuOpen) return;
    const outside = event => { if (!root.current?.contains(event.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [menuOpen]);
  const closeProfile = () => { setProfileOpen(false); profileButton.current?.focus(); };
  const action = callback => {
    setMenuOpen(false); menuButton.current?.focus(); callback();
  };
  return <div ref={root} className="relative flex items-center gap-1.5 sm:gap-3 shrink-0" onKeyDown={event => {
    if (menuOpen && event.key === 'Tab') {
      event.preventDefault(); setMenuOpen(false);
      (event.shiftKey ? menuButton.current : profileButton.current || menuButton.current)?.focus();
    }
  }} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
  }}>
    <button ref={menuButton} type="button" aria-haspopup="menu" aria-expanded={menuOpen} aria-controls={menuId}
      onClick={() => { setError(''); setMenuOpen(open => !open); }} onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); }
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
          event.preventDefault(); setError(''); setMenuOpen(true);
          requestAnimationFrame(() => focusItem(event.key === 'ArrowUp' ? -1 : 0));
        }
      }} className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium px-3 py-2.5 rounded-lg shadow-sm">
      Actions <ChevronDown size={14} aria-hidden="true" />
    </button>
    {menuOpen && <div id={menuId} role="menu" aria-label="Project actions" className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-30" onKeyDown={event => {
      const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]')];
      const index = items.indexOf(document.activeElement);
      if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault(); focusItem(event.key === 'Home' ? 0 : event.key === 'End' ? -1 : index + (event.key === 'ArrowDown' ? 1 : -1));
      } else if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); menuButton.current?.focus(); }
    }}>
      {onProjects && <button type="button" role="menuitem" tabIndex={-1} onClick={() => action(onProjects)} className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100"><FolderOpen size={16} aria-hidden="true" />Projects</button>}
      {onExecutiveBrief && <button type="button" role="menuitem" tabIndex={-1} onClick={() => action(onExecutiveBrief)} className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100"><FileText size={16} aria-hidden="true" />Generate Executive Brief</button>}
      {(onProjects || onExecutiveBrief) && <div role="separator" className="my-1 border-t border-slate-200" />}
      <button type="button" role="menuitem" tabIndex={-1} onClick={() => action(() => { toggleTheme(); window.dispatchEvent(new Event(SHOW_THEME_SHORTCUT)); })} className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100">
        {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}{isDark ? 'Light mode' : 'Dark mode'}
      </button>
    </div>}
    {onSaveProfile && <button ref={profileButton} type="button" aria-label="Edit profile" title="Edit profile" disabled={loggingOut} onClick={() => { setError(''); setMenuOpen(false); setProfileOpen(true); }}
      className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm">
      <UserRound size={16} aria-hidden="true" /><span className="hidden sm:inline">Edit profile</span>
    </button>}
    <button type="button" aria-label={loggingOut ? 'Logging out' : 'Log out'} title="Log out" disabled={loggingOut} onClick={async () => {
      if (loggingOut) return;
      setMenuOpen(false); setLoggingOut(true); setError('');
      try { await onLogout(); } catch { setError('Could not log out. Please try again.'); } finally { setLoggingOut(false); }
    }} className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-2.5 rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50 text-xs sm:text-sm">
      <LogOut size={16} aria-hidden="true" /><span className="hidden sm:inline">{loggingOut ? 'Logging out…' : 'Log out'}</span>
    </button>
    {error && <p role="alert" className="absolute right-0 top-full mt-2 w-60 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 z-30">{error}</p>}
    {profileOpen && createPortal(profile ? <ProfileEditor user={user} profile={profile} projectName={projectName} onSave={onSaveProfile} onClose={closeProfile} />
      : <RecordModal title="Edit profile" onClose={closeProfile}><p role="status" className="text-sm text-slate-600">{user.emailVerified ? 'Your project profile is still loading. If it does not load, check project access and try again.' : 'Verify your sign-in email to edit your project profile.'}</p></RecordModal>, document.body)}
  </div>;
}
