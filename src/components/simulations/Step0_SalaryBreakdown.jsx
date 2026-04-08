import React from 'react';

export default function Step0_SalaryBreakdown({ state }) {
  const { monthlyBasic, monthlyHRA, monthlySpecial, monthlyReimbursements, employerPFMatch, employerESIMatch, updateData, standardGross, totalMonthlyCTC } = state;

  return (
    <div className="sim-card sim-card-blue">
      <div className="sim-card-header">
        <h3>Step 0: Salary Structure Definition</h3>
        <p>Input the employee's standard monthly fixed component breakdown.</p>
      </div>

      <div className="sim-card-body">
        <div className="sim-input-grid">
          <div className="sim-input-group">
            <label>Monthly Basic (₹)</label>
            <input type="number" value={monthlyBasic} onChange={(e) => updateData('monthlyBasic', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Monthly HRA (₹)</label>
            <input type="number" value={monthlyHRA} onChange={(e) => updateData('monthlyHRA', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Monthly Special Allowance (₹)</label>
            <input type="number" value={monthlySpecial} onChange={(e) => updateData('monthlySpecial', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Reimbursements (₹)</label>
            <input type="number" value={monthlyReimbursements} onChange={(e) => updateData('monthlyReimbursements', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Employer PF Contrib (₹)</label>
            <input type="number" value={employerPFMatch} onChange={(e) => updateData('employerPFMatch', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Employer ESI Contrib (₹)</label>
            <input type="number" value={employerESIMatch} onChange={(e) => updateData('employerESIMatch', e.target.value)} />
          </div>
        </div>

        <div className="sim-output-box">
          <h4>Calculation: Standard Input CTC</h4>
          <div className="code-content" style={{background: 'transparent', padding: '0 0 10px', color: '#475569', fontSize: 12}}>
            Gross Base = (Basic + HRA + Special)<br/>
            CTC = Gross Base + Reimbursements + Employer Component (PF/ESI)
          </div>
          <div className="sim-line-item">
            <span>Gross Base:</span>
            <span>₹ {standardGross.toLocaleString()}</span>
          </div>
          <div className="sim-line-item">
            <span>Non-Taxable/Employer Payouts:</span>
            <span>+ ₹ {(monthlyReimbursements + employerPFMatch + employerESIMatch).toLocaleString()}</span>
          </div>
          <div className="sim-line-item sim-total" style={{margin: '8px 0'}}>
            <span>Total Monthly CTC:</span>
            <span>₹ {totalMonthlyCTC.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>Implied Annual CTC:</span>
            <span style={{fontWeight: 700}}>₹ {(totalMonthlyCTC * 12).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
