import React, { useState } from 'react';
import { Moon, Sun, Shield, Mail, CheckCircle2 } from 'lucide-react';
import AppLogo from './AppLogo';
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

const LoginView = ({ initialMode = 'login', isDark, toggleTheme, onRegisterData }) => {
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
      window.sessionStorage.removeItem('emailForSignIn');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // Auth only - user profile syncs in App
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleEmailLogin = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { await signInWithEmailAndPassword(auth, formData.email, formData.password); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError('');

    // Store temp data in memory to sync later (Fixes localStorage security vulnerability)
    if (onRegisterData) {
      onRegisterData({ designation: formData.designation, birthday: formData.birthday });
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(result.user, { displayName: formData.name });
    } catch (err) {
      setError(err.message);
      // Clear temp data on error
      if (onRegisterData) onRegisterData(null);
    } finally { setLoading(false); }
  };
  const handleMagicLink = async (e) => { e.preventDefault(); setLoading(true); setError(''); const actionCodeSettings = { url: window.location.href, handleCodeInApp: true }; try { await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings); window.sessionStorage.setItem('emailForSignIn', formData.email); setMagicSent(true); } catch (err) { setError(err.message); } finally { setLoading(false); } };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
         <button onClick={toggleTheme} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-500 hover:text-blue-500 transition-colors">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
         </button>
      </div>
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-8 text-center"><div className="mx-auto bg-blue-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg"><AppLogo className="w-10 h-10 text-white" /></div><h1 className="text-2xl font-bold text-white mt-4">SB-CasTrack</h1><p className="text-slate-400 mt-2">Construction Logistics Management</p></div>
        <div className="p-8 space-y-6">
          {mode === 'login' && (<><form onSubmit={handleEmailLogin} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" required /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label><input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" required /></div><button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Signing In...' : <><Shield size={18} /> Sign In</>}</button></form><div className="flex items-center gap-2 my-2"><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div><span className="text-xs text-slate-400">OR</span><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div></div><button onClick={handleGoogle} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" /> Sign in with Google</button><button onClick={() => setMode('magic')} className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"><Mail size={18} /> Sign in via Email Link</button><div className="text-center text-sm text-slate-500 mt-4">Don't have an account? <button onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline">Register</button></div></>)}
          {mode === 'register' && (<form onSubmit={handleRegister} className="space-y-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Create Account</h3><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label><input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Birthday</label><input name="birthday" type="date" value={formData.birthday} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Designation</label><input name="designation" type="text" placeholder="e.g. Site Engineer" value={formData.designation} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label><input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div><button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Creating...' : 'Register Now'}</button><button type="button" onClick={() => setMode('login')} className="w-full text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700">Back to Login</button></form>)}
          {mode === 'magic' && (<div className="space-y-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Passwordless Login</h3>{magicSent ? (<div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center"><CheckCircle2 className="mx-auto mb-2" size={32} />Check your email ({formData.email}) for the sign-in link!</div>) : (<form onSubmit={handleMagicLink} className="space-y-4"><p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we'll send you a link to sign in instantly.</p><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" required /></div><button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Sending...' : 'Send Magic Link'}</button></form>)}<button type="button" onClick={() => setMode('login')} className="w-full text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700">Back to Login</button></div>)}
          {mode === 'confirm-email' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirm Email</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Please confirm your email address to complete sign-in.</p>
              <form onSubmit={handleConfirmEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  {loading ? 'Verifying...' : 'Complete Sign In'}
                </button>
              </form>
              <button type="button" onClick={() => setMode('login')} className="w-full text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700">Back to Login</button>
            </div>
          )}
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
