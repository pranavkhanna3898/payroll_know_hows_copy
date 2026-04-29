import { useState, useEffect } from 'react';
import { getEmployees, getCompanySettings } from '../../data/api';
// ... existing imports ...
import Step0_SalaryBreakdown from './Step0_SalaryBreakdown';
import Step1_Salary from './Step1_Salary';
import Step2_Tax from './Step2_Tax';
import Step3_NetPay from './Step3_NetPay';
import Step4_BankFile from './Step4_BankFile';
import Step5_Statutory from './Step5_Statutory';
import { CATEGORIES } from '../../data/categories';
import { computeEmployeePayroll, evaluateTaxLiability, isMetroCity } from '../../data/payrollEngine';

const MATRIX_COMPONENTS = CATEGORIES.flatMap(cat => cat.components);

export default function SimulationsTab() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error);
    getCompanySettings().then(s => {
      if (s?.ptHalfYearlyMode) {
        setData(prev => ({ ...prev, ptHalfYearlyMode: s.ptHalfYearlyMode }));
      }
    }).catch(console.error);
  }, []);

  const loadEmployee = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    setData(prev => ({
      ...prev,
      empName: emp.name,
      empCode: emp.emp_code,
      salaryComponents: emp.salary_structure || [],
      taxRegime: emp.tax_regime || 'new',
      bankName: emp.bank_name || '',
      accNumber: emp.account_number || '',
      ifsc: emp.ifsc || '',
      work_state: emp.work_state || 'KA',
      work_city: emp.work_city || 'Bengaluru',
      base_state: emp.base_state || 'KA',
      base_city: emp.base_city || 'Bengaluru',
      exit_date: emp.exit_date || '',
      exit_reason: emp.exit_reason || '',
      // Reset variables that are simulation specific
      lopDays: 0,
      overtimeHours: 0,
    }));
  };
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
    exit_date: '',
    exit_reason: '',
    arrearEntries: [],

    work_state: 'KA',
    work_city: 'Bengaluru',
    base_state: 'KA',
    base_city: 'Bengaluru',
    reimbursementTaxStrategy: 'year_end',
    inputMode: 'monthly',  // 'monthly' | 'annual'

    taxRegime: "new",
    investments80C: 0,
    medical80D_self: 0,
    medical80D_parents: 0,
    medical80D_parents_senior: false,
    nps80CCD1B: 0,
    homeLoanInterest: 0,
    deductions80GE: 0,
    savingsInterest80TTA: 0,
    ltaClaimed: 0,
    monthlyRentPaid: 0,
    epfCalculationMethod: 'prorated_ceiling',
    tdsDeductedSoFar: 0,
    monthsRemaining: 1,
    payrollMonth: new Date().getMonth(),
    ptHalfYearlyMode: 'lump_sum',
    variableTaxMode: 'spread',

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
    let numValue = isNumericField && !isNaN(Number(value)) && value !== '' ? Number(value) : value;
    
    setData(prev => ({
      ...prev,
      salaryComponents: prev.salaryComponents.map(c => {
        if (c.id === id) {
          const updated = { ...c, [field]: numValue };
          // Logic: If user just set the 'amount' (target) for a variable component,
          // and they haven't manually set a 'currentPayout' yet, sync it!
          if (field === 'amount' && updated.type === 'variable' && (!updated.currentPayout || updated.currentPayout === 0)) {
            updated.currentPayout = numValue;
          }
          // If user just changed type to 'variable', sync payout to amount
          if (field === 'type' && value === 'variable') {
            updated.currentPayout = updated.amount;
          }
          return updated;
        }
        return c;
      })
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

  // Shared derived calculations using the common engine
  const computed = computeEmployeePayroll(data);
  const { 
    annualTax, taxableIncome, tds, monthlyReimbursements, annualGross, 
    taxRegime, investments80C, medical80D_self, medical80D_parents, medical80D_parents_senior, nps80CCD1B, homeLoanInterest,
    deductions80GE, savingsInterest80TTA, ltaClaimed, standardHRA, 
    projectedAnnualBasic, projectedAnnualHRA, annualRent,
    hraActual, hraRentExcess, hraCityLimit, calculatedHraExempt, hraFormulaString
  } = computed;

  // Compute "what-if" projection: What if reimbursements are NOT submitted and become fully taxable?
  // We do this by evaluating tax with calculatedHraExempt: 0 and annualGross including the reims
  const projectedTaxObj = evaluateTaxLiability({
    annualGross: annualGross + (data.reimbursementTaxStrategy === 'year_end' ? monthlyReimbursements * 12 : 0),
    taxRegime,
    investments80C,
    medical80D_self,
    medical80D_parents,
    medical80D_parents_senior,
    nps80CCD1B,
    homeLoanInterest,
    deductions80GE,
    savingsInterest80TTA,
    ltaClaimed,
    isMetro: isMetroCity(data.work_city),
    standardHRA,
    projectedAnnualBasic,
    projectedAnnualHRA,
    annualRent,
  });

  const simState = {
    ...data,
    ...computed,
    setData, updateData, updateComponent, addComponent, removeComponent, addArrearEntry, updateArrearEntry, removeArrearEntry,
    projectedTaxObj,
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
        {/* Employee Selector for Simulation */}
        {employees.length > 0 && (
          <div className="sim-card" style={{ marginBottom: 24, padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>👤 Auto-fill from Employee Database:</span>
            <select 
              onChange={e => loadEmployee(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, minWidth: 200, outline: 'none' }}
            >
              <option value="">-- Choose an Employee --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.emp_code})</option>)}
            </select>
          </div>
        )}

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
