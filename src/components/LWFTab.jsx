import { STATES } from '../data';
import { LWF_DETAILS } from '../data';

export default function LWFTab() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="tab-heading">Labour Welfare Fund — State-wise Details</h2>
        <p className="tab-subheading">
          Governed by state LWF Acts. Nominal amounts; mandatory where applicable. Both employee and employer contribute.
        </p>
      </div>
      <div className="card-grid">
        {STATES.map((st) => {
          const lwf = LWF_DETAILS[st.code];
          const hasLWF = lwf && lwf.emp !== "N/A";
          return (
            <div
              key={st.code}
              className="state-card"
              style={{
                border: hasLWF ? "1px solid #d1fae5" : "1px solid #e2e8f0",
                borderLeft: `4px solid ${hasLWF ? "#059669" : "#e2e8f0"}`,
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
                    background: hasLWF ? "#d1fae5" : "#f1f5f9",
                    color: hasLWF ? "#059669" : "#9ca3af",
                  }}
                >
                  {hasLWF ? "LWF Applicable" : "No LWF"}
                </div>
              </div>
              {hasLWF ? (
                <div className="lwf-details-grid">
                  <div className="detail-chip detail-chip--green">
                    <div className="detail-chip-label">Employee</div>
                    <div className="detail-chip-value" style={{ color: "#059669" }}>{lwf.emp}</div>
                  </div>
                  <div className="detail-chip detail-chip--purple">
                    <div className="detail-chip-label">Employer</div>
                    <div className="detail-chip-value" style={{ color: "#7c3aed" }}>{lwf.er}</div>
                  </div>
                  <div className="detail-chip detail-chip--amber">
                    <div className="detail-chip-label">Frequency</div>
                    <div className="detail-chip-value" style={{ color: "#d97706" }}>{lwf.freq}</div>
                  </div>
                </div>
              ) : (
                <div className="state-card-empty">
                  No Labour Welfare Fund Act applicable in this state.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
