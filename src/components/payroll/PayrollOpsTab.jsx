import { useState, useCallback, useEffect } from 'react';
import { getEmployees, getPayruns, createPayrun, updatePayrunStatus, addPayrunAuditLog, getPayrunAdjustments, savePayrunAdjustment, getEmployeeFYTaxHistory, getEmployeeSubmissions, deletePayrun, getCompanySettings } from '../../data/api';
import { computeEmployeePayroll } from '../../data/payrollEngine';
import { getDaysInMonth, getMonthsRemainingInFY, getFinancialYearRange } from '../../utils/dateUtils';
import PayrollOps_Initiate from './PayrollOps_Initiate';
import PayrollOps_Review from './PayrollOps_Review';
import PayrollOps_Tax from './PayrollOps_Tax';
import PayrollOps_Confirm from './PayrollOps_Confirm';
import PayrollOps_SlipViewer from './PayrollOps_SlipViewer';

const STEPS = [
  { id: 0, icon: '▶', label: 'Initiate' },
  { id: 1, icon: '👀', label: 'Review & Adjust' },
  { id: 2, icon: '📊', label: 'Tax & TDS' },
  { id: 3, icon: '✅', label: 'Confirm & Export' },
  { id: 4, icon: '🧾', label: 'Salary Slips' },
];

export default function PayrollOpsTab() {
  const [employees, setEmployees] = useState([]);
  const [payruns, setPayruns] = useState([]);
  const [activePayrun, setActivePayrun] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [companySettings, setCompanySettings] = useState(null);

  // ── Initial Load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [empData, payrunData, settingsData] = await Promise.all([getEmployees(), getPayruns(), getCompanySettings()]);
        setEmployees(empData || []);
        setPayruns(payrunData || []);
        setCompanySettings(settingsData || {});
      } catch (e) {
        console.error('Failed to load payroll data:', e);
      }
      setLoading(false);
    }
    init();
  }, []);

  // ── Helpers to update employee adjustments within current payrun ─────────────
  const updateAdjustment = useCallback(async (empId, field, value) => {
    if (!activePayrun) return;
    
    // Update local state for immediate UI feedback
    const prevAdj = activePayrun.adjustments || {};
    const empAdj = prevAdj[empId] || {};
    const newAdj = { ...empAdj, [field]: value };
    
    setActivePayrun(prev => ({
      ...prev,
      adjustments: { ...prev.adjustments, [empId]: newAdj }
    }));

    // Persist to Supabase
    try {
      await savePayrunAdjustment(activePayrun.id, empId, newAdj, null); 
    } catch (e) {
      console.error('Failed to persist adjustment:', e);
    }
  }, [activePayrun]);

  const updateTaxOverride = useCallback(async (empId, field, value) => {
    if (!activePayrun) return;

    const prevOv = activePayrun.taxOverrides || {};
    const empOv = prevOv[empId] || {};
    const newOv = { ...empOv, [field]: value };

    setActivePayrun(prev => ({
      ...prev,
      taxOverrides: { ...prev.taxOverrides, [empId]: newOv }
    }));

    // For now, we reuse payrun_adjustments table for tax overrides too (merged JSON)
    try {
      await savePayrunAdjustment(activePayrun.id, empId, { ...activePayrun.adjustments?.[empId], taxOverrides: newOv }, null);
    } catch (e) {
      console.error('Failed to persist tax override:', e);
    }
  }, [activePayrun]);

  const toggleSlip = useCallback((empId) => {
    setActivePayrun(prev => {
      const published = prev.publishedSlips?.includes(empId)
        ? prev.publishedSlips.filter(id => id !== empId)
        : [...(prev.publishedSlips || []), empId];
      return { ...prev, publishedSlips: published };
    });
  }, []);

  const publishAll = useCallback((empIds) => {
    setActivePayrun(prev => ({ ...prev, publishedSlips: empIds }));
  }, []);

  // ── Auto-initialize parameters when payrun is selected or step changes ────────
  useEffect(() => {
    if (!activePayrun) return;

    // 1. Auto-fill Days in Month and Months Remaining
    const days = getDaysInMonth(activePayrun.month_year);
    const monthsLeft = getMonthsRemainingInFY(activePayrun.month_year);

    // 2. If moving to Tax step (step 2) or Review step (step 1), fetch auxiliary data
    async function loadData() {
      if (step !== 1 && step !== 2) return;
      
      const newTaxOverrides = { ...(activePayrun.taxOverrides || {}) };
      const newAdjs = { ...(activePayrun.adjustments || {}) };
      let taxChanged = false;
      let adjChanged = false;

      // Pre-fetch all verified submissions for the FY to avoid N+1 queries
      let verifiedSubs = [];
      try {
        const fy = getFinancialYearRange(activePayrun.month_year);
        const subs = await getEmployeeSubmissions(fy);
        verifiedSubs = subs.filter(s => s.status === 'verified');
      } catch (e) {
        console.error('Failed to load employee submissions:', e);
      }

      for (const empId of activePayrun.employeeIds) {
        const ov = newTaxOverrides[empId] || {};
        const adj = newAdjs[empId] || {};
        
        // Auto-set months remaining if not manually touched
        if (ov.monthsRemaining === undefined) {
          ov.monthsRemaining = monthsLeft;
          taxChanged = true;
        }

        // Apply verified IT Declarations
        const empDecl = verifiedSubs.find(s => s.employee_id === empId && s.type === 'it_declaration');
        if (empDecl && empDecl.verified_data) {
          ['investments80C', 'medical80D_self', 'medical80D_parents', 'nps80CCD1B', 'homeLoanInterest', 'deductions80GE', 'savingsInterest80TTA', 'monthlyRentPaid', 'ltaClaimed'].forEach(f => {
            if (empDecl.verified_data[f] !== undefined && ov[f] === undefined) {
              ov[f] = Number(empDecl.verified_data[f]);
              taxChanged = true;
            }
          });
          // Handle boolean separately
          if (empDecl.verified_data.medical80D_parents_senior !== undefined && ov.medical80D_parents_senior === undefined) {
            ov.medical80D_parents_senior = Boolean(empDecl.verified_data.medical80D_parents_senior);
            taxChanged = true;
          }
        }

        // Fetch history if TDS deducted is still 0/undefined and not manually overridden
        if (ov.tdsDeductedSoFar === undefined) {
          try {
            const history = await getEmployeeFYTaxHistory(empId, activePayrun.month_year);
            ov.tdsDeductedSoFar = history.tds;
            ov.ytdGross = history.grossSalary;
            ov.ytdBasic = history.basic;
            ov.ytdHRA = history.hra;
            ov.ytdNetPay = history.netPay;
            ov.ytdTotalDeductions = history.totalDeductions;
            ov.ytdComponents = history.components;
            taxChanged = true;
          } catch (e) {
            console.error(`Failed to fetch tax history for ${empId}:`, e);
          }
        }
        
        newTaxOverrides[empId] = ov;
        newAdjs[empId] = adj;
      }

      if (taxChanged) {
        setActivePayrun(prev => ({ ...prev, taxOverrides: newTaxOverrides }));
      }
      if (adjChanged) {
        setActivePayrun(prev => ({ ...prev, adjustments: newAdjs }));
      }
    }

    loadData();

    // 3. Auto-fill daysInMonth in adjustments if not present
    if (activePayrun.employeeIds.some(id => !activePayrun.adjustments?.[id]?.daysInMonth)) {
      const newAdjs = { ...(activePayrun.adjustments || {}) };
      activePayrun.employeeIds.forEach(id => {
        if (!newAdjs[id]) newAdjs[id] = {};
        if (newAdjs[id].daysInMonth === undefined) {
          newAdjs[id].daysInMonth = days;
        }
      });
      setActivePayrun(prev => ({ ...prev, adjustments: newAdjs }));
    }
  }, [activePayrun?.id, step]);

  // ── Get employees for current payrun ─────────────────────────────────────────
  const getPayrunEmployees = useCallback(() => {
    if (!activePayrun || !employees.length) return [];
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let payrollMonthIndex = -1;
    if (activePayrun.monthLabel || activePayrun.month_year) {
       const str = activePayrun.monthLabel || activePayrun.month_year;
       const match = str.split(' ')[0];
       payrollMonthIndex = monthNames.findIndex(m => m.startsWith(match));
    }
    
    return employees
      .filter(e => activePayrun.employeeIds.includes(e.id))
      .map(e => {
        const adj = activePayrun.adjustments?.[e.id] || {};
        // Retrieve tax overrides from adjustment object if present, else fallback
        const taxOv = adj.taxOverrides || activePayrun.taxOverrides?.[e.id] || {};
        
        // Map DB employee to engine format
        const engineEmp = {
          ...e,
          empCode: e.emp_code, 
          salaryComponents: e.salary_structure || [], 
          dateOfJoining: e.date_of_joining,
          bankName: e.bank_info?.bank_name,
          accNumber: e.bank_info?.account_no,
          ifsc: e.bank_info?.ifsc,
          uan: e.uan || '',
          ipNumber: e.ip_number || '',
          pan: e.pan || '',
          daysInMonth: adj.daysInMonth ?? 30,
          lopDays: adj.lopDays ?? 0,
          overtimeHours: adj.overtimeHours ?? 0,
          otRate: adj.otRate ?? 0,
          leaveEncashmentDays: adj.leaveEncashmentDays ?? 0,
          arrearEntries: adj.arrearEntries ?? [],
          taxRegime: taxOv.taxRegime ?? e.tax_regime ?? 'new',
          work_state: e.work_state || 'KA',
          work_city: e.work_city || 'Bengaluru',
          base_state: e.base_state || 'KA',
          base_city: e.base_city || 'Bengaluru',
          investments80C: taxOv.investments80C ?? 0,
          medical80D_self: taxOv.medical80D_self ?? 0,
          medical80D_parents: taxOv.medical80D_parents ?? 0,
          medical80D_parents_senior: taxOv.medical80D_parents_senior ?? false,
          nps80CCD1B: taxOv.nps80CCD1B ?? 0,
          homeLoanInterest: taxOv.homeLoanInterest ?? 0,
          deductions80GE: taxOv.deductions80GE ?? 0,
          savingsInterest80TTA: taxOv.savingsInterest80TTA ?? 0,
          ltaClaimed: taxOv.ltaClaimed ?? 0,
          monthlyRentPaid: taxOv.monthlyRentPaid ?? 0,
          tdsDeductedSoFar: taxOv.tdsDeductedSoFar ?? 0,
          ytdGross: taxOv.ytdGross,
          ytdBasic: taxOv.ytdBasic,
          ytdHRA: taxOv.ytdHRA,
          ytdNetPay: taxOv.ytdNetPay,
          ytdTotalDeductions: taxOv.ytdTotalDeductions,
          ytdComponents: taxOv.ytdComponents,
          monthsRemaining: taxOv.monthsRemaining ?? 12,
          employeeDeductions: adj.manualDeduction ?? 0,
          inputMode: e.input_mode || 'monthly',
          payrollMonth: payrollMonthIndex,
          payrollYear: activePayrun.year || Number((activePayrun.month_year || '').split(' ')[1]) || new Date().getFullYear(),
          ptHalfYearlyMode: companySettings?.ptHalfYearlyMode || 'lump_sum',
          variableTaxMode: taxOv.variableTaxMode ?? companySettings?.variableTaxMode ?? 'spread',
        };

        // Inject variable payouts into components
        engineEmp.salaryComponents = (engineEmp.salaryComponents || []).map(c => {
          if (c.type === 'variable' && adj.variablePayouts?.[c.id] !== undefined) {
            return { ...c, currentPayout: adj.variablePayouts[c.id] };
          }
          return c;
        });

        const computed = computeEmployeePayroll(engineEmp);
        
        computed.ytd = {
           grossSalary: (taxOv.ytdGross || 0) + computed.grossSalary,
           basic: (taxOv.ytdBasic || 0) + computed.basic,
           hra: (taxOv.ytdHRA || 0) + computed.hra,
           tds: (taxOv.tdsDeductedSoFar || 0) + computed.tds,
           netPay: (taxOv.ytdNetPay || 0) + computed.netPay,
           totalDeductions: (taxOv.ytdTotalDeductions || 0) + computed.totalDeductions,
           components: { ...(taxOv.ytdComponents || {}) }
        };
        computed.components.forEach(cp => {
           computed.ytd.components[cp.id] = (computed.ytd.components[cp.id] || 0) + (cp._resolved || 0);
        });

        return { ...engineEmp, computed };
      });
  }, [activePayrun, employees, companySettings]);

  // ── Operations ────────────────────────────────────────────────────────────────
  const openPayrun = useCallback(async (payrun) => {
    setLoading(true);
    try {
      const adjustments = await getPayrunAdjustments(payrun.id);
      const adjMap = {};
      const taxOvMap = {};
      adjustments.forEach(a => { 
        adjMap[a.employee_id] = a.adjustments; 
        if (a.adjustments?.taxOverrides) {
          taxOvMap[a.employee_id] = a.adjustments.taxOverrides;
        }
      });
      
      const employeeIds = adjustments.map(a => a.employee_id);
      
      const sessionPayrun = {
        ...payrun,
        employeeIds,
        adjustments: adjMap,
        taxOverrides: taxOvMap, 
        publishedSlips: [],
        monthLabel: payrun.month_year
      };
      
      setActivePayrun(sessionPayrun);
      const statusStepMap = { initiated: 1, reviewed: 2, tax_checked: 3, confirmed: 4, completed: 4 };
      setStep(statusStepMap[payrun.status] ?? 1);
    } catch (e) {
      alert('Error opening payrun: ' + e.message);
    }
    setLoading(false);
  }, []);

  const initiatePayrun = useCallback(async (month, year, selectedEmpIds) => {
    const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }) + ' ' + year;
    
    // Check if an unconfirmed payrun already exists for this month
    const existingDraft = payruns.find(p => p.month_year === monthLabel && p.status !== 'confirmed');
    
    if (existingDraft) {
      if (confirm(`A draft payrun for ${monthLabel} already exists in your history. Would you like to resume it instead of creating a duplicate?`)) {
        openPayrun(existingDraft);
        return;
      }
    }

    try {
      const payrun = await createPayrun(monthLabel);
      // Construct the internal object structure the UI expects
      const fullPayrun = {
        ...payrun,
        month,
        year,
        monthLabel,
        employeeIds: selectedEmpIds,
        adjustments: {},
        taxOverrides: {},
        publishedSlips: []
      };
      
      setActivePayrun(fullPayrun);
      setPayruns(prev => [fullPayrun, ...prev]);
      setStep(1);
    } catch (e) {
      alert('Error initiating payrun: ' + e.message);
    }
  }, [payruns, openPayrun]);

  const handleDeletePayrun = async (id) => {
    if (!confirm('Are you certain you want to permanently delete this payrun? This cannot be undone.')) return;
    try {
      await deletePayrun(id);
      setPayruns(prev => prev.filter(p => p.id !== id));
      if (activePayrun && activePayrun.id === id) {
        setActivePayrun(null);
        setStep(0);
      }
    } catch (e) {
      alert('Failed to delete payrun: ' + e.message);
    }
  };

  const confirmPayrun = useCallback(async () => {
    if (!activePayrun) return;
    try {
      const computedEmpData = getPayrunEmployees();
      const promises = computedEmpData.map(emp => {
        const adj = { ...(activePayrun.adjustments?.[emp.id] || {}) };
        const taxOv = activePayrun.taxOverrides?.[emp.id];
        if (taxOv) {
          adj.taxOverrides = taxOv;
        }
        return savePayrunAdjustment(activePayrun.id, emp.id, adj, emp.computed);
      });
      await Promise.all(promises);

      await updatePayrunStatus(activePayrun.id, 'confirmed');
      const confirmed = { ...activePayrun, status: 'confirmed', confirmedAt: new Date().toISOString() };
      setPayruns(prev => prev.map(p => p.id === confirmed.id ? confirmed : p));
      setActivePayrun(confirmed);
      setStep(4);
    } catch (e) {
      alert('Error confirming payrun: ' + e.message);
    }
  }, [activePayrun, getPayrunEmployees]);

  const completePayrun = useCallback(async () => {
    if (!activePayrun) return;
    try {
      await updatePayrunStatus(activePayrun.id, 'completed');
      const completed = { ...activePayrun, status: 'completed' };
      setPayruns(prev => prev.map(p => p.id === completed.id ? completed : p));
      setActivePayrun(null);
      alert('Payrun successfully completed!');
      setStep(0);
    } catch (e) {
      alert('Error completing payrun: ' + e.message);
    }
  }, [activePayrun]);

  const unlockPayrun = useCallback(async (payrunId) => {
    const reason = prompt("Enter a reason to unlock this payrun for correction (this will be logged for auditing):");
    if (!reason || reason.trim() === "") return;
    try {
      await updatePayrunStatus(payrunId, 'reviewed');
      await addPayrunAuditLog(payrunId, {
        action: 'unlock',
        reason: reason,
        user: 'Finance Admin'
      });
      const pUpdate = { ...payruns.find(p => p.id === payrunId), status: 'reviewed' };
      setPayruns(prev => prev.map(p => p.id === payrunId ? pUpdate : p));
      openPayrun(pUpdate);
      alert('Payrun unlocked successfully for corrections!');
    } catch (e) {
      alert("Failed to unlock payrun: " + e.message);
    }
  }, [payruns, openPayrun]);

  if (loading) {
    return <div style={{ padding: 100, textAlign: 'center', color: '#6366f1', fontWeight: 700 }}>⚡ Loading Payroll Systems...</div>;
  }

  const payrunEmployees = getPayrunEmployees();
  const store = { employees, payruns }; 

  const sharedProps = {
    store, activePayrun, payrunEmployees,
    updateAdjustment, updateTaxOverride, toggleSlip, publishAll,
    companySettings,
    onNext: () => setStep(s => Math.min(4, s + 1)),
    onBack: () => setStep(s => Math.max(0, s - 1)),
  };

  return (
    <div className="module-ops-root">
      <div className="module-header" style={{ borderBottom: '4px solid #8b5cf6' }}>
        <h2 className="tab-heading">▶️ Payroll Operations</h2>
        <p className="tab-subheading">
          End-to-end pay run management — now powered by Supabase.
          {activePayrun && <span className="ops-payrun-badge"> Active: {activePayrun.monthLabel}</span>}
        </p>
      </div>

      <div className="ops-step-tracker">
        {STEPS.map((s, i) => (
          <div key={s.id} className="ops-step-wrapper">
            <button
              onClick={() => activePayrun && step > 0 && setStep(s.id)}
              disabled={!activePayrun && s.id > 0}
              className={`ops-step-btn ${step === s.id ? 'ops-step-btn--active' : step > s.id ? 'ops-step-btn--done' : 'ops-step-btn--pending'}`}
            >
              <span className="ops-step-icon">{step > s.id ? '✓' : s.icon}</span>
              <span className="ops-step-label">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`ops-step-connector ${step > i ? 'ops-step-connector--done' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="ops-content">
        <div>
          {step === 0 && <PayrollOps_Initiate store={store} onInitiate={initiatePayrun} onOpenPayrun={openPayrun} onDeletePayrun={handleDeletePayrun} onUnlockPayrun={unlockPayrun} />}
          {step === 1 && activePayrun && payrunEmployees.length > 0 && <PayrollOps_Review {...sharedProps} />}
          {step === 2 && activePayrun && payrunEmployees.length > 0 && <PayrollOps_Tax {...sharedProps} />}
          {step === 3 && activePayrun && payrunEmployees.length > 0 && <PayrollOps_Confirm {...sharedProps} onConfirm={confirmPayrun} />}
          {step === 4 && activePayrun && payrunEmployees.length > 0 && <PayrollOps_SlipViewer {...sharedProps} onComplete={completePayrun} />}
        </div>
      </div>
    </div>
  );
}
