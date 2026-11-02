# ProximaStruc on Android

The Android app is a **Trusted Web Activity (TWA)**: a small Android app that opens the live ProximaStruc site full-screen in Chrome, without a browser address bar. Features, Google sign-in and data all come from the website.

## How updates work

- **Website deploys update the app.** Every running copy (browser, installed web app and Android app) checks `/version.json` every 5 minutes and whenever it returns to the foreground. When a newer deploy is live it shows **Update available: Restart now / Later**. Restarting reloads the app on the new version. Nothing is downloaded or installed.
- **A new APK is only needed** when the Android shell itself changes: the site address, icon, colours or package name. Raise `versionCode` in `android/app/build.gradle` when that happens.

| Part | Where |
| --- | --- |
| Android project | `android/` |
| Site address, version | `TWA_HOST_NAME` repository variable, or `hostName` / `versionCode` in `android/app/build.gradle` |
| Build workflow | `.github/workflows/android.yml` (Actions tab, "Android") |
| Update prompt | `src/components/UpdatePrompt.jsx`, `src/hooks/useAppUpdate.js`, `version.json` (written at build time) |
| Web app manifest and icons | `public/manifest.webmanifest`, `public/icons/` |
| Domain verification | `public/.well-known/assetlinks.json` |
| Privacy policy | `public/privacy.html` → `https://<your-domain>/privacy.html` |
| Account deletion | `public/delete-account.html` → `https://<your-domain>/delete-account.html` |
| Store graphics | `android/store/` (512×512 icon, 1024×500 feature graphic) |

Package name: **`com.proximastruc.app`**. It is permanent once the app is uploaded to Google Play.

---

# Part A: Sideload the APK for testing

### A1. Site address

The app opens **`proximastruc.vercel.app`** (set in `hostName` in `android/app/build.gradle`). To build for a different domain without editing code, set a repository variable `TWA_HOST_NAME` (Settings → Secrets and variables → Actions → Variables) to the domain, with no `https://` and no path.

Each build's run summary checks the live site and lists whether the pages the app needs respond.

The site must be reachable by phones without a login screen in front of it. If Vercel **Deployment Protection** is on for that URL, the app can't open it or verify `assetlinks.json`. Use a domain where protection is off, such as the production domain or one with protection disabled.

### A2. Create a signing key (once, recommended)

Without a key the build still makes an installable APK, but it's signed with a throwaway test key. That APK shows an address bar, and each new build must be uninstalled before the next one installs. With your own key the app opens full-screen and later APKs install over the old one. You can reuse the same key for Google Play.

Run this on your own computer (it needs Java; Android Studio includes it). Keep the `.jks` file and its passwords safe, for example in a password manager. Never commit them.

```bash
keytool -genkeypair -v -keystore proximastruc-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Add four **repository secrets** (Settings → Secrets and variables → Actions → Secrets → New repository secret):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Output of `base64 -w0 proximastruc-upload.jks` (macOS: `base64 -i proximastruc-upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | Key password (same as the keystore password unless you chose a different one) |

### A3. Build

GitHub → **Actions** → **Android** → **Run workflow**. When it finishes, open the run:

- Download **proximastruc-apk** and unzip it to get `proximastruc.apk`.
- The run summary shows **Signing key fingerprint** (when you added a key).

### A4. Remove the address bar

Paste that fingerprint into `public/.well-known/assetlinks.json` in place of `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` and deploy the website. Check `https://<your-domain>/.well-known/assetlinks.json` shows it. Close and reopen the app; Android can take a few minutes to re-check.

### A5. Install on a phone

1. Send `proximastruc.apk` to the phone (email, Google Drive, USB, chat).
2. Open it. Android asks to allow installs from that app (Files, Chrome, Gmail and so on). Allow it, then tap **Install**.
3. If Play Protect warns about an unknown app, tap **More details → Install anyway**. This is normal for apps not from Play.
4. Chrome must be installed and up to date on the phone.

From then on, deploying the website is enough. Testers see the Restart prompt.

---

# Part B: Publish on Google Play

## 1. Fill in the placeholders

1. Set the production domain in the `TWA_HOST_NAME` repository variable (see A1), or in `hostName` in `android/app/build.gradle`.
2. Review `public/privacy.html` and `public/delete-account.html` (operator: Shan Reeco, contact: shanreecosocorro@gmail.com) so the wording matches how you run the service.
3. Deploy the website (merge to `main` so Vercel deploys it). Check that these load:
   - `https://<your-domain>/manifest.webmanifest`
   - `https://<your-domain>/privacy.html`
   - `https://<your-domain>/delete-account.html`

## 2. Upload key

Use the key from A2. If you skipped A2, do it now: Google Play rejects bundles signed with the test key.

## 3. Build the app bundle

GitHub → **Actions** → **Android** → **Run workflow**. When it finishes, download **proximastruc-aab** from the run's Artifacts section and unzip it to get `app-release.aab`.

To build locally instead, open `android/` in Android Studio, or create `android/keystore.properties` (ignored by git):

```properties
storeFile=/absolute/path/to/proximastruc-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

then run `./gradlew bundleRelease` in `android/`.

## 4. Create the Play Console account

1. Sign up at <https://play.google.com/console/signup> and pay the one-time US$25 fee.
2. Choose **Personal** or **Organisation**. An organisation account needs a D-U-N-S number.
3. Complete identity verification.
4. **New personal accounts** must run a **closed test with at least 12 testers for 14 consecutive days** before they can publish to production. Organisation accounts skip this.

## 5. Create the app and upload

1. Play Console → **Create app**. Name: ProximaStruc. App, Free.
2. **Test and release → Testing → Internal testing** (or **Closed testing** for the 12-tester requirement) → **Create release**.
3. Accept **Play App Signing** when asked, then upload `app-release.aab`.

## 6. Connect the app to the website (removes the address bar)

Google re-signs the app with its own key, so the website must trust **Google's** key:

1. Play Console → **Test and release → Setup → App signing**. Copy the **SHA-256 certificate fingerprint** under *App signing key certificate*.
2. Add it to `public/.well-known/assetlinks.json` as a second entry in `sha256_cert_fingerprints`, next to your upload-key fingerprint from A4, so both sideloaded and Play installs open full-screen.
3. Deploy the website, then check `https://<your-domain>/.well-known/assetlinks.json` returns that JSON.

If this step is skipped or wrong, the app still works but shows a Chrome address bar at the top.

## 7. Store listing and policy forms

Play Console → **Grow users → Store presence → Main store listing**, and the **App content** pages under **Policy and programs**:

| Item | What to enter |
| --- | --- |
| Short description (80 chars) | Site monitoring and progress for construction projects. |
| Full description | Adapt the Features table in `README.md`. |
| App icon | `android/store/play-icon-512.png` |
| Feature graphic | `android/store/feature-graphic-1024x500.png` |
| Phone screenshots | At least 2, taken from the app on a phone, using a real or demo project. Don't show other people's personal data. |
| Category | Business |
| Privacy policy | `https://<your-domain>/privacy.html` |
| App access | Sign-in is required. Give reviewers a test account and a project they can open. |
| Ads | No ads |
| Content rating | Fill in the questionnaire (a business tool with no objectionable content) |
| Target audience | 18 and over |
| Data safety | Collected: email address, name, phone number, date of birth (optional), user-generated content (project records). Purpose: app functionality and account management. Encrypted in transit: yes. Not shared with third parties, not sold. Users can request deletion. |
| Delete account URL | `https://<your-domain>/delete-account.html` |
| Government apps / Financial features / Health | Not applicable |

## 8. Publish

After testing (and the 14-day closed test for new personal accounts), go to **Production → Create release**, promote the tested bundle and **Send for review**. Reviews usually take a few days.

## Later updates

See [How updates work](#how-updates-work). Play installs get the same Restart prompt as sideloaded ones.
