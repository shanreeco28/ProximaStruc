# Site monitoring workflows

The sidebar, top bar, KPI ribbon, four-column Site Planning board and existing card/table structure remain in place. The separate analytics navigation tab stays removed; physical progress and the Gantt are available within Site Planning and the executive brief. Project requirements are recorded in AGENTS.md. The application has no payment, valuation, cashflow or monetary claim workflows. Legacy monetary fields are not displayed or used; existing records are not deleted automatically.

## Header account controls

The top-right header has **Edit profile** and **Log out** buttons. **Actions** contains **Projects** and **Generate Executive Brief**. The dropdown supports keyboard navigation, Escape and outside-click dismissal, and the controls fit mobile screens.

Profile editing is available to every assigned project role and changes only the signed-in person's name, job title, contact phone and birthday. Email stays read-only; system roles, organisation, certificates and access authorities cannot be changed through personal editing. Personal details save to the current project membership, and the display name also updates the Firebase Auth account. If the account-name update fails after the project save, the form explains the partial result and permits retrying. Logging out signs out Firebase Auth and clears the selected project and unfinished registration data; a failed sign-out preserves the session and shows an error.

## Observations and site data

The **Admin Control Panel** is visible only to project admins (including the project owner). It records confirmed observations with observation time, source/reference, confirmer and confirmation time. Weather, temperature, noise, site-specific noise limits, TSS, site-specific TSS limits, vector findings, actual headcount, wind, anti-collision checks and the incident-free start date are blank until entered. No weather service, biometric turnstile or crane sensor is connected. Readings are manual records and never imply statutory compliance or authorization to lift.

Each confirmation is a complete observation: blank fields remain unrecorded, rather than silently inheriting stale values. Read-only displays identify the observation date and source. Corrections use a new confirmation; history remains available. “Registered personnel” counts membership records, not physical attendance.

## Roles

| Action | Admin / owner | Manager | Engineer | Supervisor | RE | RTO | Guest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Read project records / comment on RFIs | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Confirm environmental observations | Yes | No | No | No | No | No | No |
| Assign roles / register other personnel | Yes | No | No | No | No | No | No |
| Edit organisation details | Yes | Yes | No | No | No | No | No |
| Add / edit planning activities | Yes | Yes | Yes | No | No | No | No |
| Add / edit diary and material records | Yes | Yes | Yes | Yes | No | No | No |
| Create RFIs / advance site-team stages | Yes | Yes | Yes | Yes | No | No | No |
| Advance RE-review / closure stages | Yes | No | No | No | Yes | No | No |
| Record lifting permits | Yes | Yes | Yes | No | No | No | No |
| Delete RFIs | Yes | No | No | No | No | No | No |

A new project's creator is its owner/admin. Do not infer admin access from an empty personnel list. Verified accounts synchronize a guest profile when opening a project, using their supplied sign-up details and leaving organisation/certificate fields blank. An existing invited membership and assigned role are preserved. Only the project's recorded owner receives admin through synchronization; other roles require explicit admin assignment. The job title is descriptive and does not grant access. Role assignments are bound to a verified sign-in email; unverified users can request verification from the project screen. Owner access uses the authenticated UID.

RFIs retain the five-stage process: Created, Under RE Review, Site Inspection, Applying for Closure, Closed. Site-team roles advance stages 1 and 3; REs advance stages 2 and 4; admins can advance either. Only the final Closed stage (stored index 4) clears a linked planning hold point. Existing records at index 3 are not automatically treated as closed; an RE or admin must review and advance them through the current workflow. RTOs retain review/comment access. The creator (while still a site-team member) or an admin can edit inspection details; only admins can delete. Stage transitions use a transaction to reject stale updates and append audit history. Comments append atomically. Forms cannot bypass stage permissions or overwrite discussion history. Manager organisation updates are limited to that field and audit metadata; they cannot change roles.

## Planning and progress

Activities record a WBS/reference, zone, responsible person, planned dates, workflow status, completion, lookahead commitment, predecessor, inspection hold point, required material and constraint. Work flows through Lookahead, Make-Ready, In Progress and Done, retaining the existing board layout. Blocked work stays in Make-Ready with a visible blocker label. Both earlier title-case statuses and the existing board status IDs are supported; newly saved activities use the board IDs. The form rejects cyclic dependencies and prevents Make-Ready/In Progress/Done while a linked predecessor is incomplete, an inspection is uncleared, required material has not arrived or an explicit blocker remains. Changing related records recalculates displayed constraints; it never silently changes recorded activity completion.

The Gantt combines dated activities with inspection targets, material delivery dates, diary dates and lifting permit dates within the selected zone. Inspections/material links can resolve across the project. Site event milestones do not invent activity completion. Undated legacy activities stay visible on the board but are excluded from the chart. The planning progress summary and brief use duration-weighted completion for activities with valid dates; planned progress assumes linear work over inclusive planned dates. This is physical progress, not financial earned value or a certified CPM critical path. No historical actual S-curve is fabricated.

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
2. The owner can open Role & Subcon Matrix and use **Confirm legacy access** for legacy records that already contain the user’s actual sign-in email. This copies the record to `artifacts/{projectId}/users/{lowercaseEmail}` and removes the old document in one transaction, refusing to overwrite an existing canonical membership. If self-registration already created that membership, assign its reviewed role on the canonical row and review the legacy duplicate separately. Review the assigned role. The migration records its source ID and preserves descriptive personnel fields.
3. For legacy personnel without a sign-in email, register a membership using the actual email. Do not infer email from a name. Review duplicate legacy personnel entries separately; they are not automatically deleted.
4. Ensure assigned accounts verify their emails (Google accounts normally already do). Test owner/admin, engineer, supervisor and guest access in a staging project.
5. Run the emulator rules tests and deploy reviewed rules with an authorized Firebase account: `npx firebase deploy --only firestore:rules --project <your-project-id>`. Do not use the demo test project for deployment.

No live data migrations, account creation or production deployments are performed by the tests.

## Validation

- `npm test`: date helpers and domain logic (permissions, progress math, Gantt data, dependencies, validation).
- `npm run test:browser`: isolated workflow component fixtures, including role visibility, the existing board layout/statuses, save/edit, failed saves, diary, BBS receipt, observation confirmation, header dropdown/profile/logout controls, five-stage RFI review/comment/delete permissions, manager organisation edits and mobile navigation. Uses `/usr/bin/chromium` by default; set `CHROMIUM_PATH` to a compatible local browser elsewhere. Fixtures have no Firebase connection and are not part of the production build.
- `npm run test:rules`: starts the Firestore emulator for `demo-proximastruc`, then checks direct reads/writes, role escalation, registration synchronization, manager-only organisation updates and five-stage RFI transitions/discussion integrity. Requires Java and access to `storage.googleapis.com` for the official emulator download. Local runtime state goes under `/workspace/.config` and `/workspace/.cache/firebase/emulators`; no production credentials are needed.
- `npm run lint` and `npm run build`.

Current verification: lint and the production build pass, along with 26 unit tests, 16 browser workflow tests and 34 Firestore emulator tests. The official emulator download is now accessible and backend permission tests complete successfully. Production rules remain undeployed; authenticated production operations and legacy data migration have not been performed.
