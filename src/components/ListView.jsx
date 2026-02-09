import { useState, useMemo } from 'react';
import { STAGES } from '../lib/constants';
import { Badge, Avatar } from './ui';
import {
  MapPin, DollarSign, ChevronUp, ChevronDown, ArrowUpDown,
  Flame, Snowflake, Sun, Sparkles, Trophy, XCircle, Calendar, Building
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

export default function ListView({ deals, onDealClick, theme }) {
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'price') {
        aVal = a.purchase_price || a.asking_price || 0;
        bVal = b.purchase_price || b.asking_price || 0;
      }
      
      if (sortField === 'stage') {
        const stageOrder = STAGES.map(s => s.id);
        aVal = stageOrder.indexOf(a.stage);
        bVal = stageOrder.indexOf(b.stage);
      }

      if (typeof aVal === 'string') {
        return sortDir === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [deals, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + n.toLocaleString();
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const columns = [
    { id: 'name', label: 'Deal', width: 280 },
    { id: 'stage', label: 'Stage', width: 140 },
    { id: 'status', label: 'Status', width: 100 },
    { id: 'price', label: 'Price', width: 120 },
    { id: 'deal_type', label: 'Type', width: 100 },
    { id: 'units', label: 'Units', width: 80 },
    { id: 'contacts', label: 'Contacts', width: 120 },
    { id: 'created_at', label: 'Created', width: 100 },
  ];

  return (
    <div style={{
      background: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.border}`,
        background: theme.bgElevated,
      }}>
        {columns.map((col) => (
          <div
            key={col.id}
            onClick={() => col.id !== 'contacts' && toggleSort(col.id)}
            style={{
              width: col.width,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: sortField === col.id ? theme.accent : theme.textDim,
              cursor: col.id !== 'contacts' ? 'pointer' : 'default',
              userSelect: 'none',
            }}
          >
            {col.label}
            {col.id !== 'contacts' && <SortIcon field={col.id} />}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
        {sortedDeals.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.textDim }}>
            No deals to display
          </div>
        ) : (
          sortedDeals.map((deal, i) => {
            const status = statusConfig[deal.status] || statusConfig.new;
            const StatusIcon = status.icon;
            const stage = STAGES.find(s => s.id === deal.stage);
            const stageColor = stageColors[deal.stage] || '#6b7280';

            return (
              <div
                key={deal.id}
                onClick={() => onDealClick(deal)}
                style={{
                  display: 'flex',
                  padding: '16px',
                  borderBottom: i < sortedDeals.length - 1 ? `1px solid ${theme.border}` : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme.bgElevated}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Deal Name & Address */}
                <div style={{ width: 280, flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{deal.name}</div>
                  {deal.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.textSecondary }}>
                      <MapPin size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                        {deal.address.split(',')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stage */}
                <div style={{ width: 140, flexShrink: 0 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: `${stageColor}15`,
                    fontSize: 12,
                    fontWeight: 500,
                    color: stageColor,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageColor }} />
                    {stage?.label || deal.stage}
                  </span>
                </div>

                {/* Status */}
                <div style={{ width: 100, flexShrink: 0 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: status.bg,
                    fontSize: 11,
                    fontWeight: 600,
                    color: status.color,
                  }}>
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                </div>

                {/* Price */}
                <div style={{ width: 120, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: (deal.purchase_price || deal.asking_price) ? theme.accent : theme.textDim,
                  }}>
                    {fmt(deal.purchase_price || deal.asking_price)}
                  </span>
                </div>

                {/* Type */}
                <div style={{ width: 100, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: theme.textSecondary }}>
                    {deal.deal_type || '—'}
                  </span>
                </div>

                {/* Units */}
                <div style={{ width: 80, flexShrink: 0 }}>
                  {deal.units ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.textSecondary }}>
                      <Building size={12} /> {deal.units}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: theme.textDim }}>—</span>
                  )}
                </div>

                {/* Contacts */}
                <div style={{ width: 120, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {deal.contacts?.slice(0, 3).map((contact, j) => (
                      <div
                        key={contact.id}
                        style={{
                          marginLeft: j > 0 ? -6 : 0,
                          position: 'relative',
                          zIndex: 3 - j,
                        }}
                      >
                        <Avatar name={contact.name} size={24} theme={theme} />
                      </div>
                    ))}
                    {(deal.contacts?.length || 0) > 3 && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: theme.textDim }}>
                        +{deal.contacts.length - 3}
                      </span>
                    )}
                    {!deal.contacts?.length && (
                      <span style={{ fontSize: 11, color: theme.textDim }}>—</span>
                    )}
                  </div>
                </div>

                {/* Created */}
                <div style={{ width: 100, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: theme.textSecondary }}>
                    {new Date(deal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${theme.border}`,
        background: theme.bgElevated,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: theme.textDim }}>
          {sortedDeals.length} deal{sortedDeals.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 12, color: theme.textDim }}>
          Total: <span style={{ fontWeight: 600, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>
            {fmt(sortedDeals.reduce((sum, d) => sum + (d.purchase_price || d.asking_price || 0), 0))}
          </span>
        </span>
      </div>
    </div>
  );
}
