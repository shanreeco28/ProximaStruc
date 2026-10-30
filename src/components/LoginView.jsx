import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, Moon, Shield, Sun } from 'lucide-react';
import AppLogo from './AppLogo';
import useTheme from '../hooks/useTheme';
import { SHEETS } from '../utils/sheets';
import { auth } from '../firebase';
import {
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  updateProfile
} from 'firebase/auth';


function GoogleMark() {
  return <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true" focusable="false">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z" />
  </svg>;
}

const inputClass = 'field-control';
const labelClass = 'field-label';

const LoginView = ({ initialMode = 'login' }) => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', birthday: '', designation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleConfirmEmail = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailLink(auth, formData.email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      navigate('/');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // Auth only - user profile syncs in App
      navigate('/');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleEmailLogin = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { await signInWithEmailAndPassword(auth, formData.email, formData.password); navigate('/'); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(result.user, { displayName: formData.name });
      // Store temp data to sync later
      localStorage.setItem('temp_user_data', JSON.stringify({ designation: formData.designation, birthday: formData.birthday }));
      navigate('/');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleMagicLink = async (e) => { e.preventDefault(); setLoading(true); setError(''); const actionCodeSettings = { url: window.location.href, handleCodeInApp: true }; try { await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings); window.localStorage.setItem('emailForSignIn', formData.email); setMagicSent(true); } catch (err) { setError(err.message); } finally { setLoading(false); } };

  const heading = { login: ['Welcome back', 'Sign in to your project workspace.'], register: ['Create Account', 'Register to request access to a project workspace.'], magic: ['Passwordless Login', 'We will email you a secure sign-in link.'], 'confirm-email': ['Confirm Email', 'Please confirm your email address to complete sign-in.'] }[mode];
  const backToLogin = <button type="button" onClick={() => setMode('login')} className="btn btn-ghost btn-block"><ArrowLeft size={16} aria-hidden="true" />Back to Login</button>;

  return (
    <main className="auth-shell min-h-screen flex w-full">
      <div className="auth-brand-panel hidden lg:flex w-[48%] xl:w-1/2 flex-col justify-between gap-10 p-12 xl:p-14 pb-16 max-h-screen overflow-y-auto sticky top-0">
        <button onClick={() => navigate('/')} className="relative flex items-center gap-3 self-start hover:opacity-90">
          <AppLogo className="w-11 h-11" />
          <span className="text-left"><span className="block text-2xl font-bold tracking-wide text-white display leading-none">PROXIMA<span style={{ color: '#f59a5b' }}>STRUC</span></span><span className="block mt-1 font-mono text-[10px] tracking-[.12em] uppercase" style={{ color: '#a3a8b0' }}>Project control · Construction</span></span>
        </button>
        <div className="relative max-w-xl">
          <p className="font-mono text-[11px] tracking-[.14em] uppercase" style={{ color: '#f5c518' }}>Sheet register · Rev A</p>
          <p className="display mt-3 text-4xl xl:text-[3.25rem] font-semibold uppercase text-white leading-[.95]">Every site record,<br />filed like a drawing.</p>
          <p className="mt-5 text-[15px] leading-relaxed max-w-md" style={{ color: '#c9c5ba' }}>Construction Logistics Management — schedule, quality, materials, WSH and site records organised by project practice area.</p>
          <table className="register-table mt-7">
            <thead><tr><th scope="col">Sheet</th><th scope="col">Practice area</th><th scope="col">Reference</th></tr></thead>
            <tbody>{Object.values(SHEETS).map(sheet => <tr key={sheet.code}><td>{sheet.code}</td><td>{sheet.area}</td><td>{sheet.ref}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="relative font-mono text-[10.5px] leading-relaxed" style={{ color: '#8f96a0' }}>ISO 21502 practice-area terms · ISO 19650 information naming · Singapore BCA &amp; MOM touchpoints. Records are entered and confirmed by your project team.</p>
      </div>

      <div className="w-full lg:flex-1 flex flex-col relative survey-grid">
        <div className="flex items-center justify-between gap-2 p-4 sm:p-6">
          <div className="flex items-center gap-2.5 lg:invisible">
            <AppLogo className="w-9 h-9" />
            <span className="display text-xl font-bold tracking-wide">PROXIMA<span style={{ color: 'var(--accent-text)' }}>STRUC</span></span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm">Back to Home</button>
            <button aria-label={isDark ? 'Use light theme' : 'Use dark theme'} onClick={toggleTheme} className="btn btn-secondary btn-icon btn-sm !w-[34px]">
              {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-16 pt-4">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--rule)' }}>
              <div>
                <p className="eyebrow" style={{ color: 'var(--accent-text)' }}>Project access</p>
                <h1 className="display text-4xl font-semibold uppercase leading-none mt-1.5">{heading[0]}</h1>
                <p className="text-muted mt-2 text-sm">{heading[1]}</p>
              </div>
              <span className="sheet-code hidden sm:inline-flex">ACC-00</span>
            </div>

            <div className="auth-card reg-marks p-6 sm:p-7 space-y-5">
              {mode === 'login' && (<>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <label className={labelClass}>Email<input aria-label="Email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} className={inputClass} required /></label>
                  <label className={labelClass}>Password<input aria-label="Password" name="password" type="password" autoComplete="current-password" value={formData.password} onChange={handleChange} className={inputClass} required /></label>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">{loading ? 'Signing In...' : <><Shield size={17} aria-hidden="true" /> Sign In</>}</button>
                </form>
                <div className="auth-divider">OR</div>
                <div className="space-y-2.5">
                  <button onClick={handleGoogle} className="btn btn-secondary btn-block"><GoogleMark /> Sign in with Google</button>
                  <button onClick={() => setMode('magic')} className="btn btn-secondary btn-block"><Mail size={17} aria-hidden="true" /> Sign in via Email Link</button>
                </div>
              </>)}

              {mode === 'register' && (<form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={labelClass}>Full Name<input aria-label="Full Name" name="name" type="text" autoComplete="name" value={formData.name} onChange={handleChange} className={inputClass} required /></label>
                  <label className={labelClass}>Birthday<input aria-label="Birthday" name="birthday" type="date" autoComplete="bday" value={formData.birthday} onChange={handleChange} className={inputClass} required /></label>
                </div>
                <label className={labelClass}>Designation<input aria-label="Designation" name="designation" type="text" autoComplete="organization-title" placeholder="e.g. Site Engineer" value={formData.designation} onChange={handleChange} className={inputClass} required /></label>
                <label className={labelClass}>Email<input aria-label="Email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} className={inputClass} required /></label>
                <label className={labelClass}>Password<input aria-label="Password" name="password" type="password" autoComplete="new-password" value={formData.password} onChange={handleChange} className={inputClass} required /></label>
                <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">{loading ? 'Creating...' : 'Register Now'}</button>
                {backToLogin}
              </form>)}

              {mode === 'magic' && (<div className="space-y-4">
                {magicSent ? (<div role="status" data-tone="success" className="alert flex-col text-center !items-center py-5"><CheckCircle2 size={30} aria-hidden="true" />Check your email ({formData.email}) for the sign-in link!</div>) : (<form onSubmit={handleMagicLink} className="space-y-4">
                  <p className="text-sm text-muted">Enter your email and we'll send you a link to sign in instantly.</p>
                  <label className={labelClass}>Email<input aria-label="Email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} className={inputClass} required /></label>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block"><Mail size={17} aria-hidden="true" />{loading ? 'Sending...' : 'Send Magic Link'}</button>
                </form>)}
                {backToLogin}
              </div>)}

              {mode === 'confirm-email' && (<div className="space-y-4">
                <form onSubmit={handleConfirmEmail} className="space-y-4">
                  <label className={labelClass}>Email<input aria-label="Email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} className={inputClass} required /></label>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">{loading ? 'Verifying...' : 'Complete Sign In'}</button>
                </form>
                {backToLogin}
              </div>)}

              {error && <div role="alert" className="form-error">{error}</div>}
            </div>

            {mode === 'login' && <p className="text-center text-sm text-muted mt-6">Don't have an account? <button onClick={() => setMode('register')} className="font-semibold underline-offset-4 hover:underline" style={{ color: 'var(--accent-text)', minHeight: 32 }}>Register</button></p>}
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginView;
