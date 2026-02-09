import { useStore } from '../lib/store';
import { Mail, Phone, Users, Building } from 'lucide-react';

export default function ContactsPage({ onDealClick, theme }) {
  const { deals } = useStore();

  const allContacts = deals.flatMap((d) =>
    (d.contacts || []).map((c) => ({ ...c, dealName: d.name, dealId: d.id }))
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: `${theme.accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent,
        }}>
          <Users size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>All Contacts</h2>
          <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>{allContacts.length} contacts across all deals</p>
        </div>
      </div>

      {allContacts.length === 0 ? (
        <div style={{
          background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14,
          padding: 60, textAlign: 'center', color: theme.textSecondary,
        }}>
          <Users size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No contacts yet</p>
          <p style={{ fontSize: 14, color: theme.textDim }}>Add contacts through deal detail panels.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {allContacts.map((c, i) => (
            <div
              key={c.id + '-' + i}
              style={{
                background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20,
                transition: 'all 0.2s ease', cursor: 'pointer',
              }}
              onClick={() => onDealClick(c.dealId)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.borderLight; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: `${theme.accent}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: theme.accent,
                }}>
                  {c.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: theme.textDim }}>{c.role}{c.company ? ` · ${c.company}` : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: theme.textSecondary }}>
                    <Mail size={15} /> {c.email}
                  </div>
                )}
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: theme.textSecondary }}>
                    <Phone size={15} /> {c.phone}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: theme.accent, background: `${theme.accent}08`,
                  padding: '6px 12px', borderRadius: 6, fontWeight: 500,
                }}>
                  <Building size={14} /> {c.dealName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
