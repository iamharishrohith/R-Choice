# R-Choice

> A multi-role internship and placement workflow platform for Rathinam College.

R-Choice brings students, faculty approvers, administrators, and company partners onto one platform. It handles the full internship lifecycle: profile building, job discovery, applications, approval routing, company workflows, and placement visibility.

## Why This Project Exists

Internship and placement operations usually get split across forms, spreadsheets, email threads, and manual follow-ups. R-Choice centralizes that process into a single system with role-aware dashboards and approval queues.

Core goals:

- Give students a clear path from profile completion to application tracking.
- Give tutors, coordinators, HODs, deans, placement officers, and principals structured approval workflows.
- Give companies a dedicated portal to register, post roles, and review applicants.
- Give the placement cell better visibility into approvals, jobs, students, and outcomes.

## Experience Overview

### Student

- Build a professional profile with skills, certifications, projects, and links.
- Browse approved internship opportunities.
- Apply to jobs and monitor application status.
- Trigger internship request flows tied to approval routing.

### Staff and Admin

- Review approval queues based on institutional hierarchy.
- Manage student workflows at tutor, coordinator, HOD, dean, placement officer, and principal levels.
- Track applications, companies, jobs, and placement activity through dashboards.

### Company Partner

- Register and maintain company information.
- Post internship roles.
- Review applicants and participate in hiring workflows.

## Role Matrix

| Role | Purpose |
| --- | --- |
| Student | Apply for internships, manage profile, track applications |
| Tutor | Tier 1 approval flow |
| Placement Coordinator | Tier 2 approval flow |
| HOD | Department-level approval |
| Dean | Admin approval |
| Placement Officer | Placement oversight and approvals |
| Principal | Final-level approval visibility |
| Company | Company registration and hiring portal |

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, App Router, CSS Modules |
| Auth | NextAuth credentials provider |
| Database | PostgreSQL via Neon |
| ORM | Drizzle ORM |
| File / Media | Cloudinary |
| Email | Nodemailer (SMTP) |
| Charts / UI | Recharts, Lucide, Framer Motion |
| Testing | Playwright |

## Notable Product Areas

- Multi-role login and dashboard routing
- Student profile builder
- Internship and job application workflows
- Institutional approval chain
- Company onboarding and job posting
- Admin analytics and operational dashboards
- Email-assisted verification flows

## Project Structure

```text
src/
  app/
    (dashboard)/        Role-based dashboard pages
    actions/            Server actions for auth, jobs, approvals, profile, admin
    api/                Upload and app APIs
  components/           Reusable UI and dashboard components
  lib/
    auth.ts             NextAuth configuration
    db/                 Drizzle schema, queries, seeds, and utilities
    cloudinary.ts       Media configuration
    mail.ts             SMTP mail helpers
e2e/                    End-to-end Playwright tests
scripts/                Utility and validation scripts
drizzle/                Database migration artifacts
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` and set the values your environment needs.

Typical variables used by the app:

```env
DATABASE_URL=
AUTH_SECRET=
AUTH_TRUST_HOST=true

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test Accounts for Local Validation

The seeded local accounts use a shared password:

```text
R-Choice@2025
```

| Role | Email |
| --- | --- |
| Student | `student@rathinam.edu.in` |
| Tutor | `tutor@rathinam.edu.in` |
| Placement Coordinator | `pc@rathinam.edu.in` |
| HOD | `hod@rathinam.edu.in` |
| Dean | `dean@rathinam.edu.in` |
| Placement Officer | `po@rathinam.edu.in` |
| Principal | `principal@rathinam.edu.in` |
| Company Partner | `hr@techcorp.com` |

Seed source:

- [`src/lib/db/seed-test-accounts.ts`](./src/lib/db/seed-test-accounts.ts)

## Validation Commands

```bash
npm run lint
npx tsc --noEmit
npm run build
npx playwright test
```

Focused suites used during validation:

```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/applications.spec.ts
npx playwright test e2e/full-pipeline.spec.ts
```

## Current Validation Snapshot

Recent validation work confirmed:

- TypeScript buildability with `npx tsc --noEmit`
- Production build completion with `npm run build`
- Authentication flow coverage in Playwright
- Student application flow coverage in Playwright
- Full company-to-approval pipeline coverage in Playwright

Note:

- Repo-wide ESLint cleanup is still an ongoing quality task if you want a fully lint-clean codebase.

## Security and Platform Notes

- Security headers are configured in `next.config.ts`.
- Cloudinary remote images are explicitly allowed through Next image config.
- Authentication includes role-aware credential checks and lockout tracking.
- SMTP sending is safe in development when mail credentials are absent.

## Roadmap Ideas

- Finish repo-wide lint remediation
- Add CI validation for auth, applications, and pipeline suites
- Add seed/reset utilities for deterministic test environments
- Expand role-based audit logging and reporting

## Contributing

If you are extending the project, prefer validating changes with:

1. `npx tsc --noEmit`
2. `npm run build`
3. Targeted Playwright coverage for the affected workflow

## Credits

Built for Rathinam College internship and placement operations, with a product direction centered on clarity, operational control, and a better student-to-company workflow.
