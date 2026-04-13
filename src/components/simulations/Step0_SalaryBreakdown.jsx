import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { CATEGORIES } from '../../data/categories';
import { STATES } from '../../data/states';

const TYPE_LABELS = {
  earnings_basic:     'Earnings — Basic',
  earnings_hra:       'Earnings — HRA',
  earnings_allowance: 'Earnings — Taxable Allowance',
  variable:           'Variable (Bonus / PLI)',
  reimbursement:      'Reimbursement (Exempt)',
  employer_contrib:   'Employer Contribution',
  employee_deduction: 'Employee Deduction',
};

const TAX_SCHEDULE_OPTIONS = [
  { value: 'monthly',  label: 'Monthly (TDS every cycle)' },
  { value: 'year_end', label: 'Year-End (Deferred / Exempt)' },
];

// Components for which taxSchedule = 'year_end' makes practical sense
const YEAR_END_DEFAULTS = new Set(['reimbursement']);

export default function Step0_SalaryBreakdown({ state }) {
  const {
    salaryComponents, updateComponent, addComponent, removeComponent,
    standardGross, totalMonthlyCTC, monthlyReimbursements, employerContribs,
    inputMode, setData,
  } = state;

  const fileInputRef = useRef(null);

  const MATRIX_COMPONENTS = CATEGORIES.flatMap(cat =>
    cat.components.map(comp => ({ ...comp, categoryId: cat.id }))
  );

  /* ── helpers ─────────────────────────────────────────── */
  const isAnnual = inputMode === 'annual';

  /** Resolve the display-ready value (what user typed) */
  const displayAmount = (comp) => {
    const raw = comp.amount === 0 ? '' : comp.amount;
    return raw;
  };

  /** Computed counterpart shown as read-only: annual ↔ monthly */
  const derivedAmount = (comp) => {
    const val = typeof comp.amount === 'number' ? comp.amount : Number(comp.amount) || 0;
    if (isAnnual) return val === 0 ? '' : Math.round(val / 12).toLocaleString();   // annual entered → show monthly
    return val === 0 ? '' : Math.round(val * 12).toLocaleString();                  // monthly entered → show annual
  };

  /* ── Excel upload ────────────────────────────────────── */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      const newComps = data.map((row, idx) => {
        const name = row['Name'] || row['Component'] || `Imported ${idx + 1}`;
        const t = String(row['Type'] || '').toLowerCase();
        let typeVal = 'earnings_allowance';
        if (t.includes('basic'))         typeVal = 'earnings_basic';
        else if (t.includes('hra'))      typeVal = 'earnings_hra';
        else if (t.includes('variable') || t.includes('bonus')) typeVal = 'variable';
        else if (t.includes('reimbursement')) typeVal = 'reimbursement';
        else if (t.includes('employer') || t.includes('er'))    typeVal = 'employer_contrib';
        else if (t.includes('deduction') || t.includes('ee'))   typeVal = 'employee_deduction';
        return {
          id: Date.now().toString() + '_' + idx,
          name, type: typeVal,
          amount: Number(row['Amount']) || 0,
          currentPayout: 0,
          matrixId: 'custom',
          taxSchedule: YEAR_END_DEFAULTS.has(typeVal) ? 'year_end' : 'monthly',
        };
      });
      if (newComps.length > 0) setData(prev => ({ ...prev, salaryComponents: newComps }));
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  /* ── Pill-button helper ──────────────────────────────── */
  const Pill = ({ active, onClick, children, color = '#2563eb' }) => (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        border: `1px solid ${active ? color : '#cbd5e1'}`,
        background: active ? color : '#fff',
        color: active ? '#fff' : '#64748b',
        cursor: 'pointer', transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
  );

  /* ── Column header helper ────────────────────────────── */
  const ColHead = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
      {children}
    </div>
  );

  return (
    <div className="sim-card sim-card-blue">
      <div className="sim-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Row 1: Title + Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: '1 1 280px' }}>
              <h3 style={{ margin: 0 }}>Step 0: Component Builder</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                Build the CTC structurally. Formulas like <code>basic * 0.40</code> are supported.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current.click()}
                style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                📁 Upload Excel
              </button>
              <button
                onClick={addComponent}
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Add Component
              </button>
            </div>
          </div>

          {/* Row 2: Config toggles */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Region */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Region:</label>
              <select
                value={state.selectedState}
                onChange={(e) => state.updateData('selectedState', e.target.value)}
                style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, outline: 'none' }}>
                {STATES.map(st => <option key={st.code} value={st.code}>{st.name} ({st.code})</option>)}
              </select>
              <input
                type="text" placeholder="City"
                value={state.selectedCity}
                onChange={(e) => state.updateData('selectedCity', e.target.value)}
                style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, outline: 'none', width: 80 }}
              />
            </div>

            {/* Global Reims Rule */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Global Reims:</label>
              <select
                value={state.reimbursementTaxStrategy}
                onChange={(e) => state.updateData('reimbursementTaxStrategy', e.target.value)}
                style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, outline: 'none' }}>
                <option value="year_end">Year-End (Exempt)</option>
                <option value="monthly">Tax Monthly</option>
              </select>
            </div>

            {/* Input Mode Toggle */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Input Mode:</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <Pill active={!isAnnual} onClick={() => state.updateData('inputMode', 'monthly')} color="#0369a1">
                  Monthly Values
                </Pill>
                <Pill active={isAnnual} onClick={() => state.updateData('inputMode', 'annual')} color="#7c3aed">
                  Annual Values
                </Pill>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="sim-card-body">

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px,1.8fr) minmax(130px,1.2fr) 150px 140px 90px 28px',
          gap: 10, alignItems: 'end', marginBottom: 6, paddingBottom: 6,
          borderBottom: '1px solid #e2e8f0'
        }}>
          <ColHead>Component</ColHead>
          <ColHead>Type</ColHead>
          <ColHead>
            {isAnnual ? '🟣 Annual Value' : '🔵 Monthly Value'}
            <span style={{ color: '#7c3aed', marginLeft: 4 }}>{isAnnual ? '(editable)' : ''}</span>
          </ColHead>
          <ColHead>
            {isAnnual ? '🔵 Monthly (Auto ÷12)' : '🟣 Annual (Auto ×12)'}
            <span style={{ color: '#0369a1', marginLeft: 4 }}>{!isAnnual ? '(editable)' : ''}</span>
          </ColHead>
          <ColHead>Tax Schedule</ColHead>
          <ColHead />
        </div>

        {/* Component rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {salaryComponents.map((comp) => {
            const matchedMatrix = MATRIX_COMPONENTS.find(c => c.id === comp.matrixId);
            const isNotApplicable = matchedMatrix?.states?.[state.selectedState] === 'N';
            const taxSched = comp.taxSchedule || (YEAR_END_DEFAULTS.has(comp.type) ? 'year_end' : 'monthly');

            return (
              <React.Fragment key={comp.id}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px,1.8fr) minmax(130px,1.2fr) 150px 140px 90px 28px',
                  gap: 10, alignItems: 'flex-start',
                }}>

                  {/* ① Component selector + custom name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <select
                      value={comp.matrixId || 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          updateComponent(comp.id, 'matrixId', 'custom');
                          updateComponent(comp.id, 'name', '');
                        } else {
                          const matched = MATRIX_COMPONENTS.find(c => c.id === val);
                          updateComponent(comp.id, 'matrixId', val);
                          updateComponent(comp.id, 'name', matched.name);
                        }
                      }}
                      style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="custom">-- Custom Component --</option>
                      {CATEGORIES.map(cat => (
                        <optgroup key={cat.id} label={cat.name}>
                          {cat.components.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {(!comp.matrixId || comp.matrixId === 'custom') && (
                      <input
                        type="text" value={comp.name}
                        onChange={(e) => updateComponent(comp.id, 'name', e.target.value)}
                        placeholder="Custom Rule Name..."
                        style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, width: '100%', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>

                  {/* ② Type */}
                  <select
                    value={comp.type}
                    onChange={(e) => {
                      updateComponent(comp.id, 'type', e.target.value);
                      // auto-set tax schedule for reimbursements
                      if (YEAR_END_DEFAULTS.has(e.target.value) && !comp.taxSchedule) {
                        updateComponent(comp.id, 'taxSchedule', 'year_end');
                      }
                    }}
                    style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: 'white', width: '100%', boxSizing: 'border-box' }}
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>

                  {/* ③ Primary value input (editable column) */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 9, top: 8, color: '#7c3aed', fontSize: 10, fontWeight: 800 }}>
                      {isAnnual ? '₹/yr' : 'ƒ(x)'}
                    </span>
                    <input
                      type="text"
                      value={displayAmount(comp)}
                      onChange={(e) => updateComponent(comp.id, 'amount', e.target.value)}
                      placeholder={
                        (!comp.amount && comp._resolvedAmount > 0)
                          ? `Auto: ₹${Math.round(isAnnual ? comp._resolvedAmount * 12 : comp._resolvedAmount)}`
                          : isAnnual ? 'Annual amount...' : 'Value or formula...'
                      }
                      style={{
                        padding: '7px 8px 7px 38px', borderRadius: 6,
                        border: '1px solid #a78bfa',
                        fontSize: 12, width: '100%', boxSizing: 'border-box',
                        background: '#faf5ff',
                      }}
                    />
                  </div>

                  {/* ④ Derived read-only counterpart */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 9, top: 8, color: '#0369a1', fontSize: 10, fontWeight: 800 }}>
                      {isAnnual ? '₹/mo' : '₹/yr'}
                    </span>
                    <input
                      type="text"
                      value={derivedAmount(comp)}
                      disabled
                      placeholder="—"
                      style={{
                        padding: '7px 8px 7px 38px', borderRadius: 6,
                        border: '1px solid #bae6fd',
                        fontSize: 12, width: '100%', boxSizing: 'border-box',
                        background: '#f0f9ff', color: '#0369a1', fontWeight: 600,
                      }}
                    />
                  </div>

                  {/* ⑤ Tax Schedule */}
                  <select
                    value={taxSched}
                    onChange={(e) => updateComponent(comp.id, 'taxSchedule', e.target.value)}
                    style={{
                      padding: '7px 6px', borderRadius: 6, fontSize: 11, width: '100%',
                      boxSizing: 'border-box', outline: 'none',
                      border: taxSched === 'year_end' ? '1px solid #fbbf24' : '1px solid #86efac',
                      background: taxSched === 'year_end' ? '#fffbeb' : '#f0fdf4',
                      color: taxSched === 'year_end' ? '#92400e' : '#166534',
                      fontWeight: 600,
                    }}
                  >
                    {TAX_SCHEDULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>

                  {/* ⑥ Remove */}
                  <button
                    onClick={() => removeComponent(comp.id)}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, marginTop: 1 }}
                  >✕</button>
                </div>

                {/* Legal warning */}
                {isNotApplicable && (
                  <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginTop: -4, marginLeft: 2 }}>
                    ⚠️ {matchedMatrix.name} is legally not applicable in {STATES.find(s => s.code === state.selectedState)?.name || state.selectedState}.
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* EPF Calc Method */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <label className="has-tooltip" data-tooltip="Dictates how the 12% statutory EPF deduction responds to attendance & LOP constraints." style={{ fontWeight: 600, fontSize: 13, color: '#334155', minWidth: 200 }}>
            Global EPF Calculation Basis: <span className="tooltip-icon">?</span>
          </label>
          <select
            value={state.epfCalculationMethod || 'prorated_ceiling'}
            onChange={(e) => state.updateData('epfCalculationMethod', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: 'white', flex: 1 }}
          >
            <option value="prorated_ceiling">Statutory Ceiling (12% of Basic, max ₹1,800/mo prorated by LOP)</option>
            <option value="flat_ceiling">Flat Amount (Fixed at ₹1,800/mo regardless of LOP)</option>
            <option value="actual_basic">Actual Basic (12% of Basic, Uncapped)</option>
          </select>
        </div>

        {/* CTC Summary */}
        <div className="sim-output-box">
          <h4>CTC Breakup — {isAnnual ? 'Annual Input Mode (÷12 → Monthly)' : 'Monthly Input Mode (×12 → Annual)'}</h4>
          <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontFamily: 'monospace', color: '#64748b', lineHeight: 1.8 }}>
              Standard Gross = Basic + HRA + Allowances{state.reimbursementTaxStrategy === 'monthly' ? ' + Reimbursements' : ''}
            </div>
          </div>
          <div className="sim-line-item">
            <span>Standard Gross Base:</span>
            <span>₹ {Math.round(standardGross).toLocaleString()}/mo</span>
          </div>
          <div className="sim-line-item">
            <span>Reimbursements + Employer Contribs:</span>
            <span>+ ₹ {Math.round(monthlyReimbursements + employerContribs).toLocaleString()}/mo</span>
          </div>
          <div className="sim-line-item sim-total" style={{ margin: '8px 0' }}>
            <span>Total Monthly CTC:</span>
            <span>₹ {Math.round(totalMonthlyCTC).toLocaleString()}</span>
          </div>
          <div className="sim-line-item">
            <span>Implied Annual CTC (×12):</span>
            <span style={{ fontWeight: 700, color: '#0369a1' }}>₹ {(totalMonthlyCTC * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
