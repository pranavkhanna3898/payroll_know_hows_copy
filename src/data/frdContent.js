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

    DONE -.-> UNLOCK["Admin navigates to Payrun History and clicks Unlock"]
    UNLOCK --> AUDIT["System prompts for mandatory reason, writes audit_logs entry"]
    AUDIT --> REVERT["Status reverted to reviewed, re-open at Step 1"]
    REVERT --> STEP1\`,
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
        group: "6.8 Taxable Income",
        items: [
          { id: "F-28", name: "Old Regime Deductions", formula: "deductions = min(1.5L, 80C) + min(25k/50k, 80D) + NPS + HomeLoan + ... + hraExempt", notes: "Section 80C/80D/etc" },
          { id: "F-29", name: "Old Regime Taxable", formula: "taxable = max(0, annualGross - deductions)", notes: "" },
          { id: "F-30", name: "New Regime Taxable", formula: "taxable = max(0, annualGross - 75000)", notes: "Standard Ded. only" },
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
    id: "engine-spec",
    number: "7",
    title: "Computation Engine — Functional Specification",
    content: `The computation engine (payrollEngine.js) is the deterministic core of the application. It ensures that every salary, tax, and statutory component is calculated accurately based on Indian compliance standards.

This section covers:
• The functional contract (Inputs/Outputs)
• The step-by-step execution pipeline (3-Pass Resolution)
• Tax slab configurations for New and Old regimes
• Statutory deduction logic for EPF, ESIC, PT, and LWF`
  },
  {
    id: "engine-contract",
    number: "7.1",
    title: "Engine Input/Output Contract",
    content: `The payroll engine (computeEmployeePayroll) is a pure function that accepts an employee object enriched with adjustments and returns a fully computed payroll result.

Inputs: Employee salary components, attendance (days, LOP), overtime, arrear entries, variable payouts, tax declarations, YTD history, exit lifecycle, salary status, and company settings.

Outputs: Monthly computed payroll including earnings breakdown, statutory deductions, tax liability, net pay, and validation warnings (55+ fields total).`
  },
  {
    id: "engine-flow",
    number: "7.2",
    title: "Computation Engine Flow",
    intro: "executeEmployeePayroll function execution pipeline",
    diagram: `flowchart TD
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

    NET --> OUTPUT(["Return the complete computed payroll object containing 55 plus fields including all earnings, deductions, tax details, breakups, and validation messages"])`
  },
  {
    id: "tax-slabs",
    number: "7.3",
    title: "Tax Regime Slab Tables",
    slabs: {
      newRegime: {
        fy: "FY 2025-26",
        standardDeduction: "₹75,000",
        rebate: "Full rebate u/s 87A if taxable income ≤ ₹12,00,000",
        notes: "4% Health & Education Cess on tax amount. Standard deduction is flat.",
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
        rebate: "Full rebate u/s 87A if taxable income ≤ ₹5,00,000",
        notes: "Eligible for Ch VI-A (80C, 80D, 24b) and HRA exemption u/s 10(13A).",
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
    id: "statutory-logic",
    number: "7.4",
    title: "Statutory Deduction Logic",
    content: `The engine implements state-specific logic for Professional Tax and Labour Welfare Fund, along with configurable EPF methods.`,
    tables: [
      {
        name: "Professional Tax (PT)",
        description: "Monthly/Half-Yearly/Annual Slabs",
        headers: ["Category", "States / Details"],
        columns: [
          ["Monthly States", "KA, MH, WB, GJ, AP, TG, JH, AS, MP"],
          ["Half-Yearly States", "TN, KL, PY — lump_sum or prorate modes"],
          ["Annual States", "OD, SK, BR, MZ — deducted in June"],
          ["Exempt States", "DL, RJ, HR, UP, PB, HP, UK, GA, CH"]
        ]
      },
      {
        name: "Labour Welfare Fund (LWF)",
        description: "Biannual/Annual Deductions",
        headers: ["State / Group", "Contribution Timeline"],
        columns: [
          ["KA, MH, GJ", "June & December"],
          ["WB", "July"],
          ["TN", "January"],
          ["AP, TG", "June only"]
        ]
      },
      {
        name: "EPF Calculation Methods",
        description: "Employer/Employee configuration",
        headers: ["Method ID", "Computation Logic"],
        columns: [
          ["flat_ceiling", "min(₹1,800, Basic × 12%) — default"],
          ["actual_basic", "Basic × 12% — no ceiling"],
          ["prorated_ceiling", "min(₹1,800 × attendanceFactor, Basic × 12%)"]
        ]
      }
    ]
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
    id: "ytd-logic",
    number: "11",
    title: "YTD (Year-To-Date) Aggregation Logic",
    content: `YTD values are computed by querying all payrun_adjustments.computed_data snapshots from prior confirmed/completed payruns within the same Financial Year (April–March).

Aggregated Fields:
• ytdGross — Cumulative Gross Salary
• ytdBasic — Cumulative Basic
• ytdHRA — Cumulative HRA
• ytdNetPay — Cumulative Net Pay
• ytdTotalDeductions — Cumulative Deductions
• ytdComponents — Per-component ID cumulative amounts
• tdsDeductedSoFar — Cumulative TDS deducted

These YTD values are injected into the engine and additionally displayed in the Salary Slip (when showYTDOnPayslip = true) and Tax Report (always).`
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
    id: "integration",
    number: "14",
    title: "IT Declaration & Reimbursement Integration",
    content: `Verified declarations from the Employee Portal flow into the payrun automatically:

1. Employee submits IT declaration via Employee Portal → stored in employee_submissions with status = 'submitted'
2. Finance team reviews and verifies via Finance Verification Dashboard → status = 'verified', verified_data is populated
3. At Step 2 of a payrun, the system queries all verified submissions for the current FY
4. Verified values (80C, 80D, NPS, Home Loan, etc.) are auto-populated into the employee's tax override fields
5. Admin can override any auto-populated value manually`
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
        group: "Data Prerequisites",
        items: [
          { prereq: "Employee Records", desc: "Active employee with valid salary_structure (JSON array) must exist." },
          { prereq: "Salary Structure", desc: "Must contain at least one 'earnings_basic' component." },
          { prereq: "Company Settings", desc: "Singleton row must exist in company_settings table." },
          { prereq: "Financial Year", desc: "Aggregations assume April (3) to March (2) convention." },
          { prereq: "Input Mode", desc: "input_mode (monthly/annual) must match stored amount types." },
        ]
      },
      {
        group: "Computation Assumptions",
        items: [
          { prereq: "26 Working Days/Month", desc: "Leave encashment: standardGross / 26." },
          { prereq: "Calendar Proration", desc: "(daysInMonth - lopDays) / daysInMonth using actual month days." },
          { prereq: "Single FY per Payrun", desc: "Cross-FY payruns not supported." },
          { prereq: "EPF Ceiling", desc: "flat_ceiling method capped at ₹1,800/month." },
          { prereq: "ESIC Ceiling", desc: "₹21,000 gross month threshold for compliance." },
          { prereq: "Metro Classification", desc: "Mumbai/Delhi/DNC/Kolkata/Chennai = 50% Basic HRA limit." },
          { prereq: "Tax Regime Lock", desc: "Override at Step 2 is local to payrun; doesn't edit master employee record." },
          { prereq: "YTD Confirmed Only", desc: "Aggregation excludes draft/initiated payruns." },
          { prereq: "Forward-Looking TDS", desc: "No retroactive recalculation; spread remains forward-only." },
          { prereq: "Statutory Slab Accuracy", desc: "PT/LWF based on govt. notifications at build date." },
          { prereq: "ER PF = EE PF", desc: "Employer mirrors contribution; EPS/ER split for ECR." },
          { prereq: "Reimbursement Strategy", desc: "Support for 'monthly' (taxed) and 'year_end' (tax-free) flows." },
          { prereq: "Mid-Month Joiners", desc: "Manual adjustment of LOP/Days in Step 1 required." },
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
      { term: "Non-Metro", definition: "All other cities — 40% Basic for HRA exemption" },
      { term: "FY", definition: "Financial Year — April 1 to March 31" },
      { term: "CTC", definition: "Cost to Company — total employer cost including all contributions" },
      { term: "H&E Cess", definition: "Health and Education Cess — 4% surcharge on computed income tax" },
      { term: "EPS", definition: "Employee Pension Scheme — 8.33% of employer PF contribution, capped at ₹1,250/month" },
      { term: "RLS", definition: "Row-Level Security — Supabase/PostgreSQL feature for data access control" },
    ]
  },
];
