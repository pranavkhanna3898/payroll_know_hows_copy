import { useState } from 'react';
import { PAYROLL_CYCLE } from '../data';

export default function CycleTab() {
  const [hoveredStep, setHoveredStep] = useState(null);

  const isDependency = (stepId) => {
    if (!hoveredStep) return false;
    let hoveredObj = null;
    PAYROLL_CYCLE.forEach(p => {
      const s = p.steps.find(x => x.id === hoveredStep);
      if (s) hoveredObj = s;
    });
    if (!hoveredObj) return false;
    return hoveredObj.dependencies.includes(stepId);
  };

  const isDependentOnHover = (stepId) => {
    if (!hoveredStep) return false;
    let currentObj = null;
    PAYROLL_CYCLE.forEach(p => {
      const s = p.steps.find(x => x.id === stepId);
      if (s) currentObj = s;
    });
    if (!currentObj) return false;
    return currentObj.dependencies.includes(hoveredStep);
  };

  return (
    <div className="cycle-container">
      <div className="cycle-header">
        <h2 className="tab-heading">Indian Payroll Cycle & Data Flow</h2>
        <p className="tab-subheading" style={{ marginBottom: 24, maxWidth: 800 }}>
          Hover over any step to see its interdependencies. 
          Steps highlighted in <span style={{ color: '#10b981', fontWeight: 600 }}>green</span> provide data to the hovered step. 
          Steps highlighted in <span style={{ color: '#8b5cf6', fontWeight: 600 }}>purple</span> depend on data from the hovered step.
        </p>
      </div>

      <div className="cycle-timeline">
        {PAYROLL_CYCLE.map((phase, pIndex) => (
          <div key={pIndex} className="cycle-phase-block">
            <div className="cycle-phase-header" style={{ borderLeftColor: phase.color }}>
              <div className="phase-title" style={{ color: phase.color }}>{phase.phase}</div>
              <div className="phase-timeline">{phase.timeline}</div>
            </div>
            
            <div className="cycle-steps-list">
              {phase.steps.map((step) => {
                const isDep = isDependency(step.id);
                const isDependant = isDependentOnHover(step.id);
                const isHovered = hoveredStep === step.id;
                
                let cardClass = "cycle-step-card detailed-card";
                if (hoveredStep && !isHovered && !isDep && !isDependant) cardClass += " cycle-step-dimmed";
                if (isHovered) cardClass += " cycle-step-active-card";
                if (isDep) cardClass += " cycle-step-dependency";
                if (isDependant) cardClass += " cycle-step-dependent";

                return (
                  <div 
                    key={step.id} 
                    className={cardClass}
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                    style={{ borderLeftColor: isHovered || isDep || isDependant ? undefined : phase.color }}
                  >
                    <div className="detailed-card-header">
                      <div className="step-id">{step.id.toUpperCase().replace('-', ' ')}</div>
                      <div className="step-title">{step.title}</div>
                    </div>
                    <div className="step-desc" style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                      {step.description}
                    </div>

                    <div className="detailed-card-grid">
                      {step.dataDependencies && step.dataDependencies.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-label">📥 Data Inputs / Dependencies</div>
                          <div className="detail-value">
                            {step.dataDependencies.join(" • ")}
                          </div>
                        </div>
                      )}
                      
                      {step.calculationLogic && (
                        <div className="detail-section">
                          <div className="detail-label">🧮 Calculation Logic</div>
                          <div className="detail-value formula-text">
                            {step.calculationLogic}
                          </div>
                        </div>
                      )}

                      {step.interdependenciesText && (
                        <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                          <div className="detail-label">🔗 Interdependencies & Flow</div>
                          <div className="detail-value text-muted">
                            {step.interdependenciesText}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {step.statutory && step.statutory.length > 0 && (
                      <div className="step-statutory-tags" style={{ marginTop: 16 }}>
                        {step.statutory.map((stat, i) => (
                          <span key={i} className="stat-tag">🏛️ {stat}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
