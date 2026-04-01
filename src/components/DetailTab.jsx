import { STATES, STATUS, CATEGORIES } from '../data';

function countByStatus(comp) {
  const counts = { M: 0, V: 0, O: 0, N: 0, C: 0 };
  Object.values(comp.states).forEach((s) => {
    if (counts[s] !== undefined) counts[s]++;
  });
  return counts;
}

export default function DetailTab({ selectedComponent, onComponentSelect, onBack }) {
  if (!selectedComponent) {
    return (
      <div>
        <h2 className="tab-heading">Component Detail View</h2>
        <p className="tab-subheading" style={{ marginBottom: 20 }}>
          Select a component from the matrix or click below to view full details.
        </p>
        <div className="component-card-grid">
          {CATEGORIES.map((cat) =>
            cat.components.map((comp) => (
              <div
                key={comp.id}
                onClick={() =>
                  onComponentSelect({ ...comp, categoryName: cat.name, categoryColor: cat.color })
                }
                className="component-card"
                style={{ borderLeft: `4px solid ${cat.color}` }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div className="comp-name">{comp.name}</div>
                <div className="comp-category" style={{ marginBottom: 8 }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{comp.taxNote}</div>
                <div className="status-badges">
                  {(() => {
                    const counts = countByStatus(comp);
                    return Object.entries(counts)
                      .filter(([, v]) => v > 0)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="status-badge"
                          style={{ background: STATUS[k].bg, color: STATUS[k].color }}
                        >
                          {STATUS[k].symbol} {v}
                        </span>
                      ));
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="back-button">← Back to All Components</button>
      <div className="detail-panel">
        <div
          className="detail-panel-header"
          style={{
            background: `linear-gradient(135deg, ${selectedComponent.categoryColor}22, ${selectedComponent.categoryColor}10)`,
            borderBottom: `3px solid ${selectedComponent.categoryColor}`,
          }}
        >
          <div
            className="detail-panel-category"
            style={{ color: selectedComponent.categoryColor }}
          >
            {selectedComponent.categoryName}
          </div>
          <h2 className="detail-panel-title">{selectedComponent.name}</h2>
          <div className="detail-panel-notes">{selectedComponent.notes}</div>
        </div>
        <div className="detail-panel-body">
          <div className="detail-info-card">
            <div className="detail-info-label">📐 Formula / Base</div>
            <div className="detail-info-value">{selectedComponent.base}</div>
            <div className="detail-info-formula">{selectedComponent.formula}</div>
          </div>
          <div className="detail-info-card">
            <div className="detail-info-label">💡 Tax Treatment</div>
            <div style={{ fontSize: 13, color: "#0f172a" }}>{selectedComponent.taxNote}</div>
          </div>
        </div>
        <div className="detail-states-section">
          <div className="detail-states-heading">State-wise Applicability</div>
          <div className="detail-states-grid">
            {STATES.map((st) => {
              const statusCode = selectedComponent.states[st.code] || "N";
              const s = STATUS[statusCode];
              return (
                <div
                  key={st.code}
                  className="detail-state-item"
                  style={{
                    background: s.bg + "80",
                    border: `1px solid ${s.color}30`,
                  }}
                >
                  <div
                    className="detail-state-icon"
                    style={{
                      background: s.bg,
                      color: s.color,
                      border: `1px solid ${s.color}40`,
                    }}
                  >
                    {s.symbol}
                  </div>
                  <div>
                    <div className="detail-state-name">{st.name}</div>
                    <div className="detail-state-label" style={{ color: s.color }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
