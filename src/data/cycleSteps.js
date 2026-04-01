export const PAYROLL_CYCLE = [
  {
    phase: "Phase 1: Pre-Payroll",
    timeline: "Days 1–15 of Processing Month",
    color: "#3b82f6",
    steps: [
      {
        id: "step-1",
        title: "Payroll Calendar Setup",
        description: "Define payroll period, payment date, and cut-off date for inputs.",
        dependencies: [],
        statutory: [],
      },
      {
        id: "step-2",
        title: "Employee Data Freeze",
        description: "Lock employee master for new joiners, exits, and mid-month salary revisions.",
        dependencies: [],
        statutory: [],
      },
      {
        id: "step-3",
        title: "Attendance & Leave Data Collection",
        description: "Reconcile biometric/HRMS data, approved leaves, LOP days, and overtime hours.",
        dependencies: [],
        statutory: ["Factories Act (OT rules)", "State S&E Acts"],
      },
      {
        id: "step-4",
        title: "Variable Pay Inputs",
        description: "Receive incentive, commission, shift allowances, and ad-hoc bonuses.",
        dependencies: [],
        statutory: [],
      },
      {
        id: "step-5",
        title: "Reimbursement Processing",
        description: "Validate claims and classify taxable vs exempt amounts.",
        dependencies: [],
        statutory: ["Income Tax Rules (Caps)"],
      },
      {
        id: "step-6",
        title: "Investment Declaration Update",
        description: "Update provisional / final proofs for HRA, 80C, etc. for TDS projections.",
        dependencies: [],
        statutory: ["Income Tax Act (Chap VI-A)"],
      },
    ]
  },
  {
    phase: "Phase 2: Payroll Processing",
    timeline: "Days 16–22 of Processing Month",
    color: "#6366f1",
    steps: [
      {
        id: "step-7",
        title: "Gross Salary Computation",
        description: "Calculate Monthly Gross considering LOP, prorata for new joiners/exits, arrears, and variable pay.",
        dependencies: ["step-2", "step-3", "step-4", "step-5"],
        statutory: ["Minimum Wages Act"],
      },
      {
        id: "step-8",
        title: "Statutory & Tax Computation",
        description: "Compute PF, ESI, PT, LWF, and re-project TDS based on remaining months.",
        dependencies: ["step-6", "step-7"],
        statutory: ["EPF Act", "ESI Act", "State PT & LWF", "Income Tax Act"],
      },
      {
        id: "step-9",
        title: "Other Deductions",
        description: "Recover loan EMIs, salary advances, and voluntary PF.",
        dependencies: ["step-7"],
        statutory: [],
      },
      {
        id: "step-10",
        title: "Net Pay Computation",
        description: "Total Gross Earnings minus Total Deductions. Validate for negative pay scenarios.",
        dependencies: ["step-7", "step-8", "step-9"],
        statutory: ["Payment of Wages Act"],
      },
      {
        id: "step-11",
        title: "Payroll Verification & Lock",
        description: "Run variance reports, reconcile anomalies, and lock payroll post approval.",
        dependencies: ["step-10"],
        statutory: [],
      },
    ]
  },
  {
    phase: "Phase 3: Payroll Disbursement",
    timeline: "Payment Date (e.g., 1st–7th of following month)",
    color: "#10b981",
    steps: [
      {
        id: "step-12",
        title: "Bank File Generation",
        description: "Generate NEFT/RTGS batch files and upload to corporate banking portal.",
        dependencies: ["step-11"],
        statutory: [],
      },
      {
        id: "step-13",
        title: "Payslip Generation",
        description: "Generate and securely distribute password-protected PDF payslips.",
        dependencies: ["step-11"],
        statutory: ["State S&E Acts"],
      },
    ]
  },
  {
    phase: "Phase 4: Post-Payroll Compliance",
    timeline: "Days 1–20 of Following Month",
    color: "#f59e0b",
    steps: [
      {
        id: "step-14",
        title: "Statutory Remittances",
        description: "File returns and pay PF (15th), ESI (15th), PT, LWF, and TDS (7th).",
        dependencies: ["step-8"],
        statutory: ["EPF Act", "ESI Act", "Income Tax Act", "State Tax Laws"],
      },
      {
        id: "step-15",
        title: "Accounting Journal Entries",
        description: "Post salary and liability entries to the general ledger (ERP/Accounting system).",
        dependencies: ["step-10", "step-14"],
        statutory: [],
      },
    ]
  },
  {
    phase: "Phase 5: Year-end Compliance",
    timeline: "March–May",
    color: "#8b5cf6",
    steps: [
      {
        id: "step-16",
        title: "Form 16 & eTDS Returns",
        description: "Issue Part A & B of Form 16, file Q4 Form 24Q.",
        dependencies: ["step-14"],
        statutory: ["Income Tax Act"],
      },
      {
        id: "step-17",
        title: "Annual Bonus & Returns",
        description: "Compute allocable surplus, pay statutory bonus, file PF/ESI/LWF annual returns.",
        dependencies: ["step-11"],
        statutory: ["Payment of Bonus Act", "EPF Act", "ESI Act"],
      },
    ]
  }
];
