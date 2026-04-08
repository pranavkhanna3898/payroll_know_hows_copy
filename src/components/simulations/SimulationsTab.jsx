import { useState } from 'react';
import Step0_SalaryBreakdown from './Step0_SalaryBreakdown';
import Step1_Salary from './Step1_Salary';
import Step2_Tax from './Step2_Tax';
import Step3_NetPay from './Step3_NetPay';
import Step4_BankFile from './Step4_BankFile';
import Step5_Statutory from './Step5_Statutory';

export default function SimulationsTab() {
  const [data, setData] = useState({
    // Step 1 Inputs
    monthlyBasic: 25000,
    monthlyHRA: 10000,
    monthlySpecial: 15000,
    monthlyReimbursements: 0,
    employerPFMatch: 1800,
    employerESIMatch: 0,
    daysInMonth: 30,
    lopDays: 0,
    overtimeHours: 0,
    otRate: 500,
    arrears: 0,

    // Step 2 Inputs
    taxRegime: "new",
    investments80C: 0,
    medical80D: 0,
    hraExempt: 0,
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

  // Shared derived calculations
  const standardBasic = data.monthlyBasic;
  const standardHRA = data.monthlyHRA;
  const standardSpecial = data.monthlySpecial;
  const standardGross = standardBasic + standardHRA + standardSpecial;
  const totalMonthlyCTC = standardGross + data.monthlyReimbursements + data.employerPFMatch + data.employerESIMatch;

  const attendanceFactor = Math.max(0, (data.daysInMonth - data.lopDays) / data.daysInMonth);
  const basic = standardBasic * attendanceFactor;
  const hra = standardHRA * attendanceFactor;
  const special = standardSpecial * attendanceFactor;
  const overtimePay = data.overtimeHours * data.otRate;
  
  const grossSalary = basic + hra + special + overtimePay + data.arrears;

  const annualGross = (standardGross * 11) + grossSalary; 
  
  let taxableIncome = 0;
  let annualTax = 0;
  let taxFormulaDetail = "0";

  if (data.taxRegime === 'old') {
    const total80C = Math.min(150000, data.investments80C);
    taxableIncome = Math.max(0, annualGross - total80C - data.medical80D - data.hraExempt - 50000); 
    
    if (taxableIncome > 1000000) {
      annualTax = 112500 + ((taxableIncome - 1000000) * 0.3);
      taxFormulaDetail = `112k + ((${taxableIncome} - 10L) * 30%) = ${annualTax}`;
    } else if (taxableIncome > 500000) {
      annualTax = 12500 + ((taxableIncome - 500000) * 0.2);
      taxFormulaDetail = `12.5k + ((${taxableIncome} - 5L) * 20%) = ${annualTax}`;
    } else if (taxableIncome > 250000) {
      annualTax = (taxableIncome - 250000) * 0.05;
      taxFormulaDetail = `(${taxableIncome} - 2.5L) * 5% = ${annualTax}`;
      if (taxableIncome <= 500000) {
         annualTax = 0; 
         taxFormulaDetail = `${taxFormulaDetail} -> Old Rebate u/s 87A -> 0`;
      }
    }
  } else {
    // New Tax Regime (FY 2026-27 default)
    taxableIncome = Math.max(0, annualGross - 75000); // 75k standard deduction
    
    // FY 2026-27 Slabs
    if (taxableIncome > 2400000) {
      annualTax = 460000 + ((taxableIncome - 2400000) * 0.3);
      taxFormulaDetail = `4.6L + ((${taxableIncome} - 24L) * 30%) = ${annualTax}`;
    } else if (taxableIncome > 2000000) {
      annualTax = 360000 + ((taxableIncome - 2000000) * 0.25);
      taxFormulaDetail = `3.6L + ((${taxableIncome} - 20L) * 25%) = ${annualTax}`;
    } else if (taxableIncome > 1600000) {
      annualTax = 280000 + ((taxableIncome - 1600000) * 0.2);
      taxFormulaDetail = `2.8L + ((${taxableIncome} - 16L) * 20%) = ${annualTax}`;
    } else if (taxableIncome > 1200000) {
      annualTax = 220000 + ((taxableIncome - 1200000) * 0.15);
      taxFormulaDetail = `2.2L + ((${taxableIncome} - 12L) * 15%) = ${annualTax}`;
    } else if (taxableIncome > 800000) {
      annualTax = 180000 + ((taxableIncome - 800000) * 0.1);
      taxFormulaDetail = `1.8L + ((${taxableIncome} - 8L) * 10%) = ${annualTax}`;
    } else if (taxableIncome > 400000) {
      annualTax = (taxableIncome - 400000) * 0.05;
      taxFormulaDetail = `(${taxableIncome} - 4L) * 5% = ${annualTax}`;
    }
    
    if (taxableIncome <= 1200000) {
      annualTax = 0;
      taxFormulaDetail = `${taxFormulaDetail} -> New Rebate u/s 87A (Up to 12L) -> 0`;
    }
  }
  
  const remainingTax = Math.max(0, annualTax - data.tdsDeductedSoFar);
  const tds = data.monthsRemaining > 0 ? (remainingTax / data.monthsRemaining) : 0;

  // Deductions
  const pfEmployee = Math.min(1800, basic * 0.12);
  const pfEmployer = pfEmployee; 
  const esiEmployee = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;
  const esiEmployer = grossSalary <= 21000 ? grossSalary * 0.0325 : 0;
  const pt = 200; 
  const lwf = 25; 
  
  const totalDeductions = pfEmployee + esiEmployee + pt + lwf + tds;
  const netPay = grossSalary - totalDeductions;

  const simState = {
    ...data,
    updateData,
    standardBasic, standardHRA, standardSpecial,
    basic, hra, special, overtimePay, grossSalary, attendanceFactor,
    taxableIncome, annualTax, tds,
    pfEmployee, pfEmployer, esiEmployee, esiEmployer, pt, lwf,
    totalDeductions, netPay, taxFormulaDetail, totalMonthlyCTC, standardGross
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
      </div>
    </div>
  );
}
