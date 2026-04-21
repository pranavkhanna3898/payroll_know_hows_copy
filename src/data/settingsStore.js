// ─── Company Settings Default State ──────────────────────────────────────────
const DEFAULTS = {
  // Company Profile
  companyName: 'Acme Technologies Pvt. Ltd.',
  tradeName: '',
  cin: 'U72900KA2018PTC123456',
  pan: 'AACCA1234A',
  tan: 'BLRA12345B',
  gstin: '29AACCA1234A1ZK',
  incorporationDate: '2018-06-01',
  industry: 'Information Technology',
  fiscalYear: 'April–March',
  currency: 'INR',
  regAddress: '12, Electronic City Phase 1, Bengaluru, Karnataka 560100',
  corrAddress: '',
  logo: '',

  // EPFO
  epfoCode: 'KA/BN/12345',
  epfoRegDate: '2018-08-01',
  epfCalculationMethod: 'flat_ceiling', // flat_ceiling | actual_basic | prorated_ceiling
  vpfPercent: 0,
  adminChargesPercent: 0.5,
  edliChargesPercent: 0.5,

  // ESIC
  esicCode: '53000012345000199',
  esicRegDate: '2018-08-01',
  esicRegion: 'Bengaluru East',
  esicWageCeiling: 21000,

  // Professional Tax
  ptStateRegistrations: [
    { state: 'KA', regNo: 'PT/KA/12345', frequency: 'Monthly' },
  ],
  ptLiabilityMonth: 'Disbursement', // Disbursement | Accrual
  ptHalfYearlyMode: 'lump_sum', // lump_sum (deduct in Sept/Mar) | prorate (deduct monthly)

  // Labour Welfare Fund
  lwfStateRegistrations: [
    { state: 'KA', regNo: 'LWF/KA/001', frequency: 'Monthly' },
  ],

  // TDS / Income Tax
  defaultTaxRegime: 'new',
  allowEmployeeRegimeOverride: true,
  tdsCertificate: 'Form 16',

  // Gratuity
  gratuityApplicable: true,
  gratuityVestingYears: 5,

  // Payroll Cycle
  payCycleType: 'Monthly',
  payPeriodStart: 1,   // 1st of month
  payPeriodEnd: 31,    // Last day
  attendanceCutoffDate: 25,
  disbursementDate: 1, // of next month
  lopCalculationMethod: 'calendar', // calendar | working | pay_period
  prorationType: 'dynamic',      // dynamic | fixed30
  autoLockAfterDisbursement: true,
  arrearDisplayMode: 'consolidated', // consolidated | breakup

  // Bank Integration
  bankName: 'HDFC Bank',
  bankAccountNo: '50200012345678',
  bankIFSC: 'HDFC0001122',
  transferMode: 'NEFT',
  bankFileFormat: 'HDFC',
  creditNarration: 'SALARY {MONTH} {YEAR} - {COMPANY}',

  // Salary Structure Default Template
  defaultSalaryComponents: [
    { id: 'tpl1', name: 'Basic', type: 'earnings_basic', amount: 0, matrixId: 'basic', taxSchedule: 'monthly' },
    { id: 'tpl2', name: 'HRA', type: 'earnings_hra', amount: 'basic * 0.40', matrixId: 'hra', taxSchedule: 'monthly' },
    { id: 'tpl3', name: 'Special Allowance', type: 'earnings_allowance', amount: 0, matrixId: 'special_allowance', taxSchedule: 'monthly' },
    { id: 'tpl4', name: 'Medical Reimbursement', type: 'reimbursement', amount: 0, matrixId: 'medical_reimb', taxSchedule: 'year_end' },
    { id: 'tpl7', name: 'Employer PF Contribution', type: 'employer_contrib', amount: 0, matrixId: 'epf_er', taxSchedule: 'monthly' },
    { id: 'tpl5', name: 'EPF Employee', type: 'employee_deduction', amount: 0, matrixId: 'epf_ee', taxSchedule: 'monthly' },
    { id: 'tpl6', name: 'Professional Tax', type: 'employee_deduction', amount: 0, matrixId: 'pt', taxSchedule: 'monthly' },
  ],
};

export const getDefaults = () => JSON.parse(JSON.stringify(DEFAULTS));

export default DEFAULTS;
