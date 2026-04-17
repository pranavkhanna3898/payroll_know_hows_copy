import { useState, useEffect } from 'react';
import { getEmployees, getCompanySettings, getEmployeeSubmissionsByEmployee, upsertEmployeeSubmission, uploadProofFile } from '../../data/api';
import { getFinancialYearRange } from '../../utils/dateUtils';
import { computeEmployeePayroll } from '../../data/payrollEngine';

const Field = ({ label, children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: 10, color: '#94a3b8' }}>{hint}</span>}
  </div>
);

const NumberInput = ({ value, onChange, disabled }) => (
  <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))} disabled={disabled}
    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, width: '100%', fontSize: 13 }} />
);

const TABS = [
  { id: 'it_declaration', label: '📝 IT Declarations', subtitle: 'Section 80, Home Loan, Rent' },
  { id: 'reimbursement',  label: '🧾 Reimbursement Claims', subtitle: 'Submit expense proofs' },
];

const STATUS_COLORS = {
  submitted: { bg: '#fef9c3', color: '#854d0e', label: 'Submitted — Pending Review' },
  verified:  { bg: '#dcfce7', color: '#166534', label: 'Verified ✓' },
  rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status];
  if (!s) return null;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

export default function EmployeePortal() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [settings, setSettings] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('it_declaration');

  // IT Declaration state
  const [declForm, setDeclForm] = useState({});
  const [declFiles, setDeclFiles] = useState({});
  const [submittingDecl, setSubmittingDecl] = useState(false);

  // Reimbursement Claims state
  const [reimburseForm, setReimburseForm] = useState({}); // { [componentId]: { amount, notes } }
  const [reimburseFiles, setReimburseFiles] = useState({}); // { [componentId]: File }
  const [submittingReimb, setSubmittingReimb] = useState(false);

  const activeFY = getFinancialYearRange(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  useEffect(() => {
    async function load() {
      const [emps, sets] = await Promise.all([getEmployees(), getCompanySettings()]);
      setEmployees(emps || []);
      setSettings(sets || {});
      if (emps && emps.length > 0) setSelectedEmpId(emps[0].id);
    }
    load();
  }, []);

  useEffect(() => {
    if (selectedEmpId) fetchSubmissions();
  }, [selectedEmpId]);

  async function fetchSubmissions() {
    try {
      const data = await getEmployeeSubmissionsByEmployee(selectedEmpId, activeFY);
      setSubmissions(data || []);

      const existingDecl = data?.find(s => s.type === 'it_declaration');
      setDeclForm(existingDecl?.submitted_data || {});

      const existingReimb = data?.find(s => s.type === 'reimbursement_claim');
      setReimburseForm(existingReimb?.submitted_data || {});
    } catch(e) { console.error(e); }
  }

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const reimbComponents = (selectedEmp?.salary_structure || []).filter(c => c.type === 'reimbursement');

  const windows = settings?.submissionWindows || { itDeclaration: {}, reimbursement: {} };
  const canSubmitDecl  = windows.itDeclaration?.enabled;
  const canSubmitReimb = windows.reimbursement?.enabled;

  // ── IT Declaration handlers ──────────────────────────────────────────────────
  const handleDeclChange = (field, val) => setDeclForm(prev => ({ ...prev, [field]: val }));
  const handleDeclFileChange = (field, e) => {
    if (e.target.files?.[0]) setDeclFiles(prev => ({ ...prev, [field]: e.target.files[0] }));
  };

  const handleDeclSubmit = async () => {
    if (!selectedEmpId || !canSubmitDecl) return;
    setSubmittingDecl(true);
    try {
      const existing = submissions.find(s => s.type === 'it_declaration');
      let finalData = { ...declForm };
      for (const [field, file] of Object.entries(declFiles)) {
        const url = await uploadProofFile(selectedEmpId, file);
        finalData[`${field}_proofUrl`] = url;
      }
      await upsertEmployeeSubmission({
        id: existing?.id,
        employee_id: selectedEmpId,
        financial_year: activeFY,
        type: 'it_declaration',
        status: 'submitted',
        submitted_data: finalData
      });
      alert('IT Declaration submitted successfully!');
      setDeclFiles({});
      fetchSubmissions();
    } catch(e) { alert('Error: ' + e.message); }
    setSubmittingDecl(false);
  };

  // ── Reimbursement Claim handlers ─────────────────────────────────────────────
  const handleReimbChange = (compId, field, val) =>
    setReimburseForm(prev => ({ ...prev, [compId]: { ...(prev[compId] || {}), [field]: val } }));

  const handleReimbFileChange = (compId, e) => {
    if (e.target.files?.[0]) setReimburseFiles(prev => ({ ...prev, [compId]: e.target.files[0] }));
  };

  const handleReimbSubmit = async () => {
    if (!selectedEmpId || !canSubmitReimb) return;
    setSubmittingReimb(true);
    try {
      const existing = submissions.find(s => s.type === 'reimbursement_claim');
      let finalData = { ...reimburseForm };
      for (const [compId, file] of Object.entries(reimburseFiles)) {
        const url = await uploadProofFile(selectedEmpId, file);
        finalData[compId] = { ...(finalData[compId] || {}), proofUrl: url };
      }
      await upsertEmployeeSubmission({
        id: existing?.id,
        employee_id: selectedEmpId,
        financial_year: activeFY,
        type: 'reimbursement_claim',
        status: 'submitted',
        submitted_data: finalData
      });
      alert('Reimbursement claim submitted for Finance review!');
      setReimburseFiles({});
      fetchSubmissions();
    } catch(e) { alert('Error: ' + e.message); }
    setSubmittingReimb(false);
  };

  const fmtAmt = (n) => Number(n || 0).toLocaleString('en-IN');
  const currentDeclStatus  = submissions.find(s => s.type === 'it_declaration')?.status;
  const currentReimbStatus = submissions.find(s => s.type === 'reimbursement_claim')?.status;
  const isDeclVerified  = currentDeclStatus === 'verified';
  const isReimbVerified = currentReimbStatus === 'verified';

  return (
    <div style={{ padding: 30, maxWidth: 1050, margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', padding: '24px 28px', borderRadius: 14, color: 'white', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>👤 Employee Portal</h2>
          <p style={{ margin: 0, opacity: 0.75, fontSize: 13 }}>Submit IT declarations & reimbursement proofs for {activeFY}</p>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, marginRight: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Viewing As:</label>
          <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, minWidth: 200 }}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.emp_code})</option>)}
          </select>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: activeTab === tab.id ? '#1e40af' : 'white',
              color: activeTab === tab.id ? 'white' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(30,64,175,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── IT Declaration Tab ── */}
      {activeTab === 'it_declaration' && (
        <div style={{ background: 'white', padding: 28, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>📝 IT Declarations</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Your tax-saving investments & deductions for {activeFY}</p>
            </div>
            {currentDeclStatus && <StatusBadge status={currentDeclStatus} />}
          </div>

          {!canSubmitDecl && !isDeclVerified && (
            <div style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
              ⚠️  The IT Declaration window is currently <strong>closed</strong>. Contact HR/Finance to open it.
            </div>
          )}
          {isDeclVerified && (
            <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
              ✅  Your declarations for {activeFY} have been <strong>verified</strong> by Finance. No further edits allowed.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {/* Chapter VI-A */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h4 style={{ margin: 0, color: '#334155', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>Chapter VI-A Investments</h4>
              {[
                { key: 'investments80C',    label: '80C — LIC / ELSS / PPF (Max ₹1.5L)' },
                { key: 'medical80D_self',   label: '80D — Medical (Self & Family, Max ₹25k)' },
                { key: 'medical80D_parents',label: '80D — Medical (Parents)' },
                { key: 'nps80CCD1B',        label: '80CCD(1B) — NPS (Max ₹50k)' },
                { key: 'deductions80GE',    label: '80G / 80E — Donations / Edu Loan' },
              ].map(({ key, label }) => (
                <Field key={key} label={label}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <NumberInput value={declForm[key]} onChange={v => handleDeclChange(key, v)} disabled={!canSubmitDecl || isDeclVerified} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 6, padding: '0 10px', border: '1px solid #e2e8f0', cursor: !canSubmitDecl || isDeclVerified ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontSize: 12, color: '#475569' }}>
                      📎 {reimburseFiles[key] ? reimburseFiles[key].name.substring(0, 14) + '…' : 'Attach Proof'}
                      <input type="file" style={{ display: 'none' }} onChange={e => handleDeclFileChange(key, e)} disabled={!canSubmitDecl || isDeclVerified} />
                    </label>
                  </div>
                </Field>
              ))}
            </div>
            {/* Property & Others */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h4 style={{ margin: 0, color: '#334155', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>Property & Rent</h4>
              {[
                { key: 'homeLoanInterest',  label: 'Home Loan Interest (Sec 24, Max ₹2L)' },
                { key: 'monthlyRentPaid',   label: 'Monthly Rent Paid (for HRA exemption)' },
                { key: 'ltaClaimed',        label: 'LTA Claimed' },
                { key: 'savingsInterest80TTA', label: '80TTA / 80TTB — Savings Interest' },
              ].map(({ key, label }) => (
                <Field key={key} label={label}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <NumberInput value={declForm[key]} onChange={v => handleDeclChange(key, v)} disabled={!canSubmitDecl || isDeclVerified} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 6, padding: '0 10px', border: '1px solid #e2e8f0', cursor: !canSubmitDecl || isDeclVerified ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontSize: 12, color: '#475569' }}>
                      📎 {declFiles[key] ? declFiles[key].name.substring(0, 14) + '…' : 'Attach Proof'}
                      <input type="file" style={{ display: 'none' }} onChange={e => handleDeclFileChange(key, e)} disabled={!canSubmitDecl || isDeclVerified} />
                    </label>
                  </div>
                </Field>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
            <button disabled={!canSubmitDecl || isDeclVerified || submittingDecl} onClick={handleDeclSubmit}
              style={{ padding: '12px 28px', background: (!canSubmitDecl || isDeclVerified) ? '#cbd5e1' : 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white', border: 'none', borderRadius: 8, cursor: (!canSubmitDecl || isDeclVerified) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, boxShadow: (!canSubmitDecl || isDeclVerified) ? 'none' : '0 4px 12px rgba(37,99,235,0.35)' }}>
              {submittingDecl ? '⏳ Submitting…' : '✅ Submit Declarations for Verification'}
            </button>
          </div>
        </div>
      )}

      {/* ── Reimbursement Claims Tab ── */}
      {activeTab === 'reimbursement' && (
        <div style={{ background: 'white', padding: 28, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>🧾 Reimbursement Claims</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Submit expense proofs for your eligible reimbursement components</p>
            </div>
            {currentReimbStatus && <StatusBadge status={currentReimbStatus} />}
          </div>

          {!canSubmitReimb && !isReimbVerified && (
            <div style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
              ⚠️  The Reimbursement Claim window is currently <strong>closed</strong>. Contact HR/Finance to open it.
            </div>
          )}
          {isReimbVerified && (
            <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
              ✅  Your reimbursement claims for {activeFY} have been <strong>verified</strong> by Finance.
            </div>
          )}

          {reimbComponents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>🗂️</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#475569' }}>No Reimbursement Components Found</div>
              <div style={{ fontSize: 13 }}>Your salary structure does not include any reimbursement components eligible for claims.</div>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 16, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 12, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                <div>Component</div>
                <div style={{ textAlign: 'right' }}>Allowed / Annum</div>
                <div style={{ textAlign: 'right' }}>Claim Amount (₹)</div>
                <div>Proof & Notes</div>
              </div>

              {(() => {
                const engineEmp = selectedEmp ? { ...selectedEmp, salaryComponents: selectedEmp.salary_structure || [] } : null;
                const engineCalc = engineEmp ? computeEmployeePayroll(engineEmp) : null;
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reimbComponents.map(comp => {
                      const entry    = reimburseForm[comp.id] || {};
                      const disabled = !canSubmitReimb || isReimbVerified;
                      
                      const computedComp = engineCalc?.components?.find(c => c.id === comp.id);
                      const limit = computedComp ? (computedComp._resolved * 12) : 0;

                      return (
                    <div key={comp.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 16, alignItems: 'start', padding: '16px', background: '#fafafa', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      {/* Component name */}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{comp.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Reimbursement Component</div>
                        {entry.proofUrl && (
                          <a href={entry.proofUrl} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none', marginTop: 4, display: 'block' }}>
                            📎 Previously Submitted Proof
                          </a>
                        )}
                      </div>

                      {/* Structure limit */}
                      <div style={{ textAlign: 'right', paddingTop: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#334155' }}>₹{fmtAmt(limit)}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>per annum</div>
                      </div>

                      {/* Claim amount */}
                      <div>
                        <input type="number" disabled={disabled}
                          value={entry.amount || ''}
                          onChange={e => handleReimbChange(comp.id, 'amount', Number(e.target.value))}
                          placeholder="0"
                          style={{ width: '100%', padding: '8px 10px', border: entry.amount > limit ? '1.5px solid #f87171' : '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'right', background: disabled ? '#f1f5f9' : 'white' }} />
                        {entry.amount > limit && (
                          <div style={{ fontSize: 10, color: '#ef4444', marginTop: 3, textAlign: 'right' }}>Exceeds limit ₹{fmtAmt(limit)}</div>
                        )}
                      </div>

                      {/* Proof upload & Notes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 6, padding: '8px 10px', border: '1px solid #e2e8f0', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, color: '#475569', opacity: disabled ? 0.6 : 1 }}>
                          📎 {reimburseFiles[comp.id] ? reimburseFiles[comp.id].name.substring(0, 22) + '…' : (entry.proofUrl ? 'Replace Proof' : 'Upload Bill / Receipt')}
                          <input type="file" style={{ display: 'none' }} disabled={disabled} onChange={e => handleReimbFileChange(comp.id, e)} />
                        </label>
                        <textarea disabled={disabled}
                          value={entry.notes || ''} rows={2}
                          onChange={e => handleReimbChange(comp.id, 'notes', e.target.value)}
                          placeholder="Optional notes / vendor / invoice no…"
                          style={{ resize: 'none', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, background: disabled ? '#f1f5f9' : 'white', fontFamily: 'inherit' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total summary */}
              <div style={{ marginTop: 20, background: '#f0f9ff', borderRadius: 10, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #bae6fd' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Total Claim Amount</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0c4a6e' }}>
                    ₹{fmtAmt(reimbComponents.reduce((sum, c) => sum + (reimburseForm[c.id]?.amount || 0), 0))}
                    <span style={{ fontSize: 12, fontWeight: 400, color: '#0369a1', marginLeft: 8 }}>
                      / ₹{fmtAmt(reimbComponents.reduce((sum, c) => {
                        const computedComp = engineCalc?.components?.find(x => x.id === c.id);
                        return sum + (computedComp ? computedComp._resolved * 12 : 0);
                      }, 0))} eligible annually
                    </span>
                  </div>
                </div>
                <button disabled={!canSubmitReimb || isReimbVerified || submittingReimb} onClick={handleReimbSubmit}
                  style={{ padding: '12px 28px', background: (!canSubmitReimb || isReimbVerified) ? '#cbd5e1' : 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', borderRadius: 8, cursor: (!canSubmitReimb || isReimbVerified) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, boxShadow: (!canSubmitReimb || isReimbVerified) ? 'none' : '0 4px 14px rgba(16,185,129,0.35)' }}>
                  {submittingReimb ? '⏳ Submitting…' : '✅ Submit Claims for Verification'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


