import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, FileText, FolderOpen, LogOut, Menu, Moon, ShieldCheck, Sun, UserPen, UserX } from 'lucide-react';
import useTheme, { SHOW_THEME_SHORTCUT } from '../hooks/useTheme';
import useMediaQuery from '../hooks/useMediaQuery';
import ProfileEditor from './ProfileEditor';
import { RecordModal } from './RecordForm';

const initialsOf = value => (value || '').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || '?';
// Button text appears from this breakpoint; below it the buttons are icon-only so the page title keeps its room.
const LABELS = {
  sm: { text: 'hidden sm:inline', icon: 'sm:hidden', chevron: 'hidden sm:block', actions: 'px-2.5 sm:px-3.5', profile: 'px-1.5 sm:pl-1.5 sm:pr-3', logout: 'px-2.5 sm:px-3' },
  xl: { text: 'hidden xl:inline', icon: 'xl:hidden', chevron: 'hidden xl:block', actions: 'px-2.5 xl:px-3.5', profile: 'px-1.5 xl:pl-1.5 xl:pr-3', logout: 'px-2.5 xl:px-3' },
};

export default function AccountControls({ user, profile, projectName, onSaveProfile, onLogout, onProjects, onExecutiveBrief, labels = 'sm' }) {
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const root = useRef(null), menuButton = useRef(null), profileButton = useRef(null), logoutButton = useRef(null);
  const menuId = useId();
  const label = LABELS[labels] || LABELS.sm;
  // On phones (either orientation) the profile button moves into the Actions menu, leaving the header to the page title.
  const phone = useMediaQuery('(max-width: 639px), (max-height: 560px)');
  const profileInMenu = onSaveProfile && phone;
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
  const closeProfile = () => { setProfileOpen(false); (profileButton.current || menuButton.current)?.focus(); };
  const action = callback => {
    setMenuOpen(false); menuButton.current?.focus(); callback();
  };
  const initials = initialsOf(profile?.name || user?.displayName || user?.email);
  return <div ref={root} className="relative flex items-center gap-1.5 sm:gap-2 shrink-0" onKeyDown={event => {
    if (menuOpen && event.key === 'Tab') {
      event.preventDefault(); setMenuOpen(false);
      (event.shiftKey ? menuButton.current : profileButton.current || logoutButton.current || menuButton.current)?.focus();
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
      }} aria-label="Actions" title="Actions" className={`btn btn-primary ${label.actions}`}>
      <Menu size={17} aria-hidden="true" className={label.icon} /><span className={label.text}>Actions</span> <ChevronDown size={15} aria-hidden="true" className={`${label.chevron} transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
    </button>
    {menuOpen && <div id={menuId} role="menu" aria-label="Project actions" className="menu-panel absolute right-0 top-full mt-2 w-64 rounded-xl p-1.5 z-30 animate-in-fade-in-up" onKeyDown={event => {
      const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]')];
      const index = items.indexOf(document.activeElement);
      if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault(); focusItem(event.key === 'Home' ? 0 : event.key === 'End' ? -1 : index + (event.key === 'ArrowDown' ? 1 : -1));
      } else if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); menuButton.current?.focus(); }
    }}>
      {onProjects && <button type="button" role="menuitem" tabIndex={-1} onClick={() => action(onProjects)} className="menu-item"><FolderOpen size={16} aria-hidden="true" />Projects</button>}
      {onExecutiveBrief && <button type="button" role="menuitem" tabIndex={-1} onClick={() => action(onExecutiveBrief)} className="menu-item"><FileText size={16} aria-hidden="true" />Generate Executive Brief</button>}
      {(onProjects || onExecutiveBrief) && <div role="separator" className="my-1.5 border-t" style={{ borderColor: 'var(--border)' }} />}
      {profileInMenu && <button type="button" role="menuitem" tabIndex={-1} disabled={loggingOut} onClick={() => action(() => { setError(''); setProfileOpen(true); })} className="menu-item"><UserPen size={16} aria-hidden="true" />Edit profile</button>}
      <button type="button" role="menuitem" tabIndex={-1} onClick={() => action(() => { toggleTheme(); window.dispatchEvent(new Event(SHOW_THEME_SHORTCUT)); })} className="menu-item">
        {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}{isDark ? 'Light mode' : 'Dark mode'}
      </button>
      <div role="separator" className="my-1.5 border-t" style={{ borderColor: 'var(--border)' }} />
      <a href="/privacy.html" role="menuitem" tabIndex={-1} className="menu-item"><ShieldCheck size={16} aria-hidden="true" />Privacy policy</a>
      <a href="/delete-account.html" role="menuitem" tabIndex={-1} className="menu-item"><UserX size={16} aria-hidden="true" />Delete account</a>
    </div>}
    {onSaveProfile && !profileInMenu && <button ref={profileButton} type="button" aria-label="Edit profile" title="Edit profile" disabled={loggingOut} onClick={() => { setError(''); setMenuOpen(false); setProfileOpen(true); }}
      className={`btn btn-ghost ${label.profile}`}>
      <span className="avatar" aria-hidden="true">{initials}</span><span className={label.text}>Edit profile</span>
    </button>}
    <button ref={logoutButton} type="button" aria-label={loggingOut ? 'Logging out' : 'Log out'} title="Log out" disabled={loggingOut} onClick={async () => {
      if (loggingOut) return;
      setMenuOpen(false); setLoggingOut(true); setError('');
      try { await onLogout(); } catch { setError('Could not log out. Please try again.'); } finally { setLoggingOut(false); }
    }} className={`btn btn-ghost ${label.logout}`} style={{ color: 'var(--danger)' }}>
      <LogOut size={16} aria-hidden="true" /><span className={label.text}>{loggingOut ? 'Logging out…' : 'Log out'}</span>
    </button>
    {error && <p role="alert" className="form-error absolute right-0 top-full mt-2 w-64 z-30 shadow-lg">{error}</p>}
    {profileOpen && createPortal(profile ? <ProfileEditor user={user} profile={profile} projectName={projectName} onSave={onSaveProfile} onClose={closeProfile} />
      : <RecordModal title="Edit profile" onClose={closeProfile}><p role="status" className="text-sm text-muted">{user.emailVerified ? 'Your project profile is still loading. If it does not load, check project access and try again.' : 'Verify your sign-in email to edit your project profile.'}</p></RecordModal>, document.body)}
  </div>;
}
