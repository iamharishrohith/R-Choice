# InternFlow Reconstruction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute a comprehensive architectural reconstruction of the InternFlow platform to support an end-to-end multi-authority approval workflow, dynamic company onboarding, and granular role-based management.

**Architecture:** The reconstruction involves updating the Drizzle ORM schema to support deep hierarchical approvals (including a new COE tier) and complex company registration data. We will wrap critical state transitions in transaction blocks, introduce server-side pagination for scalability, and refactor the DashboardShell to dynamically route 12+ specific role experiences. We will also integrate FCM push notifications via Capacitor.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM, Neon Postgres, NextAuth v5, Capacitor JS, Tailwind CSS / CSS Modules.

---

## Phase 1: Security Baseline & Middleware Hardening

### Task 1: Fix SQL Injection in User Management
**Files:**
- Modify: `src/app/(dashboard)/users/page.tsx`
- Modify: `src/app/(dashboard)/companies/page.tsx`

**Step 1: Write minimal implementation**
Replace direct template literal queries in the `deleteUser` and `deleteCompany` server actions with parameterized Drizzle queries or `sql` tags to eliminate SQL injection vectors.

**Step 2: Commit**
```bash
git add src/app/\(dashboard\)/users/page.tsx src/app/\(dashboard\)/companies/page.tsx
git commit -m "fix: resolve critical SQL injection vulnerabilities in management actions"
```

### Task 2: Middleware Relocation & RBAC Coverage
**Files:**
- Move & Modify: `src/proxy.ts` to `src/middleware.ts` (or root `middleware.ts`)

**Step 1: Write minimal implementation**
Rename `proxy.ts` to `middleware.ts` in the correct location (root or `src/`). Update the RBAC configuration map within the middleware to explicitly protect all routes for the expanded 12+ roles (including COE, PH, MCR).

**Step 2: Commit**
```bash
git mv src/proxy.ts src/middleware.ts
git commit -m "chore: relocate middleware and expand RBAC configuration"
```

---

## Phase 2: Schema Expansion

### Task 3: Expand Company Registration Schema
**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Write minimal implementation**
Update `companyRegistrations` to include: `company_description`, `COI`, `GSTIN`, `PAN`, and CEO fields (`ceo_name`, `ceo_designation`, `ceo_email`, `ceo_phone`, `ceo_linkedin`, `ceo_portfolio`, `id_proof`). Add internship preference fields: `internship_type`, `domains`, `duration`, `stipend_range`, `hiring_intention`.
Create new tables: `company_registration_links` (for MCR dynamic invites) and `company_staff`.

**Step 2: Commit**
```bash
git add src/lib/db/schema.ts
git commit -m "feat(db): expand company registration schema for dynamic onboarding"
```

### Task 4: Expand Job Posting & Tracking Schema
**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Write minimal implementation**
Update `jobPostings` to include: `domain`, `responsibilities`, `learnings`, `mandatory_skills`, `preferred_skills`, `tools`, `eligibility_degree`, `perks`, `faq`, `contact_persons`.
Create new tables: `selection_process_rounds` (tracking student progress) and `approval_escalations` (SLA tracking).

**Step 2: Commit**
```bash
git add src/lib/db/schema.ts
git commit -m "feat(db): expand job postings and selection process tracking schema"
```

---

## Phase 3: Deep Hierarchy & Approvals Overhaul

### Task 5: Add COE to Approval Tier Chain
**Files:**
- Modify: `src/app/actions/approvals.ts`
- Modify: `src/lib/db/schema.ts` (Enum updates if necessary)

**Step 1: Write minimal implementation**
Update `TIER_CHAIN` array in `approvals.ts` to insert the COE stage between PO and Principal. Ensure status transition logic respects this new tier.

**Step 2: Commit**
```bash
git add src/app/actions/approvals.ts src/lib/db/schema.ts
git commit -m "feat: integrate COE into the approval tier chain"
```

### Task 6: Transactional Approval Actions
**Files:**
- Modify: `src/app/actions/applications.ts`

**Step 1: Write minimal implementation**
Wrap the core approval transition logic in Drizzle `db.transaction()` blocks to ensure atomic updates between `internshipRequests`, `approvalLogs`, and `notifications`.

**Step 2: Commit**
```bash
git add src/app/actions/applications.ts
git commit -m "fix: ensure transaction atomicity for approval actions"
```

---

## Phase 4: Dynamic Company Onboarding

### Task 7: MCR Link Generation Action
**Files:**
- Create: `src/app/actions/mcr.ts`

**Step 1: Write minimal implementation**
Implement a server action for MCRs to generate secure, time-expiring registration URLs using a token stored in `company_registration_links`.

**Step 2: Commit**
```bash
git add src/app/actions/mcr.ts
git commit -m "feat: implement dynamic company registration link generation"
```

### Task 8: Company Approval & Cascading Notifications
**Files:**
- Modify: `src/app/actions/mcr.ts`

**Step 1: Write minimal implementation**
Implement the action for MCR to approve a company registration. Upon approval, generate the CEO credentials and dispatch notifications to the PO, Dean, PH, COE, and Principal using the notification system.

**Step 2: Commit**
```bash
git add src/app/actions/mcr.ts
git commit -m "feat: implement company approval with cascading notifications"
```

---

## Phase 5: Dashboards & UI Extraction

### Task 9: Extract Dashboard Navigation
**Files:**
- Modify: `src/components/dashboard/DashboardShell.tsx`
- Create: `src/config/navigation.ts`

**Step 1: Write minimal implementation**
Extract the massive navigation logic from `DashboardShell.tsx` into a separate configuration file (`navigation.ts`) mapping the 12 roles to their allowed routes and sidebar items. Refactor `DashboardShell.tsx` to render dynamically based on this config.

**Step 2: Commit**
```bash
git add src/components/dashboard/DashboardShell.tsx src/config/navigation.ts
git commit -m "refactor: extract navigation config from DashboardShell"
```

### Task 10: Server-Side Pagination
**Files:**
- Modify: `src/app/(dashboard)/users/page.tsx`
- Modify: `src/app/(dashboard)/companies/page.tsx`

**Step 1: Write minimal implementation**
Refactor the data fetching in list pages to use Drizzle's `.limit()` and `.offset()` instead of fetching all records and filtering arrays in-memory. Add standard pagination UI components.

**Step 2: Commit**
```bash
git add src/app/\(dashboard\)/users/page.tsx src/app/\(dashboard\)/companies/page.tsx
git commit -m "perf: implement server-side pagination for management lists"
```
