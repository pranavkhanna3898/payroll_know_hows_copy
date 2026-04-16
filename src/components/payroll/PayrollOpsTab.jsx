import { getEmployees, getPayruns, createPayrun, updatePayrunStatus, getPayrunAdjustments, savePayrunAdjustment, getEmployeeFYTaxHistory } from '../../data/api';
import { computeEmployeePayroll } from '../../data/payrollEngine';
import { getDaysInMonth, getMonthsRemainingInFY } from '../../utils/dateUtils';
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

  // ── Initial Load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [empData, payrunData] = await Promise.all([getEmployees(), getPayruns()]);
        setEmployees(empData || []);
        setPayruns(payrunData || []);
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

    // 2. If moving to Tax step (step 2), fetch historical TDS if not already set
    async function loadHistory() {
      if (step !== 2) return;
      
      const newTaxOverrides = { ...(activePayrun.taxOverrides || {}) };
      let changed = false;

      for (const empId of activePayrun.employeeIds) {
        const ov = newTaxOverrides[empId] || {};
        
        // Auto-set months remaining if not manually touched
        if (ov.monthsRemaining === undefined) {
          ov.monthsRemaining = monthsLeft;
          changed = true;
        }

        // Fetch history if TDS deducted is still 0/undefined and not manually overridden
        if (ov.tdsDeductedSoFar === undefined) {
          try {
            const history = await getEmployeeFYTaxHistory(empId, activePayrun.month_year);
            ov.tdsDeductedSoFar = history;
            changed = true;
          } catch (e) {
            console.error(`Failed to fetch tax history for ${empId}:`, e);
          }
        }
        
        newTaxOverrides[empId] = ov;
      }

      if (changed) {
        setActivePayrun(prev => ({ ...prev, taxOverrides: newTaxOverrides }));
      }
    }

    loadHistory();

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
          isMetro: taxOv.isMetro ?? e.is_metro ?? true,
          investments80C: taxOv.investments80C ?? 0,
          medical80D: taxOv.medical80D ?? 0,
          nps80CCD1B: taxOv.nps80CCD1B ?? 0,
          homeLoanInterest: taxOv.homeLoanInterest ?? 0,
          deductions80GE: taxOv.deductions80GE ?? 0,
          savingsInterest80TTA: taxOv.savingsInterest80TTA ?? 0,
          ltaClaimed: taxOv.ltaClaimed ?? 0,
          monthlyRentPaid: taxOv.monthlyRentPaid ?? 0,
          tdsDeductedSoFar: taxOv.tdsDeductedSoFar ?? 0,
          monthsRemaining: taxOv.monthsRemaining ?? 12,
          inputMode: e.input_mode || 'monthly',
        };

        // Inject variable payouts into components
        engineEmp.salaryComponents = (engineEmp.salaryComponents || []).map(c => {
          if (c.type === 'variable' && adj.variablePayouts?.[c.id] !== undefined) {
            return { ...c, currentPayout: adj.variablePayouts[c.id] };
          }
          return c;
        });

        return { ...engineEmp, computed: computeEmployeePayroll(engineEmp) };
      });
  }, [activePayrun, employees]);

  // ── Operations ────────────────────────────────────────────────────────────────
  const initiatePayrun = useCallback(async (month, year, selectedEmpIds) => {
    const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }) + ' ' + year;
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
  }, []);

  const confirmPayrun = useCallback(async () => {
    if (!activePayrun) return;
    try {
      await updatePayrunStatus(activePayrun.id, 'confirmed');
      const confirmed = { ...activePayrun, status: 'confirmed', confirmedAt: new Date().toISOString() };
      setPayruns(prev => prev.map(p => p.id === confirmed.id ? confirmed : p));
      setActivePayrun(confirmed);
      setStep(4);
    } catch (e) {
      alert('Error confirming payrun: ' + e.message);
    }
  }, [activePayrun]);

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

  if (loading) {
    return <div style={{ padding: 100, textAlign: 'center', color: '#6366f1', fontWeight: 700 }}>⚡ Loading Payroll Systems...</div>;
  }

  const payrunEmployees = getPayrunEmployees();
  const store = { employees, payruns }; 

  const sharedProps = {
    store, activePayrun, payrunEmployees,
    updateAdjustment, updateTaxOverride, toggleSlip, publishAll,
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
        {step === 0 && <PayrollOps_Initiate {...sharedProps} onOpenPayrun={openPayrun} onInitiate={initiatePayrun} />}
        {step === 1 && <PayrollOps_Review {...sharedProps} />}
        {step === 2 && <PayrollOps_Tax {...sharedProps} />}
        {step === 3 && <PayrollOps_Confirm {...sharedProps} onConfirm={confirmPayrun} />}
        {step === 4 && <PayrollOps_SlipViewer {...sharedProps} />}
      </div>
    </div>
  );
}
