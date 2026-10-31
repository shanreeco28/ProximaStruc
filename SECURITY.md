# Security

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub's **Report a vulnerability** button on the repository's Security tab. Do not open a public issue.

## How access is enforced

- Firebase web configuration (`VITE_FIREBASE_*`) is shipped to every browser and is not a secret. Security comes from Firebase Authentication, `firestore.rules`, `storage.rules`, and API key restrictions. It is not hidden configuration.
- `.env` is git-ignored. Use `.env.example` as the template and set the same variables in the hosting provider.
- Signing up grants no project access. Opening a project files a `pending` membership that can read only its own profile until a project admin assigns a role.
- Only site owners (`siteOwners/{uid}`, writable only from the Firebase Console or Admin SDK) can create or delete projects, and they act as admin in every project. Treat site owner accounts as the most privileged accounts: use a strong sign-in method and keep the list short.
- Cloud Storage is not used, and `storage.rules` denies all access.
- `vercel.json` sends a Content Security Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, a referrer policy and a permissions policy.

## Production hardening checklist

These steps need project owner access to the Firebase, Google Cloud and Vercel consoles. The rules in this repository only protect the live project once they are deployed.

1. Deploy `firestore.rules` and `storage.rules` to the production Firebase project, then designate the site owner (README, Site owner).
2. Restrict the browser API key in Google Cloud Console to the site's HTTP referrers and the Firebase APIs.
3. Restrict Firebase Authentication authorized domains to the production domain(s).
4. Enable email enumeration protection in Firebase Authentication.
5. Review existing `guest` memberships in each project, because they were granted automatically before access requests were introduced.
6. Consider enabling Firebase App Check (reCAPTCHA Enterprise) for Firestore.
