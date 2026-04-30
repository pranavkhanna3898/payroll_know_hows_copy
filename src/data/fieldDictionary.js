export const FIELD_DICTIONARY = [
  {
    module: "Employee Master",
    description: "Fields used for defining employee profiles and lifecycle data.",
    groups: [
      {
        name: "Basic Information",
        fields: [
          { name: "Employee Code", type: "Text", description: "Unique identifier for the employee (e.g., EMP1001)." },
          { name: "Full Name", type: "Text", description: "Legal name of the employee." },
          { name: "Department", type: "Text", description: "Department where the employee is assigned." },
          { name: "Designation", type: "Text", description: "Official job title." },
          { 
            name: "Profile Status", 
            type: "Dropdown", 
            options: [
              { value: "Active", description: "Employee can log in and is part of current operations." },
              { value: "Inactive", description: "Revoked access; profile is disabled." }
            ],
            description: "Controls application access."
          },
          { 
            name: "Salary Processing Status", 
            type: "Dropdown", 
            options: [
              { value: "Active Calculation", description: "Normal payroll processing." },
              { value: "Withheld", description: "Stop payment; produces zero net pay with a warning." },
              { value: "Absconding", description: "Stop payment due to unauthorized absence." },
              { value: "Full & Final Pending", description: "Flagged for final settlement processing." }
            ],
            description: "Directs how the computation engine handles the employee's salary."
          }
        ]
      },
      {
        name: "Employment Lifecycle",
        fields: [
          { name: "Date of Joining", type: "Date", description: "Start date of employment." },
          { name: "Date of Birth", type: "Date", description: "Used to determine the exact age for senior and super-senior citizen tax slab exemptions during computation." },
          { name: "Exit Date", type: "Date", description: "Employee's last working day (triggers tax projection capping)." },
          { 
            name: "Exit Reason", 
            type: "Dropdown", 
            options: [
              { value: "Resignation", description: "Voluntary departure." },
              { value: "Termination", description: "Involuntary departure." },
              { value: "Retirement", description: "Departure due to age; enables specific tax exemptions like Leave Encashment up to ₹25L." }
            ],
            description: "Reason for leaving the organization." 
          }
        ]
      },
      {
        name: "Location Settings",
        fields: [
          { name: "Work State", type: "Dropdown (States)", description: "State where the employee works; determines PT and LWF slabs." },
          { name: "Work City", type: "Text", description: "City where the employee works." },
          { name: "Base State", type: "Dropdown (States)", description: "Employee's residential state." },
          { name: "Base City", type: "Text", description: "Employee's residential city; determines Metro (50%) vs Non-Metro (40%) HRA limit." }
        ]
      },
      {
        name: "Salary Structure",
        fields: [
          { 
            name: "Entry Mode", 
            type: "Dropdown", 
            options: [
              { value: "Monthly", description: "Amounts entered represent one month." },
              { value: "Annual", description: "Amounts entered represent full year (divided by 12 for monthly calcs)." }
            ],
            description: "Specifies the scale of amount inputs." 
          },
          { 
            name: "Component Type", 
            type: "Dropdown", 
            options: [
              { value: "Basic", description: "Pure earnings component for tax and PF calc." },
              { value: "HRA", description: "House Rent Allowance." },
              { value: "Allowance", description: "General taxable allowances." },
              { value: "Variable", description: "Performance-linked or ad-hoc payouts." },
              { value: "Reimbursement", description: "Tax-free payments against bills." },
              { value: "Employer Share", description: "Company contribution (statutory)." },
              { value: "Employee Deduction", description: "Statutory or voluntary monthly deductions." }
            ],
            description: "Defines the computation behavior of the component." 
          },
          { 
            name: "Tax Schedule", 
            type: "Dropdown", 
            options: [
              { value: "Monthly", description: "Tax impact is calculated every month." },
              { value: "Year-End", description: "Component is excluded from monthly tax check." }
            ],
            description: "Controls when the component affects tax liability." 
          }
        ]
      }
    ]
  },
  {
    module: "Payroll Operations (Step 1-3)",
    description: "Fields used during the active payrun adjustment and review cycle.",
    groups: [
      {
        name: "Attendance & Adjustments",
        fields: [
          { name: "Days in Month", type: "Number", description: "Total calendar days in the payroll month (28/29/30/31)." },
          { name: "LOP Days", type: "Number", description: "Loss of Pay days (unpaid leave)." },
          { name: "Overtime Hours", type: "Number", description: "Total overtime hours worked." },
          { name: "Overtime Rate/Hour", type: "Number", description: "Rupee amount to pay per overtime hour." },
          { name: "Leave Encashment Days", type: "Number", description: "Unused leave days to be paid out." },
          { name: "Manual Ad-hoc Deduction", type: "Number", description: "One-time deduction for the current month only." }
        ]
      },
      {
        name: "Arrears Management",
        fields: [
          { name: "Historical Month", type: "Dropdown (Months)", description: "The month for which arrears are being paid." },
          { name: "Historical Gross", type: "Number", description: "Gross salary of the employee during the historical month." },
          { name: "Arrear Days", type: "Number", description: "Number of unpaid days from that month now being settled." }
        ]
      },
      {
        name: "Tax Overrides (Step 2)",
        fields: [
          { 
            name: "Tax Regime", 
            type: "Dropdown", 
            options: [
              { value: "Old Regime", description: "Slabs with exemptions (80C, 80D, HRA)." },
              { value: "New Regime", description: "Lower slabs; flat ₹75k std deduction only." }
            ],
            description: "The income tax regime chosen by the employee."
          },
          { name: "Section 80C", type: "Number", description: "Life insurance, PPF, ELSS, etc. (Max ₹1.5L)." },
          { name: "Section 80D (Self)", type: "Number", description: "Medical insurance premium for self/family (Max ₹25k)." },
          { name: "Section 80D (Parents)", type: "Number", description: "Medical insurance premium for parents." },
          { name: "Senior Citizen Checkbox", type: "Boolean", description: "Increases 80D limit for parents to ₹50k if checked." },
          { name: "House Loan Interest (24b)", type: "Number", description: "Interest paid on home loan (Max ₹2L)." },
          { name: "Donations (80G/80E)", type: "Number", description: "Charitable contributions or education loan interest." },
          { name: "Income from Other Sources", type: "Number", description: "Any outside income declared by the employee to be factored into their total taxable income for TDS calculation." },
          { name: "Previous Employer TDS", type: "Number", description: "Tax already deducted by a previous employer in the current financial year, used to offset remaining TDS deficit." }
        ]
      }
    ]
  },
  {
    module: "Company Settings",
    description: "Global configuration fields that control the entire organization's payroll engine.",
    groups: [
      {
        name: "Statutory Compliance",
        fields: [
          { 
            name: "EPF Calculation Method", 
            type: "Dropdown", 
            options: [
              { value: "Flat Ceiling", description: "Limited to ₹1,800/month based on ₹15k wage cap." },
              { value: "Actual Basic", description: "Full 12% on basic salary with no cap." },
              { value: "Prorated Ceiling", description: "Ceiling adjusted by attendance factor." }
            ],
            description: "Governs how Provident Fund contributions are computed."
          },
          { 
            name: "PT Half-Yearly Mode", 
            type: "Dropdown", 
            options: [
              { value: "Lump Sum", description: "Full deduction in September and March." },
              { value: "Prorate", description: "Divided equally across all 6 months of the half-year." }
            ],
            description: "Deduction logic for half-yearly PT states (e.g., Tamil Nadu)." 
          }
        ]
      },
      {
        name: "Display & Preferences",
        fields: [
          { 
            name: "Arrear Display Mode", 
            type: "Dropdown", 
            options: [
              { value: "Consolidated", description: "One line item 'Arrears' on payslip/review." },
              { value: "Breakup", description: "Shows pro-rata arrears for each component (e.g., Basic Arrears, HRA Arrears)." }
            ],
            description: "Visual representation of back-pay."
          },
          { name: "Show YTD on Slips", type: "Boolean", description: "Controls visibility of Year-To-Date (April to current) totals on salary slips." }
        ]
      },
      {
        name: "Submission Windows",
        fields: [
          { name: "IT Declaration Enabled", type: "Boolean", description: "Allows employees to submit investment proofs via portal." },
          { name: "Reimbursement Enabled", type: "Boolean", description: "Allows employees to upload bills for tax-free components." },
          { name: "Window Closure Date", type: "Date", description: "Auto-disables portal submissions after this date." }
        ]
      }
    ]
  },
  {
    module: "Finance & Verification",
    description: "Fields used by the finance team to verify declarations and approve reimbursement claims.",
    groups: [
      {
        name: "Submission Review",
        fields: [
          { 
            name: "Submission Status", 
            type: "Dropdown", 
            options: [
              { value: "Pending", description: "Submitted by employee; awaiting finance review." },
              { value: "Verified", description: "Approved by finance; values will flow into the next payrun." },
              { value: "Rejected", description: "Sent back to employee for corrections (e.g., missing proof)." }
            ],
            description: "Current workflow state of the declaration/claim." 
          },
          { name: "Verified Amount", type: "Number", description: "The final amount approved by finance after checking proofs. This value is used for tax calculation." },
          { name: "Finance Remark", type: "Text", description: "Internal notes or reason for rejection shared with the employee." }
        ]
      }
    ]
  },
  {
    module: "Employee Portal",
    description: "Fields visible to employees for updating their tax-saving investments and claims.",
    groups: [
      {
        name: "IT Declaration & Rent",
        fields: [
          { name: "Monthly Rent Paid", type: "Number", description: "Actual rent paid to landlord; used for Section 10(13A) HRA exemption." },
          { name: "Landlord PAN", type: "Text", description: "Mandatory if annual rent exceeds ₹1,00,000." },
          { name: "Declaration Value", type: "Number", description: "The amount the employee intends to invest in a specific tax-saving component." },
          { name: "Proof Upload", type: "File / URL", description: "Scanned copy of the investment receipt or bill." }
        ]
      }
    ]
  }
];
