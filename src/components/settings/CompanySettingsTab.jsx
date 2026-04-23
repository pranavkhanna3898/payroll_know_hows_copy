import { useState, useEffect } from 'react';
import { getDefaults } from '../../data/settingsStore';
import { STATES } from '../../data/states';
import { 
  getCompanySettings, saveCompanySettings, 
  getEmployees, upsertEmployee, deleteEmployee 
} from '../../data/api';
import { CATEGORIES } from '../../data/categories';
import { getPT, getLWF } from '../../data/payrollEngine';

const MATRIX_COMPONENTS = CATEGORIES.flatMap(cat => 
  cat.components.map(comp => ({ ...comp, categoryId: cat.id }))
);

const SECTIONS = [
  { id: 'company',    icon: '🏢', label: 'Company Profile' },
  { id: 'statutory',  icon: '📋', label: 'Statutory Compliance' },
  { id: 'cycle',      icon: '🔄', label: 'Payroll Cycle' },
  { id: 'bank',       icon: '🏦', label: 'Bank Integration' },
  { id: 'structure',  icon: '⚙️', label: 'Salary Structure' },
  { id: 'employees',  icon: '👥', label: 'Employees' },
  { id: 'submissions',icon: '📅', label: 'Submission Windows' },
];

const Field = ({ label, children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: 10, color: '#94a3b8' }}>{hint}</span>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, disabled, type = 'text' }) => (
  <input
    type={type}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none', width: '100%', background: disabled ? '#f1f5f9' : 'white' }}
  />
);

const Grid = ({ children, cols = 2 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>{children}</div>
);

const SectionCard = ({ title, icon, children, action }) => (
  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
    <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      </div>
      {action}
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const Pill = ({ active, children, onClick, color = '#2563eb' }) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '10px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: `1.5px solid ${active ? color : '#cbd5e1'}`,
      background: active ? color : 'transparent',
      color: active ? 'white' : '#64748b',
    }}
  >
    {children}
  </button>
);

// ── Comp: EmployeeManagement ──────────────────────────────────────────────────
function EmployeeManagement({ settings }) {
  const [employees, setEmployees] = useState([]);
  const [editingEmp, setEditingEmp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleAdd() {
    setEditingEmp({
      emp_code: `EMP${1000 + employees.length + 1}`,
      name: '',
      department: 'Technology',
      designation: 'Software Engineer',
      work_state: 'KA',
      work_city: 'Bengaluru',
      base_state: 'KA',
      base_city: 'Bengaluru',
      salary_structure: JSON.parse(JSON.stringify(settings.defaultSalaryComponents || [])),
      input_mode: settings.defaultInputMode || 'monthly',
      bank_info: { bank_name: '', account_no: '', ifsc: '' },
      is_active: true,
      exit_date: null,
      exit_reason: ''
    });
  }

  async function handleSave() {
    try {
      await upsertEmployee(editingEmp);
      setEditingEmp(null);
      fetchEmployees();
    } catch (e) { alert('Error saving employee: ' + e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await deleteEmployee(id);
      fetchEmployees();
    } catch (e) { alert('Error deleting: ' + e.message); }
  }

const convertStructure = (structure, toAnnual) => {
  return (structure || []).map(c => {
    const val = parseFloat(c.amount);
    if (isNaN(val)) return c;
    const newVal = toAnnual ? val * 12 : val / 12;
    return { ...c, amount: Math.round(newVal) };
  });
};

  if (editingEmp) {
    const isAnnual = editingEmp.input_mode === 'annual';

    return (
      <div style={{ animation: 'fadeIn 0.2s' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setEditingEmp(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>← Back to List</button>
          <h2 style={{ margin: 0, fontSize: 16 }}>{editingEmp.id ? 'Edit Employee' : 'Add New Employee'}</h2>
        </div>

        <SectionCard title="Basic Information" icon="👤">
          <Grid cols={3}>
            <Field label="Employee Code"><TextInput value={editingEmp.emp_code} onChange={v => setEditingEmp({...editingEmp, emp_code: v})} /></Field>
            <Field label="Full Name"><TextInput value={editingEmp.name} onChange={v => setEditingEmp({...editingEmp, name: v})} /></Field>
            <Field label="Department"><TextInput value={editingEmp.department} onChange={v => setEditingEmp({...editingEmp, department: v})} /></Field>
            <Field label="Designation"><TextInput value={editingEmp.designation} onChange={v => setEditingEmp({...editingEmp, designation: v})} /></Field>
            <Field label="Status">
              <select value={String(editingEmp.is_active)} onChange={e => setEditingEmp({...editingEmp, is_active: e.target.value === 'true'})}
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: '100%' }}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
          </Grid>
        </SectionCard>

        <SectionCard title="Employment Lifecycle" icon="🚪">
          <Grid cols={3}>
            <Field label="Exit Date (Optional)">
              <input 
                type="date" 
                value={editingEmp.exit_date || ''} 
                onChange={e => setEditingEmp({...editingEmp, exit_date: e.target.value})} 
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: '100%' }}
              />
            </Field>
            <Field label="Exit Reason">
              <select value={editingEmp.exit_reason || ''} onChange={e => setEditingEmp({...editingEmp, exit_reason: e.target.value})}
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: '100%' }}>
                <option value="">None / Active</option>
                <option value="Resignation">Resignation</option>
                <option value="Termination">Termination</option>
                <option value="Retirement">Retirement (Superannuation)</option>
              </select>
            </Field>
          </Grid>
        </SectionCard>

        <SectionCard title="Location Settings" icon="📍">
          <Grid cols={2}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#334155' }}>🏢 Work Location (Used for PT / LWF)</div>
              <Grid cols={2}>
                <Field label="Work State">
                  <select value={editingEmp.work_state || 'KA'} onChange={e => setEditingEmp({...editingEmp, work_state: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: '100%' }}>
                    {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Work City"><TextInput value={editingEmp.work_city} onChange={v => setEditingEmp({...editingEmp, work_city: v})} /></Field>
              </Grid>
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#334155' }}>🏠 Base Location (Used for calculation of HRA)</div>
              <Grid cols={2}>
                <Field label="Base State">
                  <select value={editingEmp.base_state || 'KA'} onChange={e => setEditingEmp({...editingEmp, base_state: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: '100%' }}>
                    {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Base City"><TextInput value={editingEmp.base_city} onChange={v => setEditingEmp({...editingEmp, base_city: v})} /></Field>
              </Grid>
            </div>
          </Grid>
        </SectionCard>

        <SectionCard title="Bank Details" icon="🏦">
          <Grid cols={3}>
            <Field label="Bank Name"><TextInput value={editingEmp.bank_info?.bank_name} onChange={v => setEditingEmp({...editingEmp, bank_info: {...editingEmp.bank_info, bank_name: v}})} /></Field>
            <Field label="Account Number"><TextInput value={editingEmp.bank_info?.account_no} onChange={v => setEditingEmp({...editingEmp, bank_info: {...editingEmp.bank_info, account_no: v}})} /></Field>
            <Field label="IFSC Code"><TextInput value={editingEmp.bank_info?.ifsc} onChange={v => setEditingEmp({...editingEmp, bank_info: {...editingEmp.bank_info, ifsc: v}})} /></Field>
          </Grid>
        </SectionCard>

        <SectionCard 
          title="Individual Salary Structure" 
          icon="💰"
          action={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#f1f5f9', padding: '4px 8px', borderRadius: 20 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Entry:</span>
              <Pill 
                active={!isAnnual} 
                onClick={() => {
                  if (isAnnual) setEditingEmp({ ...editingEmp, input_mode: 'monthly', salary_structure: convertStructure(editingEmp.salary_structure, false) });
                }} 
                color="#0369a1"
              >Monthly</Pill>
              <Pill 
                active={isAnnual} 
                onClick={() => {
                  if (!isAnnual) setEditingEmp({ ...editingEmp, input_mode: 'annual', salary_structure: convertStructure(editingEmp.salary_structure, true) });
                }} 
                color="#7c3aed"
              >Annual</Pill>
            </div>
          }
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Component', 'Type', 'Amount / Formula', 'Tax Schedule', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editingEmp.salary_structure.map((c, idx) => {
                const isCustom = !c.matrixId || c.matrixId === 'custom';
                return (
                  <tr key={c.id}>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <select
                          value={c.matrixId || 'custom'}
                          onChange={e => {
                            const val = e.target.value;
                            const updated = [...editingEmp.salary_structure];
                            if (val === 'custom') {
                              updated[idx] = { ...c, matrixId: 'custom', name: '' };
                            } else {
                              const matched = MATRIX_COMPONENTS.find(m => m.id === val);
                              updated[idx] = { ...c, matrixId: val, name: matched.name, type: matched.type };
                            }
                            setEditingEmp({...editingEmp, salary_structure: updated});
                          }}
                          style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px', fontSize: 11, width: '100%' }}
                        >
                          <option value="custom">-- Custom --</option>
                          {CATEGORIES.map(cat => (
                            <optgroup key={cat.id} label={cat.name}>
                              {cat.components.map(comp => (
                                <option key={comp.id} value={comp.id}>{comp.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        {isCustom && (
                          <input 
                            value={c.name} 
                            onChange={e => {
                              const updated = editingEmp.salary_structure.map((item, i) => i === idx ? { ...item, name: e.target.value } : item);
                              setEditingEmp({...editingEmp, salary_structure: updated});
                            }} 
                            placeholder="Component Name..."
                            style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 8px', width: '100%', fontSize: 11 }} 
                          />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <select 
                        value={c.type} 
                        onChange={e => {
                          const updated = editingEmp.salary_structure.map((item, i) => i === idx ? { ...item, type: e.target.value } : item);
                          setEditingEmp({...editingEmp, salary_structure: updated});
                        }}
                        style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px', fontSize: 11, width: '100%' }}
                      >
                        <option value="earnings_basic">Basic</option>
                        <option value="earnings_hra">HRA</option>
                        <option value="earnings_allowance">Allowance</option>
                        <option value="variable">Variable</option>
                        <option value="reimbursement">Reimbursement</option>
                        <option value="employer_contrib">Employer Share</option>
                        <option value="employee_deduction">Employee Deduction</option>
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <input value={c.amount} onChange={e => {
                        const updated = editingEmp.salary_structure.map((item, i) => i === idx ? { ...item, amount: e.target.value } : item);
                        setEditingEmp({...editingEmp, salary_structure: updated});
                      }} style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 8px', width: '100%', fontSize: 12, fontFamily: 'monospace' }} />
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <select value={c.taxSchedule} onChange={e => {
                        const updated = editingEmp.salary_structure.map((item, i) => i === idx ? { ...item, taxSchedule: e.target.value } : item);
                        setEditingEmp({...editingEmp, salary_structure: updated});
                      }} style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px', fontSize: 11, width: '100%' }}>
                        <option value="monthly">Monthly</option>
                        <option value="year_end">Year-End</option>
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <button onClick={() => {
                        const updated = editingEmp.salary_structure.filter((_, i) => i !== idx);
                        setEditingEmp({...editingEmp, salary_structure: updated});
                      }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button onClick={() => {
             const newComp = { id: Date.now().toString(), name: '', type: 'earnings_allowance', amount: 0, matrixId: 'custom', taxSchedule: 'monthly' };
             setEditingEmp({...editingEmp, salary_structure: [...editingEmp.salary_structure, newComp]});
          }} style={{ marginTop: 12, padding: '6px 14px', background: '#e2e8f0', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ Add Component</button>
        </SectionCard>

        {(() => {
           // Compliance Check
           const requiresPT = getPT(editingEmp.work_state || 'KA', 100000) > 0;
           const requiresLWF = getLWF(editingEmp.work_state || 'KA') > 0;
           
           const hasPT = editingEmp.salary_structure.some(c => c.matrixId === 'pt');
           const hasLWF = editingEmp.salary_structure.some(c => c.matrixId === 'lwf_ee' || c.matrixId === 'lwf_er');
           
           const warnings = [];
           if (requiresPT && !hasPT) warnings.push(`Work state (${editingEmp.work_state || 'KA'}) requires Professional Tax, but 'pt' component is missing from structure.`);
           if (requiresLWF && !hasLWF) warnings.push(`Work state (${editingEmp.work_state || 'KA'}) requires Labour Welfare Fund, but an LWF component is missing from structure.`);
           
           if (warnings.length > 0) {
             return (
               <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                 <div style={{ fontSize: 14, fontWeight: 700, color: '#b45309', marginBottom: 8 }}>⚠️ Statutory Compliance Warnings</div>
                 <ul style={{ margin: 0, paddingLeft: 20, color: '#92400e', fontSize: 13 }}>
                   {warnings.map((w, i) => <li key={i}>{w}</li>)}
                 </ul>
               </div>
             );
           }
           return null;
        })()}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={() => setEditingEmp(null)} style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Save Employee</button>
        </div>
      </div>
    );
  }

  return (
    <SectionCard title="Employee Roster" icon="👥" action={<button onClick={handleAdd} style={{ padding: '6px 14px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add Employee</button>}>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading employees...</div>
      ) : employees.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No employees found. Add your first employee to get started.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Code', 'Name', 'Department / Designation', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} className="ops-emp-row">
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace' }}>{e.emp_code}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{e.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600 }}>{e.department}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{e.designation}</div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: e.is_active ? '#dcfce7' : '#fee2e2', color: e.is_active ? '#15803d' : '#b91c1c' }}>
                      {e.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setEditingEmp(e)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Existing Sections ────────────────────────────────────────────────────────

function CompanyProfile({ s, update }) {
  return (
    <>
      <SectionCard title="Identity" icon="🪪">
        <Grid cols={3}>
          <Field label="Legal Company Name"><TextInput value={s.companyName} onChange={v => update('companyName', v)} /></Field>
          <Field label="Trade Name (if different)"><TextInput value={s.tradeName} onChange={v => update('tradeName', v)} placeholder="Optional" /></Field>
          <Field label="Industry"><TextInput value={s.industry} onChange={v => update('industry', v)} /></Field>
          <Field label="CIN"><TextInput value={s.cin} onChange={v => update('cin', v)} placeholder="U72900KA2018PTC000000" /></Field>
          <Field label="PAN"><TextInput value={s.pan} onChange={v => update('pan', v)} placeholder="AACCA0000A" /></Field>
          <Field label="TAN"><TextInput value={s.tan} onChange={v => update('tan', v)} placeholder="BLRA00000A" /></Field>
          <Field label="GSTIN"><TextInput value={s.gstin} onChange={v => update('gstin', v)} /></Field>
          <Field label="Incorporation Date"><TextInput value={s.incorporationDate} onChange={v => update('incorporationDate', v)} placeholder="YYYY-MM-DD" /></Field>
          <Field label="Fiscal Year">
            <select value={s.fiscalYear} onChange={e => update('fiscalYear', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
              <option>April–March</option>
              <option>January–December</option>
            </select>
          </Field>
        </Grid>
      </SectionCard>
      <SectionCard title="Address" icon="📍">
        <Grid cols={1}>
          <Field label="Registered Address"><TextInput value={s.regAddress} onChange={v => update('regAddress', v)} /></Field>
          <Field label="Correspondence Address (if different)"><TextInput value={s.corrAddress} onChange={v => update('corrAddress', v)} placeholder="Same as registered" /></Field>
        </Grid>
      </SectionCard>
    </>
  );
}

function StatutoryCompliance({ s, update }) {
  return (
    <>
      <SectionCard title="EPFO" icon="💰">
        <Grid cols={3}>
          <Field label="Establishment Code"><TextInput value={s.epfoCode} onChange={v => update('epfoCode', v)} placeholder="ST/CODE/00000" /></Field>
          <Field label="Registration Date"><TextInput value={s.epfoRegDate} onChange={v => update('epfoRegDate', v)} placeholder="YYYY-MM-DD" /></Field>
          <Field label="EPF Calculation Method">
            <select value={s.epfCalculationMethod} onChange={e => update('epfCalculationMethod', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
              <option value="flat_ceiling">Flat Ceiling (Min 12% Basic, Max ₹1,800)</option>
              <option value="actual_basic">Actual Basic × 12%</option>
              <option value="prorated_ceiling">Prorated Ceiling</option>
            </select>
          </Field>
          <Field label="VPF %" hint="Voluntary PF over statutory"><TextInput type="number" value={s.vpfPercent} onChange={v => update('vpfPercent', Number(v))} /></Field>
          <Field label="Admin Charges %"><TextInput type="number" value={s.adminChargesPercent} onChange={v => update('adminChargesPercent', Number(v))} /></Field>
          <Field label="EDLI Charges %"><TextInput type="number" value={s.edliChargesPercent} onChange={v => update('edliChargesPercent', Number(v))} /></Field>
        </Grid>
      </SectionCard>
      <SectionCard title="ESIC" icon="🏥">
        <Grid cols={3}>
          <Field label="ESIC Employer Code"><TextInput value={s.esicCode} onChange={v => update('esicCode', v)} /></Field>
          <Field label="Registration Date"><TextInput value={s.esicRegDate} onChange={v => update('esicRegDate', v)} placeholder="YYYY-MM-DD" /></Field>
          <Field label="ESIC Region"><TextInput value={s.esicRegion} onChange={v => update('esicRegion', v)} /></Field>
          <Field label="Wage Ceiling (₹)" hint="Employees below this ceiling are covered"><TextInput type="number" value={s.esicWageCeiling} onChange={v => update('esicWageCeiling', Number(v))} /></Field>
        </Grid>
      </SectionCard>
      <SectionCard title="Professional Tax" icon="🏛️">
        <Grid cols={2} style={{ marginBottom: 16 }}>
          <Field label="Half-Yearly PT Deduction Mode" hint="For states like TN, KL, PY">
            <select value={s.ptHalfYearlyMode || 'lump_sum'} onChange={e => update('ptHalfYearlyMode', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
              <option value="lump_sum">Lump Sum (Deduct full in Sep/Mar)</option>
              <option value="prorate">Prorate (Deduct equally each month)</option>
            </select>
          </Field>
        </Grid>
        {s.ptStateRegistrations.map((reg, i) => (
          <Grid key={i} cols={4}>
            <Field label="State">
              <select value={reg.state} onChange={e => {
                const updated = s.ptStateRegistrations.map((r, ri) => ri === i ? { ...r, state: e.target.value } : r);
                update('ptStateRegistrations', updated);
              }} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
                {STATES.map(st => <option key={st.code} value={st.code}>{st.name}</option>)}
              </select>
            </Field>
            <Field label="Registration No"><TextInput value={reg.regNo} onChange={v => {
              const updated = s.ptStateRegistrations.map((r, ri) => ri === i ? { ...r, regNo: v } : r);
              update('ptStateRegistrations', updated);
            }} /></Field>
            <Field label="Frequency">
              <select value={reg.frequency} onChange={e => {
                const updated = s.ptStateRegistrations.map((r, ri) => ri === i ? { ...r, frequency: e.target.value } : r);
                update('ptStateRegistrations', updated);
              }} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
                <option>Monthly</option><option>Quarterly</option><option>Annual</option>
              </select>
            </Field>
            <Field label=" ">
              <button onClick={() => update('ptStateRegistrations', s.ptStateRegistrations.filter((_, ri) => ri !== i))}
                style={{ padding: '8px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                ✕ Remove
              </button>
            </Field>
          </Grid>
        ))}
        <button onClick={() => update('ptStateRegistrations', [...s.ptStateRegistrations, { state: 'KA', regNo: '', frequency: 'Monthly' }])}
          style={{ marginTop: 12, padding: '6px 14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          + Add State
        </button>
      </SectionCard>
    </>
  );
}

function PayrollCycleSettings({ s, update }) {
  return (
    <SectionCard title="Payroll Cycle Configuration" icon="🔄">
      <Grid cols={3}>
        <Field label="Pay Cycle"><TextInput value={s.payCycleType} disabled /></Field>
        <Field label="Pay Period Start (Day)"><TextInput type="number" value={s.payPeriodStart} onChange={v => update('payPeriodStart', Number(v))} /></Field>
        <Field label="Pay Period End (Day)"><TextInput type="number" value={s.payPeriodEnd} onChange={v => update('payPeriodEnd', Number(v))} /></Field>
        <Field label="Attendance Cut-off Date"><TextInput type="number" value={s.attendanceCutoffDate} onChange={v => update('attendanceCutoffDate', Number(v))} /></Field>
        <Field label="Salary Disbursement Date"><TextInput type="number" value={s.disbursementDate} onChange={v => update('disbursementDate', Number(v))} /></Field>
        <Field label="LOP Calculation Method">
          <select value={s.lopCalculationMethod} onChange={e => update('lopCalculationMethod', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
            <option value="calendar">Calendar Days</option>
            <option value="working">Working Days</option>
            <option value="pay_period">Pay Period Days</option>
          </select>
        </Field>
        <Field label="Proration Formula">
          <select value={s.prorationType} onChange={e => update('prorationType', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
            <option value="dynamic">Dynamic (Actual days in month)</option>
            <option value="fixed30">Fixed 30 days</option>
          </select>
        </Field>
      </Grid>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Arrear Display Preferences</div>
        <Grid cols={2}>
          <Field label="Arrear Display Mode">
            <select value={s.arrearDisplayMode || 'consolidated'} onChange={e => update('arrearDisplayMode', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
              <option value="consolidated">Consolidated arrears only</option>
              <option value="breakup">Component-wise arrear breakup</option>
            </select>
          </Field>
          <Field label="Show Breakup In" hint="Applicable only in breakup mode">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                ['review', 'Review & Adjust'],
                ['tax', 'TDS Calculation'],
                ['slip', 'Salary Slip'],
              ].map(([key, label]) => {
                const arr = Array.isArray(s.arrearBreakupVisibility) ? s.arrearBreakupVisibility : ['review', 'tax', 'slip'];
                const active = arr.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const next = active ? arr.filter(v => v !== key) : [...arr, key];
                      update('arrearBreakupVisibility', next.length ? next : ['review', 'tax', 'slip']);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: `1px solid ${active ? '#4f46e5' : '#cbd5e1'}`,
                      background: active ? '#eef2ff' : 'white',
                      color: active ? '#3730a3' : '#64748b',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {active ? '✓ ' : ''}{label}
                  </button>
                );
              })}
            </div>
          </Field>
        </Grid>
      </div>
    </SectionCard>
  );
}

function BankIntegration({ s, update }) {
  return (
    <SectionCard title="Bank & Payment Integration" icon="🏦">
      <Grid cols={3}>
        <Field label="Company Bank"><TextInput value={s.bankName} onChange={v => update('bankName', v)} /></Field>
        <Field label="Account Number"><TextInput value={s.bankAccountNo} onChange={v => update('bankAccountNo', v)} /></Field>
        <Field label="IFSC Code"><TextInput value={s.bankIFSC} onChange={v => update('bankIFSC', v)} /></Field>
        <Field label="Transfer Mode">
          <select value={s.transferMode} onChange={e => update('transferMode', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
            <option>NEFT</option><option>RTGS</option><option>IMPS</option>
          </select>
        </Field>
        <Field label="Bank File Format">
          <select value={s.bankFileFormat} onChange={e => update('bankFileFormat', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none' }}>
            <option>HDFC</option><option>ICICI</option><option>SBI</option><option>Axis</option><option>Generic CSV</option>
          </select>
        </Field>
      </Grid>
    </SectionCard>
  );
}

function SalaryStructureTemplate({ s, update }) {
  const TYPE_LABELS = {
    earnings_basic: 'Basic', earnings_hra: 'HRA', earnings_allowance: 'Allowance',
    variable: 'Variable', reimbursement: 'Reimbursement',
    employer_contrib: 'Employer Contribution', employee_deduction: 'Employee Deduction',
  };
  function addComp() {
    update('defaultSalaryComponents', [
      ...s.defaultSalaryComponents,
      { id: Date.now().toString(), name: 'New Component', type: 'earnings_allowance', amount: 0, matrixId: 'custom', taxSchedule: 'monthly' },
    ]);
  }
  function removeComp(id) {
    update('defaultSalaryComponents', s.defaultSalaryComponents.filter(c => c.id !== id));
  }
  function updateComp(id, field, val) {
    update('defaultSalaryComponents', s.defaultSalaryComponents.map(c => c.id === id ? { ...c, [field]: val } : c));
  }

  const isAnnual = s.defaultInputMode === 'annual';

  return (
    <SectionCard 
      title="Default Salary Structure Template" 
      icon="⚙️"
      action={
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#f1f5f9', padding: '4px 8px', borderRadius: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Entry:</span>
          <Pill 
            active={!isAnnual} 
            onClick={() => {
              if (isAnnual) {
                update('defaultInputMode', 'monthly');
                update('defaultSalaryComponents', convertStructure(s.defaultSalaryComponents, false));
              }
            }} 
            color="#0369a1"
          >Monthly</Pill>
          <Pill 
            active={isAnnual} 
            onClick={() => {
              if (!isAnnual) {
                update('defaultInputMode', 'annual');
                update('defaultSalaryComponents', convertStructure(s.defaultSalaryComponents, true));
              }
            }} 
            color="#7c3aed"
          >Annual</Pill>
        </div>
      }
    >
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>These components will be pre-populated for every new employee.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Component', 'Type', 'Amount / Formula', 'Tax Schedule', ''].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.defaultSalaryComponents.map((c, idx) => {
              const isCustom = !c.matrixId || c.matrixId === 'custom';
              return (
                <tr key={c.id}>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <select
                        value={c.matrixId || 'custom'}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            updateComp(c.id, 'matrixId', 'custom');
                            updateComp(c.id, 'name', '');
                          } else {
                            const matched = MATRIX_COMPONENTS.find(m => m.id === val);
                            updateComp(c.id, 'matrixId', val);
                            updateComp(c.id, 'name', matched.name);
                            updateComp(c.id, 'type', matched.type);
                          }
                        }}
                        style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px', fontSize: 11, width: '100%' }}
                      >
                        <option value="custom">-- Custom --</option>
                        {CATEGORIES.map(cat => (
                          <optgroup key={cat.id} label={cat.name}>
                            {cat.components.map(comp => (
                              <option key={comp.id} value={comp.id}>{comp.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {isCustom && (
                        <input value={c.name} onChange={e => updateComp(c.id, 'name', e.target.value)} placeholder="Name..." style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 8px', width: '100%', fontSize: 11 }} />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0' }}>
                    <select value={c.type} onChange={e => updateComp(c.id, 'type', e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px', fontSize: 11, width: '100%' }}>
                      <option value="earnings_basic">Basic</option>
                      <option value="earnings_hra">HRA</option>
                      <option value="earnings_allowance">Allowance</option>
                      <option value="variable">Variable</option>
                      <option value="reimbursement">Reimbursement</option>
                      <option value="employer_contrib">Employer Share</option>
                      <option value="employee_deduction">Employee Deduction</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0' }}>
                    <input value={c.amount} onChange={e => updateComp(c.id, 'amount', e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 8px', width: '100%', fontSize: 12, fontFamily: 'monospace' }} />
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0' }}>
                    <select value={c.taxSchedule} onChange={e => updateComp(c.id, 'taxSchedule', e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px', fontSize: 11, width: '100%' }}>
                      <option value="monthly">Monthly</option>
                      <option value="year_end">Year-End</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <button onClick={() => removeComp(c.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={addComp} style={{ marginTop: 12, padding: '6px 14px', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add Component</button>
    </SectionCard>
  );
}

// ── Comp: SubmissionWindows ───────────────────────────────────────────────────
function SubmissionWindows({ s, update }) {
  const windows = s.submissionWindows || { 
    itDeclaration: { enabled: false, startDate: '', endDate: '' },
    reimbursement: { enabled: false, startDate: '', endDate: '' }
  };

  const updateWindow = (type, field, val) => {
    update('submissionWindows', {
      ...windows,
      [type]: { ...windows[type], [field]: val }
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s' }}>
      <SectionCard title="IT Declarations (Section 80, House Property, etc.)" icon="📝">
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#0f172a' }}>
            <input type="checkbox" checked={windows.itDeclaration.enabled} onChange={e => updateWindow('itDeclaration', 'enabled', e.target.checked)} 
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
            Open Declaration Window for Employees
          </label>
          <p style={{ margin: '4px 0 0 24px', fontSize: 12, color: '#64748b' }}>If enabled, employees can submit or revise their tax-saving declarations from the Employee Portal.</p>
        </div>
        {windows.itDeclaration.enabled && (
          <Grid cols={2}>
            <Field label="Window Start Date"><TextInput type="date" value={windows.itDeclaration.startDate} onChange={v => updateWindow('itDeclaration', 'startDate', v)} /></Field>
            <Field label="Window End Date"><TextInput type="date" value={windows.itDeclaration.endDate} onChange={v => updateWindow('itDeclaration', 'endDate', v)} /></Field>
          </Grid>
        )}
      </SectionCard>

      <SectionCard title="Reimbursement Claims" icon="🧾">
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#0f172a' }}>
            <input type="checkbox" checked={windows.reimbursement.enabled} onChange={e => updateWindow('reimbursement', 'enabled', e.target.checked)} 
              style={{ width: 16, height: 16, cursor: 'pointer' }}/>
            Open Expense Claim Window for Employees
          </label>
          <p style={{ margin: '4px 0 0 24px', fontSize: 12, color: '#64748b' }}>If enabled, employees can submit proofs for their reimbursement allowances.</p>
        </div>
        {windows.reimbursement.enabled && (
          <Grid cols={2}>
            <Field label="Window Start Date"><TextInput type="date" value={windows.reimbursement.startDate} onChange={v => updateWindow('reimbursement', 'startDate', v)} /></Field>
            <Field label="Window End Date"><TextInput type="date" value={windows.reimbursement.endDate} onChange={v => updateWindow('reimbursement', 'endDate', v)} /></Field>
          </Grid>
        )}
      </SectionCard>
    </div>
  );
}

// ── Main CompanySettingsTab ───────────────────────────────────────────────────
export default function CompanySettingsTab() {
  const [settings, setSettings] = useState(() => getDefaults());
  const [activeSection, setActiveSection] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const remote = await getCompanySettings();
        if (remote) setSettings(prev => ({ ...prev, ...remote }));
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const update = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      await saveCompanySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert('Error saving settings: ' + e.message); }
  };

  const renderSection = () => {
    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading settings...</div>;
    switch (activeSection) {
      case 'company':      return <CompanyProfile s={settings} update={update} />;
      case 'statutory':    return <StatutoryCompliance s={settings} update={update} />;
      case 'cycle':        return <PayrollCycleSettings s={settings} update={update} />;
      case 'bank':         return <BankIntegration s={settings} update={update} />;
      case 'structure':    return <SalaryStructureTemplate s={settings} update={update} />;
      case 'employees':    return <EmployeeManagement settings={settings} />;
      case 'submissions':  return <SubmissionWindows s={settings} update={update} />;
      default:             return null;
    }
  };

  return (
    <div className="module-settings-root">
      <div className="module-header" style={{ borderBottom: '4px solid #3b82f6' }}>
        <h2 className="tab-heading">⚙️ Company Settings</h2>
        <p className="tab-subheading">Persistently configure your company and manage your employee roster.</p>
      </div>

      <div className="settings-layout">
        <nav className="settings-sidenav">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`settings-nav-btn ${activeSection === s.id ? 'settings-nav-btn--active' : ''}`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button onClick={handleSave} style={{ width: '100%', padding: '10px', background: saved ? '#10b981' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              {saved ? '✓ Saved!' : '💾 Save Settings'}
            </button>
          </div>
        </nav>
        <div className="settings-content">{renderSection()}</div>
      </div>
    </div>
  );
}
