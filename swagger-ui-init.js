
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.3",
    "info": {
      "title": "LTraffic Unified API",
      "version": "0.1.0",
      "description": "REST API serving LTraffic Admin and Employee mobile apps. Legacy PHP web keeps its own session auth.",
      "contact": {
        "name": "LTraffic Engineering"
      }
    },
    "servers": [
      {
        "url": "https://api.ltraffic.co.uk/api/v1",
        "description": "production"
      }
    ],
    "tags": [
      {
        "name": "System",
        "description": "Health checks and system status"
      },
      {
        "name": "Authentication",
        "description": "JWT-based authentication for the LTraffic mobile apps (Admin and Employee).\n\n## Token Architecture\n\n| Token | Type | Lifetime | Storage |\n|-------|------|----------|---------|\n| Access Token | JWT (HS256) | 15 minutes | Memory / secure variable |\n| Refresh Token | 64-char opaque hex | 60 days | Keychain / EncryptedSharedPreferences |\n\n## Authentication Flow\n\n1. **Login** — `POST /auth/login` with credentials → receive `accessToken` + `refreshToken` + user profile.\n2. **Use API** — send `Authorization: Bearer <accessToken>` on every request.\n3. **Token expires** — API returns `401 AUTH_TOKEN_EXPIRED`.\n4. **Refresh** — `POST /auth/refresh` with the old `refreshToken` → receive a new pair. The old refresh token is revoked (rotation).\n5. **Retry** — repeat the failed request with the new `accessToken`.\n6. **Logout** — `POST /auth/logout` with the current `refreshToken` to revoke it. Discard both tokens.\n\n## User Type Routing\n\nThe `userType` field in the login response tells the mobile app which UI to show:\n- `admin` — levels 1 (Admin), 4 (Admin1), 7 (Admin2), 8 (Essex Supervisor)\n- `employee` — all other levels\n\n## Common Error Codes\n\n| Code | HTTP | Meaning |\n|------|------|---------|\n| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong username/email or password |\n| `AUTH_USER_DISABLED` | 403 | User's role/level is disabled |\n| `AUTH_TOKEN_EXPIRED` | 401 | Access token has expired — call `/auth/refresh` |\n| `AUTH_TOKEN_INVALID` | 401 | Malformed or tampered JWT |\n| `AUTH_REFRESH_INVALID` | 401 | Refresh token unknown, expired, or already used — user must log in again |\n| `UNAUTHORIZED` | 401 | No Authorization header provided |\n| `RATE_LIMITED` | 429 | Too many requests — back off and retry |\n\n## PHP Compatibility\n\nPasswords are read/written as MD5 in `login_users.password` (same column PHP uses).\nOn login the Node API lazy-caches a bcrypt hash in `lt_user_credentials` for\nfuture comparison performance. Both systems always work with the same password."
      },
      {
        "name": "Devices",
        "description": "FCM push notification device token management for both Admin and Employee mobile apps.\n\n## How It Works\n\n1. **Register** — `POST /devices/register` with the FCM token after login or app launch. Upsert-safe — re-registering a token that belongs to another user (shared device) transfers ownership automatically.\n2. **Unregister** — `POST /devices/unregister` to revoke the token on logout or notification opt-out. Only the token owner can revoke.\n3. **List** — `GET /devices` returns the current user's active (non-revoked) tokens.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `lt_device_tokens` | FCM tokens with user, platform, appVersion, revoked_at |\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Full access |\n\n## PHP Compatibility\n\nThis is a new Node-only table (`lt_device_tokens`). PHP does not manage push tokens."
      },
      {
        "name": "Notifications",
        "description": "Authenticated-user notification inbox, read state, and unread counts."
      },
      {
        "name": "My Account",
        "description": "Admin-managed About Us, Privacy Policy and Terms & Conditions pages."
      },
      {
        "name": "Admin - Contacts",
        "description": "Admin management for the company contact directory stored in the legacy hr table."
      },
      {
        "name": "Bulletins",
        "description": "Employee-facing bulletin reading and acknowledgement.\n\nThe mobile app should call `GET /employee/bulletins/pending` on every launch and **block navigation** if the result is non-empty — employees must read and acknowledge all active bulletins before using other app features.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `bulletinnew` | Bulletin content and active/inactive flag |\n| `bulletinread` | Per-user read tracking (one row per user per bulletin) |\n| `bulletinconfirm` | Audit log of every acknowledgement click |\n\n## Key Business Rules\n\n- **Pending endpoint** returns unread active bulletins (not paginated — returns all at once)\n- **Acknowledge** is idempotent for read tracking (`bulletinread`) but NOT for audit logging (`bulletinconfirm` — every call inserts a row)\n- `is_read` flag is derived from `bulletinread` for the current user\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Full access |\n\n## PHP Compatibility\n\nReads from / writes to the same `bulletinnew`, `bulletinread`, and `bulletinconfirm` tables as PHP. Replaces the forced-read popup and bulletin list in the PHP employee area."
      },
      {
        "name": "Contacts",
        "description": "Company contact directory. Employees can browse and search colleagues by name; Admin and Admin1 can add and edit contacts, while full Admin can remove them.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `hr` | Employee records (shared with HR module) |\n\n## Fields Returned\n\n`employeeid`, `firstname`, `surname`, `ltrafficphone`, `ltrafficemail`, `jobtitle`, `linemanager`, `location`, `photoimage`\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Read-only directory (list + detail) |\n| Admin, Admin1 | Add and edit contacts |\n| Admin | Remove contacts |\n\n## PHP Compatibility\n\nReads from the same `hr` table as PHP. Replaces the employee contact directory."
      },
      {
        "name": "Documents",
        "description": "Read-only access to company documents across four categories: Policies, Method Statements, Processes, and CoSHH (Control of Substances Hazardous to Health).\n\nEach category maps to a separate database table but shares the same API pattern. The `:type` path parameter selects the category.\n\n## Document Types\n\n| Type Slug | Table | Columns |\n|-----------|-------|---------|\n| `policies` | `policies` | pol1 (ref), pol2 (title), pol3 (version) |\n| `method-statements` | `methodstatements` | ms1, ms2, ms3 |\n| `processes` | `processes` | pro1, pro2, pro3 |\n| `coshh` | `coshh` | cos1, cos2, cos3 |\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Read-only directory (list + detail) |\n| Admin, Admin1 | Add and edit contacts |\n| Admin | Remove contacts |\n\n## PHP Compatibility\n\nReads from the same four document tables as PHP. Replaces the employee document library views."
      },
      {
        "name": "Vehicle Checks",
        "description": "Daily vehicle safety check submission and history. Employees complete a structured checklist covering planning, circle check, under the hood, behind the wheel, and trailer & load — then rate overall condition and safety.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `vehicle` | Vehicle check submissions |\n| `upload_vehicle` | Attached evidence photos/PDFs |\n\n## Status Values\n\n| Field | Values |\n|-------|--------|\n| `vehiclecondition` | Good, Average, Poor, Very Poor, Dangerous, Closed |\n| `safe` | Safe, Unsafe, Closed |\n\n## Key Business Rules\n\n- **Throttled:** employees can only submit one check per 8 hours per driver\n- `drivername` is auto-set from the JWT — employees cannot submit on behalf of others\n- Supports image upload on submission\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Submit + view own history |\n\n## PHP Compatibility\n\nWrites to the same `vehicle` table as PHP. Replaces the employee vehicle check form."
      },
      {
        "name": "Timesheets",
        "description": "Weekly timesheet submission and history. Employees can save drafts and submit finalised timesheets for admin approval.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `timesheet` | Timesheet records with 7-day breakdown |\n\n## Status Workflow\n\n```\nDraft → Submitted → Approved / Rejected\n```\n\n- **Draft** — saved but not yet submitted; employee can edit\n- **Submitted** — pending admin review; submitting the same week again updates this sheet\n- **Approved / Rejected** — admin decision (rejected timesheets can be resubmitted)\n\n## Data Model\n\nEach timesheet contains 7 days of data flattened to columns: `date1`–`date7`, `hours1`–`hours7`, `location1`–`location7`, `activity1`–`activity7`, `contract1`–`contract7`.\n\n## Key Business Rules\n\n- `ltrafficid` and `name` auto-set from JWT\n- Employees can submit (status = Submitted) or save as draft (status = Draft)\n- A submit for the same employee and week updates its existing Draft or Submitted sheet; Approved sheets are not overwritten\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Submit, draft, view own |\n\n## PHP Compatibility\n\nWrites to the same `timesheet` table as PHP. Replaces the employee timesheet submission form."
      },
      {
        "name": "Incidents",
        "description": "Health & Safety incident reporting. Employees can report incidents with photos and view their submission history.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `healthsafety` | Incident records |\n| `upload_hs` | Attached evidence photos/PDFs |\n\n## Incident Types\n\n`Accident`, `Customer Complaint`, `Customer Engagement`, `Environmental`, `Incident`, `Near Miss`, `Service Strike`\n\n## Status Workflow\n\n```\nOpen → In Progress → Closed\n```\n\n## Key Business Rules\n\n- Employees can attach up to 10 images on submission\n- `operativesname` and `reportedby` auto-set from JWT\n- Rich data model: injury tracking, witness info, RIDDOR fields\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Submit + view own |\n\n## PHP Compatibility\n\nWrites to the same `healthsafety` and `upload_hs` tables as PHP. Replaces the employee incident report form."
      },
      {
        "name": "Equipment Checks",
        "description": "PUWER-compliant equipment and plant inspection submission. Employees complete a 13-point safety checklist and rate overall condition.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `equipmentcheck` | Check submissions |\n| `upload_presite` | Admin-attached documents |\n\n## 13-Point Checklist\n\nBrakes, Steering, Seatbelt, Mirrors, Tyres, Wheel Security, Rotating Beacon, Horn, Warning Lights, Coolant, Seat, Access, Fuel — each Pass/Fail.\n\n## Status Values\n\n| Field | Values |\n|-------|--------|\n| `cond` | Good, Average, Poor, Very Poor, Dangerous |\n| `safe` | Safe, Unsafe |\n\n## Key Business Rules\n\n- At least 1 image required on submission (max 4)\n- Comma-separated image paths stored in `image` column\n- `operativesname` auto-set from JWT\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Civils Trailer Driver (6), Essex Supervisor (8) | Submit + view own |\n\n## PHP Compatibility\n\nWrites to the same `equipmentcheck` table as PHP. Replaces the employee equipment check form."
      },
      {
        "name": "Onboarding",
        "description": "Self-service employee onboarding form. New employees submit their personal details, emergency contacts, and employment information on first login.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `hr` | Employee record (created on submit) |\n| `login_users` | Onboarding flag (`onboarding` column) |\n\n## How It Works\n\n1. `GET /employee/onboarding/status` — check if onboarding is complete (`login_users.onboarding`)\n2. `POST /employee/onboarding` — submit the form (creates `hr` row, sets `onboarding = '1'`)\n3. `GET /employee/onboarding` — retrieve submitted data\n\n## Key Business Rules\n\n- Photo and signature paths auto-generated from `name1` field (PHP convention: `employeephoto/{name1}.jpg`)\n- Once submitted (`onboarding = '1'`), the form cannot be re-submitted\n- Collects: personal details, 2 emergency contacts, NI number, start date\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Full access |\n\n## PHP Compatibility\n\nWrites to the same `hr` table and `login_users.onboarding` flag as PHP."
      },
      {
        "name": "Site Inspections",
        "description": "Multi-part PUWER site safety inspection wizard (8 parts). Employees create inspections linked to a parent civils or Wildanet job and complete sections over time.\n\n## Source Discriminator\n\nA `source` query parameter selects the inspection type:\n\n| Source | Inspection Table | Parent Table |\n|--------|-----------------|--------------|\n| `civils` | `insp` | `civils` |\n| `wildanet` | `winsp` | `wildanet` |\n\nBoth tables share an identical 94-column schema.\n\n## 8-Part Wizard\n\n| Part | Section | Key Fields |\n|------|---------|------------|\n| 1 | Site Details (INSERT) | Auto-populated from parent job + operatives + activities |\n| 2 | Welfare & First Aid | 15 inspection items |\n| 3 | Site Set Up | 6 items |\n| 4 | Housekeeping | 7 items |\n| 5 | Health & Environment | 6 items |\n| 6 | PUWER Compliance | 14 items |\n| 7 | Traffic Management | 5 items |\n| 8 | Summary & Sign-off | Sets status to \"Inspection Awaiting Review\" |\n\n## Status Workflow\n\n```\nIn Progress → (Part 8) → Inspection Awaiting Review\n```\n\nAdmin then sets final status: Pass / Completed / Failed / Follow up Required.\n\n## Key Business Rules\n\n- Part 1 auto-populates from parent job: site ref, location, client, ganger\n- Each part supports up to 4 image uploads\n- Employee list filters by `in3` (completed by = current user)\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Civils Trailer Driver (6), Essex Supervisor (8) | Create + continue + view own |\n\n## PHP Compatibility\n\nWrites to `insp` / `winsp` tables matching PHP. Replaces the 8-screen inspection wizard."
      },
      {
        "name": "Vehicle Inspections",
        "description": "Multi-part Vehicle Inspection Checklist (VIC) wizard (4 parts) with linked Inspection Repair (VIR) records. Covers interior, exterior, mechanical, and final assessment.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `vic` | Vehicle inspection records (109 columns) |\n| `vir` | Linked inspection repair records |\n| `vr` | Vehicle register (lookup for registration) |\n\n## 4-Part Wizard\n\n| Part | Section | Key Fields |\n|------|---------|------------|\n| 1 | Interior + Exterior + Glass (INSERT) | vic1–vic36, linked to VR entry |\n| 2 | Suspension + Steering + Engine + Tyres | vic37–vic77 |\n| 3 | Lights + Exhaust | vic87–vic100 (note: vic78–vic86 do not exist) |\n| 4 | Final Assessment + Signature | vic101–vic109, sets status to \"Completed\" |\n\n## Status Workflow\n\n```\nIn Progress → (Part 4) → Completed\n```\n\n## Inspection Repairs (VIR)\n\nAfter completing an inspection, employees can log repair records against it. VIR records are always created with status \"Completed\" and include defect details, works description, and pass/fail result.\n\n## Key Business Rules\n\n- Part 1 auto-populates name (JWT) and vehicle reg (from VR lookup)\n- Part 4 auto-generates employee signature path\n- Each part supports up to 4 image uploads\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Civils Trailer Driver (6), Essex Supervisor (8), Admin2 (7) | Create Part 1 |\n| Admin (1), Admin1 (4), Civils Trailer Driver (6), Essex Supervisor (8) | Continue + view + add repairs |\n\n## PHP Compatibility\n\nWrites to `vic` and `vir` tables matching PHP. Replaces the 4-screen VIC wizard and repair form."
      },
      {
        "name": "Wildanet Jobs",
        "description": "Read-only view of Wildanet civils job records. Employees can browse active jobs and download associated documents.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `wildanet` | Job records |\n| `wupload_data` | Job documents and attachments |\n\n## Key Business Rules\n\n- Employee view excludes completed/inactive jobs (Completed, Cancelled, Closed, Invoiced, Awaiting Invoicing)\n- Documents are read-only for employees; uploads are admin-only\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Admin2 (7), Civils Trailer Driver (6), Essex Supervisor (8) | List + view jobs |\n| + Customer (9) | View documents only |\n\n## PHP Compatibility\n\nReads from the same `wildanet` and `wupload_data` tables as PHP."
      },
      {
        "name": "Civils",
        "description": "Civils job register — read-only employee view. Employees can browse active civils jobs and view attached documents.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `civils` | Job register records |\n| `upload_data` | Job documents and attachments |\n\n## Key Business Rules\n\n- Employee view excludes completed/inactive jobs (Completed, Cancelled, Closed, Invoiced, Awaiting Invoicing)\n- Documents are read-only for employees; uploads are admin-only\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Admin2 (7), Civils Trailer Driver (6), Essex Supervisor (8), Customer (9) | List + view + documents |\n\n## PHP Compatibility\n\nReads from the same `civils` and `upload_data` tables as PHP."
      },
      {
        "name": "TFL",
        "description": "TFL (Transport for London) job register and materials — read-only employee view. Employees can browse active TFL jobs, view attached documents, and check material inventory.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `tfl` | TFL job register records |\n| `upload_tfl` | Job documents and attachments |\n| `tflmaterial` | Material inventory |\n\n## Key Business Rules\n\n- Employee view excludes 7 inactive statuses (Pending, Delayed, Completed, Cancelled, Awaiting Invoicing, Invoiced, Closed)\n- Documents and materials are read-only for employees; management is admin-only\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Civils TFL Driver (5) | List + view + documents + materials |\n\n## PHP Compatibility\n\nReads from the same `tfl`, `upload_tfl`, and `tflmaterial` tables as PHP."
      },
      {
        "name": "Work Records",
        "description": "Field work recording for infrastructure (fibre/telecom) projects. Employees submit records of work performed with location details and supporting images.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `workrecord` | Work records |\n\n## Key Business Rules\n\n- Status auto-set to \"Pending\" on creation\n- Supports up to 10 image uploads per record\n- `lt1` (Recorded By) and `lt2` (Date/Time) auto-set from JWT and server time\n- Data fields: Road Name, Cabinet Area, Primary Node, Secondary Node, Structure ID, Type of Works, Work Status, Notes, Ducting Length\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Admin2 (7), Civils Trailer Driver (6), Essex Supervisor (8) | Submit + view own |\n\n## PHP Compatibility\n\nWrites to the same `workrecord` table as PHP."
      },
      {
        "name": "Clegg Testing",
        "description": "Clegg hammer soil compaction test recording. Employees submit test results for reinstatement quality assurance.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `cleggtesting` | Test records |\n\n## Key Business Rules\n\n- `ct3` (Date) and `ct4` (Conducted By) auto-set from server time and JWT\n- Supports up to 6 image uploads per record\n- Data fields: Job Number, Location, Cabinet Area, Surface Type, Test Unit, Calibration Expiry, Test Reading, Result (Pass/Fail), Re-Test Reading, Re-Test Result, Notes\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Civils Trailer Driver (6), Essex Supervisor (8) | Create |\n| + Admin2 (7) | View (list + detail) |\n\n## PHP Compatibility\n\nWrites to the same `cleggtesting` table as PHP."
      },
      {
        "name": "Wildanet Risk Assessments",
        "description": "Multi-part Wildanet risk assessment wizard (5 parts). Employees create risk assessments linked to Wildanet parent jobs covering site details, personnel, hazards, permit to dig, and end-of-day sign-off.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `wra` | Risk assessment records (74 columns) |\n| `wildanet` | Parent job (lookup for auto-population) |\n\n## 5-Part Wizard\n\n| Part | Section | Key Fields |\n|------|---------|------------|\n| 1 | Site Details (INSERT) | Auto-populated from parent Wildanet job |\n| 2 | Personnel In Attendance | Personnel names and roles |\n| 3 | Hazards | Identified hazards and controls |\n| 4 | Permit to Dig | Includes employee signature |\n| 5 | End of Day Sign-off | Sets status to \"RA Completed\", includes signature |\n\n## Status Workflow\n\n```\nIn Progress → (Part 5) → RA Completed\n```\n\n## Key Business Rules\n\n- Part 1 auto-populates site ref, location, client, dates from parent Wildanet job\n- Parts 4 and 5 auto-generate signature paths from user name\n- Each part supports up to 4 image uploads\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Civils Trailer Driver (6), Essex Supervisor (8) | Create + continue + view own |\n\n## PHP Compatibility\n\nWrites to the same `wra` table as PHP. Replaces the 5-screen risk assessment wizard."
      },
      {
        "name": "PIA & Fibre Risk",
        "description": "Pre-work risk assessment permits for PIA (Physical Infrastructure Access) fibre installation. Three separate permit subtypes cover different work scenarios.\n\n## Permit Types\n\n| Type | Table | Purpose |\n|------|-------|---------|\n| WAH (Working at Height) | `wah` | Ladder/pole work — 14 safety fields |\n| UG (Underground Works) | `ug` | Below-ground work — 13 safety fields |\n| MEWP (Mobile Elevated Work Platform) | `mewp` | Cherry picker/platform work — 15 safety fields |\n\n## Key Business Rules\n\n- All permits created with status \"Submitted\" (no multi-part workflow)\n- Operative name and datetime auto-set from JWT and server time\n- Shared node fields across all types: Primary Node, SN Type, Secondary Node\n- Supports up to 10 image uploads per permit\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Civils Trailer Driver (6), Essex Supervisor (8) | Create |\n| + Admin2 (7) | View (list + detail) |\n\n## PHP Compatibility\n\nWrites to `wah`, `ug`, and `mewp` tables matching PHP. Replaces the PHP permit forms."
      },
      {
        "name": "Admin - Bulletins",
        "description": "Bulletin management for administrators. Create, edit, and delete bulletins, and view which employees have acknowledged each one.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `bulletinnew` | Bulletin content and active/inactive flag |\n| `bulletinread` | Per-user read tracking |\n| `bulletinconfirm` | Audit trail of acknowledgements |\n\n## Key Features\n\n- Create/update bulletins with image and download attachments\n- View read confirmation list per bulletin (`bulletinread` joined with user names)\n- Toggle active/inactive status\n- Search by title or reference code\n- Filter by status (active/inactive)\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | Full CRUD + view readers |\n\n## PHP Compatibility\n\nManages the same `bulletinnew` table as PHP admin. Upload paths: `bulletin/` for images and downloads."
      },
      {
        "name": "Admin - Documents",
        "description": "Document control management across four categories: Policies, Method Statements, Processes, and CoSHH.\n\n## Document Types\n\n| Type Slug | Table | Columns |\n|-----------|-------|---------|\n| `policies` | `policies` | pol1 (ref), pol2 (title), pol3 (version) |\n| `method-statements` | `methodstatements` | ms1, ms2, ms3 |\n| `processes` | `processes` | pro1, pro2, pro3 |\n| `coshh` | `coshh` | cos1, cos2, cos3 |\n\n## Key Features\n\n- Full CRUD for all four document types via the `:type` path parameter\n- Upload document files per record\n- Documents are immediately visible to all employees\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | View |\n| Admin (1) | Create + edit + delete |\n\n## PHP Compatibility\n\nManages the same four document tables as PHP admin."
      },
      {
        "name": "Admin - Vehicle Checks",
        "description": "Vehicle check management and review. Administrators can view all employee submissions, add evidence documents, and close out checks.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `vehicle` | Vehicle check submissions |\n| `upload_vehicle` | Attached evidence photos/PDFs |\n\n## Status Values\n\n| Field | Values |\n|-------|--------|\n| `vehiclecondition` | Good, Average, Poor, Very Poor, Dangerous, Closed |\n| `safe` | Safe, Unsafe, Closed |\n\n## Key Features\n\n- Filter views: `action-required` (Unsafe or poor condition), `closed`\n- Attach evidence documents to existing checks\n- Search by driver name or vehicle registration\n- Admin can create checks on behalf of employees\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Admin2 (7) | View |\n| Admin (1), Admin1 (4) | Create + edit |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `vehicle` and `upload_vehicle` tables as PHP admin."
      },
      {
        "name": "Admin - Timesheets",
        "description": "Timesheet management, approval, and rejection. Administrators review employee submissions and approve or reject them.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `timesheet` | Timesheet records with 7-day breakdown |\n\n## Status Workflow\n\n```\nDraft → Submitted → Approved / Rejected\n```\n\n## Key Features\n\n- Filter by status: `submitted` (includes Rejected), `approved`, `draft`, `all`\n- Approve or reject individual timesheets with one click\n- Create timesheets on behalf of employees\n- Search by employee name or LTraffic ID\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | View + approve/reject + create |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `timesheet` table as PHP admin. Approval/rejection writes to the same status column."
      },
      {
        "name": "Admin - Incidents",
        "description": "Health & Safety incident management. Administrators review incident reports, update investigation status, and attach evidence.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `healthsafety` | Incident records |\n| `upload_hs` | Attached evidence photos/PDFs |\n\n## Incident Types\n\n`Accident`, `Customer Complaint`, `Customer Engagement`, `Environmental`, `Incident`, `Near Miss`, `Service Strike`\n\n## Status Workflow\n\n```\nOpen → In Progress → Closed\n```\n\n## Key Features\n\n- Dedicated status-change endpoint with investigation notes\n- Attach evidence documents to incidents\n- Create incidents on behalf of employees\n- RIDDOR reporting fields for regulatory compliance\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Essex Supervisor (8) | View |\n| Admin (1), Admin1 (4) | Edit + status change + create |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `healthsafety` and `upload_hs` tables as PHP admin."
      },
      {
        "name": "Admin - HR",
        "description": "Employee HR record management. Full lifecycle management of employee personal, employment, and emergency contact records with document storage.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `hr` | Employee records |\n| `upload_hr` | HR documents (licences, contracts, checks) |\n\n## Document Types\n\n`Driver Eyesight Check`, `Driving Licence`, `Driving Licence Check`, `Ladder Inspection`, `Medical Check`, `Passport`, `PPE Issue`, `Service Contract`, `Toolbox Talk`, `Other`\n\n## Key Features\n\n- Full employee record: personal details, DOB, address, NI number\n- Two emergency contacts per employee\n- Employment info: employee ID, job title, location, line manager, salary, dates\n- Typed document management with upload and listing\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | View + edit |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `hr` and `upload_hr` tables as PHP admin."
      },
      {
        "name": "Admin - Users",
        "description": "User account management. Create, edit, and delete login accounts with role assignment and password management.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `login_users` | User accounts and credentials |\n| `lt_user_credentials` | Bcrypt password sidecar (Node-only) |\n| `lt_refresh_tokens` | Active refresh tokens |\n\n## Key Features\n\n- Username/email uniqueness enforcement\n- Dual-write password handling: MD5 (PHP compatibility) + bcrypt sidecar\n- Password update triggers all refresh token revocation\n- User deletion cascades: tokens → credentials → user record\n- Role assignment via `user_level` field\n\n## Teams\n\nSuggested team values: `Director`, `Traffic Signals Installation`, `Traffic Signals Civils`, `Traffic Signal Maintenance`, `Utilities Civils`, `Office Staff`, `Customer`. Custom team text is also accepted (maximum 255 characters).\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | View |\n| Admin (1) | Create + edit + delete |\n\n## PHP Compatibility\n\nManages the same `login_users` table as PHP. Passwords are written as MD5 to maintain PHP login compatibility."
      },
      {
        "name": "Admin - Equipment Register",
        "description": "Equipment asset register management. Track company equipment with serial numbers, allocation, condition, and expiry dates.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `er` | Equipment register records |\n| `upload_er` | Equipment documents (condition photos, calibration certs) |\n\n## Document Types\n\n`Condition Image`, `Service / Calibration Expiry`, `Other`\n\n## Key Features\n\n- Full CRUD for equipment assets: item, description, ident (serial number), allocated to, condition, expiry\n- Typed document management per item\n- Sorted by ident (serial number) ascending\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | View + create + edit |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `er` and `upload_er` tables as PHP admin."
      },
      {
        "name": "Admin - Vehicle Register",
        "description": "Vehicle fleet register management with active/archived views. Track registration, allocation, and expiry dates (MOT, tax, service).\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `vr` | Vehicle register records |\n| `upload_vr` | Vehicle documents |\n\n## Active vs Archived\n\n| `cond` Value | Meaning |\n|-------------|---------|\n| `Yes` | Active vehicle |\n| `No` | Archived vehicle |\n\nSeparate list endpoints for active (`GET /`) and archived (`GET /archived`) vehicles.\n\n## Key Features\n\n- Track MOT expiry (`mexpiry`), tax expiry (`texpiry`), service expiry (`sexpiry`)\n- Document management per vehicle\n- Sorted by registration ascending\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Essex Supervisor (8), Admin2 (7) | List |\n| Admin (1), Admin1 (4), Admin2 (7) | View detail + create |\n| Admin (1), Admin1 (4) | Edit |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `vr` and `upload_vr` tables as PHP admin."
      },
      {
        "name": "Admin - Plant Register",
        "description": "Plant asset register management. Track company plant items with serial numbers, allocation, condition, and service/calibration expiry.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `pr` | Plant register records |\n| `upload_pr` | Plant documents |\n\n## Document Types\n\n`Condition Image`, `Service / Calibration Expiry`, `Other`\n\n## Key Features\n\n- Identical structure to Equipment Register but for plant items\n- Sorted by expiry date ascending (soonest-expiring first)\n- Typed document management per item\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | View + create + edit |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `pr` and `upload_pr` tables as PHP admin."
      },
      {
        "name": "Admin - Equipment Checks",
        "description": "Equipment check management and review. Administrators can view all employee equipment inspection submissions, attach documents, and update records.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `equipmentcheck` | Check submissions |\n| `upload_presite` | Admin-attached documents |\n\n## Status Values\n\n| Field | Values |\n|-------|--------|\n| `cond` | Good, Average, Poor, Very Poor, Dangerous |\n| `safe` | Safe, Unsafe |\n\n## Key Features\n\n- View all employee equipment check submissions\n- Attach evidence documents to existing checks\n- Edit condition and safety status\n- Search by operative name\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Civils Trailer Driver (6), Essex Supervisor (8) | List |\n| Admin (1), Admin1 (4), Admin2 (7), Civils Trailer Driver (6) | View detail |\n| Admin (1) | Edit + delete |\n\n## PHP Compatibility\n\nManages the same `equipmentcheck` and `upload_presite` tables as PHP admin."
      },
      {
        "name": "Admin - Site Inspections",
        "description": "Site inspection management. Administrators review multi-part PUWER inspections, update status, and manage the post-inspection workflow.\n\n## Source Discriminator\n\nA `source` query parameter (required on all endpoints) selects the inspection type:\n\n| Source | Table | Parent Table |\n|--------|-------|--------------|\n| `civils` | `insp` | `civils` |\n| `wildanet` | `winsp` | `wildanet` |\n\n## Status Workflow\n\n```\nIn Progress → Inspection Awaiting Review → Pass / Completed / Failed / Follow up Required\n```\n\nAdmin sets the final status after reviewing the completed 8-part inspection.\n\n## Key Features\n\n- Filter by status: `live` (not Completed), `completed`, or all\n- Search by `in6` (Site Ganger) prefix match\n- Update any field including status transitions\n- Full detail view with all 8 image columns expanded to URLs\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Essex Supervisor (8), Customer (9) | List |\n| Admin (1), Admin1 (4), Essex Supervisor (8) | View + edit |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `insp` / `winsp` tables as PHP admin."
      },
      {
        "name": "Admin - Vehicle Inspections",
        "description": "Vehicle Inspection Checklist (VIC) management. Administrators review 4-part vehicle inspections, manage linked repair records (VIR), and update inspection details.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `vic` | Vehicle inspection records (109 columns) |\n| `vir` | Linked inspection repair records |\n\n## Status Workflow\n\nVIC: `In Progress` → `Completed` (2 states only)\n\nVIR: Always `Completed` (no workflow)\n\n## Key Features\n\n- View all VIC submissions with full detail\n- Edit any inspection fields\n- View and manage linked VIR (repair) records per inspection\n- Search by `vic2` (vehicle registration) prefix match\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Essex Supervisor (8) | List |\n| Admin (1), Admin1 (4), Essex Supervisor (8), Admin2 (7) | View detail + view repairs |\n| Admin (1), Admin1 (4) | Edit |\n| Admin (1) | Delete VIC + delete VIR |\n\n## PHP Compatibility\n\nManages the same `vic` and `vir` tables as PHP admin."
      },
      {
        "name": "Admin - Wildanet Jobs",
        "description": "Wildanet civils job management. Full lifecycle management of Wildanet project jobs including document uploads and status tracking.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `wildanet` | Job records |\n| `wupload_data` | Job documents and attachments |\n\n## Job Statuses\n\nActive: any status not in the inactive list.\n\nInactive: `Completed`, `Cancelled`, `Closed`, `Invoiced`, `Awaiting Invoicing`.\n\n## Key Features\n\n- Full CRUD for job records\n- Multi-image job pack upload on create (max 4)\n- Typed document management with upload (supports images, PDFs, Office docs, ZIP, XLSX)\n- Job fields: status, assigned to, client, authority, community, solo number, location, permit status\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Admin2 (7), Essex Supervisor (8) | List |\n| Admin (1), Admin1 (4), Admin2 (7), Civils Trailer Driver (6), Essex Supervisor (8) | View detail |\n| Admin (1), Admin1 (4), Admin2 (7) | Edit + upload docs |\n| Admin (1) | Create + delete |\n| + Customer (9) | View documents only |\n\n## PHP Compatibility\n\nManages the same `wildanet` and `wupload_data` tables as PHP admin."
      },
      {
        "name": "Admin - Civils",
        "description": "Civils job register management. Full lifecycle CRUD for civils job records with document upload.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `civils` | Job register records |\n| `upload_data` | Job documents and attachments |\n\n## Key Features\n\n- Full CRUD for job records\n- Document upload with multiple MIME types supported (images, PDFs, Office docs, ZIP, XLSX)\n- Admin list shows all records with filter by status and permit\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Admin2 (7), Essex Supervisor (8) | List |\n| Admin (1), Admin1 (4), Admin2 (7), Civils Trailer Driver (6), Essex Supervisor (8) | View detail |\n| Admin (1), Admin1 (4), Admin2 (7) | Create + edit + delete + upload docs + delete docs |\n| + Customer (9) | View documents only |\n\n## PHP Compatibility\n\nManages the same `civils` and `upload_data` tables as PHP admin."
      },
      {
        "name": "Admin - TFL",
        "description": "TFL job register and materials management. Full lifecycle CRUD for TFL job records, documents, and material inventory.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `tfl` | TFL job register records |\n| `upload_tfl` | Job documents and attachments |\n| `tflmaterial` | Material inventory |\n\n## Key Features\n\n- Full CRUD for TFL jobs with document upload\n- Material inventory management (separate CRUD)\n- Admin list shows all records with filter by status and permit\n- Material create is open to most roles (except Customer)\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | Full job + document management |\n| Admin (1) | Delete documents + delete materials |\n| Admin (1), Admin1 (4), Civils TFL Driver (5) | View jobs + documents + materials, edit materials |\n| All except Customer (9) | Create materials |\n\n## PHP Compatibility\n\nManages the same `tfl`, `upload_tfl`, and `tflmaterial` tables as PHP admin."
      },
      {
        "name": "Admin - Work Records",
        "description": "Work record management. Administrators review field work records submitted by employees and update status.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `workrecord` | Work records |\n\n## Key Features\n\n- View all work records across all employees\n- Update status and details\n- Pending records sorted oldest-first (ASC); others sorted newest-first (DESC)\n- Search by employee name\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4) | View + edit |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `workrecord` table as PHP admin."
      },
      {
        "name": "Admin - Clegg Testing",
        "description": "Clegg soil compaction test management. Administrators review test results submitted by employees.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `cleggtesting` | Test records |\n\n## Key Features\n\n- View all Clegg test submissions\n- Edit test details and results\n- Search by job number or location\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1) | View + edit + delete |\n\n## PHP Compatibility\n\nManages the same `cleggtesting` table as PHP admin."
      },
      {
        "name": "Admin - Wildanet Risk Assessments",
        "description": "Wildanet risk assessment management. Administrators review multi-part risk assessments, update fields, and manage the post-assessment workflow.\n\n## Database\n\n| Table | Purpose |\n|-------|---------|\n| `wra` | Risk assessment records (74 columns) |\n\n## Status Workflow\n\n```\nIn Progress → RA Completed\n```\n\nAdmin can edit any field after the 5-part wizard is completed by the employee.\n\n## Key Features\n\n- View all risk assessments across all employees\n- Edit any assessment fields\n- Search by site reference or employee name\n- Filter by status\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1), Admin1 (4), Admin2 (7), Civils Trailer Driver (6), Essex Supervisor (8) | List |\n| Admin (1), Admin1 (4), Essex Supervisor (8) | View + edit |\n| Admin (1) | Delete |\n\n## PHP Compatibility\n\nManages the same `wra` table as PHP admin."
      },
      {
        "name": "Admin - PIA & Fibre Risk",
        "description": "PIA & Fibre Risk permit deletion. Admin-only endpoint for removing submitted WAH, UG, and MEWP permits.\n\n## Permit Types\n\n| Type | Table |\n|------|-------|\n| WAH (Working at Height) | `wah` |\n| UG (Underground Works) | `ug` |\n| MEWP (Mobile Elevated Work Platform) | `mewp` |\n\n## Key Features\n\n- Delete individual permits by type and ID\n- Separate DELETE endpoint per permit type\n\n## RBAC\n\n| Role | Access |\n|------|--------|\n| Admin (1) | Delete only |\n\n## PHP Compatibility\n\nDeletes from the same `wah`, `ug`, and `mewp` tables as PHP."
      }
    ],
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      },
      "schemas": {
        "ApiSuccess": {
          "type": "object",
          "description": "Standard success envelope returned by all endpoints.",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "description": "Endpoint-specific payload (object or array)."
            },
            "meta": {
              "$ref": "#/components/schemas/PaginationMeta"
            }
          }
        },
        "ApiError": {
          "type": "object",
          "description": "Standard error envelope. Every non-2xx response uses this shape. `code` is a machine-readable constant; `message` is human-readable.",
          "properties": {
            "success": {
              "type": "boolean",
              "example": false
            },
            "error": {
              "type": "object",
              "properties": {
                "code": {
                  "type": "string",
                  "example": "VALIDATION_ERROR",
                  "description": "Machine-readable error code. Common values: VALIDATION_ERROR, UNAUTHORIZED, AUTH_TOKEN_EXPIRED, AUTH_INVALID_CREDENTIALS, AUTH_USER_DISABLED, AUTH_REFRESH_INVALID, FORBIDDEN, NOT_FOUND, RATE_LIMITED, INTERNAL_ERROR."
                },
                "message": {
                  "type": "string",
                  "example": "Invalid credentials",
                  "description": "Human-readable error description."
                },
                "details": {
                  "nullable": true,
                  "description": "Additional error context. For VALIDATION_ERROR this is an array of field-level issues from Zod."
                },
                "requestId": {
                  "type": "string",
                  "example": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                  "description": "Unique request identifier for support/debugging."
                }
              }
            }
          }
        },
        "PaginationMeta": {
          "type": "object",
          "nullable": true,
          "description": "Pagination metadata returned with paginated list endpoints. Null on non-list responses.",
          "properties": {
            "page": {
              "type": "integer",
              "example": 1,
              "description": "Current page number (1-based)."
            },
            "limit": {
              "type": "integer",
              "example": 20,
              "description": "Items per page."
            },
            "total": {
              "type": "integer",
              "example": 142,
              "description": "Total matching rows across all pages."
            },
            "unread_count": {
              "type": "integer",
              "example": 4,
              "description": "Notification inbox only: total unread notifications for the authenticated user."
            }
          }
        },
        "ErrorEnvelope": {
          "deprecated": true,
          "description": "Deprecated — use ApiError instead. Will be removed when all modules are migrated.",
          "allOf": [
            {
              "$ref": "#/components/schemas/ApiError"
            }
          ]
        },
        "VehicleCheck": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "drivername": {
              "type": "string"
            },
            "vehiclereg": {
              "type": "string"
            },
            "mileage": {
              "type": "integer"
            },
            "arrival_datetime": {
              "type": "string"
            },
            "planning": {
              "type": "object",
              "properties": {
                "routeplanned": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "roadconditions": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "dressedforweather": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "emergencyequip": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                }
              }
            },
            "circleCheck": {
              "type": "object",
              "properties": {
                "tires": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "lights": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "windows": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "loads": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                }
              }
            },
            "underTheHood": {
              "type": "object",
              "properties": {
                "washer": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "oil": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "fluid": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "belts": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                }
              }
            },
            "behindTheWheel": {
              "type": "object",
              "properties": {
                "seatbelt": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "horn": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "mirrors": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "brakes": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                }
              }
            },
            "trailerAndLoad": {
              "type": "object",
              "properties": {
                "trailercoupling": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No",
                    "N/a"
                  ]
                },
                "safetyconnection": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No",
                    "N/a"
                  ]
                },
                "loadsecured": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                },
                "loadweight": {
                  "type": "string",
                  "enum": [
                    "Yes",
                    "No"
                  ]
                }
              }
            },
            "vehiclecondition": {
              "type": "string",
              "enum": [
                "Good",
                "Average",
                "Poor",
                "Very Poor",
                "Dangerous",
                "Closed"
              ]
            },
            "safe": {
              "type": "string",
              "enum": [
                "Safe",
                "Unsafe",
                "Closed"
              ]
            },
            "report": {
              "type": "string"
            },
            "notes": {
              "type": "string",
              "nullable": true
            }
          }
        },
        "VehicleCheckSummary": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "drivername": {
              "type": "string"
            },
            "vehiclereg": {
              "type": "string"
            },
            "mileage": {
              "type": "integer"
            },
            "arrival_datetime": {
              "type": "string"
            },
            "vehiclecondition": {
              "type": "string"
            },
            "safe": {
              "type": "string"
            }
          }
        },
        "VehicleCheckDocument": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "submittedby": {
              "type": "string"
            },
            "arrival_datetime": {
              "type": "string"
            },
            "file_name": {
              "type": "string"
            },
            "file_url": {
              "type": "string",
              "nullable": true
            }
          }
        },
        "Timesheet": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "week": {
              "type": "string",
              "description": "Week commencing label (e.g. \"Monday - 07/07/2025\")"
            },
            "ltrafficid": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "comments": {
              "type": "string"
            },
            "status": {
              "type": "string",
              "enum": [
                "Draft",
                "Submitted",
                "Approved",
                "Rejected"
              ]
            },
            "days": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "date": {
                    "type": "string"
                  },
                  "hours": {
                    "type": "string"
                  },
                  "location": {
                    "type": "string"
                  },
                  "activity": {
                    "type": "string"
                  },
                  "contract": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "TimesheetSummary": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "week": {
              "type": "string"
            },
            "ltrafficid": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "status": {
              "type": "string"
            }
          }
        },
        "TimesheetOption": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "type": {
              "type": "string",
              "enum": [
                "activity",
                "contract"
              ]
            },
            "name": {
              "type": "string"
            },
            "is_active": {
              "type": "boolean"
            },
            "sort_order": {
              "type": "integer"
            }
          }
        },
        "TflJob": {
          "type": "object",
          "description": "TFL job register entry from the `tfl` table.",
          "properties": {
            "id": {
              "type": "integer",
              "description": "Primary key.",
              "example": 4
            },
            "jobstatus": {
              "type": "string",
              "description": "Job status.",
              "example": "In Progress"
            },
            "assignedto": {
              "type": "string",
              "nullable": true,
              "description": "Assigned team/person.",
              "example": "Civils Team 1"
            },
            "customer": {
              "type": "string",
              "nullable": true,
              "description": "Customer name.",
              "example": "Telent"
            },
            "jobnumber": {
              "type": "string",
              "nullable": true,
              "description": "Job number.",
              "example": "00701"
            },
            "sitereference": {
              "type": "string",
              "nullable": true,
              "description": "Site reference code.",
              "example": "28/038"
            },
            "location": {
              "type": "string",
              "nullable": true,
              "description": "Job location.",
              "example": "HILLSIDE - CRAVEN PARK"
            },
            "postcode": {
              "type": "string",
              "nullable": true,
              "description": "Postcode.",
              "example": "NW10 8QN"
            },
            "area": {
              "type": "string",
              "nullable": true,
              "description": "London borough area.",
              "example": "28 - Brent"
            },
            "workstream": {
              "type": "string",
              "nullable": true,
              "description": "Workstream type.",
              "example": "Civils & Installation"
            },
            "permitstatus": {
              "type": "string",
              "nullable": true,
              "description": "Permit status.",
              "example": "Granted"
            },
            "startdate": {
              "type": "string",
              "nullable": true,
              "description": "Start date.",
              "example": "2025-06-01"
            },
            "enddate": {
              "type": "string",
              "nullable": true,
              "description": "End date.",
              "example": "2025-07-31"
            },
            "notes": {
              "type": "string",
              "nullable": true,
              "description": "Additional notes.",
              "example": "Works in progress"
            }
          }
        },
        "TflDocument": {
          "type": "object",
          "description": "Document attached to a TFL job (from `upload_tfl` table).",
          "properties": {
            "id": {
              "type": "integer",
              "description": "Document primary key.",
              "example": 3
            },
            "arrival_datetime": {
              "type": "string",
              "nullable": true,
              "description": "Upload timestamp.",
              "example": "2025-06-15 10:00:00"
            },
            "file_name": {
              "type": "string",
              "nullable": true,
              "description": "Stored filename (relative path).",
              "example": "tfl/697965tflped05.pdf"
            },
            "file_url": {
              "type": "string",
              "nullable": true,
              "description": "Full URL to the document file.",
              "example": "http://192.168.1.100/tfl/697965tflped05.pdf"
            },
            "submittedby": {
              "type": "string",
              "nullable": true,
              "description": "Name of user who uploaded.",
              "example": "Administrator"
            },
            "doctype": {
              "type": "string",
              "nullable": true,
              "description": "Document type.",
              "example": "Permit Details"
            },
            "docdesc": {
              "type": "string",
              "nullable": true,
              "description": "Document description.",
              "example": "Approved Permit Details"
            }
          }
        },
        "TflMaterial": {
          "type": "object",
          "description": "TFL material inventory entry from the `tflmaterial` table.",
          "properties": {
            "id": {
              "type": "integer",
              "description": "Primary key.",
              "example": 1
            },
            "item": {
              "type": "string",
              "description": "Material item name.",
              "example": "Cable Duct 100mm"
            },
            "unitsremaining": {
              "type": "string",
              "description": "Units remaining.",
              "example": "50"
            },
            "location": {
              "type": "string",
              "description": "Storage location.",
              "example": "Yard A"
            },
            "status": {
              "type": "string",
              "description": "Stock status.",
              "example": "In Stock"
            }
          }
        },
        "Incident": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "operativesname": {
              "type": "string"
            },
            "arrival_datetime": {
              "type": "string"
            },
            "type": {
              "type": "string"
            },
            "location": {
              "type": "string"
            },
            "reportedby": {
              "type": "string"
            },
            "report": {
              "type": "string"
            },
            "involved": {
              "type": "string",
              "nullable": true
            },
            "injury": {
              "type": "object",
              "properties": {
                "anyoneinjured": {
                  "type": "string"
                },
                "whowasinjured": {
                  "type": "string",
                  "nullable": true
                },
                "injuryreport": {
                  "type": "string",
                  "nullable": true
                }
              }
            },
            "reporting": {
              "type": "object",
              "properties": {
                "reportit": {
                  "type": "string",
                  "nullable": true
                },
                "advise": {
                  "type": "string",
                  "nullable": true
                },
                "laterdate": {
                  "type": "string",
                  "nullable": true
                },
                "companydetails": {
                  "type": "string",
                  "nullable": true
                }
              }
            },
            "witnesses": {
              "type": "object",
              "properties": {
                "witness": {
                  "type": "string"
                },
                "witnessname": {
                  "type": "string",
                  "nullable": true
                },
                "witnessaddress": {
                  "type": "string",
                  "nullable": true
                },
                "witnesscontact": {
                  "type": "string",
                  "nullable": true
                },
                "otherwitness": {
                  "type": "string",
                  "nullable": true
                }
              }
            },
            "notes": {
              "type": "string",
              "nullable": true
            },
            "status": {
              "type": "string",
              "enum": [
                "Open",
                "Closed"
              ]
            },
            "image": {
              "type": "string",
              "nullable": true,
              "description": "Comma-separated image paths (PHP compat)"
            },
            "image_urls": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Resolved URLs for all attached images"
            }
          }
        },
        "IncidentSummary": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "operativesname": {
              "type": "string"
            },
            "arrival_datetime": {
              "type": "string"
            },
            "type": {
              "type": "string"
            },
            "location": {
              "type": "string"
            },
            "status": {
              "type": "string"
            }
          }
        },
        "IncidentDocument": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "submittedby": {
              "type": "string"
            },
            "arrival_datetime": {
              "type": "string"
            },
            "file_name": {
              "type": "string"
            },
            "file_url": {
              "type": "string",
              "nullable": true
            }
          }
        },
        "DeviceRegisterRequest": {
          "type": "object",
          "required": [
            "platform"
          ],
          "anyOf": [
            {
              "required": [
                "token"
              ]
            },
            {
              "required": [
                "fcm_token"
              ]
            }
          ],
          "description": "Sent by the mobile app on launch AND whenever FCM issues a fresh token.\nThe endpoint upserts — safe to call repeatedly.\n",
          "properties": {
            "token": {
              "type": "string",
              "minLength": 10,
              "maxLength": 512,
              "description": "**REQUIRED.** The FCM registration token from `messaging().getToken()` (Android) / APNs-forwarded FCM token (iOS).",
              "example": "fMEP0vJqS0m:APA91bH..."
            },
            "fcm_token": {
              "type": "string",
              "minLength": 10,
              "maxLength": 512,
              "description": "**MOBILE ALIAS.** Same FCM value as `token`; accepted for mobile-client compatibility.",
              "example": "fMEP0vJqS0m:APA91bH..."
            },
            "platform": {
              "type": "string",
              "enum": [
                "ios",
                "android"
              ],
              "description": "**REQUIRED.** Which mobile platform issued the token.",
              "example": "android"
            },
            "appVersion": {
              "type": "string",
              "maxLength": 32,
              "description": "**OPTIONAL.** Semver of the installed app build \\u2014 helps diagnose per-version push issues.",
              "example": "1.4.2"
            }
          }
        },
        "DeviceUnregisterRequest": {
          "type": "object",
          "required": [
            "token"
          ],
          "properties": {
            "token": {
              "type": "string",
              "description": "**REQUIRED.** The FCM token to revoke. Server verifies it belongs to the caller before revoking.",
              "example": "fMEP0vJqS0m:APA91bH..."
            }
          }
        },
        "DeviceRow": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer",
              "example": 42
            },
            "token": {
              "type": "string",
              "description": "FCM token (truncated in responses for safety in some deployments)."
            },
            "platform": {
              "type": "string",
              "enum": [
                "ios",
                "android"
              ]
            },
            "appVersion": {
              "type": "string",
              "nullable": true
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "DeviceRegisterResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object",
              "properties": {
                "registered": {
                  "type": "boolean",
                  "example": true
                }
              }
            }
          }
        },
        "DeviceUnregisterResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object",
              "properties": {
                "revoked": {
                  "type": "boolean",
                  "example": true,
                  "description": "True when an active row was affected."
                }
              }
            }
          }
        },
        "DeviceListResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/DeviceRow"
              }
            }
          }
        },
        "ContentPage": {
          "type": "object",
          "properties": {
            "slug": {
              "type": "string",
              "enum": [
                "about-us",
                "privacy-policy",
                "terms-and-conditions"
              ]
            },
            "title": {
              "type": "string",
              "example": "Privacy Policy"
            },
            "content": {
              "type": "string",
              "example": "<p>Policy content</p>"
            },
            "updated_by": {
              "type": "integer",
              "nullable": true
            },
            "updated_at": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "ContactEmployee": {
          "type": "object",
          "description": "Employee contact directory entry from the `hr` table.",
          "required": [
            "id",
            "employeeid",
            "name"
          ],
          "properties": {
            "id": {
              "type": "integer",
              "description": "Primary key from `hr.id`.",
              "example": 42
            },
            "employeeid": {
              "type": "string",
              "description": "Company employee ID.",
              "example": "00012"
            },
            "name": {
              "type": "string",
              "description": "Full name (`firstname` + `surname`).",
              "example": "Dean Louch"
            },
            "phone": {
              "type": "string",
              "nullable": true,
              "description": "Company phone number.",
              "example": "07700 900123"
            },
            "email": {
              "type": "string",
              "nullable": true,
              "description": "Company email.",
              "example": "dl@ltraffic.co.uk"
            },
            "jobtitle": {
              "type": "string",
              "nullable": true,
              "description": "Job title.",
              "example": "Driving Operative"
            },
            "linemanager": {
              "type": "string",
              "nullable": true,
              "description": "Line manager name.",
              "example": "Anthony Louch"
            },
            "location": {
              "type": "string",
              "nullable": true,
              "description": "Office or site location.",
              "example": "Head Office"
            },
            "photo_url": {
              "type": "string",
              "nullable": true,
              "description": "Full URL to employee photo. Null if no photo set.",
              "example": "http://192.168.1.100/admin/employeephoto/DeanLouch.jpg"
            }
          }
        },
        "CivilsJob": {
          "type": "object",
          "description": "Civils job register entry from the `civils` table.",
          "properties": {
            "id": {
              "type": "integer",
              "description": "Primary key.",
              "example": 1
            },
            "jobstatus": {
              "type": "string",
              "description": "Job status.",
              "example": "Live"
            },
            "assignedto": {
              "type": "string",
              "nullable": true,
              "description": "Assigned team/person.",
              "example": "Gang A"
            },
            "client": {
              "type": "string",
              "nullable": true,
              "description": "Client name.",
              "example": "Cornwall Council"
            },
            "authority": {
              "type": "string",
              "nullable": true,
              "description": "Authority name.",
              "example": "Cornwall Council"
            },
            "community": {
              "type": "string",
              "nullable": true,
              "description": "Community area.",
              "example": "Bodmin"
            },
            "solonumber": {
              "type": "string",
              "nullable": true,
              "description": "SOLO reference number.",
              "example": "SO-12345"
            },
            "location": {
              "type": "string",
              "nullable": true,
              "description": "Job location.",
              "example": "A38 Bodmin"
            },
            "postcode": {
              "type": "string",
              "nullable": true,
              "description": "Postcode.",
              "example": "PL31 2AB"
            },
            "permitstatus": {
              "type": "string",
              "nullable": true,
              "description": "Permit status.",
              "example": "Granted"
            },
            "startdate": {
              "type": "string",
              "nullable": true,
              "description": "Start date.",
              "example": "2025-06-01"
            },
            "enddate": {
              "type": "string",
              "nullable": true,
              "description": "End date.",
              "example": "2025-07-31"
            },
            "notes": {
              "type": "string",
              "nullable": true,
              "description": "Additional notes.",
              "example": "Permit extended to end of July"
            }
          }
        },
        "CivilsDocument": {
          "type": "object",
          "description": "Document attached to a civils job (from `upload_data` table).",
          "properties": {
            "id": {
              "type": "integer",
              "description": "Document primary key.",
              "example": 42
            },
            "arrival_datetime": {
              "type": "string",
              "nullable": true,
              "description": "Upload timestamp.",
              "example": "2025-06-15 10:00:00"
            },
            "file_name": {
              "type": "string",
              "nullable": true,
              "description": "Stored filename (relative path).",
              "example": "uploads/1_1718441234_photo.jpg"
            },
            "file_url": {
              "type": "string",
              "nullable": true,
              "description": "Full URL to the document file.",
              "example": "http://192.168.1.100/uploads/1_1718441234_photo.jpg"
            },
            "submittedby": {
              "type": "string",
              "nullable": true,
              "description": "Name of user who uploaded.",
              "example": "Administrator"
            },
            "doctype": {
              "type": "string",
              "nullable": true,
              "description": "Document type.",
              "example": "Job Pack"
            },
            "docdesc": {
              "type": "string",
              "nullable": true,
              "description": "Document description.",
              "example": "Site Job Pack"
            }
          }
        },
        "BulletinEmployee": {
          "type": "object",
          "description": "Employee view of a bulletin. Same fields as `Bulletin` except\n`read_confirm` is removed and `is_read` is added to indicate whether\nthe current authenticated user has acknowledged this bulletin.\n\n**PHP compatibility:** matches the employee bulletin view in PHP.\nThe `is_read` flag is derived from `bulletinread` for the current user.\n",
          "required": [
            "id",
            "title",
            "ref",
            "description",
            "active",
            "status",
            "arrival_datetime",
            "is_read"
          ],
          "properties": {
            "id": {
              "type": "integer",
              "description": "Auto-increment primary key from `bulletinnew.id`.",
              "example": 42
            },
            "title": {
              "type": "string",
              "description": "Bulletin title.",
              "example": "Health & Safety Update - July 2026"
            },
            "ref": {
              "type": "string",
              "description": "Reference code for audit tracking.",
              "example": "HS-2026-07"
            },
            "description": {
              "type": "string",
              "description": "Full bulletin text / body content.",
              "example": "All operatives must complete the updated safety module by 31 July 2026."
            },
            "image": {
              "type": "string",
              "nullable": true,
              "description": "Filename of the attached image. Null if none.",
              "example": "bulletin-hs-update.jpg"
            },
            "image_url": {
              "type": "string",
              "nullable": true,
              "description": "Full public URL to the image. Null if no image.",
              "example": "https://ltraffic.co.uk/uploads/bulletin/bulletin-hs-update.jpg"
            },
            "download": {
              "type": "string",
              "nullable": true,
              "description": "Filename of the attached download. Null if none.",
              "example": "hs-policy-v3.pdf"
            },
            "download_url": {
              "type": "string",
              "nullable": true,
              "description": "Full public URL to the download file. Null if none.",
              "example": "https://ltraffic.co.uk/uploads/bulletin/hs-policy-v3.pdf"
            },
            "active": {
              "type": "boolean",
              "description": "`true` = active (new=1), `false` = inactive (new=0).",
              "example": true
            },
            "status": {
              "type": "string",
              "enum": [
                "Active",
                "Inactive"
              ],
              "description": "Human-readable status string.",
              "example": "Active"
            },
            "arrival_datetime": {
              "type": "string",
              "format": "date-time",
              "description": "Creation timestamp.",
              "example": "2026-07-14T10:30:00.000Z"
            },
            "is_read": {
              "type": "boolean",
              "description": "Whether the current authenticated user has acknowledged this bulletin.\nDerived from `bulletinread` for the user''s `user_id`.\n",
              "example": false
            }
          }
        },
        "Bulletin": {
          "type": "object",
          "description": "A company bulletin managed by admins. Employees must acknowledge\nactive bulletins before using the app. Maps to the `bulletinnew` table.\n\n**PHP compatibility:** same data shape as PHP `bulletin.php` and\n`bulletinedit.php`. The `new` column (0/1) is mapped to `active`\n(boolean) and `status` (string) for mobile readability.\n",
          "required": [
            "id",
            "title",
            "ref",
            "description",
            "active",
            "status",
            "arrival_datetime"
          ],
          "properties": {
            "id": {
              "type": "integer",
              "description": "Auto-increment primary key from `bulletinnew.id`.",
              "example": 42
            },
            "title": {
              "type": "string",
              "description": "Bulletin title displayed to employees.",
              "example": "Health & Safety Update - July 2026"
            },
            "ref": {
              "type": "string",
              "description": "Unique reference code for audit tracking. Used in `bulletinconfirm.ref`.",
              "example": "HS-2026-07"
            },
            "description": {
              "type": "string",
              "description": "Full bulletin text / body content.",
              "example": "All operatives must complete the updated safety module by 31 July 2026."
            },
            "image": {
              "type": "string",
              "nullable": true,
              "description": "Filename of the attached image stored in the `bulletin/` upload folder. Null if no image.",
              "example": "bulletin-hs-update.jpg"
            },
            "image_url": {
              "type": "string",
              "nullable": true,
              "description": "Full public URL to the image file. Null if no image attached.",
              "example": "https://ltraffic.co.uk/uploads/bulletin/bulletin-hs-update.jpg"
            },
            "download": {
              "type": "string",
              "nullable": true,
              "description": "Filename of the attached download (PDF / document). Null if none.",
              "example": "hs-policy-v3.pdf"
            },
            "download_url": {
              "type": "string",
              "nullable": true,
              "description": "Full public URL to the download file. Null if no attachment.",
              "example": "https://ltraffic.co.uk/uploads/bulletin/hs-policy-v3.pdf"
            },
            "active": {
              "type": "boolean",
              "description": "Derived from `bulletinnew.new` column. `true` = active (new=1), `false` = inactive (new=0).",
              "example": true
            },
            "status": {
              "type": "string",
              "enum": [
                "Active",
                "Inactive"
              ],
              "description": "Human-readable status string. Same meaning as the `active` boolean.",
              "example": "Active"
            },
            "arrival_datetime": {
              "type": "string",
              "format": "date-time",
              "description": "Creation timestamp from `bulletinnew.arrival_datetime`. Set to `NOW()` on insert.",
              "example": "2026-07-14T10:30:00.000Z"
            },
            "read_confirm": {
              "type": "string",
              "nullable": true,
              "description": "Comma-separated list of employee names who have read this bulletin.\nBuilt via GROUP_CONCAT on `bulletinread` joined with `login_users`.\nNull if no one has read it yet. **Admin-only field** — not returned\nto employees.\n",
              "example": "Anthony Louch, Dean Stokes, Mark Smith"
            }
          }
        },
        "BulletinReader": {
          "type": "object",
          "description": "A user who has acknowledged a specific bulletin. Sourced from\n`bulletinread` joined with `login_users`.\n",
          "required": [
            "user_id",
            "name",
            "email"
          ],
          "properties": {
            "user_id": {
              "type": "integer",
              "description": "User primary key from `login_users.user_id`.",
              "example": 5
            },
            "name": {
              "type": "string",
              "description": "Employee display name from `login_users.name`.",
              "example": "Dean Stokes"
            },
            "email": {
              "type": "string",
              "format": "email",
              "description": "Employee email from `login_users.email`.",
              "example": "dean@ltraffic.co.uk"
            }
          }
        },
        "LoginRequest": {
          "type": "object",
          "required": [
            "password"
          ],
          "description": "Provide ONE of `identifier`, `username`, or `email` — any of the three\nworks. `password` is always required. `deviceId` is optional but strongly\nrecommended for per-device logout support. Mobile clients may also send\n`fcm_token` and `platform`; when both are present, the token is registered\nautomatically for the authenticated user.\n\n**Validation:** at least one of `identifier`, `username`, or `email`\nmust be non-empty after trimming, otherwise the server returns 422.\n\n| Field | Required | Notes |\n|-------|----------|-------|\n| identifier / username / email | ONE required | Merged server-side |\n| password | Yes | 1–200 chars |\n| deviceId | No | Ties refresh token to device |\n| fcm_token | No | Auto-registers when `platform` is also supplied |\n| platform | No | `android` or `ios`; required with `fcm_token` |\n",
          "example": {
            "identifier": "admin",
            "password": "Test@1234",
            "deviceId": "a1b2c3-d4e5f6",
            "fcm_token": "fMEP0vJqS0m:APA91bH...",
            "platform": "android"
          },
          "properties": {
            "identifier": {
              "type": "string",
              "maxLength": 255,
              "description": "**PREFERRED.** Username OR email — backend auto-detects.",
              "example": "admin"
            },
            "username": {
              "type": "string",
              "maxLength": 255,
              "description": "Legacy alias for `identifier`. Accepted for PHP-parity.",
              "example": "admin"
            },
            "email": {
              "type": "string",
              "maxLength": 255,
              "description": "Legacy alias for `identifier`. Accepted for PHP-parity.",
              "example": "al@ltraffic.co.uk"
            },
            "password": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200,
              "description": "**REQUIRED.** Plain-text password. Server handles MD5/bcrypt comparison internally.",
              "example": "Test@1234"
            },
            "deviceId": {
              "type": "string",
              "maxLength": 128,
              "description": "**OPTIONAL but recommended.** Stable per-device identifier from the\nmobile OS (Android: `Settings.Secure.ANDROID_ID`; iOS:\n`UIDevice.identifierForVendor`). Ties the issued refresh token to\nthis device so per-device logout is possible later.\n",
              "example": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            },
            "fcm_token": {
              "type": "string",
              "minLength": 10,
              "maxLength": 512,
              "description": "**OPTIONAL.** FCM token to register after successful login.",
              "example": "fMEP0vJqS0m:APA91bH..."
            },
            "platform": {
              "type": "string",
              "enum": [
                "ios",
                "android"
              ],
              "description": "**OPTIONAL.** Required together with `fcm_token`.",
              "example": "android"
            }
          }
        },
        "LoginResponse": {
          "type": "object",
          "description": "Successful login. Contains a short-lived JWT access token, a long-lived\nopaque refresh token, and the authenticated user's profile with resolved\nroles and `userType` routing hint.\n",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object",
              "required": [
                "accessToken",
                "accessExpiresIn",
                "refreshToken",
                "refreshExpiresAt",
                "user"
              ],
              "properties": {
                "accessToken": {
                  "type": "string",
                  "description": "JWT (HS256) to send on every subsequent request as\n`Authorization: Bearer <accessToken>`. Expires in 15 minutes.\n",
                  "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MjA1MjE1NDgsImV4cCI6MTcyMDUyMjQ0OCwiaXNzIjoibHRyYWZmaWMtYXBpIn0.abc123"
                },
                "accessExpiresIn": {
                  "type": "string",
                  "description": "Human-readable lifetime of `accessToken`.",
                  "example": "15m"
                },
                "refreshToken": {
                  "type": "string",
                  "description": "64-char opaque hex token. Store in **secure storage only**\n(iOS Keychain / Android EncryptedSharedPreferences). Use on\n`/auth/refresh` when the access token expires. Rotates on every use.\n",
                  "example": "3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a"
                },
                "refreshExpiresAt": {
                  "type": "string",
                  "format": "date-time",
                  "description": "Absolute UTC expiry of `refreshToken` (~60 days from login).",
                  "example": "2026-09-09T11:19:08.706Z"
                },
                "bulletinAcknowledgementRequired": {
                  "type": "boolean",
                  "description": "True when active bulletins remain unread; the employee app must open Bulletins before its main dashboard.",
                  "example": true
                },
                "pendingBulletinCount": {
                  "type": "integer",
                  "minimum": 0,
                  "description": "Number of active bulletins the user must acknowledge.",
                  "example": 2
                },
                "user": {
                  "$ref": "#/components/schemas/AuthenticatedUser"
                }
              }
            }
          }
        },
        "AuthenticatedUser": {
          "type": "object",
          "description": "Profile of the logged-in user with resolved roles. Returned inside\n`LoginResponse.data.user` and from `GET /auth/me`.\n\n**PHP compatibility:** field values are sourced from the shared\n`login_users` and `login_levels` tables — identical to what PHP reads.\n",
          "required": [
            "id",
            "username",
            "name",
            "email",
            "levelIds",
            "roles",
            "userType"
          ],
          "properties": {
            "id": {
              "type": "integer",
              "description": "Primary key from `login_users.user_id`.",
              "example": 1
            },
            "username": {
              "type": "string",
              "description": "Login username from `login_users.username`.",
              "example": "admin"
            },
            "name": {
              "type": "string",
              "description": "Display name from `login_users.name1`.",
              "example": "Anthony Louch"
            },
            "email": {
              "type": "string",
              "format": "email",
              "description": "Email address from `login_users.email`.",
              "example": "al@ltraffic.co.uk"
            },
            "ltrafficid": {
              "type": "string",
              "nullable": true,
              "description": "Employee ID from `login_users.ltrafficid`. Null if not assigned.",
              "example": "00001"
            },
            "team": {
              "type": "string",
              "nullable": true,
              "description": "Team assignment from `login_users.team`.",
              "example": "director"
            },
            "levelIds": {
              "type": "array",
              "items": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9
              },
              "description": "Numeric level IDs from `login_levels`. A user may hold multiple\nlevels (comma-separated in PHP `login_users.user_level`).\n\n| ID | Role | userType |\n|----|------|----------|\n| 1 | Admin | admin |\n| 2 | Driving Operatives | employee |\n| 3 | Operatives | employee |\n| 4 | Admin1 | admin |\n| 5 | Civils TFL Driver | employee |\n| 6 | Civils Trailer Driver | employee |\n| 7 | Admin2 | admin |\n| 8 | Essex Supervisor | admin |\n| 9 | Customer | employee |\n",
              "example": [
                1
              ]
            },
            "roles": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Human-readable role names matching PHP `protect(\"Admin, Admin1\")`.\nUse these for client-side permission gating.\n",
              "example": [
                "Admin"
              ]
            },
            "userType": {
              "type": "string",
              "enum": [
                "admin",
                "employee"
              ],
              "description": "Routing hint: which mobile app this user belongs in.\n`admin` = levels 1, 4, 7, 8. `employee` = all others.\nUse this to decide which screens / navigation to show after login.\n",
              "example": "admin"
            }
          }
        },
        "RefreshRequest": {
          "type": "object",
          "required": [
            "refreshToken"
          ],
          "description": "Submit the current refresh token to obtain a new access + refresh token pair.",
          "properties": {
            "refreshToken": {
              "type": "string",
              "minLength": 1,
              "maxLength": 256,
              "description": "**REQUIRED.** The refresh token previously issued by `/auth/login` or `/auth/refresh`.",
              "example": "3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a"
            }
          }
        },
        "RefreshResponse": {
          "type": "object",
          "description": "New token pair after successful rotation. The previously submitted\nrefresh token is now permanently revoked and cannot be reused.\n",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object",
              "required": [
                "accessToken",
                "accessExpiresIn",
                "refreshToken",
                "refreshExpiresAt"
              ],
              "properties": {
                "accessToken": {
                  "type": "string",
                  "description": "New JWT access token (15m lifetime).",
                  "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MjA1MjI0NDgsImV4cCI6MTcyMDUyMzM0OCwiaXNzIjoibHRyYWZmaWMtYXBpIn0.def456"
                },
                "accessExpiresIn": {
                  "type": "string",
                  "description": "Human-readable lifetime.",
                  "example": "15m"
                },
                "refreshToken": {
                  "type": "string",
                  "description": "New opaque refresh token (60d lifetime). Replaces the submitted one — store it.",
                  "example": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
                },
                "refreshExpiresAt": {
                  "type": "string",
                  "format": "date-time",
                  "description": "Absolute UTC expiry of the new refresh token.",
                  "example": "2026-09-09T11:19:08.706Z"
                }
              }
            }
          }
        },
        "LogoutRequest": {
          "type": "object",
          "required": [
            "refreshToken"
          ],
          "description": "Submit the refresh token to revoke it. The access token itself is NOT\nblacklisted — it is short-lived (15m) and will expire naturally.\nClients should discard both tokens after calling this endpoint.\n",
          "properties": {
            "refreshToken": {
              "type": "string",
              "minLength": 1,
              "maxLength": 256,
              "description": "**REQUIRED.** The refresh token to revoke.",
              "example": "3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a"
            }
          }
        },
        "LogoutResponse": {
          "type": "object",
          "description": "Logout result. Always returns HTTP 200 regardless of whether the\ntoken was found, to avoid leaking session state.\n",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object",
              "properties": {
                "revoked": {
                  "type": "boolean",
                  "description": "`true` = an active token row was revoked. `false` = token was unknown or already revoked.",
                  "example": true
                }
              }
            }
          }
        },
        "ChangePasswordRequest": {
          "type": "object",
          "required": [
            "currentPassword",
            "newPassword"
          ],
          "description": "Both the current and new password are required. On success all other\nrefresh tokens for this user are revoked (forces re-login on every\nother device).\n\n| Field | Constraints |\n|-------|-------------|\n| currentPassword | 1–200 chars |\n| newPassword | 8–72 chars (bcrypt limit) |\n",
          "properties": {
            "currentPassword": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200,
              "description": "**REQUIRED.** User must re-authenticate with their current password.",
              "example": "OldPass1!"
            },
            "newPassword": {
              "type": "string",
              "minLength": 8,
              "maxLength": 72,
              "description": "**REQUIRED.** New password. Minimum 8 chars, maximum 72 (bcrypt limit).",
              "example": "NewPass987!"
            }
          }
        },
        "ChangePasswordResponse": {
          "type": "object",
          "description": "Password change confirmation. All other refresh tokens for this user have been revoked.",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object",
              "properties": {
                "changed": {
                  "type": "boolean",
                  "description": "Always `true` on success.",
                  "example": true
                }
              }
            }
          }
        },
        "ForgotPasswordRequest": {
          "type": "object",
          "required": [
            "email"
          ],
          "description": "Request a password-reset link. The server always returns 202 regardless\nof whether the email exists in the database (anti-enumeration).\nThe email is trimmed and lowercased server-side before lookup.\n",
          "properties": {
            "email": {
              "type": "string",
              "format": "email",
              "maxLength": 255,
              "description": "**REQUIRED.** Email address associated with the account.",
              "example": "user@example.com"
            }
          }
        },
        "ForgotPasswordResponse": {
          "type": "object",
          "description": "Always returns `requested: true` with HTTP 202. Does NOT reveal\nwhether the email address exists in the database.\n",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object",
              "properties": {
                "requested": {
                  "type": "boolean",
                  "description": "Always `true`. Server does not disclose whether the email exists.",
                  "example": true
                }
              }
            }
          }
        },
        "ResetPasswordRequest": {
          "type": "object",
          "required": [
            "key",
            "newPassword"
          ],
          "description": "Consume the 32-char reset key from the forgot-password email link and\nset a new password. The key is single-use and deleted after consumption.\n\n| Field | Constraints |\n|-------|-------------|\n| key | Exactly 32 hex chars |\n| newPassword | 8–72 chars |\n",
          "properties": {
            "key": {
              "type": "string",
              "minLength": 32,
              "maxLength": 32,
              "description": "**REQUIRED.** 32-char hex reset key from the forgot-password email link.",
              "example": "87762735f29ba5aab8244d47ef37fd7f"
            },
            "newPassword": {
              "type": "string",
              "minLength": 8,
              "maxLength": 72,
              "description": "**REQUIRED.** New password. Minimum 8 chars, maximum 72 (bcrypt limit).",
              "example": "BrandNew1!"
            }
          }
        },
        "ResetPasswordResponse": {
          "type": "object",
          "description": "Password reset confirmation. All refresh tokens for the user have been revoked.",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object",
              "properties": {
                "reset": {
                  "type": "boolean",
                  "description": "Always `true` on success. User must log in again.",
                  "example": true
                }
              }
            }
          }
        }
      },
      "responses": {
        "Deleted200": {
          "description": "Resource deleted successfully.",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApiSuccess"
              },
              "example": {
                "success": true,
                "data": {
                  "message": "Deleted successfully"
                }
              }
            }
          }
        },
        "Unauthorized401": {
          "description": "Missing or invalid bearer token.",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApiError"
              },
              "examples": {
                "tokenExpired": {
                  "summary": "Access token expired",
                  "value": {
                    "success": false,
                    "error": {
                      "code": "AUTH_TOKEN_EXPIRED",
                      "message": "Access token has expired",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                },
                "tokenInvalid": {
                  "summary": "Malformed or tampered JWT",
                  "value": {
                    "success": false,
                    "error": {
                      "code": "AUTH_TOKEN_INVALID",
                      "message": "Invalid access token",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                },
                "noHeader": {
                  "summary": "No Authorization header",
                  "value": {
                    "success": false,
                    "error": {
                      "code": "UNAUTHORIZED",
                      "message": "Authentication required",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                }
              }
            }
          }
        },
        "Forbidden403": {
          "description": "Authenticated but insufficient permissions.",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApiError"
              },
              "example": {
                "success": false,
                "error": {
                  "code": "FORBIDDEN",
                  "message": "Insufficient permissions",
                  "details": null,
                  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                }
              }
            }
          }
        },
        "NotFound404": {
          "description": "Resource not found.",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApiError"
              },
              "example": {
                "success": false,
                "error": {
                  "code": "NOT_FOUND",
                  "message": "Resource not found",
                  "details": null,
                  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                }
              }
            }
          }
        },
        "ValidationError422": {
          "description": "Request body or query failed Zod validation.",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApiError"
              },
              "example": {
                "success": false,
                "error": {
                  "code": "VALIDATION_ERROR",
                  "message": "Validation failed",
                  "details": [
                    {
                      "code": "too_small",
                      "minimum": 1,
                      "type": "string",
                      "inclusive": true,
                      "exact": false,
                      "message": "String must contain at least 1 character(s)",
                      "path": [
                        "field"
                      ]
                    }
                  ],
                  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                }
              }
            }
          }
        },
        "RateLimited429": {
          "description": "Too many requests — back off and retry.",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApiError"
              },
              "example": {
                "success": false,
                "error": {
                  "code": "RATE_LIMITED",
                  "message": "Too many requests, please try again later",
                  "details": null,
                  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                }
              }
            }
          }
        }
      }
    },
    "security": [
      {
        "bearerAuth": []
      }
    ],
    "x-tagGroups": [
      {
        "name": "Authentication",
        "tags": [
          "Authentication"
        ]
      },
      {
        "name": "Common APIs",
        "tags": [
          "Devices",
          "Notifications",
          "Bulletins",
          "Contacts",
          "Documents",
          "Onboarding",
          "My Account"
        ]
      },
      {
        "name": "Employee APIs",
        "tags": [
          "Vehicle Checks",
          "Timesheets",
          "Incidents",
          "Equipment Checks",
          "Site Inspections",
          "Vehicle Inspections",
          "Work Records",
          "Clegg Testing",
          "Wildanet Risk Assessments",
          "PIA & Fibre Risk",
          "Wildanet Jobs",
          "Civils",
          "TFL"
        ]
      },
      {
        "name": "Admin APIs",
        "tags": [
          "Admin - Bulletins",
          "Admin - Documents",
          "Admin - Vehicle Checks",
          "Admin - Timesheets",
          "Admin - Incidents",
          "Admin - Contacts",
          "Admin - HR",
          "Admin - Users",
          "Admin - Equipment Register",
          "Admin - Vehicle Register",
          "Admin - Plant Register",
          "Admin - Equipment Checks",
          "Admin - Site Inspections",
          "Admin - Vehicle Inspections",
          "Admin - Wildanet Jobs",
          "Admin - Civils",
          "Admin - TFL",
          "Admin - Work Records",
          "Admin - Clegg Testing",
          "Admin - Wildanet Risk Assessments",
          "Admin - PIA & Fibre Risk"
        ]
      }
    ],
    "paths": {
      "/employee/work-records": {
        "get": {
          "tags": [
            "Work Records"
          ],
          "summary": "List work records",
          "description": "Returns paginated list of work records. Filterable by status. Searchable by lt1 (Recorded By) and lt9 (Type of Works) prefix match. Pending status sorts ASC, all others DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string"
              },
              "description": "Filter by work record status"
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by lt1 Recorded By (prefix match)"
            },
            {
              "in": "query",
              "name": "lt9",
              "schema": {
                "type": "string"
              },
              "description": "Filter by lt9 Type of Works (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated work record list"
            }
          }
        },
        "post": {
          "tags": [
            "Work Records"
          ],
          "summary": "Create work record",
          "description": "Creates a new work record with image uploads. Send as multipart/form-data. Recorded By (lt1) and Date/Time (lt2) are auto-populated. Status is set to Pending.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "lt3",
                    "lt4",
                    "lt5",
                    "lt6",
                    "lt7",
                    "lt8",
                    "lt9",
                    "lt10",
                    "lt11",
                    "lt12"
                  ],
                  "properties": {
                    "lt3": {
                      "type": "string",
                      "description": "Road Name"
                    },
                    "lt4": {
                      "type": "string",
                      "description": "Cabinet Area"
                    },
                    "lt5": {
                      "type": "string",
                      "description": "Primary Node number"
                    },
                    "lt6": {
                      "type": "string",
                      "description": "Secondary Node category"
                    },
                    "lt7": {
                      "type": "string",
                      "description": "Secondary Node number"
                    },
                    "lt8": {
                      "type": "string",
                      "description": "Structure ID"
                    },
                    "lt9": {
                      "type": "string",
                      "description": "Type of Works"
                    },
                    "lt10": {
                      "type": "string",
                      "description": "Work Status"
                    },
                    "lt11": {
                      "type": "string",
                      "description": "Notes"
                    },
                    "lt12": {
                      "type": "string",
                      "description": "Ducting Length"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Work record created"
            }
          }
        }
      },
      "/employee/work-records/{id}": {
        "get": {
          "tags": [
            "Work Records"
          ],
          "summary": "Get work record by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Work record details with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/work-records": {
        "get": {
          "tags": [
            "Admin - Work Records"
          ],
          "summary": "List all work records",
          "description": "Returns paginated list of work records. Filterable by status. Searchable by lt1 (Recorded By) and lt9 (Type of Works) prefix match. Pending status sorts ASC, all others DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string"
              },
              "description": "Filter by work record status"
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by lt1 Recorded By (prefix match)"
            },
            {
              "in": "query",
              "name": "lt9",
              "schema": {
                "type": "string"
              },
              "description": "Filter by lt9 Type of Works (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated work record list"
            }
          }
        }
      },
      "/admin/work-records/{id}": {
        "get": {
          "tags": [
            "Admin - Work Records"
          ],
          "summary": "Get work record by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Work record details with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Work Records"
          ],
          "summary": "Update work record",
          "description": "Updates an existing work record. All fields are optional. Includes status changes.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "lt1": {
                      "type": "string"
                    },
                    "lt3": {
                      "type": "string"
                    },
                    "lt4": {
                      "type": "string"
                    },
                    "lt5": {
                      "type": "string"
                    },
                    "lt6": {
                      "type": "string"
                    },
                    "lt7": {
                      "type": "string"
                    },
                    "lt8": {
                      "type": "string"
                    },
                    "lt9": {
                      "type": "string"
                    },
                    "lt10": {
                      "type": "string"
                    },
                    "lt11": {
                      "type": "string"
                    },
                    "lt12": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string"
                    },
                    "image": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Work record updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Work Records"
          ],
          "summary": "Delete work record",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/wildanet-risk-assessments": {
        "get": {
          "tags": [
            "Wildanet Risk Assessments"
          ],
          "summary": "List own risk assessments",
          "description": "Returns paginated list of risk assessments created by the current user. Searchable by ra3 (Job Number) prefix match.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by Job Number (ra3) prefix match"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated risk assessment list"
            }
          }
        },
        "post": {
          "tags": [
            "Wildanet Risk Assessments"
          ],
          "summary": "Create Part 1 of a risk assessment",
          "description": "Creates a new Wildanet Risk Assessment (Part 1 — Site Details).\nRequires wildanetId (parent job). Auto-populates job number, location, client, dates, and completed by.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "wildanetId",
                    "ra8",
                    "ra9",
                    "ra10",
                    "ra11"
                  ],
                  "properties": {
                    "wildanetId": {
                      "type": "integer",
                      "description": "Parent Wildanet job ID"
                    },
                    "ra1": {
                      "type": "string",
                      "description": "Project Name"
                    },
                    "ra8": {
                      "type": "string",
                      "description": "Scope of Works"
                    },
                    "ra9": {
                      "type": "string",
                      "description": "Site Job Pack Available (Yes/No)"
                    },
                    "ra10": {
                      "type": "string",
                      "description": "Services Identified on Job Pack (Yes/No)"
                    },
                    "ra11": {
                      "type": "string",
                      "description": "Services Located on Site (Yes/No)"
                    },
                    "ra12": {
                      "type": "string",
                      "description": "Services identified details"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Risk assessment created"
            }
          }
        }
      },
      "/employee/wildanet-risk-assessments/{id}": {
        "get": {
          "tags": [
            "Wildanet Risk Assessments"
          ],
          "summary": "Get own risk assessment by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Risk assessment detail with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/wildanet-risk-assessments/{id}/part/{partNum}": {
        "put": {
          "tags": [
            "Wildanet Risk Assessments"
          ],
          "summary": "Submit risk assessment part (2-5)",
          "description": "Submits a subsequent part of the risk assessment wizard.\nPart 2: Personnel In Attendance. Part 3: Hazards. Part 4: Permit to Dig. Part 5: End of Day (sets status to RA Completed).\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "partNum",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 2,
                "maximum": 5
              }
            }
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated risk assessment"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/wildanet-risk-assessments": {
        "get": {
          "tags": [
            "Admin - Wildanet Risk Assessments"
          ],
          "summary": "List Wildanet risk assessments",
          "description": "Returns paginated list. Searchable by id or ra3 (Job Number) prefix match. Filter by status (live or completed).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by id or Job Number (ra3) prefix match"
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string",
                "enum": [
                  "live",
                  "completed"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated risk assessment list"
            }
          }
        }
      },
      "/admin/wildanet-risk-assessments/{id}": {
        "get": {
          "tags": [
            "Admin - Wildanet Risk Assessments"
          ],
          "summary": "Get risk assessment by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Full risk assessment detail with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Wildanet Risk Assessments"
          ],
          "summary": "Update risk assessment",
          "description": "Updates an existing risk assessment record. All fields optional.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string",
                      "enum": [
                        "In Progress",
                        "RA Completed"
                      ]
                    },
                    "ra1": {
                      "type": "string"
                    },
                    "ra8": {
                      "type": "string"
                    },
                    "ra9": {
                      "type": "string"
                    },
                    "ra10": {
                      "type": "string"
                    },
                    "ra11": {
                      "type": "string"
                    },
                    "ra12": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated risk assessment"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Wildanet Risk Assessments"
          ],
          "summary": "Delete risk assessment",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/wildanet-jobs": {
        "get": {
          "tags": [
            "Wildanet Jobs"
          ],
          "summary": "List active Wildanet jobs",
          "description": "Returns paginated list of active Wildanet jobs (excludes Completed, Cancelled, Closed, Invoiced, Awaiting Invoicing). Searchable by solonumber and assignedto (prefix match). Sorted by startdate DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by solonumber (prefix match)"
            },
            {
              "in": "query",
              "name": "assignedto",
              "schema": {
                "type": "string"
              },
              "description": "Filter by assignedto (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated active job list"
            }
          }
        }
      },
      "/employee/wildanet-jobs/{id}": {
        "get": {
          "tags": [
            "Wildanet Jobs"
          ],
          "summary": "Get Wildanet job by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Job details with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/wildanet-jobs/{id}/documents": {
        "get": {
          "tags": [
            "Wildanet Jobs"
          ],
          "summary": "List documents for a Wildanet job",
          "description": "Returns paginated list of uploaded documents for a job.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Job not found"
            }
          }
        }
      },
      "/admin/wildanet-jobs": {
        "get": {
          "tags": [
            "Admin - Wildanet Jobs"
          ],
          "summary": "List all Wildanet jobs",
          "description": "Returns paginated list of all Wildanet jobs regardless of status. Searchable by solonumber, assignedto, jobstatus, and permitstatus (prefix match). Sorted by startdate DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by solonumber (prefix match)"
            },
            {
              "in": "query",
              "name": "assignedto",
              "schema": {
                "type": "string"
              },
              "description": "Filter by assignedto (prefix match)"
            },
            {
              "in": "query",
              "name": "jobstatus",
              "schema": {
                "type": "string"
              },
              "description": "Filter by jobstatus (prefix match)"
            },
            {
              "in": "query",
              "name": "permitstatus",
              "schema": {
                "type": "string"
              },
              "description": "Filter by permitstatus (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated job list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Wildanet Jobs"
          ],
          "summary": "Create Wildanet job",
          "description": "Creates a new Wildanet job with optional job pack file upload. Send as multipart/form-data.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "jobstatus",
                    "assignedto",
                    "client",
                    "authority",
                    "community",
                    "solonumber",
                    "location",
                    "postcode",
                    "permitstatus"
                  ],
                  "properties": {
                    "jobstatus": {
                      "type": "string"
                    },
                    "assignedto": {
                      "type": "string"
                    },
                    "client": {
                      "type": "string"
                    },
                    "authority": {
                      "type": "string"
                    },
                    "community": {
                      "type": "string"
                    },
                    "solonumber": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "postcode": {
                      "type": "string"
                    },
                    "permitstatus": {
                      "type": "string"
                    },
                    "startdate": {
                      "type": "string"
                    },
                    "enddate": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Job created"
            }
          }
        }
      },
      "/admin/wildanet-jobs/{id}": {
        "get": {
          "tags": [
            "Admin - Wildanet Jobs"
          ],
          "summary": "Get Wildanet job by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Job details with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Wildanet Jobs"
          ],
          "summary": "Update Wildanet job",
          "description": "Updates an existing Wildanet job. All fields are optional.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "jobstatus": {
                      "type": "string"
                    },
                    "assignedto": {
                      "type": "string"
                    },
                    "client": {
                      "type": "string"
                    },
                    "authority": {
                      "type": "string"
                    },
                    "community": {
                      "type": "string"
                    },
                    "solonumber": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "postcode": {
                      "type": "string"
                    },
                    "permitstatus": {
                      "type": "string"
                    },
                    "startdate": {
                      "type": "string"
                    },
                    "enddate": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    },
                    "image": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Job updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Wildanet Jobs"
          ],
          "summary": "Delete Wildanet job",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/wildanet-jobs/{id}/documents": {
        "get": {
          "tags": [
            "Admin - Wildanet Jobs"
          ],
          "summary": "List documents for a Wildanet job",
          "description": "Returns paginated list of uploaded documents for a job. Searchable by submittedby or arrival_datetime (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Job not found"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Wildanet Jobs"
          ],
          "summary": "Upload document for a Wildanet job",
          "description": "Uploads a document associated with a Wildanet job. Send as multipart/form-data.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file",
                    "doctype",
                    "docdesc"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    },
                    "doctype": {
                      "type": "string"
                    },
                    "docdesc": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Job not found"
            }
          }
        }
      },
      "/admin/wildanet-jobs/{id}/documents/{docId}": {
        "delete": {
          "tags": [
            "Admin - Wildanet Jobs"
          ],
          "summary": "Delete a document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/vehicle-register": {
        "get": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "List active vehicles",
          "description": "Returns paginated list of active vehicles (cond=Yes). Searchable by registration number or allocated-to (prefix match). Sorted by reg ASC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by registration or allocated-to (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated active vehicle list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "Create vehicle register entry",
          "description": "Adds a new vehicle to the register.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "reg",
                    "allocatedto",
                    "cond"
                  ],
                  "properties": {
                    "reg": {
                      "type": "string",
                      "description": "Vehicle registration number"
                    },
                    "description": {
                      "type": "string"
                    },
                    "allocatedto": {
                      "type": "string",
                      "description": "Person vehicle is allocated to"
                    },
                    "date": {
                      "type": "string",
                      "description": "Allocation date"
                    },
                    "cond": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "description": "Active status (Yes=active, No=archived)"
                    },
                    "mexpiry": {
                      "type": "string",
                      "description": "MOT expiry date"
                    },
                    "texpiry": {
                      "type": "string",
                      "description": "Vehicle tax expiry date"
                    },
                    "sexpiry": {
                      "type": "string",
                      "description": "Service expiry date"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Vehicle entry created"
            }
          }
        }
      },
      "/admin/vehicle-register/archived": {
        "get": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "List archived vehicles",
          "description": "Returns paginated list of archived/completed vehicles (cond=No). Searchable by registration number or allocated-to (prefix match). Sorted by reg ASC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by registration or allocated-to (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated archived vehicle list"
            }
          }
        }
      },
      "/admin/vehicle-register/{id}": {
        "get": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "Get vehicle register entry by ID",
          "description": "Returns full vehicle register entry details.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Vehicle register entry details"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "Update vehicle register entry",
          "description": "Updates an existing vehicle register entry. All fields are optional — only provided fields are updated.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "reg": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    },
                    "allocatedto": {
                      "type": "string"
                    },
                    "date": {
                      "type": "string"
                    },
                    "cond": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ]
                    },
                    "mexpiry": {
                      "type": "string"
                    },
                    "texpiry": {
                      "type": "string"
                    },
                    "sexpiry": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Vehicle entry updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "Delete vehicle register entry",
          "description": "Permanently deletes a vehicle register entry.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/vehicle-register/{id}/documents": {
        "get": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "List documents for a vehicle register entry",
          "description": "Returns paginated list of uploaded documents for a specific vehicle register entry. Searchable by submittedby or arrival_datetime (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by submittedby or upload datetime (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Vehicle register entry not found"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "Upload a document for a vehicle register entry",
          "description": "Uploads a document (image, PDF, or office file) associated with a vehicle register entry.\nSend as multipart/form-data with field name \"file\" for the uploaded file.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file",
                    "doctype",
                    "docdesc"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    },
                    "doctype": {
                      "type": "string",
                      "enum": [
                        "Condition Image",
                        "Service / Calibration Expiry",
                        "Other"
                      ]
                    },
                    "docdesc": {
                      "type": "string",
                      "description": "Document description"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Vehicle register entry not found"
            },
            "415": {
              "description": "Unsupported file type"
            }
          }
        }
      },
      "/admin/vehicle-register/{id}/documents/{docId}": {
        "delete": {
          "tags": [
            "Admin - Vehicle Register"
          ],
          "summary": "Delete a document",
          "description": "Permanently deletes an uploaded document from the vehicle register entry.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/vehicle-inspections": {
        "post": {
          "tags": [
            "Vehicle Inspections"
          ],
          "summary": "Create Part 1 of a vehicle inspection",
          "description": "Creates a new vehicle inspection (Part 1 — Interior, Exterior, Glass & Mirrors).\nRequires vrId in body to look up the parent vehicle record.\nAuto-populates vic1 (name), vic2 (reg from VR), vic4 (datetime).\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "vrId"
                  ],
                  "properties": {
                    "vrId": {
                      "type": "integer"
                    },
                    "vic3": {
                      "type": "string",
                      "description": "Mileage"
                    },
                    "vic5": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "description": "Seat(s) Condition"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Part 1 created"
            },
            "404": {
              "description": "Vehicle record not found"
            }
          }
        },
        "get": {
          "tags": [
            "Vehicle Inspections"
          ],
          "summary": "List own vehicle inspections",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Own inspections"
            }
          }
        }
      },
      "/employee/vehicle-inspections/{id}/part/{partNum}": {
        "put": {
          "tags": [
            "Vehicle Inspections"
          ],
          "summary": "Submit a part of the vehicle inspection",
          "description": "Submit Parts 2-4. Part 4 sets status to \"Completed\".",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "partNum",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 2,
                "maximum": 4
              }
            }
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Part submitted"
            },
            "404": {
              "description": "Inspection not found"
            }
          }
        }
      },
      "/employee/vehicle-inspections/{id}": {
        "get": {
          "tags": [
            "Vehicle Inspections"
          ],
          "summary": "Get own vehicle inspection by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Inspection detail"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/vehicle-inspections/{id}/repairs": {
        "post": {
          "tags": [
            "Vehicle Inspections"
          ],
          "summary": "Add inspection repair (VIR)",
          "description": "Creates a Vehicle Inspection Repair record linked to the VIC.\nAuto-populates vir1 (reg from VIC), vir9 (signature), vir10 (completed by).\nStatus is always \"Completed\".\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "vir2": {
                      "type": "string",
                      "description": "Inspection repair date/time"
                    },
                    "vir3": {
                      "type": "string",
                      "description": "Vehicle mileage"
                    },
                    "vir4": {
                      "type": "string",
                      "description": "Reported defect details"
                    },
                    "vir5": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "description": "Defect rectified"
                    },
                    "vir6": {
                      "type": "string",
                      "description": "Works completed description"
                    },
                    "vir7": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "vir8": {
                      "type": "string",
                      "description": "Notes"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Repair created"
            },
            "404": {
              "description": "Parent inspection not found"
            }
          }
        }
      },
      "/admin/vehicle-inspections": {
        "get": {
          "tags": [
            "Admin - Vehicle Inspections"
          ],
          "summary": "List vehicle inspections",
          "description": "Returns paginated list of vehicle inspections. Optional search by vehicle registration (vic2).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by vehicle registration prefix"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated inspection list"
            }
          }
        }
      },
      "/admin/vehicle-inspections/{id}": {
        "get": {
          "tags": [
            "Admin - Vehicle Inspections"
          ],
          "summary": "Get vehicle inspection by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Full inspection detail with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Vehicle Inspections"
          ],
          "summary": "Update vehicle inspection",
          "description": "Update any fields including status. Admin and Admin1 only.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string",
                      "enum": [
                        "In Progress",
                        "Completed"
                      ]
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated inspection"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Vehicle Inspections"
          ],
          "summary": "Delete vehicle inspection",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/vehicle-inspections/{id}/repairs": {
        "get": {
          "tags": [
            "Admin - Vehicle Inspections"
          ],
          "summary": "List inspection repairs (VIR)",
          "description": "Returns all repair records for a vehicle inspection.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Repair list"
            },
            "404": {
              "description": "Parent inspection not found"
            }
          }
        }
      },
      "/admin/vehicle-inspections/{id}/repairs/{repairId}": {
        "delete": {
          "tags": [
            "Admin - Vehicle Inspections"
          ],
          "summary": "Delete inspection repair",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "repairId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/vehicle-checks": {
        "post": {
          "tags": [
            "Vehicle Checks"
          ],
          "summary": "Submit a vehicle check",
          "description": "Submits a new vehicle check. Throttled to one submission per 8 hours per driver.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "vehiclereg",
                    "mileage"
                  ],
                  "properties": {
                    "vehiclereg": {
                      "type": "string"
                    },
                    "mileage": {
                      "type": "integer"
                    },
                    "routeplanned": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "roadconditions": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "dressedforweather": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "emergencyequip": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "tires": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "lights": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "windows": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "loads": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "washer": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "oil": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "fluid": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "belts": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "seatbelt": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "horn": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "mirrors": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "brakes": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "trailercoupling": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No",
                        "N/a"
                      ],
                      "default": "N/a"
                    },
                    "safetyconnection": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No",
                        "N/a"
                      ],
                      "default": "N/a"
                    },
                    "loadsecured": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "loadweight": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "vehiclecondition": {
                      "type": "string",
                      "enum": [
                        "Good",
                        "Average",
                        "Poor",
                        "Very Poor",
                        "Dangerous"
                      ],
                      "default": "Good"
                    },
                    "safe": {
                      "type": "string",
                      "enum": [
                        "Safe",
                        "Unsafe"
                      ],
                      "default": "Safe"
                    },
                    "report": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Vehicle check submitted"
            },
            "400": {
              "description": "Throttled — already submitted within 8 hours"
            }
          }
        },
        "get": {
          "tags": [
            "Vehicle Checks"
          ],
          "summary": "List own vehicle checks",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by date"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated list of own vehicle checks"
            }
          }
        }
      },
      "/employee/vehicle-checks/{id}": {
        "get": {
          "tags": [
            "Vehicle Checks"
          ],
          "summary": "Get own vehicle check by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Vehicle check detail"
            },
            "404": {
              "description": "Not found or belongs to different driver"
            }
          }
        }
      },
      "/admin/vehicle-checks": {
        "get": {
          "tags": [
            "Admin - Vehicle Checks"
          ],
          "summary": "List all vehicle checks",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by driver name"
            },
            {
              "in": "query",
              "name": "searchDate",
              "schema": {
                "type": "string"
              },
              "description": "Filter by date prefix (e.g. 2024-01-15)"
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string",
                "enum": [
                  "action-required",
                  "closed",
                  "all"
                ]
              },
              "description": "Filter by status category"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated vehicle check list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Vehicle Checks"
          ],
          "summary": "Create vehicle check (admin)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "drivername",
                    "vehiclereg",
                    "mileage"
                  ],
                  "properties": {
                    "drivername": {
                      "type": "string"
                    },
                    "vehiclereg": {
                      "type": "string"
                    },
                    "mileage": {
                      "type": "integer"
                    },
                    "routeplanned": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "roadconditions": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "dressedforweather": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "emergencyequip": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "tires": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "lights": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "windows": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "loads": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "washer": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "oil": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "fluid": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "belts": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "seatbelt": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "horn": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "mirrors": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "brakes": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "trailercoupling": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No",
                        "N/a"
                      ],
                      "default": "N/a"
                    },
                    "safetyconnection": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No",
                        "N/a"
                      ],
                      "default": "N/a"
                    },
                    "loadsecured": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "loadweight": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "Yes"
                    },
                    "vehiclecondition": {
                      "type": "string",
                      "enum": [
                        "Good",
                        "Average",
                        "Poor",
                        "Very Poor",
                        "Dangerous",
                        "Closed"
                      ],
                      "default": "Good"
                    },
                    "safe": {
                      "type": "string",
                      "enum": [
                        "Safe",
                        "Unsafe",
                        "Closed"
                      ],
                      "default": "Safe"
                    },
                    "report": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Vehicle check created"
            }
          }
        }
      },
      "/admin/vehicle-checks/{id}": {
        "get": {
          "tags": [
            "Admin - Vehicle Checks"
          ],
          "summary": "Get vehicle check by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Vehicle check detail"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Vehicle Checks"
          ],
          "summary": "Update vehicle check",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "drivername": {
                      "type": "string"
                    },
                    "vehiclereg": {
                      "type": "string"
                    },
                    "mileage": {
                      "type": "integer"
                    },
                    "vehiclecondition": {
                      "type": "string",
                      "enum": [
                        "Good",
                        "Average",
                        "Poor",
                        "Very Poor",
                        "Dangerous",
                        "Closed"
                      ]
                    },
                    "safe": {
                      "type": "string",
                      "enum": [
                        "Safe",
                        "Unsafe",
                        "Closed"
                      ]
                    },
                    "notes": {
                      "type": "string"
                    },
                    "report": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Vehicle check updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Vehicle Checks"
          ],
          "summary": "Delete vehicle check",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/vehicle-checks/{id}/documents": {
        "get": {
          "tags": [
            "Admin - Vehicle Checks"
          ],
          "summary": "List documents for a vehicle check",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Document list"
            },
            "404": {
              "description": "Vehicle check not found"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Vehicle Checks"
          ],
          "summary": "Upload a document for a vehicle check",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary",
                      "description": "JPEG, PNG, GIF, BMP, WebP, PDF, DOC, or PPT (PHP-compatible formats)"
                    },
                    "image": {
                      "type": "string",
                      "format": "binary",
                      "description": "Legacy PHP field alias for file"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Vehicle check not found"
            }
          }
        }
      },
      "/admin/vehicle-checks/{id}/documents/{docId}": {
        "delete": {
          "tags": [
            "Admin - Vehicle Checks"
          ],
          "summary": "Delete a document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/users": {
        "get": {
          "tags": [
            "Admin - Users"
          ],
          "summary": "List user accounts",
          "description": "Returns paginated user account list. Searchable by employee name (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by employee name (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated user list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Users"
          ],
          "summary": "Create user account",
          "description": "Creates a new login account. Password is stored with dual-write (MD5 for PHP compatibility + bcrypt sidecar).\nThe onboarding field should be left empty or \"0\" so the Onboarding module detects the user as needing to complete onboarding.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "username",
                    "name",
                    "password"
                  ],
                  "description": "Provide either user_level (PHP-serialized) or level_id (1-9). `team` is the optional company team; use GET /admin/users/levels for the role-level list. Empty team is accepted as no team.",
                  "properties": {
                    "user_level": {
                      "type": "string",
                      "description": "PHP-serialized level e.g. a:1:{i:0;s:1:\"2\";}"
                    },
                    "level_id": {
                      "type": "integer",
                      "minimum": 1,
                      "maximum": 9,
                      "description": "Friendly numeric level ID; converted to the PHP-serialized user_level column."
                    },
                    "restricted": {
                      "type": "integer",
                      "enum": [
                        0,
                        1
                      ],
                      "default": 0
                    },
                    "username": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "password": {
                      "type": "string",
                      "minLength": 8
                    },
                    "teamup": {
                      "type": "string"
                    },
                    "vehiclereg": {
                      "type": "string"
                    },
                    "ltrafficid": {
                      "type": "string"
                    },
                    "team": {
                      "type": "string",
                      "nullable": true,
                      "maxLength": 255,
                      "description": "Optional company team. Known values are Director, Traffic Signals Installation, Traffic Signals Civils, Traffic Signal Maintenance, Utilities Civils, Office Staff, and Customer; custom team text is also accepted. Send null or an empty string when no team is selected. This is separate from level_id."
                    },
                    "name1": {
                      "type": "string",
                      "description": "Full name without spaces (used for photo/signature file convention)"
                    },
                    "onboarding": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "User created"
            },
            "409": {
              "description": "Username or email already exists"
            }
          }
        }
      },
      "/admin/users/{id}": {
        "get": {
          "tags": [
            "Admin - Users"
          ],
          "summary": "Get user account by ID",
          "description": "Returns full user account details including level, team, vehicle, and onboarding status.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "User account details"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Users"
          ],
          "summary": "Update user account",
          "description": "Update any user account fields. All fields are optional — only provided fields are updated.\nIf password is provided, it triggers a dual-write (MD5 + bcrypt sidecar) and revokes all refresh tokens.\n`level_id` is accepted as the friendly numeric equivalent of `user_level`.\nNullable profile fields may be sent as null to clear their legacy value.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_level": {
                      "type": "string"
                    },
                    "level_id": {
                      "type": "integer",
                      "minimum": 1,
                      "maximum": 9
                    },
                    "restricted": {
                      "type": "integer",
                      "enum": [
                        0,
                        1
                      ]
                    },
                    "name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string"
                    },
                    "password": {
                      "type": "string",
                      "minLength": 8
                    },
                    "teamup": {
                      "type": "string"
                    },
                    "vehiclereg": {
                      "type": "string"
                    },
                    "ltrafficid": {
                      "type": "string"
                    },
                    "team": {
                      "type": "string",
                      "nullable": true,
                      "description": "Optional company team; null/empty clears it. Role level is controlled by level_id."
                    },
                    "name1": {
                      "type": "string"
                    },
                    "onboarding": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "User updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Users"
          ],
          "summary": "Delete user account",
          "description": "Permanently deletes the user account, revokes all refresh tokens, and removes bcrypt sidecar.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/users/levels": {
        "get": {
          "tags": [
            "Admin - Users"
          ],
          "summary": "List available user levels",
          "description": "Returns the friendly numeric level ID, name and disabled state for the user-management form.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Available user levels"
            }
          }
        }
      },
      "/employee/timesheets/submit": {
        "post": {
          "tags": [
            "Timesheets"
          ],
          "summary": "Submit a weekly timesheet",
          "description": "Creates a timesheet with status \"Submitted\". If this employee already has a Draft or Submitted (pending) sheet for the same week, that record is updated instead. Approved sheets are never overwritten.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "week",
                    "days"
                  ],
                  "properties": {
                    "week": {
                      "type": "string",
                      "description": "Week commencing label (e.g. \"Monday - 07/07/2025\")"
                    },
                    "days": {
                      "type": "array",
                      "minItems": 1,
                      "maxItems": 7,
                      "items": {
                        "type": "object",
                        "properties": {
                          "date": {
                            "type": "string"
                          },
                          "hours": {
                            "type": "string",
                            "description": "Hours worked (e.g. \"8\")"
                          },
                          "location": {
                            "type": "string"
                          },
                          "activity": {
                            "type": "string",
                            "description": "Civils Installation, Defects, Supervision, Validation, Holiday, Sick"
                          },
                          "contract": {
                            "type": "string",
                            "description": "Essex - Gigaclear, London - Transport for London"
                          }
                        }
                      }
                    },
                    "comments": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Existing pending timesheet updated"
            },
            "201": {
              "description": "Timesheet created"
            }
          }
        }
      },
      "/employee/timesheets/draft": {
        "post": {
          "tags": [
            "Timesheets"
          ],
          "summary": "Save a timesheet as draft",
          "description": "Creates a new timesheet with status \"Draft\". Can be submitted later.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "week",
                    "days"
                  ],
                  "properties": {
                    "week": {
                      "type": "string"
                    },
                    "days": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "date": {
                            "type": "string"
                          },
                          "hours": {
                            "type": "string"
                          },
                          "location": {
                            "type": "string"
                          },
                          "activity": {
                            "type": "string"
                          },
                          "contract": {
                            "type": "string"
                          }
                        }
                      }
                    },
                    "comments": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Draft saved"
            }
          }
        }
      },
      "/employee/timesheets": {
        "get": {
          "tags": [
            "Timesheets"
          ],
          "summary": "List own timesheets",
          "description": "Returns paginated list of the authenticated employee's timesheets. Optionally filter by exact status.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string",
                "enum": [
                  "Draft",
                  "Submitted",
                  "Approved",
                  "Rejected"
                ]
              },
              "description": "Filter by exact status value"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated list of own timesheets"
            }
          }
        }
      },
      "/employee/timesheets/{id}": {
        "get": {
          "tags": [
            "Timesheets"
          ],
          "summary": "Get own timesheet by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Full timesheet detail with 7-day breakdown"
            },
            "404": {
              "description": "Not found or belongs to different employee"
            }
          }
        }
      },
      "/employee/timesheets/options": {
        "get": {
          "tags": [
            "Timesheets"
          ],
          "summary": "List active Activity and Contract options for the timesheet form",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "type",
              "schema": {
                "type": "string",
                "enum": [
                  "activity",
                  "contract"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Active options only"
            },
            "403": {
              "description": "BULLETIN_ACKNOWLEDGEMENT_REQUIRED when active unread bulletins remain"
            }
          }
        }
      },
      "/admin/timesheets": {
        "get": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "List timesheets with filters",
          "description": "Status filter modes:\n- `submitted` (default): shows Submitted + Rejected (pending review)\n- `approved`: shows Approved only\n- `draft`: shows Draft only\n- `all`: no filter\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by operative name"
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string",
                "enum": [
                  "submitted",
                  "approved",
                  "draft",
                  "all"
                ]
              },
              "description": "Status filter mode"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated timesheet list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "Create timesheet on behalf of employee",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "name",
                    "week",
                    "days"
                  ],
                  "properties": {
                    "name": {
                      "type": "string",
                      "description": "Operative name"
                    },
                    "ltrafficid": {
                      "type": "string"
                    },
                    "week": {
                      "type": "string",
                      "description": "Week commencing label"
                    },
                    "days": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "date": {
                            "type": "string"
                          },
                          "hours": {
                            "type": "string"
                          },
                          "location": {
                            "type": "string"
                          },
                          "activity": {
                            "type": "string"
                          },
                          "contract": {
                            "type": "string"
                          }
                        }
                      }
                    },
                    "comments": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Timesheet created"
            }
          }
        }
      },
      "/admin/timesheets/{id}": {
        "get": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "Get timesheet by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Full timesheet detail with 7-day breakdown"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "Delete a timesheet",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/timesheets/{id}/approve": {
        "post": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "Approve a timesheet",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Timesheet approved"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/timesheets/{id}/reject": {
        "post": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "Reject a timesheet",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Timesheet rejected"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/timesheets/options": {
        "get": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "List Activity and Contract options",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Timesheet options"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "Add an Activity or Contract option",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "type",
                    "name"
                  ],
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": [
                        "activity",
                        "contract"
                      ]
                    },
                    "name": {
                      "type": "string"
                    },
                    "sort_order": {
                      "type": "integer",
                      "default": 0
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Option created"
            }
          }
        }
      },
      "/admin/timesheets/options/{optionId}": {
        "put": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "Rename, reorder, activate or deactivate a timesheet option",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "optionId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Option updated"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Timesheets"
          ],
          "summary": "Deactivate a timesheet option",
          "description": "Historic timesheets are unchanged; this is a soft delete.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "optionId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            }
          }
        }
      },
      "/employee/tfl/materials": {
        "get": {
          "operationId": "employeeListTflMaterials",
          "tags": [
            "TFL"
          ],
          "summary": "List TFL materials",
          "description": "Returns paginated list of TFL materials. Filterable by status (prefix match).\n\n**Allowed roles:** Admin (1), Admin1 (4), Civils TFL Driver (5)\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string"
              },
              "description": "Filter by status (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated material list",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/TflMaterial"
                        }
                      },
                      "meta": {
                        "$ref": "#/components/schemas/PaginationMeta"
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            }
          }
        }
      },
      "/employee/tfl": {
        "get": {
          "operationId": "employeeListTfl",
          "tags": [
            "TFL"
          ],
          "summary": "List active TFL jobs",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns paginated list of active TFL jobs. Excludes Pending, Delayed, Completed, Cancelled, Awaiting Invoicing, Invoiced, Closed. Searchable by jobnumber and assignedto (prefix match). Sorted by startdate DESC.\n\n**Allowed roles:** Admin (1), Admin1 (4), Civils TFL Driver (5)\n",
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by jobnumber (prefix match)"
            },
            {
              "in": "query",
              "name": "assignedto",
              "schema": {
                "type": "string"
              },
              "description": "Filter by assignedto (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated active job list",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/TflJob"
                        }
                      },
                      "meta": {
                        "$ref": "#/components/schemas/PaginationMeta"
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/employee/tfl/{id}": {
        "get": {
          "operationId": "employeeGetTfl",
          "tags": [
            "TFL"
          ],
          "summary": "Get TFL job by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Job details"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/tfl/{id}/documents": {
        "get": {
          "operationId": "employeeListTflDocuments",
          "tags": [
            "TFL"
          ],
          "summary": "List documents for a TFL job",
          "description": "Returns paginated list of uploaded documents for a TFL job.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Job not found"
            }
          }
        }
      },
      "/admin/tfl/materials": {
        "get": {
          "operationId": "adminListTflMaterials",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "List TFL materials",
          "description": "Returns paginated list of TFL materials. Filterable by status (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string"
              },
              "description": "Filter by status (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated material list"
            }
          }
        },
        "post": {
          "operationId": "adminCreateTflMaterial",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Create TFL material",
          "description": "Creates a new TFL material entry.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "item",
                    "unitsremaining",
                    "location",
                    "status"
                  ],
                  "properties": {
                    "item": {
                      "type": "string"
                    },
                    "unitsremaining": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "In Stock",
                        "Low Stock",
                        "Out of Stock",
                        "On Order"
                      ]
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Material created"
            }
          }
        }
      },
      "/admin/tfl/materials/{id}": {
        "put": {
          "operationId": "adminUpdateTflMaterial",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Update TFL material",
          "description": "Updates an existing TFL material. All fields are optional.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "item": {
                      "type": "string"
                    },
                    "unitsremaining": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "In Stock",
                        "Low Stock",
                        "Out of Stock",
                        "On Order"
                      ]
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Material updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "operationId": "adminDeleteTflMaterial",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Delete TFL material",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/tfl": {
        "get": {
          "operationId": "adminListTfl",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "List all TFL jobs",
          "description": "Returns paginated list of all TFL jobs regardless of status. Searchable by jobnumber, assignedto, jobstatus, and permitstatus (prefix match). Sorted by startdate DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by jobnumber (prefix match)"
            },
            {
              "in": "query",
              "name": "assignedto",
              "schema": {
                "type": "string"
              },
              "description": "Filter by assignedto (prefix match)"
            },
            {
              "in": "query",
              "name": "jobstatus",
              "schema": {
                "type": "string"
              },
              "description": "Filter by jobstatus (prefix match)"
            },
            {
              "in": "query",
              "name": "permitstatus",
              "schema": {
                "type": "string"
              },
              "description": "Filter by permitstatus (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated job list"
            }
          }
        },
        "post": {
          "operationId": "adminCreateTfl",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Create TFL job",
          "description": "Creates a new TFL job.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "jobstatus",
                    "assignedto",
                    "customer",
                    "jobnumber",
                    "sitereference",
                    "location",
                    "postcode",
                    "area",
                    "workstream",
                    "permitstatus"
                  ],
                  "properties": {
                    "jobstatus": {
                      "type": "string"
                    },
                    "assignedto": {
                      "type": "string"
                    },
                    "customer": {
                      "type": "string"
                    },
                    "jobnumber": {
                      "type": "string"
                    },
                    "sitereference": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "postcode": {
                      "type": "string"
                    },
                    "area": {
                      "type": "string"
                    },
                    "workstream": {
                      "type": "string"
                    },
                    "permitstatus": {
                      "type": "string"
                    },
                    "startdate": {
                      "type": "string"
                    },
                    "enddate": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Job created"
            }
          }
        }
      },
      "/admin/tfl/{id}": {
        "get": {
          "operationId": "adminGetTfl",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Get TFL job by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Job details"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "operationId": "adminUpdateTfl",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Update TFL job",
          "description": "Updates an existing TFL job. All fields are optional.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "jobstatus": {
                      "type": "string"
                    },
                    "assignedto": {
                      "type": "string"
                    },
                    "customer": {
                      "type": "string"
                    },
                    "jobnumber": {
                      "type": "string"
                    },
                    "sitereference": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "postcode": {
                      "type": "string"
                    },
                    "area": {
                      "type": "string"
                    },
                    "workstream": {
                      "type": "string"
                    },
                    "permitstatus": {
                      "type": "string"
                    },
                    "startdate": {
                      "type": "string"
                    },
                    "enddate": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Job updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "operationId": "adminDeleteTfl",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Delete TFL job",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/tfl/{id}/documents": {
        "get": {
          "operationId": "adminListTflDocuments",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "List documents for a TFL job",
          "description": "Returns paginated list of uploaded documents for a job. Searchable by submittedby or arrival_datetime (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Job not found"
            }
          }
        },
        "post": {
          "operationId": "adminUploadTflDocument",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Upload document for a TFL job",
          "description": "Uploads a document associated with a TFL job. Send as multipart/form-data.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file",
                    "doctype",
                    "docdesc"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    },
                    "doctype": {
                      "type": "string"
                    },
                    "docdesc": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Job not found"
            }
          }
        }
      },
      "/admin/tfl/{id}/documents/{docId}": {
        "delete": {
          "operationId": "adminDeleteTflDocument",
          "tags": [
            "Admin - TFL"
          ],
          "summary": "Delete a TFL document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/site-inspections": {
        "post": {
          "tags": [
            "Site Inspections"
          ],
          "summary": "Create Part 1 of a site inspection",
          "description": "Creates a new site inspection (Part 1 — Site Information).\nRequires source query param and civilsId in body.\nAuto-populates site reference, location, client, ganger from the parent job.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "source",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "civils",
                  "wildanet"
                ]
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "civilsId"
                  ],
                  "properties": {
                    "civilsId": {
                      "type": "integer"
                    },
                    "in7": {
                      "type": "string",
                      "description": "Operatives on Site"
                    },
                    "in8": {
                      "type": "string",
                      "description": "Site Activities"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Part 1 created"
            },
            "404": {
              "description": "Parent job not found"
            }
          }
        },
        "get": {
          "tags": [
            "Site Inspections"
          ],
          "summary": "List own site inspections",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "source",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "civils",
                  "wildanet"
                ]
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Own inspections"
            }
          }
        }
      },
      "/employee/site-inspections/{id}/part/{partNum}": {
        "put": {
          "tags": [
            "Site Inspections"
          ],
          "summary": "Submit a part of the site inspection",
          "description": "Submit Parts 2-8. Part 8 sets status to \"Inspection Awaiting Review\".",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "partNum",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 2,
                "maximum": 8
              }
            },
            {
              "in": "query",
              "name": "source",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "civils",
                  "wildanet"
                ]
              }
            }
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Part submitted"
            },
            "404": {
              "description": "Inspection not found"
            }
          }
        }
      },
      "/employee/site-inspections/{id}": {
        "get": {
          "tags": [
            "Site Inspections"
          ],
          "summary": "Get own site inspection by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "source",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "civils",
                  "wildanet"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Inspection detail"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/site-inspections": {
        "get": {
          "tags": [
            "Admin - Site Inspections"
          ],
          "summary": "List site inspections",
          "description": "Returns paginated list of site inspections. Requires source query param (civils or wildanet). Optional status filter (live or completed).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "source",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "civils",
                  "wildanet"
                ]
              }
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string",
                "enum": [
                  "live",
                  "completed"
                ]
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by Site Ganger (in6) prefix match"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated inspection list"
            }
          }
        }
      },
      "/admin/site-inspections/{id}": {
        "get": {
          "tags": [
            "Admin - Site Inspections"
          ],
          "summary": "Get site inspection by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "source",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "civils",
                  "wildanet"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Full inspection detail with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Site Inspections"
          ],
          "summary": "Update site inspection",
          "description": "Update any fields including status. Admin and supervisors only.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "source",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "civils",
                  "wildanet"
                ]
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string",
                      "enum": [
                        "In Progress",
                        "Inspection Awaiting Review",
                        "Pass",
                        "Completed",
                        "Failed",
                        "Follow up Required"
                      ]
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated inspection"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Site Inspections"
          ],
          "summary": "Delete site inspection",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "source",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "civils",
                  "wildanet"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/plant-register": {
        "get": {
          "tags": [
            "Admin - Plant Register"
          ],
          "summary": "List plant register entries",
          "description": "Returns paginated plant register list. Searchable by item name or identification number (prefix match). Sorted by expiry ASC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by item name or ident (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated plant register list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Plant Register"
          ],
          "summary": "Create plant register entry",
          "description": "Adds a new entry to the plant register.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "item",
                    "ident",
                    "allocatedto",
                    "date",
                    "cond"
                  ],
                  "properties": {
                    "item": {
                      "type": "string",
                      "description": "Plant item name"
                    },
                    "description": {
                      "type": "string"
                    },
                    "ident": {
                      "type": "string",
                      "description": "Identification / serial number"
                    },
                    "allocatedto": {
                      "type": "string",
                      "description": "Person plant is allocated to"
                    },
                    "date": {
                      "type": "string",
                      "description": "Allocation date"
                    },
                    "cond": {
                      "type": "string",
                      "description": "Condition"
                    },
                    "expiry": {
                      "type": "string",
                      "description": "Service/calibration expiry date"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Plant entry created"
            }
          }
        }
      },
      "/admin/plant-register/{id}": {
        "get": {
          "tags": [
            "Admin - Plant Register"
          ],
          "summary": "Get plant register entry by ID",
          "description": "Returns full plant register entry details.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Plant register entry details"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Plant Register"
          ],
          "summary": "Update plant register entry",
          "description": "Updates an existing plant register entry. All fields are optional — only provided fields are updated.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "item": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    },
                    "ident": {
                      "type": "string"
                    },
                    "allocatedto": {
                      "type": "string"
                    },
                    "date": {
                      "type": "string"
                    },
                    "cond": {
                      "type": "string"
                    },
                    "expiry": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Plant entry updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Plant Register"
          ],
          "summary": "Delete plant register entry",
          "description": "Permanently deletes a plant register entry.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/plant-register/{id}/documents": {
        "get": {
          "tags": [
            "Admin - Plant Register"
          ],
          "summary": "List documents for a plant register entry",
          "description": "Returns paginated list of uploaded documents for a specific plant register entry. Searchable by submittedby or arrival_datetime (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by submittedby or upload datetime (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Plant register entry not found"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Plant Register"
          ],
          "summary": "Upload a document for a plant register entry",
          "description": "Uploads a document (image, PDF, or office file) associated with a plant register entry.\nSend as multipart/form-data with field name \"file\" for the uploaded file.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file",
                    "doctype",
                    "docdesc"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    },
                    "doctype": {
                      "type": "string",
                      "enum": [
                        "Condition Image",
                        "Service / Calibration Expiry",
                        "Other"
                      ]
                    },
                    "docdesc": {
                      "type": "string",
                      "description": "Document description"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Plant register entry not found"
            },
            "415": {
              "description": "Unsupported file type"
            }
          }
        }
      },
      "/admin/plant-register/{id}/documents/{docId}": {
        "delete": {
          "tags": [
            "Admin - Plant Register"
          ],
          "summary": "Delete a document",
          "description": "Permanently deletes an uploaded document from the plant register entry.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/pia-fibre-risk/wah": {
        "get": {
          "tags": [
            "PIA & Fibre Risk"
          ],
          "summary": "List Working at Height records",
          "description": "Returns paginated list of WAH records. Searchable by wah1 (Operative Name) prefix match. Sorted by id DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by Operative Name (wah1) prefix match"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated WAH list"
            }
          }
        },
        "post": {
          "tags": [
            "PIA & Fibre Risk"
          ],
          "summary": "Create Working at Height record",
          "description": "Creates a new WAH record with image uploads. Operative Name (wah1) and Date/Time (wah3) are auto-populated.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "wah2",
                    "wah4",
                    "pn",
                    "snt",
                    "sn",
                    "wah5",
                    "wah6",
                    "wah7",
                    "wah8",
                    "wah9",
                    "wah10",
                    "wah11",
                    "wah12",
                    "wah13"
                  ],
                  "properties": {
                    "wah2": {
                      "type": "string",
                      "description": "Job Location"
                    },
                    "wah4": {
                      "type": "string",
                      "description": "Cabinet Area"
                    },
                    "pn": {
                      "type": "string",
                      "description": "Primary Node Number"
                    },
                    "snt": {
                      "type": "string",
                      "description": "SN Type"
                    },
                    "sn": {
                      "type": "string",
                      "description": "Secondary Node Number"
                    },
                    "wah5": {
                      "type": "string",
                      "description": "Ladder Inspection in Date (Yes/No)"
                    },
                    "wah6": {
                      "type": "string",
                      "description": "Ladder ID"
                    },
                    "wah7": {
                      "type": "string",
                      "description": "Ladders Good Condition (Yes/No)"
                    },
                    "wah8": {
                      "type": "string",
                      "description": "Harness/Lanyard Condition (Yes/No)"
                    },
                    "wah9": {
                      "type": "string",
                      "description": "PPE Condition (Yes/No)"
                    },
                    "wah10": {
                      "type": "string",
                      "description": "Pole safe to climb (Safe/Unsafe)"
                    },
                    "wah11": {
                      "type": "string",
                      "description": "Work area safe (Yes/No)"
                    },
                    "wah12": {
                      "type": "string",
                      "description": "Ladders secured (Yes/No)"
                    },
                    "wah13": {
                      "type": "string",
                      "description": "Lone Working (Yes/No)"
                    },
                    "wah14": {
                      "type": "string",
                      "description": "Notes/Defects"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "WAH record created"
            }
          }
        }
      },
      "/employee/pia-fibre-risk/ug": {
        "get": {
          "tags": [
            "PIA & Fibre Risk"
          ],
          "summary": "List Underground Works records",
          "description": "Returns paginated list of UG records. Searchable by ug1 (Operative Name) prefix match. Sorted by id DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by Operative Name (ug1) prefix match"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated UG list"
            }
          }
        },
        "post": {
          "tags": [
            "PIA & Fibre Risk"
          ],
          "summary": "Create Underground Works record",
          "description": "Creates a new UG record with image uploads. Operative Name (ug1) and Date/Time (ug3) are auto-populated.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "ug2",
                    "ug4",
                    "pn",
                    "snt",
                    "sn",
                    "ug5",
                    "ug6",
                    "ug7",
                    "ug8",
                    "ug9",
                    "ug10",
                    "ug11",
                    "ug12"
                  ],
                  "properties": {
                    "ug2": {
                      "type": "string",
                      "description": "Job Location"
                    },
                    "ug4": {
                      "type": "string",
                      "description": "Cabinet Area"
                    },
                    "pn": {
                      "type": "string",
                      "description": "Primary Node Number"
                    },
                    "snt": {
                      "type": "string",
                      "description": "SN Type"
                    },
                    "sn": {
                      "type": "string",
                      "description": "Secondary Node Number"
                    },
                    "ug5": {
                      "type": "string",
                      "description": "Barriers/Gate Guards (Yes/No)"
                    },
                    "ug6": {
                      "type": "string",
                      "description": "Sandbags available (Yes/No)"
                    },
                    "ug7": {
                      "type": "string",
                      "description": "Gas Monitor (Yes/No)"
                    },
                    "ug8": {
                      "type": "string",
                      "description": "PPE Condition (Yes/No)"
                    },
                    "ug9": {
                      "type": "string",
                      "description": "Weather suitable (Yes/No)"
                    },
                    "ug10": {
                      "type": "string",
                      "description": "Safe working area (Yes/No)"
                    },
                    "ug11": {
                      "type": "string",
                      "description": "Correct equipment (Yes/No)"
                    },
                    "ug12": {
                      "type": "string",
                      "description": "Confirm Safe Site (Safe/Unsafe)"
                    },
                    "ug13": {
                      "type": "string",
                      "description": "Notes/Defects"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "UG record created"
            }
          }
        }
      },
      "/employee/pia-fibre-risk/mewp": {
        "get": {
          "tags": [
            "PIA & Fibre Risk"
          ],
          "summary": "List MEWP Works records",
          "description": "Returns paginated list of MEWP records. Searchable by mewp1 (Operative Name) prefix match. Sorted by id DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by Operative Name (mewp1) prefix match"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated MEWP list"
            }
          }
        },
        "post": {
          "tags": [
            "PIA & Fibre Risk"
          ],
          "summary": "Create MEWP Works record",
          "description": "Creates a new MEWP record with image uploads. Operative Name (mewp1) and Date/Time (mewp3) are auto-populated.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "mewp2",
                    "mewp4",
                    "pn",
                    "snt",
                    "sn",
                    "mewp5",
                    "mewp6",
                    "mewp7",
                    "mewp8",
                    "mewp9",
                    "mewp10",
                    "mewp11",
                    "mewp12",
                    "mewp13"
                  ],
                  "properties": {
                    "mewp2": {
                      "type": "string",
                      "description": "Job Location"
                    },
                    "mewp4": {
                      "type": "string",
                      "description": "Cabinet Area"
                    },
                    "pn": {
                      "type": "string",
                      "description": "Primary Node Number"
                    },
                    "snt": {
                      "type": "string",
                      "description": "SN Type"
                    },
                    "sn": {
                      "type": "string",
                      "description": "Secondary Node Number"
                    },
                    "mewp5": {
                      "type": "string",
                      "description": "LOLER Inspection in Date (Yes/No)"
                    },
                    "mewp6": {
                      "type": "string",
                      "description": "MEWP Registration"
                    },
                    "mewp7": {
                      "type": "string",
                      "description": "MEWP Good Condition (Yes/No)"
                    },
                    "mewp8": {
                      "type": "string",
                      "description": "Harness/Lanyard (Yes/No)"
                    },
                    "mewp9": {
                      "type": "string",
                      "description": "PPE Condition (Yes/No)"
                    },
                    "mewp10": {
                      "type": "string",
                      "description": "Pole safe (Safe/Unsafe)"
                    },
                    "mewp11": {
                      "type": "string",
                      "description": "Work area safe (Yes/No)"
                    },
                    "mewp12": {
                      "type": "string",
                      "description": "MEWP Stabilised (Yes/No)"
                    },
                    "mewp13": {
                      "type": "string",
                      "description": "Not lone working (Confirm/No)"
                    },
                    "mewp14": {
                      "type": "string",
                      "description": "Notes/Defects"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "MEWP record created"
            }
          }
        }
      },
      "/admin/pia-fibre-risk/wah/{id}": {
        "delete": {
          "tags": [
            "Admin - PIA & Fibre Risk"
          ],
          "summary": "Delete Working at Height record",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/pia-fibre-risk/ug/{id}": {
        "delete": {
          "tags": [
            "Admin - PIA & Fibre Risk"
          ],
          "summary": "Delete Underground Works record",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/pia-fibre-risk/mewp/{id}": {
        "delete": {
          "tags": [
            "Admin - PIA & Fibre Risk"
          ],
          "summary": "Delete MEWP Works record",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/onboarding/status": {
        "get": {
          "tags": [
            "Onboarding"
          ],
          "summary": "Get onboarding status",
          "description": "Returns whether the authenticated user has completed onboarding.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Onboarding status",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean"
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "completed": {
                            "type": "boolean"
                          },
                          "ltrafficid": {
                            "type": "string",
                            "nullable": true
                          },
                          "name": {
                            "type": "string",
                            "nullable": true
                          },
                          "name1": {
                            "type": "string",
                            "nullable": true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/employee/onboarding": {
        "post": {
          "tags": [
            "Onboarding"
          ],
          "summary": "Submit onboarding form",
          "description": "Submits the employee onboarding (HR record). Inserts into the hr table and\nmarks login_users.onboarding = '1'. Photo and signature paths are generated\nautomatically from the user's name1 field (matching PHP behavior).\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "firstname",
                    "surname",
                    "dob",
                    "address",
                    "telephone",
                    "email",
                    "nationality",
                    "contactname1",
                    "contacttelephone1",
                    "relation1",
                    "startdate",
                    "ninumber"
                  ],
                  "properties": {
                    "firstname": {
                      "type": "string"
                    },
                    "middlename": {
                      "type": "string"
                    },
                    "surname": {
                      "type": "string"
                    },
                    "dob": {
                      "type": "string"
                    },
                    "address": {
                      "type": "string"
                    },
                    "telephone": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "nationality": {
                      "type": "string"
                    },
                    "contactname1": {
                      "type": "string"
                    },
                    "contacttelephone1": {
                      "type": "string"
                    },
                    "relation1": {
                      "type": "string"
                    },
                    "contactname2": {
                      "type": "string"
                    },
                    "contacttelephone2": {
                      "type": "string"
                    },
                    "relation2": {
                      "type": "string"
                    },
                    "startdate": {
                      "type": "string"
                    },
                    "cis": {
                      "type": "string"
                    },
                    "ninumber": {
                      "type": "string"
                    },
                    "confirm": {
                      "type": "string"
                    },
                    "date_signed": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Onboarding completed"
            },
            "404": {
              "description": "User not found"
            }
          }
        },
        "get": {
          "tags": [
            "Onboarding"
          ],
          "summary": "Get own onboarding record",
          "description": "Returns the authenticated user's HR record created during onboarding.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "HR record"
            },
            "404": {
              "description": "No onboarding record found"
            }
          }
        }
      },
      "/notifications": {
        "get": {
          "tags": [
            "Notifications"
          ],
          "summary": "List the authenticated user's notification inbox",
          "description": "Returns only notifications belonging to the authenticated user,\nnewest first. Every item includes `is_read` and `read_at`. The\npagination metadata also includes the user's total unread count.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "unread",
              "description": "Return only unread (`true`) or only read (`false`) notifications.",
              "schema": {
                "type": "boolean"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Notification inbox with read state.",
              "content": {
                "application/json": {
                  "example": {
                    "success": true,
                    "data": [
                      {
                        "id": 12,
                        "type": "BULLETIN_PUBLISHED",
                        "title": "New bulletin",
                        "body": "Please review the latest bulletin.",
                        "data": {
                          "bulletinId": 32,
                          "action": "open_bulletin"
                        },
                        "sent_at": "2026-08-22T10:00:00.000Z",
                        "read_at": null,
                        "is_read": false
                      }
                    ],
                    "meta": {
                      "page": 1,
                      "limit": 20,
                      "total": 1,
                      "unread_count": 1
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            }
          }
        }
      },
      "/notifications/read-all": {
        "patch": {
          "tags": [
            "Notifications"
          ],
          "summary": "Mark all notifications as read",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Number of notifications marked as read.",
              "content": {
                "application/json": {
                  "example": {
                    "success": true,
                    "data": {
                      "updated": 3
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            }
          }
        }
      },
      "/notifications/{id}/read": {
        "patch": {
          "tags": [
            "Notifications"
          ],
          "summary": "Mark one owned notification as read",
          "description": "Idempotent. A notification owned by another user is not exposed.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 1
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Updated notification with read state."
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "404": {
              "$ref": "#/components/responses/NotFound404"
            }
          }
        }
      },
      "/admin/notifications/preferences": {
        "get": {
          "tags": [
            "Admin - Notifications"
          ],
          "summary": "List submission notification settings",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Notification preferences"
            }
          }
        }
      },
      "/admin/notifications/preferences/{eventType}": {
        "put": {
          "tags": [
            "Admin - Notifications"
          ],
          "summary": "Set Admin and Manager submission alerts on or off",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "eventType",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "TIMESHEET_SUBMITTED",
                  "INCIDENT_REPORTED",
                  "VEHICLE_CHECK_SUBMITTED"
                ]
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "notify_admin",
                    "notify_manager"
                  ],
                  "properties": {
                    "notify_admin": {
                      "type": "boolean"
                    },
                    "notify_manager": {
                      "type": "boolean"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Preference updated"
            }
          }
        }
      },
      "/admin/notifications/test-push": {
        "post": {
          "tags": [
            "Admin - Notifications"
          ],
          "summary": "Send a test push to the authenticated Admin's devices",
          "description": "Register the mobile device first with `POST /devices/register`. This\nendpoint sends only to active device tokens owned by the authenticated\nAdmin, so it cannot be used to target another user's device. It does\nnot create a bulletin or submission notification inbox item.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string",
                      "maxLength": 120,
                      "default": "LTraffic push test"
                    },
                    "body": {
                      "type": "string",
                      "maxLength": 500,
                      "default": "Push notification test from LTraffic API."
                    },
                    "data": {
                      "type": "object",
                      "additionalProperties": {
                        "oneOf": [
                          {
                            "type": "string"
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "boolean"
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Provider result. `status` is sent, failed, or disabled."
            },
            "403": {
              "description": "Admin level 1 is required."
            },
            "404": {
              "description": "No active device token is registered for this Admin."
            }
          }
        }
      },
      "/employee/incidents": {
        "post": {
          "tags": [
            "Incidents"
          ],
          "summary": "Report an incident",
          "description": "Submit a new H&S incident report. Operative name and reported-by are set from JWT. Optional image or supporting document uploads are accepted (PHP-compatible formats).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "type",
                    "location",
                    "report"
                  ],
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": [
                        "Accident",
                        "Customer Complaint",
                        "Customer Engagement",
                        "Environmental",
                        "Incident",
                        "Near Miss",
                        "Service Strike"
                      ]
                    },
                    "location": {
                      "type": "string"
                    },
                    "report": {
                      "type": "string",
                      "description": "What happened"
                    },
                    "involved": {
                      "type": "string"
                    },
                    "anyoneinjured": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "No"
                    },
                    "whowasinjured": {
                      "type": "string"
                    },
                    "injuryreport": {
                      "type": "string"
                    },
                    "reportit": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ]
                    },
                    "advise": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ]
                    },
                    "laterdate": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ]
                    },
                    "companydetails": {
                      "type": "string"
                    },
                    "witness": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "No"
                    },
                    "witnessname": {
                      "type": "string"
                    },
                    "witnessaddress": {
                      "type": "string"
                    },
                    "witnesscontact": {
                      "type": "string"
                    },
                    "otherwitness": {
                      "type": "string"
                    },
                    "image": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      },
                      "description": "Up to 10 supporting images or documents (JPEG, PNG, GIF, BMP, WebP, PDF, DOC, PPT, ZIP, XLSX, DOCX)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Incident reported"
            }
          }
        },
        "get": {
          "tags": [
            "Incidents"
          ],
          "summary": "List own incidents",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated list of own incidents"
            }
          }
        }
      },
      "/employee/incidents/{id}": {
        "get": {
          "tags": [
            "Incidents"
          ],
          "summary": "Get own incident by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Incident detail"
            },
            "404": {
              "description": "Not found or belongs to different operative"
            }
          }
        }
      },
      "/admin/incidents": {
        "get": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "List incidents with filters",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by operative name"
            },
            {
              "in": "query",
              "name": "searchDate",
              "schema": {
                "type": "string"
              },
              "description": "Filter by date prefix"
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string",
                "enum": [
                  "open",
                  "closed",
                  "all"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated incident list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "Create incident (admin)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "operativesname",
                    "arrival_datetime",
                    "type",
                    "location",
                    "reportedby",
                    "report"
                  ],
                  "properties": {
                    "operativesname": {
                      "type": "string"
                    },
                    "arrival_datetime": {
                      "type": "string"
                    },
                    "type": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "reportedby": {
                      "type": "string"
                    },
                    "report": {
                      "type": "string"
                    },
                    "involved": {
                      "type": "string"
                    },
                    "anyoneinjured": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "No"
                    },
                    "whowasinjured": {
                      "type": "string"
                    },
                    "injuryreport": {
                      "type": "string"
                    },
                    "reportit": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ]
                    },
                    "advise": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ]
                    },
                    "laterdate": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ]
                    },
                    "companydetails": {
                      "type": "string"
                    },
                    "witness": {
                      "type": "string",
                      "enum": [
                        "Yes",
                        "No"
                      ],
                      "default": "No"
                    },
                    "witnessname": {
                      "type": "string"
                    },
                    "witnessaddress": {
                      "type": "string"
                    },
                    "witnesscontact": {
                      "type": "string"
                    },
                    "otherwitness": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "Open",
                        "Closed"
                      ],
                      "default": "Open"
                    },
                    "image": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      },
                      "description": "Up to 10 supporting images or documents"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Incident created"
            }
          }
        }
      },
      "/admin/incidents/{id}": {
        "get": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "Get incident by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Full incident detail"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "Update incident",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "operativesname": {
                      "type": "string"
                    },
                    "type": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "Open",
                        "Closed"
                      ]
                    },
                    "notes": {
                      "type": "string"
                    },
                    "report": {
                      "type": "string"
                    },
                    "injury": {
                      "type": "object",
                      "description": "Optional grouped form matching the GET detail response.",
                      "properties": {
                        "anyoneinjured": {
                          "type": "string",
                          "enum": [
                            "Yes",
                            "No"
                          ]
                        },
                        "whowasinjured": {
                          "type": "string",
                          "nullable": true
                        },
                        "injuryreport": {
                          "type": "string",
                          "nullable": true
                        }
                      }
                    },
                    "reporting": {
                      "type": "object",
                      "properties": {
                        "reportit": {
                          "type": "string",
                          "enum": [
                            "Yes",
                            "No"
                          ],
                          "nullable": true
                        },
                        "advise": {
                          "type": "string",
                          "enum": [
                            "Yes",
                            "No"
                          ],
                          "nullable": true
                        },
                        "laterdate": {
                          "type": "string",
                          "enum": [
                            "Yes",
                            "No"
                          ],
                          "nullable": true
                        },
                        "companydetails": {
                          "type": "string",
                          "nullable": true
                        }
                      }
                    },
                    "witnesses": {
                      "type": "object",
                      "properties": {
                        "witness": {
                          "type": "string",
                          "enum": [
                            "Yes",
                            "No"
                          ]
                        },
                        "witnessname": {
                          "type": "string",
                          "nullable": true
                        },
                        "witnessaddress": {
                          "type": "string",
                          "nullable": true
                        },
                        "witnesscontact": {
                          "type": "string",
                          "nullable": true
                        },
                        "otherwitness": {
                          "type": "string",
                          "nullable": true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Incident updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "Delete incident",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/incidents/{id}/status": {
        "post": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "Change incident status (Open/Closed)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "status"
                  ],
                  "properties": {
                    "status": {
                      "type": "string",
                      "enum": [
                        "Open",
                        "Closed"
                      ]
                    },
                    "notes": {
                      "type": "string",
                      "description": "Investigation notes"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Status updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/incidents/{id}/documents": {
        "get": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "List documents for an incident",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Document list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "Upload document for an incident",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary",
                      "description": "JPEG, PNG, GIF, BMP, WebP, PDF, DOC, PPT, or DOCX"
                    },
                    "image": {
                      "type": "string",
                      "format": "binary",
                      "description": "Legacy PHP field alias for file"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            }
          }
        }
      },
      "/admin/incidents/{id}/documents/{docId}": {
        "delete": {
          "tags": [
            "Admin - Incidents"
          ],
          "summary": "Delete a document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            }
          }
        }
      },
      "/admin/hr": {
        "get": {
          "tags": [
            "Admin - HR"
          ],
          "summary": "List employees",
          "description": "Returns paginated employee list. Searchable by first name or surname (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by first name or surname (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated employee list"
            }
          }
        }
      },
      "/admin/hr/{id}": {
        "get": {
          "tags": [
            "Admin - HR"
          ],
          "summary": "Get employee by ID",
          "description": "Returns full employee record including personal details, emergency contacts, and file URLs.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Full employee detail"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - HR"
          ],
          "summary": "Update employee",
          "description": "Update any employee fields. All fields are optional — only provided fields are updated.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "firstname": {
                      "type": "string"
                    },
                    "surname": {
                      "type": "string"
                    },
                    "jobtitle": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "linemanager": {
                      "type": "string"
                    },
                    "ltrafficemail": {
                      "type": "string"
                    },
                    "ltrafficphone": {
                      "type": "string"
                    },
                    "salary": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Employee updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - HR"
          ],
          "summary": "Delete employee",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/hr/{id}/documents": {
        "get": {
          "tags": [
            "Admin - HR"
          ],
          "summary": "List HR documents for an employee",
          "description": "Returns paginated list of uploaded HR documents (licences, PPE, contracts, etc.)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by uploader name (prefix)"
            },
            {
              "in": "query",
              "name": "searchDate",
              "schema": {
                "type": "string"
              },
              "description": "Search by upload date (prefix)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Employee not found"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - HR"
          ],
          "summary": "Upload HR document",
          "description": "Upload a document for an employee's HR file.\nDocument types: Driver Eyesight Check, Driving Licence, Driving Licence Check, Ladder Inspection, Medical Check, Passport, PPE Issue, Service Contract, Toolbox Talk, Other.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file",
                    "doctype",
                    "docdesc"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    },
                    "doctype": {
                      "type": "string",
                      "enum": [
                        "Driver Eyesight Check",
                        "Driving Licence",
                        "Driving Licence Check",
                        "Ladder Inspection",
                        "Medical Check",
                        "Passport",
                        "PPE Issue",
                        "Service Contract",
                        "Toolbox Talk",
                        "Other"
                      ]
                    },
                    "docdesc": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Employee not found"
            }
          }
        }
      },
      "/admin/hr/{id}/documents/{docId}": {
        "delete": {
          "tags": [
            "Admin - HR"
          ],
          "summary": "Delete HR document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/equipment-register": {
        "get": {
          "tags": [
            "Admin - Equipment Register"
          ],
          "summary": "List equipment register entries",
          "description": "Returns paginated equipment register list. Searchable by item name or identification number (prefix match). Sorted by ident ASC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by item name or ident (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated equipment register list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Equipment Register"
          ],
          "summary": "Create equipment register entry",
          "description": "Adds a new entry to the equipment register.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "item",
                    "ident",
                    "allocatedto",
                    "date",
                    "cond"
                  ],
                  "properties": {
                    "item": {
                      "type": "string",
                      "description": "Equipment item name"
                    },
                    "description": {
                      "type": "string"
                    },
                    "ident": {
                      "type": "string",
                      "description": "Identification / serial number"
                    },
                    "allocatedto": {
                      "type": "string",
                      "description": "Person equipment is allocated to"
                    },
                    "date": {
                      "type": "string",
                      "description": "Allocation date"
                    },
                    "cond": {
                      "type": "string",
                      "description": "Condition"
                    },
                    "expiry": {
                      "type": "string",
                      "description": "Service/calibration expiry date"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Equipment entry created"
            }
          }
        }
      },
      "/admin/equipment-register/{id}": {
        "get": {
          "tags": [
            "Admin - Equipment Register"
          ],
          "summary": "Get equipment register entry by ID",
          "description": "Returns full equipment register entry details.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Equipment register entry details"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Equipment Register"
          ],
          "summary": "Update equipment register entry",
          "description": "Updates an existing equipment register entry. All fields are optional — only provided fields are updated.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "item": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    },
                    "ident": {
                      "type": "string"
                    },
                    "allocatedto": {
                      "type": "string"
                    },
                    "date": {
                      "type": "string"
                    },
                    "cond": {
                      "type": "string"
                    },
                    "expiry": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Equipment entry updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Equipment Register"
          ],
          "summary": "Delete equipment register entry",
          "description": "Permanently deletes an equipment register entry.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/equipment-register/{id}/documents": {
        "get": {
          "tags": [
            "Admin - Equipment Register"
          ],
          "summary": "List documents for an equipment register entry",
          "description": "Returns paginated list of uploaded documents for a specific equipment register entry. Searchable by submittedby or arrival_datetime (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by submittedby or upload datetime (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Equipment register entry not found"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Equipment Register"
          ],
          "summary": "Upload a document for an equipment register entry",
          "description": "Uploads a document (image, PDF, or office file) associated with an equipment register entry.\nSend as multipart/form-data with field name \"file\" for the uploaded file.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file",
                    "doctype",
                    "docdesc"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    },
                    "doctype": {
                      "type": "string",
                      "enum": [
                        "Condition Image",
                        "Service / Calibration Expiry",
                        "Other"
                      ]
                    },
                    "docdesc": {
                      "type": "string",
                      "description": "Document description"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Equipment register entry not found"
            },
            "415": {
              "description": "Unsupported file type"
            }
          }
        }
      },
      "/admin/equipment-register/{id}/documents/{docId}": {
        "delete": {
          "tags": [
            "Admin - Equipment Register"
          ],
          "summary": "Delete a document",
          "description": "Permanently deletes an uploaded document from the equipment register entry.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/equipment-checks": {
        "post": {
          "tags": [
            "Equipment Checks"
          ],
          "summary": "Submit a new equipment check",
          "description": "Submits a PUWER equipment/plant inspection check. At least one image is required.\nSend as multipart/form-data with field name \"images\" for uploaded files (max 4).\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "description",
                    "ident",
                    "images"
                  ],
                  "properties": {
                    "description": {
                      "type": "string",
                      "description": "Description of Equipment / Plant"
                    },
                    "ident": {
                      "type": "string",
                      "description": "Identification / Serial Number"
                    },
                    "brakes": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "steering": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "seatbelt": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "mirrors": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "tyres": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "wheelsecurity": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "rotatingbeacon": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "horn": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "warninglights": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "coolant": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "seat": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "access": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "fuel": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ],
                      "default": "Pass"
                    },
                    "cond": {
                      "type": "string",
                      "enum": [
                        "Good",
                        "Average",
                        "Poor",
                        "Very Poor",
                        "Dangerous"
                      ],
                      "default": "Good"
                    },
                    "safe": {
                      "type": "string",
                      "enum": [
                        "Safe",
                        "Unsafe"
                      ],
                      "default": "Safe"
                    },
                    "report": {
                      "type": "string",
                      "description": "Defects / damage details"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      },
                      "description": "Equipment images (1-4 files required)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Equipment check submitted"
            },
            "400": {
              "description": "Validation error or no images"
            }
          }
        },
        "get": {
          "tags": [
            "Equipment Checks"
          ],
          "summary": "List own equipment checks",
          "description": "Returns paginated list of equipment checks submitted by the authenticated user. Searchable by date (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by date (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated list of own equipment checks"
            }
          }
        }
      },
      "/employee/equipment-checks/{id}": {
        "get": {
          "tags": [
            "Equipment Checks"
          ],
          "summary": "Get own equipment check by ID",
          "description": "Returns detail of a specific equipment check owned by the authenticated user.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Equipment check detail"
            },
            "404": {
              "description": "Not found or belongs to different user"
            }
          }
        }
      },
      "/admin/equipment-checks": {
        "get": {
          "tags": [
            "Admin - Equipment Checks"
          ],
          "summary": "List all equipment checks",
          "description": "Returns paginated list of all equipment checks. Searchable by operative name (prefix match). Sorted by newest first.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by operative name (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated equipment check list"
            }
          }
        }
      },
      "/admin/equipment-checks/{id}": {
        "get": {
          "tags": [
            "Admin - Equipment Checks"
          ],
          "summary": "Get equipment check by ID",
          "description": "Returns full equipment check details including image URLs.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Equipment check details"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Equipment Checks"
          ],
          "summary": "Update equipment check",
          "description": "Updates an existing equipment check. All fields optional — only provided fields are updated. Admin only.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "operativesname": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    },
                    "ident": {
                      "type": "string"
                    },
                    "brakes": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "steering": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "seatbelt": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "mirrors": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "tyres": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "wheelsecurity": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "rotatingbeacon": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "horn": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "warninglights": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "coolant": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "seat": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "access": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "fuel": {
                      "type": "string",
                      "enum": [
                        "Pass",
                        "Fail"
                      ]
                    },
                    "cond": {
                      "type": "string",
                      "enum": [
                        "Good",
                        "Average",
                        "Poor",
                        "Very Poor",
                        "Dangerous"
                      ]
                    },
                    "safe": {
                      "type": "string",
                      "enum": [
                        "Safe",
                        "Unsafe"
                      ]
                    },
                    "report": {
                      "type": "string"
                    },
                    "image": {
                      "type": "string",
                      "description": "Comma-separated image paths"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Equipment check updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Equipment Checks"
          ],
          "summary": "Delete equipment check",
          "description": "Permanently deletes an equipment check. Admin only.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/equipment-checks/{id}/documents": {
        "get": {
          "tags": [
            "Admin - Equipment Checks"
          ],
          "summary": "List documents for an equipment check",
          "description": "Returns paginated list of supplemental documents uploaded for a specific equipment check.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by submittedby or datetime (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Equipment check not found"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Equipment Checks"
          ],
          "summary": "Upload a supplemental document",
          "description": "Uploads a supplemental document (Site Image) for an equipment check.\nSend as multipart/form-data with field name \"file\".\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file",
                    "docdesc"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    },
                    "docdesc": {
                      "type": "string",
                      "description": "Document description"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Equipment check not found"
            },
            "415": {
              "description": "Unsupported file type"
            }
          }
        }
      },
      "/admin/equipment-checks/{id}/documents/{docId}": {
        "delete": {
          "tags": [
            "Admin - Equipment Checks"
          ],
          "summary": "Delete a document",
          "description": "Permanently deletes an uploaded document. Admin only.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/documents/{type}": {
        "get": {
          "tags": [
            "Documents"
          ],
          "summary": "List documents by type",
          "description": "Returns paginated document list. Types are policies, method-statements, processes, coshh.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "type",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "policies",
                  "method-statements",
                  "processes",
                  "coshh"
                ]
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 40
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by reference or title (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            }
          }
        }
      },
      "/employee/documents/{type}/{id}": {
        "get": {
          "tags": [
            "Documents"
          ],
          "summary": "Get document by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "type",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "policies",
                  "method-statements",
                  "processes",
                  "coshh"
                ]
              }
            },
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Document detail"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/documents/{type}": {
        "get": {
          "tags": [
            "Admin - Documents"
          ],
          "summary": "List documents by type",
          "description": "Returns paginated document list. Types are policies, method-statements, processes, coshh.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "type",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "policies",
                  "method-statements",
                  "processes",
                  "coshh"
                ]
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 40
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by reference or title (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Documents"
          ],
          "summary": "Create document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "type",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "policies",
                  "method-statements",
                  "processes",
                  "coshh"
                ]
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "reference",
                    "title",
                    "version"
                  ],
                  "properties": {
                    "reference": {
                      "type": "string",
                      "description": "Document Reference"
                    },
                    "title": {
                      "type": "string",
                      "description": "Policy Title"
                    },
                    "version": {
                      "type": "string",
                      "description": "Document Issue / Version"
                    },
                    "pol1": {
                      "type": "string",
                      "description": "Legacy alias for reference (also ms1/pro1/cos1 by document type)"
                    },
                    "pol2": {
                      "type": "string",
                      "description": "Legacy alias for title (also ms2/pro2/cos2 by document type)"
                    },
                    "pol3": {
                      "type": "string",
                      "description": "Legacy alias for version (also ms3/pro3/cos3 by document type)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document created"
            }
          }
        }
      },
      "/admin/documents/{type}/{id}": {
        "get": {
          "tags": [
            "Admin - Documents"
          ],
          "summary": "Get document by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "type",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "policies",
                  "method-statements",
                  "processes",
                  "coshh"
                ]
              }
            },
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Document detail"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Documents"
          ],
          "summary": "Update document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "type",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "policies",
                  "method-statements",
                  "processes",
                  "coshh"
                ]
              }
            },
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "reference": {
                      "type": "string"
                    },
                    "title": {
                      "type": "string"
                    },
                    "version": {
                      "type": "string"
                    },
                    "pol1": {
                      "type": "string",
                      "description": "Legacy alias for reference"
                    },
                    "pol2": {
                      "type": "string",
                      "description": "Legacy alias for title"
                    },
                    "pol3": {
                      "type": "string",
                      "description": "Legacy alias for version"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Document updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Documents"
          ],
          "summary": "Delete document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "type",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "policies",
                  "method-statements",
                  "processes",
                  "coshh"
                ]
              }
            },
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/documents/policies/{id}/file": {
        "post": {
          "tags": [
            "Admin - Documents"
          ],
          "summary": "Upload a policy PDF",
          "description": "Uploads the policy file directly to the legacy downloads folder. The existing document reference is used as the PDF filename.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary",
                      "description": "PDF policy document"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Policy PDF uploaded"
            }
          }
        }
      },
      "/devices/register": {
        "post": {
          "tags": [
            "Devices"
          ],
          "summary": "Register or refresh an FCM device token for the authenticated user",
          "description": "Upsert-safe. Call this on:\n- App launch (if a token exists in local storage).\n- FCM `onTokenRefresh` (Android) / APNs re-issue (iOS).\n- Successful login (bind the current device to the logged-in user).\n\n**Required:** `Authorization: Bearer <accessToken>` header.\n\nIf the same `token` is already registered to another user, ownership is\ntransferred to the current caller \\u2014 covers the \"shared device\" case.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DeviceRegisterRequest"
                },
                "examples": {
                  "android": {
                    "summary": "Android registration",
                    "value": {
                      "fcm_token": "fMEP0vJqS0m:APA91bH...",
                      "platform": "android",
                      "appVersion": "1.4.2"
                    }
                  },
                  "ios": {
                    "summary": "iOS registration",
                    "value": {
                      "token": "dEadBeEf...",
                      "platform": "ios",
                      "appVersion": "1.4.2"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Token stored (created or updated).",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/DeviceRegisterResponse"
                  }
                }
              }
            },
            "401": {
              "description": "`UNAUTHORIZED` \\u2014 missing or invalid bearer token.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorEnvelope"
                  }
                }
              }
            },
            "422": {
              "description": "`VALIDATION_ERROR` \\u2014 missing/invalid fields.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorEnvelope"
                  }
                }
              }
            }
          }
        }
      },
      "/devices/unregister": {
        "post": {
          "tags": [
            "Devices"
          ],
          "summary": "Revoke a device token so no further push is delivered to it",
          "description": "Call this on:\n- Logout (revoke the current device's token before dropping the session).\n- User-initiated push opt-out.\n\n**Required:** `Authorization: Bearer <accessToken>` header.\n\nOnly the token owner can revoke it \\u2014 attempts by another user return\n`revoked: false` silently.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DeviceUnregisterRequest"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "OK. `revoked` shows whether an active row was affected.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/DeviceUnregisterResponse"
                  }
                }
              }
            },
            "401": {
              "description": "`UNAUTHORIZED`",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorEnvelope"
                  }
                }
              }
            },
            "422": {
              "description": "`VALIDATION_ERROR`",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorEnvelope"
                  }
                }
              }
            }
          }
        }
      },
      "/devices": {
        "get": {
          "tags": [
            "Devices"
          ],
          "summary": "List the authenticated user's active device tokens",
          "description": "Returns every active (non-revoked) device row owned by the caller.\nUseful for the mobile \"signed-in devices\" screen.\n\n**Required:** `Authorization: Bearer <accessToken>` header.\n",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Array of active device rows.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/DeviceListResponse"
                  }
                }
              }
            },
            "401": {
              "description": "`UNAUTHORIZED`",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorEnvelope"
                  }
                }
              }
            }
          }
        }
      },
      "/account/pages": {
        "get": {
          "tags": [
            "My Account"
          ],
          "summary": "List My Account content pages",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "About Us",
              "Privacy Policy and Terms & Conditions pages": null
            }
          }
        }
      },
      "/account/pages/{slug}": {
        "get": {
          "tags": [
            "My Account"
          ],
          "summary": "Get a My Account content page",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "slug",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "about-us",
                  "privacy-policy",
                  "terms-and-conditions"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Requested content page"
            }
          }
        },
        "put": {
          "tags": [
            "My Account"
          ],
          "summary": "Update a My Account content page",
          "description": "Admin and Admin1 only.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "slug",
              "required": true,
              "schema": {
                "type": "string",
                "enum": [
                  "about-us",
                  "privacy-policy",
                  "terms-and-conditions"
                ]
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "content"
                  ],
                  "properties": {
                    "title": {
                      "type": "string",
                      "description": "Optional replacement title; omitted keeps the current page title."
                    },
                    "content": {
                      "type": "string",
                      "description": "HTML/text content. Send an empty string to clear the page."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated content page"
            }
          }
        }
      },
      "/employee/contacts": {
        "get": {
          "operationId": "employeeListContacts",
          "tags": [
            "Contacts"
          ],
          "summary": "List employee contact directory",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns the legacy-compatible paginated employee directory. Use `firstname` and/or `surname` for exact PHP-style prefix filters; `search` searches either field. Sorted by `employeeid ASC`.",
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "default": 1
              },
              "description": "Page number (1-based).",
              "example": 1
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 10
              },
              "description": "Items per page. Defaults to the legacy PHP page size; max 100.",
              "example": 10
            },
            {
              "in": "query",
              "name": "firstname",
              "schema": {
                "type": "string"
              },
              "description": "Legacy PHP first-name prefix filter.",
              "example": "Dean"
            },
            {
              "in": "query",
              "name": "surname",
              "schema": {
                "type": "string"
              },
              "description": "Legacy PHP surname prefix filter. Combines with firstname using AND.",
              "example": "Cairns"
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Prefix match on first name or surname.",
              "example": "dea"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated contact list.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/ContactEmployee"
                        }
                      },
                      "meta": {
                        "$ref": "#/components/schemas/PaginationMeta"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": [
                      {
                        "id": 42,
                        "employeeid": "00012",
                        "name": "Dean Louch",
                        "phone": "07700 900123",
                        "email": "dl@ltraffic.co.uk",
                        "jobtitle": "Driving Operative",
                        "linemanager": "Anthony Louch",
                        "location": "Head Office",
                        "photo_url": "http://192.168.1.100/admin/employeephoto/DeanLouch.jpg"
                      },
                      {
                        "id": 43,
                        "employeeid": "00013",
                        "name": "Steve Toth",
                        "phone": "07700 900124",
                        "email": "st@ltraffic.co.uk",
                        "jobtitle": "Operative",
                        "linemanager": "Anthony Louch",
                        "location": "Head Office",
                        "photo_url": null
                      }
                    ],
                    "meta": {
                      "page": 1,
                      "limit": 20,
                      "total": 47
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/employee/contacts/{id}": {
        "get": {
          "operationId": "employeeGetContact",
          "tags": [
            "Contacts"
          ],
          "summary": "Get contact by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns full details of a single employee contact by `hr.id`.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 1
              },
              "description": "HR record primary key.",
              "example": 42
            }
          ],
          "responses": {
            "200": {
              "description": "Contact detail.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContactEmployee"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "id": 42,
                      "employeeid": "00012",
                      "name": "Dean Louch",
                      "phone": "07700 900123",
                      "email": "dl@ltraffic.co.uk",
                      "jobtitle": "Driving Operative",
                      "linemanager": "Anthony Louch",
                      "location": "Head Office",
                      "photo_url": "http://192.168.1.100/admin/employeephoto/DeanLouch.jpg"
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "404": {
              "$ref": "#/components/responses/NotFound404"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/admin/contacts": {
        "get": {
          "tags": [
            "Admin - Contacts"
          ],
          "summary": "List directory contacts",
          "description": "Lists the same `hr`-backed directory shown to employees. Supports legacy first-name and surname prefix filters. Newest contacts are returned first (latest `hr.id` first).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 10
              }
            },
            {
              "in": "query",
              "name": "firstname",
              "schema": {
                "type": "string"
              }
            },
            {
              "in": "query",
              "name": "surname",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated contact list"
            }
          }
        },
        "post": {
          "tags": [
            "Admin - Contacts"
          ],
          "summary": "Add directory contact",
          "description": "Creates a minimal `hr` record for a company directory contact. This does not create a login account.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "employeeid",
                    "firstname",
                    "surname"
                  ],
                  "properties": {
                    "employeeid": {
                      "type": "string",
                      "example": "00060"
                    },
                    "firstname": {
                      "type": "string",
                      "example": "Jane"
                    },
                    "surname": {
                      "type": "string",
                      "example": "Smith"
                    },
                    "phone": {
                      "type": "string",
                      "example": "07700 900123"
                    },
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "jane.smith@ltraffic.co.uk"
                    },
                    "jobtitle": {
                      "type": "string",
                      "example": "Traffic Operative"
                    },
                    "linemanager": {
                      "type": "string",
                      "example": "Anthony Louch"
                    },
                    "location": {
                      "type": "string",
                      "example": "Head Office"
                    },
                    "image": {
                      "type": "string",
                      "format": "binary",
                      "description": "Optional employee photo (JPEG, PNG, GIF, BMP, or WebP). Aliases: photo, photoimage, file."
                    },
                    "photoimage": {
                      "type": "string",
                      "format": "binary",
                      "description": "PHP/mobile-compatible alias for image."
                    }
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "employeeid",
                    "firstname",
                    "surname"
                  ],
                  "properties": {
                    "employeeid": {
                      "type": "string"
                    },
                    "firstname": {
                      "type": "string"
                    },
                    "surname": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "jobtitle": {
                      "type": "string"
                    },
                    "linemanager": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "photo_url": {
                      "type": "string",
                      "description": "Existing public or legacy relative photo URL."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Contact created"
            },
            "409": {
              "description": "Employee ID already exists"
            }
          }
        }
      },
      "/admin/contacts/{id}": {
        "get": {
          "tags": [
            "Admin - Contacts"
          ],
          "summary": "Get directory contact",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Contact detail"
            },
            "404": {
              "description": "Contact not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Contacts"
          ],
          "summary": "Edit directory contact",
          "description": "Updates only directory fields: employee ID, name, company phone/email, job title, line manager, location and photo. JSON is supported for text-only updates; use multipart/form-data for a file.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "employeeid": {
                      "type": "string"
                    },
                    "firstname": {
                      "type": "string"
                    },
                    "surname": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "jobtitle": {
                      "type": "string"
                    },
                    "linemanager": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "image": {
                      "type": "string",
                      "format": "binary",
                      "description": "Replacement employee photo (JPEG, PNG, GIF, BMP, or WebP). Aliases: photo, photoimage, file."
                    },
                    "photoimage": {
                      "type": "string",
                      "format": "binary",
                      "description": "PHP/mobile-compatible alias for image."
                    }
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "employeeid": {
                      "type": "string"
                    },
                    "firstname": {
                      "type": "string"
                    },
                    "surname": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "jobtitle": {
                      "type": "string"
                    },
                    "linemanager": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "photo_url": {
                      "type": "string",
                      "description": "Existing public or legacy relative photo URL."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Contact updated"
            },
            "404": {
              "description": "Contact not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Contacts"
          ],
          "summary": "Remove directory contact",
          "description": "Permanently removes the underlying `hr` record. Available to full Admin only.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Contact not found"
            }
          }
        }
      },
      "/employee/clegg-testing": {
        "get": {
          "tags": [
            "Clegg Testing"
          ],
          "summary": "List Clegg test records",
          "description": "Returns paginated list of Clegg test results. Searchable by ct4 (Conducted By) prefix match. Sorted by id DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by ct4 Conducted By (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated Clegg test list"
            }
          }
        },
        "post": {
          "tags": [
            "Clegg Testing"
          ],
          "summary": "Create Clegg test record",
          "description": "Creates a new Clegg test record with image uploads. Send as multipart/form-data. Conducted By (ct4) and Date (ct3) are auto-populated.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "ct2",
                    "ct5",
                    "ct6",
                    "ct7",
                    "ct8",
                    "ct9",
                    "ct10"
                  ],
                  "properties": {
                    "ct1": {
                      "type": "string",
                      "description": "Job Number"
                    },
                    "ct2": {
                      "type": "string",
                      "description": "Location of Test"
                    },
                    "ct5": {
                      "type": "string",
                      "description": "Cabinet Area"
                    },
                    "ct6": {
                      "type": "string",
                      "description": "Surface Type"
                    },
                    "ct7": {
                      "type": "string",
                      "description": "Test Unit Used"
                    },
                    "ct8": {
                      "type": "string",
                      "description": "Calibration Expiry Date"
                    },
                    "ct9": {
                      "type": "string",
                      "description": "Clegg Test Reading"
                    },
                    "ct10": {
                      "type": "string",
                      "description": "Clegg Test Result (Pass/Fail)"
                    },
                    "ct11": {
                      "type": "string",
                      "description": "Re-Test Reading"
                    },
                    "ct12": {
                      "type": "string",
                      "description": "Re-Test Result"
                    },
                    "ct13": {
                      "type": "string",
                      "description": "Notes"
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Clegg test created"
            }
          }
        }
      },
      "/employee/clegg-testing/{id}": {
        "get": {
          "tags": [
            "Clegg Testing"
          ],
          "summary": "Get Clegg test record by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Clegg test details with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/clegg-testing": {
        "get": {
          "tags": [
            "Admin - Clegg Testing"
          ],
          "summary": "List all Clegg test records",
          "description": "Returns paginated list of Clegg test results. Searchable by ct4 (Conducted By) prefix match. Sorted by id DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by ct4 Conducted By (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated Clegg test list"
            }
          }
        }
      },
      "/admin/clegg-testing/{id}": {
        "get": {
          "tags": [
            "Admin - Clegg Testing"
          ],
          "summary": "Get Clegg test record by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Clegg test details with image URLs"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "tags": [
            "Admin - Clegg Testing"
          ],
          "summary": "Update Clegg test record",
          "description": "Updates an existing Clegg test record. All fields optional.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "ct1": {
                      "type": "string"
                    },
                    "ct2": {
                      "type": "string"
                    },
                    "ct3": {
                      "type": "string"
                    },
                    "ct4": {
                      "type": "string"
                    },
                    "ct5": {
                      "type": "string"
                    },
                    "ct6": {
                      "type": "string"
                    },
                    "ct7": {
                      "type": "string"
                    },
                    "ct8": {
                      "type": "string"
                    },
                    "ct9": {
                      "type": "string"
                    },
                    "ct10": {
                      "type": "string"
                    },
                    "ct11": {
                      "type": "string"
                    },
                    "ct12": {
                      "type": "string"
                    },
                    "ct13": {
                      "type": "string"
                    },
                    "image": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Clegg test updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin - Clegg Testing"
          ],
          "summary": "Delete Clegg test record",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/civils": {
        "get": {
          "operationId": "employeeListCivils",
          "tags": [
            "Civils"
          ],
          "summary": "List active civils jobs",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns paginated list of active civils jobs. Excludes Completed, Cancelled, Closed, Invoiced, Awaiting Invoicing. Searchable by solonumber and assignedto (prefix match). Sorted by startdate DESC.\n\n**Allowed roles:** Admin (1), Admin1 (4), Civils Trailer Driver (6), Admin2 (7), Essex Supervisor (8), Customer (9)\n**Blocked roles:** Driving Operative (2), Operative (3), Civils TFL Driver (5)\n",
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by solonumber (prefix match)"
            },
            {
              "in": "query",
              "name": "assignedto",
              "schema": {
                "type": "string"
              },
              "description": "Filter by assignedto (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated active job list",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/CivilsJob"
                        }
                      },
                      "meta": {
                        "$ref": "#/components/schemas/PaginationMeta"
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/employee/civils/{id}": {
        "get": {
          "operationId": "employeeGetCivils",
          "tags": [
            "Civils"
          ],
          "summary": "Get civils job by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Job details"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/civils/{id}/documents": {
        "get": {
          "operationId": "employeeListCivilsDocuments",
          "tags": [
            "Civils"
          ],
          "summary": "List documents for a civils job",
          "description": "Returns paginated list of uploaded documents for a civils job.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Job not found"
            }
          }
        }
      },
      "/admin/civils": {
        "get": {
          "operationId": "adminListCivils",
          "tags": [
            "Admin - Civils"
          ],
          "summary": "List all civils jobs",
          "description": "Returns paginated list of all civils jobs regardless of status. Searchable by solonumber, assignedto, jobstatus, and permitstatus (prefix match). Sorted by startdate DESC.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by solonumber (prefix match)"
            },
            {
              "in": "query",
              "name": "assignedto",
              "schema": {
                "type": "string"
              },
              "description": "Filter by assignedto (prefix match)"
            },
            {
              "in": "query",
              "name": "jobstatus",
              "schema": {
                "type": "string"
              },
              "description": "Filter by jobstatus (prefix match)"
            },
            {
              "in": "query",
              "name": "permitstatus",
              "schema": {
                "type": "string"
              },
              "description": "Filter by permitstatus (prefix match)"
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated job list"
            }
          }
        },
        "post": {
          "operationId": "adminCreateCivils",
          "tags": [
            "Admin - Civils"
          ],
          "summary": "Create civils job",
          "description": "Creates a new civils job.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "jobstatus",
                    "assignedto",
                    "client",
                    "authority",
                    "community",
                    "solonumber",
                    "location",
                    "postcode",
                    "permitstatus"
                  ],
                  "properties": {
                    "jobstatus": {
                      "type": "string"
                    },
                    "assignedto": {
                      "type": "string"
                    },
                    "client": {
                      "type": "string"
                    },
                    "authority": {
                      "type": "string"
                    },
                    "community": {
                      "type": "string"
                    },
                    "solonumber": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "postcode": {
                      "type": "string"
                    },
                    "permitstatus": {
                      "type": "string"
                    },
                    "startdate": {
                      "type": "string"
                    },
                    "enddate": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Job created"
            }
          }
        }
      },
      "/admin/civils/{id}": {
        "get": {
          "operationId": "adminGetCivils",
          "tags": [
            "Admin - Civils"
          ],
          "summary": "Get civils job by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Job details"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "put": {
          "operationId": "adminUpdateCivils",
          "tags": [
            "Admin - Civils"
          ],
          "summary": "Update civils job",
          "description": "Updates an existing civils job. All fields are optional.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "jobstatus": {
                      "type": "string"
                    },
                    "assignedto": {
                      "type": "string"
                    },
                    "client": {
                      "type": "string"
                    },
                    "authority": {
                      "type": "string"
                    },
                    "community": {
                      "type": "string"
                    },
                    "solonumber": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "postcode": {
                      "type": "string"
                    },
                    "permitstatus": {
                      "type": "string"
                    },
                    "startdate": {
                      "type": "string"
                    },
                    "enddate": {
                      "type": "string"
                    },
                    "notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Job updated"
            },
            "404": {
              "description": "Not found"
            }
          }
        },
        "delete": {
          "operationId": "adminDeleteCivils",
          "tags": [
            "Admin - Civils"
          ],
          "summary": "Delete civils job",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/admin/civils/{id}/documents": {
        "get": {
          "operationId": "adminListCivilsDocuments",
          "tags": [
            "Admin - Civils"
          ],
          "summary": "List documents for a civils job",
          "description": "Returns paginated list of uploaded documents for a job. Searchable by submittedby or arrival_datetime (prefix match).",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated document list"
            },
            "404": {
              "description": "Job not found"
            }
          }
        },
        "post": {
          "operationId": "adminUploadCivilsDocument",
          "tags": [
            "Admin - Civils"
          ],
          "summary": "Upload document for a civils job",
          "description": "Uploads a document associated with a civils job. Send as multipart/form-data.",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "file",
                    "doctype",
                    "docdesc"
                  ],
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    },
                    "doctype": {
                      "type": "string"
                    },
                    "docdesc": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Document uploaded"
            },
            "404": {
              "description": "Job not found"
            }
          }
        }
      },
      "/admin/civils/{id}/documents/{docId}": {
        "delete": {
          "operationId": "adminDeleteCivilsDocument",
          "tags": [
            "Admin - Civils"
          ],
          "summary": "Delete a document",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "docId",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/Deleted200"
            },
            "404": {
              "description": "Not found"
            }
          }
        }
      },
      "/employee/bulletins/pending": {
        "get": {
          "operationId": "employeeGetPendingBulletins",
          "tags": [
            "Bulletins"
          ],
          "summary": "Get unconfirmed active bulletins for current user",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns active bulletins (`new` = 1) that the current user has NOT yet\nacknowledged. The mobile app should call this on every launch and\n**block navigation** if the result array is non-empty — employees must\nread and acknowledge all pending bulletins before using other features.\n\n**PHP compatibility:** replaces the bulletin popup / forced-read screen\nin the PHP employee area.\n\n**Database:** cross-references `bulletinnew` (where `new` = 1) against\n`bulletinread` for the current user. Returns bulletins with no matching\nread row.\n\n**Business rules:**\n- Only active bulletins are included (inactive are skipped).\n- All returned items have `is_read: false`.\n- Returns empty array `[]` when everything is acknowledged.\n- Not paginated — returns all pending bulletins at once.\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Yes |\n",
          "responses": {
            "200": {
              "description": "Pending bulletins. Empty array if all are acknowledged.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/BulletinEmployee"
                        }
                      }
                    }
                  },
                  "examples": {
                    "hasPending": {
                      "summary": "User has unread bulletins",
                      "value": {
                        "success": true,
                        "data": [
                          {
                            "id": 42,
                            "title": "Health & Safety Update - July 2026",
                            "ref": "HS-2026-07",
                            "description": "All operatives must complete the updated safety module.",
                            "image": null,
                            "image_url": null,
                            "download": "hs-policy-v3.pdf",
                            "download_url": "https://ltraffic.co.uk/uploads/bulletin/hs-policy-v3.pdf",
                            "active": true,
                            "status": "Active",
                            "arrival_datetime": "2026-07-14T10:30:00.000Z",
                            "is_read": false
                          }
                        ]
                      }
                    },
                    "allRead": {
                      "summary": "All bulletins acknowledged",
                      "value": {
                        "success": true,
                        "data": []
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            }
          }
        }
      },
      "/employee/bulletins": {
        "get": {
          "operationId": "employeeListBulletins",
          "tags": [
            "Bulletins"
          ],
          "summary": "List all bulletins with read status for current user",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns a paginated list of all bulletins (both active and inactive)\nwith an `is_read` flag indicating whether the current user has\nacknowledged each one.\n\n**PHP compatibility:** replaces the employee bulletin list view.\nUnlike the admin list, this does NOT include `read_confirm` — employees\nsee only their own read status.\n\n**Database:** `bulletinnew` with per-row lookup on `bulletinread` for\nthe authenticated user's `user_id`.\n\n**Sorting:** `id DESC` (newest first).\n**Default page size:** 20. **Maximum:** 100.\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Yes |\n",
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "default": 1
              },
              "description": "Page number (1-based)."
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 20
              },
              "description": "Items per page. Maximum 100."
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated bulletins with per-user read status.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/BulletinEmployee"
                        }
                      },
                      "meta": {
                        "$ref": "#/components/schemas/PaginationMeta"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": [
                      {
                        "id": 42,
                        "title": "Health & Safety Update - July 2026",
                        "ref": "HS-2026-07",
                        "description": "All operatives must complete the updated safety module.",
                        "image": null,
                        "image_url": null,
                        "download": "hs-policy-v3.pdf",
                        "download_url": "https://ltraffic.co.uk/uploads/bulletin/hs-policy-v3.pdf",
                        "active": true,
                        "status": "Active",
                        "arrival_datetime": "2026-07-14T10:30:00.000Z",
                        "is_read": true
                      },
                      {
                        "id": 41,
                        "title": "PPE Reminder",
                        "ref": "PPE-2026-06",
                        "description": "Reminder to wear PPE at all times on site.",
                        "image": null,
                        "image_url": null,
                        "download": null,
                        "download_url": null,
                        "active": true,
                        "status": "Active",
                        "arrival_datetime": "2026-06-01T09:00:00.000Z",
                        "is_read": false
                      }
                    ],
                    "meta": {
                      "page": 1,
                      "limit": 20,
                      "total": 42
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/employee/bulletins/{id}": {
        "get": {
          "operationId": "employeeGetBulletin",
          "tags": [
            "Bulletins"
          ],
          "summary": "Get single bulletin with read status",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns a single bulletin with the current user's `is_read` status.\n\n**PHP compatibility:** replaces the employee bulletin detail view.\n\n**Database:** `bulletinnew` by primary key, with `bulletinread` lookup\nfor the current user.\n\n**Business rule:** returns 404 if the bulletin ID does not exist.\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Yes |\n",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 1
              },
              "description": "Bulletin primary key."
            }
          ],
          "responses": {
            "200": {
              "description": "Bulletin detail with read status.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/BulletinEmployee"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "id": 42,
                      "title": "Health & Safety Update - July 2026",
                      "ref": "HS-2026-07",
                      "description": "All operatives must complete the updated safety module.",
                      "image": null,
                      "image_url": null,
                      "download": "hs-policy-v3.pdf",
                      "download_url": "https://ltraffic.co.uk/uploads/bulletin/hs-policy-v3.pdf",
                      "active": true,
                      "status": "Active",
                      "arrival_datetime": "2026-07-14T10:30:00.000Z",
                      "is_read": true
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "404": {
              "$ref": "#/components/responses/NotFound404"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/employee/bulletins/{id}/acknowledge": {
        "post": {
          "operationId": "employeeAcknowledgeBulletin",
          "tags": [
            "Bulletins"
          ],
          "summary": "Acknowledge a bulletin",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Records that the current user has read and confirmed the bulletin.\nNo request body is needed — the user identity comes from the JWT.\n\n**What happens:**\n1. Verifies the bulletin exists (404 if not).\n2. If not already read, inserts a row into `bulletinread`\n   (`bulletin` = id, `user_id` = current user).\n3. Inserts an audit row into `bulletinconfirm`\n   (`ref` = bulletin ref, `operative` = user name, `confirm` = 'confirm').\n\n**PHP compatibility:** replaces the \"I have read and understood\"\nconfirmation action in the PHP employee area. Writes to the same\n`bulletinread` and `bulletinconfirm` tables.\n\n**Business rules:**\n- **Idempotent for read tracking:** calling multiple times does NOT\n  create duplicate `bulletinread` rows. The second call skips the insert.\n- **NOT idempotent for audit:** each call inserts a new `bulletinconfirm`\n  row (matching PHP behaviour — every confirmation click is logged).\n- No request body required.\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| All authenticated users | Yes |\n",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 1
              },
              "description": "Bulletin primary key to acknowledge."
            }
          ],
          "responses": {
            "200": {
              "description": "Bulletin acknowledged.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "acknowledged": {
                            "type": "boolean",
                            "description": "Always `true` on success.",
                            "example": true
                          }
                        }
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "acknowledged": true
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "404": {
              "$ref": "#/components/responses/NotFound404"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/admin/bulletins": {
        "get": {
          "operationId": "adminListBulletins",
          "tags": [
            "Admin - Bulletins"
          ],
          "summary": "List all bulletins",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns a paginated list of all bulletins with reader names. Supports\nsearch by title (substring match) and reference (prefix match), and\nfiltering by active/inactive status.\n\n**PHP compatibility:** replaces the bulletin list in `bulletin.php`.\nThe admin list includes a `read_confirm` field (comma-separated reader\nnames) built via GROUP_CONCAT, matching the PHP admin view.\n\n**Database:** `bulletinnew` with subquery on `bulletinread` + `login_users`.\n\n**Sorting:** `id DESC` (newest first).\n**Default page size:** 20. **Maximum:** 100.\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| Admin (1) | Yes |\n| Admin1 (4) | Yes |\n| All others | Denied (403) |\n",
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "default": 1
              },
              "description": "Page number (1-based)."
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 20
              },
              "description": "Items per page. Maximum 100."
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Search by bulletin title (substring match — `LIKE %search%`)."
            },
            {
              "in": "query",
              "name": "searchRef",
              "schema": {
                "type": "string"
              },
              "description": "Search by reference code (prefix match — `LIKE searchRef%`)."
            },
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string",
                "enum": [
                  "active",
                  "inactive"
                ]
              },
              "description": "Filter by status. Omit to return all."
            }
          ],
          "responses": {
            "200": {
              "description": "Paginated bulletin list with reader names.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/Bulletin"
                        }
                      },
                      "meta": {
                        "$ref": "#/components/schemas/PaginationMeta"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": [
                      {
                        "id": 42,
                        "title": "Health & Safety Update - July 2026",
                        "ref": "HS-2026-07",
                        "description": "All operatives must complete the updated safety module.",
                        "image": "bulletin-hs-update.jpg",
                        "image_url": "https://ltraffic.co.uk/uploads/bulletin/bulletin-hs-update.jpg",
                        "download": "hs-policy-v3.pdf",
                        "download_url": "https://ltraffic.co.uk/uploads/bulletin/hs-policy-v3.pdf",
                        "active": true,
                        "status": "Active",
                        "arrival_datetime": "2026-07-14T10:30:00.000Z",
                        "read_confirm": "Anthony Louch, Dean Stokes"
                      }
                    ],
                    "meta": {
                      "page": 1,
                      "limit": 20,
                      "total": 42
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        },
        "post": {
          "operationId": "adminCreateBulletin",
          "tags": [
            "Admin - Bulletins"
          ],
          "summary": "Create bulletin",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Creates a new bulletin with optional image and download attachments.\nThe `arrival_datetime` is set to `NOW()` automatically.\n\n**PHP compatibility:** replaces the \"Add Bulletin\" form in\n`bulletinedit.php`. The `new` field maps to `bulletinnew.new`\n(1 = Active, 0 = Inactive), defaulting to 1 (Active).\n\n**Database:** INSERT into `bulletinnew`.\n\n**Business rules:**\n- `arrival_datetime` is auto-set to `NOW()`.\n- `readby` is initialized to empty string (legacy column).\n- `new` defaults to `'1'` (Active) if omitted. Clients may send\n  `active: true/false` instead; the API converts it to the legacy flag.\n- Image and download filenames are stored as-is in the DB columns.\n- An active bulletin creates a `BULLETIN_PUBLISHED` inbox notification\n  for every unrestricted user and sends FCM to each active device token.\n  Push data includes `bulletinId`, `ref`, and `action=open_bulletin`.\n\n**Upload:**\n\n| Field | Max Files | Allowed Types | Storage Folder |\n|-------|-----------|---------------|----------------|\n| `image` | 1 | JPEG, JPG, PNG, GIF, BMP, WebP, PDF, DOC, PPT, ZIP, XLSX, DOCX | `bulletin/` |\n| `download` | 1 | JPEG, JPG, PNG, GIF, BMP, WebP, PDF, DOC, PPT, ZIP, XLSX, DOCX | `bulletin/` |\n\nFiles are stored under `UPLOADS_ROOT/bulletin/` (the PHP web root).\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| Admin (1) | Yes |\n| Admin1 (4) | Yes |\n| All others | Denied (403) |\n",
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "title",
                    "ref",
                    "description"
                  ],
                  "properties": {
                    "title": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 500,
                      "description": "Bulletin title. Displayed to all employees.",
                      "example": "Health & Safety Update - July 2026"
                    },
                    "ref": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 255,
                      "description": "Unique reference code for audit tracking.",
                      "example": "HS-2026-07"
                    },
                    "description": {
                      "type": "string",
                      "minLength": 1,
                      "description": "Full bulletin text / body content.",
                      "example": "All operatives must complete the updated safety module by 31 July."
                    },
                    "new": {
                      "type": "string",
                      "enum": [
                        "0",
                        "1"
                      ],
                      "default": "1",
                      "description": "Active flag. `1` = Active (employees must acknowledge), `0` = Inactive (hidden).",
                      "example": "1"
                    },
                    "active": {
                      "type": "boolean",
                      "description": "Convenience alias for `new`; true = Active, false = Inactive."
                    },
                    "image": {
                      "type": "string",
                      "format": "binary",
                      "description": "Optional image/document attachment (JPEG, JPG, PNG, GIF, BMP, WebP, PDF, DOC, PPT, ZIP, XLSX, or DOCX)."
                    },
                    "download": {
                      "type": "string",
                      "format": "binary",
                      "description": "Optional downloadable file (JPEG, JPG, PNG, GIF, BMP, WebP, PDF, DOC, PPT, ZIP, XLSX, or DOCX)."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Bulletin created. Returns the full bulletin object.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Bulletin"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "id": 43,
                      "title": "Health & Safety Update - July 2026",
                      "ref": "HS-2026-07",
                      "description": "All operatives must complete the updated safety module by 31 July.",
                      "image": "bulletin-hs-update.jpg",
                      "image_url": "https://ltraffic.co.uk/uploads/bulletin/bulletin-hs-update.jpg",
                      "download": null,
                      "download_url": null,
                      "active": true,
                      "status": "Active",
                      "arrival_datetime": "2026-07-14T10:30:00.000Z",
                      "read_confirm": null
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/admin/bulletins/{id}": {
        "get": {
          "operationId": "adminGetBulletin",
          "tags": [
            "Admin - Bulletins"
          ],
          "summary": "Get bulletin by ID",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns a single bulletin with all fields including `read_confirm`\n(comma-separated list of employees who read it).\n\n**PHP compatibility:** replaces `bulletinedit.php` detail view.\n\n**Database:** `bulletinnew` by primary key.\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| Admin (1) | Yes |\n| Admin1 (4) | Yes |\n| All others | Denied (403) |\n",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 1
              },
              "description": "Bulletin primary key."
            }
          ],
          "responses": {
            "200": {
              "description": "Bulletin detail with image/download URLs.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Bulletin"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "id": 42,
                      "title": "Health & Safety Update - July 2026",
                      "ref": "HS-2026-07",
                      "description": "All operatives must complete the updated safety module.",
                      "image": "bulletin-hs-update.jpg",
                      "image_url": "https://ltraffic.co.uk/uploads/bulletin/bulletin-hs-update.jpg",
                      "download": "hs-policy-v3.pdf",
                      "download_url": "https://ltraffic.co.uk/uploads/bulletin/hs-policy-v3.pdf",
                      "active": true,
                      "status": "Active",
                      "arrival_datetime": "2026-07-14T10:30:00.000Z",
                      "read_confirm": "Anthony Louch, Dean Stokes"
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            },
            "404": {
              "$ref": "#/components/responses/NotFound404"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        },
        "put": {
          "operationId": "adminUpdateBulletin",
          "tags": [
            "Admin - Bulletins"
          ],
          "summary": "Update bulletin",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Updates an existing bulletin. All body fields are optional — only\nprovided fields are updated. Uploading a new `image` or `download`\nreplaces the previous file reference in the database.\n\n**PHP compatibility:** replaces the edit form in `bulletinedit.php`.\nAllowed fields: `title`, `ref`, `description`, `new` (active flag),\n`active`/`status` aliases, `image`, `download`. When both are sent,\n`new` takes precedence. JSON and multipart form requests are accepted.\n\n**Database:** UPDATE `bulletinnew` WHERE `id = :id`.\n\n**Business rule:** returns 404 if the bulletin does not exist.\n\n**Upload:**\n\n| Field | Max Files | Allowed Types | Storage Folder |\n|-------|-----------|---------------|----------------|\n| `image` | 1 | JPEG, JPG, PNG, GIF, BMP, WebP, PDF, DOC, PPT, ZIP, XLSX, DOCX | `bulletin/` |\n| `download` | 1 | JPEG, JPG, PNG, GIF, BMP, WebP, PDF, DOC, PPT, ZIP, XLSX, DOCX | `bulletin/` |\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| Admin (1) | Yes |\n| Admin1 (4) | Yes |\n| All others | Denied (403) |\n",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 1
              },
              "description": "Bulletin primary key."
            }
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 500,
                      "description": "Updated bulletin title.",
                      "example": "Health & Safety Update - July 2026 (Revised)"
                    },
                    "ref": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 255,
                      "description": "Updated reference code.",
                      "example": "HS-2026-07-R1"
                    },
                    "description": {
                      "type": "string",
                      "minLength": 1,
                      "description": "Updated bulletin body.",
                      "example": "Updated: all operatives must complete the revised module by 15 August."
                    },
                    "new": {
                      "type": "string",
                      "enum": [
                        "0",
                        "1"
                      ],
                      "description": "Set active/inactive. `1` = Active, `0` = Inactive.",
                      "example": "1"
                    },
                    "active": {
                      "type": "boolean",
                      "description": "Convenience alias for `new`; true = Active, false = Inactive."
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "Active",
                        "Inactive"
                      ],
                      "description": "Human-readable alias for the active flag."
                    },
                    "image": {
                      "type": "string",
                      "format": "binary",
                      "description": "Replacement image/document. Overwrites the previous filename in DB."
                    },
                    "download": {
                      "type": "string",
                      "format": "binary",
                      "description": "Replacement download file. Overwrites the previous filename in DB."
                    }
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string",
                      "maxLength": 500
                    },
                    "ref": {
                      "type": "string",
                      "maxLength": 255
                    },
                    "description": {
                      "type": "string"
                    },
                    "new": {
                      "type": "string",
                      "enum": [
                        "0",
                        "1"
                      ]
                    },
                    "active": {
                      "type": "boolean"
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "Active",
                        "Inactive"
                      ]
                    }
                  }
                },
                "example": {
                  "title": "Updated bulletin",
                  "description": "Updated bulletin description",
                  "active": false
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Bulletin updated. Returns the full updated bulletin.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Bulletin"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "id": 42,
                      "title": "Health & Safety Update - July 2026 (Revised)",
                      "ref": "HS-2026-07-R1",
                      "description": "Updated: all operatives must complete the revised module by 15 August.",
                      "image": "bulletin-hs-update-v2.jpg",
                      "image_url": "https://ltraffic.co.uk/uploads/bulletin/bulletin-hs-update-v2.jpg",
                      "download": "hs-policy-v3.pdf",
                      "download_url": "https://ltraffic.co.uk/uploads/bulletin/hs-policy-v3.pdf",
                      "active": true,
                      "status": "Active",
                      "arrival_datetime": "2026-07-14T10:30:00.000Z",
                      "read_confirm": "Anthony Louch, Dean Stokes"
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            },
            "404": {
              "$ref": "#/components/responses/NotFound404"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        },
        "delete": {
          "operationId": "adminDeleteBulletin",
          "tags": [
            "Admin - Bulletins"
          ],
          "summary": "Delete bulletin",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Permanently deletes a bulletin. This is a hard delete — the row is\nremoved from `bulletinnew`. Read tracking rows in `bulletinread` and\naudit rows in `bulletinconfirm` are NOT cascade-deleted (they remain\nas orphaned records, matching PHP behaviour).\n\n**PHP compatibility:** replaces the delete action in `bulletin.php`.\n\n**Database:** DELETE FROM `bulletinnew` WHERE `id = :id`.\n\n**Business rule:** returns 404 if the bulletin does not exist.\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| Admin (1) | Yes |\n| Admin1 (4) | Yes |\n| All others | Denied (403) |\n",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 1
              },
              "description": "Bulletin primary key."
            }
          ],
          "responses": {
            "200": {
              "description": "Bulletin deleted successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "message": {
                            "type": "string",
                            "example": "Bulletin deleted successfully"
                          }
                        }
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "message": "Bulletin deleted successfully"
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            },
            "404": {
              "$ref": "#/components/responses/NotFound404"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/admin/bulletins/{id}/readers": {
        "get": {
          "operationId": "adminGetBulletinReaders",
          "tags": [
            "Admin - Bulletins"
          ],
          "summary": "Get users who have read this bulletin",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns the list of employees who have acknowledged this bulletin,\nwith their user ID, name, and email.\n\n**PHP compatibility:** replaces the \"Read By\" section in `bulletinedit.php`.\n\n**Database:** `bulletinread` joined with `login_users` where\n`bulletinread.bulletin = :id`.\n\n**Business rule:** the bulletin must exist (404 if not), even if no\nreaders are found (returns empty array).\n\n**RBAC:**\n\n| Role | Access |\n|------|--------|\n| Admin (1) | Yes |\n| Admin1 (4) | Yes |\n| All others | Denied (403) |\n",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer",
                "minimum": 1
              },
              "description": "Bulletin primary key."
            }
          ],
          "responses": {
            "200": {
              "description": "List of readers. Empty array if none.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/BulletinReader"
                        }
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": [
                      {
                        "user_id": 5,
                        "name": "Dean Stokes",
                        "email": "dean@ltraffic.co.uk"
                      },
                      {
                        "user_id": 12,
                        "name": "Mark Smith",
                        "email": "mark@ltraffic.co.uk"
                      }
                    ]
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            },
            "403": {
              "$ref": "#/components/responses/Forbidden403"
            },
            "404": {
              "$ref": "#/components/responses/NotFound404"
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            }
          }
        }
      },
      "/auth/login": {
        "post": {
          "operationId": "login",
          "tags": [
            "Authentication"
          ],
          "summary": "Log in with username or email",
          "security": [],
          "description": "Authenticates a user against the shared `login_users` table (same table\nthe PHP web app uses).\n\n**Required fields:**\n- `password` — always required (1–200 chars)\n- ONE of `identifier` / `username` / `email` — pick any, all three work\n\n**Optional field:**\n- `deviceId` — a stable device identifier so per-device logout works later\n\n**Response:** returns `accessToken` (15m JWT), `refreshToken` (60-day opaque\ntoken, rotates on every use), and the resolved user profile including\n`userType` — use `userType` to route to Admin or Employee UI.\n\n**Rate limit:** 10 requests per 15 minutes per IP + 10 per account.\n\n**PHP compatibility:** passwords are verified against the MD5 hash stored\nin `login_users.password`. On successful login, a bcrypt cache is lazily\nwritten to `lt_user_credentials` for future performance. PHP is unaffected.\n\n| Scenario | HTTP | Error Code |\n|----------|------|------------|\n| Wrong credentials | 401 | `AUTH_INVALID_CREDENTIALS` |\n| User level disabled | 403 | `AUTH_USER_DISABLED` |\n| Missing/invalid fields | 422 | `VALIDATION_ERROR` |\n| Too many attempts | 429 | `RATE_LIMITED` |\n",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginRequest"
                },
                "examples": {
                  "withFcmToken": {
                    "summary": "Login with FCM token (Android)",
                    "value": {
                      "email": "al@ltraffic.co.uk",
                      "password": "Test@1234",
                      "fcm_token": "fMEP0vJqS0m:APA91bH...",
                      "platform": "android"
                    }
                  },
                  "withEmail": {
                    "summary": "Login with email",
                    "value": {
                      "email": "al@ltraffic.co.uk",
                      "password": "Test@1234",
                      "deviceId": "a1b2c3-d4e5f6"
                    }
                  },
                  "withIdentifier": {
                    "summary": "Login with identifier (preferred)",
                    "value": {
                      "identifier": "admin",
                      "password": "Test@1234",
                      "deviceId": "a1b2c3-d4e5f6"
                    }
                  },
                  "legacyUsername": {
                    "summary": "Legacy username field (PHP-parity)",
                    "value": {
                      "username": "admin",
                      "password": "Test@1234"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Login succeeded — tokens + user profile returned.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/LoginResponse"
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MjA1MjE1NDgsImV4cCI6MTcyMDUyMjQ0OCwiaXNzIjoibHRyYWZmaWMtYXBpIn0.abc123",
                      "accessExpiresIn": "15m",
                      "refreshToken": "3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
                      "refreshExpiresAt": "2026-09-09T11:19:08.706Z",
                      "user": {
                        "id": 1,
                        "username": "admin",
                        "name": "Anthony Louch",
                        "email": "al@ltraffic.co.uk",
                        "ltrafficid": "00001",
                        "team": "director",
                        "levelIds": [
                          1
                        ],
                        "roles": [
                          "Admin"
                        ],
                        "userType": "admin"
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "`AUTH_INVALID_CREDENTIALS` — username/email not found or password wrong.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ApiError"
                  },
                  "example": {
                    "success": false,
                    "error": {
                      "code": "AUTH_INVALID_CREDENTIALS",
                      "message": "Invalid credentials",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                }
              }
            },
            "403": {
              "description": "`AUTH_USER_DISABLED` — the user's level is disabled in `login_levels`.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ApiError"
                  },
                  "example": {
                    "success": false,
                    "error": {
                      "code": "AUTH_USER_DISABLED",
                      "message": "User account is disabled",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                }
              }
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            },
            "429": {
              "$ref": "#/components/responses/RateLimited429"
            }
          }
        }
      },
      "/auth/refresh": {
        "post": {
          "operationId": "refreshToken",
          "tags": [
            "Authentication"
          ],
          "summary": "Rotate a refresh token to get a new access token",
          "security": [],
          "description": "Call this when the `accessToken` expires (after ~15 minutes) or you\nreceive a `401 AUTH_TOKEN_EXPIRED` error on any API call.\n\n**What happens:**\n1. The presented `refreshToken` is revoked (single-use — rotation).\n2. A brand-new `accessToken` + `refreshToken` pair is issued.\n3. Both tokens must replace the old pair in secure storage.\n\n**Mobile flow:**\n```\naccessToken expires → POST /auth/refresh → save new pair → retry failed request\n```\n\n**Important:** if refresh fails with 401, the user's session has ended.\nNavigate to the login screen.\n\n**Rate limit:** 10 requests per 15 minutes per IP.\n\n| Scenario | HTTP | Error Code |\n|----------|------|------------|\n| Token unknown / expired / already used | 401 | `AUTH_REFRESH_INVALID` |\n| Too many attempts | 429 | `RATE_LIMITED` |\n",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RefreshRequest"
                },
                "example": {
                  "refreshToken": "3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "New token pair issued. Old refresh token is now invalid.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/RefreshResponse"
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MjA1MjI0NDgsImV4cCI6MTcyMDUyMzM0OCwiaXNzIjoibHRyYWZmaWMtYXBpIn0.def456",
                      "accessExpiresIn": "15m",
                      "refreshToken": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
                      "refreshExpiresAt": "2026-09-09T11:19:08.706Z"
                    }
                  }
                }
              }
            },
            "401": {
              "description": "`AUTH_REFRESH_INVALID` — token unknown, expired, or already revoked. User must log in again.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ApiError"
                  },
                  "example": {
                    "success": false,
                    "error": {
                      "code": "AUTH_REFRESH_INVALID",
                      "message": "Refresh token is invalid or expired",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                }
              }
            },
            "429": {
              "$ref": "#/components/responses/RateLimited429"
            }
          }
        }
      },
      "/auth/logout": {
        "post": {
          "operationId": "logout",
          "tags": [
            "Authentication"
          ],
          "summary": "Revoke the current refresh token",
          "security": [],
          "description": "Marks the presented refresh token as revoked so it can no longer be used\nfor token rotation. The access token itself is NOT blacklisted — it is\nshort-lived (15m) and will expire naturally.\n\n**Client behaviour after calling this endpoint:**\n1. Discard both tokens from secure storage.\n2. Navigate to the login screen.\n\n**Always returns 200.** The `revoked` boolean indicates whether an active\nrow was actually affected (`false` if the token was unknown or already\nrevoked). This prevents information leakage about session state.\n\n**Restriction:** no `Authorization` header is required — the refresh\ntoken in the body is the only credential needed.\n",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LogoutRequest"
                },
                "example": {
                  "refreshToken": "3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "OK. `revoked` shows whether an active row was affected.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/LogoutResponse"
                  },
                  "examples": {
                    "tokenFound": {
                      "summary": "Token was active and is now revoked",
                      "value": {
                        "success": true,
                        "data": {
                          "revoked": true
                        }
                      }
                    },
                    "tokenUnknown": {
                      "summary": "Token was unknown or already revoked",
                      "value": {
                        "success": true,
                        "data": {
                          "revoked": false
                        }
                      }
                    }
                  }
                }
              }
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            },
            "429": {
              "$ref": "#/components/responses/RateLimited429"
            }
          }
        }
      },
      "/auth/me": {
        "get": {
          "operationId": "getMe",
          "tags": [
            "Authentication"
          ],
          "summary": "Get the current user's profile",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Returns the fresh profile of whoever owns the presented access token.\nUseful for:\n- Restoring session state on app launch (validate stored access token).\n- Refreshing role/team info without needing a full re-login.\n\n**Requires:** `Authorization: Bearer <accessToken>` header.\n\n**Business rule:** profile data is fetched live from `login_users` +\n`login_levels`, so any admin changes to the user's roles or team are\nreflected immediately without re-login.\n\n| Role | Can Access |\n|------|------------|\n| All authenticated users | Yes |\n",
          "responses": {
            "200": {
              "description": "The authenticated user's profile.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/AuthenticatedUser"
                      }
                    }
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "id": 1,
                      "username": "admin",
                      "name": "Anthony Louch",
                      "email": "al@ltraffic.co.uk",
                      "ltrafficid": "00001",
                      "team": "director",
                      "levelIds": [
                        1
                      ],
                      "roles": [
                        "Admin"
                      ],
                      "userType": "admin"
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/Unauthorized401"
            }
          }
        }
      },
      "/auth/change-password": {
        "post": {
          "operationId": "changePassword",
          "tags": [
            "Authentication"
          ],
          "summary": "Change the authenticated user's password",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "description": "Verifies the current password, then updates it. Both fields are required.\n\n**What happens under the hood (transactional):**\n1. Writes the new MD5 to `login_users.password` — so the PHP web app\n   keeps working with the new password immediately.\n2. Rebuilds the bcrypt cache in `lt_user_credentials`.\n3. Revokes ALL outstanding refresh tokens for this user (forces\n   re-login on every other device).\n\n**Requires:** `Authorization: Bearer <accessToken>` header.\n\n**PHP compatibility:** the PHP web app reads `login_users.password`\n(MD5), which is updated in step 1. Both systems always accept the\nsame password.\n\n**Rate limit:** 5 attempts per 15 minutes per authenticated user.\n\n| Scenario | HTTP | Error Code |\n|----------|------|------------|\n| Current password wrong | 401 | `AUTH_INVALID_CREDENTIALS` |\n| New password too short/long | 422 | `VALIDATION_ERROR` |\n| Too many attempts | 429 | `RATE_LIMITED` |\n",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ChangePasswordRequest"
                },
                "example": {
                  "currentPassword": "OldPass1!",
                  "newPassword": "NewPass987!"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Password changed. All other sessions have been logged out.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ChangePasswordResponse"
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "changed": true
                    }
                  }
                }
              }
            },
            "401": {
              "description": "`AUTH_INVALID_CREDENTIALS` — current password was wrong.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ApiError"
                  },
                  "example": {
                    "success": false,
                    "error": {
                      "code": "AUTH_INVALID_CREDENTIALS",
                      "message": "Invalid credentials",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                }
              }
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            },
            "429": {
              "description": "`RATE_LIMITED` — 5 attempts per 15 min per authenticated user.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ApiError"
                  },
                  "example": {
                    "success": false,
                    "error": {
                      "code": "RATE_LIMITED",
                      "message": "Too many requests, please try again later",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/auth/forgot-password": {
        "post": {
          "operationId": "forgotPassword",
          "tags": [
            "Authentication"
          ],
          "summary": "Request a password-reset email",
          "security": [],
          "description": "Writes a reset row into `login_confirm` (same table shape as PHP\n`forgot.class.php`) and — in a later phase — sends the user an email\nwith a reset link containing a 32-char key.\n\n**Anti-enumeration:** always returns `202 Accepted`, whether or not the\nemail exists in the database. The mobile app must NOT tell the user\nwhether the address was valid.\n\n**PHP compatibility:** uses the same `login_confirm` table with\n`type='forgot_pw'` that the PHP forgot-password flow reads.\n\n**Business rules:**\n- Email is trimmed and lowercased before lookup.\n- If the email is not found, no row is written — but 202 is still returned.\n- Multiple requests overwrite the previous reset key.\n\n**Rate limit:** 10 requests per 15 minutes per IP.\n\n| Scenario | HTTP | Error Code |\n|----------|------|------------|\n| Email exists or not | 202 | — (always succeeds) |\n| Email missing/malformed | 422 | `VALIDATION_ERROR` |\n| Too many attempts | 429 | `RATE_LIMITED` |\n",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ForgotPasswordRequest"
                },
                "example": {
                  "email": "user@example.com"
                }
              }
            }
          },
          "responses": {
            "202": {
              "description": "Request accepted (whether the email exists or not).",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ForgotPasswordResponse"
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "requested": true
                    }
                  }
                }
              }
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            },
            "429": {
              "$ref": "#/components/responses/RateLimited429"
            }
          }
        }
      },
      "/auth/reset-password": {
        "post": {
          "operationId": "resetPassword",
          "tags": [
            "Authentication"
          ],
          "summary": "Consume a reset key and set a new password",
          "security": [],
          "description": "Called from the deep-link screen after the user taps the link in the\nforgot-password email.\n\n**What happens (transactional):**\n1. Verifies the 32-char `key` exists in `login_confirm` with `type='forgot_pw'`.\n2. Writes the new MD5 to `login_users.password` (PHP-compatible).\n3. Rebuilds the bcrypt cache in `lt_user_credentials`.\n4. Revokes ALL refresh tokens for that user.\n5. Deletes the `login_confirm` row so the key cannot be reused.\n\n**PHP compatibility:** the new MD5 is written to `login_users.password`\nso the PHP web app immediately accepts the new password.\n\n**Business rules:**\n- The key is single-use — once consumed, it is deleted.\n- If the key is invalid or already used, 400 is returned.\n- All sessions are terminated (refresh tokens revoked).\n\n**Rate limit:** 10 requests per 15 minutes per IP.\n\n| Scenario | HTTP | Error Code |\n|----------|------|------------|\n| Key invalid / used / user deleted | 400 | `BAD_REQUEST` |\n| Validation failure | 422 | `VALIDATION_ERROR` |\n| Too many attempts | 429 | `RATE_LIMITED` |\n",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResetPasswordRequest"
                },
                "example": {
                  "key": "87762735f29ba5aab8244d47ef37fd7f",
                  "newPassword": "BrandNew1!"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Password reset. User must log in again with the new password.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ResetPasswordResponse"
                  },
                  "example": {
                    "success": true,
                    "data": {
                      "reset": true
                    }
                  }
                }
              }
            },
            "400": {
              "description": "`BAD_REQUEST` — key invalid, already used, or user no longer exists.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ApiError"
                  },
                  "example": {
                    "success": false,
                    "error": {
                      "code": "BAD_REQUEST",
                      "message": "Reset key is invalid or has already been used",
                      "details": null,
                      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    }
                  }
                }
              }
            },
            "422": {
              "$ref": "#/components/responses/ValidationError422"
            },
            "429": {
              "$ref": "#/components/responses/RateLimited429"
            }
          }
        }
      }
    }
  },
  "customOptions": {
    "defaultModelsExpandDepth": -1,
    "docExpansion": "none"
  }
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
