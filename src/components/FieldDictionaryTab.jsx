import { useState } from 'react';
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
      transition: 'all 0.2s'
    }}
  >
    {children}
  </button>
);

const Badge = ({ children, color = '#6366f1' }) => (
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

export default function FieldDictionaryTab() {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const module = FIELD_DICTIONARY[activeModuleIndex];

  const filteredGroups = module.groups.map(group => ({
    ...group,
    fields: group.fields.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(g => g.fields.length > 0);

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 180px)' }}>
      {/* Sidebar Navigation */}
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 4, background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginLeft: 12, marginBottom: 8 }}>Modules</h3>
        {FIELD_DICTIONARY.map((m, idx) => (
          <TabButton 
            key={m.module} 
            active={activeModuleIndex === idx} 
            onClick={() => setActiveModuleIndex(idx)}
          >
            {m.module}
          </TabButton>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', paddingRight: 8 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{module.module}</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>{module.description}</p>
          
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input 
              type="text"
              placeholder="Search fields or definitions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            No fields found matching "{searchTerm}" in this module.
          </div>
        ) : (
          filteredGroups.map(group => (
            <div key={group.name} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                {group.name}
              </div>
              <div style={{ padding: '0 20px' }}>
                {group.fields.map((field, fIdx) => (
                  <div key={field.name} style={{ padding: '20px 0', borderBottom: fIdx === group.fields.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{field.name}</span>
                        <Badge color={field.type === 'Dropdown' ? '#7c3aed' : field.type === 'Number' ? '#0891b2' : '#6366f1'}>
                          {field.type}
                        </Badge>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px 0', lineHeight: 1.5 }}>{field.description}</p>
                    
                    {field.options && (
                      <div style={{ padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Available Options</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {field.options.map(opt => (
                            <div key={opt.value} style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                              <span style={{ fontWeight: 700, minWidth: 100, color: '#334155' }}>• {opt.value}</span>
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
  );
}
