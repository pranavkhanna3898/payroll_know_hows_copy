import React from 'react';

export default function Step2_Tax({ state }) {
  const {
    taxRegime, investments80C, medical80D, hraExempt, tdsDeductedSoFar, monthsRemaining,
    updateData, grossSalary, taxableIncome, annualTax, tds, taxFormulaDetail
  } = state;

  return (
    <div className="sim-card sim-card-purple">
      <div className="sim-card-header">
        <h3>Step 2: Investment Declarations & TDS</h3>
        <p>Determine the income tax liability on the gross salary factoring in Section 10 and Chapter VI-A exemptions.</p>
      </div>

      <div className="sim-card-body">
        <div style={{display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center'}}>
          <div className="sim-badge" style={{margin: 0}}>
            <span>Inputs From Step 1:</span> Current Gross = ₹{grossSalary.toLocaleString(undefined, {maximumFractionDigits: 2})}
          </div>
          <div style={{display: 'flex', background: '#e2e8f0', padding: 3, borderRadius: 8}}>
            <button 
              style={{padding: '6px 12px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer', background: taxRegime === 'old' ? 'white' : 'transparent', color: taxRegime === 'old' ? '#0f172a' : '#64748b', transition: 'all 0.2s'}}
              onClick={() => updateData('taxRegime', 'old')}>
              Old Tax Regime
            </button>
            <button 
              style={{padding: '6px 12px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer', background: taxRegime === 'new' ? 'white' : 'transparent', color: taxRegime === 'new' ? '#0f172a' : '#64748b', transition: 'all 0.2s'}}
              onClick={() => updateData('taxRegime', 'new')}>
              New Tax Regime (FY26-27 Default)
            </button>
          </div>
        </div>

        <div className="sim-input-grid">
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1, transition: 'opacity 0.2s'}}>
            <label>80C Investments (Max 1.5L)</label>
            <input type="number" value={investments80C} disabled={taxRegime === 'new'} onChange={(e) => updateData('investments80C', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1, transition: 'opacity 0.2s'}}>
            <label>80D Medical Premium</label>
            <input type="number" value={medical80D} disabled={taxRegime === 'new'} onChange={(e) => updateData('medical80D', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1, transition: 'opacity 0.2s'}}>
            <label>Exempt HRA (Sec 10)</label>
            <input type="number" value={hraExempt} disabled={taxRegime === 'new'} onChange={(e) => updateData('hraExempt', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>TDS Deducted So Far (YTD)</label>
            <input type="number" value={tdsDeductedSoFar} onChange={(e) => updateData('tdsDeductedSoFar', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Remaining Months in FY</label>
            <input type="number" value={monthsRemaining} min="1" onChange={(e) => updateData('monthsRemaining', e.target.value)} />
          </div>
        </div>

        <div className="sim-output-box">
          <h4>Calculation: Taxable Income & Tax Formula</h4>
          <div className="code-content" style={{background: 'transparent', padding: '0 0 10px', color: '#475569', fontSize: 12}}>
             Annual Gross = (Monthly Gross {Math.round(grossSalary).toLocaleString()} * 11) + {Math.round(grossSalary).toLocaleString()} <br/>
             Net Taxable = Annual Gross {taxRegime === 'old' ? '- 80C - 80D - HRA - 50k (Std Ded)' : '- 75,000 (Standard Deduction)'}<br/>
             Tax Formula: <span style={{fontWeight: 700}}>{taxFormulaDetail}</span><br/>
             Monthly TDS = (Annual Tax - Deducted So Far) / Remaining Months
          </div>
          <div className="sim-line-item">
            <span>Projected Net Taxable Income:</span>
            <span>₹ {taxableIncome.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item">
            <span>Total Projected Annual Tax:</span>
            <span>₹ {annualTax.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <div className="sim-line-item sim-total">
            <span>Monthly TDS Recovery:</span>
            <span>- ₹ {tds.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
