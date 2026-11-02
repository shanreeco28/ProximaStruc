import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithCredential,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { isNativeApp } from '../native/platform';
import { APPLE, GOOGLE, PASSWORD, primaryProvider } from '../utils/authProviders.js';

export { APPLE, GOOGLE, PASSWORD };

// Runs the provider's native sheet (iOS) and turns the result into a Firebase JS credential.
// The plugin is configured with skipNativeAuth, so the Firebase JS SDK stays the single
// source of the signed-in user for Firestore and the rest of the app.
async function nativeCredential(providerId) {
  if (providerId === GOOGLE) {
    const result = await FirebaseAuthentication.signInWithGoogle();
    return { credential: GoogleAuthProvider.credential(result.credential?.idToken, result.credential?.accessToken), displayName: result.user?.displayName };
  }
  if (providerId === APPLE) {
    const result = await FirebaseAuthentication.signInWithApple();
    const credential = new OAuthProvider(APPLE).credential({ idToken: result.credential?.idToken, rawNonce: result.credential?.nonce });
    return { credential, displayName: result.user?.displayName, authorizationCode: result.credential?.authorizationCode };
  }
  throw new Error('Unsupported sign-in provider.');
}

function webProvider(providerId) {
  if (providerId === GOOGLE) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }
  const provider = new OAuthProvider(APPLE);
  provider.addScope('email'); provider.addScope('name');
  return provider;
}

export async function signInWithProvider(providerId) {
  if (!isNativeApp()) return (await signInWithPopup(auth, webProvider(providerId))).user;
  const { credential, displayName } = await nativeCredential(providerId);
  const { user } = await signInWithCredential(auth, credential);
  // Apple shares the user's name only on the first sign-in, so keep it on the account.
  if (!user.displayName && displayName) await updateProfile(user, { displayName }).catch(() => {});
  return user;
}

// Firebase requires a recent sign-in before deleting an account. Returns the Apple
// authorization code when available so the Apple token can be revoked.
export async function reauthenticate(user, { password } = {}) {
  const providerId = primaryProvider(user);
  if (providerId === PASSWORD) {
    if (!password) throw new Error('Enter your password to confirm.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    return {};
  }
  if (!isNativeApp()) { await reauthenticateWithPopup(user, webProvider(providerId)); return {}; }
  const { credential, authorizationCode } = await nativeCredential(providerId);
  await reauthenticateWithCredential(user, credential);
  return { authorizationCode };
}
