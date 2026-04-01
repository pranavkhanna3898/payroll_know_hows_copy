import { STATES } from '../data';
import { PT_DETAILS } from '../data';

export default function PTTab() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="tab-heading">Professional Tax — State-wise Slabs</h2>
        <p className="tab-subheading">
          Governed by state Professional Tax Acts. Max ₹2,500/year. Deductible u/s 16(iii) of Income Tax Act.
        </p>
      </div>
      <div className="card-grid">
        {STATES.map((st) => {
          const pt = PT_DETAILS[st.code];
          const hasPT = pt && pt.rate !== "N/A";
          return (
            <div
              key={st.code}
              className="state-card"
              style={{
                border: hasPT ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                borderLeft: `4px solid ${hasPT ? "#1e40af" : "#e2e8f0"}`,
              }}
            >
              <div className="state-card-header">
                <div>
                  <div className="state-card-name">{st.name}</div>
                  <div className="state-card-code">{st.code}</div>
                </div>
                <div
                  className="state-card-badge"
                  style={{
                    background: hasPT ? "#dbeafe" : "#f1f5f9",
                    color: hasPT ? "#1e40af" : "#9ca3af",
                  }}
                >
                  {hasPT ? "PT Applicable" : "No PT"}
                </div>
              </div>
              {hasPT ? (
                <>
                  <div className="state-card-details">
                    <div className="detail-chip detail-chip--blue">
                      <div className="detail-chip-label">Rate</div>
                      <div className="detail-chip-value" style={{ color: "#0369a1" }}>{pt.rate}</div>
                    </div>
                    <div className="detail-chip detail-chip--green">
                      <div className="detail-chip-label">Frequency</div>
                      <div className="detail-chip-value" style={{ color: "#16a34a" }}>{pt.freq}</div>
                    </div>
                  </div>
                  <div className="state-card-note">📌 {pt.notes}</div>
                </>
              ) : (
                <div className="state-card-empty">
                  No Professional Tax legislation in this state.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
