# Publishing ProximaStruc on the Apple App Store

The iOS app is the same React app wrapped in a native shell with [Capacitor](https://capacitorjs.com). [Codemagic](https://codemagic.io) builds, signs and uploads it on a cloud Mac, so **you do not need a Mac**. Everything below runs in a web browser plus one terminal command.

| Item | Value |
| --- | --- |
| Bundle ID | `com.proximastruc.app` (change in `capacitor.config.json`, `codemagic.yaml` and `ios/App/App.xcodeproj/project.pbxproj` **before** the first upload if you want another) |
| Devices | iPhone (iPads run it in iPhone mode) |
| Minimum iOS | 15.0 |
| Version | `version` in `package.json` |
| Build config | `codemagic.yaml`, workflow `ios-app-store` |

## What changed for iOS

- `ios/` holds the native Xcode project (Swift Package Manager, no CocoaPods).
- **Google sign-in** uses the native Google SDK, because Google blocks sign-in inside app web views.
- **Sign in with Apple** is offered in the iOS app (App Store Guideline 4.8).
- **Email-link sign-in** is hidden in the app, because the link cannot return to it. Password, Google and Apple remain.
- **Delete account** is in the **Actions** menu on the web and in the app (Guideline 5.1.1(v)). It re-confirms the sign-in, removes the user's own personnel profile from every project, revokes the Apple token for Apple accounts and deletes the Firebase account. Records the user created keep their creator email as the audit trail. `firestore.rules` gains one rule that lets a verified user delete only their own `users` profile.
- **Print / Export PDF** opens the iOS print sheet (`ios/App/App/NativePrintPlugin.swift`), which also offers *Save to Files*.
- `public/privacy.html` is a privacy policy page served by the website at `/privacy.html`.

---

## 1. Apple Developer account

1. Enrol at <https://developer.apple.com/programs/enroll/> (USD 99 per year). Enrol as an **Organisation** if the store should show a company name; that needs a D-U-N-S number.
2. Wait for the approval email (usually 1–2 days).

## 2. Register the App ID with Sign in with Apple

1. Go to <https://developer.apple.com/account/resources/identifiers/list> and click **+**.
2. Choose **App IDs → App**, enter the description `ProximaStruc` and **Explicit** Bundle ID `com.proximastruc.app`.
3. Under Capabilities, tick **Sign In with Apple**. Click **Continue → Register**.

## 3. Firebase

In the [Firebase console](https://console.firebase.google.com) for your production project:

1. **Project settings → Your apps → Add app → iOS+**. Enter the Bundle ID `com.proximastruc.app` and register it.
2. Download **GoogleService-Info.plist**. Keep it; step 6 uses it. Do not commit it.
3. **Authentication → Sign-in method**: enable **Apple** (no Services ID is needed for the iOS app alone). Google and Email/Password should already be enabled.
4. Deploy the updated security rules, which add self-deletion of a user's own profile:

   ```bash
   npx firebase deploy --only firestore:rules --project <your-project-id>
   ```

## 4. App Store Connect

1. At <https://appstoreconnect.apple.com> go to **Apps → + → New App**: platform iOS, name **ProximaStruc**, language English, Bundle ID `com.proximastruc.app`, SKU `proximastruc-ios`.
2. **Business** (Agreements, Tax and Banking): accept the Free Apps agreement.
3. Create an API key for Codemagic: **Users and Access → Integrations → App Store Connect API → Team Keys → +**. Name it `Codemagic`, access **App Manager**. Download the `.p8` file (it can be downloaded only once) and note the **Key ID** and **Issuer ID**.

## 5. Certificate private key

Codemagic creates the distribution certificate for you and needs a private key to do it. Run this once on any computer (Windows PowerShell, macOS or Linux):

```bash
ssh-keygen -t rsa -b 2048 -m PEM -f ios_distribution_key -q -N ""
```

Keep the `ios_distribution_key` file private. Do not commit it.

## 6. Codemagic

1. Sign up at <https://codemagic.io> with GitHub and add the `ProximaStruc` repository. Choose **codemagic.yaml** as the configuration.
2. In the app's **Environment variables** tab, create two groups. Tick **Secure** for every value.

   **Group `app_store_credentials`**

   | Variable | Value |
   | --- | --- |
   | `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID from step 4 |
   | `APP_STORE_CONNECT_KEY_IDENTIFIER` | Key ID from step 4 |
   | `APP_STORE_CONNECT_PRIVATE_KEY` | Full contents of the `.p8` file, including the BEGIN/END lines |
   | `CERTIFICATE_PRIVATE_KEY` | Full contents of `ios_distribution_key` from step 5 |

   **Group `firebase`**

   | Variable | Value |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | The same six values you use on Vercel |
   | `GOOGLE_SERVICE_INFO_PLIST` | `GoogleService-Info.plist` encoded as base64 (see below) |

   To produce the base64 text, in Windows PowerShell:

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("GoogleService-Info.plist")) | Set-Clipboard
   ```

   On macOS or Linux:

   ```bash
   base64 < GoogleService-Info.plist | tr -d '\n'
   ```

## 7. Build and upload

Start a build in either of these ways:

- In Codemagic, click **Start new build**, then choose the branch and the `ios-app-store` workflow.
- Push a tag, for example `git tag ios-v1.0.0 && git push origin ios-v1.0.0`.

The build runs lint and unit tests, builds the web app, signs it and uploads it to App Store Connect. It takes about 15–25 minutes. After Apple processes it (10–30 minutes), it appears under **TestFlight**.

## 8. Test with TestFlight

1. In App Store Connect → **TestFlight → Internal Testing**, add yourself and your team.
2. Install the **TestFlight** app on an iPhone and accept the invite.
3. Check: password, Google and Apple sign-in; project selection and access requests; each role's workflows; offline behaviour; Executive Brief printing and saving to PDF; Delete account (with a throwaway account).

## 9. Store listing

On the app's **1.0 Prepare for Submission** page:

- **Screenshots**: at least three at **1320 × 2868** (6.9" iPhone). Without a Mac, take them on a large iPhone running the TestFlight build, or on a desktop browser in responsive mode at 440 × 956 with 3× scale.
- **Promotional text, description, keywords** (100 characters), **support URL** (for example your Vercel site) and **copyright**.
- **Category**: Business (secondary: Productivity).

Under **App Information** and **App Privacy**:

- **Privacy Policy URL**: `https://<your-site>/privacy.html`. First replace `[OPERATOR NAME]` and `[CONTACT EMAIL]` in `public/privacy.html` and redeploy the website.
- **Data collection**: answer *Yes, we collect data* and declare the following, all **linked to the user**, **not used for tracking**, purpose **App Functionality**:
  - Contact Info: Name, Email Address, Phone Number
  - User Content: Other User Content (site records and comments)
  - Identifiers: User ID
  - Other Data: Other Data Types (birthday, job title)
- **Age rating**: answer *None* to every content question.
- **Content rights**: no third-party content.

## 10. App Review information (important)

New accounts start as **pending** and see no project data, so the reviewer needs a ready account:

1. Create a project such as `App Review Demo` with representative (non-confidential) records.
2. Register an email/password account such as `appreview@<your-domain>`, verify its email, and give it a role (for example **engineer**) in that project.
3. In **App Review Information**, enter that email and password. Add a note like:

   > ProximaStruc is a site monitoring tool for construction teams. Use the demo account, choose the "App Review Demo" project, and explore Schedule, Quality inspections, Materials and Site Diary. Account deletion is under Actions → Delete account.

## 11. Submit

Select the TestFlight build on the version page, then choose **Add for Review → Submit to App Review**. Review usually takes 24–48 hours. If Apple rejects it, the message cites a guideline. Fix the issue, run a new build and resubmit.

Because ProximaStruc is for specific site teams, you may instead request **Unlisted App Distribution** (<https://developer.apple.com/support/unlisted-app-distribution/>). The app is then reachable only by direct link. It still goes through review.

## Releasing updates

1. Raise `version` in `package.json` (for example `1.0.1`).
2. Start a Codemagic build, or push a tag `ios-v1.0.1`.
3. In App Store Connect, add a new version, choose the build, write *What's New* and submit.

Web-only changes also need a new iOS build, because the web app is bundled inside the iOS app.

## Building on a Mac (optional)

```bash
npm ci
```

```bash
npm run ios:sync
```

Copy `GoogleService-Info.plist` into `ios/App/App/`, then:

```bash
npm run ios:configure
```

```bash
npx cap open ios
```

In Xcode, select your team under **Signing & Capabilities**, then run on a device or choose **Product → Archive**.
