import React, { useRef } from 'react';
import * as XLSX from 'xlsx';

export default function Step0_SalaryBreakdown({ state }) {
  const { 
    salaryComponents, updateComponent, addComponent, removeComponent, 
    standardGross, totalMonthlyCTC, monthlyReimbursements, employerContribs,
    setData
  } = state;

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const newComps = data.map((row, idx) => {
        const name = row['Name'] || row['Component'] || `Imported Component ${idx + 1}`;
        let typeVal = 'earnings_allowance';
        const t = String(row['Type'] || '').toLowerCase();
        
        if (t.includes('basic')) typeVal = 'earnings_basic';
        else if (t.includes('hra')) typeVal = 'earnings_hra';
        else if (t.includes('variable') || t.includes('bonus')) typeVal = 'variable';
        else if (t.includes('reimbursement')) typeVal = 'reimbursement';
        else if (t.includes('employer') || t.includes('er')) typeVal = 'employer_contrib';
        else if (t.includes('deduction') || t.includes('ee')) typeVal = 'employee_deduction';
        
        return {
          id: Date.now().toString() + '_' + idx,
          name: name,
          type: typeVal,
          amount: Number(row['Amount']) || 0,
          currentPayout: 0
        };
      });

      if (newComps.length > 0) {
        setData(prev => ({ ...prev, salaryComponents: newComps }));
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  return (
    <div className="sim-card sim-card-blue">
      <div className="sim-card-header">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h3 style={{margin: 0}}>Step 0: Component Builder</h3>
            <p style={{margin: '4px 0 0 0', fontSize: 13, color: '#64748b'}}>Build the employee's CTC structure manually or via Excel.</p>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              style={{background: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600}}>
              📁 Upload Excel
            </button>
            <button 
              onClick={addComponent}
              style={{background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600}}>
              + Add Component
            </button>
          </div>
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
                <option value="variable">Variable Earnings (Bonus/PLI)</option>
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

        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0'}}>
          <label style={{fontWeight: 600, fontSize: 13, color: '#334155', minWidth: 200}}>Global EPF Calculation Basis:</label>
          <select 
            value={state.epfCalculationMethod || 'prorated_ceiling'} 
            onChange={(e) => state.updateData('epfCalculationMethod', e.target.value)}
            style={{padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: 'white', flex: 1}}>
            <option value="prorated_ceiling">Statutory Ceiling (12% of Basic, max 1,800/mo prorated by LOP)</option>
            <option value="flat_ceiling">Flat Amount (Fixed at 1,800/mo regardless of LOP)</option>
            <option value="actual_basic">Actual Basic (12% of Basic, Uncapped)</option>
          </select>
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
