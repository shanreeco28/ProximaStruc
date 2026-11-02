# Publishing ProximaStruc on Google Play

The Android app is a **Trusted Web Activity (TWA)**: a small Android app that opens the live ProximaStruc site full-screen in Chrome, without a browser address bar. All features, Google sign-in and updates come from the website, so every web deploy updates the Android app too. You only upload a new Android build when the Android shell itself changes.

| Part | Where |
| --- | --- |
| Android project | `android/` |
| Site address, version | `android/app/build.gradle` (`hostName`, `versionCode`, `versionName`) |
| Build workflow | `.github/workflows/android.yml` (Actions tab, "Android (Google Play)") |
| Web app manifest and icons | `public/manifest.webmanifest`, `public/icons/` |
| Domain verification | `public/.well-known/assetlinks.json` |
| Privacy policy | `public/privacy.html` → `https://<your-domain>/privacy.html` |
| Account deletion | `public/delete-account.html` → `https://<your-domain>/delete-account.html` |
| Store graphics | `android/store/` (512×512 icon, 1024×500 feature graphic) |

Package name: **`com.proximastruc.app`**. It is permanent once the app is uploaded.

---

## 1. Fill in the placeholders

1. In `android/app/build.gradle`, set `hostName` to the live domain, with no `https://` and no path, for example `proximastruc.vercel.app`.
2. In `public/privacy.html` and `public/delete-account.html`, replace `[OPERATOR NAME]` and `[CONTACT EMAIL]` with your name or company and a support email you monitor. Review the wording so it matches how you run the service.
3. Deploy the website (merge to `main` so Vercel deploys it). Check that these load:
   - `https://<your-domain>/manifest.webmanifest`
   - `https://<your-domain>/privacy.html`
   - `https://<your-domain>/delete-account.html`

## 2. Create an upload key (once)

Run this on your own computer (it needs Java; Android Studio includes it). Keep the `.jks` file and both passwords somewhere safe, such as a password manager. Never commit them.

```bash
keytool -genkeypair -v -keystore proximastruc-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Then add four **repository secrets** in GitHub (Settings → Secrets and variables → Actions → New repository secret):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Output of `base64 -w0 proximastruc-upload.jks` (macOS: `base64 -i proximastruc-upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | Key password (same as the keystore password unless you chose a different one) |

## 3. Build the app bundle

GitHub → **Actions** → **Android (Google Play)** → **Run workflow**. When it finishes, download **proximastruc-release-aab** from the run's Artifacts section and unzip it to get `app-release.aab`.

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
2. Paste it into `public/.well-known/assetlinks.json`, replacing `REPLACE_WITH_PLAY_APP_SIGNING_SHA256`. Optionally add your upload key's fingerprint as a second entry so locally installed builds also verify.
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

- **Website changes** reach Android users straight away. There's nothing to upload.
- **Android shell changes** (icon, colours, domain): raise `versionCode` in `android/app/build.gradle`, run the workflow and upload the new `.aab`.
