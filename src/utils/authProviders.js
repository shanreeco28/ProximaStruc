export const GOOGLE = 'google.com';
export const APPLE = 'apple.com';
export const PASSWORD = 'password';

// The provider used to re-confirm sign-in before sensitive actions such as account deletion.
export function primaryProvider(user) {
  const ids = (user?.providerData || []).map(entry => entry.providerId);
  return [APPLE, GOOGLE, PASSWORD].find(id => ids.includes(id)) || ids[0] || PASSWORD;
}
