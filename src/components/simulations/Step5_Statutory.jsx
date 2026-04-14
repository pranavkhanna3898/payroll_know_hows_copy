import React from 'react';

export default function Step5_Statutory({ state }) {
  const { pfEmployee, pfEmployer, esiEmployee, esiEmployer, grossSalary, standardBasic, daysInMonth, lopDays } = state;

  const uan = "100987654321";
  const pfEps = Math.min(1250, pfEmployer * (8.33 / 12));
  const pfErShare = pfEmployer - pfEps;
  const pfEcr = `${uan}#~#${grossSalary.toFixed(0)}#~#${pfEmployee.toFixed(0)}#~#${pfEps.toFixed(0)}#~#${pfErShare.toFixed(0)}`;

  const ipNumber = "5112345678";
  const days = daysInMonth - lopDays;
  const esirow = `${ipNumber} | ${days} | ${grossSalary.toFixed(0)} | ${esiEmployee.toFixed(0)} | ${esiEmployer.toFixed(0)}`;

  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const esiApplicable = grossSalary <= 21000;

  return (
    <div className="sim-card sim-card-gray" style={{ flex: 1 }}>
      <div className="sim-card-header">
        <h3>Step 5: Statutory Submissions</h3>
        <p>Mock ECR &amp; Returns format for statutory compliances with full contribution breakup.</p>
      </div>

      <div className="sim-card-body">

        {/* EPF Breakup */}
        <div style={{ marginBottom: 16, background: '#f8fafc', borderRadius: 6, padding: '12px 14px', fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: '#475569', marginBottom: 8 }}>EPF Calculation Breakup</div>
          <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.8 }}>
            PF Wage = Basic = ₹{fmt(standardBasic)}<br/>
            EE Share = 12% × ₹{fmt(standardBasic)} = <strong style={{color:'#1e40af'}}>₹{fmt(pfEmployee)}</strong><br/>
            ER Total = 12% × ₹{fmt(standardBasic)} = ₹{fmt(pfEmployer)}<br/>
            &nbsp;&nbsp;↳ EPS Portion = MIN(₹1,250, 8.33% × ₹{fmt(standardBasic)}) = <strong style={{color:'#7c3aed'}}>₹{fmt(pfEps)}</strong><br/>
            &nbsp;&nbsp;↳ EPF-ER Portion = ₹{fmt(pfEmployer)} − ₹{fmt(pfEps)} = <strong style={{color:'#0369a1'}}>₹{fmt(pfErShare)}</strong>
          </div>
        </div>

        {/* ESI Breakup */}
        <div style={{ marginBottom: 16, background: esiApplicable ? '#f8fafc' : '#fafafa', borderRadius: 6, padding: '12px 14px', fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: '#475569', marginBottom: 8 }}>ESI Calculation Breakup</div>
          {esiApplicable ? (
            <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.8 }}>
              ESI Base = Gross = ₹{fmt(grossSalary)} (includes Variables; ≤ ₹21,000 threshold)<br/>
              EE Share = 0.75% × ₹{fmt(grossSalary)} = <strong style={{color:'#1e40af'}}>₹{fmt(esiEmployee)}</strong><br/>
              ER Share = 3.25% × ₹{fmt(grossSalary)} = <strong style={{color:'#7c3aed'}}>₹{fmt(esiEmployer)}</strong><br/>
              Total ESI = 4.00% × ₹{fmt(grossSalary)} = <strong>₹{fmt(esiEmployee + esiEmployer)}</strong>
            </div>
          ) : (
            <div style={{ fontFamily: 'monospace', color: '#94a3b8', lineHeight: 1.8 }}>
              ESI Base = Gross ₹{fmt(grossSalary)} exceeds ₹21,000 threshold.<br/>
              <strong style={{color:'#16a34a'}}>ESI not applicable → ₹0 / ₹0</strong>
            </div>
          )}
        </div>

        {/* ECR String */}
        <div className="code-output-box">
          <div className="code-header">EPF_ECR_Upload.txt</div>
          <pre className="code-content">{pfEcr}</pre>
          <div className="code-note">Format: UAN #~# Gross #~# EE(12%) #~# EPS(8.33%) #~# EPF-ER(3.67%)</div>
        </div>

        {/* ESI String */}
        <div className="code-output-box" style={{ marginTop: 16 }}>
          <div className="code-header">ESI_Return_Template.CSV</div>
          <pre className="code-content">{esirow}</pre>
          <div className="code-note">Format: IP Number | Days Worked | Gross Base | EE Contrib (0.75%) | ER Contrib (3.25%)</div>
        </div>
      </div>
    </div>
  );
}
