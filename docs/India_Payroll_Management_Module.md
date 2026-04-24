# India Payroll Management Module — HRMS Design Reference
### Comprehensive Guide: Modules, Components, Statutory Rules & State-wise Compliance

**Document Version:** 2.0 | **Last Updated:** April 24, 2026 | **FY Reference:** 2025–26  
**Application:** Payroll Traceability Matrix | **Backend:** Supabase (PostgreSQL + RLS) | **Frontend:** React (Vite)

## TABLE OF CONTENTS

1. [Module & Sub-module Architecture](#1-module--sub-module-architecture)
2. [The Indian Payroll Process — End to End](#2-the-indian-payroll-process--end-to-end)
3. [Statutory Framework Overview](#3-statutory-framework-overview)
4. [Exhaustive Payroll Component Library](#4-exhaustive-payroll-component-library)
   - 4.1 Earnings Components
   - 4.2 Statutory Deductions
   - 4.3 Employer Statutory Contributions (CTC elements)
   - 4.4 Reimbursement Components
   - 4.5 Special & One-time Components
5. [Formulas for All Calculations](#5-formulas-for-all-calculations)
6. [State-wise Professional Tax Slabs](#6-state-wise-professional-tax-slabs)
7. [State-wise Labour Welfare Fund (LWF)](#7-state-wise-labour-welfare-fund-lwf)
8. [State-wise Minimum Wages (Overview)](#8-state-wise-minimum-wages-overview)
9. [TDS & Income Tax — New vs Old Regime](#9-tds--income-tax--new-vs-old-regime)
10. [Commonalities & Differences Across States](#10-commonalities--differences-across-states)
11. [Traceability Matrix — Component × State](#11-traceability-matrix--component--state)
12. [Payroll Operations Module — As Implemented](#12-payroll-operations-module--as-implemented)
13. [Salary Status Management & Exit Lifecycle](#13-salary-status-management--exit-lifecycle)
14. [System Prerequisites & Assumptions](#14-system-prerequisites--assumptions)

---

## 1. Module & Sub-module Architecture

### 1.1 Employee & Compensation Master
**Purpose:** Central repository of all employee and pay-related static data.

**Sub-modules:**
- **Employee Profile**: Personal info, joining date, employment type (regular, contract, probation), cost centre, department, location/state mapping
- **Pay Grade & Band Management**: Grade structures, pay bands (min/max/mid-point), increment policies
- **CTC Structuring Engine**: CTC-to-component breakdown rules, flexi-basket configuration, annual CTC revision workflows
- **Salary History**: Effective-date-based salary records for every revision
- **Bank Account Management**: Primary and secondary bank accounts, IFSC, MICR, multi-bank disbursement splits
- **Nominee & PF Management**: PF UAN linking, nominee records, Form 2 data
- **Document Vault**: PAN, Aadhaar, passbook, form submissions (12BB, etc.)

---

### 1.2 Pay Structure & Component Configuration
**Purpose:** Configure what components exist, how they are calculated, their tax treatment, and their statutory linkage.

**Sub-modules:**
- **Component Library**: Creation of earning heads, deduction heads, employer contribution heads, reimbursement heads; type (fixed/variable/formula-driven), frequency (monthly/quarterly/annual/on-event)
- **Formula Builder**: No-code formula editor linking components (e.g., HRA = 40% of Basic); support for conditional logic (metro/non-metro, grade, location)
- **Tax Configuration**: Map components to Income Tax Act sections; taxable/partially-exempt/fully-exempt flags; Old-regime and New-regime treatment
- **Pay Template Management**: Assign component sets to grades/employee groups
- **Statutory Limits Repository**: Maintain statutory thresholds (PF ceiling ₹15,000; ESI ceiling ₹21,000; Bonus Act limits; etc.) with effective-date versioning

---

### 1.3 Attendance & Leave Integration
**Purpose:** Feed actual worked-days/hours into payroll to handle LOP, OT, and arrears.

**Sub-modules:**
- **Attendance Import**: Integration with biometric/HRMS attendance systems; daily/weekly upload, exception handling
- **Leave Ledger Sync**: Approved leave, LOP (Loss of Pay), encashable leave balances
- **LOP Calculation Engine**: Calendar-day proration: `attendanceFactor = (daysInMonth - lopDays) / daysInMonth`. Applied to Basic, HRA, and Special Allowance.
- **Overtime (OT) Engine**: OT rate by employee type (double rate for factories per Factories Act); shift-differential rules. Computed as `overtimePay = overtimeHours × otRate`.
- **Working Days Calendar**: Holiday master (national, state, company-specific), shift roster integration
- **Arrear Computation**: Multi-entry arrear engine with per-entry: Historical Month, Historical Gross, Month Days, and Arrear Days. Automatic clamping: `acceptedDays = min(requestedDays, min(historicalMonthDays, currentPaidDays))`. Component-wise proportional breakup of arrears across Basic, HRA, and Special Allowance. Display mode configurable as `consolidated` or `breakup` with per-step visibility (`review`, `tax`, `slip`).
- **Leave Encashment**: Computed as `(standardGross / 26) × encashmentDays`. Retirement leave encashment exempt up to ₹25 lakh under Section 10(10AA).

---

### 1.4 Payroll Processing Engine
**Purpose:** The core monthly computation engine. All computations are performed client-side by a deterministic JavaScript engine (`payrollEngine.js`). No server-side computation layer.

**Sub-modules:**
- **Payroll Lock & Control**: 6-stage lifecycle: `draft` → `initiated` → `reviewed` → `tax_checked` → `confirmed` → `completed`. Post-finalization unlock with mandatory audit-reason workflow (append-only `audit_logs` JSONB on payruns table).
- **Pay-run Configuration**: Single/multi-entity payroll, payroll frequency (monthly, bi-monthly, weekly for piece-rate workers)
- **3-Pass Component Resolution**:
  - **Pass 1 — Numeric Resolution**: Convert each component amount to a number. If `inputMode = 'annual'`, divide by 12.
  - **Pass 2 — Formula Evaluation**: Resolve formula-based components (e.g., `basic * 0.40` for HRA) using the pre-calculated scopeBasic.
  - **Pass 3 — Statutory Hydration**: For EPF, ESIC, PT, and LWF components with blank amounts, auto-calculate using appropriate statutory rules based on state, gross, and EPF method.
- **Earning Computation**: Gross calculation considering LOP proration, overtime, arrears (multi-entry with clamping), variable pay (per-component payouts), and leave encashment.
- **Deduction Computation**: All statutory deductions (EPF, ESI, PT, LWF), custom employee deductions from salary structure, and manual ad-hoc deductions entered at Step 2.
- **Net Pay Computation**: `netPay = grossSalary - (pfEmployee + esiEmployee + pt + lwf + employeeDeductions + tds) + (reimbursements if year-end strategy)`. All monetary values rounded to nearest integer.
- **Negative Pay Handling**: Exit TDS auto-cap: if `tds > netPayBeforeTDS`, TDS is capped to `max(0, netPayBeforeTDS)` with validation warning.
- **Salary Status Filtering**: Engine performs a "Pass 0" check: employees with `salary_status = 'withheld'` or `'absconding'` return a zeroed-out payroll result with `salaryWithheld = true`.
- **Supplementary Payroll**: Mid-month/off-cycle runs for bonuses, final settlements, arrears
- **Multi-currency Support**: For expats/deputed employees

---

### 1.5 Statutory Compliance Engine
**Purpose:** Automatically compute and manage all statutory obligations.

**Sub-modules:**
- **PF/EPF Module**: 
  - EPF, EPS, EDLI computation per employee
  - PF ECR (Electronic Challan cum Return) generation
  - UAN management, Form 3A, 6A, 12A generation
  - VPF (Voluntary PF) handling
  - PF Transfer (Form 13) and Withdrawal support
- **ESI Module**:
  - ESI contribution computation (employee + employer)
  - ESI half-yearly returns (Form 5)
  - IP (Insured Person) registration
  - ESI threshold crossing management (once covered, continue for full 6-month contribution period)
- **Professional Tax Module**:
  - State-detection logic per employee (work location state)
  - Slab-based computation per state
  - Frequency logic (monthly/quarterly/half-yearly/annual)
  - PT returns and enrollment management
- **Labour Welfare Fund Module**:
  - State-specific LWF computation
  - Contribution frequency (annual/semi-annual/monthly)
  - LWF remittance tracking
- **Gratuity Module**:
  - Eligibility tracking (5+ years service)
  - Actuarial provision computation
  - Gratuity Trust integration
  - Form I (Gratuity claim), Form F (Nomination)
- **Bonus Module (Payment of Bonus Act)**:
  - Eligibility determination (₹21,000 wage ceiling)
  - Allocable surplus computation
  - Min/max bonus calculation
  - Bonus disbursement accounting
- **Minimum Wages Compliance**:
  - State and category-wise minimum wage master
  - Breach alerts when salary falls below minimum wage
  - Scheduled employment identification

---

### 1.6 Tax (TDS) Management
**Purpose:** Compute monthly TDS, manage declarations, and file returns.

**Sub-modules:**
- **Tax Regime Selection**: Employee-wise Old/New regime choice (default: New regime FY 2025-26 onwards). Regime can be overridden per-payrun per-employee at Step 2 without modifying the master record.
- **Investment Declaration (Form 12BB)**: Capture HRA, LTA, Section 80C-80U proofs; provisional and final declarations. Employee portal integration for self-service submission with proof file uploads. Finance Verification Dashboard for approval/rejection workflow. Verified declarations auto-populate tax override fields at Step 2.
- **Tax Projection Engine**: Monthly recalculation of annual taxable income; dynamic TDS spreading. Annual Gross projected as `ytdGross + currentGross + (standardGross × futureMonths)`. Exit date caps future months using `ceil((exitDate - payrollStart) / 30)`.
- **YTD Aggregation**: Auto-fetches historical TDS and gross from prior confirmed/completed payruns within the same FY (April–March). Aggregated fields: ytdGross, ytdBasic, ytdHRA, ytdNetPay, ytdTotalDeductions, tdsDeductedSoFar.
- **HRA Exemption (Old Regime)**: Three-way minimum: `min(Actual HRA, Rent - 10% Basic, 50%/40% Basic)`. Metro cities: Mumbai, Delhi, Kolkata, Chennai (50% of Basic). Non-metro: 40%.
- **Chapter VI-A Capping**: 80C capped at ₹1,50,000; 80D Self at ₹25,000; 80D Parents at ₹25,000 (₹50,000 if senior citizen); NPS 80CCD(1B) at ₹50,000; Home Loan Interest at ₹2,00,000.
- **Monthly TDS Formula**: `tds = max(0, annualTax - tdsDeductedSoFar) / effectiveMonthsRemaining`.
- **Proof Verification Module**: Upload investment proofs, HR verification workflow, mismatch handling
- **Perquisite Valuation**: Accommodation (as per rules), car, ESOP, soft furnishing, meals etc.
- **Form 16 Generation**: Part A (TDS certificate) and Part B (tax computation); digital signing
- **eTDS Return Filing**: Form 24Q preparation, quarterly filing to TRACES/TIN-NSDL
- **Salary Revision TDS Impact**: Recalculate TDS on mid-year salary changes
- **Exit Employee TDS**: Final tax settlement with TDS auto-cap to prevent negative net pay, issue of Form 16 within 60 days

---

### 1.7 Reimbursements & Claims
**Purpose:** Manage claim-based disbursements (separate from regular salary).

**Sub-modules:**
- **Claim Policy Configuration**: Component-wise limits, eligible employee groups, document requirements. Reimbursement window enabled/disabled via Company Settings toggle.
- **Employee Self-Service Portal**: Employees submit claims from within the Employee Portal. The portal dynamically loads only reimbursement components present in the employee's specific salary structure. Claim form includes amount input and proof file upload for each applicable component. Submissions stored in `employee_submissions` table with `type = 'reimbursement'`.
- **Finance Verification Dashboard**: Finance team reviews submitted claims with side-by-side view of declared vs. allowable amounts. Approve/reject workflow populates `verified_data` which feeds into payrun computation. Auto-capping against annual component limits (derived from salary breakup: if `inputMode = 'monthly'`, multiply by 12 for annual limit display; if `inputMode = 'annual'`, use as-is).
- **Reimbursement Tax Strategy**: Two strategies supported — `monthly` (reimbursements included in monthly gross and taxed) and `year_end` (reimbursements excluded from gross and added to net pay). Default: `year_end`.
- **Approval Workflow**: Manager → Finance → HR; auto-approve below threshold
- **Proof Validation**: Bill date vs. claim period matching, duplicate detection
- **Tax Treatment Engine**: Classify each reimbursed amount as exempt/taxable; add taxable amount to gross for TDS
- **LTA Claim Module**: 2-journey-in-4-year block tracking, transport mode validation, eligible family member tracking
- **Flexi Benefit Plan (FBP)**: Employee selects components at start of year; monthly credit and end-year settlement

---

### 1.8 Loans & Advances
**Purpose:** Track salary advances, employee loans, and their recovery through payroll.

**Sub-modules:**
- **Loan Types**: Salary advance, emergency loan, vehicle loan, housing loan, personal loan (company policy-based)
- **Loan Sanction Workflow**: Application → Manager → Finance → Disbursement
- **EMI Computation**: Principal + interest (simple/compound); schedule generation
- **Automatic Recovery**: Recovery linked to payroll; skip-month logic; pre-close option
- **Interest Perquisite**: Concessional loan interest taxable as perquisite (SBI PLR - company rate)
- **Outstanding Balance Tracking**: Real-time ledger per employee

---

### 1.9 Full & Final Settlement (FnF)
**Purpose:** Process exit payroll comprehensively and accurately.

**Sub-modules:**
- **Exit Trigger**: Resignation accepted, termination, retirement, superannuation. Exit date (`exit_date`) and exit reason (`exit_reason`) stored on the employee record.
- **Salary Status Management**: Employee `salary_status` field supports: `active` (normal), `withheld` (salary stopped — e.g., pending investigation), `absconding` (AWOL — salary stopped), `fnf_pending` (exit processing in progress — salary computes normally with advisory flag).
- **FnF Component Computation**:
  - Salary for days worked in exit month (LOP proration via attendanceFactor)
  - Earned leave encashment: `(standardGross / 26) × encashmentDays`
  - Retirement leave encashment exemption: up to ₹25 lakh under Section 10(10AA)
  - Gratuity (if 5+ years; or death/disablement)
  - Bonus (proportional to months worked in bonus year)
  - LTA (if eligible and not claimed)
  - Notice period recovery or pay-in-lieu
  - Reimbursement settlement
  - Loan recovery (balance outstanding)
- **Exit Tax Projection**: When `exit_date` is set, the engine caps future months for tax projection using `ceil((exitDate - payrollStartDate) / 30)`. This ensures tax is spread only over the remaining employment period, not the full FY.
- **TDS Auto-Cap Validation**: If computed TDS for an exiting employee exceeds net pay before TDS, the engine auto-caps TDS to `max(0, netPayBeforeTDS)` and pushes a validation warning.
- **Relieving & Experience Letter Linkage**: Block FnF till No-Objection clearances obtained
- **PF Transfer / Withdrawal**: Initiation of Form 19 (PF withdrawal) or Form 13 (transfer)
- **ESI Final Claim**: Coverage period ends; member card continuity info
- **Income Tax Settlement**: Final TDS for the financial year up to exit; revised Form 16
- **FnF Approval & Payment**: Multi-level approval; bank transfer; payslip generation
- **Statutory Timeline Compliance**: Gratuity within 30 days; FnF as per state shops & establishments norms

---

### 1.10 Payslip, Reports & Analytics
**Purpose:** Statutory and management reporting, payslip generation.

**Sub-modules:**
- **Payslip Generation**: Employee-wise salary slips rendered with: company header & address, employee details grid (8 fields), attendance summary row (Days in Month / Days Paid / LOP / OT), earnings table, deductions table, and Net Pay take-home banner. Supports configurable YTD column (`showYTDOnPayslip` toggle in Company Settings), arrear breakup display (`arrearDisplayMode = 'breakup'` with `slip` visibility), and variable/incentive breakup (`incentiveDisplayMode = 'breakup'`). Employer contributions (PF, ESIC) shown as informational, not deducted from take-home.
- **Bulk Distribution**: Department and Work State (Location) dropdown filters for targeted publishing. "Publish Filtered" button publishes all slips matching current filters. **Excel Upload Targeting**: Upload `.xlsx` file with `EMP_CODE` column to publish matching employee slips. "Download All" exports multi-sheet Excel workbook (one sheet per employee). Browser print dialog for individual slip printing/PDF.
- **MIS Reports**: Head-count cost, department-wise salary, variance (month-on-month), attrition cost
- **Statutory Reports**: 
  - PF: EPF ECR v2 text file (`UAN #~# Gross #~# EE(12%) #~# EPS(8.33%) #~# EPF-ER(3.67%)`)
  - ESI: ESIC Return text file (`IP Number | Days Worked | Gross | EE 0.75% | ER 3.25%`)
  - PT: **State-wise ZIP archive** — employees grouped by `work_state`, each state exported as a separate XLSX within the ZIP
  - LWF: **State-wise ZIP archive** — same grouping as PT
  - TDS: TDS 24Q pre-fill Excel (PAN, Name, Gross, Annual Tax, Monthly TDS, Regime)
  - Bank Transfer: CSV in bank-specific formats (HDFC, ICICI, SBI, Axis, Generic)
  - Payroll Register: 22-column comprehensive XLSX with all earnings, deductions, and employer contributions
  - Bonus: Form A (register), Form B (set-on/set-off), Form C (payment register)
  - Gratuity: Form A (notice of opening), Form F (nomination)
  - Minimum Wages: Form IV (wage register), Form V (overtime register)
- **Audit Trail**: Payrun-level append-only audit logs (`audit_logs` JSONB array on `payruns` table). Each entry records: action type, reason text, user identity, ISO timestamp. Used for unlock/correction tracking. Cannot be deleted through the UI.
- **Analytics Dashboard**: Cost per hire, CTC-to-net ratio, statutory liability trends, upcoming compliance deadlines

---

### 1.11 Integration Layer
**Purpose:** Connect payroll with other systems.

**Sub-modules:**
- **HRMS Core Integration**: Employee lifecycle events trigger payroll actions
- **Accounting/ERP Integration**: Salary journal entries; cost-centre-wise GL posting; PFMS/SAP/Tally connectors
- **Attendance System Integration**: Biometric, mobile apps, access control systems
- **Banking Integration**: NEFT/RTGS bulk payment file generation (bank-specific formats: SBI, HDFC, ICICI, Axis, etc.)
- **Government Portal Integration**: EPFO unified portal, ESIC portal, MCA, TRACES
- **Webhook/API Gateway**: Real-time event notifications to connected systems

---

## 2. The Indian Payroll Process — End to End

### Phase 1: Pre-Payroll (Days 1–15 of Processing Month)

**Step 1 — Payroll Calendar Setup**
Define payroll period (usually calendar month), payment date (typically 1st–7th of following month), and cut-off date for inputs.

**Step 2 — Employee Data Freeze**
- Lock employee master for all changes effective in current month
- Capture all new joiners with DOJ, salary structure, PAN, bank details
- Update exits with LWD (Last Working Day)
- Capture promotion/revision effective dates within the month

**Step 3 — Attendance & Leave Data Collection**
- Receive attendance from biometric/HRMS systems
- Reconcile exceptions: late marks, regularisation, WFH adjustments
- Finalise approved leaves, LOP days, half-days
- Validate overtime hours; get OT approval from managers

**Step 4 — Variable Pay Inputs**
- Receive incentive/commission/performance bonus data from Sales/Line managers
- Receive shift allowance, special allowances for the month
- One-time payments: referral bonus, retention bonus, project completion bonus

**Step 5 — Reimbursement Processing**
- Close claim submissions for the month (cut-off usually 20th of month)
- Complete approval workflow
- Validate bills; classify taxable/exempt amounts
- Feed approved amounts into payroll

**Step 6 — Investment Declaration Update**
- Mid-year: Update if employee has submitted revised declaration
- Year-end (Jan–Mar): Final proof collection and TDS adjustment

---

### Phase 2: Payroll Processing (Days 16–22)

**Step 7 — Gross Salary Computation**
For each employee:
```
Monthly Gross = Sum of all earning components × (Actual Days / Calendar Days)
             + Variable Pay inputs
             - LOP adjustment (Daily Rate × LOP days)
             + Arrears (if applicable)
```
Where: `Daily Rate = Monthly Gross / Number of working days in that month`

**Step 8 — Statutory Deduction Computation**
- **PF**: Compute on Basic + DA (capped at ₹15,000 or actual, per preference)
- **ESI**: Compute on total gross wages if gross ≤ ₹21,000
- **PT**: Look up state slab based on gross or as per state rules
- **LWF**: Apply state-specific rule (monthly/semi-annual/annual trigger)
- **TDS**: Re-project annual taxable income; spread remaining TDS over remaining months

**Step 9 — Other Deductions**
- Loan/advance EMI recovery
- Voluntary PF contribution
- Group insurance premium (if salary deductible)
- Club membership recovery (if any)

**Step 10 — Net Pay Computation**
```
Net Pay = Total Gross Earnings - Total Deductions
```
Validate: Net Pay should not be negative (apply recovery cap rules).

**Step 11 — Payroll Verification & Reconciliation**
- Run variance report: Compare gross, deductions, net pay with previous month
- Flag anomalies > ±10% change for any component
- Verify new joiner and exit employee amounts
- Cross-check statutory deduction totals
- Second-level reviewer sign-off

**Step 12 — Payroll Approval**
- Finance Head or designated authority approves
- Lock payroll (no further changes without approval)

---

### Phase 3: Payroll Disbursement (Payment Date)

**Step 13 — Bank File Generation**
- Generate bank-format files (NEFT batch) for each bank
- Split by bank (employees in different banks)
- Upload to bank portal or via API

**Step 14 — Payslip Generation & Distribution**
- Generate PDF payslips for all employees
- Distribute via email / ESS portal / WhatsApp
- Password protection: typically first 4 chars of PAN + DOB (DDMM)

---

### Phase 4: Post-Payroll Compliance (Days 1–20 of Following Month)

**Step 15 — PF Remittance**
- Upload ECR (Electronic Challan cum Return) on EPFO Unified Portal
- Due date: 15th of following month
- Generate challan; make payment via net banking

**Step 16 — ESI Remittance**
- Calculate employer + employee ESI contribution
- Due date: 15th of following month
- Upload Form 5 (half-yearly) in April and October

**Step 17 — PT Remittance**
- State-specific due dates (see Section 6)
- Deposit with respective state treasury / online portal

**Step 18 — LWF Remittance**
- Per state schedule (annual/semi-annual/monthly)

**Step 19 — TDS Remittance**
- Deposit Form 24Q TDS by 7th of following month (March: 30th April)
- Quarterly eTDS return filing: Form 24Q
  - Q1 (Apr–Jun): 31 July
  - Q2 (Jul–Sep): 31 October
  - Q3 (Oct–Dec): 31 January
  - Q4 (Jan–Mar): 31 May

**Step 20 — Accounting Entries**
Post salary journal entries to GL:
- Dr. Salary & Allowances A/c (each cost component)
- Dr. Employer PF Contribution A/c
- Dr. Employer ESI Contribution A/c
- Dr. Gratuity Provision A/c
- Cr. Net Salaries Payable A/c
- Cr. PF Payable A/c (Employee + Employer)
- Cr. ESI Payable A/c
- Cr. PT Payable A/c
- Cr. LWF Payable A/c
- Cr. TDS Payable A/c

---

### Phase 5: Year-end Compliance (March–April)

**Step 21 — Annual Bonus Processing** (typically September–October for bonus year ending March)
- Compute allocable surplus from audited P&L
- Calculate individual bonus; ensure min 8.33% and max 20%
- Disburse and file Bonus register (Form C)

**Step 22 — Form 16 Generation** (by 15 June)
- Part A: Employer-issued TDS certificate (TRACES-generated)
- Part B: Detailed salary computation, exemptions, deductions, tax

**Step 23 — Annual PF Returns** (Form 3A by 30 April, Form 6A by 30 April)

**Step 24 — Annual Gratuity Review**
- Actuarial valuation as of 31 March for Ind AS 19 / AS 15 compliance
- Fund adequacy assessment if Gratuity Trust exists

---

## 3. Statutory Framework Overview

### 3.1 Employees' Provident Fund (EPF) — EPF & MP Act, 1952

**Applicability:** All establishments with 20+ employees (20-employee count includes all types, even contract workers where principal employer is EPF-covered). Once covered, remains covered even if headcount falls below 20.

**Wage Ceiling:** ₹15,000/month Basic + DA for mandatory coverage. Above this, both employee and employer may contribute voluntarily on actual wages.

**Contribution Rates:**

| Component | Employee | Employer |
|-----------|----------|----------|
| EPF (Employee Pension Scheme) | 12% of Basic+DA | 3.67% of Basic+DA |
| EPS (Employee Pension Scheme) | — | 8.33% of Basic+DA (max ₹1,250/month) |
| EDLI (Insurance) | — | 0.50% (max ₹75/month) |
| Admin Charges | — | 0.50% (min ₹500/month for EPF; ₹0 for EDLI admin) |

**Employee Total:** 12% of Basic+DA
**Employer Total:** ~13% of Basic+DA (effective)

**Note on EPS Pension Wage:**
- Statutory EPS contribution = 8.33% of ₹15,000 = ₹1,250/month (regardless of actual Basic if above ₹15,000)
- If Basic+DA ≤ ₹15,000, then EPS = 8.33% of actual Basic+DA

**Higher EPS Option (Supreme Court, 2022):**
Employees who joined before 1 September 2014 and were existing EPS members can opt for higher pension on actual salary (beyond ₹15,000 ceiling). This requires additional contribution by both employee and employer.

**EDLI (Employees' Deposit-Linked Insurance):**
- Provides life insurance linked to PF balance
- Max EDLI benefit: ₹7 lakh

**Voluntary PF (VPF):**
- Employee may contribute more than 12% voluntarily
- Employer is not obligated to match VPF above 12%
- Entire VPF eligible for 80C deduction; interest tax-free up to ₹2.5 lakh p.a. total EPF contribution

---

### 3.2 Employees' State Insurance (ESI) — ESI Act, 1948

**Applicability:** Non-seasonal factories and establishments with 10+ employees (some states: 20+) where gross wages ≤ ₹21,000/month (₹25,000 for persons with disabilities).

**Once ESI coverage begins in a contribution period (April–Sep or Oct–Mar), it continues for the full period and the subsequent benefit period even if wages cross ₹21,000 mid-way.**

**Contribution Rates (effective 1 July 2019):**

| | Rate | Base |
|--|------|------|
| Employee | 0.75% | Gross Wages |
| Employer | 3.25% | Gross Wages |

**Gross Wages for ESI:** All remuneration paid or payable in cash — basic, DA, HRA, overtime, shift allowance, etc. — but EXCLUDING: gratuity, retrenchment compensation, lay-off compensation, maternity benefit, annual bonus exceeding 8.33%, employer PF contribution, travelling expenses for work duty.

**Contribution Periods & Benefit Periods:**

| Contribution Period | Benefit Period |
|--------------------|---------------|
| 1 April – 30 September | 1 January – 30 June (following year) |
| 1 October – 31 March | 1 July – 31 December |

**Benefits Covered:** Sickness, maternity, disability, dependent's benefit, medical, funeral expenses.

**New Employee Rule:** Employee must work for 78 days in a contribution period to become eligible for benefits in the corresponding benefit period.

---

### 3.3 Gratuity — Payment of Gratuity Act, 1972

**Applicability:** Establishments with 10+ employees (once covered, continues even if strength falls). Payable on superannuation, retirement, resignation (after 5 years), death, or disablement.

**5-Year Rule Exception:** For death or disablement, the 5-year requirement is waived. In some states (e.g., Karnataka under the Karnataka Shops & Establishments Act), continuous service interpretation means 240 working days in 12 months = 1 year of continuous service.

**Formula:**
```
Gratuity = (Last Drawn Basic + DA) / 26 × 15 × Completed Years of Service
```
- "26" = working days per month (6-day week norm under the Act)
- "15" = 15 days wages per completed year
- Years: Any fraction > 6 months is rounded up to the next full year
- Maximum: ₹20,00,000 (₹20 lakhs)
- Amounts above ₹20 lakhs are not tax-exempt (taxable as "other income")

**Monthly Gratuity Provision for CTC/Accounting:**
```
Monthly Provision = (Basic + DA) × 4.81%
```
(This is an approximation: 15/26 ÷ 12 months ≈ 4.81%)

**Statutory tax exemption:**
- Government employees: Fully exempt
- Non-government employees (Gratuity Act): Min of (Actual Gratuity, Calculated per Act formula, ₹20 lakhs)

---

### 3.4 Payment of Bonus Act, 1965

**Applicability:** Factories and establishments with 20+ employees. Employees with salary/wages ≤ ₹21,000/month.

**Eligibility:** Employee who has worked for at least 30 working days in the accounting year.

**Calculation Wage Ceiling:** Even if actual wages > ₹7,000/month, bonus is calculated on ₹7,000/month or the minimum wage for the scheduled employment, whichever is higher.

**Rates:**
- Minimum bonus: 8.33% of annual wages (or ₹100/year, whichever is higher)
- Maximum bonus: 20% of annual wages
- Actual rate depends on "allocable surplus" of the establishment

**Bonus Year:** April 1 to March 31 (or the accounting year)

**Payment Timeline:** Within 8 months of close of accounting year (i.e., by November 30th)

**Forms:** Form A (Available Surplus Register), Form B (Set-on/Set-off Register), Form C (Bonus Paid Register)

---

### 3.5 Payment of Wages Act, 1936 & Minimum Wages Act, 1948

**Key Rules:**
- Wages must be paid before the 7th of the following month (establishments with < 1,000 employees) or before the 10th (establishments with 1,000+ employees)
- Wages must not have unauthorised deductions (only permissible deductions are listed in the Act)

---

## 4. Exhaustive Payroll Component Library

### 4.1 Earnings Components

#### A. Fixed Earnings

| Component | Description | Tax Treatment | PF Base | ESI Base | Typical % of CTC |
|-----------|-------------|---------------|---------|----------|-----------------|
| **Basic Salary** | Core compensation; base for all statutory calculations | Fully taxable | Yes | Yes | 40–50% |
| **Dearness Allowance (DA)** | Cost-of-living index-linked (mainly govt; private: often zero or merged with Basic) | Fully taxable | Yes | Yes | 0–20% (pvt usually nil) |
| **House Rent Allowance (HRA)** | Towards rent paid; partial exemption u/s 10(13A) | Partially exempt (see formula) | No | Yes | 40–50% of Basic |
| **Leave Travel Allowance (LTA)** | For domestic travel during leave; 2 journeys per 4-year block | Exempt (conditions apply) u/s 10(5) | No | No | 5–8% |
| **Medical Allowance** | Monthly fixed medical component | Fully taxable (post-2018) | No | Yes | Was ₹1,250/month |
| **Conveyance Allowance** | For commuting to work | Fully taxable (post-2018; subsumed in std. deduction) | No | Yes | Was ₹1,600/month |
| **Special Allowance** | Balancing component = CTC - all other components | Fully taxable | No | Yes | Variable |
| **City Compensatory Allowance (CCA)** | Extra pay for high cost-of-living cities | Fully taxable | No | Yes | 5–10% |
| **Night Shift Allowance** | Supplement for night duty | Fully taxable | No | Yes | Variable |
| **Shift Allowance (general)** | Rotating shift supplement | Fully taxable | No | Yes | Variable |
| **Statutory Bonus (in CTC)** | Statutory minimum bonus included in CTC | Taxable when paid | No | Yes* | 8.33% of Basic |

#### B. Variable Earnings

| Component | Description | Tax Treatment | Notes |
|-----------|-------------|---------------|-------|
| **Performance Bonus / Incentive** | KPI-based; quarterly/annual | Fully taxable | Included in ESI gross if triggered monthly |
| **Sales Incentive / Commission** | Variable; sales-linked | Fully taxable | May be paid outside payroll |
| **Retention Bonus** | One-time; service period-linked | Fully taxable | May have clawback |
| **Joining / Sign-on Bonus** | One-time on joining | Fully taxable; often clawback < 1 year | — |
| **Referral Bonus** | For referring a hire | Fully taxable | — |
| **Project Completion Bonus** | On specific milestone | Fully taxable | — |
| **Overtime Wages** | Calculated per hour at 2× ordinary wage rate (Factories Act) | Taxable | Must track separately |
| **Production Incentive** | Piece-rate or production targets | Taxable | — |
| **Spot Award / Appreciation Bonus** | Discretionary; ad hoc | Taxable | — |

#### C. Statutory & Partially-Exempt Allowances

| Component | Exemption u/s | Condition | Exempt Amount |
|-----------|---------------|-----------|---------------|
| **Children Education Allowance** | 10(14) | For own children; max 2 | ₹100/child/month |
| **Hostel Subsidy** | 10(14) | For children staying in hostel; max 2 | ₹300/child/month |
| **Tribal / Scheduled Area Allowance** | 10(14) | Employees in tribal areas | Up to ₹200/month |
| **Compensatory Field Area Allowance** | 10(14) | Field duty in specified areas | ₹2,600/month |
| **High Altitude Allowance** | 10(14) | 9,000–15,000 ft altitude | ₹1,060–₹1,600/month |
| **Island Duty Allowance** | 10(14) | A&N Islands, Lakshadweep | ₹3,250/month |
| **Underground Mines Allowance** | 10(14) | Mine workers underground | ₹800/month |
| **Uniform Allowance** | 10(14) | Official uniform required by employer | Actual expenditure |
| **Helper Allowance** | 10(14) | Performing duties with a helper | Actual expenditure |
| **Research Allowance** | 10(14) | Academic/research purposes | Actual expenditure |
| **Academic/Teaching Allowance** | 10(14) | Teaching; educational institutions | Actual expenditure |
| **Meal Vouchers (Sodexo/Zeta)** | Rule 3 of Income Tax | Non-transferable; meal-time only | ₹50/meal; max ₹2,200/month |
| **Employer-provided Canteen** | Perquisite Rule | Subsidised meal in employer canteen | Cost to employer - ₹50/meal |
| **LTA** | 10(5) | 2 journeys/block of 4 years; domestic; family | Actual transport fare |
| **Gratuity received** | 10(10) | On retirement/death etc. | Up to ₹20 lakh |
| **Earned Leave Encashment at retirement** | 10(10AA) | At retirement/superannuation | Up to ₹25 lakh (revised 2023) |

---

### 4.2 Statutory Deductions

| Component | Rate | Base | Cap | Applicability |
|-----------|------|------|-----|---------------|
| **EPF — Employee** | 12% | Basic + DA | No cap (on actual; opt to cap at ₹15K) | Establishments ≥ 20 employees |
| **EPS — Employee** | Nil | — | — | Included in 12% |
| **ESI — Employee** | 0.75% | Gross Wages | Applicable only when gross ≤ ₹21,000 | ESI-covered areas |
| **Professional Tax (PT)** | Slab-based | Gross Salary (varies by state) | Max ₹2,500/year | As per state; ~20 states |
| **Labour Welfare Fund — Employee** | State-specific (₹3–₹48) | — | Nominal; state-specific | ~18 states/UTs |
| **TDS on Salary** | Slab rates | Taxable income | — | All salaried employees |
| **Loan/Advance EMI** | Per sanction | — | — | As applicable |
| **Voluntary PF (VPF)** | Employee-chosen | Basic + DA | — | Optional, any %; 80C |
| **Group Insurance Premium** | Policy-defined | — | — | If employer deducts from salary |

---

### 4.3 Employer Statutory Contributions (CTC Elements)

| Component | Rate | Base | Cap | Notes |
|-----------|------|------|-----|-------|
| **EPF Employer** | 3.67% | Basic + DA | — | Goes to EPF account |
| **EPS Employer** | 8.33% | Basic + DA | Max ₹1,250/month | Goes to pension fund |
| **EDLI Employer** | 0.50% | Basic + DA | Max ₹75/month | Insurance component |
| **EPF Admin Charges** | 0.50% | Basic + DA | Min ₹500/month | EPFO admin levy |
| **ESI Employer** | 3.25% | Gross Wages | Applicable for gross ≤ ₹21,000 | — |
| **LWF Employer** | State-specific (usually 2× employee) | — | Nominal | ~18 states |
| **Gratuity Provision** | 4.81% | Basic + DA | Monthly accrual | Not a deduction; provision |
| **Bonus Provision** | 8.33% minimum | Basic (capped at ₹7,000/month) | 20% max | Annual computation |
| **Employer Group Insurance** | Policy cost | — | — | Health, life, accident |
| **Employee State Welfare (Central)** | Nominal (Central BOCW, CPCL, etc.) | Wage bill | Sector-specific | Construction, plantation etc. |

---

### 4.4 Reimbursement Components

These are **claim-based** disbursements — separate from regular salary, typically exempt from PF and ESI, with tax treatment depending on the component:

| Reimbursement Component | Tax Treatment | Exemption Condition | Typical Limit |
|-------------------------|---------------|---------------------|---------------|
| **Medical Reimbursement** | Taxable post-2018 (merged with Std. Deduction) | Bills required; official illness | ₹15,000/year (historical) |
| **Fuel & Conveyance** | Partially exempt | Use of own car for official duty; logbook/bills | ₹1,800/month (car ≤1600cc); ₹2,400 (car >1600cc); +₹900 with driver |
| **Internet/Broadband** | Exempt for official use | Bills required; proportionate official use | Policy-defined |
| **Mobile/Telephone** | Exempt for official use | Bills required | Policy-defined |
| **Books & Periodicals** | Exempt | Actual bills; relevant to employment | Policy-defined |
| **LTA Claim** | Exempt (conditions) | u/s 10(5); 2 journeys / 4-year block; domestic; actual fare | Actual fare |
| **Business Travel & Stay** | Exempt | Official travel; bills/expense report | As per policy |
| **Club Membership** | Taxable as perquisite | Only if for personal enjoyment; if business use → questionable | — |
| **Driver Salary** | Perquisite (₹900/month) | If employer pays driver for official car | ₹900/month |
| **Professional Development** | Exempt | Employer-sponsored training; bills | Policy-defined |
| **Uniform Maintenance** | Exempt | Official uniform maintenance | Actual |
| **Relocation / Transfer Expenses** | Exempt | On transfer of employee by employer | Actual, reasonable |
| **Gift Vouchers** | Taxable > ₹5,000/year | Gifts; ₹5,000/year exempt | ₹5,000/year |
| **Health Insurance (Employee-paid)** | Deductible u/s 80D | Employee pays, employer reimburses | ₹25,000; ₹50,000 for senior citizen parents |
| **Leave Encashment (during service)** | Fully taxable | Not a reimbursement technically; salary | As per leave policy |
| **Notice Pay (in lieu of notice)** | Taxable (paid to/by employee) | — | — |

---

### 4.5 Special & One-time Components

| Component | Tax Treatment | Notes |
|-----------|---------------|-------|
| **Arrears of Salary** | Taxable; relief u/s 89(1) if prior-year arrears | Employee can file Form 10E for tax relief |
| **Ex-gratia** | Fully taxable | Discretionary; not a statutory bonus |
| **Long Service Award** | Exempt up to ₹5,000 | After every 5 years of service (Rule 3) |
| **Earned Leave Encashment (during service)** | Fully taxable | No exemption during employment |
| **Voluntary Retirement Scheme (VRS)** | Exempt up to ₹5 lakh | u/s 10(10C) for eligible schemes |
| **Retrenchment Compensation** | Exempt up to 3 months' wages per completed year or ₹5 lakh | u/s 10(10B) |
| **Notice Pay (employer to employee)** | Taxable | If employer pays instead of notice period |
| **Encashment of PL on Retirement** | Exempt up to ₹25 lakh | u/s 10(10AA) |
| **ESOP Perquisite** | Taxable as perquisite at exercise | FMV - Exercise price; TDS applicable |
| **RSU / ESPP** | Taxable on vesting | FMV on vesting date; STCG/LTCG on sale |
| **Meal Cards (sodexo/ticket)** | Exempt: ₹50/meal | Non-transferable, food use only |
| **National Pension System (NPS) Employer** | Exempt u/s 80CCD(2): up to 10% of Basic+DA (private) or 14% (govt) | Part of CTC; reduces tax significantly |
| **NPS Employee Additional** | Deductible u/s 80CCD(1B): ₹50,000 additional | Over and above 80C limit |
| **PMRPY/PMGKY Subsidy** | Government pays employer PF (12%) for eligible employees | Applicable for new hires with < ₹15,000 salary in certain schemes |

---

## 5. Formulas for All Calculations

### 5.1 Basic Salary
```
Basic Salary = CTC × Agreed % (typically 40–50%)
or
Basic Salary = Gross Salary × Agreed % 
or
Basic Salary = Band Midpoint (for grade-based structures)
```

### 5.2 Gross Salary
```
Monthly Gross = Basic + DA + HRA + Conveyance + Medical + Special Allowance
              + All other fixed allowances + Variable Pay (if monthly)
```

### 5.3 Prorated Salary (New Joiner / Exit)
```
Prorated Monthly Gross = Monthly Gross × (Days Worked / Calendar Days in Month)
```

### 5.4 LOP (Loss of Pay) Deduction
```
Daily Rate = Monthly Gross / Number of Working Days in Month
LOP Deduction = Daily Rate × Number of LOP Days
Net Monthly Gross = Monthly Gross - LOP Deduction
```

### 5.5 HRA Exemption Calculation
```
Annual HRA Exemption = Minimum of:
  (a) Actual HRA received (annual)
  (b) Rent paid annually - 10% of (Basic + DA) annually
  (c) 50% of (Basic + DA) annually  [Metro: Delhi, Mumbai, Kolkata, Chennai]
      40% of (Basic + DA) annually  [Non-metro]

Monthly HRA Taxable = Monthly HRA - (Annual Exemption / 12)
```

**Condition:** Employee must actually pay rent and furnish landlord details (PAN if annual rent > ₹1 lakh).

### 5.6 EPF Calculation
```
PF Base = Basic + DA
          (where PF Base ≤ ₹15,000 for statutory; actual if voluntary)

Employee EPF = 12% × PF Base
Employer EPF = 3.67% × PF Base
Employer EPS = 8.33% × PF Base (max ₹1,250 per month)
EDLI         = 0.50% × PF Base (max ₹75 per month)
Admin Charges = 0.50% × PF Base (min ₹500 per month)

Total Employee Contribution to PF = Employee EPF (12%)
Total Employer Contribution = EPF (3.67%) + EPS (8.33%) + EDLI (0.50%) + Admin (0.50%)
                            ≈ 13% of PF Base
```

**EPF Account Interest (FY 2023–24):** 8.25% p.a. (set by EPFO)
```
Monthly Interest = Opening Balance × 8.25% / 12
Annual Closing Balance = Opening Balance + Monthly Contributions × 12 + Interest
```

### 5.7 ESI Calculation
```
ESI Gross = Gross Wages (as defined under ESI Act)
Employee ESI = 0.75% × ESI Gross
Employer ESI = 3.25% × ESI Gross
Total ESI = 4.00% × ESI Gross

Applicability Check:
  If Monthly ESI Gross ≤ ₹21,000 → ESI applicable
  If Monthly ESI Gross > ₹21,000 → ESI NOT applicable
              (but once in a contribution period, continues till period end)
```

### 5.8 Gratuity
```
Gratuity = (Last Drawn Basic + DA) / 26 × 15 × Completed Years of Service

Where Completed Years of Service:
  - Any fraction > 6 months → rounds up to next full year
  - Fraction ≤ 6 months → rounds down

Examples:
  7 years 7 months → 8 years
  7 years 5 months → 7 years

Maximum Gratuity = ₹20,00,000

Monthly Provision = (Basic + DA) × 15/26/12 = (Basic + DA) × 0.0481 = 4.81%
```

### 5.9 Statutory Bonus
```
Bonus Wage (monthly) = Actual basic wage or ₹7,000 or Applicable Min Wage (whichever is higher; max ₹7,000 or min wage)

Annual Bonus Wage = Bonus Wage (monthly) × 12 (or months worked in year)

Minimum Bonus = 8.33% × Annual Bonus Wage
Maximum Bonus = 20.00% × Annual Bonus Wage

Actual Bonus = % (between 8.33% and 20%) × Annual Bonus Wage
               based on allocable surplus

Eligibility: Employee salary ≤ ₹21,000/month AND worked ≥ 30 days in year

Bonus for partial year:
  Proportional Bonus = Full Year Bonus × Months Worked / 12
```

### 5.10 Leave Encashment
```
Daily Rate for Encashment = (Basic + DA) / 26
or
Daily Rate = Last Basic / 26

Encashment Amount = Daily Rate × Number of Leave Days Encashed

Tax Exemption on Encashment at Retirement (u/s 10(10AA)):
  Minimum of:
  (a) Actual amount received
  (b) Average salary (last 10 months) × Leave days / 30
  (c) ₹25,00,000 (revised 2023)
  (d) Cash equivalent of unavailed leave (at half-month/year of service for govt)
```

### 5.11 Overtime Calculation
```
(Under Factories Act, 1948)
Ordinary Rate of Pay = Monthly Wages / (Total working hours in month)
OT Rate = 2 × Ordinary Rate of Pay
OT Amount = OT Rate × OT Hours

(Under other Acts, rate may differ; check applicable Act)
```

### 5.12 TDS on Salary Calculation
```
Step 1: Compute Annual Gross Income
  Annual Gross = Monthly Gross × 12 + Annual Variable Components

Step 2: Compute Exempt Allowances
  Less: HRA Exemption
  Less: LTA Exemption
  Less: CEA (₹2,400/year), Hostel Subsidy (₹7,200/year)
  Less: Other u/s 10(14) exemptions

Step 3: Compute Gross Taxable Salary
  = Annual Gross - All Exemptions

Step 4: Less Standard Deduction
  Old Regime: ₹50,000
  New Regime: ₹75,000

Step 5: Less Professional Tax Deduction
  (PT paid is deductible u/s 16(iii))

Step 6: Net Salary Income
  = Gross Taxable - Standard Deduction - PT

Step 7: Add Perquisites (if any)
  House rent perquisite, car, ESOP etc.

Step 8: Less Deductions under Chapter VIA (Old Regime only)
   80C: ₹1,50,000 (PF, PPF, ELSS, Life Insurance, Home Loan Principal etc.)
   80CCD(1B): ₹50,000 (NPS additional)
   80D: ₹25,000 self + ₹25,000/50,000 parents (health insurance; ₹50,000 if parent is senior citizen)
   80E: Education loan interest (no limit)
   80EEA: Home loan interest (₹1,50,000; first-time buyer)
   80G: Donations (50%/100% as specified)
   80TTA/80TTB: Savings interest ₹10,000 (or ₹50,000 for senior citizens)
   Others: 80GG, 80GGC, etc.

Step 9: Compute Tax

   --- OLD REGIME (FY 2025-26) ---
   Up to ₹2,50,000       → Nil
   ₹2,50,001 – ₹5,00,000 → 5%
   ₹5,00,001 – ₹10,00,000 → 20%
   Above ₹10,00,000      → 30%
   
   87A Rebate: Full rebate if taxable income ≤ ₹5,00,000 (Old Regime)

   --- NEW REGIME (FY 2025-26, Union Budget 2025) [DEFAULT] ---
   Up to ₹4,00,000       → Nil
   ₹4,00,001 – ₹8,00,000 → 5%
   ₹8,00,001 – ₹12,00,000 → 10%
   ₹12,00,001 – ₹16,00,000 → 15%
   ₹16,00,001 – ₹20,00,000 → 20%
   ₹20,00,001 – ₹24,00,000 → 25%
   Above ₹24,00,000      → 30%
   
   87A Rebate: Full rebate if taxable income ≤ ₹12,00,000 (New Regime)

Step 10: Add Surcharge (if applicable)
   Total Income > ₹50 lakh and ≤ ₹1 crore → 10% surcharge on tax
   Total Income > ₹1 crore and ≤ ₹2 crore → 15% surcharge
   Total Income > ₹2 crore and ≤ ₹5 crore → 25% (Old) / 25% (New)
   Total Income > ₹5 crore → 37% (Old) / 25% (New; capped at 25% for New Regime)

Step 11: Add Health & Education Cess
  Cess = 4% × (Tax + Surcharge)

Step 12: Annual Tax = Tax + Surcharge + Cess

Step 13: Monthly TDS = (Annual Tax - TDS Already Deducted) / Remaining Months
```

### 5.13 NPS Employer Contribution Exemption
```
NPS Employer Contribution (u/s 80CCD(2)):
  Exempt Amount = 10% × (Basic + DA) for private sector employees
                = 14% × (Basic + DA) for government employees
  
  This is part of employer's cost; reduces employee's taxable income
  (No cap in New Regime; same rule)
```

### 5.14 Perquisite — Accommodation Provided by Employer
```
If Government Employee:
  Perquisite Value = License Fees charged by government

If Non-Government Employee (owned accommodation):
  Furnished: 
    City pop > 25 lakhs → 15% of salary
    City pop 10–25 lakhs → 10% of salary
    City pop < 10 lakhs → 7.5% of salary
    + 10% p.a. of furniture cost (or actual hire charge)

If Leased/Rented by Employer:
  Perquisite = Lower of (Actual rent paid by employer, 15%/10%/7.5% of salary)
  (Same city population slabs)

"Salary" for perquisite = Basic + DA + Bonus + Commission (excludes HRA, PF, other perquisites)
```

---

## 6. State-wise Professional Tax Slabs

### States WITH Professional Tax

---

**MAHARASHTRA**
Frequency: Monthly
Max Annual: ₹2,500

| Monthly Gross Salary | PT/Month |
|---------------------|----------|
| Up to ₹7,500 | Nil |
| ₹7,501 – ₹10,000 | ₹175 |
| Above ₹10,000 | ₹200 (₹300 in February) |

Annual = ₹175×11 + ₹300 = ₹2,225 (if salary ₹7,501–10,000) OR ₹200×11 + ₹300 = ₹2,500 (if above ₹10,000)

---

**KARNATAKA**
Frequency: Monthly
(Revised slabs effective April 2023)

| Monthly Gross Salary | PT/Month |
|---------------------|---------|
| Up to ₹25,000 | Nil |
| ₹25,001 and above | ₹200 (₹300 in February) |

Max Annual: ₹200 × 11 + ₹300 = ₹2,500

*System Implementation:* `if (gross >= 25000) base = 200; if (month === February) base = 300;`

---

**WEST BENGAL**
Frequency: Monthly
PT deducted monthly; payment quarterly.

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹10,000 | Nil |
| ₹10,001 – ₹15,000 | ₹110 |
| ₹15,001 – ₹25,000 | ₹130 |
| ₹25,001 – ₹40,000 | ₹150 |
| Above ₹40,000 | ₹200 |

---

**TAMIL NADU**
Frequency: Half-yearly (June and December)

| Annual Salary | PT (Half-Year) |
|--------------|---------------|
| Up to ₹21,000 | Nil |
| ₹21,001 – ₹30,000 | ₹135 |
| ₹30,001 – ₹45,000 | ₹315 |
| ₹45,001 – ₹60,000 | ₹690 |
| ₹60,001 – ₹75,000 | ₹1,025 |
| Above ₹75,000 | ₹1,250 |

Max Annual: ₹2,500

---

**GUJARAT**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹5,999 | Nil |
| ₹6,000 – ₹8,999 | ₹80 |
| ₹9,000 – ₹11,999 | ₹150 |
| ₹12,000 and above | ₹200 |

---

**ANDHRA PRADESH**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹15,000 | Nil |
| ₹15,001 – ₹20,000 | ₹150 |
| Above ₹20,000 | ₹200 |

Max Annual: ₹2,400

---

**TELANGANA**
Frequency: Monthly
(Bifurcated from AP; follows largely same structure)

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹15,000 | Nil |
| ₹15,001 – ₹20,000 | ₹150 |
| Above ₹20,000 | ₹200 |

---

**KERALA**
Frequency: Half-yearly (April–Sep & Oct–Mar)

| Annual Salary | PT (Annual) |
|--------------|-------------|
| Up to ₹1,99,999 | Nil |
| ₹2,00,000 – ₹2,99,999 | ₹1,200 |
| ₹3,00,000 – ₹4,99,999 | ₹1,800 |
| ₹5,00,000 – ₹9,99,999 | ₹2,400 |
| Above ₹10,00,000 | ₹2,400 |

Deducted half-yearly: Divide annual PT by 2.

---

**MADHYA PRADESH**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹18,750 | Nil |
| ₹18,751 – ₹25,000 | ₹125 |
| ₹25,001 – ₹33,333 | ₹167 |
| Above ₹33,333 | ₹208 |

---

**ODISHA**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹13,304 | Nil |
| ₹13,305 – ₹25,000 | ₹125 |
| ₹25,001 – ₹41,666 | ₹167 |
| Above ₹41,666 | ₹208 |

---

**ASSAM**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹10,000 | Nil |
| ₹10,001 – ₹14,999 | ₹150 |
| ₹15,000 and above | ₹208 |

---

**MEGHALAYA**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹4,166 | Nil |
| ₹4,167 – ₹6,250 | ₹16 |
| ₹6,251 – ₹8,333 | ₹25 |
| ₹8,334 – ₹12,500 | ₹41 |
| ₹12,501 – ₹16,666 | ₹83 |
| ₹16,667 – ₹20,833 | ₹125 |
| Above ₹20,833 | ₹208 |

---

**TRIPURA**
Frequency: Monthly (nominal)

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹7,500 | Nil |
| Above ₹7,500 | ₹150–₹200 (slab-based) |

---

**JHARKHAND**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹25,000 | Nil |
| ₹25,001 – ₹41,666 | ₹100 |
| Above ₹41,666 | ₹150 |

---

**CHHATTISGARH**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹12,500 | Nil |
| ₹12,501 – ₹16,666 | ₹150 |
| Above ₹16,666 | ₹200 |

---

**MANIPUR**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹4,166 | Nil |
| ₹4,167 – ₹6,250 | ₹50 |
| ₹6,251 – ₹8,333 | ₹75 |
| ₹8,334 – ₹10,416 | ₹100 |
| ₹10,417 – ₹12,500 | ₹125 |
| ₹12,501 – ₹16,666 | ₹150 |
| ₹16,667 – ₹20,833 | ₹175 |
| Above ₹20,833 | ₹208 |

---

**GOA**
Frequency: Monthly

| Monthly Salary | PT/Month |
|----------------|----------|
| Up to ₹15,000 | Nil |
| ₹15,001 – ₹25,000 | ₹150 |
| Above ₹25,000 | ₹200 |

---

**SIKKIM**
Frequency: Monthly (nominal)
Applicable to certain categories; max ₹100–₹200/month

---

**MIZORAM**
Frequency: Monthly (Professional Tax Act, Mizoram)
Small amounts; max ₹208/month

---

### States WITHOUT Professional Tax

| State / UT |
|------------|
| Delhi (NCT) |
| Uttar Pradesh |
| Rajasthan |
| Haryana |
| Punjab |
| Himachal Pradesh |
| Uttarakhand |
| Bihar (effectively no enforcement) |
| Arunachal Pradesh |
| Nagaland |
| Jammu & Kashmir / Ladakh |
| Chandigarh (UT) |
| Puducherry (UT) |

---

## 7. State-wise Labour Welfare Fund (LWF)

LWF is governed by state-specific Labour Welfare Fund Acts. Contributions are small but mandatory.

| State | Employee Contribution | Employer Contribution | Frequency | Governing Act |
|-------|----------------------|----------------------|-----------|---------------|
| **Maharashtra** | ₹6–₹48 (slab-based on wages) | ₹12–₹96 (2× employee) | Semi-annual (June & Dec) | Maharashtra LWF Act, 1953 |
| **Karnataka** | ₹20/year | ₹40/year | Annual (January) | Karnataka LWF Act, 1965 |
| **Delhi** | ₹0.75/month | ₹2.25/month | Monthly | Delhi LWF Act, 1959 |
| **Andhra Pradesh** | ₹30/year | ₹70/year | Annual | AP LWF Act, 1987 |
| **Telangana** | ₹30/year | ₹70/year | Annual | Telangana LWF Act |
| **Tamil Nadu** | ₹20/year | ₹40/year | Annual (April) | TN LWF Act, 1972 |
| **West Bengal** | ₹3/month | ₹6/month | Monthly | WB LWF Act, 1974 |
| **Gujarat** | ₹6/month | ₹12/month | Monthly (varies) | Gujarat LWF Act, 1953 |
| **Kerala** | ₹20/month | ₹20/month | Monthly | Kerala LWF Act, 1975 |
| **Madhya Pradesh** | ₹10/year | ₹30/year | Annual | MP LWF Act, 1982 |
| **Odisha** | ₹3/month | ₹6/month | Monthly | Odisha LWF Act, 1996 |
| **Punjab** | ₹7–₹14 (slab) | ₹14–₹28 (2×) | Monthly | Punjab LWF Act, 1965 |
| **Goa** | ₹15/month | ₹45/month | Monthly | Goa LWF Act |
| **Chhattisgarh** | ₹10/year | ₹30/year | Annual | MP LWF Act (adopted) |
| **Jharkhand** | ₹5/month | ₹15/month | Monthly | Bihar LWF Act (adopted) |
| **Haryana** | ₹0.50/month | ₹2/month | Monthly | Haryana LWF Act, 1971 |
| **Uttarakhand** | ₹10/year | ₹30/year | Annual | — |
| **Assam** | ₹20/half-year | ₹40/half-year | Semi-annual | Assam LWF Act |

**States WITH NO LWF:** Rajasthan, Himachal Pradesh, J&K/Ladakh, UP, Bihar (no effective act), Arunachal Pradesh, Nagaland, Manipur, Meghalaya, Sikkim, Mizoram, Tripura (separate tribal fund acts exist).

---

### Maharashtra LWF Slab Detail

| Monthly Wages | Employee | Employer |
|--------------|----------|----------|
| Up to ₹3,000 | ₹6 | ₹12 |
| ₹3,001 – ₹10,000 | ₹12 | ₹24 |
| ₹10,001 – ₹25,000 | ₹24 | ₹48 |
| Above ₹25,000 | ₹48 | ₹96 |

*Contribution due in June and December.*

---

## 8. State-wise Minimum Wages (Overview)

Minimum wages are revised periodically (typically twice a year — April and October). The rates below are indicative (as of 2024-25). Always verify current notified rates.

**Zone classification:** Most states classify their districts into Zone A (urban/metropolitan), Zone B (semi-urban), and Zone C (rural). Wages differ by zone.

**Categories:** Unskilled, Semi-skilled, Skilled, Highly Skilled, Supervisory/Clerical

| State | Unskilled/Day (₹) | Skilled/Day (₹) | Zone System |
|-------|--------------------|-----------------|-------------|
| Delhi | ₹773–₹792 | ₹905–₹954 | 3 zones (plus unskilled/clerical/supervisory) |
| Maharashtra | ₹467–₹603 | ₹554–₹730 | Areas A/B |
| Karnataka | ₹490–₹600 | ₹600–₹750 | Zones |
| Tamil Nadu | ₹440–₹550 | ₹550–₹660 | Categories |
| Gujarat | ₹380–₹470 | ₹480–₹575 | Zones |
| Haryana | ₹530–₹595 | ₹655–₹730 | — |
| Punjab | ₹385–₹425 | ₹490–₹540 | — |
| West Bengal | ₹346–₹421 | ₹432–₹524 | Zones |
| Kerala | ₹680–₹870 | ₹870–₹1,100 | — (highest in India) |
| Rajasthan | ₹287–₹330 | ₹330–₹390 | Zones |
| UP | ₹334–₹374 | ₹391–₹435 | Zones |
| Andhra Pradesh | ₹380–₹440 | ₹450–₹530 | — |
| Telangana | ₹385–₹450 | ₹460–₹545 | — |
| Madhya Pradesh | ₹221–₹274 | ₹258–₹318 | — |
| Odisha | ₹300–₹380 | ₹380–₹440 | — |
| Jharkhand | ₹310–₹380 | ₹380–₹460 | — |
| Assam | ₹256–₹310 | ₹310–₹376 | — |
| Himachal Pradesh | ₹350–₹400 | ₹400–₹460 | — |
| Uttarakhand | ₹375–₹430 | ₹445–₹510 | — |
| Goa | ₹380–₹440 | ₹440–₹520 | — |

**Important:** The national floor-level minimum wage is ₹178/day (non-binding advisory). Several state Minimum Wages exceed this by 2–5×.

---

## 9. TDS & Income Tax — New vs Old Regime (FY 2025–26)

### Comparison Table

| Feature | Old Regime | New Regime (Default from FY 2025-26, Union Budget 2025) |
|---------|-----------|--------------------------------------|
| Standard Deduction | ₹50,000 | ₹75,000 |
| HRA Exemption | Yes (u/s 10(13A)) | No |
| LTA Exemption | Yes (u/s 10(5)) | No |
| Section 80C | Up to ₹1,50,000 | Not available |
| Section 80D | Up to ₹25,000 self + ₹25,000/₹50,000 parents | Not available |
| Section 80CCD(1B) | ₹50,000 NPS | Not available |
| Section 80E | Education loan interest | Not available |
| Home loan interest u/s 24(b) | Up to ₹2,00,000 | Not available (for self-occupied) |
| Employer NPS 80CCD(2) | Yes | Yes (10% or 14% of Basic+DA) |
| Tax-free gratuity | Yes (up to ₹20L) | Yes (up to ₹20L) |
| Tax-free PF | Yes | Yes |
| Retirement leave encashment | Exempt up to ₹25L | Exempt up to ₹25L |
| Surcharge cap | 37% (for > ₹5 cr) | 25% (capped) |
| 87A Rebate limit | Taxable income ≤ ₹5L → full rebate | Taxable income ≤ ₹12L → full rebate |
| Changing regime | Can switch each year | Can switch each year (except business income) |

### New Regime Tax Slabs (FY 2025–26, Union Budget 2025)

| Income Slab | Rate |
|-------------|------|
| Up to ₹4,00,000 | Nil |
| ₹4,00,001 – ₹8,00,000 | 5% |
| ₹8,00,001 – ₹12,00,000 | 10% |
| ₹12,00,001 – ₹16,00,000 | 15% |
| ₹16,00,001 – ₹20,00,000 | 20% |
| ₹20,00,001 – ₹24,00,000 | 25% |
| Above ₹24,00,000 | 30% |

*Plus 4% Health & Education Cess on total tax.*
*87A Rebate: Full rebate if taxable income ≤ ₹12,00,000.*

### Old Regime Tax Slabs (FY 2025–26)

| Income Slab | Rate |
|-------------|------|
| Up to ₹2,50,000 | Nil |
| ₹2,50,001 – ₹5,00,000 | 5% |
| ₹5,00,001 – ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |

*Plus surcharge and 4% cess.*
*87A Rebate: Full rebate if taxable income ≤ ₹5,00,000.*

---

## 10. Commonalities & Differences Across States

### Commonalities (Central Legislation — Uniform Across All States)

These apply uniformly regardless of which state an employee is posted in:

1. **EPF & Miscellaneous Provisions Act, 1952** — 12% employee, ~13% employer; same rates everywhere
2. **ESI Act, 1948** — 0.75% employee + 3.25% employer; same rates everywhere (applicable areas differ)
3. **Payment of Gratuity Act, 1972** — Same formula (15/26 × Basic+DA × years); same ₹20 lakh cap
4. **Payment of Bonus Act, 1965** — 8.33%–20%; same eligibility threshold (₹21,000 salary)
5. **Income Tax Act, 1961** — TDS computation same for all states; exemptions uniform
6. **Minimum Wages Act, 1948** — Central Act but rates SET by state governments (see differences)
7. **Payment of Wages Act, 1936** — Payment deadlines uniform; permissible deductions uniform
8. **Maternity Benefit Act, 1961** — 26 weeks paid maternity leave for all
9. **Equal Remuneration Act, 1976** — No discrimination; uniform nationally
10. **The Code on Wages, 2019** — Consolidates 4 Acts (though not yet fully notified state-by-state)

---

### Key Differences Across States

| Aspect | Varies By | Examples |
|--------|-----------|---------|
| **Professional Tax** | Whether PT exists; slab rates; frequency | Maharashtra ≠ Karnataka ≠ West Bengal; nil in Delhi, UP, Rajasthan, HP |
| **Labour Welfare Fund** | Existence; rates; frequency | Maharashtra semi-annual; Karnataka annual; West Bengal monthly; none in Rajasthan, HP |
| **Minimum Wages** | Completely state-determined; zone; category | Kerala highest (₹680+/day); MP among lowest |
| **Shops & Establishments Act** | Working hours, overtime; weekly off; leave entitlement | Each state has own S&E Act with different rules |
| **ESI Applicable Areas** | ESI coverage is area-based; not all districts covered | Expanded to 596 districts but some remote areas still uncovered |
| **Notice Period (Termination)** | State S&E Act prescribes notice for exit | Maharashtra: 1 month; some states: per contract; some: per wage earned |
| **FnF Timeline** | State S&E Acts vary | Maharashtra: FnF within same month; Karnataka: within 2 working days; Tamil Nadu: before employee leaves |
| **Gratuity Continuous Service** | "Continuous service" interpretation | Karnataka: 240 days = 1 year; others follow 240/190 day rule for factory/non-factory |
| **Earned Leave Accumulation** | State S&E Acts vary | Maharashtra: EL max 45 days; Karnataka: no cap (or 120 days); Tamil Nadu: max 120 days |
| **Festival Leaves & National Holidays** | Number and types of public holidays differ by state | Delhi: 3 national + optional festivals; Maharashtra: National + Gazetted State holidays |
| **Contract Labour Regulations** | CLRA Act applicability threshold: 20 employees (central), some states lower | Stricter in some states |
| **Inter-state Migrant Workmen Act** | Extra obligations when hiring workers from other states | State-specific registration required |
| **Building & Other Construction Workers (BOCW)** | Cess 1% of construction cost payable to state welfare board | All states but implementation varies |
| **Plantation Labour Act** | Tea, coffee, rubber, cinchona, cardamom estates | Assam, Kerala, Tamil Nadu, Karnataka primarily |
| **Working Hours (Factories)** | Factories Act sets 9 hours/day, 48 hours/week uniformly; state Factories rules for OT | State rules differ slightly on shift change notice, maintenance shutdowns |
| **Childcare Provisions** | Crèche required if 50+ women employees; state rules differ on enforcement | Strict enforcement in Kerala, Tamil Nadu |

---

## 11. Traceability Matrix — Component × State

(See interactive version in the HRMS module — static condensed version below)

### Legend
- ✅ **Mandatory / Applicable**
- ⚪ **Optional / Not commonly practised**
- ❌ **Not Applicable / No such law**
- 🔢 **Slab / Rate varies**
- 📋 **As per state-specific rules**

### Matrix — Statutory Components

| Component | MH | KA | WB | TN | GJ | AP | TG | KL | MP | OD | DL | HR | PB | UP | RJ | HP | JH | CH | AS | GO |
|-----------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| EPF Employee 12% | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ESI Employee 0.75% | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Professional Tax | 🔢 | 🔢 | 🔢 | 🔢 | 🔢 | 🔢 | 🔢 | 🔢 | 🔢 | 🔢 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔢 | 🔢 | 🔢 | 🔢 |
| LWF Employee | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| TDS (Income Tax) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gratuity (≥5 yrs) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Statutory Bonus | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Matrix — Earning Components

| Component | Taxability | PF Included | ESI Included | LTA Exempt | Remarks |
|-----------|-----------|-------------|-------------|-----------|---------|
| Basic Salary | Taxable | ✅ Yes | ✅ Yes | — | Primary component |
| DA | Taxable | ✅ Yes | ✅ Yes | — | Mainly govt; private rare |
| HRA | Partially exempt | ❌ No | ✅ Yes | — | 10(13A) exemption |
| LTA | Partially exempt | ❌ No | ❌ No | ✅ | 10(5); 2 journeys/4 years |
| Medical Allowance (fixed) | Taxable | ❌ No | ✅ Yes | — | No exemption post-2018 |
| Conveyance Allowance (fixed) | Taxable | ❌ No | ✅ Yes | — | No exemption post-2018 |
| Special Allowance | Taxable | ❌ No | ✅ Yes | — | Balancing figure |
| CCA | Taxable | ❌ No | ✅ Yes | — | City-specific |
| Night Shift Allowance | Taxable | ❌ No | ✅ Yes | — | — |
| Overtime | Taxable | ❌ No | ✅ Yes | — | Included in ESI gross |
| Performance Bonus | Taxable | ❌ No | ✅ Yes* | — | ESI if monthly & gross ≤21K |
| Children Edu. Allowance | ₹100/child/month exempt | ❌ No | ✅ Yes | — | Max 2 children |
| Hostel Subsidy | ₹300/child/month exempt | ❌ No | ✅ Yes | — | Max 2 children |
| Meal Vouchers | ₹50/meal exempt | ❌ No | ❌ No | — | Non-cash; non-transferable |
| Uniform Allowance | Fully exempt (actual) | ❌ No | ✅ Yes | — | Official uniform |
| NPS Employer (80CCD2) | Exempt up to 10% | ❌ No | ❌ No | — | Reduces taxable income |

---

*State Abbreviations used in matrix:*
MH=Maharashtra, KA=Karnataka, WB=West Bengal, TN=Tamil Nadu, GJ=Gujarat, AP=Andhra Pradesh, TG=Telangana, KL=Kerala, MP=Madhya Pradesh, OD=Odisha, DL=Delhi, HR=Haryana, PB=Punjab, UP=Uttar Pradesh, RJ=Rajasthan, HP=Himachal Pradesh, JH=Jharkhand, CH=Chhattisgarh, AS=Assam, GO=Goa

---

## 12. Payroll Operations Module — As Implemented

The Payroll Operations module implements the theoretical framework above as a **6-step sequential pipeline**, each step backed by a dedicated React component and the client-side computation engine.

### 12.1 Six-Step Payrun Pipeline

| Step | Component | Purpose | Key Actions |
|------|-----------|---------|-------------|
| **Step 0** | `PayrollOps_Initiate` | **Initiate Payrun** | Select month/year, filter roster by department, auto-exclude withheld/absconding employees, resume existing drafts, view payrun history with unlock/delete actions |
| **Step 1** | `PayrollOps_Review` | **Review & Adjust Salaries** | Per-employee adjustment pane: LOP days, OT hours/rate, leave encashment days, manual deduction (₹), variable component payouts, multi-entry arrears with automatic day clamping. Live computation refresh. |
| **Step 2** | `PayrollOps_TaxTDS` | **Tax & TDS Configuration** | Auto-load verified IT declarations, auto-fetch YTD TDS history, per-employee tax regime toggle, Chapter VI-A inputs (80C/80D/NPS/HomeLoan), HRA rent, LTA. Engine computes annual tax → monthly TDS. |
| **Step 3** | `PayrollOps_TaxReport` | **Tax Computation Report** | Master-detail layout: employee list + per-employee tax sheet with 3 sections (Earnings Breakdown, Deductions & Exemptions, Tax Liability Output with formula trace). Engine validation warnings. |
| **Step 4** | `PayrollOps_Confirm` | **Confirm & Export** | Summary dashboard (₹ totals), payroll register preview, 7 compliance export buttons (Bank CSV, EPF ECR, ESIC Return, TDS 24Q, PT state ZIP, LWF state ZIP, Full Register Excel). Confirm persists all data. |
| **Step 5** | `PayrollOps_SlipViewer` | **Salary Slips** | Per-employee slip preview with YTD column (optional), arrear/variable breakup display (configurable), Dept/State filters, bulk publish, Excel upload targeting, Download All as multi-sheet XLSX, Print/PDF. Complete Payroll finalizes. |

### 12.2 Payrun Status Lifecycle

```
draft → initiated → reviewed → tax_checked → confirmed → completed
                                                  ↑
                         🔓 Unlock (with audit reason) reverts to → reviewed
```

### 12.3 Post-Finalization Corrections

- **Unlock**: Available only on `confirmed` or `completed` payruns. Finance Admin must provide a mandatory reason.
- **Audit Log**: Append-only `audit_logs` JSONB array on the `payruns` table. Each entry records: `{ action, reason, user, timestamp }`.
- **Effect**: Payrun status reverts to `reviewed`, allowing corrections from Step 1 onwards.

### 12.4 Configurable Display Preferences (Company Settings)

| Setting | Options | Effect |
|---------|---------|--------|
| `arrearDisplayMode` | `consolidated` / `breakup` | Whether arrears appear as one line or per-component |
| `arrearBreakupVisibility` | `['review', 'tax', 'slip']` | In which steps the breakup is shown |
| `incentiveDisplayMode` | `consolidated` / `breakup` | Whether variable/incentive pay appears as one line or per-component |
| `showYTDOnPayslip` | `true` / `false` | Whether YTD column appears in salary slips |
| `epfCalculationMethod` | `flat_ceiling` / `actual_basic` / `prorated_ceiling` | EPF computation method |
| `ptHalfYearlyMode` | `lump_sum` / `prorate` | PT deduction frequency for half-yearly states |
| `lopCalculationMethod` | `calendar` / `working` / `pay_period` | LOP day calculation basis |
| `prorationType` | `dynamic` / `fixed30` | Whether to use actual calendar days or fixed 30 |

### 12.5 Compliance Export Formats

| Export | Format | Content |
|--------|--------|---------|  
| **Bank Transfer** | CSV | Bank-specific column ordering (HDFC, ICICI, SBI, Axis, Generic) |
| **EPF ECR v2** | TXT | `UAN #~# Gross #~# EE(12%) #~# EPS(8.33%) #~# EPF-ER(3.67%)` |
| **ESIC Return** | TXT | `IP Number | Days Worked | Gross | EE Contrib (0.75%) | ER Contrib (3.25%)` |
| **TDS 24Q** | XLSX | PAN, Name, Gross, Annual Tax, Monthly TDS, Regime |
| **Professional Tax** | ZIP (XLSX per state) | Grouped by `work_state`, each state exported as separate XLSX |
| **LWF** | ZIP (XLSX per state) | Grouped by `work_state`, each state exported as separate XLSX |
| **Payroll Register** | XLSX | 22-column comprehensive register with all earnings, deductions, and employer contributions |

### 12.6 Database Schema (Implemented)

| Table | Key Columns | Purpose |
|-------|------------|--------|
| `employees` | id, emp_code, name, salary_structure (JSONB), input_mode, tax_regime, work_state, work_city, exit_date, exit_reason, salary_status | Employee master with salary and lifecycle data |
| `payruns` | id, month_year, status, audit_logs (JSONB) | Monthly payrun records with 6-stage lifecycle |
| `payrun_adjustments` | payrun_id, employee_id, adjustments (JSONB), computed_data (JSONB) | Per-employee overrides and computed snapshots |
| `company_settings` | id, settings (JSONB) | Singleton configuration (EPF method, PT registrations, display modes) |
| `employee_submissions` | employee_id, financial_year, type, status, submitted_data (JSONB), verified_data (JSONB) | IT declarations and reimbursement claims |

---

## 13. Salary Status Management & Exit Lifecycle

### 13.1 Salary Status States

| Status | UI Indicator | Engine Behavior |
|--------|-------------|----------------|
| `active` | No badge (default) | Normal payroll processing |
| `withheld` | Yellow WITHHELD badge | Auto-excluded from Select All. If manually included, engine returns zeroed output with `salaryWithheld = true` and reason: "Salary explicitly withheld". |
| `absconding` | Red ABSCONDING badge | Same as withheld, with reason: "Employee is absconding". |
| `fnf_pending` | Blue FNF badge | Normal computation proceeds. Engine adds advisory warning: "This computation is flagged as Full & Final (FnF) Pending." |

### 13.2 Exit Lifecycle Fields

| Field | Type | Purpose |
|-------|------|--------|
| `exit_date` | DATE (nullable) | Triggers future-month capping in tax projection |
| `exit_reason` | TEXT | `Resignation`, `Termination`, `Retirement`. Retirement triggers leave encashment exemption (₹25L). |

### 13.3 Exit Tax Projection Formula

```
exitMonths = ceil((exitDate - payrollStartDate) / (1000 × 60 × 60 × 24 × 30))
effectiveMonthsRemaining = min(exitMonths, fyMonthsRemaining)
```

If `exitMonths < fyMonthsRemaining`, the engine uses the shorter tenure for annual tax projection and TDS spreading.

---

## 14. System Prerequisites & Assumptions

### 14.1 Infrastructure Prerequisites

| Prerequisite | Description |
|-------------|-------------|
| **Supabase Project** | A live Supabase project with PostgreSQL database must be provisioned and accessible. The Supabase URL and anon key must be configured in the application's `.env` file. |
| **Database Tables** | All 5 tables (`employees`, `payruns`, `payrun_adjustments`, `company_settings`, `employee_submissions`) must be created with the schema defined in `supabase_updates.sql`. |
| **Row-Level Security** | RLS policies must be enabled on all tables. Current implementation uses permissive "allow all" policy; production should implement role-based access. |
| **Storage Bucket** | An `employee-proofs` storage bucket in Supabase for reimbursement proof file uploads. |
| **Browser** | Modern browser (Chrome 90+, Edge 90+, Firefox 88+, Safari 14+) with JavaScript enabled. Uses ES2020+ features, dynamic `import()`, and the `Blob` API. |
| **CDN Access** | Internet connectivity required for loading JSZip via ESM CDN for ZIP generation. |

### 14.2 Data Prerequisites

| Prerequisite | Description |
|-------------|-------------|
| **Employee Records** | At least one active employee with a valid `salary_structure` (array of salary component objects) must exist before a payrun can be initiated. |
| **Salary Structure** | Each employee must have at minimum one `earnings_basic` type component. HRA and Special Allowance are expected but optional. |
| **Company Settings** | A singleton `company_settings` row must exist. Falls back to hardcoded defaults in `settingsStore.js` if absent. |
| **Financial Year Convention** | April (month index 3) through March (month index 2). All YTD, month-remaining, and history queries assume this. |
| **Input Mode Consistency** | The `input_mode` field must accurately reflect whether salary amounts are monthly or annual. |

### 14.3 Computation Assumptions

| Assumption | Description |
|-----------|-------------|
| **26 Working Days/Month** | Leave encashment: `standardGross / 26`. |
| **Calendar-Day Proration** | `(daysInMonth - lopDays) / daysInMonth` using actual calendar days (28/29/30/31). |
| **Single FY per Payrun** | Cross-FY payruns not supported. |
| **EPF Ceiling ₹1,800/month** | Under `flat_ceiling`: ₹15,000 × 12% = ₹1,800. |
| **ESIC Ceiling ₹21,000/month** | Employees above this are exempt. |
| **Metro Classification** | Mumbai, Delhi, New Delhi, Kolkata, Chennai = Metro (50% Basic for HRA). All others = Non-Metro (40%). |
| **YTD from Confirmed Payruns Only** | Draft/initiated payruns excluded from history. |
| **Forward-Looking TDS Spread** | No retroactive recalculation of prior months’ TDS. |
| **Client-Side Computation** | All payroll math runs in the browser. The `computed_data` snapshot persisted to Supabase is a record of what the client calculated. |
| **Employer PF = Employee PF** | System mirrors contribution. EPS/EPF-ER split applied on employer side for ECR. |
| **No Mid-Month Joining Proration** | Admin must manually adjust LOP/Days in Month for partial-month joining. |

---

*This document covers the statutory framework as of FY 2025–26 (Union Budget 2025 slabs). Always verify current rates with respective government notifications, EPFO circulars, ESIC notifications, and state government gazettes before payroll processing.*

---
**Document Version:** 2.0 | **Last Updated:** April 24, 2026 | **Prepared for:** HRMS Payroll Module Design | **Jurisdiction:** India
