import React from 'react';

export default function Step2_Tax({ state }) {
  const {
    taxRegime, investments80C, medical80D, nps80CCD1B, homeLoanInterest, deductions80GE, savingsInterest80TTA, ltaClaimed,
    isMetro, monthlyRentPaid, tdsDeductedSoFar, monthsRemaining,
    updateData, grossSalary, annualGross, taxableIncome, annualTax, tds, taxFormulaDetail,
    calculatedHraExempt, hraFormulaString, 
    hraActual, hraRentExcess, hraCityLimit
  } = state;

  return (
    <div className="sim-card sim-card-purple">
      <div className="sim-card-header">
        <h3>Step 2: Investment Declarations &amp; TDS</h3>
        <p>Enter your tax-saving declarations to simulate your take-home pay under the Old or New Regime.</p>
      </div>

      <div className="sim-card-body">
        <div style={{display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap'}}>
          <div className="sim-badge" style={{margin: 0}}>
            <span>Step 1 Gross:</span> ₹{grossSalary.toLocaleString()}
          </div>
          <div style={{display: 'flex', background: '#e2e8f0', padding: 3, borderRadius: 8}}>
            <button 
              style={{padding: '6px 12px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer', background: taxRegime === 'old' ? 'white' : 'transparent', color: taxRegime === 'old' ? '#0f172a' : '#64748b'}}
              onClick={() => updateData('taxRegime', 'old')}>
              Old Regime
            </button>
            <button 
              style={{padding: '6px 12px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer', background: taxRegime === 'new' ? 'white' : 'transparent', color: taxRegime === 'new' ? '#0f172a' : '#64748b'}}
              onClick={() => updateData('taxRegime', 'new')}>
              New Regime
            </button>
          </div>
        </div>

        <div className="sim-input-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {/* Chapter VI-A */}
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label className="has-tooltip" data-tooltip="LIC, ELSS, PPF, etc. Max 1.5L.">80C Investments (Max 1.5L)</label>
            <input type="number" value={investments80C} disabled={taxRegime === 'new'} onChange={(e) => updateData('investments80C', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label>80D Medical Premium</label>
            <input type="number" value={medical80D} disabled={taxRegime === 'new'} onChange={(e) => updateData('medical80D', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label className="has-tooltip" data-tooltip="Additional NPS deduction. Max 50k.">80CCD(1B) NPS (Max 50k)</label>
            <input type="number" value={nps80CCD1B} disabled={taxRegime === 'new'} onChange={(e) => updateData('nps80CCD1B', e.target.value)} />
          </div>

          {/* House Property & HRA */}
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label>Home Loan Int. (Sec 24)</label>
            <input type="number" value={homeLoanInterest} disabled={taxRegime === 'new'} onChange={(e) => updateData('homeLoanInterest', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label>Monthly Rent Paid</label>
            <input type="number" value={monthlyRentPaid} disabled={taxRegime === 'new'} onChange={(e) => updateData('monthlyRentPaid', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label>City Type (For HRA)</label>
            <select value={isMetro} disabled={taxRegime === 'new'} onChange={(e) => updateData('isMetro', e.target.value === 'true')}>
              <option value={true}>Metro (50% Basic)</option>
              <option value={false}>Non-Metro (40% Basic)</option>
            </select>
          </div>

          {/* Others & YTD */}
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label>80G / 80E (Donations/Edu)</label>
            <input type="number" value={deductions80GE} disabled={taxRegime === 'new'} onChange={(e) => updateData('deductions80GE', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label>80TTA/TTB (Savings Int)</label>
            <input type="number" value={savingsInterest80TTA} disabled={taxRegime === 'new'} onChange={(e) => updateData('savingsInterest80TTA', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>TDS Paid So Far (YTD)</label>
            <input type="number" value={tdsDeductedSoFar} onChange={(e) => updateData('tdsDeductedSoFar', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Rem. Months in FY</label>
            <input type="number" value={monthsRemaining} min="1" max="12" onChange={(e) => updateData('monthsRemaining', e.target.value)} />
          </div>
        </div>

        <div className="sim-output-box">
          <h4>Calculation Breakup: Taxable Income &amp; TDS</h4>

          {/* ① Annualize */}
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>① Annualization of Gross</div>
            <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
              Base Projection: ₹{Math.round(state.standardGross * 11).toLocaleString()}<br/>
              Current Month: ₹{Math.round(grossSalary).toLocaleString()}<br/>
              <span style={{ color: '#1e40af', fontWeight: 700 }}>Projected Annual Gross = ₹{Math.round(annualGross).toLocaleString()}</span>
            </div>
          </div>

          {/* HRA Exemption Audit */}
          {taxRegime === 'old' && calculatedHraExempt > 0 && (
            <div style={{ background: '#f0f9ff', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12, border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>🏘️ HRA Exemption Trace (Min of 3)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontFamily: 'monospace', fontSize: 11 }}>
                <div style={{ color: calculatedHraExempt === hraActual ? '#059669' : '#64748b' }}>Actual HRA: ₹{Math.round(hraActual).toLocaleString()}</div>
                <div style={{ color: calculatedHraExempt === hraRentExcess ? '#059669' : '#64748b' }}>Rent-10%Basic: ₹{Math.round(hraRentExcess).toLocaleString()}</div>
                <div style={{ color: calculatedHraExempt === hraCityLimit ? '#059669' : '#64748b' }}>{isMetro ? '50%' : '40%'} limit: ₹{Math.round(hraCityLimit).toLocaleString()}</div>
                <div style={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Total Exempt: ₹{Math.round(calculatedHraExempt).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* ② Deductions */}
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>② Net Taxable Income</div>
            {taxRegime === 'new' ? (
              <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
                Standard Deduction (New Regime) = ₹75,000<br/>
                <span style={{ color: '#1e40af', fontWeight: 700 }}>Taxable Base = ₹{Math.round(taxableIncome).toLocaleString()}</span>
              </div>
            ) : (
              <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
                Total Deductions (80C, 80D, NPS, Home Loan, HRA, Standard) = ₹{Math.round(annualGross - taxableIncome).toLocaleString()}<br/>
                <span style={{ color: '#1e40af', fontWeight: 700 }}>Taxable Base = ₹{Math.round(taxableIncome).toLocaleString()}</span>
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
