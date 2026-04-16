import { useState, useEffect } from 'react';
import { getEmployees, getCompanySettings, getEmployeeSubmissionsByEmployee, upsertEmployeeSubmission, uploadProofFile } from '../../data/api';
import { getFinancialYearRange } from '../../utils/dateUtils';

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
);

const NumberInput = ({ value, onChange, disabled }) => (
  <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))} disabled={disabled}
    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, width: '100%' }} />
);

export default function EmployeePortal() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [settings, setSettings] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State - Declarations
  const [declForm, setDeclForm] = useState({});
  const [declFiles, setDeclFiles] = useState({});
  const [submittingDecl, setSubmittingDecl] = useState(false);

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
      if (existingDecl) {
        setDeclForm(existingDecl.submitted_data || {});
      } else {
        setDeclForm({});
      }
    } catch(e) { console.error(e); }
  }

  const windows = settings?.submissionWindows || { itDeclaration: {}, reimbursement: {} };
  const canSubmitDecl = windows.itDeclaration?.enabled;

  const handleDeclChange = (field, val) => setDeclForm(prev => ({ ...prev, [field]: val }));
  
  const handleDeclFileChange = (field, e) => {
    if (e.target.files && e.target.files[0]) {
      setDeclFiles(prev => ({ ...prev, [field]: e.target.files[0] }));
    }
  };

  const handleDeclSubmit = async () => {
    if (!selectedEmpId || !canSubmitDecl) return;
    setSubmittingDecl(true);
    try {
      // Find existing submission to update if present
      const existing = submissions.find(s => s.type === 'it_declaration');
      
      let finalData = { ...declForm };
      
      // Upload any new files and append their URLs
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

      alert('IT Declaration submitted successfully for Finance review!');
      setDeclFiles({});
      fetchSubmissions();
    } catch(e) {
      alert('Error submitting: ' + e.message);
    }
    setSubmittingDecl(false);
  };

  const renderStatusBadge = (status) => {
    const colors = {
      draft: '#f8fafc', submitted: '#fef08a', verified: '#bbf7d0', rejected: '#fecaca'
    };
    return <span style={{ background: colors[status] || '#eee', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>;
  };

  const currentDeclStatus = submissions.find(s => s.type === 'it_declaration')?.status || 'Not Submitted';
  const isDeclVerified = currentDeclStatus === 'verified';

  return (
    <div style={{ padding: 30, maxWidth: 1000, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>Employee Portal</h2>
          <p style={{ margin: 0, color: '#64748b' }}>Submit IT Declarations & Reimbursement Proofs</p>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginRight: 10 }}>View As Employee:</label>
          <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.emp_code})</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>📝 IT Declarations ({activeFY})</h3>
          <div>Status: {renderStatusBadge(currentDeclStatus)}</div>
        </div>

        {!canSubmitDecl && !isDeclVerified && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 6, marginBottom: 20 }}>
            ⚠️ The IT Declaration window is currently closed. If you need to make changes, please contact HR/Finance.
          </div>
        )}
        
        {isDeclVerified && (
          <div style={{ background: '#f0fdf4', color: '#166534', padding: 12, borderRadius: 6, marginBottom: 20 }}>
            ✅ Your declarations for {activeFY} have been verified by Finance. You can no longer edit them.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
          {/* Chapter VI-A */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ margin: 0, color: '#334155' }}>Chapter VI-A Investments</h4>
            
            <Field label="80C Investments (Max 1.5L)">
              <div style={{ display: 'flex', gap: 10 }}>
                <NumberInput value={declForm.investments80C} onChange={v => handleDeclChange('investments80C', v)} disabled={!canSubmitDecl || isDeclVerified} />
                <input type="file" onChange={e => handleDeclFileChange('investments80C', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>

            <Field label="80D Medical (Self & Family)">
              <div style={{ display: 'flex', gap: 10 }}>
                <NumberInput value={declForm.medical80D_self} onChange={v => handleDeclChange('medical80D_self', v)} disabled={!canSubmitDecl || isDeclVerified} />
                <input type="file" onChange={e => handleDeclFileChange('medical80D_self', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>

            <Field label="80D Medical (Parents)">
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <NumberInput value={declForm.medical80D_parents} onChange={v => handleDeclChange('medical80D_parents', v)} disabled={!canSubmitDecl || isDeclVerified} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!declForm.medical80D_parents_senior} onChange={e => handleDeclChange('medical80D_parents_senior', e.target.checked)} disabled={!canSubmitDecl || isDeclVerified} />
                    Parents are Senior Citizens (60+)
                  </label>
                </div>
                <input type="file" onChange={e => handleDeclFileChange('medical80D_parents', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>

            <Field label="80CCD(1B) NPS (Max 50k)">
              <div style={{ display: 'flex', gap: 10 }}>
                <NumberInput value={declForm.nps80CCD1B} onChange={v => handleDeclChange('nps80CCD1B', v)} disabled={!canSubmitDecl || isDeclVerified} />
                <input type="file" onChange={e => handleDeclFileChange('nps80CCD1B', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>

            <Field label="80G / 80E (Donations/Edu)">
              <div style={{ display: 'flex', gap: 10 }}>
                <NumberInput value={declForm.deductions80GE} onChange={v => handleDeclChange('deductions80GE', v)} disabled={!canSubmitDecl || isDeclVerified} />
                <input type="file" onChange={e => handleDeclFileChange('deductions80GE', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>
          </div>

          {/* Property & Others */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ margin: 0, color: '#334155' }}>Property & Rent</h4>

            <Field label="Home Loan Int. (Sec 24)">
              <div style={{ display: 'flex', gap: 10 }}>
                <NumberInput value={declForm.homeLoanInterest} onChange={v => handleDeclChange('homeLoanInterest', v)} disabled={!canSubmitDecl || isDeclVerified} />
                <input type="file" onChange={e => handleDeclFileChange('homeLoanInterest', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>

            <Field label="Monthly Rent Paid">
              <div style={{ display: 'flex', gap: 10 }}>
                <NumberInput value={declForm.monthlyRentPaid} onChange={v => handleDeclChange('monthlyRentPaid', v)} disabled={!canSubmitDecl || isDeclVerified} />
                <input type="file" onChange={e => handleDeclFileChange('monthlyRentPaid', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>

            <Field label="LTA Claimed">
              <div style={{ display: 'flex', gap: 10 }}>
                <NumberInput value={declForm.ltaClaimed} onChange={v => handleDeclChange('ltaClaimed', v)} disabled={!canSubmitDecl || isDeclVerified} />
                <input type="file" onChange={e => handleDeclFileChange('ltaClaimed', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>

            <Field label="80TTA/TTB (Savings Int)">
              <div style={{ display: 'flex', gap: 10 }}>
                <NumberInput value={declForm.savingsInterest80TTA} onChange={v => handleDeclChange('savingsInterest80TTA', v)} disabled={!canSubmitDecl || isDeclVerified} />
                <input type="file" onChange={e => handleDeclFileChange('savingsInterest80TTA', e)} disabled={!canSubmitDecl || isDeclVerified} />
              </div>
            </Field>
          </div>
        </div>

        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            disabled={!canSubmitDecl || isDeclVerified || submittingDecl}
            onClick={handleDeclSubmit}
            style={{ padding: '12px 24px', background: (!canSubmitDecl || isDeclVerified) ? '#cbd5e1' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: (!canSubmitDecl || isDeclVerified) ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {submittingDecl ? 'Uploading & Submitting...' : 'Submit Declarations for Verification'}
          </button>
        </div>
      </div>
    </div>
  );
}
