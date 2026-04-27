import { useState } from 'react';
import { isMetroCity } from '../../data/payrollEngine';

const fmt = v => Math.round(v || 0).toLocaleString('en-IN');
const shouldShowArrearBreakup = (settings, section) => {
  if (settings?.arrearDisplayMode !== 'breakup') return false;
  const visibleIn = settings?.arrearBreakupVisibility;
  if (!Array.isArray(visibleIn) || visibleIn.length === 0) return true;
  return visibleIn.includes(section);
};

// ── NEW: Detailed Tax Report Modal ───────────────────────────────────────────
function TaxReportModal({ emp, onClose }) {
  if (!emp) return null;
  const c = emp.computed;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 850, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideIn 0.3s ease-out' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>📄 Tax Computation Report</h3>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{emp.name} ({emp.empCode}) • {emp.taxRegime === 'old' ? 'Old Regime' : 'New Regime'}</div>
          </div>
          <button onClick={onClose} style={{ background: '#e2e8f0', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ background: '#f1f5f9', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>1. Salary & Earnings</div>
            <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 13 }}>
              <div><div style={{ color: '#64748b', marginBottom: 4 }}>YTD Gross</div><div style={{ fontWeight: 600 }}>₹{fmt(c.ytdGross !== undefined ? c.ytdGross : c.standardGross * c.pastMonths)}</div></div>
              <div><div style={{ color: '#64748b', marginBottom: 4 }}>Current Gross</div><div style={{ fontWeight: 600 }}>₹{fmt(c.grossSalary)}</div></div>
              <div><div style={{ color: '#64748b', marginBottom: 4 }}>Projected Annual Gross (A)</div><div style={{ fontWeight: 700, color: '#0369a1', fontSize: 14 }}>₹{fmt(c.annualGross)}</div></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, flexShrink: 0 }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: '#f1f5f9', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>2. Exemptions (B)</div>
              <div style={{ padding: '12px 16px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Standard Deduction <i>[Sec 16(ia)]</i>:</span> <strong>₹{fmt(emp.taxRegime === 'new' ? 75000 : 50000)}</strong></div>
                {emp.taxRegime === 'old' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>HRA Exemption:</span> <strong>₹{fmt(c.calculatedHraExempt)}</strong></div>
                    {c.calculatedHraExempt > 0 && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', paddingLeft: 8, borderLeft: '2px solid #cbd5e1' }}>Formula: Min(Actual: ₹{fmt(c.hraActual)}, Rent-10%Basic: ₹{fmt(c.hraRentExcess)}, {isMetroCity(emp.computed.rent_city || emp.work_city) ? '50%' : '40%'}Basic: ₹{fmt(c.hraCityLimit)})</div>}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: '#f1f5f9', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>3. Deductions (C)</div>
              <div style={{ padding: '12px 16px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                 {emp.taxRegime === 'old' ? (
                   <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>80C Investments:</span> <strong>₹{fmt(emp.investments80C)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>80D Medical:</span> <strong>₹{fmt((emp.medical80D_self||0) + (emp.medical80D_parents||0))}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Sec 24(b) Home Loan:</span> <strong>₹{fmt(emp.homeLoanInterest)}</strong></div>
                    {emp.nps80CCD1B > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>80CCD(1B) NPS:</span> <strong>₹{fmt(emp.nps80CCD1B)}</strong></div>}
                    {emp.deductions80GE > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>80G/E Donations/Edu:</span> <strong>₹{fmt(emp.deductions80GE)}</strong></div>}
                    {emp.savingsInterest80TTA > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>80TTA/TTB Interest:</span> <strong>₹{fmt(emp.savingsInterest80TTA)}</strong></div>}
                    <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>Limits: 80C=1.5L, 80D=25k(50k Sr), 24b=2L, NPS=50k</div>
                   </>
                 ) : (
                   <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not applicable in New Regime.</span>
                 )}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>4. Tax Calculation Loop</span>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>Formula: (A - B - C) = Taxable Income</div>
              </div>
              <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: 15 }}>Taxable Income: ₹{fmt(c.taxableIncome)}</span>
            </div>
            <div style={{ padding: '16px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Base Tax (Progressive Slabs):</span> <strong>{c.taxFormulaDetail?.split(' = ')[0] || '₹0'}</strong></div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Rebate u/s 87A <i>(Income &lt;= {emp.taxRegime === 'new' ? '7L' : '5L'} ? -Base Tax : 0)</i>:</span> <strong style={{ color: '#059669' }}>{c.taxFormulaDetail?.includes('Rebate') ? '- Base Tax' : '₹0'}</strong></div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Surcharge <i>(Income &gt; 50L)</i>:</span> <strong>{c.taxFormulaDetail?.includes('Surcharge') ? 'Applied' : '₹0 (N/A)'}</strong></div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Health & Education CESS <i>((Base - Rebate + Surcharge) × 4%)</i>:</span> <strong>{c.annualTax > 0 ? '+ 4%' : '₹0'}</strong></div>
               <div style={{ borderTop: '1px dashed #cbd5e1', margin: '4px 0' }}></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}><span style={{ color: '#0f172a' }}>Annual Tax Liability:</span> <span style={{ color: '#dc2626' }}>₹{fmt(c.annualTax)}</span></div>
            </div>
          </div>

          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ background: '#e0f2fe', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 0.5 }}>5. TDS & Recovery Logic</div>
            <div style={{ padding: '16px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>YTD Tax Already Deducted:</span> <strong>₹{fmt(emp.tdsDeductedSoFar)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Remaining Deficit <i>(Annual Tax - YTD Tax)</i>:</span> <strong>₹{fmt(Math.max(0, c.annualTax - (emp.tdsDeductedSoFar || 0)))}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Remaining Months in FY:</span> <strong>{emp.monthsRemaining}</strong></div>
              {emp.oneTimeTaxDeduction > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>One-Time Variable Tax <i>(Deducted explicitly this month)</i>:</span> <strong>₹{fmt(emp.oneTimeTaxDeduction)}</strong></div>}
              <div style={{ borderTop: '1px dashed #bae6fd', margin: '4px 0' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 18, fontWeight: 800, color: '#0369a1' }}>
                    <span>Final Monthly TDS Target:</span>
                    <span>₹{fmt(c.tds)}</span>
                 </div>
                 <div style={{ fontSize: 11, color: '#0284c7', fontStyle: 'italic' }}>Formula: (Deficit ÷ Months) {emp.oneTimeTaxDeduction > 0 ? '+ One-Time Tax' : ''}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const Field = ({ label, children, hint }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
      {label}
      {hint && <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>{hint}</span>}
    </div>
    {children}
  </div>
);

function TaxCard({ emp, activePayrun, updateTaxOverride, companySettings, onViewReport }) {
  const [expanded, setExpanded] = useState(false);
  const { computed: c, id } = emp;
  const ov = activePayrun?.taxOverrides?.[id] || {};

  const field = (key, empKey) => ov[key] ?? emp[empKey ?? key];

  const update = (key, val) => updateTaxOverride(id, key, val);

  return (
    <div className="sim-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      {/* Collapsed row */}
      <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{emp.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{emp.empCode} · {emp.department}</div>
          </div>
          <span style={{ background: emp.taxRegime === 'new' ? '#d1fae5' : '#fef3c7', color: emp.taxRegime === 'new' ? '#065f46' : '#b45309', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
            {field('taxRegime') === 'new' ? 'New Regime' : 'Old Regime'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>YTD Tax</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>₹{fmt(field('tdsDeductedSoFar'))}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Projected Annual Tax</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>₹{fmt(c.annualTax)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Monthly TDS</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#7c3aed' }}>₹{fmt(c.tds)}</div>
          </div>
          <span style={{ fontSize: 18, color: '#94a3b8' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #e2e8f0' }}>
          {/* IT Declaration Inputs */}
          <div style={{ padding: 20, background: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 14, letterSpacing: 0.4 }}>📋 IT Declaration &amp; Deductions</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {/* Regime & Basic Status */}
              <div style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase' }}>Regime & City</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Field label="Tax Regime">
                    <select value={field('taxRegime')} onChange={e => update('taxRegime', e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
                      <option value="new">New Regime (FY26-27)</option>
                      <option value="old">Old Regime</option>
                    </select>
                  </Field>
                  <Field label="City Type (HRA)" hint="Auto-derived from Work City">
                    <input type="text" value={isMetroCity(field('work_city', 'work_city')) ? `Metro (50%) - ${field('work_city', 'work_city')}` : `Non-Metro (40%) - ${field('work_city', 'work_city')}`} disabled
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#f8fafc', color: '#64748b' }} />
                  </Field>
                </div>
              </div>

              {/* Chapter VI-A Deductions */}
              <div style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', marginBottom: 8, textTransform: 'uppercase' }}>Chapter VI-A (80C, 80D, NPS)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Field label="80C Investments (Max 1.5L)" hint="LIC, ELSS, PPF, etc.">
                    <input type="number" value={field('investments80C')} onChange={e => update('investments80C', Number(e.target.value))} disabled={field('taxRegime') !== 'old'}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                  <Field label="80D Medical (Self)">
                    <input type="number" value={field('medical80D_self')} onChange={e => update('medical80D_self', Number(e.target.value))} disabled={field('taxRegime') !== 'old'}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                  <Field label="80D Medical (Parents)">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input type="number" value={field('medical80D_parents')} onChange={e => update('medical80D_parents', Number(e.target.value))} disabled={field('taxRegime') !== 'old'}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer', opacity: field('taxRegime') !== 'old' ? 0.5 : 1 }}>
                        <input type="checkbox" checked={field('medical80D_parents_senior')} onChange={e => update('medical80D_parents_senior', e.target.checked)} disabled={field('taxRegime') !== 'old'} />
                        Parents are Senior Citizens
                      </label>
                    </div>
                  </Field>
                  <Field label="80CCD(1B) NPS (Max 50k)">
                    <input type="number" value={field('nps80CCD1B')} onChange={e => update('nps80CCD1B', Number(e.target.value))} disabled={field('taxRegime') !== 'old'}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                </div>
              </div>

              {/* Home Loan & Others */}
              <div style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 8, textTransform: 'uppercase' }}>Property & Others</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Field label="Home Loan Int. (Sec 24)">
                    <input type="number" value={field('homeLoanInterest')} onChange={e => update('homeLoanInterest', Number(e.target.value))} disabled={field('taxRegime') !== 'old'}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                  <Field label="Monthly Rent Paid">
                    <input type="number" value={field('monthlyRentPaid')} onChange={e => update('monthlyRentPaid', Number(e.target.value))} disabled={field('taxRegime') !== 'old'}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                  <Field label="Sec 80G / 80E" hint="Donations / Ed. Loan">
                    <input type="number" value={field('deductions80GE')} onChange={e => update('deductions80GE', Number(e.target.value))} disabled={field('taxRegime') !== 'old'}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                  <Field label="80TTA/TTB (Savings Int)" hint="Max 10k/50k">
                    <input type="number" value={field('savingsInterest80TTA')} onChange={e => update('savingsInterest80TTA', Number(e.target.value))} disabled={field('taxRegime') !== 'old'}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                </div>
              </div>

              {/* YTD Status */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>YTD Recovery Status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Field label="TDS Paid So Far (YTD)">
                    <input type="number" value={field('tdsDeductedSoFar')} onChange={e => update('tdsDeductedSoFar', Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Field label="Rem. Months in FY">
                      <input type="number" min="1" max="12" value={field('monthsRemaining')} onChange={e => update('monthsRemaining', Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                    </Field>
                    <Field label="One-Time Tax" hint="On Variable Bonus etc">
                      <input type="number" min="0" value={field('oneTimeTaxDeduction')} onChange={e => update('oneTimeTaxDeduction', Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fef2f2', borderColor: '#fca5a5' }} />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Report Action */}
          <div style={{ padding: '16px 20px', background: '#e0e7ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#3730a3', fontWeight: 600 }}>TDS deduction computed automatically based on the above declarations.</span>
            <button onClick={() => onViewReport(emp)} style={{ background: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, boxShadow: '0 2px 4px rgba(79,70,229,0.2)' }}>
              View Detailed Tax Report ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PayrollOps_Tax({ payrunEmployees, activePayrun, updateTaxOverride, companySettings, onNext, onBack }) {
  const [selectedReportEmp, setSelectedReportEmp] = useState(null);

  const totalTax = payrunEmployees.reduce((s, e) => s + (e.computed.annualTax || 0), 0);
  const totalTDS = payrunEmployees.reduce((s, e) => s + (e.computed.tds || 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Summary Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Employees', value: payrunEmployees.length, color: '#2563eb', unit: '' },
          { label: 'Aggregate Annual Tax', value: fmt(totalTax), color: '#dc2626', unit: '₹' },
          { label: 'Total TDS This Month', value: fmt(totalTDS), color: '#b45309', unit: '₹' },
        ].map(item => (
          <div key={item.label} className="sim-card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.unit}{item.value}</div>
          </div>
        ))}
      </div>

      {/* Per-employee Tax Cards */}
      {payrunEmployees.map(emp => (
        <TaxCard key={emp.id} emp={emp} activePayrun={activePayrun} updateTaxOverride={updateTaxOverride} companySettings={companySettings} onViewReport={setSelectedReportEmp} />
      ))}

      {selectedReportEmp && <TaxReportModal emp={selectedReportEmp} onClose={() => setSelectedReportEmp(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={onBack} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>← Back</button>
        <button onClick={onNext} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Confirm &amp; Export →</button>
      </div>
    </div>
  );
}
