import { useState } from 'react';
import { isMetroCity } from '../../data/payrollEngine';

const fmt = v => Math.round(v || 0).toLocaleString('en-IN');
const shouldShowArrearBreakup = (settings, section) => {
  if (settings?.arrearDisplayMode !== 'breakup') return false;
  const visibleIn = settings?.arrearBreakupVisibility;
  if (!Array.isArray(visibleIn) || visibleIn.length === 0) return true;
  return visibleIn.includes(section);
};

const Field = ({ label, children, hint }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
      {label}
      {hint && <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>{hint}</span>}
    </div>
    {children}
  </div>
);

function TaxCard({ emp, activePayrun, updateTaxOverride, companySettings }) {
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
                  <Field label="Rem. Months in FY">
                    <input type="number" min="1" max="12" value={field('monthsRemaining')} onChange={e => update('monthsRemaining', Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Computation Trace */}
          <div style={{ padding: 20 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 14, letterSpacing: 0.4 }}>🔬 Tax Computation Trace</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {/* Annualization */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>① Annualization of Gross</div>
                <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
                  {c.pastMonths > 0 && <span>Past Salary (YTD): ₹{fmt(c.ytdGross !== undefined ? c.ytdGross : c.standardGross * c.pastMonths)} ({c.pastMonths} months)<br/></span>}
                  Current Month Actual: ₹{fmt(c.grossSalary)}<br/>
                  {c.futureMonths > 0 && <span>Future Projection: ₹{fmt(c.standardGross * c.futureMonths)} ({c.futureMonths} months)<br/></span>}
                  {shouldShowArrearBreakup(companySettings, 'tax') && c.arrearsPay > 0 && c.arrearsBreakup && (
                    <div style={{ margin: '4px 0', paddingLeft: 8, borderLeft: '2px solid #cbd5e1', fontSize: 11 }}>
                      Arrears Breakup (Total: ₹{fmt(c.arrearsPay)}):<br/>
                      {c.arrearsBreakup.map((bk, i) => (
                        <div key={i}>{bk.name}: ₹{fmt(bk.amount)}</div>
                      ))}
                    </div>
                  )}
                  <span style={{ color: '#1e40af', fontWeight: 700 }}>Projected Annual Gross = ₹{fmt(c.annualGross)}</span>
                </div>
              </div>

              {/* HRA Exemption Card - ONLY SHOWN IF APPLICABLE */}
              {field('taxRegime') === 'old' && c.calculatedHraExempt > 0 && (
                <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '12px 14px', fontSize: 12, border: '1px solid #bae6fd' }}>
                   <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span>🏘️ HRA Exemption Audit (Min of 3)</span>
                    <span style={{ background: '#0369a1', color: 'white', padding: '0 6px', borderRadius: 4 }}>Passed</span>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: 11 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: c.calculatedHraExempt === c.hraActual ? '#059669' : '#64748b' }}>
                        <span>1. Actual HRA Received</span>
                        <span>₹{fmt(c.hraActual)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: c.calculatedHraExempt === c.hraRentExcess ? '#059669' : '#64748b' }}>
                        <span>2. Rent - 10% Basic</span>
                        <span>₹{fmt(c.hraRentExcess)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: c.calculatedHraExempt === c.hraCityLimit ? '#059669' : '#64748b' }}>
                        <span>3. {isMetroCity(field('work_city', 'work_city')) ? '50%' : '40%'} of Basic</span>
                        <span>₹{fmt(c.hraCityLimit)}</span>
                      </div>
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #bae6fd', fontSize: 12, fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>
                        Exempt Amount = ₹{fmt(c.calculatedHraExempt)}
                      </div>
                   </div>
                </div>
              )}

              {/* Deductions / Taxable */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>② Taxable Income</div>
                <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
                  {field('taxRegime') === 'new' ? 'Standard Deduction: ₹75,000' : `Total Deductions Trace: ₹${fmt(c.annualGross - c.taxableIncome)}`}<br/>
                  <span style={{ color: '#7c3aed', fontWeight: 700 }}>Current Taxable Base = ₹{fmt(c.taxableIncome)}</span>
                </div>
              </div>
              {/* Slab computation */}
              <div style={{ background: '#fef3c7', borderRadius: 8, padding: '12px 14px', fontSize: 12, gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>③ Tax Slab &amp; Annual Tax</div>
                <div style={{ fontFamily: 'monospace', color: '#78350f', lineHeight: 1.7 }}>
                  {c.taxFormulaDetail}<br/>
                  <span style={{ fontWeight: 700 }}>Annual Tax = ₹{fmt(c.annualTax)}</span>
                </div>
              </div>
              {/* TDS Recovery */}
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', fontSize: 12, gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>④ Monthly TDS Recovery</div>
                <div style={{ fontFamily: 'monospace', color: '#7dd3fc', lineHeight: 1.7 }}>
                  (₹{fmt(c.annualTax)} − ₹{fmt(field('tdsDeductedSoFar'))}) ÷ {field('monthsRemaining')} months
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 6 }}>= ₹{fmt(c.tds)} / month</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PayrollOps_Tax({ payrunEmployees, activePayrun, updateTaxOverride, companySettings, onNext, onBack }) {
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
        <TaxCard key={emp.id} emp={emp} activePayrun={activePayrun} updateTaxOverride={updateTaxOverride} companySettings={companySettings} />
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={onBack} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>← Back</button>
        <button onClick={onNext} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Confirm &amp; Export →</button>
      </div>
    </div>
  );
}
