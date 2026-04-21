import { useState } from 'react';
import * as XLSX from 'xlsx';

const fmt = v => Math.round(v || 0).toLocaleString('en-IN');

function SalarySlip({ emp, monthLabel, companySettings }) {
  const c = emp.computed;
  const today = new Date();
  const earningComps = emp.salaryComponents.filter(ct => ['earnings_basic','earnings_hra','earnings_allowance','variable'].includes(ct.type));
  const deductionComps = emp.salaryComponents.filter(ct => ct.type === 'employee_deduction');

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      maxWidth: 760, margin: '0 auto', background: 'white',
      border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', color: 'white', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>ACME TECHNOLOGIES PVT. LTD.</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>12, Electronic City Phase 1, Bengaluru, Karnataka 560100</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>PAN: AACCA1234A | EPFO: KA/BN/12345</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 20 }}>SALARY SLIP</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>For the month of {monthLabel}</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Generated: {today.toLocaleDateString('en-IN')}</div>
        </div>
      </div>

      {/* Employee Details */}
      <div style={{ padding: '16px 28px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            ['Employee Name', emp.name],
            ['Emp Code', emp.empCode],
            ['Designation', emp.designation],
            ['Department', emp.department],
            ['Date of Joining', emp.dateOfJoining],
            ['PAN', emp.pan],
            ['Bank Account', emp.accNumber],
            ['Tax Regime', emp.taxRegime === 'new' ? 'New Regime' : 'Old Regime'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{v || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Row */}
      <div style={{ padding: '12px 28px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', display: 'flex', gap: 32 }}>
        {[
          ['Days in Month', emp.daysInMonth || 30],
          ['Days Paid', Math.max(0, (emp.daysInMonth || 30) - (emp.lopDays || 0))],
          ['LOP Days', emp.lopDays || 0],
          ['OT Hours', emp.overtimeHours || 0],
        ].map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Earnings & Deductions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Earnings */}
        <div style={{ borderRight: '1px solid #e2e8f0' }}>
          <div style={{ padding: '10px 20px', background: '#d1fae5', fontWeight: 700, fontSize: 12, color: '#047857', textTransform: 'uppercase' }}>Earnings</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f0fdf4' }}>
                <th style={{ padding: '6px 20px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11 }}>Component</th>
                <th style={{ padding: '6px 20px', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: 11 }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {c.components.filter(cp => ['earnings_basic','earnings_hra','earnings_allowance','reimbursement'].includes(cp.type)).map(cp => {
                const isReim = cp.type === 'reimbursement';
                const amt = cp._resolved || 0;
                if (amt === 0 && cp.type !== 'earnings_basic') return null;
                return (
                  <tr key={cp.id}>
                    <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', color: isReim ? '#059669' : '#334155' }}>
                      {cp.name} {isReim ? '(Reim)' : ''}
                    </td>
                    <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(amt)}</td>
                  </tr>
                );
              })}
              {c.variablePay > 0 && <tr>
                <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', color: '#b45309' }}>Variable / Incentive Pay</td>
                <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', color: '#b45309' }}>₹{fmt(c.variablePay)}</td>
              </tr>}
              {c.overtimePay > 0 && <tr>
              {c.overtimePay > 0 && <tr>
                <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', color: '#0891b2' }}>Overtime Pay</td>
                <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(c.overtimePay)}</td>
              </tr>}

              {companySettings?.arrearDisplayMode === 'breakup' && c.arrearsBreakup && c.arrearsBreakup.length > 0 ? (
                c.arrearsBreakup.map((bk, i) => (
                  <tr key={`arr_${i}`}>
                    <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', color: '#7c3aed' }}>{bk.name}</td>
                    <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(bk.amount)}</td>
                  </tr>
                ))
              ) : (
                c.arrearsPay > 0 && <tr>
                  <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', color: '#7c3aed' }}>Arrears</td>
                  <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(c.arrearsPay)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#dcfce7' }}>
                <td style={{ padding: '10px 20px', fontWeight: 700, color: '#047857' }}>Gross Salary</td>
                <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#047857', fontSize: 14 }}>₹{fmt(c.grossSalary)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions */}
        <div>
          <div style={{ padding: '10px 20px', background: '#fee2e2', fontWeight: 700, fontSize: 12, color: '#b91c1c', textTransform: 'uppercase' }}>Deductions</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff5f5' }}>
                <th style={{ padding: '6px 20px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11 }}>Component</th>
                <th style={{ padding: '6px 20px', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: 11 }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {c.components.filter(cp => cp.type === 'employee_deduction').map(cp => {
                const amt = cp._resolved || 0;
                if (amt === 0) return null;
                return (
                  <tr key={cp.id}>
                    <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9' }}>{cp.name}</td>
                    <td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace' }}>₹{fmt(amt)}</td>
                  </tr>
                );
              })}
              {c.pt > 0 && <tr><td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9' }}>Professional Tax</td><td style={{ padding: '7px 20px', textAlign: 'right', fontFamily: 'monospace', borderBottom: '1px solid #f1f5f9' }}>₹{fmt(c.pt)}</td></tr>}
              {c.lwf > 0 && <tr><td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9' }}>LWF</td><td style={{ padding: '7px 20px', textAlign: 'right', fontFamily: 'monospace', borderBottom: '1px solid #f1f5f9' }}>₹{fmt(c.lwf)}</td></tr>}
              {c.tds > 0 && <tr><td style={{ padding: '7px 20px', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>TDS (Income Tax)</td><td style={{ padding: '7px 20px', textAlign: 'right', fontFamily: 'monospace', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>₹{fmt(c.tds)}</td></tr>}
            </tbody>
            <tfoot>
              <tr style={{ background: '#fee2e2' }}>
                <td style={{ padding: '10px 20px', fontWeight: 700, color: '#b91c1c' }}>Total Deductions</td>
                <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#b91c1c', fontSize: 14 }}>₹{fmt(c.totalDeductions)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Net Pay Banner */}
      <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white' }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>Net Pay (Take-Home)</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>₹{fmt(c.netPay)}</div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>
            ₹{fmt(c.grossSalary)} − ₹{fmt(c.totalDeductions)}
            {c.monthlyReimbursements > 0 ? ` + ₹${fmt(c.monthlyReimbursements)} (Reims)` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
          <div style={{ fontSize: 11, marginBottom: 4 }}>Employer's PF Contribution</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>₹{fmt(c.pfEmployer)}</div>
          <div style={{ fontSize: 11, marginTop: 8 }}>ESIC — Employer</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>₹{fmt(c.esiEmployer)}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        This is a computer-generated payslip — no signature required. | Generated on {today.toLocaleDateString('en-IN')}
      </div>
    </div>
  );
}

export default function PayrollOps_SlipViewer({ payrunEmployees, activePayrun, toggleSlip, publishAll, companySettings, onBack, onComplete }) {
  const [selectedEmp, setSelectedEmp] = useState(payrunEmployees[0] || null);
  const monthLabel = activePayrun?.monthLabel || 'Current Month';
  const publishedSlips = activePayrun?.publishedSlips || [];

  const handleDownloadAll = () => {
    const wb = XLSX.utils.book_new();
    payrunEmployees.forEach(emp => {
      const c = emp.computed;
      const rows = [
        { Component: 'Basic Salary', Type: 'Earning', Amount: Math.round(c.basic) },
        { Component: 'HRA', Type: 'Earning', Amount: Math.round(c.hra) },
        { Component: 'Special Allowance', Type: 'Earning', Amount: Math.round(c.special) },
        { Component: 'Variable Pay', Type: 'Earning', Amount: Math.round(c.variablePay) },
        { Component: 'Overtime', Type: 'Earning', Amount: Math.round(c.overtimePay) },
        { Component: 'Arrears', Type: 'Earning', Amount: Math.round(c.arrearsPay) },
        { Component: '--- Gross ---', Type: '', Amount: Math.round(c.grossSalary) },
        { Component: 'EPF EE', Type: 'Deduction', Amount: -Math.round(c.pfEmployee) },
        { Component: 'ESIC EE', Type: 'Deduction', Amount: -Math.round(c.esiEmployee) },
        { Component: 'Professional Tax', Type: 'Deduction', Amount: -Math.round(c.pt) },
        { Component: 'LWF', Type: 'Deduction', Amount: -Math.round(c.lwf) },
        { Component: 'TDS', Type: 'Deduction', Amount: -Math.round(c.tds) },
        { Component: '--- Net Pay ---', Type: '', Amount: Math.round(c.netPay) },
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      const sheetName = emp.empCode.replace(/[/\\?*[\]]/g, '_').slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    XLSX.writeFile(wb, `Salary_Slips_${monthLabel?.replace(' ', '_')}.xlsx`);
  };

  const handlePrintCurrent = () => {
    const slipEl = document.getElementById('salary-slip-print');
    if (!slipEl) return;
    const orig = document.body.innerHTML;
    document.body.innerHTML = slipEl.innerHTML;
    window.print();
    document.body.innerHTML = orig;
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Left — Employee List */}
        <div>
          <div className="sim-card" style={{ overflow: 'hidden', position: 'sticky', top: 20 }}>
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>🧾 Salary Slips</h4>
              <span style={{ fontSize: 11, color: '#64748b' }}>{publishedSlips.length}/{payrunEmployees.length} Published</span>
            </div>

            <div style={{ padding: 10 }}>
              <button onClick={() => publishAll(payrunEmployees.map(e => e.id))}
                style={{ width: '100%', padding: '8px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12, marginBottom: 10 }}>
                📢 Publish All ({payrunEmployees.length})
              </button>
              <button onClick={handleDownloadAll}
                style={{ width: '100%', padding: '8px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12, marginBottom: 10 }}>
                ⬇ Download All (Excel)
              </button>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0' }}>
              {payrunEmployees.map(e => {
                const published = publishedSlips.includes(e.id);
                return (
                  <div key={e.id}
                    onClick={() => setSelectedEmp(e)}
                    style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedEmp?.id === e.id ? '#f0f9ff' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{e.empCode} · ₹{Math.round(e.computed.netPay).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: published ? '#d1fae5' : '#f1f5f9', color: published ? '#065f46' : '#64748b' }}>
                        {published ? '✓ Published' : 'Draft'}
                      </span>
                      <button
                        onClick={ev => { ev.stopPropagation(); toggleSlip(e.id); }}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: published ? '#fee2e2' : '#dbeafe', color: published ? '#b91c1c' : '#1d4ed8', fontWeight: 600 }}>
                        {published ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Slip Preview */}
        <div>
          {selectedEmp ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
                <button onClick={() => toggleSlip(selectedEmp.id)}
                  style={{ padding: '8px 16px', background: publishedSlips.includes(selectedEmp.id) ? '#fee2e2' : '#d1fae5', color: publishedSlips.includes(selectedEmp.id) ? '#b91c1c' : '#065f46', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {publishedSlips.includes(selectedEmp.id) ? '📁 Unpublish Slip' : '📢 Publish Slip'}
                </button>
                <button onClick={handlePrintCurrent}
                  style={{ padding: '8px 16px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  🖨 Print / Save PDF
                </button>
              </div>
              <div id="salary-slip-print">
                <SalarySlip emp={selectedEmp} monthLabel={monthLabel} companySettings={companySettings} />
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Select an employee to preview their salary slip.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>← Back to Exports</button>
        <button onClick={onComplete} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Complete Payroll ✔</button>
      </div>
    </div>
  );
}
