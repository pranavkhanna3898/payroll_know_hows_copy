import { useState } from 'react';
import Step0_SalaryBreakdown from './Step0_SalaryBreakdown';
import Step1_Salary from './Step1_Salary';
import Step2_Tax from './Step2_Tax';
import Step3_NetPay from './Step3_NetPay';
import Step4_BankFile from './Step4_BankFile';
import Step5_Statutory from './Step5_Statutory';
import { CATEGORIES } from '../../data/categories';

const MATRIX_COMPONENTS = CATEGORIES.flatMap(cat => cat.components);

const getPT = (st, gross) => {
  const ptMatrix = MATRIX_COMPONENTS.find(c => c.id === 'pt');
  if (ptMatrix && ptMatrix.states && ptMatrix.states[st] === 'N') return 0;
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
  return 200; 
};

const getLWF = (st) => {
  const lwfMatrix = MATRIX_COMPONENTS.find(c => c.id === 'lwf_ee');
  if (lwfMatrix && lwfMatrix.states && lwfMatrix.states[st] === 'N') return 0;
  if (st === 'KA') return 20;
  if (st === 'MH') return 12;
  if (st === 'WB') return 3;
  if (st === 'TN') return 20;
  if (st === 'GJ') return 6;
  if (st === 'AP' || st === 'TG') return 30;
  return 25; 
};

const evaluateTaxLiability = (
  annualGross, 
  taxRegime, 
  investments80C, 
  medical80D, 
  isMetro, 
  standardHRA, 
  projectedAnnualBasic, 
  projectedAnnualHRA, 
  annualRent
) => {
  const total80C = Math.min(150000, investments80C);
  const taxableIncomeBaseOld = annualGross - total80C - medical80D - 50000;
  let taxableIncome = 0;
  let annualTax = 0;
  let taxFormulaDetail = "0";
  let calculatedHraExempt = 0;
  let hraFormulaString = "Not applicable (New Regime or no HRA)";

  if (taxRegime === 'old') {
    if (standardHRA > 0) {
      const min1 = projectedAnnualHRA;
      const min2 = Math.max(0, annualRent - (0.10 * projectedAnnualBasic));
      const min3 = isMetro ? (0.50 * projectedAnnualBasic) : (0.40 * projectedAnnualBasic);
      calculatedHraExempt = Math.min(min1, min2, min3);
      hraFormulaString = `Min(Actual HRA: ${min1.toLocaleString()}, Rent-10%Basic: ${min2.toLocaleString()}, ${isMetro ? '50%' : '40%'}Basic: ${min3.toLocaleString()})`;
    }

    taxableIncome = Math.max(0, taxableIncomeBaseOld - calculatedHraExempt); 
    
    let baseTax = 0;
    if (taxableIncome > 1000000) {
      baseTax = 112500 + ((taxableIncome - 1000000) * 0.3);
      taxFormulaDetail = `112,500 + ((${Math.round(taxableIncome).toLocaleString()} - 10L) * 30%)`;
    } else if (taxableIncome > 500000) {
      baseTax = 12500 + ((taxableIncome - 500000) * 0.2);
      taxFormulaDetail = `12,500 + ((${Math.round(taxableIncome).toLocaleString()} - 5L) * 20%)`;
    } else if (taxableIncome > 250000) {
      baseTax = (taxableIncome - 250000) * 0.05;
      taxFormulaDetail = `(${Math.round(taxableIncome).toLocaleString()} - 2.5L) * 5%`;
    }

    if (taxableIncome <= 500000) {
      annualTax = 0;
      taxFormulaDetail = `${taxFormulaDetail || '0'} -> Rebate u/s 87A -> ₹0`;
    } else {
      annualTax = baseTax * 1.04;
      taxFormulaDetail = `${taxFormulaDetail} = ₹${Math.round(baseTax).toLocaleString()} + 4% Cess`;
    }
  } else {
    taxableIncome = Math.max(0, annualGross - 75000); 
    let baseTax = 0;
    if (taxableIncome > 2400000) {
      baseTax = 300000 + ((taxableIncome - 2400000) * 0.3);
      taxFormulaDetail = `3L + ((${Math.round(taxableIncome).toLocaleString()} - 24L) * 30%)`;
    } else if (taxableIncome > 2000000) {
      baseTax = 200000 + ((taxableIncome - 2000000) * 0.25);
      taxFormulaDetail = `2L + ((${Math.round(taxableIncome).toLocaleString()} - 20L) * 25%)`;
    } else if (taxableIncome > 1600000) {
      baseTax = 120000 + ((taxableIncome - 1600000) * 0.2);
      taxFormulaDetail = `1.2L + ((${Math.round(taxableIncome).toLocaleString()} - 16L) * 20%)`;
    } else if (taxableIncome > 1200000) {
      baseTax = 60000 + ((taxableIncome - 1200000) * 0.15);
      taxFormulaDetail = `60k + ((${Math.round(taxableIncome).toLocaleString()} - 12L) * 15%)`;
    } else if (taxableIncome > 800000) {
      baseTax = 20000 + ((taxableIncome - 800000) * 0.1);
      taxFormulaDetail = `20k + ((${Math.round(taxableIncome).toLocaleString()} - 8L) * 10%)`;
    } else if (taxableIncome > 400000) {
      baseTax = (taxableIncome - 400000) * 0.05;
      taxFormulaDetail = `(${Math.round(taxableIncome).toLocaleString()} - 4L) * 5%`;
    }
    
    if (taxableIncome <= 1200000) {
      annualTax = 0;
      taxFormulaDetail = `${taxFormulaDetail || '0'} -> Rebate u/s 87A -> ₹0`;
    } else {
      annualTax = baseTax * 1.04;
      taxFormulaDetail = `${taxFormulaDetail} = ₹${Math.round(baseTax).toLocaleString()} + 4% Cess`;
    }
  }

  return { taxableIncome, annualTax, taxFormulaDetail, calculatedHraExempt, hraFormulaString };
};

export default function SimulationsTab() {
  const [data, setData] = useState({
    // Step 1 Inputs
    salaryComponents: [
      { id: '1', name: 'Basic', type: 'earnings_basic', amount: 25000, currentPayout: 0, taxSchedule: 'monthly' },
      { id: '2', name: 'HRA', type: 'earnings_hra', amount: 10000, currentPayout: 0, taxSchedule: 'monthly' },
      { id: '3', name: 'Special Allowance', type: 'earnings_allowance', amount: 15000, currentPayout: 0, taxSchedule: 'monthly' },
      { id: '4', name: 'Reimbursements', type: 'reimbursement', amount: 0, currentPayout: 0, taxSchedule: 'year_end' },
      { id: '5', name: 'Employer PF Contribution', type: 'employer_contrib', amount: 1800, currentPayout: 0, taxSchedule: 'monthly' },
      { id: '6', name: 'Employer ESI Contribution', type: 'employer_contrib', amount: 0, currentPayout: 0, taxSchedule: 'monthly' }
    ],
    daysInMonth: 30,
    lopDays: 0,
    overtimeHours: 0,
    otRate: 500,
    leaveEncashmentDays: 0,
    arrearEntries: [],

    selectedState: 'KA',
    selectedCity: '',
    reimbursementTaxStrategy: 'year_end',
    inputMode: 'monthly',  // 'monthly' | 'annual'

    taxRegime: "new",
    investments80C: 0,
    medical80D: 0,
    isMetro: true,
    monthlyRentPaid: 0,
    epfCalculationMethod: 'prorated_ceiling',
    tdsDeductedSoFar: 0,
    monthsRemaining: 1,

    // Step 3/4/5 Inputs
    empName: "John Doe",
    bankName: "HDFC Bank",
    accNumber: "50100234567890",
    ifsc: "HDFC0001234",
  });

  const updateData = (key, value) => {
    const numValue = isNaN(Number(value)) ? value : Number(value);
    setData(prev => ({ ...prev, [key]: numValue }));
  };

  const updateComponent = (id, field, value) => {
    // Cast to number if it looks like one, but keep strings for names/id/matrixId
    const isNumericField = ['amount', 'currentPayout'].includes(field);
    const numValue = isNumericField && !isNaN(Number(value)) && value !== '' ? Number(value) : value;
    
    setData(prev => ({
      ...prev,
      salaryComponents: prev.salaryComponents.map(c => 
        c.id === id ? { ...c, [field]: numValue } : c
      )
    }));
  };

  const addComponent = () => {
    setData(prev => ({
      ...prev,
      salaryComponents: [
        ...prev.salaryComponents,
        { id: Date.now().toString(), name: 'New Component', type: 'earnings_allowance', amount: 0, currentPayout: 0, taxSchedule: 'monthly' }
      ]
    }));
  };

  const removeComponent = (id) => {
    setData(prev => ({
      ...prev,
      salaryComponents: prev.salaryComponents.filter(c => c.id !== id)
    }));
  };

  const addArrearEntry = () => {
    setData(prev => ({
      ...prev,
      arrearEntries: [...prev.arrearEntries, { id: Date.now().toString(), monthName: 'January', monthDays: 31, historicalGross: 0, arrearDays: 0 }]
    }));
  };

  const updateArrearEntry = (id, field, value) => {
    setData(prev => ({
      ...prev,
      arrearEntries: prev.arrearEntries.map(a => 
        a.id === id ? { ...a, [field]: field === 'monthName' ? value : Number(value) } : a
      )
    }));
  };

  const removeArrearEntry = (id) => {
    setData(prev => ({
      ...prev,
      arrearEntries: prev.arrearEntries.filter(a => a.id !== id)
    }));
  };

  // Shared derived calculations
  let standardBasic = 0;
  let standardHRA = 0;
  let standardSpecial = 0;
  let monthlyReimbursements = 0;
  let employerContribs = 0;
  let employeeDeductions = 0;
  let variableTarget = 0;
  let variablePay = 0;

  // PASS 1: Calculate absolute numeric components (normalise annual→monthly if needed)
  data.salaryComponents.forEach(c => {
    let val = 0;
    if (typeof c.amount === 'number') val = c.amount;
    else if (c.amount && !isNaN(Number(c.amount))) val = Number(c.amount);
    // If user entered an annual figure, divide by 12 to get monthly
    c._resolvedAmount = data.inputMode === 'annual' ? val / 12 : val;
  });

  // Accumulate scope Basic from Pass 1 for Pass 2 evaluation
  let scopeBasic = 0;
  data.salaryComponents.forEach(c => {
    if (c.type === 'earnings_basic') scopeBasic += c._resolvedAmount;
  });

  // PASS 2: Safely evaluate alphanumeric formulas (e.g. "basic * 0.40")
  data.salaryComponents.forEach(c => {
    if (typeof c.amount === 'string' && isNaN(Number(c.amount))) {
       try {
         const mathFunc = new Function('basic', `return ${c.amount};`);
         c._resolvedAmount = Number(mathFunc(scopeBasic)) || 0;
       } catch (e) {
         c._resolvedAmount = 0;
       }
    }
  });

  // PRE-AGGREGATION for PASS 3 (Standard Gross & Basic)
  let tempStandardBasic = 0;
  let tempStandardGross = 0;
  data.salaryComponents.forEach(c => {
    if (c.type === 'earnings_basic') tempStandardBasic += c._resolvedAmount;
    if (c.type === 'earnings_hra' || c.type === 'earnings_allowance') tempStandardGross += c._resolvedAmount;
  });
  tempStandardGross += tempStandardBasic;

  // PASS 3: Hydrate Empty Statutory Components
  data.salaryComponents.forEach(c => {
    const isBlank = !c.amount || c.amount === 0 || c.amount === '';
    if (isBlank) {
       if (c.matrixId === 'epf_ee' || c.matrixId === 'epf_er') {
           if (data.epfCalculationMethod === 'flat_ceiling') c._resolvedAmount = Math.min(1800, tempStandardBasic * 0.12);
           else if (data.epfCalculationMethod === 'actual_basic') c._resolvedAmount = tempStandardBasic * 0.12;
           else c._resolvedAmount = Math.min(1800, tempStandardBasic * 0.12);
       }
       else if (c.matrixId === 'esi_ee') c._resolvedAmount = tempStandardGross <= 21000 ? tempStandardGross * 0.0075 : 0;
       else if (c.matrixId === 'esi_er') c._resolvedAmount = tempStandardGross <= 21000 ? tempStandardGross * 0.0325 : 0;
       else if (c.matrixId === 'pt') c._resolvedAmount = getPT(data.selectedState, tempStandardGross);
       else if (c.matrixId === 'lwf_ee') c._resolvedAmount = getLWF(data.selectedState);
    }
  });

  let manualEpfInput = 0;
  let manualPtInput = 0;
  let manualLwfInput = 0;
  let manualEsiInput = 0;

  // Final Accumulation using resolved values
  data.salaryComponents.forEach(c => {
    const val = c._resolvedAmount;
    const isBlank = !c.amount || c.amount === 0 || c.amount === '';

    if (c.type === 'earnings_basic') standardBasic += val;
    else if (c.type === 'earnings_hra') standardHRA += val;
    else if (c.type === 'earnings_allowance') standardSpecial += val;
    else if (c.type === 'reimbursement') monthlyReimbursements += val;
    else if (c.type === 'employer_contrib') {
        employerContribs += val; // Needs to exist for Total CTC rendering logic
        if ((c.matrixId === 'epf_ee' || c.name.toLowerCase().includes('epf')) && !isBlank) {
             if (val > 0) manualEpfInput = val; 
        }
    }
    else if (c.type === 'employee_deduction') {
        if (c.matrixId === 'pt') {
             if (!isBlank && val > 0) manualPtInput = val;
        } else if (c.matrixId === 'lwf_ee') {
             if (!isBlank && val > 0) manualLwfInput = val;
        } else if (c.matrixId === 'esi_ee') {
             if (!isBlank && val > 0) manualEsiInput = val;
        } else if (c.matrixId !== 'epf_ee') {
             // Only add to employeeDeductions if it's NOT a mapped central statutory component 
             // because central outputs are explicitly traced! Prevents Step 3 Double-Counting!
             employeeDeductions += val;
        }
    }
    else if (c.type === 'variable') {
      variableTarget += val;
      variablePay += (Number(c.currentPayout) || 0); // Explicit cast to Number!
    }
  });

  const standardGross = standardBasic + standardHRA + standardSpecial + variableTarget + (data.reimbursementTaxStrategy === 'monthly' ? monthlyReimbursements : 0);
  const totalMonthlyCTC = standardGross + (data.reimbursementTaxStrategy === 'year_end' ? monthlyReimbursements : 0) + employerContribs + variableTarget;

  const attendanceFactor = data.daysInMonth > 0 ? Math.max(0, (data.daysInMonth - data.lopDays) / data.daysInMonth) : 0;
  const basic = standardBasic * attendanceFactor;
  const hra = standardHRA * attendanceFactor;
  const special = standardSpecial * attendanceFactor;
  const overtimePay = data.overtimeHours * data.otRate;
  const leaveEncashmentPay = (standardGross / 26) * data.leaveEncashmentDays;

  let arrearsPay = 0;
  data.arrearEntries.forEach(entry => {
    const baseToUse = entry.historicalGross || standardGross;
    const divisor = entry.monthDays || 30; // Guard against 0 days in month
    arrearsPay += (baseToUse / divisor) * entry.arrearDays;
  });
  
  const grossSalary = basic + hra + special + overtimePay + arrearsPay + leaveEncashmentPay + variablePay + (data.reimbursementTaxStrategy === 'monthly' ? (monthlyReimbursements * attendanceFactor) : 0);

  const annualGross = (standardGross * 11) + grossSalary; 
  const annualRent = data.monthlyRentPaid * 12;
  const projectedAnnualBasic = (standardBasic * 11) + basic;
  const projectedAnnualHRA = (standardHRA * 11) + hra;

  const runRateTax = evaluateTaxLiability(annualGross, data.taxRegime, data.investments80C, data.medical80D, data.isMetro, standardHRA, projectedAnnualBasic, projectedAnnualHRA, annualRent);
  const taxableIncome = runRateTax.taxableIncome;
  const annualTax = runRateTax.annualTax;
  const taxFormulaDetail = runRateTax.taxFormulaDetail;
  const calculatedHraExempt = runRateTax.calculatedHraExempt;
  const hraFormulaString = runRateTax.hraFormulaString;

  const remainingTax = Math.max(0, annualTax - data.tdsDeductedSoFar);
  const tds = data.monthsRemaining > 0 ? (remainingTax / data.monthsRemaining) : 0;

  // Project Liability for Analytics Dashboard
  const projectedAnnualGross = annualGross + (data.reimbursementTaxStrategy === 'year_end' ? (monthlyReimbursements * 12) : 0);
  const projectedTaxObj = evaluateTaxLiability(projectedAnnualGross, data.taxRegime, data.investments80C, data.medical80D, data.isMetro, standardHRA, projectedAnnualBasic, projectedAnnualHRA, annualRent);

  // Deductions
  let pfEmployee = 0;
  
  if (manualEpfInput > 0) {
    // Structural Bypass: use the hardcoded formula value prorated by LOP
    pfEmployee = manualEpfInput * attendanceFactor;
  } else if (data.epfCalculationMethod === 'flat_ceiling') {
    pfEmployee = Math.min(1800, standardBasic * 0.12);
  } else if (data.epfCalculationMethod === 'actual_basic') {
    pfEmployee = basic * 0.12; 
  } else {
    pfEmployee = Math.min(1800 * attendanceFactor, basic * 0.12);
  }
  
  const pfEmployer = pfEmployee;  
  const esiEmployee = manualEsiInput > 0 ? manualEsiInput : (grossSalary <= 21000 ? grossSalary * 0.0075 : 0);
  const esiEmployer = grossSalary <= 21000 ? grossSalary * 0.0325 : 0;
  
  // Dynamic State Mathematics For PT and LWF
  const pt = manualPtInput > 0 ? manualPtInput : getPT(data.selectedState, grossSalary);
  const lwf = manualLwfInput > 0 ? manualLwfInput : getLWF(data.selectedState);
  
  const totalDeductions = pfEmployee + esiEmployee + pt + lwf + tds + employeeDeductions;
  const netPay = grossSalary - totalDeductions + (data.reimbursementTaxStrategy === 'year_end' ? monthlyReimbursements : 0);

  const simState = {
    ...data,
    setData, updateData, updateComponent, addComponent, removeComponent, addArrearEntry, updateArrearEntry, removeArrearEntry,
    standardBasic, standardHRA, standardSpecial, monthlyReimbursements, employerContribs, employeeDeductions, variableTarget, variablePay,
    basic, hra, special, overtimePay, arrearsPay, leaveEncashmentPay, grossSalary, attendanceFactor,
    taxableIncome, annualTax, tds,
    pfEmployee, pfEmployer, esiEmployee, esiEmployer, pt, lwf,
    totalDeductions, netPay, taxFormulaDetail, totalMonthlyCTC, standardGross,
    calculatedHraExempt, hraFormulaString,
    projectedTaxObj,
    annualGross, annualRent, projectedAnnualBasic, projectedAnnualHRA,
    fixedGross: (basic + hra + special)
  };

  return (
    <div className="simulations-container">
      <div className="cycle-header" style={{ marginBottom: 32 }}>
        <h2 className="tab-heading">Interactive Payroll Pipeline Simulator</h2>
        <p className="tab-subheading">
          Adjust inputs at each stage to see the real-time downstream impacts across Salary, Taxes, Payouts, and Statutory Compliance.
        </p>
      </div>

      <div className="pipeline-steps">
        <Step0_SalaryBreakdown state={simState} />
        <div className="pipeline-arrow">⬇</div>
        <Step1_Salary state={simState} />
        <div className="pipeline-arrow">⬇</div>
        <Step2_Tax state={simState} />
        <div className="pipeline-arrow">⬇</div>
        <Step3_NetPay state={simState} />
        <div className="pipeline-arrow">⬇</div>
        <div className="pipeline-row">
          <Step4_BankFile state={simState} />
          <Step5_Statutory state={simState} />
        </div>

        {/* Step 6 Analytics Dashboard */}
        <div className="sim-card sim-card-mixed" style={{marginTop: 32}}>
          <div className="sim-card-header" style={{background: '#f8fafc', padding: 20, borderBottom: '1px solid #cbd5e1'}}>
            <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 8}}>
              <span style={{fontSize: 18}}>📊</span> Tax Liability Projections (Actual vs Potential)
            </h3>
            <p style={{margin: '6px 0 0 0', fontSize: 13, color: '#64748b'}}>
              Visualizing your current Run-Rate Tax alongside your catastrophic projected liability if Year-End claims are forfeited.
            </p>
          </div>
          <div className="sim-card-body" style={{padding: 24}}>
            <div style={{display: 'flex', gap: 24, flexWrap: 'wrap'}}>
              
              {/* Current Run Rate */}
              <div style={{flex: '1 1 300px', background: 'white', borderRadius: 8, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
                <div style={{fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5}}>Active Standard Liability</div>
                <div style={{fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '8px 0'}}>₹{Math.round(annualTax).toLocaleString()}</div>
                <div style={{fontSize: 13, color: '#64748b'}}>
                  Current Tax tracking assumes you are <strong>successfully submitting</strong> ₹{Math.round(monthlyReimbursements*12).toLocaleString()} in mapped bills by March.
                </div>
                <div style={{marginTop: 16, paddingTop: 16, borderTop: '1px dashed #cbd5e1'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8}}>
                    <span style={{color: '#64748b'}}>Tracked Taxable Income:</span>
                    <strong style={{color: '#334155'}}>₹{Math.round(taxableIncome).toLocaleString()}</strong>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13}}>
                    <span style={{color: '#64748b'}}>Monthly TDS deduction:</span>
                    <strong style={{color: '#334155'}}>₹{Math.round(tds).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Projected Unclaimed Delta */}
              <div style={{flex: '1 1 300px', background: '#fff1f2', borderRadius: 8, padding: 20, border: '1px solid #fecdd3', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
                <div style={{fontSize: 12, fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: 0.5}}>Potential Year-End Liability</div>
                <div style={{fontSize: 28, fontWeight: 800, color: '#9f1239', margin: '8px 0'}}>₹{Math.round(projectedTaxObj.annualTax).toLocaleString()}</div>
                <div style={{fontSize: 13, color: '#e11d48'}}>
                  Projected Tax assumes a <strong>complete forfeit</strong> of ₹{Math.round(monthlyReimbursements*12).toLocaleString()} in claims by March, switching status to fully taxable.
                </div>
                <div style={{marginTop: 16, paddingTop: 16, borderTop: '1px dashed #fda4af'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8}}>
                    <span style={{color: '#9f1239'}}>Unclaimed Taxable Income:</span>
                    <strong style={{color: '#881337'}}>₹{Math.round(projectedTaxObj.taxableIncome).toLocaleString()}</strong>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#ef4444', fontWeight: 600}}>
                    <span>Sudden Arrear Hit (March):</span>
                    <span>₹{Math.round(projectedTaxObj.annualTax - annualTax).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
