import React from 'react';

export default function Step0_SalaryBreakdown({ state }) {
  const { 
    salaryComponents, updateComponent, addComponent, removeComponent, 
    standardGross, totalMonthlyCTC, monthlyReimbursements, employerContribs 
  } = state;

  return (
    <div className="sim-card sim-card-blue">
      <div className="sim-card-header">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h3 style={{margin: 0}}>Step 0: Component Builder</h3>
            <p style={{margin: '4px 0 0 0', fontSize: 13, color: '#64748b'}}>Build the employee's CTC structure dynamically.</p>
          </div>
          <button 
            onClick={addComponent}
            style={{background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600}}>
            + Add Component
          </button>
        </div>
      </div>

      <div className="sim-card-body">
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24}}>
          {salaryComponents.map((comp) => (
            <div key={comp.id} style={{display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(150px, 1.5fr) 100px 30px', gap: 12, alignItems: 'center'}}>
              <input 
                type="text" 
                value={comp.name} 
                onChange={(e) => updateComponent(comp.id, 'name', e.target.value)} 
                placeholder="Component Name"
                style={{padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, width: '100%', boxSizing: 'border-box'}}
              />
              <select 
                value={comp.type} 
                onChange={(e) => updateComponent(comp.id, 'type', e.target.value)}
                style={{padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: 'white', width: '100%', boxSizing: 'border-box'}}>
                <option value="earnings_basic">Earnings - Basic</option>
                <option value="earnings_hra">Earnings - HRA</option>
                <option value="earnings_allowance">Earnings - Taxable Allowance</option>
                <option value="reimbursement">Reimbursement (Exempt)</option>
                <option value="employer_contrib">Employer Contribution</option>
                <option value="employee_deduction">Employee Deduction</option>
              </select>
              <div style={{position: 'relative'}}>
                <span style={{position: 'absolute', left: 10, top: 9, color: '#64748b', fontSize: 13}}>₹</span>
                <input 
                  type="number" 
                  value={comp.amount} 
                  onChange={(e) => updateComponent(comp.id, 'amount', e.target.value)} 
                  style={{padding: '8px 8px 8px 22px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, width: '100%', boxSizing: 'border-box'}}
                />
              </div>
              <button 
                onClick={() => removeComponent(comp.id)}
                style={{background: '#fee2e2', color: '#ef4444', border: 'none', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0}}>
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="sim-output-box">
          <h4>Calculation: Standard Input CTC</h4>
          <div className="code-content" style={{background: 'transparent', padding: '0 0 10px', color: '#475569', fontSize: 12}}>
            Gross Base = Sum(Earnings)<br/>
            CTC = Gross Base + Sum(Reimbursements) + Sum(Employer Contribs)
          </div>
          <div className="sim-line-item">
            <span>Gross Base:</span>
            <span>₹ {standardGross.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>Non-Taxable/Employer Payouts:</span>
            <span>+ ₹ {(monthlyReimbursements + employerContribs).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
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
