# Site monitoring workflows

The sidebar, top bar, KPI ribbon and card/table structure remain in place. Project requirements are recorded in AGENTS.md. The application has no payment, valuation, cashflow or monetary claim workflows. Legacy monetary fields are not displayed or used; existing records are not deleted automatically.

## Observations and site data

The **Admin Control Panel** is visible only to project admins (including the project owner). It records confirmed observations with observation time, source/reference, confirmer and confirmation time. Weather, temperature, noise, site-specific noise limits, TSS, site-specific TSS limits, vector findings, actual headcount, wind, anti-collision checks and the incident-free start date are blank until entered. No weather service, biometric turnstile or crane sensor is connected. Readings are manual records and never imply statutory compliance or authorization to lift.

Each confirmation is a complete observation: blank fields remain unrecorded, rather than silently inheriting stale values. Read-only displays identify the observation date and source. Corrections use a new confirmation; history remains available. “Registered personnel” counts membership records, not physical attendance.

## Roles

| Action | Admin / owner | Manager | Engineer | Supervisor | Guest |
| --- | --- | --- | --- | --- | --- |
| Read project records | Yes | Yes | Yes | Yes | Yes |
| Confirm environmental observations | Yes | No | No | No | No |
| Assign roles / register personnel | Yes | No | No | No | No |
| Add / edit planning activities | Yes | Yes | Yes | No | No |
| Add / edit diary and material records | Yes | Yes | Yes | Yes | No |
| Record inspection stages / lifting permits | Yes | Yes | Yes | No | No |

A new project’s creator is its owner/admin. Do not infer admin access from an empty personnel list. Invited personnel start as guests; an admin explicitly assigns a system role. The job title is descriptive and does not grant access. Role assignments are bound to a verified sign-in email; unverified users can request verification from the project screen. Owner access uses the authenticated UID.

## Planning and progress

Activities record a WBS/reference, zone, responsible person, planned dates, workflow status, completion, lookahead commitment, predecessor, inspection hold point, required material and constraint. Work flows through Backlog, Ready, In progress, Blocked and Done. The form rejects cyclic dependencies and prevents Ready/In progress/Done while a linked predecessor is incomplete, an inspection is uncleared, required material has not arrived or an explicit blocker remains. Changing related records recalculates displayed constraints; it never silently changes recorded activity completion.

The Gantt combines dated activities with inspection targets, material delivery dates, diary dates and lifting permit dates within the selected zone. Inspections/material links can resolve across the project. Site event milestones do not invent activity completion. Undated legacy records stay visible in their tables but are excluded from the chart. The progress report and brief use duration-weighted completion for activities with valid dates; planned progress assumes linear work over inclusive planned dates. This is physical progress, not financial earned value or a certified CPM critical path. No historical actual S-curve is fabricated.

## Diary and materials

Supervisors and above can record work progress, manpower, equipment, deliveries, inspections, safety, environment, weather, instructions, visitors, delays and other events. Each entry records event date/time, category, zone, title, details, optional task link and follow-up. Existing weatherLogs are retained and displayed as legacy site records without contractual claim text.

Material records are separated by type while keeping the existing summary cards and table:

- **BBS:** drawing/revision, bar mark, diameter, cutting length, whole bar count, quantity/unit, supplier, element and zone.
- **Concrete:** mix grade, pour location, quantity/unit, batch ticket, slump, cube/test reference and recorded test result. Test results are never assumed to pass.
- **Delivery order:** DO reference, material description, quantity/unit, supplier, required/actual receipt dates and links to the relevant BBS/batch record or planned activity.

Receipt, installation and pour states require a DO reference and actual receipt date; concrete receipt also requires its batch ticket. BBS may be marked Installed; concrete may be marked Poured. Quantity totals are not added across incompatible units. Edits save to Firestore; failed saves preserve the form and show an error.

## Deploying permissions and existing project migration

`firestore.rules` implements the role restrictions on the backend. **These rules have not been deployed to the live Firebase project.** UI guards are not a replacement for deployed rules. Review these rules against any existing production rules and integrations before deployment.

Existing projects predate owner IDs and used random personnel document IDs. Before enabling the new rules:

1. Using trusted Firebase Console/Admin access, set `projects/{projectId}.ownerId` to the established project administrator’s Firebase Auth UID. Do not select an owner from an empty list or allow users to claim ownership themselves.
2. The owner can open Role & Subcon Matrix and use **Confirm legacy access** for legacy records that already contain the user’s actual sign-in email. This copies the record to `artifacts/{projectId}/users/{lowercaseEmail}` and removes the old document in one batch. Review the assigned role. The migration records its source ID and preserves descriptive personnel fields.
3. For legacy personnel without a sign-in email, register a membership using the actual email. Do not infer email from a name. Review duplicate legacy personnel entries separately; they are not automatically deleted.
4. Ensure assigned accounts verify their emails (Google accounts normally already do). Test owner/admin, engineer, supervisor and guest access in a staging project.
5. Run the emulator rules tests and deploy reviewed rules with an authorized Firebase account: `npx firebase deploy --only firestore:rules --project <your-project-id>`. Do not use the demo test project for deployment.

No live data migrations, account creation or production deployments are performed by the tests.

## Validation

- `npm test`: date helpers and domain logic (permissions, progress math, Gantt data, dependencies, validation).
- `npm run test:browser`: isolated workflow component fixtures, including role visibility, save/edit, failed save, diary, BBS receipt, observation confirmation and mobile navigation. Uses `/usr/bin/chromium` by default; set `CHROMIUM_PATH` to a compatible local browser elsewhere. Fixtures have no Firebase connection and are not part of the production build.
- `npm run test:rules`: starts the Firestore emulator for `demo-proximastruc`, then checks direct reads/writes and role escalation. Requires Java and access to `storage.googleapis.com` for the official emulator download. Local runtime state goes under `/workspace/.config` and `/workspace/.cache/firebase/emulators`; no production credentials are needed.
- `npm run lint` and `npm run build`.

Current verification: build, lint, 20 unit tests and 7 browser tests pass. The emulator rules tests could not start because the emulator download domain is blocked by the current environment network policy. The required domain has been saved in the environment draft; review/save environment settings before retrying. Backend rules and authenticated production operations remain unverified.
