# Payroll Operations Module — Functional Requirement Document (FRD)

**Version:** 3.0  
**Date:** April 24, 2026  
**Module:** Payroll Operations (`PayrollOpsTab`)  
**Application:** Payroll Traceability Matrix  
**Backend:** Supabase (PostgreSQL + RLS)  
**Frontend:** React (Vite)  

---

## 1. Executive Summary

The Payroll Operations Module is the core transactional engine within the Payroll Traceability Matrix application. It orchestrates the end-to-end monthly salary computation and disbursement lifecycle for Indian payroll, encompassing:

- Employee roster selection and payrun initiation
- Per-employee salary review with attendance, overtime, arrears, and variable pay adjustments
- Income tax (TDS) computation under both Old and New regimes (FY 2025-26 Budget slabs)
- Statutory deduction calculations (EPF, ESIC, Professional Tax, Labour Welfare Fund) with state-specific logic
- Compliance file exports (Bank transfer files, EPF ECR, ESIC returns, TDS 24Q, PT/LWF state-wise ZIPs)
- Salary slip generation, publishing, and bulk operations
- Post-finalization correction (unlock) workflows with audit logging
- Salary status management (Active, Withheld, Absconding, FnF Pending)

> [!IMPORTANT]
> All calculations are performed client-side by a deterministic computation engine (`payrollEngine.js`). The backend (Supabase) stores configuration, employee records, payrun metadata, and per-employee adjustments. There is no server-side computation layer — the engine is pure JavaScript.

---

## 2. System Architecture Overview

```mermaid
graph TD
    subgraph Frontend["Frontend - React with Vite"]
        UI["PayrollOpsTab - Orchestrator Component"]
        S0["Step 0 - Initiate Payrun"]
        S1["Step 1 - Review and Adjust Salaries"]
        S2["Step 2 - Tax and TDS Configuration"]
        S3["Step 3 - Tax Computation Report"]
        S4["Step 4 - Confirm and Export Files"]
        S5["Step 5 - Generate Salary Slips"]
        ENGINE["payrollEngine.js - Computation Engine"]
    end

    subgraph Backend["Supabase PostgreSQL Backend"]
        EMP["employees table"]
        PR["payruns table"]
        ADJ["payrun_adjustments table"]
        CS["company_settings table"]
        ES["employee_submissions table"]
    end

    UI --> S0
    UI --> S1
    UI --> S2
    UI --> S3
    UI --> S4
    UI --> S5
    S1 --> ENGINE
    S2 --> ENGINE
    S3 --> ENGINE
    S4 --> ENGINE
    S5 --> ENGINE
    UI --> EMP
    UI --> PR
    UI --> ADJ
    UI --> CS
    S2 --> ES
```

---

## 3. Database Schema

### 3.1 `employees` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated unique identifier |
| `emp_code` | TEXT | Human-readable employee code (e.g., `EMP001`) |
| `name` | TEXT | Full name |
| `department` | TEXT | Department name |
| `designation` | TEXT | Job title |
| `date_of_joining` | DATE | Employment start date |
| `is_active` | BOOLEAN | Login/portal access flag |
| `salary_structure` | JSONB | Array of salary component objects |
| `input_mode` | TEXT | `monthly` or `annual` — how amounts in `salary_structure` are entered |
| `tax_regime` | TEXT | `new` or `old` |
| `bank_info` | JSONB | `{ bank_name, account_no, ifsc }` |
| `work_state` | TEXT | State code for PT/LWF calculation |
| `work_city` | TEXT | City name for HRA metro classification |
| `base_state` | TEXT | Residential state for HRA |
| `base_city` | TEXT | Residential city |
| `exit_date` | DATE | Nullable — triggers exit/FnF projection |
| `exit_reason` | TEXT | `Resignation`, `Termination`, `Retirement` |
| `salary_status` | TEXT | `active`, `withheld`, `absconding`, `fnf_pending` |

### 3.2 `payruns` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `month_year` | TEXT | e.g., `"April 2026"` |
| `status` | TEXT | `draft` → `initiated` → `reviewed` → `tax_checked` → `confirmed` → `completed` |
| `audit_logs` | JSONB | Array of `{ action, reason, user, timestamp }` objects for correction history |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification |

### 3.3 `payrun_adjustments` Table

| Column | Type | Description |
|--------|------|-------------|
| `payrun_id` | UUID (FK → payruns) | Payrun reference |
| `employee_id` | UUID (FK → employees) | Employee reference |
| `adjustments` | JSONB | Per-employee overrides: LOP days, OT, arrears, variable payouts, manual deductions, tax overrides |
| `computed_data` | JSONB | Snapshot of computed output (used for YTD aggregation in future payruns) |
| Unique constraint on | `(payrun_id, employee_id)` | UPSERT-safe |

### 3.4 `company_settings` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Singleton row |
| `settings` | JSONB | Full company configuration (EPF method, PT registrations, display preferences, etc.) |

### 3.5 `employee_submissions` Table

| Column | Type | Description |
|--------|------|-------------|
| `employee_id` | UUID (FK) | Submitting employee |
| `financial_year` | TEXT | e.g., `"2026-27"` |
| `type` | TEXT | `it_declaration` or `reimbursement` |
| `status` | TEXT | `draft` → `submitted` → `verified` / `rejected` |
| `submitted_data` | JSONB | Employee's declared values and proof URLs |
| `verified_data` | JSONB | Finance-approved values that feed into payrun computation |

---

## 4. Payroll Pipeline — Step-by-Step Lifecycle

The payroll pipeline consists of **6 sequential steps**, each represented by a dedicated UI component and a set of functional requirements.

### Lifecycle Flowchart

```mermaid
flowchart TB
    START(["Finance Admin opens Payroll Operations module"]) --> LOAD["System loads all employees, payruns, and company settings from Supabase"]
    LOAD --> STEP0

    subgraph STEP0["STEP 0: INITIATE PAYRUN"]
        direction TB
        A1["Admin selects the Payroll Month and Year from dropdowns"]
        A2["Employee roster table is displayed with Department filter dropdown"]
        A3["System auto-excludes employees with salary status Withheld or Absconding from default selection"]
        A4["Roster rows display salary status badges: WITHHELD in red, ABSCONDING in dark red, FNF in blue, alongside the tax regime badge"]
        A5["Admin manually selects or deselects employees for inclusion in this payrun using checkboxes"]
        A6{"Does an unconfirmed draft payrun already exist for this month-year combination?"}
        A7["System prompts Admin to resume the existing draft payrun instead of creating a duplicate"]
        A8["System creates a new payrun record in the payruns table and saves initial adjustment stubs for each selected employee"]
        A1 --> A2
        A2 --> A3
        A3 --> A4
        A4 --> A5
        A5 --> A6
        A6 -- "Yes, draft exists" --> A7
        A6 -- "No, fresh month" --> A8
    end

    STEP0 --> STEP1

    subgraph STEP1["STEP 1: REVIEW AND ADJUST SALARIES"]
        direction TB
        B1["Master table displays all selected employees with Name, Code, Department, computed Gross Salary, and Net Pay"]
        B2["Admin clicks an employee row to open the slide-over Adjustment Detail Pane"]
        B3["Adjustment inputs are displayed: Days in Month, LOP Days, Overtime Hours, Overtime Rate per hour, Leave Encashment Days, and Manual Deduction amount in Rupees"]
        B4["Salary Component Table shows each component with columns: Name, Type Badge, Monthly Amount, Prorated Amount after LOP, Variable Payout input field, and Final Amount"]
        B5["For each variable-type component, Admin enters the current month payout amount into the editable input field"]
        B6["Arrears section: Admin clicks Add Month to create arrear entries with Historical Month name, Days in that Month, Historical Gross amount, and Arrear Days to be paid"]
        B7["Arrear days are auto-clamped to the minimum of the historical month days and the current month paid days, with a validation warning shown if clamping occurs"]
        B8["Live Computation Result panel refreshes in real-time showing: Fixed Gross, Variable Pay, Total Gross Salary, and Net Pay"]
        B9["If arrear display is set to breakup mode with review visibility, a component-wise arrear breakup table is shown. Same for variable incentive breakup if configured."]
        B1 --> B2
        B2 --> B3
        B3 --> B4
        B4 --> B5
        B5 --> B6
        B6 --> B7
        B7 --> B8
        B8 --> B9
    end

    STEP1 --> STEP2

    subgraph STEP2["STEP 2: TAX AND TDS CONFIGURATION"]
        direction TB
        C1["System auto-loads Finance-verified IT Declaration submissions from the employee_submissions table for the current Financial Year"]
        C2["System auto-fetches Year-To-Date TDS history by querying computed_data from all prior confirmed or completed payruns in this Financial Year"]
        C3["For each employee, an expandable Tax Card displays: YTD Tax already deducted, Projected Annual Tax liability, and computed Monthly TDS amount"]
        C4["Admin can configure per-employee: Tax Regime selection between New and Old, Section 80C investments, 80D Medical for self and parents with senior citizen checkbox, NPS 80CCD-1B, Home Loan Interest under Section 24b, Donations under 80G and 80E, Savings Interest under 80TTA, Monthly Rent for HRA, and LTA claimed"]
        C5["Engine evaluates the annual tax liability under the selected regime using projected annual gross, applicable deductions, and HRA exemption"]
        C6["Monthly TDS is computed as: Annual Tax minus TDS already deducted, divided by the number of months remaining in the Financial Year"]
        C7["For employees with an exit date set, the system validates whether the computed TDS exceeds the net pay before TDS deduction. If it does, the TDS is auto-capped to prevent a negative net pay, and a warning is displayed."]
        C1 --> C2
        C2 --> C3
        C3 --> C4
        C4 --> C5
        C5 --> C6
        C6 --> C7
    end

    STEP2 --> STEP3

    subgraph STEP3["STEP 3: TAX COMPUTATION REPORT"]
        direction TB
        D1["Master-detail layout: scrollable employee list panel on the left, detailed per-employee tax computation sheet on the right"]
        D2["Section 1 of the report shows Earnings Breakdown: a 4-column table with Actual Earnings YTD, Current Month Actual, Projected Future Earnings, and Total Annual Earning for Basic Salary, HRA, Special Allowances, and Total Gross"]
        D3["Section 2 shows Deductions and Exemptions: Standard Deduction amount, HRA Exemption calculated under Section 10-13A with formula trace, and all Chapter VI-A declarations with individual amounts"]
        D4["Section 3 shows Tax Liability Output: the slab-wise formula trace string, computed Annual Tax, and implied Monthly TDS based on remaining months"]
        D5["Any engine validation warnings are displayed at the top of Section 3 with warning icons, including exit auto-cap notices and Full-and-Final pending flags"]
        D1 --> D2
        D2 --> D3
        D3 --> D4
        D4 --> D5
    end

    STEP3 --> STEP4

    subgraph STEP4["STEP 4: CONFIRM PAYRUN AND EXPORT COMPLIANCE FILES"]
        direction TB
        E1["Payrun Summary Dashboard displays aggregated totals across all employees: Total Gross, Net Payable, Total EPF including EE and ER, Total ESIC including EE and ER, Total Professional Tax, Total LWF, and Total TDS"]
        E2["Payroll Register Preview table lists every employee with their individual Gross, EPF Employee share, ESIC Employee share, PT, LWF, TDS, Total Deductions, and Net Pay"]
        E3["Compliance Exports panel provides 7 download buttons: Bank Transfer CSV in selected bank format, EPF ECR v2 text file, ESIC Return text file, TDS 24Q Excel pre-fill, Professional Tax state-wise ZIP, LWF state-wise ZIP, and Full Payroll Register Excel"]
        E4["Admin clicks Confirm Payrun button which persists all per-employee adjustment and computed data snapshots to the payrun_adjustments table"]
        E5["Payrun status is updated from tax_checked to confirmed in the payruns table"]
        E1 --> E2
        E2 --> E3
        E3 --> E4
        E4 --> E5
    end

    STEP4 --> STEP5

    subgraph STEP5["STEP 5: SALARY SLIP GENERATION AND PUBLISHING"]
        direction TB
        F1["Salary Slip Preview renders for the selected employee with: company header and address, employee details grid, attendance summary row, earnings table with all components, deductions table with statutory and custom items, and a Net Pay take-home banner"]
        F2["Left panel shows the employee list with Department and Work State dropdown filters for narrowing the visible employees"]
        F3["Each employee row shows Published or Draft status. Admin can click Publish or Unpublish for individual employees."]
        F4["Bulk Publish via Filtered button publishes slips for all employees matching the active Department and State filters"]
        F5["Excel-based Targeting: Admin uploads an XLSX file containing an EMP_CODE column. The system matches employee codes and publishes corresponding slips."]
        F6["Download All Slips button exports every employee salary slip as a multi-sheet Excel workbook with one sheet per employee"]
        F7["Print or Save PDF button launches the native browser print dialog for the currently viewed salary slip"]
        F8["Complete Payroll button updates the payrun status to completed and resets the UI back to Step 0"]
        F1 --> F2
        F2 --> F3
        F3 --> F4
        F4 --> F5
        F5 --> F6
        F6 --> F7
        F7 --> F8
    end

    STEP5 --> DONE(["Payrun Completed Successfully"])

    DONE -.-> UNLOCK["Admin navigates to Payrun History and clicks the Unlock button on a confirmed or completed payrun"]
    UNLOCK --> AUDIT["System prompts for a mandatory unlock reason. Then writes an audit_logs entry containing the action type, reason text, user identity, and ISO timestamp to the payruns table."]
    AUDIT --> REVERT["Payrun status is reverted from confirmed or completed back to reviewed. The payrun is then re-opened at Step 1 for corrections."]
    REVERT --> STEP1
```

---

## 5. Functional Requirements by Step

### 5.1 Step 0 — Initiate Payrun

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-0.1 | System SHALL load all employees, existing payruns, and company settings from Supabase on module mount | P0 |
| FR-0.2 | User SHALL select a payroll month (1–12) and year | P0 |
| FR-0.3 | Employee roster SHALL display with columns: Checkbox, Emp Code, Name, Designation, Department, Joining Date, Regime | P0 |
| FR-0.4 | Employees with `salary_status = 'withheld'` or `'absconding'` SHALL be auto-excluded from default selection and "Select All" | P0 |
| FR-0.5 | Salary status badges (`WITHHELD`, `ABSCONDING`, `FNF`) SHALL be visually displayed alongside the tax regime badge | P1 |
| FR-0.6 | Department filter dropdown SHALL allow filtering the roster before selection | P1 |
| FR-0.7 | If a draft payrun for the selected month exists, system SHALL prompt user to resume instead of creating a duplicate | P0 |
| FR-0.8 | Summary card SHALL show count of selected employees and estimated Gross | P1 |
| FR-0.9 | "Payrun History" tab SHALL list all historical payruns with status, creation date, and action buttons (Open, Delete, Unlock) | P0 |
| FR-0.10 | Delete button SHALL only be available for non-confirmed, non-completed payruns | P0 |
| FR-0.11 | Unlock button SHALL only appear for `confirmed` or `completed` payruns | P0 |

### 5.2 Step 1 — Review & Adjust

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Master table SHALL display all selected employees with: Name, Code, Department, Gross, Net Pay, and status indicators | P0 |
| FR-1.2 | Clicking an employee row SHALL open the Adjustment Detail Pane (slide-over panel) | P0 |
| FR-1.3 | Adjustment inputs SHALL include: Days in Month, LOP Days, OT Hours, OT Rate, Leave Encashment Days, **Manual Deduction (₹)** | P0 |
| FR-1.4 | Salary Component Table SHALL display each component with: Name, Type Badge, Monthly Amount, Prorated Amount, Variable Payout input, and Final Amount | P0 |
| FR-1.5 | For `variable` type components, an editable "Variable Payout" input field SHALL be provided per component | P0 |
| FR-1.6 | Arrears section SHALL allow adding multiple arrear entries with: Historical Month selector, Days in Month, Historical Gross, Arrear Days | P0 |
| FR-1.7 | Arrear days SHALL be auto-clamped to `min(monthDays, paidDays)` with validation message | P0 |
| FR-1.8 | Live Computation Result panel SHALL display: Fixed Gross, Variable Pay, Total Gross, Net Pay | P0 |
| FR-1.9 | If `arrearDisplayMode = 'breakup'` and visibility includes `'review'`, component-wise arrear breakup SHALL be displayed | P1 |
| FR-1.10 | If `incentiveDisplayMode = 'breakup'`, individual variable component breakups SHALL be displayed | P1 |
| FR-1.11 | All adjustments SHALL be auto-persisted to Supabase (`payrun_adjustments` table) on change | P0 |

### 5.3 Step 2 — Tax & TDS Configuration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | For each employee, expandable tax card SHALL display: YTD Tax Deducted, Projected Annual Tax, Monthly TDS | P0 |
| FR-2.2 | System SHALL auto-load verified IT declarations from `employee_submissions` table for the current FY | P0 |
| FR-2.3 | System SHALL auto-fetch YTD TDS history from prior confirmed/completed payruns in the same FY | P0 |
| FR-2.4 | Tax regime selector SHALL allow switching between New and Old for each employee | P0 |
| FR-2.5 | Chapter VI-A inputs SHALL be editable: 80C, 80D Self, 80D Parents (+ senior citizen checkbox), 80CCD(1B) NPS, Home Loan Interest, 80G/80E, 80TTA/80TTB | P0 |
| FR-2.6 | Chapter VI-A inputs SHALL be disabled when tax regime is `new` | P0 |
| FR-2.7 | Monthly rent and LTA claimed inputs SHALL be provided for HRA exemption calculation | P1 |
| FR-2.8 | YTD history inputs SHALL be pre-populated but remain editable: YTD Gross, Basic, HRA, TDS, and Months Remaining | P0 |
| FR-2.9 | City type (Metro/Non-Metro) SHALL be auto-derived from work city | P0 |

### 5.4 Step 3 — Tax Report

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Master-detail layout: employee list on left, detailed tax computation sheet on right | P0 |
| FR-3.2 | **Section 1 — Earnings Breakdown:** 4-column table with YTD Actuals, Current Month, Projected Future, and Total for Basic, HRA, Special Allowances, and Gross | P0 |
| FR-3.3 | **Section 2 — Deductions & Exemptions:** Standard Deduction (₹75k new / ₹50k old), HRA Exemption (Sec 10(13A)), and Chapter VI-A declarations | P0 |
| FR-3.4 | **Section 3 — Tax Liability Output:** Formula trace string, Annual Tax, Monthly TDS, Months remaining | P0 |
| FR-3.5 | Engine validation warnings (exit auto-cap, FnF flag) SHALL be displayed prominently with ⚠️ icons | P0 |

### 5.5 Step 4 — Confirm & Export

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Payrun Summary Dashboard SHALL show aggregated totals: Total Gross, Net Payable, EPF, ESIC, PT, LWF, TDS | P0 |
| FR-4.2 | Payroll Register Preview SHALL list all employees with per-employee breakdown of Gross, EPF EE, ESIC EE, PT, LWF, TDS, Total Deductions, Net Pay | P0 |
| FR-4.3 | **Bank Transfer File** export SHALL support formats: HDFC, ICICI, SBI, Axis, Generic CSV | P0 |
| FR-4.4 | **EPF ECR v2** export SHALL generate UAN-based text file | P0 |
| FR-4.5 | **ESIC Return** export SHALL generate IP Number-based contribution file | P0 |
| FR-4.6 | **TDS 24Q** pre-fill stub SHALL be exported as Excel | P0 |
| FR-4.7 | **Professional Tax** return SHALL be exported as state-wise ZIP (each state as a separate Excel within the archive) | P0 |
| FR-4.8 | **LWF Statement** SHALL be exported as state-wise ZIP | P0 |
| FR-4.9 | **Payroll Register** (full) SHALL be exported as Excel with all component columns | P0 |
| FR-4.10 | "Confirm Payrun" action SHALL: persist all adjustments + computed data to `payrun_adjustments`, update payrun status to `confirmed` | P0 |

### 5.6 Step 5 — Salary Slips

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Salary Slip SHALL render with: Company header, employee details grid, attendance summary, earnings table, deductions table, and Net Pay banner | P0 |
| FR-5.2 | If `showYTDOnPayslip = true`, a YTD column SHALL appear in both earnings and deductions tables | P1 |
| FR-5.3 | If `incentiveDisplayMode = 'breakup'`, variable components SHALL be listed individually in the slip | P1 |
| FR-5.4 | If `arrearDisplayMode = 'breakup'` with `slip` visibility, arrear components SHALL be listed individually | P1 |
| FR-5.5 | Employer contributions (PF, ESIC) SHALL be shown in the Net Pay footer as informational, not deducted from take-home | P0 |
| FR-5.6 | Employee list panel SHALL support Department and Work State (Location) dropdown filters | P1 |
| FR-5.7 | "Publish Filtered" button SHALL publish slips for all employees matching current filters | P1 |
| FR-5.8 | **Excel Upload Targeting** SHALL accept an `.xlsx` file with an `EMP_CODE` column and publish matching employee slips | P1 |
| FR-5.9 | "Download All" SHALL export all salary slips as a multi-sheet Excel workbook (one sheet per employee) | P0 |
| FR-5.10 | "Print / Save PDF" SHALL print the currently viewed salary slip using native browser print dialog | P0 |
| FR-5.11 | "Complete Payroll" SHALL update payrun status to `completed` and reset the view to Step 0 | P0 |

---

## 6. Formula Reference — Complete Computation Formulae

This section documents every formula implemented in the payroll computation engine (`payrollEngine.js`).

### 6.1 Component Resolution (3-Pass)

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-1 | Monthly Value (Annual Mode) | `monthlyAmount = annualAmount / 12` | Applied when `inputMode = 'annual'` |
| F-2 | Formula-Based Component | `resolvedAmount = evaluate(formulaString, { basic: scopeBasic })` | e.g., HRA = `basic * 0.40` |
| F-3 | Scope Basic (for formulae) | `scopeBasic = SUM(amount) for all components where type = 'earnings_basic'` | Pre-calculated before Pass 2 |

### 6.2 Attendance and Proration

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-4 | Attendance Factor | `attendanceFactor = max(0, (daysInMonth - lopDays) / daysInMonth)` | Range: 0.0 to 1.0 |
| F-5 | Prorated Basic | `basic = standardBasic × attendanceFactor` | |
| F-6 | Prorated HRA | `hra = standardHRA × attendanceFactor` | |
| F-7 | Prorated Special Allowance | `special = standardSpecial × attendanceFactor` | |
| F-8 | Attended Days | `attendedDays = daysInMonth - lopDays` | |

### 6.3 Additional Earnings

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-9 | Overtime Pay | `overtimePay = overtimeHours × otRate` | Per-hour rate |
| F-10 | Leave Encashment Pay | `leaveEncashmentPay = (standardGross / 26) × leaveEncashmentDays` | 26 working days assumed per month |

### 6.4 Arrears

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-11 | Arrear Eligible Days Cap | `maxEligibleDays = max(0, min(historicalMonthDays, currentPaidDays))` | Prevents over-claim |
| F-12 | Accepted Arrear Days | `acceptedDays = min(requestedDays, maxEligibleDays)` | Auto-clamped |
| F-13 | Arrears for Single Entry | `arrear = (historicalGross / historicalMonthDays) × acceptedDays` | Daily rate × days |
| F-14 | Total Arrears | `arrearsPay = SUM(arrear) for all entries` | |
| F-15 | Arrear Component Breakup | `componentArrear = arrearsPay × (componentAmount / totalEarningComponents)` | Pro-rata by component weight |

### 6.5 Gross Salary

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-16 | Standard Gross | `standardGross = standardBasic + standardHRA + standardSpecial + variableTarget + (reimbursements if monthly strategy)` | Pre-proration gross |
| F-17 | Gross Salary | `grossSalary = basic + hra + special + overtimePay + arrearsPay + leaveEncashmentPay + variablePay + (reimbursements × attendanceFactor if monthly strategy)` | Post-proration actual gross |

### 6.6 Tax Projection

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-18 | Past Months in FY | `pastMonths = (payrollMonth >= 3) ? (payrollMonth - 3) : (payrollMonth + 9)` | April = month 3 → 0 past months |
| F-19 | Future Months in FY | `futureMonths = max(0, effectiveMonthsRemaining - 1)` | Excludes current month |
| F-20 | Projected Annual Gross | `annualGross = ytdGross + currentGross + (standardGross × futureMonths)` | If no YTD data: `standardGross × pastMonths` replaces ytdGross |
| F-21 | Projected Annual Basic | `projectedAnnualBasic = ytdBasic + currentBasic + (standardBasic × futureMonths)` | |
| F-22 | Projected Annual HRA | `projectedAnnualHRA = ytdHRA + currentHRA + (standardHRA × futureMonths)` | |
| F-23 | Exit Months Adjustment | `exitMonths = ceil((exitDate - payrollStartDate) / (1000 × 60 × 60 × 24 × 30))` | Overrides monthsRemaining if smaller |

### 6.7 HRA Exemption (Old Regime Only)

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-24 | HRA Component 1 — Actual HRA | `hraActual = projectedAnnualHRA` | Total HRA received in FY |
| F-25 | HRA Component 2 — Rent Excess | `hraRentExcess = max(0, annualRent - 0.10 × projectedAnnualBasic)` | Rent paid minus 10% of Basic |
| F-26 | HRA Component 3 — City Limit | `hraCityLimit = (isMetro ? 0.50 : 0.40) × projectedAnnualBasic` | Metro = 50%, Non-Metro = 40% |
| F-27 | HRA Exemption | `hraExempt = min(hraActual, hraRentExcess, hraCityLimit)` | Least of the three |

### 6.8 Taxable Income

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-28 | Old Regime — Total Deductions | `totalDeductions = min(150000, 80C) + min(25000, 80D_self) + min(parentLimit, 80D_parents) + min(50000, NPS) + min(200000, homeLoan) + 80GE + 80TTA + LTA + 50000 + hraExempt + leaveEncashmentExempt` | `parentLimit` = 50000 if senior, 25000 otherwise |
| F-29 | Old Regime — Taxable Income | `taxableIncome = max(0, annualGross - totalDeductions)` | |
| F-30 | New Regime — Taxable Income | `taxableIncome = max(0, annualGross - 75000 - leaveEncashmentExempt)` | Only standard deduction applies |

### 6.9 Tax Computation

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-31 | Annual Tax (any regime) | `annualTax = baseTax × 1.04` | baseTax from slab computation, 1.04 = 4% H&E Cess |
| F-32 | Old Regime — 87A Rebate | `if taxableIncome <= 500000 then annualTax = 0` | |
| F-33 | New Regime — 87A Rebate | `if taxableIncome <= 1200000 then annualTax = 0` | |

### 6.10 TDS (Monthly Income Tax Deduction)

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-34 | Remaining Tax | `remainingTax = max(0, annualTax - tdsDeductedSoFar)` | |
| F-35 | Monthly TDS | `tds = remainingTax / effectiveMonthsRemaining` | Spread evenly across remaining FY months |
| F-36 | Exit TDS Auto-Cap | `if (exit_date AND tds > netPayBeforeTDS) then tds = max(0, netPayBeforeTDS)` | Prevents negative net pay |

### 6.11 Statutory Deductions

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-37 | EPF Employee (Flat Ceiling) | `pfEmployee = min(1800, standardBasic × 0.12)` | Default method |
| F-38 | EPF Employee (Actual Basic) | `pfEmployee = basic × 0.12` | No ceiling |
| F-39 | EPF Employee (Prorated) | `pfEmployee = min(1800 × attendanceFactor, basic × 0.12)` | Ceiling scales with attendance |
| F-40 | EPF Employer | `pfEmployer = pfEmployee` | Mirrors employee contribution |
| F-41 | EPF — EPS Component | `pfEps = min(1250, pfEmployer × (8.33 / 12))` | Pension fund allocation |
| F-42 | EPF — ER Share | `pfErShare = pfEmployer - pfEps` | Remaining employer PF |
| F-43 | ESIC Employee | `esiEmployee = (grossSalary <= 21000) ? grossSalary × 0.0075 : 0` | 0.75% if eligible |
| F-44 | ESIC Employer | `esiEmployer = (grossSalary <= 21000) ? grossSalary × 0.0325 : 0` | 3.25% if eligible |
| F-45 | Professional Tax | `pt = getPT(work_state, grossSalary, payrollMonth, ptMode, doj, year)` | State-specific slab function (see Section 8.4) |
| F-46 | Labour Welfare Fund | `lwf = getLWF(work_state, payrollMonth, doj, year)` | State-specific fixed amounts (see Section 8.4) |

### 6.12 Net Pay

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-47 | Total Deductions | `totalDeductions = pfEmployee + esiEmployee + pt + lwf + employeeDeductions + tds` | `employeeDeductions` = custom deductions from salary structure + manual ad-hoc deduction |
| F-48 | Net Pay | `netPay = grossSalary - totalDeductions + (reimbursements if year-end strategy)` | Reimbursements added back if not already in gross |

### 6.13 Leave Encashment Exemption (Exit)

| ID | Formula Name | Formula | Notes |
|----|-------------|---------|-------|
| F-49 | Retirement Leave Encashment Exempt | `leaveEncashmentExempt = (exit_reason === 'Retirement') ? min(leaveEncashmentPay, 2500000) : 0` | ₹25L max under Section 10(10AA) |

---

## 7. Computation Engine — Functional Specification

The payroll engine (`computeEmployeePayroll`) is a pure function that accepts an employee object enriched with adjustments and returns a fully computed payroll result.

### 7.1 Engine Input/Output Contract

**Inputs:** Employee salary components, attendance (days, LOP), overtime, arrear entries, variable payouts, tax declarations, YTD history, exit lifecycle, salary status, and company settings.

**Outputs:** Monthly computed payroll including earnings breakdown, statutory deductions, tax liability, net pay, and validation warnings (55+ fields total).

### 7.2 Engine Computation Flow

```mermaid
flowchart TD
    INPUT(["Employee Object containing salary components, attendance adjustments, tax overrides, exit info, and salary status"]) --> STATUS_CHECK

    STATUS_CHECK{"Is salary_status set to withheld or absconding?"}
    STATUS_CHECK -- "Yes: salary is stopped" --> ZERO_OUT["Return a zeroed-out payroll object with all earnings, deductions, and net pay set to zero. Set salaryWithheld flag to true with the appropriate reason string."]
    STATUS_CHECK -- "No: proceed with computation" --> PASS1

    subgraph RESOLUTION["3-Pass Salary Component Resolution"]
        PASS1["PASS 1 - Resolve Numeric Amounts: Convert each component amount to a number. If inputMode is annual, divide the stored annual amount by 12 to get the monthly value."]
        PASS2["PASS 2 - Resolve Formula Strings: For components with formula-based amounts like basic times 0.40, evaluate the string expression using the pre-calculated scope basic from Pass 1."]
        PASS3["PASS 3 - Hydrate Statutory Blanks: For EPF, ESIC, PT, and LWF components that have blank or zero amounts, auto-calculate using the appropriate statutory rules based on state, gross, and EPF method."]
        PASS1 --> PASS2 --> PASS3
    end

    PASS3 --> ACCUMULATE

    ACCUMULATE["Final Accumulation: Iterate all resolved components and bucket them into standardBasic, standardHRA, standardSpecial, monthlyReimbursements, employerContribs, employeeDeductions, variableTarget, and variablePay."]

    ACCUMULATE --> ATTEND

    ATTEND["Attendance Proration: Calculate attendanceFactor as daysInMonth minus lopDays divided by daysInMonth. Multiply standardBasic, standardHRA, and standardSpecial by this factor to get prorated basic, hra, and special amounts."]

    ATTEND --> ARREARS

    ARREARS["Arrears Calculation: For each arrear entry, compute daily rate as historicalGross divided by historicalMonthDays, multiply by accepted arrear days. Auto-clamp requested days to min of historical month days and current paid days. Generate component-wise proportional breakup."]

    ARREARS --> GROSS

    GROSS["Gross Salary Computation: Sum of prorated basic, hra, special allowance, overtime pay, arrears pay, leave encashment pay, variable pay, and reimbursements if using monthly reimbursement tax strategy."]

    GROSS --> TAX_PROJ

    TAX_PROJ["Tax Projection: Project annual gross as YTD actual gross plus current month gross plus standard gross times future months remaining. If an exit date is set, cap future months using ceiling of days-difference divided by 30."]

    TAX_PROJ --> TAX_CALC

    TAX_CALC["Tax Computation: Call evaluateTaxLiability with the projected annual gross, selected tax regime, all Chapter VI-A deduction caps, HRA exemption inputs, and leave encashment exemption. The function applies the regime-specific slab rates and returns annual tax, formula trace, and HRA breakdown."]

    TAX_CALC --> TDS

    TDS["Monthly TDS Calculation: Compute remaining tax as annual tax minus TDS already deducted year-to-date. Divide by effective months remaining in the Financial Year to get the monthly TDS amount."]

    TDS --> STAT

    STAT["Statutory Deductions: Calculate EPF employee and employer contributions using the configured method with flat ceiling, actual basic, or prorated ceiling. Calculate ESIC at 0.75 percent employee and 3.25 percent employer if gross is at or below 21000. Calculate Professional Tax using state-specific slab function. Calculate LWF using state-specific amount function."]

    STAT --> VALIDATE

    VALIDATE{"Does the employee have an exit date set AND does the computed TDS exceed the net pay before TDS?"}
    VALIDATE -- "Yes: TDS would cause negative net pay" --> CAP["Auto-cap the TDS to the maximum of zero and net pay before TDS. Push a validation warning message to the engineValidations array explaining the auto-cap."]
    VALIDATE -- "No: TDS is within safe limits" --> FNF_CHECK
    CAP --> FNF_CHECK

    FNF_CHECK{"Is salary_status set to fnf_pending?"}
    FNF_CHECK -- "Yes" --> FNF_WARN["Push an advisory validation warning: This computation is flagged as Full and Final Pending"]
    FNF_CHECK -- "No" --> NET
    FNF_WARN --> NET

    NET["Net Pay Computation: Net Pay equals Gross Salary minus Total Deductions which is EPF plus ESIC plus PT plus LWF plus custom employee deductions plus TDS, then add back reimbursements if using year-end reimbursement tax strategy."]

    NET --> OUTPUT(["Return the complete computed payroll object containing 55 plus fields including all earnings, deductions, tax details, breakups, and validation messages"])
```

### 7.3 Tax Regime Slab Tables

#### New Regime (FY 2025-26)

| Taxable Income Slab | Tax Rate |
|---------------------|----------|
| Up to ₹4,00,000 | Nil |
| ₹4,00,001 – ₹8,00,000 | 5% |
| ₹8,00,001 – ₹12,00,000 | 10% |
| ₹12,00,001 – ₹16,00,000 | 15% |
| ₹16,00,001 – ₹20,00,000 | 20% |
| ₹20,00,001 – ₹24,00,000 | 25% |
| Above ₹24,00,000 | 30% |

- Standard Deduction: ₹75,000
- Rebate u/s 87A: Full rebate if taxable income ≤ ₹12,00,000
- Cess: 4% Health & Education Cess on tax amount

#### Old Regime

| Taxable Income Slab | Tax Rate |
|---------------------|----------|
| Up to ₹2,50,000 | Nil |
| ₹2,50,001 – ₹5,00,000 | 5% |
| ₹5,00,001 – ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |

- Standard Deduction: ₹50,000
- Rebate u/s 87A: Full rebate if taxable income ≤ ₹5,00,000
- Eligible for Chapter VI-A deductions (80C, 80D, 80CCD, 24(b), 80G, 80E, 80TTA/TTB)
- HRA Exemption u/s 10(13A): `min(Actual HRA, Rent - 10% Basic, 50%/40% Basic)`

### 7.4 Statutory Deduction Logic

#### Professional Tax (PT)

State-specific monthly/half-yearly/annual slabs covering:
- **Monthly States:** KA, MH, WB, GJ, AP, TG, JH, AS, MP
- **Half-Yearly States:** TN, KL, PY — with `lump_sum` (deduct in Sept/Mar) or `prorate` (monthly) modes
- **Annual States:** OD, SK, BR, MZ — deducted in June
- **Exempt States:** DL, RJ, HR, UP, PB, HP, UK, GA, CH

#### Labour Welfare Fund (LWF)

State-specific biannual/annual deductions:
- **KA, MH, GJ:** June & December
- **WB:** July
- **TN:** January
- **AP, TG:** June only

#### EPF Calculation Methods

| Method | Logic |
|--------|-------|
| `flat_ceiling` | `min(₹1,800, Basic × 12%)` — default |
| `actual_basic` | `Basic × 12%` — no ceiling |
| `prorated_ceiling` | `min(₹1,800 × attendanceFactor, Basic × 12%)` |

---

## 8. Configurable Display & Preferences

These settings are managed under **Company Settings → Payroll Cycle Configuration** and stored in the `company_settings` JSON.

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

---

## 9. Salary Status Management

| Status | Behavior |
|--------|----------|
| `active` | Normal payroll processing. Default for all employees. |
| `withheld` | Employee is excluded from "Select All" and auto-selection. If manually included, engine returns zero net pay with `salaryWithheld = true` and a bypass message. |
| `absconding` | Same as withheld, with a different visual badge (red border) and reason string. |
| `fnf_pending` | Employee processes normally but engine adds a validation warning: *"This computation is flagged as Full & Final (FnF) Pending."* Serves as an accounting-attention flag. |

---

## 10. Post-Finalization Correction Workflow

```mermaid
sequenceDiagram
    actor Admin as Finance Admin
    participant UI as Payrun History UI
    participant API as Supabase API Layer
    participant DB as payruns Table in PostgreSQL

    Admin->>UI: Clicks the Unlock button on a confirmed or completed payrun entry
    UI->>Admin: Displays a modal prompt asking for a mandatory reason for unlocking the payrun
    Admin->>UI: Types the unlock reason text and submits
    UI->>API: Calls updatePayrunStatus with the payrun ID and new status of reviewed
    API->>DB: Executes UPDATE on payruns table setting status to reviewed
    UI->>API: Calls addPayrunAuditLog with the payrun ID, action type of unlock, reason text, user identity, and current ISO timestamp
    API->>DB: Appends a new JSON object to the audit_logs JSONB array column in the payruns table
    UI->>Admin: Displays a success toast confirming the payrun has been unlocked
    UI->>UI: Calls openPayrun to re-load the payrun and navigate to Step 1 for corrections
    Note over Admin,DB: The admin can now re-adjust salaries, re-confirm, and re-export compliance files
```

> [!WARNING]
> The audit log is **append-only**. Every unlock creates a permanent record with the reason, acting user, and ISO timestamp. This data cannot be deleted through the UI.

---

## 11. YTD (Year-To-Date) Aggregation Logic

YTD values are computed by querying all `payrun_adjustments.computed_data` snapshots from prior confirmed/completed payruns within the same Financial Year (April–March).

**Aggregated Fields:**
- `ytdGross` — Cumulative Gross Salary
- `ytdBasic` — Cumulative Basic
- `ytdHRA` — Cumulative HRA
- `ytdNetPay` — Cumulative Net Pay
- `ytdTotalDeductions` — Cumulative Deductions
- `ytdComponents` — Per-component ID cumulative amounts
- `tdsDeductedSoFar` — Cumulative TDS deducted

These YTD values are injected into the engine and additionally displayed in the Salary Slip (when `showYTDOnPayslip = true`) and Tax Report (always).

---

## 12. Compliance Export Specifications

| Export | Format | Content |
|--------|--------|---------|
| **Bank Transfer** | CSV | Bank-specific column ordering (HDFC, ICICI, SBI, Axis, Generic) |
| **EPF ECR v2** | TXT | `UAN #~# Gross #~# EE(12%) #~# EPS(8.33%) #~# EPF-ER(3.67%)` |
| **ESIC Return** | TXT | `IP Number | Days Worked | Gross | EE Contrib (0.75%) | ER Contrib (3.25%)` |
| **TDS 24Q** | XLSX | PAN, Name, Gross, Annual Tax, Monthly TDS, Regime |
| **Professional Tax** | ZIP (XLSX per state) | Grouped by `work_state`, each state exported as separate XLSX |
| **LWF** | ZIP (XLSX per state) | Grouped by `work_state`, each state exported as separate XLSX |
| **Payroll Register** | XLSX | 22-column comprehensive register with all earnings, deductions, and employer contributions |

---

## 13. Exit & Full-and-Final (FnF) Handling

| Scenario | Engine Behavior |
|----------|----------------|
| `exit_date` is set | Future months for tax projection are capped using `ceil((exitDate - payrollStartDate) / 30)` |
| `exit_reason = 'Retirement'` | Leave Encashment up to ₹25L is exempted from taxable income |
| TDS exceeds Net Pay (exit case) | TDS is auto-capped to `max(0, netPayBeforeTDS)` with a validation warning pushed to `engineValidations` |
| `salary_status = 'fnf_pending'` | Engine adds advisory warning; computation proceeds normally |

---

## 14. IT Declaration & Reimbursement Integration

Verified declarations from the Employee Portal flow into the payrun automatically:

1. Employee submits IT declaration via Employee Portal → stored in `employee_submissions` with `status = 'submitted'`
2. Finance team reviews and verifies via Finance Verification Dashboard → `status = 'verified'`, `verified_data` is populated
3. At Step 2 of a payrun, the system queries all verified submissions for the current FY
4. Verified values (80C, 80D, NPS, Home Loan, etc.) are auto-populated into the employee's tax override fields
5. Admin can override any auto-populated value manually

---

## 15. Prerequisites and Assumptions

### 15.1 Infrastructure Prerequisites

| Prerequisite | Description |
|-------------|-------------|
| **Supabase Project** | A live Supabase project with PostgreSQL database must be provisioned and accessible. The Supabase URL and anon key must be configured in the application. |
| **Database Tables** | All 5 tables (`employees`, `payruns`, `payrun_adjustments`, `company_settings`, `employee_submissions`) must be created with the schema defined in Section 3. The `supabase_updates.sql` migration script must be executed against the database before first use. |
| **Row-Level Security** | RLS policies must be enabled on all tables. The current implementation uses a permissive "allow all" policy; production deployments should implement role-based access control. |
| **Storage Bucket** | An `employee-proofs` storage bucket must exist in Supabase for reimbursement proof file uploads. |
| **Browser** | Modern browser (Chrome 90+, Edge 90+, Firefox 88+, Safari 14+) with JavaScript enabled. The system uses ES2020+ features, dynamic `import()`, and the `Blob` API. |
| **CDN Access** | Internet connectivity is required for loading JSZip via ESM CDN (`cdn.jsdelivr.net`) for state-wise ZIP export generation. |

### 15.2 Data Prerequisites

| Prerequisite | Description |
|-------------|-------------|
| **Employee Records** | At least one active employee must exist in the `employees` table with a valid `salary_structure` (array of salary component objects) before a payrun can be initiated. |
| **Salary Structure** | Each employee's `salary_structure` must contain at minimum one `earnings_basic` type component. HRA and Special Allowance components are expected but optional. |
| **Company Settings** | A singleton `company_settings` row must exist. If absent, the system falls back to hardcoded defaults defined in `settingsStore.js`. |
| **Financial Year Convention** | The Financial Year runs from April (month index 3) to March (month index 2). All YTD aggregation, month-remaining calculations, and history queries assume this convention. |
| **Input Mode Consistency** | The `input_mode` field on each employee must accurately reflect whether the `salary_structure` amounts are stored as monthly or annual values. Mismatched modes will produce incorrect computations. |

### 15.3 Computation Assumptions

| Assumption | Description |
|-----------|-------------|
| **26 Working Days per Month** | Leave encashment daily rate is computed as `standardGross / 26`, assuming 26 working days in a month. |
| **Calendar-Day Proration** | LOP proration is based on calendar days: `(daysInMonth - lopDays) / daysInMonth`. The actual number of calendar days in the payroll month is used (28/29/30/31). |
| **Single Financial Year per Payrun** | A payrun is always associated with a single Financial Year. Cross-FY payruns (e.g., a payrun for March with adjustments from April) are not supported. |
| **EPF Wage Ceiling** | Under `flat_ceiling` method, the statutory EPF contribution ceiling is ₹1,800 per month (based on ₹15,000 basic wage ceiling × 12%). |
| **ESIC Wage Ceiling** | ESIC applicability threshold is ₹21,000 gross salary per month. Employees earning above this are exempt from ESIC. |
| **Metro City Classification** | Only Mumbai, Delhi, New Delhi, Kolkata, and Chennai are classified as Metro cities for HRA exemption (50% of Basic). All other cities use the Non-Metro rate (40% of Basic). |
| **Tax Regime Lock** | The tax regime (Old/New) can be changed per-payrun per-employee at Step 2, but this override is local to the payrun. The employee's master record regime is not modified. |
| **YTD from Confirmed Payruns** | YTD aggregation only considers payruns with status `confirmed` or `completed`. Draft or initiated payruns are excluded from historical data. |
| **Single Payrun per Month** | The system warns against duplicate payruns for the same month but does not strictly enforce uniqueness. Multiple payruns for the same month may exist if the user bypasses the warning. |
| **No Retroactive Tax Revision** | The engine computes tax based on the current state of declarations and projections. It does not retroactively recalculate prior months' TDS if investments change. The spread is only forward-looking. |
| **Client-Side Only** | All payroll computations run in the browser. There is no server-side validation of computed values. The `computed_data` snapshot persisted to Supabase is a record of what the client calculated, not a server-verified result. |
| **Statutory Slab Accuracy** | PT and LWF slabs are based on publicly available state government notifications as of the system build date. State regulatory changes after deployment require manual code updates to `getPT()` and `getLWF()` functions. |
| **Employer PF Equals Employee PF** | The system assumes employer PF contribution equals employee PF contribution (`pfEmployer = pfEmployee`). The EPS (8.33% of 12%) and EPF-ER (3.67%) split is applied on the employer side for ECR reporting. |
| **Reimbursement Tax Strategy** | Two strategies are supported: `monthly` (reimbursements included in monthly gross and taxed) and `year_end` (reimbursements excluded from gross and added to net pay). The default is `year_end`. |
| **No Mid-Month Joining Proration** | The system does not automatically prorate salary for employees joining mid-month. The admin must manually adjust LOP days or Days in Month in Step 1 to account for partial-month joining. |

---

## 16. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | All payroll computations SHALL execute client-side with no network dependency during computation |
| NFR-2 | Adjustment persistence SHALL use upsert semantics to prevent duplicate records |
| NFR-3 | ZIP file generation for state-wise exports SHALL use dynamic ESM import of JSZip (CDN-based) |
| NFR-4 | Salary slip printing SHALL use native `window.print()` with DOM injection |
| NFR-5 | All monetary values SHALL be rounded to nearest integer for display and export |
| NFR-6 | Indian number formatting (`en-IN` locale) SHALL be used consistently across all monetary displays |

---

## 17. Glossary

| Term | Definition |
|------|------------|
| **Payrun** | A single monthly payroll processing cycle for a set of employees |
| **LOP** | Loss of Pay — unpaid days deducted from gross |
| **TDS** | Tax Deducted at Source — monthly income tax deduction |
| **ECR** | Electronic Challan cum Return — EPF filing format |
| **FnF** | Full and Final — settlement computation for exiting employees |
| **YTD** | Year-To-Date — cumulative values from April to current month |
| **Chapter VI-A** | Income Tax Act sections 80C through 80U for tax-saving deductions (Old Regime only) |
| **Metro** | Mumbai, Delhi, Kolkata, Chennai — 50% Basic for HRA exemption |
| **Non-Metro** | All other cities — 40% Basic for HRA exemption |
| **FY** | Financial Year — April 1 to March 31 |
| **CTC** | Cost to Company — total employer cost including all contributions |
| **H&E Cess** | Health and Education Cess — 4% surcharge on computed income tax |
| **EPS** | Employee Pension Scheme — 8.33% of employer PF contribution, capped at ₹1,250/month |
| **RLS** | Row-Level Security — Supabase/PostgreSQL feature for data access control |
