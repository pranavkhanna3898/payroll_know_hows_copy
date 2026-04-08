import React from 'react';

export default function Step3_NetPay({ state }) {
  const {
    grossSalary, basic, tds, pfEmployee, esiEmployee, pt, lwf, totalDeductions, netPay, employeeDeductions
  } = state;

  return (
    <div className="sim-card sim-card-green">
      <div className="sim-card-header">
        <h3>Step 3: Actual Payable Salary (Net Pay)</h3>
        <p>Adjust the Gross Salary against TDS and statutory deductions to compute the final Net Pay.</p>
      </div>

      <div className="sim-card-body">
        <div className="sim-badge" style={{marginBottom: 16}}>
          <span>Inputs:</span> Gross = ₹{grossSalary.toLocaleString(undefined, {maximumFractionDigits: 2})} | Basic = ₹{basic.toLocaleString(undefined, {maximumFractionDigits: 2})} | TDS = ₹{tds.toLocaleString(undefined, {maximumFractionDigits: 2})}
        </div>

        <div className="sim-output-box">
          <h4>Calculation: Statutory Deductions & Net Pay</h4>
          <div className="code-content" style={{background: 'transparent', padding: '0 0 10px', color: '#475569', fontSize: 12}}>
             PF Output = MIN(1800, Basic {Math.round(basic).toLocaleString()} * 12%)<br/>
             ESI Output = If Gross {Math.round(grossSalary).toLocaleString()} &le; 21000 then (Gross * 0.75%) else 0<br/>
             Net Pay = Gross - (PF + ESI + PT + LWF + TDS + Custom Deductions)
          </div>
          <div className="sim-line-item">
            <span>Provident Fund (PF) Employee Share (12% of Basic):</span>
            <span>- ₹ {pfEmployee.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>ESIC Employee Share (0.75% of Gross if ≤ 21k):</span>
            <span>- ₹ {esiEmployee.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>Professional Tax (PT) (Assumed Flat):</span>
            <span>- ₹ {pt.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>Labour Welfare Fund (LWF) (Assumed Flat):</span>
            <span>- ₹ {lwf.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>TDS (From Step 2):</span>
            <span>- ₹ {tds.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          {employeeDeductions > 0 && (
            <div className="sim-line-item">
              <span>Other Custom Deductions (From Step 0):</span>
              <span>- ₹ {employeeDeductions.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
            </div>
          )}
          <div className="sim-line-item sim-total-deduction" style={{borderTop: '1px solid #e2e8f0', marginTop: 8, paddingTop: 8, fontWeight: 600}}>
            <span>Total Deductions:</span>
            <span>- ₹ {totalDeductions.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className="sim-net-pay-banner">
          <div className="banner-label">Final Net Pay (Take Home)</div>
          <div className="banner-value">₹ {netPay.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
        </div>
      </div>
    </div>
  );
}
