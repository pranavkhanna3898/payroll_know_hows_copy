import React from 'react';

export default function Step1_Salary({ state }) {
  const {
    daysInMonth, lopDays, overtimeHours, otRate, leaveEncashmentDays, exit_date, exit_reason, arrearEntries,
    updateData, standardBasic, standardHRA, standardSpecial, salaryComponents, updateComponent, addArrearEntry, updateArrearEntry, removeArrearEntry,
    basic, hra, special, overtimePay, arrearsPay, leaveEncashmentPay, variablePay, grossSalary, attendanceFactor,
    monthlyReimbursements, reimbursementTaxStrategy
  } = state;

  const variableComps = salaryComponents.filter(c => c.type === 'variable');
  const standardGross = standardBasic + standardHRA + standardSpecial;

  return (
    <div className="sim-card sim-card-blue">
      <div className="sim-card-header">
        <h3>Step 1: Attendance & Gross Salary</h3>
        <p>Convert CTC to monthly gross based on attendance and variable inputs.</p>
      </div>

      <div className="sim-card-body">
        <div className="sim-input-grid">
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Total of all fixed standard components + monthly variable targets. Unprorated.">Base Monthly Gross (Step 0) <span className="tooltip-icon">?</span></label>
            <input type="number" value={standardGross} disabled style={{background: '#f1f5f9'}} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Total calendar days for the execution month.">Days in Month <span className="tooltip-icon">?</span></label>
            <input type="number" value={daysInMonth} onChange={(e) => updateData('daysInMonth', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Unpaid leaves. Directly reduces the standard attendance factor.">LOP (Loss of Pay) Days <span className="tooltip-icon">?</span></label>
            <input type="number" value={lopDays} onChange={(e) => updateData('lopDays', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Count of statutory OT hours to be paid.">Overtime Hours <span className="tooltip-icon">?</span></label>
            <input type="number" value={overtimeHours} onChange={(e) => updateData('overtimeHours', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Hourly multiplier for Overtime standard formula.">OT Rate/Hr (₹) <span className="tooltip-icon">?</span></label>
            <input type="number" value={otRate} onChange={(e) => updateData('otRate', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Divided against Base Monthly Gross / 26 days.">Leave Encashment (Days) <span className="tooltip-icon">?</span></label>
            <input type="number" value={leaveEncashmentDays} onChange={(e) => updateData('leaveEncashmentDays', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Employee exit date, triggers fractional months computation.">Exit Date <span className="tooltip-icon">?</span></label>
            <input type="date" value={exit_date || ''} onChange={(e) => updateData('exit_date', e.target.value)} />
          </div>
          <div className="sim-input-group">
            <label className="has-tooltip" data-tooltip="Select 'Retirement' to enable maximum ₹25 Lakhs tax exemption for encashments.">Exit Reason <span className="tooltip-icon">?</span></label>
            <select value={exit_reason || ''} onChange={(e) => updateData('exit_reason', e.target.value)} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}>
              <option value="">-- Active / Normal Exit --</option>
              <option value="Resignation">Resignation</option>
              <option value="Termination">Termination</option>
              <option value="Retirement">Retirement (Superannuation)</option>
            </select>
          </div>
        </div>

        {variableComps.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: 13, marginBottom: 8, color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>Variable Payouts (Current Month)</h4>
            <div className="sim-input-grid">
              {variableComps.map(comp => (
                <div key={comp.id} className="sim-input-group">
                  <label className="has-tooltip" data-tooltip={`Annual/Fixed target is ₹${comp.amount}`}>{comp.name} Target: ₹{comp.amount} <span className="tooltip-icon">?</span></label>
                  <input 
                    type="number" 
                    value={comp.currentPayout || ''} 
                    onChange={(e) => updateComponent(comp.id, 'currentPayout', e.target.value)} 
                    placeholder="Enter manual payout"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
            <h4 style={{ fontSize: 13, color: '#475569', margin: 0 }}>Arrears Data</h4>
            <button onClick={addArrearEntry} style={{ background: '#e2e8f0', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>+ Add Month</button>
          </div>
          {arrearEntries.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>No arrears applied.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {arrearEntries.map(entry => (
                <div key={entry.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div className="sim-input-group" style={{ flex: 1.5, margin: 0 }}>
                     <label className="has-tooltip" data-tooltip="The exact historical month where the shortage occurred." style={{marginBottom: 4}}>Historical Month Baseline <span className="tooltip-icon">?</span></label>
                     <select 
                       value={entry.monthName || 'January'} 
                       onChange={(e) => {
                         const val = e.target.value;
                         const daysMap = {
                           'January': 31, 'February (Regular)': 28, 'February (Leap)': 29, 'March': 31,
                           'April': 30, 'May': 31, 'June': 30, 'July': 31, 'August': 31,
                           'September': 30, 'October': 31, 'November': 30, 'December': 31
                         };
                         updateArrearEntry(entry.id, 'monthName', val);
                         // Small hack to ensure monthDays updates simultaneously without modifying simState signature
                         setTimeout(() => updateArrearEntry(entry.id, 'monthDays', daysMap[val] || 30), 0);
                       }} 
                       style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', fontSize: 13, width: '100%' }}>
                       {['January', 'February (Regular)', 'February (Leap)', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                         <option key={m} value={m}>{m}</option>
                       ))}
                     </select>
                  </div>
                  <div className="sim-input-group" style={{ flex: 1, margin: 0 }}>
                     <label className="has-tooltip" data-tooltip="The Base CTC in effect during that specific time frame, overriding recent appraisals." style={{marginBottom: 4}}>Historical Gross <span className="tooltip-icon">?</span></label>
                     <input 
                       type="number" 
                       placeholder={`Current: ${standardGross}`}
                       value={entry.historicalGross || ''} 
                       onChange={(e) => updateArrearEntry(entry.id, 'historicalGross', e.target.value)} 
                       style={{margin: 0, width: '100%', boxSizing: 'border-box'}} 
                     />
                  </div>
                  <div className="sim-input-group" style={{ flex: 1, margin: 0 }}>
                     <label className="has-tooltip" data-tooltip="Discrete shortage days to be accurately fractioned." style={{marginBottom: 4}}>Payable Arrear Days <span className="tooltip-icon">?</span></label>
                     <input type="number" value={entry.arrearDays} onChange={(e) => updateArrearEntry(entry.id, 'arrearDays', e.target.value)} style={{margin: 0, width: '100%', boxSizing: 'border-box'}} />
                  </div>
                  <button onClick={() => removeArrearEntry(entry.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', height: 35, width: 35, borderRadius: 6, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sim-output-box" style={{ marginTop: 24 }}>
          <h4>Calculation Breakup: Attendance Proration &amp; Gross</h4>

          {/* Step ① */}
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>① Attendance Factor</div>
            <div style={{ color: '#64748b', fontFamily: 'monospace' }}>
              = (Days in Month − LOP Days) ÷ Days in Month<br/>
              = ({daysInMonth} − {lopDays}) ÷ {daysInMonth}<br/>
              <span style={{ color: '#1e40af', fontWeight: 700 }}>= {attendanceFactor.toFixed(6)}</span>
            </div>
          </div>

          {/* Step ② */}
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>② Prorated Fixed Earnings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', color: '#64748b' }}>
              <div>Basic : ₹{standardBasic.toLocaleString()} × {attendanceFactor.toFixed(4)} = <strong style={{color:'#0f172a'}}>₹{Math.round(basic).toLocaleString()}</strong></div>
              <div>HRA   : ₹{standardHRA.toLocaleString()} × {attendanceFactor.toFixed(4)} = <strong style={{color:'#0f172a'}}>₹{Math.round(hra).toLocaleString()}</strong></div>
              <div>Allow : ₹{standardSpecial.toLocaleString()} × {attendanceFactor.toFixed(4)} = <strong style={{color:'#0f172a'}}>₹{Math.round(special).toLocaleString()}</strong></div>
            </div>
          </div>

          {/* Step ③ — Additions */}
          {(overtimePay > 0 || leaveEncashmentPay > 0 || variablePay > 0 || arrearsPay > 0 || (reimbursementTaxStrategy === 'monthly' && monthlyReimbursements > 0)) && (
            <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>③ Additional Components</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', color: '#64748b' }}>
                {overtimePay > 0 && <div>Overtime : {overtimeHours} hrs × ₹{otRate}/hr = <strong style={{color:'#15803d'}}>₹{Math.round(overtimePay).toLocaleString()}</strong></div>}
                {leaveEncashmentPay > 0 && <div>Encashment : (₹{standardGross.toLocaleString()} ÷ 26) × {leaveEncashmentDays} days = <strong style={{color:'#15803d'}}>₹{Math.round(leaveEncashmentPay).toLocaleString()}</strong></div>}
                {variableComps.map(v => v.currentPayout > 0 && (
                  <div key={v.id}>Variable ({v.name}) : <strong style={{color:'#15803d'}}>₹{Math.round(v.currentPayout).toLocaleString()}</strong></div>
                ))}
                {arrearsPay > 0 && <div>Arrears (historical prorated) : <strong style={{color:'#15803d'}}>₹{Math.round(arrearsPay).toLocaleString()}</strong></div>}
                {reimbursementTaxStrategy === 'monthly' && monthlyReimbursements > 0 && <div>Reimbursements (taxed monthly) : <strong style={{color:'#15803d'}}>₹{Math.round(monthlyReimbursements * attendanceFactor).toLocaleString()}</strong></div>}
              </div>
            </div>
          )}

          {/* Total */}
          <div style={{ background: '#1e293b', borderRadius: 6, padding: '12px 14px', fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>④ Gross Salary = Σ All Prorated Components</div>
            <div style={{ fontFamily: 'monospace', color: '#7dd3fc', fontSize: 11, lineHeight: 1.8 }}>
              ₹{Math.round(basic).toLocaleString()} (Basic)
              + ₹{Math.round(hra).toLocaleString()} (HRA)
              + ₹{Math.round(special).toLocaleString()} (Allow)
              {overtimePay > 0 && ` + ₹${Math.round(overtimePay).toLocaleString()} (OT)`}
              {leaveEncashmentPay > 0 && ` + ₹${Math.round(leaveEncashmentPay).toLocaleString()} (LE)`}
              {variablePay >= 0 && ` + ₹${Math.round(variablePay || 0).toLocaleString()} (Var)`}
              {arrearsPay > 0 && ` + ₹${Math.round(arrearsPay).toLocaleString()} (Arr)`}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 8 }}>
              = ₹ {Math.round(grossSalary).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
