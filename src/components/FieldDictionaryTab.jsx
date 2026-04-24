import { useState, useMemo } from 'react';
import { FIELD_DICTIONARY } from '../data/fieldDictionary';

const TabButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 16px',
      background: active ? '#4f46e5' : 'transparent',
      color: active ? 'white' : '#64748b',
      border: 'none',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s',
      width: '100%'
    }}
  >
    {children}
  </button>
);

const Badge = ({ children, type }) => {
  let color = '#6366f1';
  if (type) {
    const t = type.toLowerCase();
    if (t.includes('dropdown')) color = '#7c3aed';
    else if (t.includes('number')) color = '#0891b2';
    else if (t.includes('date')) color = '#059669';
  }
  
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 10,
      fontWeight: 700,
      background: `${color}15`,
      color: color,
      textTransform: 'uppercase',
      letterSpacing: 0.5
    }}>
      {children}
    </span>
  );
};

export default function FieldDictionaryTab() {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const activeModule = FIELD_DICTIONARY[activeModuleIndex];

  const filteredGroups = useMemo(() => {
    if (!activeModule) return [];
    const search = searchTerm.toLowerCase().trim();
    
    return activeModule.groups.map(group => {
      const matchedFields = group.fields.filter(f => 
        !search || 
        (f.name || "").toLowerCase().includes(search) || 
        (f.description || "").toLowerCase().includes(search)
      );
      return { ...group, fields: matchedFields };
    }).filter(g => g.fields.length > 0);
  }, [activeModule, searchTerm]);

  if (!activeModule) return <div style={{ padding: 40 }}>Module not found.</div>;

  return (
    <div style={{ display: 'flex', gap: 24, minHeight: '600px', height: 'calc(100vh - 200px)' }}>
      {/* Sidebar Navigation */}
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 4, background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', flexShrink: 0, overflowY: 'auto' }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginLeft: 12, marginBottom: 8 }}>Modules</h3>
        {FIELD_DICTIONARY.map((m, idx) => (
          <TabButton 
            key={m.module} 
            active={activeModuleIndex === idx} 
            onClick={() => {
              setActiveModuleIndex(idx);
              setSearchTerm("");
            }}
          >
            {m.module}
          </TabButton>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', paddingRight: 8 }}>
        <div style={{ background: 'white', padding: '20px 24px', borderRadius: 12, border: '1px solid #e2e8f0', sticky: 'top', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{activeModule.module}</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>{activeModule.description}</p>
          
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text"
              placeholder="Search by field name or keyword..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s',
                ':focus': { borderColor: '#4f46e5', boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)' }
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredGroups.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>No fields found</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Try adjusting your search term or picking a different module.</div>
            </div>
          ) : (
            filteredGroups.map((group, gIdx) => (
              <div key={`${group.name}-${gIdx}`} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {group.name}
                </div>
                <div style={{ padding: '0 20px' }}>
                  {group.fields.map((field, fIdx) => (
                    <div key={`${field.name}-${fIdx}`} style={{ padding: '24px 0', borderBottom: fIdx === group.fields.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{field.name}</span>
                          <Badge type={field.type}>{field.type}</Badge>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: 14, color: '#334155', margin: '0 0 16px 0', lineHeight: 1.6 }}>
                        {field.description}
                      </p>
                      
                      {field.options && field.options.length > 0 && (
                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>Selectable Options</div>
                          <div style={{ display: 'grid', gap: 12 }}>
                            {field.options.map((opt, oIdx) => (
                              <div key={`${opt.value}-${oIdx}`} style={{ display: 'flex', gap: 16, fontSize: 13, lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 700, minWidth: 120, color: '#1e293b' }}>{opt.value}</span>
                                <span style={{ color: '#64748b' }}>{opt.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

