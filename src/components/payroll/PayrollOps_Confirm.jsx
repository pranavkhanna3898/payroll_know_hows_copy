import { useState } from 'react';
import * as XLSX from 'xlsx';

const fmt = v => Math.round(v || 0).toLocaleString('en-IN');
const fmtN = v => Math.round(v || 0);

// ── File generation helpers ───────────────────────────────────────────────────

function generateBankCSV(employees, payrun, format) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const month = payrun?.monthLabel || 'SALARY';

  const rows = employees.map(e => {
    const net = fmtN(e.computed.netPay);
    switch (format) {
      case 'HDFC':      return `${e.bankName},${e.accNumber},${net},${e.name},${today},${month},${e.ifsc}`;
      case 'ICICI':     return `${e.accNumber}|${e.ifsc}|${net}|${e.name}|${month}|NEFT`;
      case 'SBI':       return `"${e.name}","${e.accNumber}","${e.ifsc}","${net}","${month}"`;
      case 'Axis':      return `${e.accNumber},${net},${e.name},${e.ifsc},${month}`;
      default:          return `${e.empCode},${e.name},${e.accNumber},${e.ifsc},${net},${month}`;
    }
  });

  const header = {
    HDFC:    'BANK,ACCOUNT,AMOUNT,BENEFICIARY,DATE,NARRATION,IFSC',
    ICICI:   'ACCOUNT|IFSC|AMOUNT|NAME|NARRATION|MODE',
    SBI:     '"NAME","ACCOUNT","IFSC","AMOUNT","NARRATION"',
    Axis:    'ACCOUNT,AMOUNT,NAME,IFSC,NARRATION',
    default: 'EMP_CODE,NAME,ACCOUNT,IFSC,AMOUNT,NARRATION',
  };

  return [(header[format] || header.default), ...rows].join('\n');
}

function generateEPFECR(employees) {
  const lines = employees
    .filter(e => e.computed.pfEmployee > 0)
    .map(e => {
      const c = e.computed;
      return `${e.uan}#~#${fmtN(c.grossSalary)}#~#${fmtN(c.pfEmployee)}#~#${fmtN(c.pfEps)}#~#${fmtN(c.pfErShare)}`;
    });
  return ['# EPF ECR v2 Format: UAN #~# Gross #~# EE(12%) #~# EPS(8.33%) #~# EPF-ER(3.67%)', ...lines].join('\n');
}

function generateESICReturn(employees, payrun) {
  const daysLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const lines = employees
    .filter(e => e.computed.esiEmployee > 0)
    .map(e => {
      const c = e.computed;
      const days = Math.max(0, (e.daysInMonth || 30) - (e.lopDays || 0));
      return `${e.ipNumber} | ${days} | ${fmtN(c.grossSalary)} | ${fmtN(c.esiEmployee)} | ${fmtN(c.esiEmployer)}`;
    });
  return [
    `# ESI Contribution Return — ${payrun?.monthLabel || daysLabel}`,
    '# Format: IP Number | Days Worked | Gross | EE Contrib (0.75%) | ER Contrib (3.25%)',
    ...lines
  ].join('\n');
}

function generatePTReturn(employees) {
  const rows = employees
    .filter(e => e.computed.pt > 0)
    .map(e => ({
      'Emp Code': e.empCode,
      'Employee Name': e.name,
      'State': e.work_state || 'KA',
      'Gross Salary (₹)': fmtN(e.computed.grossSalary),
      'PT Deducted (₹)': fmtN(e.computed.pt),
    }));
  return rows;
}

function generateLWFStatement(employees) {
  const rows = employees
    .filter(e => e.computed.lwf > 0)
    .map(e => ({
      'Emp Code': e.empCode,
      'Employee Name': e.name,
      'State': e.work_state || 'KA',
      'EE Contrib (₹)': fmtN(e.computed.lwf),
      'ER Contrib (₹)': fmtN(e.computed.lwf * 2),
      'Total (₹)': fmtN(e.computed.lwf * 3),
    }));
  return rows;
}

function generateTDS24QStub(employees) {
  const rows = employees.map(e => ({
    'PAN': e.pan,
    'Employee Name': e.name,
    'Gross Salary (₹)': fmtN(e.computed.grossSalary),
    'Annual Tax Liability (₹)': fmtN(e.computed.annualTax),
    'Monthly TDS (₹)': fmtN(e.computed.tds),
    'Tax Regime': e.taxRegime === 'new' ? 'New' : 'Old',
  }));
  return rows;
}

function generatePayrollRegister(employees) {
  return employees.map(e => {
    const c = e.computed;
    return {
      'Emp Code': e.empCode,
      'Name': e.name,
      'Department': e.department,
      'Designation': e.designation,
      'Bank Acc': e.accNumber,
      'IFSC': e.ifsc,
      'Paid Days': Math.max(0, (e.daysInMonth || 30) - (e.lopDays || 0)),
      'Basic (₹)': fmtN(c.basic),
      'HRA (₹)': fmtN(c.hra),
      'Special Allowance (₹)': fmtN(c.special),
      'Variable Pay (₹)': fmtN(c.variablePay),
      'OT (₹)': fmtN(c.overtimePay),
      'Arrears (₹)': fmtN(c.arrearsPay),
      'Leave Encashment (₹)': fmtN(c.leaveEncashmentPay),
      'Gross Salary (₹)': fmtN(c.grossSalary),
      'EPF EE (₹)': fmtN(c.pfEmployee),
      'ESIC EE (₹)': fmtN(c.esiEmployee),
      'PT (₹)': fmtN(c.pt),
      'LWF (₹)': fmtN(c.lwf),
      'TDS (₹)': fmtN(c.tds),
      'Total Deductions (₹)': fmtN(c.totalDeductions),
      'Net Pay (₹)': fmtN(c.netPay),
      'EPF ER (₹)': fmtN(c.pfEmployer),
      'ESIC ER (₹)': fmtN(c.esiEmployer),
    };
  });
}

// ── Download helpers ──────────────────────────────────────────────────────────
function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcelFromRows(rows, sheetName, filename) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

async function downloadStatewiseZippedExcel(allRowsList, typeLabel, filenamePrefix) {
  try {
    const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    const zip = new JSZip();

    const stateGroups = {};
    for (const row of allRowsList) {
      const st = row.State || 'KA';
      if (!stateGroups[st]) stateGroups[st] = [];
      stateGroups[st].push(row);
    }

    if (Object.keys(stateGroups).length === 0) {
      alert(`No ${typeLabel} deductions found in this payrun.`);
      return;
    }

    for (const [st, rows] of Object.entries(stateGroups)) {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${typeLabel}_${st}`);
      
      const fileData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file(`${filenamePrefix}_${st}.xlsx`, fileData);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filenamePrefix}_AllStates.zip`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Error generating state-wise ZIP: " + e.message);
    console.error(e);
  }
}

// ── Export button component ───────────────────────────────────────────────────
function ExportBtn({ icon, label, sublabel, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '18px 14px', background: 'white', border: `2px solid ${color}20`,
      borderRadius: 12, cursor: 'pointer', textAlign: 'center',
      transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${color}30`}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'}
    >
      <span style={{ fontSize: 32 }}>{icon}</span>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{sublabel}</div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PayrollOps_Confirm({ payrunEmployees, activePayrun, onConfirm, onBack }) {
  const [bankFormat, setBankFormat] = useState('HDFC');
  const [confirmed, setConfirmed] = useState(activePayrun?.status === 'confirmed');
  const [bankFormat_state, setBankFormatState] = useState('HDFC');

  // Aggregate totals
  const totals = payrunEmployees.reduce((acc, e) => {
    const c = e.computed;
    acc.gross += c.grossSalary || 0;
    acc.net += c.netPay || 0;
    acc.epf += (c.pfEmployee || 0) + (c.pfEmployer || 0);
    acc.esic += (c.esiEmployee || 0) + (c.esiEmployer || 0);
    acc.pt += c.pt || 0;
    acc.lwf += c.lwf || 0;
    acc.tds += c.tds || 0;
    return acc;
  }, { gross: 0, net: 0, epf: 0, esic: 0, pt: 0, lwf: 0, tds: 0 });

  const today = new Date().toISOString().split('T')[0];
  const monthLabel = activePayrun?.monthLabel?.replace(' ', '_') || 'Payroll';
  const [fmt_b] = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Generic CSV'];
  
  const bankFmt = bankFormat_state;

  const handleConfirmAndProceed = () => {
    setConfirmed(true);
    onConfirm();
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Payrun Summary */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', borderRadius: 16, padding: 28, color: 'white', marginBottom: 24 }}>
        <div style={{ fontSize: 12, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Payrun Summary</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>{activePayrun?.monthLabel} — {payrunEmployees.length} Employees</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
          {[
            ['Total Gross', totals.gross, ''],
            ['Net Payable', totals.net, ''],
            ['EPF (Total)', totals.epf, ''],
            ['ESIC (Total)', totals.esic, ''],
            ['Prof. Tax', totals.pt, ''],
            ['LWF', totals.lwf, ''],
            ['TDS', totals.tds, ''],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>₹{Math.round(val).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee breakdown table */}
      <div className="sim-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Payroll Register Preview</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Employee', 'Gross', 'EPF (EE)', 'ESIC (EE)', 'PT', 'LWF', 'TDS', 'Total Deductions', 'Net Pay'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Employee' ? 'left' : 'right', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrunEmployees.map(e => {
                const c = e.computed;
                return (
                  <tr key={e.id}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{e.name}<div style={{ fontSize: 10, color: '#64748b' }}>{e.empCode}</div></td>
                    {[c.grossSalary, c.pfEmployee, c.esiEmployee, c.pt, c.lwf, c.tds, c.totalDeductions, c.netPay].map((v, i) => (
                      <td key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', color: i === 7 ? '#047857' : i === 6 ? '#dc2626' : '#0f172a', fontWeight: i >= 6 ? 700 : 400 }}>
                        ₹{Math.round(v || 0).toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Panel */}
      <div className="sim-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📤 Compliance Exports</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Bank Format:</span>
            <select value={bankFmt} onChange={e => setBankFormatState(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, outline: 'none' }}>
              {['HDFC', 'ICICI', 'SBI', 'Axis', 'Generic CSV'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
          <ExportBtn icon="🏦" label="Bank File" sublabel={`${bankFmt} Format`} color="#2563eb"
            onClick={() => downloadText(generateBankCSV(payrunEmployees, activePayrun, bankFmt), `Bank_${bankFmt}_${monthLabel}_${today}.csv`)} />
          <ExportBtn icon="💰" label="EPF ECR" sublabel="v2 Format" color="#7c3aed"
            onClick={() => downloadText(generateEPFECR(payrunEmployees), `EPF_ECR_${monthLabel}_${today}.txt`)} />
          <ExportBtn icon="🏥" label="ESIC Return" sublabel="IP-Based CSV" color="#0891b2"
            onClick={() => downloadText(generateESICReturn(payrunEmployees, activePayrun), `ESIC_Return_${monthLabel}_${today}.txt`)} />
          <ExportBtn icon="📑" label="TDS / 24Q" sublabel="Pre-fill Data" color="#b45309"
            onClick={() => downloadExcelFromRows(generateTDS24QStub(payrunEmployees), 'TDS 24Q', `TDS_24Q_${monthLabel}_${today}.xlsx`)} />
          <ExportBtn icon="🏛️" label="Prof. Tax" sublabel="State-wise ZIP" color="#16a34a"
            onClick={() => downloadStatewiseZippedExcel(generatePTReturn(payrunEmployees), 'PT_Return', `PT_Return_${monthLabel}_${today}`)} />
          <ExportBtn icon="⚖️" label="LWF" sublabel="State-wise ZIP" color="#0369a1"
            onClick={() => downloadStatewiseZippedExcel(generateLWFStatement(payrunEmployees), 'LWF_Stmt', `LWF_Statement_${monthLabel}_${today}`)} />
          <ExportBtn icon="📊" label="Payroll Register" sublabel="Full — All Components" color="#334155"
            onClick={() => downloadExcelFromRows(generatePayrollRegister(payrunEmployees), 'Register', `Payroll_Register_${monthLabel}_${today}.xlsx`)} />
        </div>
      </div>

      {/* Confirm Payrun */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>← Back</button>
        {!confirmed ? (
          <button onClick={handleConfirmAndProceed}
            style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 15, boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}>
            ✅ Confirm Payrun &amp; Generate Slips →
          </button>
        ) : (
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
            ✓ Payrun Confirmed — Proceed to Salary Slips
          </div>
        )}
      </div>
    </div>
  );
}
