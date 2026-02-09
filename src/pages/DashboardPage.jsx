import { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { themes, animations } from '../lib/theme';
import { STAGES, STATUSES, DEAL_TYPES } from '../lib/constants';
import { Button, StatCard, Avatar, EmptyState } from '../components/ui';
import KanbanView from '../components/KanbanView';
import ListView from '../components/ListView';
import ContactsPage from '../components/ContactsPage';
import DealPanel from '../components/DealPanel';
import NewDealModal from '../components/NewDealModal';
import UnderwritingCalculator from '../components/UnderwritingCalculator';
import FollowUpsPage from '../components/FollowUpsPage';
import PropertyMap from '../components/PropertyMap';
import {
  LayoutGrid, List, Users, Plus, Search, LogOut, Building2, Bell, Calculator, Clock,
  TrendingUp, DollarSign, Briefcase, Sun, Moon, Map, ChevronRight,
  Flame, Target, Zap, Filter, X, Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { deals, profile, signOut } = useStore();
  const [view, setView] = useState('kanban');
  const [activeDealId, setActiveDealId] = useState(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showUnderwriting, setShowUnderwriting] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const theme = darkMode ? themes.dark : themes.light;
  const activeDeal = deals.find((d) => d.id === activeDealId);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!d.name.toLowerCase().includes(term) && !(d.address || '').toLowerCase().includes(term)) return false;
      }
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (filterType !== 'all' && d.deal_type !== filterType) return false;
      return true;
    });
  }, [deals, searchTerm, filterStatus, filterType]);

  const stats = useMemo(() => {
    const totalDeals = deals.length;
    const activeDeals = deals.filter(d => !['dead', 'closed_won'].includes(d.status)).length;
    const pipelineValue = deals.reduce((sum, d) => sum + (d.purchase_price || d.asking_price || 0), 0);
    const hotDeals = deals.filter(d => d.status === 'hot').length;
    return { totalDeals, activeDeals, pipelineValue, hotDeals };
  }, [deals]);

  const followUps = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return deals.flatMap((d) =>
      (d.contacts || []).filter((c) => c.follow_up_date).map((c) => {
        const followDate = new Date(c.follow_up_date);
        const days = Math.ceil((followDate - today) / 86400000);
        return { ...c, dealName: d.name, dealId: d.id, daysUntil: days };
      })
    ).filter((c) => c.daysUntil <= 7 && c.daysUntil >= -3).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [deals]);

  const upcomingDeadlines = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return deals
      .flatMap((d) =>
        (d.deadlines || [])
          .filter((dl) => {
            if (dl.is_done) return false;
            const due = new Date(dl.due_date); due.setHours(0, 0, 0, 0);
            const diff = Math.ceil((due - today) / 86400000);
            return diff >= 0 && diff <= 14;
          })
          .map((dl) => ({ ...dl, dealName: d.name, dealId: d.id }))
      )
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [deals]);

  const daysUntil = (dateStr) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / 86400000);
  };

  const resetViews = () => {
    setShowContacts(false);
    setShowUnderwriting(false);
    setShowFollowUps(false);
    setShowMap(false);
  };

  const fmt = (n) => {
    if (!n) return '$0';
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + n.toLocaleString();
  };

  const isActiveView = (viewName) => {
    if (viewName === 'kanban') return view === 'kanban' && !showContacts && !showUnderwriting && !showFollowUps && !showMap;
    if (viewName === 'list') return view === 'list' && !showContacts && !showUnderwriting && !showFollowUps && !showMap;
    if (viewName === 'contacts') return showContacts;
    if (viewName === 'underwriting') return showUnderwriting;
    if (viewName === 'followups') return showFollowUps;
    if (viewName === 'map') return showMap;
    return false;
  };

  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, color: theme.text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{animations}</style>
      
      {/* ─── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: sidebarWidth,
        background: theme.gradientSidebar,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarCollapsed ? '20px 16px' : '20px 24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: theme.gradientPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadowGlow,
          }}>
            <Building2 size={22} color="#fff" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>DealFlow</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.accent, letterSpacing: 1, textTransform: 'uppercase' }}>PRO</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {/* Views Section */}
          <div style={{ marginBottom: 24 }}>
            {!sidebarCollapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textMuted, padding: '0 12px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={12} /> Pipeline
              </div>
            )}
            {[
              { id: 'kanban', icon: LayoutGrid, label: 'Kanban Board' },
              { id: 'list', icon: List, label: 'List View' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id); resetViews(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: sidebarCollapsed ? '12px' : '12px 16px',
                  width: '100%',
                  border: 'none',
                  background: isActiveView(item.id) ? theme.accentDim : 'transparent',
                  color: isActiveView(item.id) ? theme.accent : theme.textSecondary,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 10,
                  marginBottom: 4,
                  transition: 'all 0.15s ease',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                }}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && item.label}
              </button>
            ))}
          </div>

          {/* Tools Section */}
          <div style={{ marginBottom: 24 }}>
            {!sidebarCollapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textMuted, padding: '0 12px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={12} /> Tools
              </div>
            )}
            {[
              { id: 'map', icon: Map, label: 'Property Map', onClick: () => { setShowMap(true); setShowFollowUps(false); setShowContacts(false); setShowUnderwriting(false); } },
              { id: 'underwriting', icon: Calculator, label: 'Underwriting', onClick: () => { setShowUnderwriting(true); setShowContacts(false); setShowFollowUps(false); setShowMap(false); } },
              { id: 'followups', icon: Clock, label: 'Follow-Ups', badge: followUps.length, onClick: () => { setShowFollowUps(true); setShowContacts(false); setShowUnderwriting(false); setShowMap(false); } },
              { id: 'contacts', icon: Users, label: 'All Contacts', onClick: () => { setShowContacts(true); setShowUnderwriting(false); setShowFollowUps(false); setShowMap(false); } },
            ].map(item => (
              <button
                key={item.id}
                onClick={item.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: sidebarCollapsed ? '12px' : '12px 16px',
                  width: '100%',
                  border: 'none',
                  background: isActiveView(item.id) ? theme.accentDim : 'transparent',
                  color: isActiveView(item.id) ? theme.accent : theme.textSecondary,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 10,
                  marginBottom: 4,
                  transition: 'all 0.15s ease',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  position: 'relative',
                }}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge > 0 && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: theme.error,
                        color: '#fff',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {sidebarCollapsed && item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: theme.error,
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Upcoming Deadlines */}
          {!sidebarCollapsed && upcomingDeadlines.length > 0 && (
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textMuted, padding: '0 12px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={12} /> Upcoming
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {upcomingDeadlines.slice(0, 4).map((dl) => {
                  const days = daysUntil(dl.due_date);
                  return (
                    <div
                      key={dl.id}
                      onClick={() => { setActiveDealId(dl.dealId); resetViews(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        marginBottom: 4,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontFamily: "'JetBrains Mono', monospace",
                        background: days <= 3 ? theme.errorDim : days <= 7 ? theme.warningDim : theme.successDim,
                        color: days <= 3 ? theme.error : days <= 7 ? theme.warning : theme.success,
                        minWidth: 44,
                        textAlign: 'center',
                      }}>
                        {days === 0 ? 'TODAY' : `${days}d`}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dl.title}</div>
                        <div style={{ fontSize: 10, color: theme.textDim }}>{dl.dealName}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User Section */}
        <div style={{ padding: '16px', borderTop: `1px solid ${theme.border}` }}>
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={profile?.email} size={36} theme={theme} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 11, color: theme.textDim }}>Pro Plan</div>
              </div>
              <button
                onClick={signOut}
                style={{ padding: 8, background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', borderRadius: 8 }}
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={signOut}
              style={{
                width: '100%',
                padding: 12,
                background: 'none',
                border: 'none',
                color: theme.textDim,
                cursor: 'pointer',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'center',
              }}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute',
            right: -12,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme.textDim,
            boxShadow: theme.shadowMd,
          }}
        >
          <ChevronRight size={14} style={{ transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s ease' }} />
        </button>
      </aside>

      {/* ─── Main Content ────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          padding: '16px 28px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: theme.bgCard,
        }}>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textDim }} />
            <input
              type="text"
              placeholder="Search deals by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 46px',
                background: theme.bgElevated,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                fontSize: 14,
                color: theme.text,
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: showFilters ? theme.accentDim : theme.bgElevated,
              border: `1px solid ${showFilters ? theme.accent : theme.border}`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              color: showFilters ? theme.accent : theme.textSecondary,
              cursor: 'pointer',
            }}
          >
            <Filter size={16} />
            Filters
            {(filterStatus !== 'all' || filterType !== 'all') && (
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: theme.accent,
              }} />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: 10,
              background: theme.bgElevated,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              color: theme.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* New Deal Button */}
          <Button
            onClick={() => setShowNewDeal(true)}
            icon={Plus}
            theme={theme}
          >
            New Deal
          </Button>
        </header>

        {/* Filters Bar (Collapsible) */}
        {showFilters && (
          <div style={{
            padding: '12px 28px',
            background: theme.bgElevated,
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'slideInDown 0.2s ease',
          }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: theme.text,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: theme.text,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              <option value="all">All Types</option>
              {DEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            {(filterStatus !== 'all' || filterType !== 'all') && (
              <button
                onClick={() => { setFilterStatus('all'); setFilterType('all'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  color: theme.error,
                  cursor: 'pointer',
                }}
              >
                <X size={14} /> Clear Filters
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: 12, color: theme.textDim }}>
              {filteredDeals.length} of {deals.length} deals
            </div>
          </div>
        )}

        {/* Main Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: showMap ? 0 : '24px 28px' }}>
          {/* Stats Cards */}
          {!showContacts && !showUnderwriting && !showFollowUps && !showMap && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20,
              marginBottom: 28,
            }}>
              <StatCard
                icon={Briefcase}
                label="Total Deals"
                value={stats.totalDeals}
                color="#3b82f6"
                theme={theme}
              />
              <StatCard
                icon={TrendingUp}
                label="Active Deals"
                value={stats.activeDeals}
                color="#10b981"
                theme={theme}
              />
              <StatCard
                icon={DollarSign}
                label="Pipeline Value"
                value={fmt(stats.pipelineValue)}
                color="#f59e0b"
                theme={theme}
              />
              <StatCard
                icon={Flame}
                label="Hot Deals"
                value={stats.hotDeals}
                color="#ef4444"
                theme={theme}
              />
            </div>
          )}

          {/* Content */}
          {showMap ? (
            <PropertyMap
              theme={theme}
              onSelectProperty={(property) => {
                setShowNewDeal(true);
              }}
            />
          ) : showContacts ? (
            <ContactsPage onDealClick={(id) => { setActiveDealId(id); resetViews(); }} theme={theme} />
          ) : showUnderwriting ? (
            <UnderwritingCalculator theme={theme} />
          ) : showFollowUps ? (
            <FollowUpsPage followUps={followUps} onDealClick={(id) => { setActiveDealId(id); resetViews(); }} theme={theme} />
          ) : filteredDeals.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Deals Found"
              description={searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? "No deals match your current filters. Try adjusting your search or filters."
                : "Get started by creating your first deal. Track properties, contacts, and deadlines all in one place."
              }
              action={
                <Button onClick={() => setShowNewDeal(true)} icon={Plus} theme={theme}>
                  Create Your First Deal
                </Button>
              }
              theme={theme}
            />
          ) : view === 'kanban' ? (
            <KanbanView deals={filteredDeals} onDealClick={(d) => setActiveDealId(d.id)} theme={theme} />
          ) : (
            <ListView deals={filteredDeals} onDealClick={(d) => setActiveDealId(d.id)} theme={theme} />
          )}
        </div>
      </div>

      {/* ─── Modals & Panels ─────────────────────────── */}
      {activeDeal && <DealPanel deal={activeDeal} onClose={() => setActiveDealId(null)} theme={theme} />}
      {showNewDeal && <NewDealModal onClose={() => setShowNewDeal(false)} theme={theme} />}
    </div>
  );
}
