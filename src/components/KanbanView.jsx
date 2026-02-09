import { useMemo } from 'react';
import { STAGES } from '../lib/constants';
import { Badge, Avatar } from './ui';
import { 
  MapPin, DollarSign, Building, Calendar, Users, 
  Flame, Snowflake, Sun, Sparkles, Trophy, XCircle,
  ChevronRight, AlertTriangle, FileText
} from 'lucide-react';

const statusConfig = {
  new: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: Sparkles, label: 'New' },
  hot: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', icon: Flame, label: 'Hot' },
  warm: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: Sun, label: 'Warm' },
  cold: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)', icon: Snowflake, label: 'Cold' },
  dead: { color: '#374151', bg: 'rgba(55, 65, 81, 0.12)', icon: XCircle, label: 'Dead' },
  closed_won: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: Trophy, label: 'Won' },
};

const stageColors = {
  prospect: '#6366f1',
  outreach: '#8b5cf6',
  tour: '#a855f7',
  loi: '#d946ef',
  due_diligence: '#ec4899',
  contract: '#f43f5e',
  closing: '#10b981',
};

export default function KanbanView({ deals, onDealClick, theme }) {
  const columns = useMemo(() => {
    return STAGES.map((stage) => ({
      ...stage,
      deals: deals.filter((d) => d.stage === stage.id),
      color: stageColors[stage.id] || '#6b7280',
    }));
  }, [deals]);

  const fmt = (n) => {
    if (!n) return null;
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + n.toLocaleString();
  };

  const getUpcomingDeadline = (deal) => {
    if (!deal.deadlines?.length) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = deal.deadlines
      .filter(d => !d.is_done && new Date(d.due_date) >= today)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
    
    if (!upcoming) return null;
    
    const dueDate = new Date(upcoming.due_date);
    const days = Math.ceil((dueDate - today) / 86400000);
    
    return { ...upcoming, days };
  };

  return (
    <div style={{
      display: 'flex',
      gap: 16,
      height: 'calc(100vh - 220px)',
      overflowX: 'auto',
      paddingBottom: 16,
    }}>
      {columns.map((column) => (
        <div
          key={column.id}
          style={{
            minWidth: 300,
            width: 300,
            background: theme.bgCard,
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Column Header */}
          <div style={{
            padding: '16px 18px',
            borderBottom: `1px solid ${theme.border}`,
            background: `linear-gradient(180deg, ${column.color}08 0%, transparent 100%)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  background: column.color,
                }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{column.label}</span>
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 8,
                background: theme.bgElevated,
                color: theme.textSecondary,
              }}>
                {column.deals.length}
              </span>
            </div>
            
            {/* Column Stats */}
            {column.deals.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                <div style={{ fontSize: 11, color: theme.textDim }}>
                  <span style={{ fontWeight: 600, color: theme.text }}>
                    {fmt(column.deals.reduce((sum, d) => sum + (d.purchase_price || d.asking_price || 0), 0))}
                  </span>
                  {' '}total
                </div>
              </div>
            )}
          </div>

          {/* Cards */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {column.deals.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: theme.textDim,
              }}>
                <div style={{ fontSize: 13 }}>No deals in this stage</div>
              </div>
            ) : (
              column.deals.map((deal) => {
                const status = statusConfig[deal.status] || statusConfig.new;
                const StatusIcon = status.icon;
                const deadline = getUpcomingDeadline(deal);
                const contactCount = deal.contacts?.length || 0;
                const checklistProgress = deal.checklist_items?.length > 0
                  ? Math.round((deal.checklist_items.filter(c => c.is_done).length / deal.checklist_items.length) * 100)
                  : null;

                return (
                  <div
                    key={deal.id}
                    onClick={() => onDealClick(deal)}
                    style={{
                      background: theme.bgElevated,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 12,
                      padding: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = theme.shadowMd;
                      e.currentTarget.style.borderColor = theme.borderLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = theme.border;
                    }}
                  >
                    {/* Status indicator line */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: status.color,
                      opacity: 0.8,
                    }} />

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: 14,
                          fontWeight: 700,
                          margin: 0,
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {deal.name}
                        </h4>
                        {deal.address && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            color: theme.textSecondary,
                          }}>
                            <MapPin size={12} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {deal.address.split(',')[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: status.bg,
                        color: status.color,
                        fontSize: 10,
                        fontWeight: 600,
                      }}>
                        <StatusIcon size={12} />
                        {status.label}
                      </div>
                    </div>

                    {/* Price & Type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      {(deal.purchase_price || deal.asking_price) && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 15,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: theme.accent,
                        }}>
                          {fmt(deal.purchase_price || deal.asking_price)}
                        </div>
                      )}
                      {deal.deal_type && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: theme.bgCard,
                          color: theme.textDim,
                        }}>
                          {deal.deal_type}
                        </span>
                      )}
                    </div>

                    {/* Property Details */}
                    {(deal.units || deal.sqft) && (
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: theme.textSecondary }}>
                        {deal.units > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building size={12} /> {deal.units} units
                          </span>
                        )}
                        {deal.sqft > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{deal.sqft.toLocaleString()}</span> SF
                          </span>
                        )}
                      </div>
                    )}

                    {/* Progress Bar */}
                    {checklistProgress !== null && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}>
                          <span style={{ fontSize: 10, color: theme.textDim, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FileText size={10} /> Checklist
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: theme.textSecondary }}>
                            {checklistProgress}%
                          </span>
                        </div>
                        <div style={{
                          height: 4,
                          background: theme.bgCard,
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${checklistProgress}%`,
                            height: '100%',
                            background: checklistProgress === 100 ? theme.success : theme.accent,
                            borderRadius: 2,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Deadline Alert */}
                    {deadline && deadline.days <= 7 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: deadline.days <= 3 ? theme.errorDim : theme.warningDim,
                        marginBottom: 12,
                      }}>
                        <AlertTriangle size={12} color={deadline.days <= 3 ? theme.error : theme.warning} />
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: deadline.days <= 3 ? theme.error : theme.warning,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {deadline.title}
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: deadline.days <= 3 ? theme.error : theme.warning,
                        }}>
                          {deadline.days === 0 ? 'TODAY' : `${deadline.days}d`}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 10,
                      borderTop: `1px solid ${theme.border}`,
                    }}>
                      {/* Contacts */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {deal.contacts?.slice(0, 3).map((contact, i) => (
                          <div
                            key={contact.id}
                            style={{
                              marginLeft: i > 0 ? -8 : 0,
                              position: 'relative',
                              zIndex: 3 - i,
                            }}
                          >
                            <Avatar name={contact.name} size={24} theme={theme} />
                          </div>
                        ))}
                        {contactCount > 3 && (
                          <span style={{
                            marginLeft: 4,
                            fontSize: 10,
                            color: theme.textDim,
                            fontWeight: 500,
                          }}>
                            +{contactCount - 3}
                          </span>
                        )}
                        {contactCount === 0 && (
                          <span style={{ fontSize: 11, color: theme.textDim }}>No contacts</span>
                        )}
                      </div>

                      {/* View Arrow */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: theme.textDim,
                      }}>
                        View <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
