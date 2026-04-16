/**
 * Payroll Computation Engine
 * Single source of truth for all salary, tax, and statutory calculations.
 * Used by both the SimulationsTab (singleEmployee) and the PayrollOps module (batch).
 */

// ─── Professional Tax ────────────────────────────────────────────────────────
export const getPT = (st, gross) => {
  if (st === 'KA') return gross >= 25000 ? 200 : 0;
  if (st === 'MH') return gross >= 10000 ? 200 : (gross >= 7500 ? 175 : 0);
  if (st === 'WB') return gross > 40000 ? 200 : (gross > 25000 ? 150 : (gross > 15000 ? 130 : 0));
  if (st === 'TN') return 208;
  if (st === 'GJ') return gross >= 12000 ? 200 : 0;
  if (st === 'AP' || st === 'TG') return gross > 20000 ? 200 : (gross > 15000 ? 150 : 0);
  if (st === 'MP') return gross > 40000 ? 208 : (gross > 30000 ? 150 : 0);
  if (st === 'OD') return gross > 40000 ? 200 : (gross > 25000 ? 150 : 0);
  if (st === 'JH') return gross > 60000 ? 208 : (gross > 40000 ? 150 : 0);
  if (st === 'AS') return gross > 25000 ? 208 : 0;
  if (['DL', 'RJ', 'HR', 'UP', 'PB', 'HP', 'UK', 'GA', 'CH'].includes(st)) return 0;
  return 200;
};

// ─── Labour Welfare Fund ─────────────────────────────────────────────────────
export const getLWF = (st) => {
  if (st === 'KA') return 20;
  if (st === 'MH') return 12;
  if (st === 'WB') return 3;
  if (st === 'TN') return 20;
  if (st === 'GJ') return 6;
  if (st === 'AP' || st === 'TG') return 30;
  if (['DL', 'RJ', 'HR', 'UP', 'PB', 'HP', 'UK', 'GA', 'CH'].includes(st)) return 0;
  return 25;
};

// ─── Tax Liability (FY 2025-26 Budget Slabs) ─────────────────────────────────
export const evaluateTaxLiability = ({
  annualGross,
  taxRegime,
  investments80C = 0,
  medical80D = 0,
  nps80CCD1B = 0, // Additional NPS (Section 80CCD(1B))
  homeLoanInterest = 0, // Section 24(b)
  deductions80GE = 0, // 80G, 80E
  savingsInterest80TTA = 0, // 80TTA, 80TTB
  ltaClaimed = 0,
  isMetro = true,
  standardHRA = 0,
  projectedAnnualBasic = 0,
  projectedAnnualHRA = 0,
  annualRent = 0,
}) => {
  // --- Standard Capping Logic ---
  const capped80C = Math.min(150000, investments80C);
  const capped80D = medical80D; // Usually 25k/50k depending on age, simplified here as per user entry
  const cappedNPS = Math.min(50000, nps80CCD1B);
  const cappedHomeLoan = Math.min(200000, homeLoanInterest); // Self-occupied limit

  let taxableIncome = 0;
  let annualTax = 0;
  let taxFormulaDetail = '0';
  let calculatedHraExempt = 0;
  let hraFormulaString = 'Not applicable (New Regime or no HRA)';
  
  // Breakdown of HRA rules
  let hraActual = 0;
  let hraRentExcess = 0;
  let hraCityLimit = 0;

  if (taxRegime === 'old') {
    if (standardHRA > 0) {
      hraActual = projectedAnnualHRA;
      hraRentExcess = Math.max(0, annualRent - 0.10 * projectedAnnualBasic);
      hraCityLimit = isMetro ? 0.50 * projectedAnnualBasic : 0.40 * projectedAnnualBasic;
      
      calculatedHraExempt = Math.min(hraActual, hraRentExcess, hraCityLimit);
      hraFormulaString = `Min(Actual: ₹${Math.round(hraActual).toLocaleString()}, Rent-10%Basic: ₹${Math.round(hraRentExcess).toLocaleString()}, ${isMetro ? '50%' : '40%'}Basic: ₹${Math.round(hraCityLimit).toLocaleString()})`;
    }

    // Total Deductions (Old Regime)
    const totalDeductions = capped80C + capped80D + cappedNPS + cappedHomeLoan + deductions80GE + savingsInterest80TTA + ltaClaimed + 50000 + calculatedHraExempt;
    taxableIncome = Math.max(0, annualGross - totalDeductions);

    let baseTax = 0;
    if (taxableIncome > 1000000) {
      baseTax = 112500 + (taxableIncome - 1000000) * 0.3;
      taxFormulaDetail = `112,500 + ((${Math.round(taxableIncome).toLocaleString()} - 10L) × 30%)`;
    } else if (taxableIncome > 500000) {
      baseTax = 12500 + (taxableIncome - 500000) * 0.2;
      taxFormulaDetail = `12,500 + ((${Math.round(taxableIncome).toLocaleString()} - 5L) × 20%)`;
    } else if (taxableIncome > 250000) {
      baseTax = (taxableIncome - 250000) * 0.05;
      taxFormulaDetail = `(${Math.round(taxableIncome).toLocaleString()} - 2.5L) × 5%`;
    }
    if (taxableIncome <= 500000) {
      annualTax = 0;
      taxFormulaDetail = `${taxFormulaDetail || '0'} → Rebate u/s 87A → ₹0`;
    } else {
      annualTax = baseTax * 1.04;
      taxFormulaDetail = `${taxFormulaDetail} = ₹${Math.round(baseTax).toLocaleString()} + 4% Cess`;
    }
  } else {
    taxableIncome = Math.max(0, annualGross - 75000);
    let baseTax = 0;
    if (taxableIncome > 2400000) {
      baseTax = 300000 + (taxableIncome - 2400000) * 0.3;
      taxFormulaDetail = `3L + ((${Math.round(taxableIncome).toLocaleString()} - 24L) × 30%)`;
    } else if (taxableIncome > 2000000) {
      baseTax = 200000 + (taxableIncome - 2000000) * 0.25;
      taxFormulaDetail = `2L + ((${Math.round(taxableIncome).toLocaleString()} - 20L) × 25%)`;
    } else if (taxableIncome > 1600000) {
      baseTax = 120000 + (taxableIncome - 1600000) * 0.2;
      taxFormulaDetail = `1.2L + ((${Math.round(taxableIncome).toLocaleString()} - 16L) × 20%)`;
    } else if (taxableIncome > 1200000) {
      baseTax = 60000 + (taxableIncome - 1200000) * 0.15;
      taxFormulaDetail = `60k + ((${Math.round(taxableIncome).toLocaleString()} - 12L) × 15%)`;
    } else if (taxableIncome > 800000) {
      baseTax = 20000 + (taxableIncome - 800000) * 0.1;
      taxFormulaDetail = `20k + ((${Math.round(taxableIncome).toLocaleString()} - 8L) × 10%)`;
    } else if (taxableIncome > 400000) {
      baseTax = (taxableIncome - 400000) * 0.05;
      taxFormulaDetail = `(${Math.round(taxableIncome).toLocaleString()} - 4L) × 5%`;
    }
    if (taxableIncome <= 1200000) {
      annualTax = 0;
      taxFormulaDetail = `${taxFormulaDetail || '0'} → Rebate u/s 87A → ₹0`;
    } else {
      annualTax = baseTax * 1.04;
      taxFormulaDetail = `${taxFormulaDetail} = ₹${Math.round(baseTax).toLocaleString()} + 4% Cess`;
    }
  }

  return { taxableIncome, annualTax, taxFormulaDetail, calculatedHraExempt, hraFormulaString };
};

// ─── Core Payroll Computation ─────────────────────────────────────────────────
/**
 * Runs the full 3-pass component resolution + payroll math for one employee.
 * @param {Object} emp — employee record (same shape as payrollRunStore employees)
 * @returns {Object} — all computed values needed for the UI and export files
 */
export const computeEmployeePayroll = (emp) => {
  const {
    salaryComponents = [],
    daysInMonth = 30,
    lopDays = 0,
    overtimeHours = 0,
    otRate = 0,
    leaveEncashmentDays = 0,
    arrearEntries = [],
    selectedState = 'KA',
    reimbursementTaxStrategy = 'year_end',
    epfCalculationMethod = 'flat_ceiling',
    inputMode = 'monthly',
    taxRegime = 'new',
    investments80C = 0,
    medical80D = 0,
    nps80CCD1B = 0,
    homeLoanInterest = 0,
    deductions80GE = 0,
    savingsInterest80TTA = 0,
    ltaClaimed = 0,
    isMetro = true,
    monthlyRentPaid = 0,
    tdsDeductedSoFar = 0,
    monthsRemaining = 1,
  } = emp;

  const components = salaryComponents.map(c => ({ ...c })); // shallow clone to avoid mutation

  // ── PASS 1: Resolve numeric amounts ─────────────────────────────────────
  components.forEach(c => {
    let val = 0;
    if (typeof c.amount === 'number') val = c.amount;
    else if (c.amount && !isNaN(Number(c.amount))) val = Number(c.amount);
    c._resolved = inputMode === 'annual' ? val / 12 : val;
  });

  // ── PASS 2: Resolve formula strings (e.g. "basic * 0.40") ────────────────
  const scopeBasic = components.filter(c => c.type === 'earnings_basic').reduce((s, c) => s + c._resolved, 0);
  components.forEach(c => {
    if (typeof c.amount === 'string' && isNaN(Number(c.amount))) {
      try {
        const fn = new Function('basic', `return ${c.amount};`);
        c._resolved = Number(fn(scopeBasic)) || 0;
      } catch {
        c._resolved = 0;
      }
    }
  });

  // ── PRE-AGGREGATION for PASS 3 ────────────────────────────────────────────
  let tempBasic = 0, tempGross = 0;
  components.forEach(c => {
    if (c.type === 'earnings_basic') tempBasic += c._resolved;
    if (c.type === 'earnings_hra' || c.type === 'earnings_allowance') tempGross += c._resolved;
  });
  tempGross += tempBasic;

  // ── PASS 3: Hydrate blank statutory components ────────────────────────────
  components.forEach(c => {
    const isBlank = !c.amount || c.amount === 0 || c.amount === '';
    if (!isBlank) return;
    if (c.matrixId === 'epf_ee' || c.matrixId === 'epf_er') {
      if (epfCalculationMethod === 'flat_ceiling') c._resolved = Math.min(1800, tempBasic * 0.12);
      else if (epfCalculationMethod === 'actual_basic') c._resolved = tempBasic * 0.12;
      else c._resolved = Math.min(1800, tempBasic * 0.12);
    } else if (c.matrixId === 'esi_ee') c._resolved = tempGross <= 21000 ? tempGross * 0.0075 : 0;
    else if (c.matrixId === 'esi_er') c._resolved = tempGross <= 21000 ? tempGross * 0.0325 : 0;
    else if (c.matrixId === 'pt') c._resolved = getPT(selectedState, tempGross);
    else if (c.matrixId === 'lwf_ee') c._resolved = getLWF(selectedState);
  });

  // ── FINAL ACCUMULATION ────────────────────────────────────────────────────
  let standardBasic = 0, standardHRA = 0, standardSpecial = 0;
  let monthlyReimbursements = 0, employerContribs = 0, employeeDeductions = 0;
  let variableTarget = 0, variablePay = 0;
  let manualEpfInput = 0, manualPtInput = 0, manualLwfInput = 0, manualEsiInput = 0;

  components.forEach(c => {
    const val = c._resolved;
    const isBlank = !c.amount || c.amount === 0 || c.amount === '';
    if (c.type === 'earnings_basic') standardBasic += val;
    else if (c.type === 'earnings_hra') standardHRA += val;
    else if (c.type === 'earnings_allowance') standardSpecial += val;
    else if (c.type === 'reimbursement') monthlyReimbursements += val;
    else if (c.type === 'employer_contrib') {
      employerContribs += val;
      if ((c.matrixId === 'epf_ee' || c.name?.toLowerCase().includes('epf')) && !isBlank && val > 0)
        manualEpfInput = val;
    } else if (c.type === 'employee_deduction') {
      if (c.matrixId === 'pt') { if (!isBlank && val > 0) manualPtInput = val; }
      else if (c.matrixId === 'lwf_ee') { if (!isBlank && val > 0) manualLwfInput = val; }
      else if (c.matrixId === 'esi_ee') { if (!isBlank && val > 0) manualEsiInput = val; }
      else if (c.matrixId !== 'epf_ee') employeeDeductions += val;
    } else if (c.type === 'variable') {
      variableTarget += val;
      variablePay += Number(c.currentPayout) || 0;
    }
  });

  const standardGross = standardBasic + standardHRA + standardSpecial + variableTarget +
    (reimbursementTaxStrategy === 'monthly' ? monthlyReimbursements : 0);
  const totalMonthlyCTC = standardGross + (reimbursementTaxStrategy === 'year_end' ? monthlyReimbursements : 0) +
    employerContribs + variableTarget;

  // ── ATTENDANCE ─────────────────────────────────────────────────────────────
  const attendanceFactor = daysInMonth > 0 ? Math.max(0, (daysInMonth - lopDays) / daysInMonth) : 0;
  const basic = standardBasic * attendanceFactor;
  const hra = standardHRA * attendanceFactor;
  const special = standardSpecial * attendanceFactor;
  const overtimePay = overtimeHours * otRate;
  const leaveEncashmentPay = (standardGross / 26) * leaveEncashmentDays;

  // ── ARREARS ────────────────────────────────────────────────────────────────
  let arrearsPay = 0;
  (arrearEntries || []).forEach(entry => {
    const base = entry.historicalGross || standardGross;
    const divisor = entry.monthDays || 30;
    arrearsPay += (base / divisor) * entry.arrearDays;
  });

  const grossSalary = basic + hra + special + overtimePay + arrearsPay + leaveEncashmentPay + variablePay +
    (reimbursementTaxStrategy === 'monthly' ? monthlyReimbursements * attendanceFactor : 0);

  // ── TAX ────────────────────────────────────────────────────────────────────
  const annualGross = standardGross * 11 + grossSalary;
  const annualRent = monthlyRentPaid * 12;
  const projectedAnnualBasic = standardBasic * 11 + basic;
  const projectedAnnualHRA = standardHRA * 11 + hra;

  const taxCalc = evaluateTaxLiability({
    annualGross,
    taxRegime,
    investments80C,
    medical80D,
    nps80CCD1B,
    homeLoanInterest,
    deductions80GE,
    savingsInterest80TTA,
    ltaClaimed,
    isMetro,
    standardHRA: standardHRA * 12,
    projectedAnnualBasic,
    projectedAnnualHRA,
    annualRent,
  });

  const { 
    taxableIncome, annualTax, taxFormulaDetail, 
    calculatedHraExempt, hraFormulaString,
    hraActual, hraRentExcess, hraCityLimit
  } = taxCalc;
  const remainingTax = Math.max(0, annualTax - tdsDeductedSoFar);
  const tds = monthsRemaining > 0 ? remainingTax / monthsRemaining : 0;

  // ── EPF / ESIC / PT / LWF ─────────────────────────────────────────────────
  let pfEmployee = 0;
  if (manualEpfInput > 0) {
    pfEmployee = manualEpfInput * attendanceFactor;
  } else if (epfCalculationMethod === 'flat_ceiling') {
    pfEmployee = Math.min(1800, standardBasic * 0.12);
  } else if (epfCalculationMethod === 'actual_basic') {
    pfEmployee = basic * 0.12;
  } else {
    pfEmployee = Math.min(1800 * attendanceFactor, basic * 0.12);
  }
  const pfEmployer = pfEmployee;
  const esiEmployee = manualEsiInput > 0 ? manualEsiInput : (grossSalary <= 21000 ? grossSalary * 0.0075 : 0);
  const esiEmployer = grossSalary <= 21000 ? grossSalary * 0.0325 : 0;
  const pt = manualPtInput > 0 ? manualPtInput : getPT(selectedState, grossSalary);
  const lwf = manualLwfInput > 0 ? manualLwfInput : getLWF(selectedState);

  const totalDeductions = pfEmployee + esiEmployee + pt + lwf + tds + employeeDeductions;
  const netPay = grossSalary - totalDeductions + (reimbursementTaxStrategy === 'year_end' ? monthlyReimbursements : 0);

  // ── EPF STATUTORY BREAKUP ─────────────────────────────────────────────────
  const pfEps = Math.min(1250, pfEmployer * (8.33 / 12));
  const pfErShare = pfEmployer - pfEps;
  const attendedDays = daysInMonth - lopDays;

  return {
    // Input mirrors
    components,
    standardBasic, standardHRA, standardSpecial, monthlyReimbursements,
    employerContribs, employeeDeductions, variableTarget, variablePay,
    // Monthly computed
    attendanceFactor, attendedDays,
    basic, hra, special, overtimePay, arrearsPay, leaveEncashmentPay,
    grossSalary, standardGross, totalMonthlyCTC,
    fixedGross: basic + hra + special,
    // Tax
    annualGross, taxableIncome, annualTax, tds,
    taxFormulaDetail, calculatedHraExempt, hraFormulaString,
    hraActual, hraRentExcess, hraCityLimit,
    annualRent, projectedAnnualBasic, projectedAnnualHRA,
    // Deductions
    pfEmployee, pfEmployer, pfEps, pfErShare,
    esiEmployee, esiEmployer, pt, lwf,
    totalDeductions, netPay,
  };
};
