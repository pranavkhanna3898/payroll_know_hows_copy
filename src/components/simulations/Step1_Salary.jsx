import React from 'react';

export default function Step1_Salary({ state }) {
  const {
    daysInMonth, lopDays, overtimeHours, otRate, arrears,
    updateData, standardBasic, standardHRA, standardSpecial,
    basic, hra, special, overtimePay, grossSalary, attendanceFactor
  } = state;

  return (
    <div className="sim-card sim-card-blue">
      <div className="sim-card-header">
        <h3>Step 1: Attendance & Gross Salary</h3>
        <p>Convert CTC to monthly gross based on attendance and variable inputs.</p>
      </div>

      <div className="sim-card-body">
        <div className="sim-input-grid">
          <div className="sim-input-group">
            <label>Base Monthly Gross (Step 0)</label>
            <input type="number" value={standardBasic + standardHRA + standardSpecial} disabled style={{background: '#f1f5f9'}} />
          </div>
          <div className="sim-input-group">
            <label>Days in Month</label>
            <input type="number" value={daysInMonth} onChange={(e) => updateData('daysInMonth', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>LOP (Loss of Pay) Days</label>
            <input type="number" value={lopDays} onChange={(e) => updateData('lopDays', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Overtime Hours</label>
            <input type="number" value={overtimeHours} onChange={(e) => updateData('overtimeHours', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>OT Rate/Hr (₹)</label>
            <input type="number" value={otRate} onChange={(e) => updateData('otRate', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Arrears (₹)</label>
            <input type="number" value={arrears} onChange={(e) => updateData('arrears', e.target.value)} />
          </div>
        </div>

        <div className="sim-output-box">
          <h4>Calculation: Attendance Proration & Gross</h4>
          <div className="code-content" style={{background: 'transparent', padding: '0 0 10px', color: '#475569', fontSize: 12}}>
             Attendance Factor = (Days - LOP) / Days <br/>
             → ({daysInMonth} - {lopDays}) / {daysInMonth} = {attendanceFactor.toFixed(4)} Multiplier
          </div>
          <div className="sim-line-item">
            <span>Basic (Prorated):</span>
            <span>₹ {basic.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>HRA (Prorated):</span>
            <span>₹ {hra.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>Other Taxable Allowances (Prorated):</span>
            <span>₹ {special.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>Overtime Component:</span>
            <span>+ ₹ {overtimePay.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>Arrears:</span>
            <span>+ ₹ {arrears.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item sim-total">
            <span>Gross Salary:</span>
            <span>₹ {grossSalary.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
