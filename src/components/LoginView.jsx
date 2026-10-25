// src/components/LoginView.jsx
import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, signInWithGoogleSmart, getRedirectResult } from '../firebase';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Catch user returning from signInWithRedirect fallback
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user && onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      })
      .catch((err) => {
        setErrorMsg(err.message);
      });
  }, [onLoginSuccess]);

  // IMPORTANT: Keep signInWithGoogleSmart() as the VERY FIRST async call in onClick
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const user = await signInWithGoogleSmart();
      if (user && onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(`Google Sign-In failed: ${err.code || err.message}`);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const userCred = isRegistering
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      if (onLoginSuccess) onLoginSuccess(userCred.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold">
            ISO 19650 Common Data Environment
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            PROXIMA<span className="text-blue-600">STRUC</span> Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with your project credentials or authorized Google account.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@company.com.sg"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {loading
              ? 'Authenticating...'
              : isRegistering
              ? 'Create CDE Account'
              : 'Sign In with Email'}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-3 text-xs text-slate-400 uppercase font-semibold">
            Or
          </span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <span>Continue with Google SSO</span>
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            {isRegistering
              ? 'Already registered? Sign in instead'
              : 'Need a project account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
}
