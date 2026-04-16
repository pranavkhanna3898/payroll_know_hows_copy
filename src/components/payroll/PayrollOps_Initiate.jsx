import { useState } from 'react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const STATUS_COLORS = {
  initiated: { bg: '#fef3c7', color: '#b45309', label: 'Initiated' },
  reviewed: { bg: '#dbeafe', color: '#1d4ed8', label: 'Reviewed' },
  tax_checked: { bg: '#e0e7ff', color: '#4338ca', label: 'Tax Checked' },
  confirmed: { bg: '#d1fae5', color: '#065f46', label: 'Confirmed' },
  slips_generated: { bg: '#d1fae5', color: '#065f46', label: 'Slips Generated' },
};

export default function PayrollOps_Initiate({ store, onInitiate, onOpenPayrun, onDeletePayrun }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState(store.employees.map(e => e.id));
  const [view, setView] = useState('new'); // 'new' | 'history'

  const fmt = v => Math.round(v || 0).toLocaleString('en-IN');
  
  const DEPTS = [...new Set(store.employees.map(e => e.department))];
  const [deptFilter, setDeptFilter] = useState('All');

  const filtered = deptFilter === 'All' ? store.employees : store.employees.filter(e => e.department === deptFilter);

  const toggleEmp = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(filtered.map(e => e.id));
  const deselectAll = () => setSelected([]);

  const selectedEmps = store.employees.filter(e => selected.includes(e.id));
  const totalCTC = selectedEmps.reduce((sum, e) => {
    const gross = (e.salary_structure || [])
      .filter(c => ['earnings_basic','earnings_hra','earnings_allowance','variable'].includes(c.type))
      .reduce((s, c) => s + Number(c.amount || 0), 0);
    return sum + gross;
  }, 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#f1f5f9', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[['new','🚀 New Payrun'],['history','📂 Payrun History']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13, background: view === v ? 'white' : 'transparent', color: view === v ? '#1e40af' : '#64748b', boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'new' ? (
        <>
          {/* Month/Year selector + summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="sim-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Payroll Month</div>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, outline: 'none' }}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="sim-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Payroll Year</div>
              <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, outline: 'none' }} />
            </div>
            <div className="sim-card" style={{ padding: 20, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', marginBottom: 8 }}>Selected Employees</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{selected.length}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Est. Gross: ₹{fmt(totalCTC)}</div>
            </div>
          </div>

          {/* Employee Roster */}
          <div className="sim-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Employee Roster</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, outline: 'none' }}>
                  <option value="All">All Departments</option>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
                <button onClick={selectAll} style={{ padding: '6px 12px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Select All</button>
                <button onClick={deselectAll} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Deselect All</button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {['','Emp Code','Name','Designation','Department','Joining Date','Regime'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} onClick={() => toggleEmp(e.id)} style={{ cursor: 'pointer', background: selected.includes(e.id) ? '#f0f9ff' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleEmp(e.id)} onClick={ev => ev.stopPropagation()} />
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontSize: 12 }}>{e.emp_code}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{e.name}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{e.designation}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>{e.department}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{e.date_of_joining}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ background: (e.tax_regime || 'new') === 'new' ? '#d1fae5' : '#fef3c7', color: (e.tax_regime || 'new') === 'new' ? '#065f46' : '#b45309', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                          {(e.tax_regime || 'new').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => selected.length > 0 && onInitiate(month, year, selected)}
                disabled={selected.length === 0}
                style={{ padding: '12px 28px', background: selected.length > 0 ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e2e8f0', color: selected.length > 0 ? 'white' : '#94a3b8', border: 'none', borderRadius: 8, cursor: selected.length > 0 ? 'pointer' : 'default', fontWeight: 700, fontSize: 14 }}
              >
                🚀 Initiate Payrun for {MONTHS[month - 1]} {year} ({selected.length} employees)
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="sim-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Payrun History</h3>
          </div>
          {(store.payruns || []).length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No payruns yet. Start by creating a new payrun above.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Payrun ID','Month','Started On','Status',''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {store.payruns.map(p => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.initiated;
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontSize: 11 }}>{p.id.substring(0, 8)}...</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{p.month_year}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => onOpenPayrun(p)} style={{ padding: '5px 12px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Open →</button>
                          {p.status !== 'confirmed' && (
                            <button onClick={() => onDeletePayrun(p.id)} style={{ padding: '5px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, lineHeight: 1 }} title="Delete Draft">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
