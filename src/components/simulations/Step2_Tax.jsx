import React from 'react';

export default function Step2_Tax({ state }) {
  const {
    taxRegime, investments80C, medical80D, isMetro, monthlyRentPaid, tdsDeductedSoFar, monthsRemaining,
    updateData, grossSalary, annualGross, taxableIncome, annualTax, tds, taxFormulaDetail,
    calculatedHraExempt, hraFormulaString
  } = state;

  return (
    <div className="sim-card sim-card-purple">
      <div className="sim-card-header">
        <h3>Step 2: Investment Declarations &amp; TDS</h3>
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
            <label className="has-tooltip" data-tooltip="Maximum ceiling 1.5L; Exempts investments like PPF, ELSS.">80C Investments (Max 1.5L) <span className="tooltip-icon">?</span></label>
            <input type="number" value={investments80C} disabled={taxRegime === 'new'} onChange={(e) => updateData('investments80C', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1, transition: 'opacity 0.2s'}}>
            <label className="has-tooltip" data-tooltip="Exempts statutory health insurance premiums.">80D Medical Premium <span className="tooltip-icon">?</span></label>
            <input type="number" value={medical80D} disabled={taxRegime === 'new'} onChange={(e) => updateData('medical80D', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1, transition: 'opacity 0.2s'}}>
            <label className="has-tooltip" data-tooltip="Governs the active calculation bound: 50% Basic for Metro, 40% for Non-Metro.">City Type (For HRA) <span className="tooltip-icon">?</span></label>
            <select value={isMetro} disabled={taxRegime === 'new'} onChange={(e) => updateData('isMetro', e.target.value === 'true')}>
              <option value={true}>Metro (50% Basic)</option>
              <option value={false}>Non-Metro (40% Basic)</option>
            </select>
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1, transition: 'opacity 0.2s'}}>
            <label className="has-tooltip" data-tooltip="Annualized to evaluate the 'Rent - 10% Basic' limit constraint.">Monthly Rent Paid <span className="tooltip-icon">?</span></label>
            <input type="number" value={monthlyRentPaid} disabled={taxRegime === 'new'} onChange={(e) => updateData('monthlyRentPaid', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Taxes already secured in the current central fiscal year.">TDS Deducted So Far (YTD) <span className="tooltip-icon">?</span></label>
            <input type="number" value={tdsDeductedSoFar} onChange={(e) => updateData('tdsDeductedSoFar', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Number of distinct payroll cycles remaining to amortize tax recovery across.">Remaining Months in FY <span className="tooltip-icon">?</span></label>
            <input type="number" value={monthsRemaining} min="1" onChange={(e) => updateData('monthsRemaining', e.target.value)} />
          </div>
        </div>

        <div className="sim-output-box">
          <h4>Calculation Breakup: Taxable Income &amp; TDS</h4>

          {/* ① Annualize */}
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>① Annualization of Gross</div>
            <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
              Annual Gross = (Standard Monthly Gross × 11) + Current Month Gross<br/>
              ↳ Current Gross = Fixed (₹{Math.round(state.fixedGross).toLocaleString()}) + Additions (₹{Math.round(grossSalary - state.fixedGross).toLocaleString()})<br/>
              <span style={{ color: '#1e40af', fontWeight: 700 }}>= ₹{Math.round(annualGross - grossSalary).toLocaleString()} + ₹{Math.round(grossSalary).toLocaleString()} = ₹{Math.round(annualGross).toLocaleString()}</span>
            </div>
          </div>

          {/* ② Deductions */}
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>② Allowable Deductions from Gross</div>
            {taxRegime === 'new' ? (
              <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
                Standard Deduction (New Regime) = ₹75,000<br/>
                Net Taxable = ₹{Math.round(annualGross).toLocaleString()} − ₹75,000<br/>
                <span style={{ color: '#1e40af', fontWeight: 700 }}>= ₹{Math.round(taxableIncome).toLocaleString()}</span>
              </div>
            ) : (
              <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
                Standard Deduction = ₹50,000<br/>
                80C Investments (capped ₹1.5L) = ₹{Math.min(150000, investments80C).toLocaleString()}<br/>
                80D Medical Premium = ₹{medical80D.toLocaleString()}<br/>
                HRA Exempt u/s 10(13A) = ₹{Math.round(calculatedHraExempt).toLocaleString()}<br/>
                <span style={{ color: '#94a3b8', fontSize: 10 }}>  ↳ {hraFormulaString}</span><br/>
                Net Taxable = ₹{Math.round(annualGross).toLocaleString()} − ₹{(50000 + Math.min(150000, investments80C) + medical80D + Math.round(calculatedHraExempt)).toLocaleString()} (total deductions)<br/>
                <span style={{ color: '#1e40af', fontWeight: 700 }}>= ₹{Math.round(taxableIncome).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* ③ Slab */}
          <div style={{ background: '#fef3c7', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
              ③ Tax Slab Computation ({taxRegime === 'new' ? 'New Regime — FY 2026-27 Slabs' : 'Old Regime — 3 Slabs'})
            </div>
            <div style={{ fontFamily: 'monospace', color: '#78350f', lineHeight: 1.7 }}>
              {taxFormulaDetail}<br/>
              <span style={{ fontWeight: 700 }}>Annual Tax = ₹{Math.round(annualTax).toLocaleString()}</span>
            </div>
          </div>

          {/* ④ TDS */}
          <div style={{ background: '#1e293b', borderRadius: 6, padding: '12px 14px', fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>④ Monthly TDS Recovery</div>
            <div style={{ fontFamily: 'monospace', color: '#7dd3fc', fontSize: 11, lineHeight: 1.8 }}>
              = (Annual Tax − TDS Deducted So Far) ÷ Remaining Months<br/>
              = (₹{Math.round(annualTax).toLocaleString()} − ₹{tdsDeductedSoFar.toLocaleString()}) ÷ {monthsRemaining} months
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 8 }}>
              = ₹ {tds.toLocaleString(undefined, {maximumFractionDigits: 2})} / month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
