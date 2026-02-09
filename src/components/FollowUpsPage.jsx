import { Clock, Mail, Phone, Building } from 'lucide-react';

export default function FollowUpsPage({ followUps, onDealClick, theme }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: `${theme.accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent,
        }}>
          <Clock size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Contact Follow-Ups</h2>
          <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>{followUps.length} contacts due this week</p>
        </div>
      </div>

      {followUps.length === 0 ? (
        <div style={{
          background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14,
          padding: 60, textAlign: 'center', color: theme.textSecondary,
        }}>
          <Clock size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No follow-ups due</p>
          <p style={{ fontSize: 14, color: theme.textDim }}>You're all caught up! Add follow-up dates to your contacts to see them here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {followUps.map((contact, i) => {
            const isOverdue = contact.daysUntil < 0;
            const isToday = contact.daysUntil === 0;
            const isSoon = contact.daysUntil <= 2;
            
            const bgColor = isOverdue ? 'rgba(239,68,68,0.06)' : isToday ? 'rgba(245,158,11,0.06)' : 'transparent';
            const badgeBg = isOverdue ? 'rgba(239,68,68,0.12)' : isToday ? 'rgba(245,158,11,0.12)' : isSoon ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
            const badgeColor = isOverdue ? '#dc2626' : isToday ? '#d97706' : isSoon ? '#d97706' : '#059669';
            const badgeText = isOverdue ? `${Math.abs(contact.daysUntil)}d overdue` : isToday ? 'Today' : contact.daysUntil === 1 ? 'Tomorrow' : `${contact.daysUntil} days`;

            return (
              <div
                key={contact.id + '-' + i}
                style={{
                  background: bgColor || theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 14,
                  padding: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => onDealClick(contact.dealId)}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: `${theme.accent}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: theme.accent, flexShrink: 0,
                }}>
                  {contact.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{contact.name}</div>
                  <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>
                    {contact.role}{contact.company ? ` · ${contact.company}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: theme.textDim }}>
                    {contact.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={14} /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={14} /> {contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8,
                    fontFamily: "'JetBrains Mono', monospace", background: badgeBg, color: badgeColor, marginBottom: 8,
                  }}>
                    {badgeText}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: theme.accent }}>
                    <Building size={14} /> {contact.dealName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
