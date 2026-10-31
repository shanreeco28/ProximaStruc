# ProximaStruc

**Site monitoring and progress management for Singapore construction projects.**

ProximaStruc gives site teams, resident engineers and project managers a single workspace to plan work, track quality inspections, control materials, manage lifting permits and keep a dated site record. It records what has been confirmed on site. It does not generate readings, valuations or cashflow figures.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%C2%B7%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Accessibility](https://img.shields.io/badge/target-WCAG%202.2%20AA-2E7D32)

---

## Contents

- [Design principles](#design-principles)
- [Features](#features)
- [Roles and permissions](#roles-and-permissions)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Scope and limitations](#scope-and-limitations)
- [Further documentation](#further-documentation)

---

## Design principles

- **Recorded data only.** Every figure shown is entered or confirmed by a person. Blank fields stay blank and are shown as "Not recorded". No sensor, weather service or turnstile feeds the system.
- **Progress, not money.** The product covers physical progress and site control. It has no payment, valuation, cashflow or other monetary workflows.
- **Evidence and accountability.** Records carry creator, timestamp and update metadata. Stage changes and deletions keep an audit trail.
- **Practice-area navigation.** The workspace is organised by project-management practice areas in the spirit of ISO 21502, adapted to Singapore site practice, including MOM workplace safety and health and RE/RTO inspection roles.
- **Accessible by default.** The interface targets WCAG 2.2 AA.

## Features

| Area | What it does |
| --- | --- |
| **Control Centre** | Project dashboard with a KPI ribbon: recorded plan progress, RE/RTO inspections, active permits, BBS and concrete records, and registered personnel. Filter the whole workspace by zone. |
| **Schedule and Lookahead** | Four-column planning board (Lookahead, Make-Ready, In Progress, Done) plus a Gantt that combines activities with inspection targets, material deliveries, diary dates and lifting permits. Activities support predecessors, hold points, required material and constraints. |
| **Quality: RE/RTO Inspections** | Five-stage request-for-inspection workflow: Created, Under RE Review, Site Inspection, Applying for Closure, Closed. Role-gated stage changes, append-only comments and history. Only the final Closed stage clears a linked planning hold point. |
| **Materials: BBS and DOs** | Separate records for bar bending schedules, concrete batches and delivery orders. Receipt, installation and pour states require a DO reference and actual date. Test results are never assumed to pass. |
| **Site Diary** | Dated entries for progress, manpower, equipment, deliveries, inspections, safety, environment, weather, instructions, visitors and delays, optionally linked to a task. |
| **Lifting and Permit-to-Work** | Lifting permit register with active and suspended states. Manual records never imply statutory compliance or authorisation to lift. |
| **Stakeholders and Access** | Personnel register, organisation details, role assignment and the deletion-verification queue. |
| **Site Observations** | Admin-only confirmed observations (weather, noise, TSS, wind, headcount and similar) with source, confirmer and confirmation time. Each confirmation is a complete observation, so older values are never silently inherited. |
| **Executive Brief** | Printable summary of progress, inspections, permits, diary and materials for the selected project or zone. |
| **Accounts** | Google sign-in and email verification, project selection, editable personal profile (name, title, phone, birthday) and logout that clears local project state. |

### Progress calculation

Plan progress is duration-weighted across activities with valid dates, with planned progress assumed linear over inclusive planned dates. It measures physical progress. It is not earned value and not a certified critical-path analysis. No historical actual S-curve is fabricated.

### Record deletion and verification

- **Admins** (including the project owner) delete operational records directly, with a reason and confirmation.
- **Other users** can request deletion only of records they created under their verified email.
- **A separate admin or manager** verifies the request. A manager cannot verify their own request.
- The record stays available while pending. Approval and deletion happen in one transaction and fail if the record changed after the request.
- Request reasons, actors, timestamps, snapshots and decision history are retained after deletion.

## Roles and permissions

Access is bound to a verified sign-in email and enforced in the UI and in Firestore security rules. The project creator is its owner and admin.

| Action | Admin / owner | Manager | Engineer | Supervisor | RE | RTO | Guest |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Read records and comment on RFIs | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Confirm site observations | Yes | | | | | | |
| Assign roles and register personnel | Yes | | | | | | |
| Edit organisation details | Yes | Yes | | | | | |
| Add and edit planning activities | Yes | Yes | Yes | | | | |
| Add and edit diary and material records | Yes | Yes | Yes | Yes | | | |
| Create RFIs and advance site-team stages | Yes | Yes | Yes | Yes | | | |
| Advance RE review and closure stages | Yes | | | | Yes | | |
| Record lifting permits | Yes | Yes | Yes | | | | |
| Delete operational records directly | Yes | | | | | | |
| Request deletion of own records | n/a | Yes | Yes | Yes | Yes | Yes | Yes |
| Verify another user's deletion request | Yes | Yes | | | | | |

Job titles are descriptive and never grant access. Signing up and opening a project only files an **access request**: the membership is created with the `pending` role, which cannot read project records. An admin assigns a role in **Stakeholders and Access** to grant access.

## Tech stack

- **Frontend:** React 19, React Router 7, Vite 7, Tailwind CSS 3, lucide-react
- **Backend services:** Firebase Authentication (Google, email), Cloud Firestore with offline persistence
- **Quality tooling:** ESLint 9, Node test runner, Playwright with axe-core, Firebase emulator rules tests
- **Hosting configuration:** Vercel (`vercel.json`) and Firebase (`firebase.json`)

## Getting started

### Prerequisites

- Node.js 20.19 or later and npm
- A Firebase project with Google sign-in and Cloud Firestore enabled
- Java, only if you run the Firestore rules tests

### Install and run

```bash
git clone https://github.com/shanreeco28/ProximaStruc.git
cd ProximaStruc
npm install
```

Copy the template and fill in your Firebase web app settings (Firebase Console, Project settings, Your apps):

```bash
cp .env.example .env
```

`.env` is ignored by git. Do not commit it.

Then start the development server:

```bash
npm run dev
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Unit tests for domain logic |
| `npm run test:browser` | Playwright workflow and accessibility tests |
| `npm run test:rules` | Firestore security rules tests in the emulator |

## Testing

- **Unit tests** cover date helpers, permissions, progress maths, Gantt data, dependencies, deletion logic and validation.
- **Browser tests** run against isolated component fixtures with no Firebase connection. They cover role visibility, the planning board, save and failed-save handling, diary, BBS receipt, observations, account controls, deletion requests, the five-stage RFI workflow, mobile navigation, axe accessibility checks and 320px reflow. Set `CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`.
- **Rules tests** run the Firestore emulator against the demo project `demo-proximastruc` and check reads and writes, role escalation, registration sync, organisation updates and RFI transitions. No production credentials are needed.

At the last recorded verification, lint and build passed with 34 unit tests and 43 Firestore rules tests. In the browser suite, 33 tests passed and 17 failed, all on pre-existing axe findings (`label-content-name-mismatch`, `landmark-unique`).

## Deployment

1. Build the app with `npm run build` and host the `dist` output, for example on Vercel.
2. Supply the `VITE_FIREBASE_*` variables in your hosting environment.
3. Review `firestore.rules` against any existing production rules, then deploy them with an authorised account:

   ```bash
   npx firebase deploy --only firestore:rules --project <your-project-id>
   ```

   Never use the demo test project for deployment.
4. Deploy `storage.rules` (deny all; the app does not use Cloud Storage) with `npx firebase deploy --only storage --project <your-project-id>`.
5. `vercel.json` sets a Content Security Policy and other security headers. If you add a new external service, add its origin to the policy.

See [SECURITY.md](SECURITY.md) for the production hardening checklist.

### Migrating an existing project

Projects created before owner IDs were introduced need these steps before the new rules are enabled:

1. Using trusted Firebase Console or Admin access, set `projects/{projectId}.ownerId` to the administrator's Firebase Auth UID.
2. As owner, open **Stakeholders and Access** and use **Confirm legacy access** for personnel records that already hold a real sign-in email.
3. For personnel without a sign-in email, register a membership with the actual email. Do not infer emails from names.
4. Make sure assigned accounts have verified emails, and test each role in a staging project first.

## Project structure

```
ProximaStruc/
├── src/
│   ├── components/     Views, forms, workspace shell, deletion review, executive brief
│   ├── contexts/       Shared React context (record deletion)
│   ├── hooks/          Project records and self-registration
│   ├── services/       Profile, project membership and record deletion
│   ├── utils/          Permissions, progress and Gantt logic, validation, unit tests
│   └── firebase.js     Firebase initialisation and Google sign-in
├── tests/
│   ├── browser/        Playwright workflow and accessibility tests
│   └── rules/          Firestore emulator rules tests
├── docs/               Workflow and policy documentation
├── firestore.rules     Backend role enforcement
├── storage.rules       Cloud Storage lockdown (deny all)
├── vercel.json         SPA rewrites and security headers
└── AGENTS.md           Project requirements for contributors and tooling
```

## Scope and limitations

- Readings are manual records. They do not imply statutory compliance or authorisation to lift.
- Automated accessibility checks cover the tested states and breakpoints. They are not a formal certification or a full assistive-technology audit.
- Printed and exported PDF accessibility, and production authentication flows, have not been certified.
- The Gantt chart and progress figures are physical progress views, not financial earned value or a certified critical path.
- Firestore rules in this repository must be reviewed and deployed by an authorised account before they protect a live project.
- Deleting a project removes its workspace entry but retains underlying site records. Deleting personnel removes assigned access, not the authentication account.

## Further documentation

- [Site workflows](docs/site-workflows.md): full workflow, role, deletion and migration notes
- [SECURITY.md](SECURITY.md): production hardening checklist and vulnerability reporting
- [AGENTS.md](AGENTS.md): product requirements and contribution constraints

## Licence

Private project. All rights reserved.
