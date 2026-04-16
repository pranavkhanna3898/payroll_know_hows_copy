import { useState, useEffect } from 'react';
import { getEmployeeSubmissions, updateEmployeeSubmissionStatus, getEmployees } from '../../data/api';
import { getFinancialYearRange } from '../../utils/dateUtils';

const InputField = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
    <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{label}</label>
    <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))}
      style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
  </div>
);

export default function FinanceVerificationTab() {
  const [submissions, setSubmissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the currently reviewed submission
  const [reviewingId, setReviewingId] = useState(null);
  const [verifiedData, setVerifiedData] = useState({});

  const activeFY = getFinancialYearRange(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [subs, emps] = await Promise.all([
        getEmployeeSubmissions(activeFY),
        getEmployees()
      ]);
      setSubmissions(subs || []);
      setEmployees(emps || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  const handleReviewClick = (sub) => {
    setReviewingId(sub.id);
    // Initialize verified data with submitted data
    setVerifiedData({ ...(sub.verified_data || sub.submitted_data || {}) });
  };

  const handleVerifiedChange = (field, val) => {
    setVerifiedData(prev => ({ ...prev, [field]: val }));
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      if (status === 'verified') {
        await updateEmployeeSubmissionStatus(id, status, verifiedData);
      } else {
        await updateEmployeeSubmissionStatus(id, status);
      }
      setReviewingId(null);
      fetchData();
    } catch(e) {
      alert('Error updating status: ' + e.message);
    }
  };

  const getEmpName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';

  const pending = submissions.filter(s => s.status === 'submitted');
  const past = submissions.filter(s => s.status !== 'submitted');

  return (
    <div className="module-settings-root">
      <div className="module-header" style={{ borderBottom: '4px solid #10b981' }}>
        <h2 className="tab-heading">🛡️ Finance Verification Dashboard</h2>
        <p className="tab-subheading">Review and approve employee tax declarations and reimbursement claims.</p>
      </div>

      <div style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* List Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Pending Reviews */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ background: '#fef3c7', padding: '12px 16px', borderBottom: '1px solid #fde68a', fontWeight: 700, color: '#92400e' }}>
              Pending Approvals ({pending.length})
            </div>
            {pending.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No pending submissions.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {pending.map(s => (
                    <tr key={s.id} onClick={() => handleReviewClick(s)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: reviewingId === s.id ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: 12 }}><strong>{getEmpName(s.employee_id)}</strong></td>
                      <td style={{ padding: 12, color: '#64748b' }}>{s.type === 'it_declaration' ? 'IT Declaration' : 'Reimbursement'}</td>
                      <td style={{ padding: 12, textAlign: 'right' }}>
                        <span style={{ color: '#d97706', fontWeight: 600 }}>Needs Review</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Past Reviews */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', opacity: 0.8 }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#475569' }}>
              Past Verifications ({past.length})
            </div>
            {past.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {past.map(s => (
                    <tr key={s.id} onClick={() => handleReviewClick(s)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: reviewingId === s.id ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: 12 }}>{getEmpName(s.employee_id)}</td>
                      <td style={{ padding: 12, color: '#64748b' }}>{s.type === 'it_declaration' ? 'IT Declaration' : 'Reimbursement'}</td>
                      <td style={{ padding: 12, textAlign: 'right' }}>
                        <span style={{ color: s.status === 'verified' ? '#16a34a' : '#dc2626', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: 1.5, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, position: 'sticky', top: 24 }}>
          {!reviewingId ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              Select a submission from the list to review the declared values and verify proofs.
            </div>
          ) : (() => {
            const activeSub = submissions.find(s => s.id === reviewingId);
            const data = activeSub.submitted_data || {};
            
            // Helper to render dual column (Declared vs Verified)
            const VerificationRow = ({ label, fieldName }) => (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.5fr) 1fr 1fr', gap: 16, alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{label}</div>
                  {data[`${fieldName}_proofUrl`] ? (
                    <a href={data[`${fieldName}_proofUrl`]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>📎 View Proof URL</a>
                  ) : (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>No proof attached</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Declared</div>
                  <div style={{ fontWeight: 600, color: '#64748b' }}>₹{Number(data[fieldName] || 0).toLocaleString()}</div>
                </div>
                <div>
                  <InputField label="Verified Allowable" value={verifiedData[fieldName]} onChange={v => handleVerifiedChange(fieldName, v)} />
                </div>
              </div>
            );

            return (
              <div style={{ animation: 'fadeIn 0.2s' }}>
                <h3 style={{ margin: '0 0 16px', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Review {activeSub.type === 'it_declaration' ? 'IT Declaration' : 'Reimbursement'}</span>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 'normal' }}>{getEmpName(activeSub.employee_id)}</span>
                </h3>

                {activeSub.type === 'it_declaration' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <VerificationRow label="80C Investments" fieldName="investments80C" />
                    <VerificationRow label="80D Medical (Self)" fieldName="medical80D_self" />
                    <VerificationRow label="80D Medical (Parents)" fieldName="medical80D_parents" />
                    <div style={{ padding: '0 0 8px 136px', fontSize: 11, color: '#64748b' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!verifiedData.medical80D_parents_senior} onChange={e => handleVerifiedChange('medical80D_parents_senior', e.target.checked)} />
                        Verify Parents are Senior Citizens (Unlocks ₹50k cap)
                      </label>
                    </div>
                    <VerificationRow label="NPS 80CCD(1B)" fieldName="nps80CCD1B" />
                    <VerificationRow label="80G/80E" fieldName="deductions80GE" />
                    <VerificationRow label="Sec 24 Home Loan" fieldName="homeLoanInterest" />
                    <VerificationRow label="Monthly Rent" fieldName="monthlyRentPaid" />
                    <VerificationRow label="80TTA/TTB" fieldName="savingsInterest80TTA" />
                  </div>
                )}

                <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end', background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                  <button onClick={() => handleStatusUpdate(reviewingId, 'rejected')} 
                    style={{ padding: '8px 16px', background: 'white', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                    Reject Submission
                  </button>
                  <button onClick={() => handleStatusUpdate(reviewingId, 'verified')} 
                    style={{ padding: '8px 16px', background: '#10b981', border: 'none', color: 'white', borderRadius: 6, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
                    Approve & Verify Data
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
