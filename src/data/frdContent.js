// Auto-generated from payroll_frd_updated.md — FRD v3.0
// This module exports the FRD content as structured sections for rendering in the FRD Tab.

export const FRD_META = {
  title: "Payroll Operations Module — Functional Requirement Document (FRD)",
  version: "3.0",
  date: "April 24, 2026",
  module: "Payroll Operations (PayrollOpsTab)",
  application: "Payroll Traceability Matrix",
  backend: "Supabase (PostgreSQL + RLS)",
  frontend: "React (Vite)",
};

export const FRD_SECTIONS = [
  {
    id: "exec-summary",
    number: "1",
    title: "Executive Summary",
    content: `The Payroll Operations Module is the core transactional engine within the Payroll Traceability Matrix application. It orchestrates the end-to-end monthly salary computation and disbursement lifecycle for Indian payroll, encompassing:

• Employee roster selection and payrun initiation
• Per-employee salary review with attendance, overtime, arrears, and variable pay adjustments
• Income tax (TDS) computation under both Old and New regimes (FY 2025-26 Budget slabs)
• Statutory deduction calculations (EPF, ESIC, Professional Tax, Labour Welfare Fund) with state-specific logic
• Compliance file exports (Bank transfer files, EPF ECR, ESIC returns, TDS 24Q, PT/LWF state-wise ZIPs)
• Salary slip generation, publishing, and bulk operations
• Post-finalization correction (unlock) workflows with audit logging
• Salary status management (Active, Withheld, Absconding, FnF Pending)`,
    callout: {
      type: "important",
      text: "All calculations are performed client-side by a deterministic computation engine (payrollEngine.js). The backend (Supabase) stores configuration, employee records, payrun metadata, and per-employee adjustments. There is no server-side computation layer — the engine is pure JavaScript."
    }
  },
  {
    id: "architecture",
    number: "2",
    title: "System Architecture",
    intro: "Frontend components and Supabase backend tables",
    diagram: `graph TD
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
    S2 --> ES`
  },
  {
    id: "db-schema",
    number: "3",
    title: "Database Schema",
    tables: [
      {
        name: "employees",
        description: "Employee master with salary and lifecycle data",
        columns: [
          ["id", "UUID (PK)", "Auto-generated unique identifier"],
          ["emp_code", "TEXT", "Human-readable employee code (e.g., EMP001)"],
          ["name", "TEXT", "Full name"],
          ["department", "TEXT", "Department name"],
          ["designation", "TEXT", "Job title"],
          ["date_of_joining", "DATE", "Employment start date"],
          ["is_active", "BOOLEAN", "Login/portal access flag"],
          ["salary_structure", "JSONB", "Array of salary component objects"],
          ["input_mode", "TEXT", "monthly or annual"],
          ["tax_regime", "TEXT", "new or old"],
          ["bank_info", "JSONB", "{ bank_name, account_no, ifsc }"],
          ["work_state", "TEXT", "State code for PT/LWF calculation"],
          ["work_city", "TEXT", "City name for HRA metro classification"],
          ["exit_date", "DATE", "Nullable — triggers exit/FnF projection"],
          ["exit_reason", "TEXT", "Resignation, Termination, Retirement"],
          ["salary_status", "TEXT", "active, withheld, absconding, fnf_pending"],
        ]
      },
      {
        name: "payruns",
        description: "Monthly payrun records with 6-stage lifecycle",
        columns: [
          ["id", "UUID (PK)", "Auto-generated"],
          ["month_year", "TEXT", 'e.g., "April 2026"'],
          ["status", "TEXT", "draft → initiated → reviewed → tax_checked → confirmed → completed"],
          ["audit_logs", "JSONB", "Array of { action, reason, user, timestamp } objects"],
          ["created_at", "TIMESTAMPTZ", "Creation timestamp"],
          ["updated_at", "TIMESTAMPTZ", "Last modification"],
        ]
      },
      {
        name: "payrun_adjustments",
        description: "Per-employee overrides and computed snapshots",
        columns: [
          ["payrun_id", "UUID (FK)", "Payrun reference"],
          ["employee_id", "UUID (FK)", "Employee reference"],
          ["adjustments", "JSONB", "Per-employee overrides: LOP, OT, arrears, variable, tax"],
          ["computed_data", "JSONB", "Snapshot of computed output (YTD source)"],
        ]
      },
      {
        name: "company_settings",
        description: "Singleton configuration row",
        columns: [
          ["id", "UUID (PK)", "Singleton row"],
          ["settings", "JSONB", "Full company configuration"],
        ]
      },
      {
        name: "employee_submissions",
        description: "IT declarations and reimbursement claims",
        columns: [
          ["employee_id", "UUID (FK)", "Submitting employee"],
          ["financial_year", "TEXT", 'e.g., "2026-27"'],
          ["type", "TEXT", "it_declaration or reimbursement"],
          ["status", "TEXT", "draft → submitted → verified / rejected"],
          ["submitted_data", "JSONB", "Employee's declared values and proof URLs"],
          ["verified_data", "JSONB", "Finance-approved values"],
        ]
      }
    ]
  },
  {
    id: "pipeline",
    number: "4",
    title: "Payroll Pipeline — Step-by-Step Lifecycle",
    intro: "The payroll pipeline consists of 6 sequential steps, each represented by a dedicated UI component and a set of functional requirements.",
    diagram: `flowchart TB
    START(["Finance Admin opens Payroll Operations module"]) --> LOAD["System loads all employees, payruns, and company settings from Supabase"]
    LOAD --> STEP0

    subgraph STEP0["STEP 0: INITIATE PAYRUN"]
        direction TB
        A1["Admin selects the Payroll Month and Year from dropdowns"]
        A2["Employee roster table displayed with Department filter"]
        A3["System auto-excludes Withheld/Absconding employees"]
        A4["Roster rows display salary status badges"]
        A5["Admin selects/deselects employees via checkboxes"]
        A6{"Draft payrun exists for this month?"}
        A7["Prompt to resume existing draft"]
        A8["Create new payrun record and save adjustment stubs"]
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
        B1["Master table: Name, Code, Dept, Gross, Net Pay"]
        B2["Click row to open Adjustment Detail Pane"]
        B3["Inputs: Days in Month, LOP, OT Hours/Rate, Leave Encashment, Manual Deduction"]
        B4["Salary Component Table with prorated amounts"]
        B5["Variable component payout input fields"]
        B6["Arrears section: Add entries with Historical Month, Gross, Days"]
        B7["Arrear days auto-clamped with validation warning"]
        B8["Live Computation: Fixed Gross, Variable Pay, Total Gross, Net Pay"]
        B1 --> B2 --> B3 --> B4 --> B5 --> B6 --> B7 --> B8
    end

    STEP1 --> STEP2

    subgraph STEP2["STEP 2: TAX AND TDS CONFIGURATION"]
        direction TB
        C1["Auto-load verified IT Declarations from employee_submissions"]
        C2["Auto-fetch YTD TDS from prior confirmed payruns"]
        C3["Tax Card: YTD Tax, Projected Annual Tax, Monthly TDS"]
        C4["Configure: Regime, 80C, 80D, NPS, HomeLoan, Rent, LTA"]
        C5["Engine evaluates annual tax liability"]
        C6["Monthly TDS = (Annual Tax - YTD TDS) / Months Remaining"]
        C7["Exit TDS auto-cap validation"]
        C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7
    end

    STEP2 --> STEP3

    subgraph STEP3["STEP 3: TAX COMPUTATION REPORT"]
        direction TB
        D1["Master-detail: Employee list + Tax computation sheet"]
        D2["Section 1: Earnings Breakdown - YTD, Current, Projected, Total"]
        D3["Section 2: Deductions and Exemptions - Std Deduction, HRA, Ch VI-A"]
        D4["Section 3: Tax Liability - Formula trace, Annual Tax, Monthly TDS"]
        D5["Engine validation warnings displayed"]
        D1 --> D2 --> D3 --> D4 --> D5
    end

    STEP3 --> STEP4

    subgraph STEP4["STEP 4: CONFIRM AND EXPORT"]
        direction TB
        E1["Summary Dashboard: Total Gross, Net, EPF, ESIC, PT, LWF, TDS"]
        E2["Payroll Register Preview table"]
        E3["7 Export buttons: Bank CSV, EPF ECR, ESIC, TDS 24Q, PT ZIP, LWF ZIP, Register"]
        E4["Confirm Payrun: persist adjustments and computed data"]
        E5["Status updated to confirmed"]
        E1 --> E2 --> E3 --> E4 --> E5
    end

    STEP4 --> STEP5

    subgraph STEP5["STEP 5: SALARY SLIPS"]
        direction TB
        F1["Salary Slip Preview with earnings, deductions, Net Pay"]
        F2["Dept and Work State filters"]
        F3["Publish/Unpublish individual slips"]
        F4["Bulk Publish via filters"]
        F5["Excel Upload targeting by EMP_CODE"]
        F6["Download All as multi-sheet XLSX"]
        F7["Print/Save PDF via browser dialog"]
        F8["Complete Payroll: status to completed"]
        F1 --> F2 --> F3 --> F4 --> F5 --> F6 --> F7 --> F8
    end

    STEP5 --> DONE(["Payrun Completed Successfully"])

    DONE -.-> UNLOCK["Admin clicks Unlock on confirmed/completed payrun"]
    UNLOCK --> AUDIT["Mandatory reason prompt, audit_logs entry written"]
    AUDIT --> REVERT["Status reverted to reviewed, re-open at Step 1"]
    REVERT --> STEP1`,
    steps: [
      {
        step: 0,
        component: "PayrollOps_Initiate",
        title: "Initiate Payrun",
        actions: [
          "Admin selects Payroll Month and Year from dropdowns",
          "Employee roster displayed with Department filter",
          "System auto-excludes employees with salary status Withheld or Absconding",
          "Roster rows display salary status badges (WITHHELD, ABSCONDING, FNF)",
          "Admin selects/deselects employees for inclusion via checkboxes",
          "System checks for existing draft payrun → prompts to resume or creates new",
          "New payrun record saved with initial adjustment stubs for each employee",
        ]
      },
      {
        step: 1,
        component: "PayrollOps_Review",
        title: "Review & Adjust Salaries",
        actions: [
          "Master table: Name, Code, Department, Gross, Net Pay",
          "Click row → slide-over Adjustment Detail Pane",
          "Inputs: Days in Month, LOP Days, OT Hours/Rate, Leave Encashment Days, Manual Deduction (₹)",
          "Salary Component Table: Name, Type Badge, Monthly, Prorated, Variable Payout, Final",
          "Variable components: editable payout input per component",
          "Arrears: Add entries with Historical Month, Days, Gross, Arrear Days",
          "Arrear days auto-clamped to min(monthDays, paidDays) with validation warning",
          "Live Computation: Fixed Gross, Variable Pay, Total Gross, Net Pay",
          "Configurable breakup display for arrears and incentives",
        ]
      },
      {
        step: 2,
        component: "PayrollOps_TaxTDS",
        title: "Tax & TDS Configuration",
        actions: [
          "Auto-load verified IT declarations from employee_submissions",
          "Auto-fetch YTD TDS from prior confirmed payruns in same FY",
          "Tax Card per employee: YTD Tax, Projected Annual Tax, Monthly TDS",
          "Configure: Regime (New/Old), 80C, 80D Self/Parents (senior citizen checkbox), NPS, Home Loan, 80G/80E, 80TTA, Rent, LTA",
          "Chapter VI-A inputs disabled when regime is New",
          "Engine evaluates annual tax → monthly TDS",
          "Exit TDS auto-cap validation (prevents negative net pay)",
        ]
      },
      {
        step: 3,
        component: "PayrollOps_TaxReport",
        title: "Tax Computation Report",
        actions: [
          "Master-detail layout: employee list + per-employee tax sheet",
          "Section 1 — Earnings Breakdown: YTD, Current Month, Projected Future, Total",
          "Section 2 — Deductions & Exemptions: Standard Deduction, HRA Exemption, Chapter VI-A",
          "Section 3 — Tax Liability: Formula trace, Annual Tax, Monthly TDS",
          "Engine validation warnings with ⚠️ icons (exit auto-cap, FnF flags)",
        ]
      },
      {
        step: 4,
        component: "PayrollOps_Confirm",
        title: "Confirm & Export",
        actions: [
          "Summary Dashboard: Total Gross, Net Payable, EPF, ESIC, PT, LWF, TDS",
          "Payroll Register Preview table with per-employee breakdown",
          "7 compliance export buttons: Bank CSV, EPF ECR, ESIC Return, TDS 24Q, PT ZIP, LWF ZIP, Full Register",
          "Confirm Payrun: persist adjustments + computed data, status → confirmed",
        ]
      },
      {
        step: 5,
        component: "PayrollOps_SlipViewer",
        title: "Salary Slips",
        actions: [
          "Slip Preview: company header, employee details, attendance, earnings, deductions, Net Pay",
          "YTD column (optional via showYTDOnPayslip setting)",
          "Arrear/variable breakup display (configurable)",
          "Dept & Work State dropdown filters",
          "Publish Filtered: bulk publish matching filter criteria",
          "Excel Upload Targeting: upload .xlsx with EMP_CODE column",
          "Download All: multi-sheet Excel workbook (one sheet per employee)",
          "Print/Save PDF: native browser dialog",
          "Complete Payroll: status → completed, reset to Step 0",
        ]
      },
    ]
  },
  {
    id: "requirements",
    number: "5",
    title: "Functional Requirements by Step",
    requirementGroups: [
      {
        group: "Step 0 — Initiate Payrun",
        items: [
          { id: "FR-0.1", req: "System SHALL load all employees, existing payruns, and company settings from Supabase on module mount", priority: "P0" },
          { id: "FR-0.2", req: "User SHALL select a payroll month (1–12) and year", priority: "P0" },
          { id: "FR-0.3", req: "Employee roster SHALL display with columns: Checkbox, Emp Code, Name, Designation, Department, Joining Date, Regime", priority: "P0" },
          { id: "FR-0.4", req: "Employees with salary_status = 'withheld' or 'absconding' SHALL be auto-excluded from default selection and \"Select All\"", priority: "P0" },
          { id: "FR-0.5", req: "Salary status badges SHALL be visually displayed alongside the tax regime badge", priority: "P1" },
          { id: "FR-0.6", req: "Department filter dropdown SHALL allow filtering the roster before selection", priority: "P1" },
          { id: "FR-0.7", req: "If a draft payrun for the selected month exists, system SHALL prompt user to resume instead of creating a duplicate", priority: "P0" },
          { id: "FR-0.8", req: "Summary card SHALL show count of selected employees and estimated Gross", priority: "P1" },
          { id: "FR-0.9", req: "Payrun History tab SHALL list all historical payruns with status, creation date, and action buttons", priority: "P0" },
          { id: "FR-0.10", req: "Delete button SHALL only be available for non-confirmed, non-completed payruns", priority: "P0" },
          { id: "FR-0.11", req: "Unlock button SHALL only appear for confirmed or completed payruns", priority: "P0" },
        ]
      },
      {
        group: "Step 1 — Review & Adjust",
        items: [
          { id: "FR-1.1", req: "Master table SHALL display all selected employees with: Name, Code, Department, Gross, Net Pay, and status indicators", priority: "P0" },
          { id: "FR-1.2", req: "Clicking an employee row SHALL open the Adjustment Detail Pane", priority: "P0" },
          { id: "FR-1.3", req: "Adjustment inputs SHALL include: Days in Month, LOP Days, OT Hours, OT Rate, Leave Encashment Days, Manual Deduction (₹)", priority: "P0" },
          { id: "FR-1.4", req: "Salary Component Table SHALL display each component with: Name, Type Badge, Monthly Amount, Prorated Amount, Variable Payout, Final Amount", priority: "P0" },
          { id: "FR-1.5", req: "For variable type components, an editable Variable Payout input field SHALL be provided", priority: "P0" },
          { id: "FR-1.6", req: "Arrears section SHALL allow adding multiple arrear entries with: Historical Month, Days in Month, Historical Gross, Arrear Days", priority: "P0" },
          { id: "FR-1.7", req: "Arrear days SHALL be auto-clamped to min(monthDays, paidDays) with validation message", priority: "P0" },
          { id: "FR-1.8", req: "Live Computation Result panel SHALL display: Fixed Gross, Variable Pay, Total Gross, Net Pay", priority: "P0" },
          { id: "FR-1.9", req: "If arrearDisplayMode = 'breakup' and visibility includes 'review', component-wise arrear breakup SHALL be displayed", priority: "P1" },
          { id: "FR-1.10", req: "If incentiveDisplayMode = 'breakup', individual variable component breakups SHALL be displayed", priority: "P1" },
          { id: "FR-1.11", req: "All adjustments SHALL be auto-persisted to Supabase on change", priority: "P0" },
        ]
      },
      {
        group: "Step 2 — Tax & TDS Configuration",
        items: [
          { id: "FR-2.1", req: "For each employee, expandable tax card SHALL display: YTD Tax Deducted, Projected Annual Tax, Monthly TDS", priority: "P0" },
          { id: "FR-2.2", req: "System SHALL auto-load verified IT declarations from employee_submissions table for the current FY", priority: "P0" },
          { id: "FR-2.3", req: "System SHALL auto-fetch YTD TDS history from prior confirmed/completed payruns", priority: "P0" },
          { id: "FR-2.4", req: "Tax regime selector SHALL allow switching between New and Old for each employee", priority: "P0" },
          { id: "FR-2.5", req: "Chapter VI-A inputs SHALL be editable: 80C, 80D Self, 80D Parents (+ senior citizen checkbox), NPS, Home Loan, 80G/80E, 80TTA/80TTB", priority: "P0" },
          { id: "FR-2.6", req: "Chapter VI-A inputs SHALL be disabled when tax regime is new", priority: "P0" },
          { id: "FR-2.7", req: "Monthly rent and LTA claimed inputs SHALL be provided for HRA exemption calculation", priority: "P1" },
          { id: "FR-2.8", req: "YTD history inputs SHALL be pre-populated but remain editable", priority: "P0" },
          { id: "FR-2.9", req: "City type (Metro/Non-Metro) SHALL be auto-derived from work city", priority: "P0" },
        ]
      },
      {
        group: "Step 3 — Tax Report",
        items: [
          { id: "FR-3.1", req: "Master-detail layout: employee list on left, detailed tax computation sheet on right", priority: "P0" },
          { id: "FR-3.2", req: "Section 1 — Earnings Breakdown: 4-column table with YTD Actuals, Current Month, Projected Future, and Total", priority: "P0" },
          { id: "FR-3.3", req: "Section 2 — Deductions & Exemptions: Standard Deduction, HRA Exemption, Chapter VI-A declarations", priority: "P0" },
          { id: "FR-3.4", req: "Section 3 — Tax Liability Output: Formula trace string, Annual Tax, Monthly TDS", priority: "P0" },
          { id: "FR-3.5", req: "Engine validation warnings SHALL be displayed prominently with ⚠️ icons", priority: "P0" },
        ]
      },
      {
        group: "Step 4 — Confirm & Export",
        items: [
          { id: "FR-4.1", req: "Payrun Summary Dashboard SHALL show aggregated totals: Total Gross, Net Payable, EPF, ESIC, PT, LWF, TDS", priority: "P0" },
          { id: "FR-4.2", req: "Payroll Register Preview SHALL list all employees with per-employee breakdown", priority: "P0" },
          { id: "FR-4.3", req: "Bank Transfer File export SHALL support formats: HDFC, ICICI, SBI, Axis, Generic CSV", priority: "P0" },
          { id: "FR-4.4", req: "EPF ECR v2 export SHALL generate UAN-based text file", priority: "P0" },
          { id: "FR-4.5", req: "ESIC Return export SHALL generate IP Number-based contribution file", priority: "P0" },
          { id: "FR-4.6", req: "TDS 24Q pre-fill stub SHALL be exported as Excel", priority: "P0" },
          { id: "FR-4.7", req: "Professional Tax SHAL be exported as state-wise ZIP", priority: "P0" },
          { id: "FR-4.8", req: "LWF Statement SHALL be exported as state-wise ZIP", priority: "P0" },
          { id: "FR-4.9", req: "Payroll Register (full) SHALL be exported as Excel with all component columns", priority: "P0" },
          { id: "FR-4.10", req: "Confirm Payrun action SHALL persist all adjustments + computed data and update status to confirmed", priority: "P0" },
        ]
      },
      {
        group: "Step 5 — Salary Slips",
        items: [
          { id: "FR-5.1", req: "Salary Slip SHALL render with: Company header, employee details, attendance, earnings, deductions, Net Pay", priority: "P0" },
          { id: "FR-5.2", req: "If showYTDOnPayslip = true, a YTD column SHALL appear in earnings and deductions tables", priority: "P1" },
          { id: "FR-5.3", req: "If incentiveDisplayMode = 'breakup', variable components SHALL be listed individually", priority: "P1" },
          { id: "FR-5.4", req: "If arrearDisplayMode = 'breakup' with slip visibility, arrear components SHALL be listed individually", priority: "P1" },
          { id: "FR-5.5", req: "Employer contributions SHALL be shown in Net Pay footer as informational", priority: "P0" },
          { id: "FR-5.6", req: "Employee list panel SHALL support Department and Work State dropdown filters", priority: "P1" },
          { id: "FR-5.7", req: "Publish Filtered button SHALL publish slips for all employees matching current filters", priority: "P1" },
          { id: "FR-5.8", req: "Excel Upload Targeting SHALL accept .xlsx with EMP_CODE column and publish matches", priority: "P1" },
          { id: "FR-5.9", req: "Download All SHALL export multi-sheet Excel workbook (one sheet per employee)", priority: "P0" },
          { id: "FR-5.10", req: "Print/Save PDF SHALL use native browser print dialog", priority: "P0" },
          { id: "FR-5.11", req: "Complete Payroll SHALL update status to completed and reset to Step 0", priority: "P0" },
        ]
      },
    ]
  },
  {
    id: "formulas",
    number: "6",
    title: "Formula Reference — Complete Computation Formulae",
    intro: "Every formula implemented in the payroll computation engine (payrollEngine.js).",
    formulaGroups: [
      {
        group: "6.1 Component Resolution (3-Pass)",
        items: [
          { id: "F-1", name: "Monthly Value (Annual Mode)", formula: "monthlyAmount = annualAmount / 12", notes: "Applied when inputMode = 'annual'" },
          { id: "F-2", name: "Formula-Based Component", formula: "resolvedAmount = evaluate(formulaString, { basic: scopeBasic })", notes: "e.g., HRA = basic * 0.40" },
          { id: "F-3", name: "Scope Basic", formula: "scopeBasic = SUM(amount) for all components where type = 'earnings_basic'", notes: "Pre-calculated before Pass 2" },
        ]
      },
      {
        group: "6.2 Attendance and Proration",
        items: [
          { id: "F-4", name: "Attendance Factor", formula: "attendanceFactor = max(0, (daysInMonth - lopDays) / daysInMonth)", notes: "Range: 0.0 to 1.0" },
          { id: "F-5", name: "Prorated Basic", formula: "basic = standardBasic × attendanceFactor", notes: "" },
          { id: "F-6", name: "Prorated HRA", formula: "hra = standardHRA × attendanceFactor", notes: "" },
          { id: "F-7", name: "Prorated Special Allowance", formula: "special = standardSpecial × attendanceFactor", notes: "" },
        ]
      },
      {
        group: "6.3 Additional Earnings",
        items: [
          { id: "F-9", name: "Overtime Pay", formula: "overtimePay = overtimeHours × otRate", notes: "Per-hour rate" },
          { id: "F-10", name: "Leave Encashment", formula: "leaveEncashmentPay = (standardGross / 26) × leaveEncashmentDays", notes: "26 working days/month" },
        ]
      },
      {
        group: "6.4 Arrears",
        items: [
          { id: "F-11", name: "Arrear Eligible Days Cap", formula: "maxEligibleDays = max(0, min(historicalMonthDays, currentPaidDays))", notes: "Prevents over-claim" },
          { id: "F-12", name: "Accepted Arrear Days", formula: "acceptedDays = min(requestedDays, maxEligibleDays)", notes: "Auto-clamped" },
          { id: "F-13", name: "Arrears for Single Entry", formula: "arrear = (historicalGross / historicalMonthDays) × acceptedDays", notes: "Daily rate × days" },
          { id: "F-14", name: "Total Arrears", formula: "arrearsPay = SUM(arrear) for all entries", notes: "" },
          { id: "F-15", name: "Arrear Component Breakup", formula: "componentArrear = arrearsPay × (componentAmount / totalEarningComponents)", notes: "Pro-rata" },
        ]
      },
      {
        group: "6.5 Gross Salary",
        items: [
          { id: "F-16", name: "Standard Gross", formula: "standardGross = standardBasic + standardHRA + standardSpecial + variableTarget + reimbursements", notes: "Pre-proration" },
          { id: "F-17", name: "Gross Salary", formula: "grossSalary = basic + hra + special + OT + arrears + leaveEncashment + variable + reimbursements", notes: "Post-proration" },
        ]
      },
      {
        group: "6.6 Tax Projection",
        items: [
          { id: "F-20", name: "Projected Annual Gross", formula: "annualGross = ytdGross + currentGross + (standardGross × futureMonths)", notes: "" },
          { id: "F-23", name: "Exit Months Adjustment", formula: "exitMonths = ceil((exitDate - payrollStartDate) / (1000×60×60×24×30))", notes: "Overrides monthsRemaining" },
        ]
      },
      {
        group: "6.7 HRA Exemption (Old Regime)",
        items: [
          { id: "F-24", name: "HRA — Actual", formula: "hraActual = projectedAnnualHRA", notes: "" },
          { id: "F-25", name: "HRA — Rent Excess", formula: "hraRentExcess = max(0, annualRent - 0.10 × projectedAnnualBasic)", notes: "" },
          { id: "F-26", name: "HRA — City Limit", formula: "hraCityLimit = (isMetro ? 0.50 : 0.40) × projectedAnnualBasic", notes: "Metro = 50%" },
          { id: "F-27", name: "HRA Exemption", formula: "hraExempt = min(hraActual, hraRentExcess, hraCityLimit)", notes: "Least of three" },
        ]
      },
      {
        group: "6.9 Tax Computation",
        items: [
          { id: "F-31", name: "Annual Tax", formula: "annualTax = baseTax × 1.04", notes: "4% H&E Cess" },
          { id: "F-32", name: "Old Regime 87A Rebate", formula: "if taxableIncome ≤ 500000 then annualTax = 0", notes: "" },
          { id: "F-33", name: "New Regime 87A Rebate", formula: "if taxableIncome ≤ 1200000 then annualTax = 0", notes: "" },
        ]
      },
      {
        group: "6.10 Monthly TDS",
        items: [
          { id: "F-34", name: "Remaining Tax", formula: "remainingTax = max(0, annualTax - tdsDeductedSoFar)", notes: "" },
          { id: "F-35", name: "Monthly TDS", formula: "tds = remainingTax / effectiveMonthsRemaining", notes: "Spread evenly" },
          { id: "F-36", name: "Exit TDS Auto-Cap", formula: "if (exit_date AND tds > netPayBeforeTDS) then tds = max(0, netPayBeforeTDS)", notes: "Prevents negative net" },
        ]
      },
      {
        group: "6.11 Statutory Deductions",
        items: [
          { id: "F-37", name: "EPF (Flat Ceiling)", formula: "pfEmployee = min(1800, standardBasic × 0.12)", notes: "Default" },
          { id: "F-38", name: "EPF (Actual Basic)", formula: "pfEmployee = basic × 0.12", notes: "No ceiling" },
          { id: "F-39", name: "EPF (Prorated)", formula: "pfEmployee = min(1800 × attendanceFactor, basic × 0.12)", notes: "" },
          { id: "F-43", name: "ESIC Employee", formula: "esiEmployee = (gross ≤ 21000) ? gross × 0.0075 : 0", notes: "0.75%" },
          { id: "F-44", name: "ESIC Employer", formula: "esiEmployer = (gross ≤ 21000) ? gross × 0.0325 : 0", notes: "3.25%" },
          { id: "F-45", name: "Professional Tax", formula: "pt = getPT(work_state, gross, month, ptMode, doj, year)", notes: "State-specific" },
          { id: "F-46", name: "Labour Welfare Fund", formula: "lwf = getLWF(work_state, month, doj, year)", notes: "State-specific" },
        ]
      },
      {
        group: "6.12 Net Pay",
        items: [
          { id: "F-47", name: "Total Deductions", formula: "totalDeductions = pfEmployee + esiEmployee + pt + lwf + employeeDeductions + tds", notes: "" },
          { id: "F-48", name: "Net Pay", formula: "netPay = grossSalary - totalDeductions + (reimbursements if year-end)", notes: "" },
          { id: "F-49", name: "Retirement Leave Encashment Exempt", formula: "leaveEncashmentExempt = (exit_reason === 'Retirement') ? min(leaveEncashmentPay, 2500000) : 0", notes: "₹25L max u/s 10(10AA)" },
        ]
      },
    ]
  },
  {
    id: "engine-flow",
    number: "7.2",
    title: "Computation Engine Flow",
    intro: "executeEmployeePayroll function execution pipeline",
    diagram: `flowchart TD
    INPUT(["Employee Object: salary components, attendance, tax overrides, exit info, salary status"]) --> STATUS_CHECK

    STATUS_CHECK{"Is salary_status withheld or absconding?"}
    STATUS_CHECK -- "Yes: salary stopped" --> ZERO_OUT["Return zeroed payroll object with salaryWithheld = true"]
    STATUS_CHECK -- "No: proceed" --> PASS1

    subgraph RESOLUTION["3-Pass Salary Component Resolution"]
        PASS1["PASS 1: Resolve Numeric Amounts - if annual, divide by 12"]
        PASS2["PASS 2: Resolve Formula Strings - evaluate expressions using scopeBasic"]
        PASS3["PASS 3: Hydrate Statutory Blanks - auto-calculate EPF, ESIC, PT, LWF"]
        PASS1 --> PASS2 --> PASS3
    end

    PASS3 --> ACCUMULATE

    ACCUMULATE["Accumulate: bucket into Basic, HRA, Special, Reimbursements, Employer Contribs, Employee Deductions, Variable"]

    ACCUMULATE --> ATTEND

    ATTEND["Attendance Proration: attendanceFactor = (daysInMonth - lopDays) / daysInMonth"]

    ATTEND --> ARREARS

    ARREARS["Arrears: daily rate x accepted days, auto-clamp, component breakup"]

    ARREARS --> GROSS

    GROSS["Gross = prorated Basic + HRA + Special + OT + Arrears + Leave Encashment + Variable + Reimbursements"]

    GROSS --> TAX_PROJ

    TAX_PROJ["Tax Projection: annualGross = ytdGross + currentGross + (standardGross x futureMonths)"]

    TAX_PROJ --> TAX_CALC

    TAX_CALC["evaluateTaxLiability: regime-specific slabs, Chapter VI-A, HRA exemption"]

    TAX_CALC --> TDS

    TDS["Monthly TDS = (annualTax - tdsDeductedSoFar) / monthsRemaining"]

    TDS --> STAT

    STAT["Statutory: EPF (3 methods), ESIC (0.75%/3.25%), PT (state slab), LWF (state amount)"]

    STAT --> VALIDATE

    VALIDATE{"Exit date set AND TDS > netPayBeforeTDS?"}
    VALIDATE -- "Yes" --> CAP["Auto-cap TDS to max(0, netPayBeforeTDS), push warning"]
    VALIDATE -- "No" --> FNF_CHECK
    CAP --> FNF_CHECK

    FNF_CHECK{"salary_status = fnf_pending?"}
    FNF_CHECK -- "Yes" --> FNF_WARN["Push advisory: FnF Pending"]
    FNF_CHECK -- "No" --> NET
    FNF_WARN --> NET

    NET["Net Pay = Gross - (EPF + ESIC + PT + LWF + Deductions + TDS) + Reimbursements if year-end"]

    NET --> OUTPUT(["Return computed payroll: 55+ fields, breakups, validations"])`
  },
  {
    id: "tax-slabs",
    number: "7.3",
    title: "Tax Regime Slab Tables",
    slabs: {
      newRegime: {
        fy: "FY 2025-26",
        standardDeduction: "₹75,000",
        rebate: "Full rebate if taxable income ≤ ₹12,00,000",
        rows: [
          ["Up to ₹4,00,000", "Nil"],
          ["₹4,00,001 – ₹8,00,000", "5%"],
          ["₹8,00,001 – ₹12,00,000", "10%"],
          ["₹12,00,001 – ₹16,00,000", "15%"],
          ["₹16,00,001 – ₹20,00,000", "20%"],
          ["₹20,00,001 – ₹24,00,000", "25%"],
          ["Above ₹24,00,000", "30%"],
        ]
      },
      oldRegime: {
        standardDeduction: "₹50,000",
        rebate: "Full rebate if taxable income ≤ ₹5,00,000",
        rows: [
          ["Up to ₹2,50,000", "Nil"],
          ["₹2,50,001 – ₹5,00,000", "5%"],
          ["₹5,00,001 – ₹10,00,000", "20%"],
          ["Above ₹10,00,000", "30%"],
        ]
      }
    }
  },
  {
    id: "settings",
    number: "8",
    title: "Configurable Display & Preferences",
    intro: "These settings are managed under Company Settings → Payroll Cycle Configuration.",
    configItems: [
      { key: "arrearDisplayMode", options: "consolidated / breakup", effect: "Whether arrears appear as one line or per-component" },
      { key: "arrearBreakupVisibility", options: "['review', 'tax', 'slip']", effect: "In which steps the breakup is shown" },
      { key: "incentiveDisplayMode", options: "consolidated / breakup", effect: "Whether variable/incentive pay appears as one line or per-component" },
      { key: "showYTDOnPayslip", options: "true / false", effect: "Whether YTD column appears in salary slips" },
      { key: "epfCalculationMethod", options: "flat_ceiling / actual_basic / prorated_ceiling", effect: "EPF computation method" },
      { key: "ptHalfYearlyMode", options: "lump_sum / prorate", effect: "PT deduction frequency for half-yearly states" },
      { key: "lopCalculationMethod", options: "calendar / working / pay_period", effect: "LOP day calculation basis" },
      { key: "prorationType", options: "dynamic / fixed30", effect: "Calendar days vs fixed 30" },
    ]
  },
  {
    id: "salary-status",
    number: "9",
    title: "Salary Status Management",
    statuses: [
      { status: "active", badge: "—", behavior: "Normal payroll processing. Default for all employees." },
      { status: "withheld", badge: "WITHHELD", behavior: "Auto-excluded from Select All. If manually included, engine returns zero net pay with salaryWithheld = true." },
      { status: "absconding", badge: "ABSCONDING", behavior: "Same as withheld, with different badge (red) and reason string." },
      { status: "fnf_pending", badge: "FNF", behavior: "Processes normally. Engine adds advisory warning: \"This computation is flagged as Full & Final (FnF) Pending.\"" },
    ]
  },
  {
    id: "correction",
    number: "10",
    title: "Post-Finalization Correction Workflow",
    content: `The unlock workflow allows Finance Admins to correct finalized payruns while maintaining a complete audit trail.

1. Admin clicks Unlock on a confirmed or completed payrun in Payrun History
2. System displays a modal prompt for a mandatory unlock reason
3. Admin types the reason text and submits
4. System calls updatePayrunStatus → status set to "reviewed"
5. System calls addPayrunAuditLog → appends { action, reason, user, timestamp } to audit_logs JSONB array
6. Success toast displayed, payrun re-opens at Step 1 for corrections
7. Admin can re-adjust salaries, re-confirm, and re-export compliance files`,
    diagram: `sequenceDiagram
    actor Admin as Finance Admin
    participant UI as Payrun History UI
    participant API as Supabase API Layer
    participant DB as payruns Table in PostgreSQL

    Admin->>UI: Clicks Unlock button on confirmed/completed payrun
    UI->>Admin: Displays modal prompt for mandatory unlock reason
    Admin->>UI: Types unlock reason text and submits
    UI->>API: Calls updatePayrunStatus (payrun ID, status: reviewed)
    API->>DB: UPDATE payruns SET status = reviewed
    UI->>API: Calls addPayrunAuditLog (payrun ID, action, reason, user, timestamp)
    API->>DB: Append JSON object to audit_logs JSONB array
    UI->>Admin: Displays success toast confirming unlock
    UI->>UI: Calls openPayrun to navigate to Step 1 for corrections
    Note over Admin,DB: Admin can now re-adjust salaries, re-confirm, and re-export files`,
    callout: {
      type: "warning",
      text: "The audit log is append-only. Every unlock creates a permanent record with the reason, acting user, and ISO timestamp. This data cannot be deleted through the UI."
    }
  },
  {
    id: "exports",
    number: "12",
    title: "Compliance Export Specifications",
    exports: [
      { name: "Bank Transfer", format: "CSV", content: "Bank-specific column ordering (HDFC, ICICI, SBI, Axis, Generic)" },
      { name: "EPF ECR v2", format: "TXT", content: "UAN #~# Gross #~# EE(12%) #~# EPS(8.33%) #~# EPF-ER(3.67%)" },
      { name: "ESIC Return", format: "TXT", content: "IP Number | Days Worked | Gross | EE 0.75% | ER 3.25%" },
      { name: "TDS 24Q", format: "XLSX", content: "PAN, Name, Gross, Annual Tax, Monthly TDS, Regime" },
      { name: "Professional Tax", format: "ZIP (XLSX per state)", content: "Grouped by work_state, each state as separate XLSX" },
      { name: "LWF", format: "ZIP (XLSX per state)", content: "Grouped by work_state, each state as separate XLSX" },
      { name: "Payroll Register", format: "XLSX", content: "22-column comprehensive register" },
    ]
  },
  {
    id: "exit-fnf",
    number: "13",
    title: "Exit & Full-and-Final (FnF) Handling",
    scenarios: [
      { scenario: "exit_date is set", behavior: "Future months for tax projection capped using ceil((exitDate - payrollStartDate) / 30)" },
      { scenario: "exit_reason = 'Retirement'", behavior: "Leave Encashment up to ₹25L exempted from taxable income" },
      { scenario: "TDS exceeds Net Pay (exit case)", behavior: "TDS auto-capped to max(0, netPayBeforeTDS) with validation warning" },
      { scenario: "salary_status = 'fnf_pending'", behavior: "Engine adds advisory warning; computation proceeds normally" },
    ]
  },
  {
    id: "prerequisites",
    number: "15",
    title: "Prerequisites and Assumptions",
    prereqGroups: [
      {
        group: "Infrastructure Prerequisites",
        items: [
          { prereq: "Supabase Project", desc: "A live Supabase project with PostgreSQL database. URL and anon key configured in .env." },
          { prereq: "Database Tables", desc: "All 5 tables created with schema from supabase_updates.sql." },
          { prereq: "Row-Level Security", desc: "RLS policies enabled. Current: permissive; production: role-based." },
          { prereq: "Storage Bucket", desc: "employee-proofs bucket for reimbursement proof uploads." },
          { prereq: "Browser", desc: "Chrome 90+, Edge 90+, Firefox 88+, Safari 14+ with ES2020+ and Blob API." },
          { prereq: "CDN Access", desc: "Internet required for JSZip via ESM CDN for ZIP export generation." },
        ]
      },
      {
        group: "Computation Assumptions",
        items: [
          { prereq: "26 Working Days/Month", desc: "Leave encashment: standardGross / 26." },
          { prereq: "Calendar-Day Proration", desc: "(daysInMonth - lopDays) / daysInMonth using actual calendar days." },
          { prereq: "Single FY per Payrun", desc: "Cross-FY payruns not supported." },
          { prereq: "EPF Ceiling ₹1,800/month", desc: "flat_ceiling: ₹15,000 × 12% = ₹1,800." },
          { prereq: "ESIC Ceiling ₹21,000/month", desc: "Above = exempt." },
          { prereq: "Metro Classification", desc: "Mumbai, Delhi, New Delhi, Kolkata, Chennai = Metro (50% Basic). All others = 40%." },
          { prereq: "YTD from Confirmed Only", desc: "Draft/initiated payruns excluded from history." },
          { prereq: "Forward-Looking TDS", desc: "No retroactive recalculation of prior months." },
          { prereq: "Client-Side Computation", desc: "All math runs in browser. computed_data is a client-calculated snapshot." },
          { prereq: "Employer PF = Employee PF", desc: "Mirrors contribution. EPS/EPF-ER split on employer side for ECR." },
          { prereq: "No Mid-Month Joining Proration", desc: "Admin must manually adjust LOP/Days for partial-month joining." },
        ]
      },
    ]
  },
  {
    id: "nfr",
    number: "16",
    title: "Non-Functional Requirements",
    nfrItems: [
      { id: "NFR-1", req: "All payroll computations SHALL execute client-side with no network dependency during computation" },
      { id: "NFR-2", req: "Adjustment persistence SHALL use upsert semantics to prevent duplicate records" },
      { id: "NFR-3", req: "ZIP file generation for state-wise exports SHALL use dynamic ESM import of JSZip (CDN-based)" },
      { id: "NFR-4", req: "Salary slip printing SHALL use native window.print() with DOM injection" },
      { id: "NFR-5", req: "All monetary values SHALL be rounded to nearest integer for display and export" },
      { id: "NFR-6", req: "Indian number formatting (en-IN locale) SHALL be used consistently" },
    ]
  },
  {
    id: "glossary",
    number: "17",
    title: "Glossary",
    terms: [
      { term: "Payrun", definition: "A single monthly payroll processing cycle for a set of employees" },
      { term: "LOP", definition: "Loss of Pay — unpaid days deducted from gross" },
      { term: "TDS", definition: "Tax Deducted at Source — monthly income tax deduction" },
      { term: "ECR", definition: "Electronic Challan cum Return — EPF filing format" },
      { term: "FnF", definition: "Full and Final — settlement computation for exiting employees" },
      { term: "YTD", definition: "Year-To-Date — cumulative values from April to current month" },
      { term: "Chapter VI-A", definition: "Income Tax Act sections 80C through 80U for tax-saving deductions (Old Regime only)" },
      { term: "Metro", definition: "Mumbai, Delhi, Kolkata, Chennai — 50% Basic for HRA exemption" },
      { term: "FY", definition: "Financial Year — April 1 to March 31" },
      { term: "CTC", definition: "Cost to Company — total employer cost including all contributions" },
      { term: "H&E Cess", definition: "Health and Education Cess — 4% surcharge on computed income tax" },
      { term: "EPS", definition: "Employee Pension Scheme — 8.33% of employer PF contribution, capped at ₹1,250/month" },
      { term: "RLS", definition: "Row-Level Security — Supabase/PostgreSQL feature for data access control" },
    ]
  },
];
