# Functional Requirements Document (FRD)
**Project Name:** Indian Payroll Management System
**Document Version:** 1.0

---

## 1. System Architecture Overview
The application is built using React (Vite) as the frontend with a Supabase PostgreSQL backend. It utilizes purely client-side compilation techniques for dynamic payroll formulas (`payrollEngine.js`) combined with scalable database retrievals. 

---

## 2. Core Modules & Functionalities

### 2.1 The Payrun Orchestration Module (`PayrollOpsTab`)
This orchestrator follows a strict 5-Step linear progression that tracks the lifecycle of a monthly payout.
- **FR.1.1 Initiation (Step 1):** The user selects the Month, Year, and filterable employees. The system must render a data grid of the selected roster.
- **FR.1.2 Review & Adjust (Step 2):** The system must allow HR to apply inline LOP (Loss of Pay) days, overtime amounts, and ad-hoc arrears. The net basic and allowances must be automatically prorated downstream.
- **FR.1.3 Tax Check (Step 3):** Displays an analytical grid contrasting standard gross against TDS. Highlights any employee lacking an IT declaration.
- **FR.1.4 Confirmation (Step 4):** A hard lock. Triggers a bulk `upsert` array to the Supabase `payroll_records` database, persisting all metadata natively. Post-confirmation, modifications are blocked.
- **FR.1.5 Post-Payrun Actions (Step 5):** Unlocks the generation of Payslips (PDFs), EPF electronic ECR text files, ESI CSV templates, and Bank batch headers.

### 2.2 Employee Self-Service Portal (`EmployeePortal`)
- **FR.2.1 Unified View:** The employee must log in and be presented with sections specifically gated by dynamic company windows (e.g., "Reimbursement Window Open").
- **FR.2.2 IT Declarations:** Employees can declare anticipated investments for Chapter VI-A (80C, 80D, 80CCD), Home Loan Sec 24, and HRA (Rent) for the active FY.
- **FR.2.3 Proof Upload Engine:** Required attachments are verified and securely hosted on Supabase Storage. Unverified inputs display dynamically.
- **FR.2.4 Reimbursement Dynamics:** Only reimbursement components existing inside the specific employee's `salary_structure` array are displayed for claim input.

### 2.3 Finance Verification Dashboard (`FinanceVerificationTab`)
- **FR.3.1 Declaration Queuing:** Collates all `submitted` tickets from employees.
- **FR.3.2 Deep Validation Capping (Auto-Logic):**
  - **80C Filter:** Any incoming value > ₹1,50,000 must be auto-clamped to ₹1,50,000 prior to Verification.
  - **80D Parents:** If the "Senior Citizen" flag is checked, the cap translates to ₹50,000. If unchecked, it auto-restricts the parent bucket to ₹25,000.
  - **Sec 24 Filter:** Clamped to ₹2,00,000 natively.
- **FR.3.3 Approval Mechanics:** Clicking "Approve" moves the verified data to `verified_data` inside Supabase, locking it for the downstream payroll engine. The employee sees a green "Verified ✓" badge.

### 2.4 Payroll Matrix Configurator (`PayrollMatrix`)
- **FR.4.1 State Matrices:** Admins can iterate over the 36 States & UTs to assign boolean compliance settings (`isEnabled`) for LWF and PT logic.
- **FR.4.2 Category Configs:** Defines system definitions for earnings, statutory variables, and categorical formulas.

---

## 3. Data Flow & Security Rules (Supabase)
### 3.1 Role Level Security (RLS)
- **Employees table:** Accessible deeply by HR & Finance profiles. End-users can deeply query only where `auth.uid() = id`.
- **Submissions table:** Verification constraints ensuring an HR user cannot modify the `verified_data` columns, only Finance administrators possess that CRUD privilege. 

### 3.2 State Object Interfacing
The `payrollEngine` expects a fully-formed `[emp]` object containing:
- `work_state`: ISO code determining local matrix.
- `tax_regime`: `old` / `new`.
- `salary_structure`: Array holding component objects `{ type, amount, taxSchedule }`.
- `lop_days`: Extracted dynamically upstream from the specific Payrun state.

---

## 4. Edge Case Handling Requirements
- **FR.6.1 Negative Net Salary:** If statutory deductions (PF, TDS, PT) exceed the gross pay due to high LOP, the net pay defaults strictly to `0`, generating a warning tag.
- **FR.6.2 Late Joiners:** Proration must adjust default 30/31 day math dynamically to represent joined elapsed time in the first month.
