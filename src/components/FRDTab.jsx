import { useState, useMemo } from 'react';
import { FRD_META, FRD_SECTIONS } from '../data/frdContent';
import Mermaid from './common/Mermaid';

export default function FRDTab() {
  const [activeSection, setActiveSection] = useState('exec-summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFormulas, setExpandedFormulas] = useState({});
  const [expandedReqs, setExpandedReqs] = useState({});

  const section = FRD_SECTIONS.find(s => s.id === activeSection);

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return FRD_SECTIONS;
    const q = searchTerm.toLowerCase();
    return FRD_SECTIONS.filter(s =>
      s.title.toLowerCase().includes(q) ||
      JSON.stringify(s).toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const toggleFormula = (gIdx) => setExpandedFormulas(p => ({ ...p, [gIdx]: !p[gIdx] }));
  const toggleReq = (gIdx) => setExpandedReqs(p => ({ ...p, [gIdx]: !p[gIdx] }));

  const renderCallout = (callout) => {
    if (!callout) return null;
    const colors = {
      important: { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ️', label: 'IMPORTANT' },
      warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠️', label: 'WARNING' },
    };
    const c = colors[callout.type] || colors.important;
    return (
      <div style={{ background: c.bg, borderLeft: `4px solid ${c.border}`, padding: '14px 18px', borderRadius: '0 8px 8px 0', margin: '16px 0', fontSize: 13, lineHeight: 1.6 }}>
        <strong style={{ color: c.border }}>{c.icon} {c.label}</strong>
        <div style={{ marginTop: 6 }}>{callout.text}</div>
      </div>
    );
  };

  const renderTable = (headers, rows, opts = {}) => (
    <div style={{ overflowX: 'auto', margin: '12px 0' }}>
      <table className="frd-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ background: '#f1f5f9', padding: '10px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #cbd5e1', color: '#334155', whiteSpace: 'nowrap', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '9px 14px',
                  borderBottom: '1px solid #e2e8f0',
                  fontFamily: opts.mono && ci > 0 ? "'Consolas', 'Monaco', monospace" : 'inherit',
                  fontSize: opts.mono && ci > 0 ? 12 : 13,
                  color: ci === 0 ? '#1e40af' : '#334155',
                  fontWeight: ci === 0 ? 600 : 400,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPipeline = (steps) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, idx) => (
        <div key={idx}>
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '20px 24px',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff',
                width: 36, height: 36,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}>
                {step.step}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{step.title}</div>
                <code style={{ fontSize: 11, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 4 }}>{step.component}</code>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
              {step.actions.map((a, ai) => (
                <li key={ai} style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{a}</li>
              ))}
            </ul>
          </div>
          {idx < steps.length - 1 && (
            <div style={{ textAlign: 'center', padding: '4px 0', color: '#94a3b8', fontSize: 20 }}>↓</div>
          )}
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (!section) return <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Select a section from the sidebar</div>;

    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Section {section.number}</div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#1e293b', fontWeight: 700 }}>{section.title}</h2>
        </div>

        {/* Generic content */}
        {section.content && (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-line' }}>{section.content}</div>
        )}

        {section.intro && (
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#475569', marginBottom: 16 }}>{section.intro}</p>
        )}

        {section.diagram && (
          <div style={{ marginBottom: 24, padding: '10px', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Mermaid chart={section.diagram} />
          </div>
        )}

        {section.callout && renderCallout(section.callout)}

        {/* Database Schema and other tables */}
        {section.tables && section.tables.map((tbl, ti) => (
          <div key={ti} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, color: '#1e40af', marginBottom: 4, fontWeight: 700 }}>
              <code style={{ background: '#eef2ff', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{tbl.name}</code>
              {tbl.description && <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8, fontSize: 13 }}>— {tbl.description}</span>}
            </h3>
            {renderTable(tbl.headers || ["Column", "Type", "Description"], tbl.columns)}
          </div>
        ))}

        {/* Pipeline steps */}
        {section.steps && renderPipeline(section.steps)}

        {/* Functional Requirements */}
        {section.requirementGroups && section.requirementGroups.map((grp, gi) => (
          <div key={gi} style={{ marginBottom: 20 }}>
            <button onClick={() => toggleReq(gi)} style={{
              background: expandedReqs[gi] ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#f1f5f9',
              color: expandedReqs[gi] ? '#fff' : '#334155',
              border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14, width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'all 0.2s ease',
            }}>
              {grp.group}
              <span style={{ fontSize: 12 }}>{expandedReqs[gi] ? '▼' : '▶'} {grp.items.length} requirements</span>
            </button>
            {expandedReqs[gi] && renderTable(
              ["ID", "Requirement", "Priority"],
              grp.items.map(r => [r.id, r.req, r.priority]),
            )}
          </div>
        ))}

        {/* Formulas */}
        {section.formulaGroups && section.formulaGroups.map((grp, gi) => (
          <div key={gi} style={{ marginBottom: 16 }}>
            <button onClick={() => toggleFormula(gi)} style={{
              background: expandedFormulas[gi] ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : '#f5f3ff',
              color: expandedFormulas[gi] ? '#fff' : '#5b21b6',
              border: expandedFormulas[gi] ? 'none' : '1px solid #ddd6fe',
              borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'all 0.2s ease',
            }}>
              {grp.group}
              <span style={{ fontSize: 12, fontWeight: 400 }}>{expandedFormulas[gi] ? '▼' : '▶'} {grp.items.length} formulae</span>
            </button>
            {expandedFormulas[gi] && renderTable(
              ["ID", "Name", "Formula", "Notes"],
              grp.items.map(f => [f.id, f.name, f.formula, f.notes]),
              { mono: true },
            )}
          </div>
        ))}

        {/* Tax Slabs */}
        {section.slabs && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h3 style={{ color: '#059669', marginBottom: 8, fontSize: 15 }}>🆕 New Regime ({section.slabs.newRegime.fy})</h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>Standard Deduction: {section.slabs.newRegime.standardDeduction} | Rebate: {section.slabs.newRegime.rebate}</p>
              {renderTable(["Income Slab", "Rate"], section.slabs.newRegime.rows)}
            </div>
            <div>
              <h3 style={{ color: '#dc2626', marginBottom: 8, fontSize: 15 }}>📜 Old Regime</h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>Standard Deduction: {section.slabs.oldRegime.standardDeduction} | Rebate: {section.slabs.oldRegime.rebate}</p>
              {renderTable(["Income Slab", "Rate"], section.slabs.oldRegime.rows)}
            </div>
          </div>
        )}

        {/* Config Items */}
        {section.configItems && renderTable(["Setting", "Options", "Effect"], section.configItems.map(c => [c.key, c.options, c.effect]))}

        {/* Salary Statuses */}
        {section.statuses && (
          <div style={{ display: 'grid', gap: 12 }}>
            {section.statuses.map((s, si) => (
              <div key={si} style={{ background: s.status === 'withheld' ? '#fefce8' : s.status === 'absconding' ? '#fef2f2' : s.status === 'fnf_pending' ? '#eff6ff' : '#f0fdf4', border: '1px solid', borderColor: s.status === 'withheld' ? '#fde047' : s.status === 'absconding' ? '#fca5a5' : s.status === 'fnf_pending' ? '#93c5fd' : '#86efac', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <code style={{ background: '#1e293b', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{s.status}</code>
                  {s.badge !== '—' && <span style={{ fontSize: 11, background: s.status === 'absconding' ? '#dc2626' : s.status === 'withheld' ? '#eab308' : '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{s.badge}</span>}
                </div>
                <div style={{ fontSize: 13, color: '#334155' }}>{s.behavior}</div>
              </div>
            ))}
          </div>
        )}

        {/* Export Specs */}
        {section.exports && renderTable(["Export", "Format", "Content"], section.exports.map(e => [e.name, e.format, e.content]))}

        {/* Exit/FnF */}
        {section.scenarios && renderTable(["Scenario", "Engine Behavior"], section.scenarios.map(e => [e.scenario, e.behavior]))}

        {/* Prerequisites */}
        {section.prereqGroups && section.prereqGroups.map((grp, gi) => (
          <div key={gi} style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, color: '#1e40af', marginBottom: 8 }}>{grp.group}</h3>
            {renderTable(["Prerequisite", "Description"], grp.items.map(p => [p.prereq, p.desc]))}
          </div>
        ))}

        {/* NFR */}
        {section.nfrItems && renderTable(["ID", "Requirement"], section.nfrItems.map(n => [n.id, n.req]))}

        {/* Glossary */}
        {section.terms && renderTable(["Term", "Definition"], section.terms.map(t => [t.term, t.definition]))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 200px)', background: '#f8fafc', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {/* Sidebar */}
      <div style={{ width: 280, flexShrink: 0, background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', padding: '20px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>📄 FRD v{FRD_META.version}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
            {FRD_META.date}<br />
            {FRD_META.module}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px' }}>
          <input
            type="text"
            placeholder="🔍 Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: '#334155', border: '1px solid #475569', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Section links */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredSections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                background: activeSection === s.id ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                color: activeSection === s.id ? '#fff' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeSection === s.id ? 600 : 400,
                borderLeft: activeSection === s.id ? '3px solid #60a5fa' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 11, color: activeSection === s.id ? '#bfdbfe' : '#64748b', marginRight: 6 }}>{s.number}.</span>
              {s.title}
            </button>
          ))}
        </div>

        {/* Footer stats */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', fontSize: 11, color: '#64748b' }}>
          {FRD_SECTIONS.length} sections • 49 formulae • 67 requirements
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        {renderContent()}
      </div>
    </div>
  );
}
