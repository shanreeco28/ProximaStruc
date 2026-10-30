import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardCheck, DraftingCompass, Mail, Moon, NotebookPen, Shield, Sun, Truck } from 'lucide-react';
import AppLogo from './AppLogo';
import useTheme from '../hooks/useTheme';
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

const FEATURES = [
  [DraftingCompass, 'Site planning & lookahead', 'Make-ready board, sprint commitments and a generated Gantt.'],
  [ClipboardCheck, 'RE / RTO inspection workflow', 'Five-stage RFI sign-off with comments and full history.'],
  [Truck, 'Materials, BBS & deliveries', 'Trace bar bending schedules, batches and delivery orders.'],
  [NotebookPen, 'Site diary & lifting permits', 'Daily records and permit-to-work status in one place.'],
];

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
      <div className="auth-brand-panel hidden lg:flex w-[46%] xl:w-1/2 flex-col justify-between p-12 xl:p-16">
        <div className="grid-lines" aria-hidden="true" />
        <button onClick={() => navigate('/')} className="relative flex items-center gap-3 self-start rounded-xl hover:opacity-90 transition-opacity">
          <AppLogo className="w-11 h-11" />
          <span className="text-lg font-bold tracking-wide text-white">PROXIMA<span style={{ color: '#8fb1ff' }}>STRUC</span></span>
        </button>
        <div className="relative max-w-lg">
          <p className="text-4xl xl:text-[2.75rem] font-bold tracking-tight text-white leading-[1.1]">Construction site monitoring, planned and recorded in one workspace.</p>
          <p className="mt-5 text-base leading-relaxed" style={{ color: '#b9c6da' }}>Construction Logistics Management — planning, inspections, materials and site records for every project team.</p>
          <ul className="mt-10 grid gap-4">
            {FEATURES.map(([Icon, title, text]) => <li key={title} className="flex items-start gap-3.5">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: 'rgb(255 255 255 / 8%)', border: '1px solid rgb(255 255 255 / 14%)', color: '#a9c4ff' }}><Icon size={19} aria-hidden="true" /></span>
              <span><span className="block font-semibold text-white text-[15px]">{title}</span><span className="block text-sm mt-0.5" style={{ color: '#a9b7cc' }}>{text}</span></span>
            </li>)}
          </ul>
        </div>
        <p className="relative text-xs" style={{ color: '#8a9ab4' }}>Records shown in the workspace are entered and confirmed by your project team.</p>
      </div>

      <div className="w-full lg:flex-1 flex flex-col relative">
        <div className="flex items-center justify-between gap-2 p-4 sm:p-6">
          <div className="flex items-center gap-2.5 lg:invisible">
            <AppLogo className="w-9 h-9" />
            <span className="font-bold tracking-wide">PROXIMA<span style={{ color: 'var(--accent-text)' }}>STRUC</span></span>
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
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight">{heading[0]}</h1>
              <p className="text-muted mt-1.5 text-sm">{heading[1]}</p>
            </div>

            <div className="auth-card p-6 sm:p-7 space-y-5">
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
