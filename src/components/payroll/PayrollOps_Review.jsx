import { useState } from 'react';

const fmt = v => Math.round(v || 0).toLocaleString('en-IN');

const TYPE_COLORS = {
  earnings_basic: { bg: '#dbeafe', color: '#1d4ed8' },
  earnings_hra: { bg: '#e0e7ff', color: '#4338ca' },
  earnings_allowance: { bg: '#d1fae5', color: '#047857' },
  variable: { bg: '#fef3c7', color: '#b45309' },
  reimbursement: { bg: '#f0fdf4', color: '#15803d' },
  employer_contrib: { bg: '#f1f5f9', color: '#334155' },
  employee_deduction: { bg: '#fee2e2', color: '#b91c1c' },
};

const MONTHS_MAP = { 'January': 31, 'February (Regular)': 28, 'February (Leap)': 29, 'March': 31, 'April': 30, 'May': 31, 'June': 30, 'July': 31, 'August': 31, 'September': 30, 'October': 31, 'November': 30, 'December': 31 };
const shouldShowArrearBreakup = (settings, section) => {
  if (settings?.arrearDisplayMode !== 'breakup') return false;
  const visibleIn = settings?.arrearBreakupVisibility;
  if (!Array.isArray(visibleIn) || visibleIn.length === 0) return true;
  return visibleIn.includes(section);
};

function EmpDetailPane({ emp, activePayrun, updateAdjustment, companySettings, onClose }) {
  const { computed: c, id } = emp;
  const adj = activePayrun.adjustments[id] || {};

  const updateAdj = (field, value) => updateAdjustment(id, field, value);
  const variableComps = emp.salaryComponents.filter(c => c.type === 'variable');

  const updateVariablePayout = (compId, val) => {
    const vp = { ...(adj.variablePayouts || {}), [compId]: Number(val) || 0 };
    updateAdj('variablePayouts', vp);
  };

  const addArrear = () => {
    const entries = [...(adj.arrearEntries || emp.arrearEntries || []), { id: Date.now().toString(), monthName: 'March', monthDays: 31, historicalGross: (emp.historicalSalary?.['March 2025'] || 0), arrearDays: 0 }];
    updateAdj('arrearEntries', entries);
  };
  const removeArrear = (arrId) => updateAdj('arrearEntries', (adj.arrearEntries || []).filter(a => a.id !== arrId));
  const updateArrear = (arrId, field, val) => {
    const entries = (adj.arrearEntries || emp.arrearEntries || []).map(a => {
      if (a.id !== arrId) return a;
      const updated = { ...a, [field]: field === 'monthName' ? val : Number(val) };
      if (field === 'monthName') updated.monthDays = MONTHS_MAP[val] || 30;
      
      // Clamp arrear days by month-days and paid-days
      const paidDays = Math.max(0, (adj.daysInMonth ?? emp.daysInMonth ?? 30) - (adj.lopDays ?? emp.lopDays ?? 0));
      const maxDays = Math.max(0, Math.min(updated.monthDays || 30, paidDays));
      if (updated.arrearDays > maxDays) updated.arrearDays = maxDays;
      
      return updated;
    });
    updateAdj('arrearEntries', entries);
  };
  const currArrears = adj.arrearEntries ?? emp.arrearEntries ?? [];

  const TypeBadge = ({ type }) => {
    const colors = TYPE_COLORS[type] || { bg: '#f1f5f9', color: '#334155' };
    const labels = { earnings_basic: 'Basic', earnings_hra: 'HRA', earnings_allowance: 'Allowance', variable: 'Variable', reimbursement: 'Reimbursement', employer_contrib: 'ER Contrib', employee_deduction: 'EE Deduction' };
    return <span style={{ background: colors.bg, color: colors.color, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{labels[type] || type}</span>;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 20 }}>
      <div style={{ width: '72vw', maxWidth: 900, height: 'calc(100vh - 40px)', background: 'white', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg,#1e3a5f,#1e40af)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{emp.name}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{emp.designation} · {emp.empCode} · {emp.department}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Attendance Inputs */}
          <div className="sim-card" style={{ marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13 }}>📅 Attendance & Additional Pay</div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
              {[
                ['Days in Month', 'daysInMonth', emp.daysInMonth],
                ['LOP Days', 'lopDays', emp.lopDays],
                ['OT Hours', 'overtimeHours', emp.overtimeHours],
                ['OT Rate (₹)', 'otRate', emp.otRate],
                ['Leave Encashment Days', 'leaveEncashmentDays', emp.leaveEncashmentDays],
              ].map(([label, field, fallback]) => (
                <div key={field}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <input type="number" value={adj[field] ?? fallback}
                    onChange={e => updateAdj(field, Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Salary Component Table */}
          <div className="sim-card" style={{ marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13 }}>💰 Salary Components</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {['Component', 'Type', 'Monthly Amount', 'Prorated Amount', 'Variable Payout', 'Final'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.components.map(comp => {
                    const resolved = comp._resolved || 0;
                    const af = c.attendanceFactor;
                    const prorated = comp.type === 'variable' ? (comp.currentPayout || 0) : (
                      ['earnings_basic','earnings_hra','earnings_allowance'].includes(comp.type) ? resolved * af : resolved
                    );
                    const isVar = comp.type === 'variable';
                    const currentPayoutVal = adj.variablePayouts?.[comp.id] ?? comp.currentPayout ?? 0;
                    const isDeduction = comp.type === 'employee_deduction';
                    return (
                      <tr key={comp.id} style={{ background: isDeduction ? '#fff5f5' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{comp.name}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}><TypeBadge type={comp.type} /></td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace' }}>₹{fmt(resolved)}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', color: '#475569' }}>
                          {['earnings_basic','earnings_hra','earnings_allowance'].includes(comp.type) ? `₹${fmt(prorated)}` : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                          {isVar ? (
                            <input type="number" value={currentPayoutVal}
                              onChange={e => updateVariablePayout(comp.id, e.target.value)}
                              style={{ width: 100, padding: '5px 8px', border: '1px solid #fbbf24', borderRadius: 5, fontSize: 12, background: '#fffbeb', outline: 'none' }} />
                          ) : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontFamily: 'monospace', color: isDeduction ? '#dc2626' : '#047857' }}>
                          {isDeduction ? `−₹${fmt(prorated)}` : `₹${fmt(isVar ? currentPayoutVal : prorated)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Arrears */}
          <div className="sim-card" style={{ marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>⏮ Arrears</span>
              <button onClick={addArrear} style={{ padding: '4px 12px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add Month</button>
            </div>
            <div style={{ padding: 16 }}>
              {currArrears.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, fontStyle: 'italic' }}>No arrears for this month.</p>
              ) : currArrears.map(a => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
                  {[
                    { label: 'Historical Month', field: 'monthName', type: 'select' },
                    { label: 'Days in Month', field: 'monthDays', type: 'number' },
                    { label: 'Historical Gross (₹)', field: 'historicalGross', type: 'number' },
                    { label: 'Arrear Days', field: 'arrearDays', type: 'number' },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                      {type === 'select' ? (
                        <select value={a[field]} onChange={e => updateArrear(a.id, field, e.target.value)}
                          style={{ width: '100%', padding: '7px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, outline: 'none' }}>
                          {Object.keys(MONTHS_MAP).map(m => <option key={m}>{m}</option>)}
                        </select>
                      ) : (
                        <input type="number" value={a[field]}
                          onChange={e => updateArrear(a.id, field, e.target.value)}
                          style={{ width: '100%', padding: '7px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, outline: 'none' }} />
                      )}
                    </div>
                  ))}
                  <button onClick={() => removeArrear(a.id)} style={{ padding: '8px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Computed Summary */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, color: 'white' }}>
            <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Live Computation Result</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                ['Fixed Gross', fmt(c.fixedGross)],
                ['Variable Pay', fmt(c.variablePay)],
                ['Total Gross', fmt(c.grossSalary)],
                ['Net Pay', fmt(c.netPay)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>₹{value}</div>
                </div>
              ))}
            </div>

            {c.arrearsValidation?.length > 0 && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px solid rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.12)' }}>
                <div style={{ fontSize: 11, color: '#fde68a', fontWeight: 700, marginBottom: 6 }}>Arrear days were auto-clamped for payroll compliance</div>
                <div style={{ fontSize: 11, color: '#fef3c7', lineHeight: 1.5 }}>
                  {c.arrearsValidation.map(v => `${v.monthName || 'Selected Month'}: ${v.requestedDays} requested, ${v.acceptedDays} accepted`).join(' | ')}
                </div>
              </div>
            )}
            {shouldShowArrearBreakup(companySettings, 'review') && c.arrearsPay > 0 && c.arrearsBreakup && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Arrears Component Breakup</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {c.arrearsBreakup.map((bk, i) => (
                    <div key={i} style={{ background: 'rgba(139,92,246,0.1)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(139,92,246,0.2)' }}>
                      <div style={{ fontSize: 10, color: '#d8b4fe', marginBottom: 2 }}>{bk.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>₹{fmt(bk.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayrollOps_Review({ payrunEmployees, activePayrun, updateAdjustment, companySettings, onNext, onBack }) {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const fmt = v => Math.round(v || 0).toLocaleString('en-IN');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="sim-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>👀 Step 2: Salary Review & Adjustments</h3>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Click an employee row to open the adjustment panel.</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Emp Code', 'Employee', 'Department', 'Paid Days', 'Fixed Gross', 'Variable Pay', 'Arrears', 'Total Gross', 'Deductions', 'Net Pay'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Employee' || h === 'Department' ? 'left' : 'right', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrunEmployees.map(e => {
                const c = e.computed;
                return (
                  <tr key={e.id} onClick={() => setSelectedEmp(e)}
                    style={{ cursor: 'pointer', background: selectedEmp?.id === e.id ? '#f0f9ff' : 'transparent' }}
                    className="ops-emp-row">
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{e.empCode}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{e.department}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{Math.round(c.attendedDays || 0)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(c.fixedGross)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', color: c.variablePay > 0 ? '#b45309' : '#94a3b8' }}>₹{fmt(c.variablePay)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', color: c.arrearsPay > 0 ? '#7c3aed' : '#94a3b8' }}>₹{fmt(c.arrearsPay)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>₹{fmt(c.grossSalary)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>−₹{fmt(c.totalDeductions)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#047857' }}>₹{fmt(c.netPay)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1e293b', color: 'white' }}>
                {['','Total','','',
                  `₹${fmt(payrunEmployees.reduce((s, e) => s + (e.computed.fixedGross || 0), 0))}`,
                  `₹${fmt(payrunEmployees.reduce((s, e) => s + (e.computed.variablePay || 0), 0))}`,
                  `₹${fmt(payrunEmployees.reduce((s, e) => s + (e.computed.arrearsPay || 0), 0))}`,
                  `₹${fmt(payrunEmployees.reduce((s, e) => s + (e.computed.grossSalary || 0), 0))}`,
                  `₹${fmt(payrunEmployees.reduce((s, e) => s + (e.computed.totalDeductions || 0), 0))}`,
                  `₹${fmt(payrunEmployees.reduce((s, e) => s + (e.computed.netPay || 0), 0))}`,
                ].map((v, i) => (
                  <td key={i} style={{ padding: '10px 14px', fontWeight: 700, textAlign: i > 1 ? 'right' : i === 1 ? 'left' : 'left', fontFamily: i > 3 ? 'monospace' : 'inherit' }}>{v}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>← Back</button>
          <button onClick={onNext} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Proceed to Tax Review →</button>
        </div>
      </div>

      {selectedEmp && (
        <EmpDetailPane emp={selectedEmp} activePayrun={activePayrun} updateAdjustment={updateAdjustment} companySettings={companySettings} onClose={() => setSelectedEmp(null)} />
      )}
    </div>
  );
}
