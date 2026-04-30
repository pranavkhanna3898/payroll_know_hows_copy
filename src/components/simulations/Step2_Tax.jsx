import React from 'react';
import { isMetroCity } from '../../data/payrollEngine';

export default function Step2_Tax({ state }) {
  const {
    taxRegime, investments80C, medical80D_self, medical80D_parents, medical80D_parents_senior, nps80CCD1B, homeLoanInterest, deductions80GE, savingsInterest80TTA, ltaClaimed,
    work_city, monthlyRentPaid, tdsDeductedSoFar, monthsRemaining,
    updateData, grossSalary, annualGross, taxableIncome, annualTax, tds, taxFormulaDetail,
    calculatedHraExempt, hraFormulaString,
    hraActual, hraRentExcess, hraCityLimit,
    standardGross, standardGrossForProj, pastMonths, futureMonths, ytdGross,
    variableTaxMode, variableInducedTax, variablePay,
    dob, incomeFromOtherSources, previousEmployerTDS,
  } = state;

  // ── Salary projection components ──────────────────────────────────────────
  const ytdSalary   = ytdGross !== undefined ? ytdGross : ((standardGrossForProj || standardGross) * pastMonths);
  const currentGross = grossSalary;
  const projectedSalary = ((standardGrossForProj || standardGross) * futureMonths);  // remaining months only
  const totalAnnualSalary = ytdSalary + currentGross + projectedSalary;

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
            <label>80D Medical (Self)</label>
            <input type="number" value={medical80D_self} disabled={taxRegime === 'new'} onChange={(e) => updateData('medical80D_self', e.target.value)} />
          </div>
          <div className="sim-input-group" style={{opacity: taxRegime === 'new' ? 0.4 : 1}}>
            <label>80D Medical (Parents)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input type="number" value={medical80D_parents} disabled={taxRegime === 'new'} onChange={(e) => updateData('medical80D_parents', e.target.value)} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer', opacity: taxRegime === 'new' ? 0.5 : 1 }}>
                <input type="checkbox" checked={!!medical80D_parents_senior} onChange={(e) => updateData('medical80D_parents_senior', e.target.checked)} disabled={taxRegime === 'new'} />
                Parents are Senior Citizens
              </label>
            </div>
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
            <label className="has-tooltip" data-tooltip="Auto-derived from Work City">City Type (For HRA)</label>
            <input type="text" value={isMetroCity(work_city) ? `Metro (50%) - ${work_city}` : `Non-Metro (40%) - ${work_city}`} disabled />
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
            <label>Date of Birth (For Age limits)</label>
            <input type="date" value={dob} onChange={(e) => updateData('dob', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Income From Other Sources</label>
            <input type="number" value={incomeFromOtherSources} onChange={(e) => updateData('incomeFromOtherSources', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Prev Employer TDS</label>
            <input type="number" value={previousEmployerTDS} onChange={(e) => updateData('previousEmployerTDS', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>TDS Paid So Far (YTD)</label>
            <input type="number" value={tdsDeductedSoFar} onChange={(e) => updateData('tdsDeductedSoFar', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label>Rem. Months in FY</label>
            <input type="number" value={monthsRemaining} min="1" max="12" onChange={(e) => updateData('monthsRemaining', e.target.value)} />
          </div>
          {variablePay > 0 && (
            <div className="sim-input-group">
              <label className="has-tooltip" data-tooltip="Spread: distributes total deficit over remaining months. Lump-Sum: charges extra tax from variable pay in the same month; all other months stay flat.">Variable Tax Mode</label>
              <div style={{ display: 'flex', background: '#e2e8f0', padding: 3, borderRadius: 8 }}>
                <button
                  onClick={() => updateData('variableTaxMode', 'spread')}
                  style={{ flex: 1, padding: '6px 10px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    background: (variableTaxMode || 'spread') === 'spread' ? 'white' : 'transparent',
                    color: (variableTaxMode || 'spread') === 'spread' ? '#0f172a' : '#64748b' }}>
                  Spread
                </button>
                <button
                  onClick={() => updateData('variableTaxMode', 'lump_sum')}
                  style={{ flex: 1, padding: '6px 10px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    background: variableTaxMode === 'lump_sum' ? '#fef3c7' : 'transparent',
                    color: variableTaxMode === 'lump_sum' ? '#b45309' : '#64748b' }}>
                  Lump-Sum
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sim-output-box">
          <h4>Calculation Breakup: Taxable Income &amp; TDS</h4>

          {/* ① Annualize — 3-part salary projection */}
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '12px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 10 }}>① Salary Projection Breakup</div>

            {/* YTD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', borderRadius: 6, padding: '8px 12px', marginBottom: 8, fontFamily: 'monospace' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#334155', fontSize: 11 }}>YTD Salary (Months Elapsed: {pastMonths})</div>
                <div style={{ color: '#64748b', fontSize: 11 }}>
                  {ytdGross !== undefined ? 'From YTD records' : `Standard Gross ₹${(standardGrossForProj || standardGross).toLocaleString()} × ${pastMonths} months`}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>₹{Math.round(ytdSalary).toLocaleString('en-IN')}</div>
            </div>

            {/* Current Month */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', borderRadius: 6, padding: '8px 12px', marginBottom: 8, fontFamily: 'monospace', border: '1px solid #bfdbfe' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 11 }}>Current Month Gross (Prorated)</div>
                <div style={{ color: '#3b82f6', fontSize: 11 }}>Includes LOP, OT, Arrears, Variables</div>
              </div>
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 13 }}>₹{Math.round(currentGross).toLocaleString('en-IN')}</div>
            </div>

            {/* Projected Remaining */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontFamily: 'monospace', border: '1px solid #bbf7d0' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#15803d', fontSize: 11 }}>Projected Salary (Remaining: {futureMonths} months)</div>
                <div style={{ color: '#16a34a', fontSize: 11 }}>Standard Gross ₹{(standardGrossForProj || standardGross).toLocaleString()} × {futureMonths} months</div>
              </div>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: 13 }}>₹{Math.round(projectedSalary).toLocaleString('en-IN')}</div>
            </div>

            {/* Income From Other Sources */}
            {Number(incomeFromOtherSources) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef3c7', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontFamily: 'monospace', border: '1px solid #fde68a' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#b45309', fontSize: 11 }}>Income from Other Sources</div>
                  <div style={{ color: '#d97706', fontSize: 11 }}>Added to Annual Gross</div>
                </div>
                <div style={{ fontWeight: 700, color: '#b45309', fontSize: 13 }}>+ ₹{Number(incomeFromOtherSources).toLocaleString()}</div>
              </div>
            )}

            {/* Total Annual Income */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderRadius: 6, padding: '10px 14px', fontFamily: 'monospace' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Annual Income</div>
                <div style={{ color: '#7dd3fc', fontSize: 10 }}>Total projected salary + Other Income</div>
              </div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 18 }}>₹{Math.round(totalAnnualSalary + Number(incomeFromOtherSources)).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* HRA Exemption Audit */}
          {taxRegime === 'old' && calculatedHraExempt > 0 && (
            <div style={{ background: '#f0f9ff', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12, border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>🏘️ HRA Exemption Trace (Lowest of the 3 is allowed)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 1fr)', gap: 10, fontFamily: 'monospace', fontSize: 11 }}>
                <div style={{ color: calculatedHraExempt === hraActual ? '#059669' : '#64748b', fontWeight: calculatedHraExempt === hraActual ? 700 : 400 }}>Actual HRA Received: ₹{Math.round(hraActual).toLocaleString()}</div>
                <div style={{ color: calculatedHraExempt === hraRentExcess ? '#059669' : '#64748b', fontWeight: calculatedHraExempt === hraRentExcess ? 700 : 400 }}>Rent Paid - 10% Basic: ₹{Math.round(hraRentExcess).toLocaleString()}</div>
                <div style={{ color: calculatedHraExempt === hraCityLimit ? '#059669' : '#64748b', fontWeight: calculatedHraExempt === hraCityLimit ? 700 : 400 }}>{isMetroCity(work_city) ? '50%' : '40%'} of Basic Salary: ₹{Math.round(hraCityLimit).toLocaleString()}</div>
                <div style={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Final Allowed Exemption: ₹{Math.round(calculatedHraExempt).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* ② Deductions */}
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>② Net Taxable Income</div>
            {taxRegime === 'new' ? (
              <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
                Formula: ₹{Math.round(annualGross).toLocaleString('en-IN')} (Gross) - ₹75,000 (Standard Deduction) = Taxable Income<br/>
                <span style={{ color: '#1e40af', fontWeight: 700 }}>Taxable Base = ₹{Math.round(taxableIncome).toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.7 }}>
                Formula: ₹{Math.round(annualGross).toLocaleString('en-IN')} (Gross) - ₹{Math.round(annualGross - taxableIncome).toLocaleString('en-IN')} (Total Deductions) = Taxable Income<br/>
                <span style={{ color: '#1e40af', fontWeight: 700 }}>Taxable Base = ₹{Math.round(taxableIncome).toLocaleString('en-IN')}</span>
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
            {variableTaxMode === 'lump_sum' && variableInducedTax > 0 ? (
              <>
                <div style={{ fontFamily: 'monospace', color: '#7dd3fc', fontSize: 11, lineHeight: 1.8 }}>
                  Regular TDS = (Annual Tax without Variable − TDS So Far) ÷ Remaining Months<br/>
                  Variable-Induced Tax = ₹{(annualTax - (tds - variableInducedTax)).toLocaleString(undefined, { maximumFractionDigits: 2 })} (incremental tax on variable pay)<br/>
                  <span style={{ color: '#fbbf24' }}>This Month’s TDS = Regular TDS + Variable-Induced Tax</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Variable-induced tax: ₹{variableInducedTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                    ₹ {tds.toLocaleString(undefined, { maximumFractionDigits: 2 })} / month
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'monospace', color: '#7dd3fc', fontSize: 11, lineHeight: 1.8 }}>
                  = (Annual Tax − Total TDS So Far) ÷ Remaining Months<br/>
                  = (₹{Math.round(annualTax).toLocaleString()} − ₹{(Number(tdsDeductedSoFar) + Number(previousEmployerTDS)).toLocaleString()}) ÷ {monthsRemaining} months
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 8 }}>
                  = ₹ {tds.toLocaleString(undefined, {maximumFractionDigits: 2})} / month
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
