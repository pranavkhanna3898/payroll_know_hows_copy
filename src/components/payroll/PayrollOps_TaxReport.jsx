import { useState } from 'react';

const fmt = v => Math.round(v || 0).toLocaleString('en-IN');

function ReportDetail({ emp }) {
  const c = emp.computed;

  // Earnings mapping
  const ytdBasic = c.ytdBasic !== undefined ? c.ytdBasic : c.standardBasic * c.pastMonths;
  const ytdHRA = c.ytdHRA !== undefined ? c.ytdHRA : c.standardHRA * c.pastMonths;
  const ytdGross = c.ytdGross !== undefined ? c.ytdGross : c.standardGross * c.pastMonths;
  const ytdOthers = ytdGross - ytdBasic - ytdHRA;

  const curBasic = c.basic || 0;
  const curHRA = c.hra || 0;
  const curGross = c.grossSalary || 0;
  const curOthers = curGross - curBasic - curHRA;

  const futBasic = c.standardBasic * c.futureMonths;
  const futHRA = c.standardHRA * c.futureMonths;
  const futGross = c.standardGross * c.futureMonths;
  const futOthers = futGross - futBasic - futHRA;

  const totalBasic = c.projectedAnnualBasic || 0;
  const totalHRA = c.projectedAnnualHRA || 0;
  const totalGross = c.annualGross || 0;
  const totalOthers = totalGross - totalBasic - totalHRA;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{emp.name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{emp.empCode} • {emp.designation} • {emp.taxRegime === 'old' ? 'Old Regime' : 'New Regime'} (FY {emp.payrollYear})</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tax Liability Base</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0369a1' }}>₹{fmt(c.taxableIncome)}</div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        
        {/* SECTION 1: Earnings */}
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, borderBottom: '2px solid #e2e8f0', paddingBottom: 6 }}>1. Earnings Breakdown</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 32 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderRadius: '6px 0 0 6px' }}>Component</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Actual Earning (YTD)</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Current Month Actual</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Projected Earning</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#475569', borderRadius: '0 6px 6px 0' }}>Total Earning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 500, color: '#334155' }}>Basic Salary</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(ytdBasic)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(curBasic)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(futBasic)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(totalBasic)}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 500, color: '#334155' }}>House Rent Allowance (HRA)</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(ytdHRA)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(curHRA)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(futHRA)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(totalHRA)}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 500, color: '#334155' }}>Special Allowances & Others</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(ytdOthers)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(curOthers)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(futOthers)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(totalOthers)}</td>
            </tr>
            <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
              <td style={{ padding: '10px 12px', color: '#0f172a' }}>Total Gross Salary</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>₹{fmt(ytdGross)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>₹{fmt(curGross)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>₹{fmt(futGross)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>₹{fmt(totalGross)}</td>
            </tr>
          </tbody>
        </table>

        {/* SECTION 2: Exemptions */}
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, borderBottom: '2px solid #e2e8f0', paddingBottom: 6 }}>2. Deductions & Exemptions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 8, fontSize: 13 }}>Standard Exemptions</div>
            {emp.taxRegime === 'new' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Standard Deduction</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹75,000</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Standard Deduction</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹50,000</span>
              </div>
            )}
            
            {emp.taxRegime === 'old' && c.calculatedHraExempt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Sec 10(13A) - HRA</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{fmt(c.calculatedHraExempt)}</span>
              </div>
            )}
          </div>
          
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 8, fontSize: 13 }}>Chapter VI-A Declarations</div>
            {emp.taxRegime === 'old' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>80C Investments</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{fmt(emp.investments80C)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>80D Medical (Self + Parents)</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{fmt((emp.medical80D_self || 0) + (emp.medical80D_parents || 0))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>24(b) Home Loan Int</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{fmt(emp.homeLoanInterest)}</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Not applicable in New Regime.</div>
            )}
          </div>
        </div>

        {/* SECTION 3: Tax Computation */}
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, borderBottom: '2px solid #e2e8f0', paddingBottom: 6 }}>3. Tax Liability Output</h4>
        <div style={{ background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: '#1e3a8a', fontWeight: 500 }}>Implied Annual Tax</div>
            <div style={{ fontSize: 18, color: '#1e3a8a', fontWeight: 800 }}>₹{fmt(c.annualTax)}</div>
          </div>
          
          <div style={{ background: 'white', borderRadius: 6, padding: 12, display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
             <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Formula Trace</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155' }}>{c.taxFormulaDetail || '₹0'}</div>
             </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: '#1e3a8a', fontWeight: 600 }}>Implied Monthly TDS</div>
              <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>Based on remaining {emp.monthsRemaining} months</div>
            </div>
            <div style={{ fontSize: 24, color: '#1d4ed8', fontWeight: 800 }}>₹{fmt(c.tds)}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PayrollOps_TaxReport({ payrunEmployees, onNext, onBack }) {
  const [activeId, setActiveId] = useState(payrunEmployees[0]?.id);
  const activeEmp = payrunEmployees.find(e => e.id === activeId) || payrunEmployees[0];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 220px)', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
      
      {/* Left List */}
      <div style={{ width: 280, borderRight: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#fff', fontWeight: 700, color: '#334155', fontSize: 14 }}>
          Employees ({payrunEmployees.length})
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {payrunEmployees.map(emp => {
            const isActive = emp.id === activeId;
            return (
              <div 
                key={emp.id}
                onClick={() => setActiveId(emp.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  background: isActive ? '#eff6ff' : 'transparent',
                  borderLeft: `3px solid ${isActive ? '#3b82f6' : 'transparent'}`
                }}
              >
                <div style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#1d4ed8' : '#334155' }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Net Pay: ₹{fmt(emp.computed.netPay)}</div>
              </div>
            );
          })}
        </div>
        
        {/* Actions */}
        <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
          <button onClick={onBack} style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Back</button>
          <button onClick={onNext} style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Next</button>
        </div>
      </div>

      {/* Right Detail */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto', background: '#f1f5f9' }}>
        {activeEmp ? (
          <ReportDetail emp={activeEmp} />
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 100 }}>Select an employee to view report.</div>
        )}
      </div>

    </div>
  );
}
