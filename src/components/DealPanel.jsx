import { useState } from 'react';
import { useStore } from '../lib/store';
import { STAGES, STATUSES, DEAL_TYPES, CONTACT_ROLES, statusOf } from '../lib/constants';
import { X, Trash2, Plus, Check, FileText, Users, Calendar, DollarSign, ListTodo, AlertTriangle, Home, Upload, Unlink, MapPin, Shield, CalendarDays, Layers, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import NYCDataTab from './NYCDataTab';
import PropertyScoutTab from './PropertyScoutTab';
import PropertyCalendar from './PropertyCalendar';
import ZolaTab from './ZolaTab';
import EmailTab from './EmailTab';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
};
const fmtPct = (n) => (!n && n !== 0 ? '—' : n.toFixed(2) + '%');
const fmtNum = (n) => (!n && n !== 0 ? '—' : n.toLocaleString());

export default function DealPanel({ deal, onClose, theme }) {
  const { updateDeal, deleteDeal, toggleChecklistItem, addChecklistItem, addDeadline, toggleDeadline, createAndLinkContact, unlinkContact, uploadDocument, getDocumentUrl, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useStore();
  const [tab, setTab] = useState('overview');
  const [newCheckText, setNewCheckText] = useState('');
  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: 'Broker', company: '', email: '', phone: '' });
  const [editingFinancials, setEditingFinancials] = useState(false);
  const [financialForm, setFinancialForm] = useState({});

  const st = statusOf(deal.status);
  const checklistItems = deal.checklist_items || [];
  const done = checklistItems.filter((c) => c.is_done).length;
  const total = checklistItems.length;

  const daysUntil = (dateStr) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / 86400000);
  };

  const handleDelete = async () => {
    if (confirm('Delete this deal? This cannot be undone.')) {
      try {
        await deleteDeal(deal.id);
        toast.success('Deal deleted');
        onClose();
      } catch (err) {
        toast.error(err.message || 'Failed to delete');
      }
    }
  };

  const handleAddCheckItem = async () => {
    if (!newCheckText.trim()) return;
    try {
      await addChecklistItem(deal.id, newCheckText.trim());
      setNewCheckText('');
      toast.success('Item added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddDeadline = async () => {
    if (!newDeadlineTitle.trim() || !newDeadlineDate) return;
    try {
      await addDeadline(deal.id, { title: newDeadlineTitle.trim(), due_date: newDeadlineDate });
      setNewDeadlineTitle('');
      setNewDeadlineDate('');
      toast.success('Deadline added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim()) { toast.error('Contact name required'); return; }
    try {
      await createAndLinkContact(deal.id, newContact);
      setNewContact({ name: '', role: 'Broker', company: '', email: '', phone: '' });
      setShowAddContact(false);
      toast.success('Contact added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUnlinkContact = async (contactId) => {
    if (confirm('Remove this contact from the deal?')) {
      try {
        await unlinkContact(deal.id, contactId);
        toast.success('Contact removed');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const startEditFinancials = () => {
    setFinancialForm({
      asking_price: deal.asking_price || '',
      purchase_price: deal.purchase_price || '',
      noi: deal.noi || '',
      cap_rate: deal.cap_rate || '',
      units: deal.units || '',
      sqft: deal.sqft || '',
      ltv: deal.ltv || '',
      interest_rate: deal.interest_rate || '',
      amortization: deal.amortization || '',
      irr: deal.irr || '',
      equity_multiple: deal.equity_multiple || '',
    });
    setEditingFinancials(true);
  };

  const saveFinancials = async () => {
    try {
      await updateDeal(deal.id, {
        asking_price: Number(financialForm.asking_price) || 0,
        purchase_price: Number(financialForm.purchase_price) || 0,
        noi: Number(financialForm.noi) || 0,
        cap_rate: Number(financialForm.cap_rate) || 0,
        units: Number(financialForm.units) || 0,
        sqft: Number(financialForm.sqft) || 0,
        ltv: Number(financialForm.ltv) || 0,
        interest_rate: Number(financialForm.interest_rate) || 0,
        amortization: Number(financialForm.amortization) || 0,
        irr: Number(financialForm.irr) || 0,
        equity_multiple: Number(financialForm.equity_multiple) || 0,
      });
      setEditingFinancials(false);
      toast.success('Financials updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadDocument(deal.id, file);
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
  };

  const handleDownload = async (doc) => {
    const url = await getDocumentUrl(doc.file_path);
    if (url) window.open(url, '_blank');
  };

  const inputStyle = {
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: theme.text,
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  const selectStyle = { ...inputStyle, cursor: 'pointer', minWidth: 140 };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: <FileText size={15} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={15} /> },
    { id: 'email', label: 'Email', icon: <Mail size={15} /> },
    { id: 'zola', label: 'ZoLa', icon: <Layers size={15} /> },
    { id: 'nycdata', label: 'NYC Data', icon: <MapPin size={15} /> },
    { id: 'propertyscout', label: 'Title/Owner', icon: <Shield size={15} /> },
    { id: 'financials', label: 'Financials', icon: <DollarSign size={15} /> },
    { id: 'rentroll', label: 'Rent Roll', icon: <Home size={15} /> },
    { id: 'checklist', label: 'Checklist', icon: <ListTodo size={15} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'contacts', label: 'Contacts', icon: <Users size={15} /> },
    { id: 'deadlines', label: 'Deadlines', icon: <Calendar size={15} /> },
    { id: 'violations', label: 'Violations', icon: <AlertTriangle size={15} /> },
  ];

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: 820, maxWidth: '95vw', background: theme.bg, borderLeft: `1px solid ${theme.border}`, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '28px 32px', borderBottom: `1px solid ${theme.border}`, background: theme.bgCard, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{deal.name}</h2>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 6, background: st.bg, color: st.color }}>{st.label}</span>
              </div>
              <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>{deal.address}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleDelete} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={15} /> Delete
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', padding: 8 }}><X size={22} /></button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <select value={deal.stage} onChange={(e) => updateDeal(deal.id, { stage: e.target.value })} style={selectStyle}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={deal.status} onChange={(e) => updateDeal(deal.id, { status: e.target.value })} style={selectStyle}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={deal.deal_type} onChange={(e) => updateDeal(deal.id, { deal_type: e.target.value })} style={selectStyle}>
              {DEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${theme.border}`, background: theme.bgCard, padding: '0 32px', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
              borderBottom: `2px solid ${tab === t.id ? theme.accent : 'transparent'}`,
              color: tab === t.id ? theme.accent : theme.textDim, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
            }}>
              {t.icon} {t.label}
              {t.id === 'checklist' && <span style={{ fontSize: 11, opacity: 0.6 }}>({done}/{total})</span>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          
          {/* Overview Tab */}
          {tab === 'overview' && (
            <>
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>Quick Financials</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[['Asking Price', fmt(deal.asking_price)], ['Purchase Price', fmt(deal.purchase_price)], ['NOI', fmt(deal.noi)], ['Cap Rate', fmtPct(deal.cap_rate)]].map(([label, value]) => (
                    <div key={label} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '16px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: theme.textDim, marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>Notes</h4>
                <textarea value={deal.notes || ''} onChange={(e) => updateDeal(deal.id, { notes: e.target.value })} placeholder="Add notes..." style={{ ...inputStyle, minHeight: 100, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>Checklist Progress</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 220, height: 8, background: theme.bgElevated, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: theme.accent, width: (total > 0 ? (done / total) * 100 : 0) + '%', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: theme.textSecondary }}>{done}/{total} complete</span>
                </div>
              </div>
            </>
          )}

          {/* Calendar Tab */}
          {tab === 'calendar' && (
            <PropertyCalendar
              deal={deal}
              events={deal.calendar_events || []}
              onAddEvent={async (event) => {
                try {
                  await addCalendarEvent(deal.id, event);
                  toast.success('Event added');
                } catch (err) {
                  toast.error(err.message);
                }
              }}
              onUpdateEvent={async (event) => {
                try {
                  await updateCalendarEvent(event.id, event);
                  toast.success('Event updated');
                } catch (err) {
                  toast.error(err.message);
                }
              }}
              onDeleteEvent={async (eventId) => {
                try {
                  await deleteCalendarEvent(eventId);
                  toast.success('Event deleted');
                } catch (err) {
                  toast.error(err.message);
                }
              }}
              theme={theme}
            />
          )}

          {/* Email Tab */}
          {tab === 'email' && (
            <EmailTab deal={deal} theme={theme} />
          )}

          {/* ZoLa Tab */}
          {tab === 'zola' && (
            <ZolaTab deal={deal} theme={theme} />
          )}

          {/* NYC Data Tab */}
          {tab === 'nycdata' && (
            <NYCDataTab deal={deal} theme={theme} />
          )}

          {/* PropertyScout Tab */}
          {tab === 'propertyscout' && (
            <PropertyScoutTab deal={deal} theme={theme} />
          )}

          {/* Financials Tab */}
          {tab === 'financials' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, margin: 0 }}>Financial Details</h4>
                {!editingFinancials ? (
                  <button onClick={startEditFinancials} style={{ padding: '8px 16px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Edit</button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditingFinancials(false)} style={{ padding: '8px 16px', background: 'none', border: `1px solid ${theme.border}`, color: theme.textSecondary, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={saveFinancials} style={{ padding: '8px 16px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Save</button>
                  </div>
                )}
              </div>
              
              {!editingFinancials ? (
                <>
                  {[
                    { title: 'Pricing', fields: [['Asking Price', fmt(deal.asking_price)], ['Purchase Price', fmt(deal.purchase_price)]] },
                    { title: 'Income & Returns', fields: [['NOI', fmt(deal.noi)], ['Cap Rate', fmtPct(deal.cap_rate)], ['IRR', fmtPct(deal.irr)], ['Equity Multiple', deal.equity_multiple ? deal.equity_multiple.toFixed(2) + 'x' : '—']] },
                    { title: 'Property Details', fields: [['Units', fmtNum(deal.units)], ['Square Footage', fmtNum(deal.sqft)]] },
                    { title: 'Loan Terms', fields: [['LTV', deal.ltv ? deal.ltv + '%' : '—'], ['Rate', fmtPct(deal.interest_rate)], ['Amortization', deal.amortization ? deal.amortization + ' yr' : '—']] },
                  ].map((section) => (
                    <div key={section.title} style={{ marginBottom: 28 }}>
                      <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12 }}>{section.title}</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {section.fields.map(([label, value]) => (
                          <div key={label} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: theme.textDim, marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    ['asking_price', 'Asking Price'],
                    ['purchase_price', 'Purchase Price'],
                    ['noi', 'NOI'],
                    ['cap_rate', 'Cap Rate (%)'],
                    ['units', 'Units'],
                    ['sqft', 'Square Footage'],
                    ['ltv', 'LTV (%)'],
                    ['interest_rate', 'Interest Rate (%)'],
                    ['amortization', 'Amortization (years)'],
                    ['irr', 'IRR (%)'],
                    ['equity_multiple', 'Equity Multiple'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: theme.textDim, marginBottom: 6, display: 'block' }}>{label}</label>
                      <input type="number" value={financialForm[key]} onChange={(e) => setFinancialForm({ ...financialForm, [key]: e.target.value })} style={inputStyle} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rent Roll Tab */}
          {tab === 'rentroll' && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>Rent Roll</h4>
              {(!deal.rent_roll || deal.rent_roll.length === 0) ? (
                <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 48, textAlign: 'center', color: theme.textDim }}>
                  <Home size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No rent roll data</p>
                  <p style={{ fontSize: 13 }}>Rent roll data can be added via the database.</p>
                </div>
              ) : (
                <>
                  <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {['Unit', 'Beds', 'Rent', 'Status', 'Lease End'].map((h) => (
                            <th key={h} style={{ textAlign: 'left', padding: '12px 16px', background: theme.bgElevated, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.textDim }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deal.rent_roll.map((unit, i) => (
                          <tr key={i}>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, fontWeight: 600 }}>{unit.unit}</td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>{unit.beds}</td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, fontFamily: "'JetBrains Mono', monospace" }}>{unit.rent ? fmt(unit.rent) : '—'}</td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
                              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: unit.status === 'occupied' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: unit.status === 'occupied' ? '#059669' : '#dc2626' }}>{unit.status}</span>
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, color: theme.textDim }}>{unit.lease_end || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 16, padding: '16px 20px', background: theme.bgElevated, borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.textSecondary, fontWeight: 500 }}>Total Monthly Rent</span>
                    <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theme.accent, fontSize: 16 }}>{fmt(deal.rent_roll.reduce((sum, u) => sum + (u.rent || 0), 0))}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Checklist Tab */}
          {tab === 'checklist' && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>Checklist</h4>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Add checklist item..." value={newCheckText} onChange={(e) => setNewCheckText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCheckItem()} />
                <button onClick={handleAddCheckItem} style={{ padding: '10px 16px', background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', color: theme.text }}><Plus size={18} /></button>
              </div>
              {checklistItems.length === 0 ? (
                <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 48, textAlign: 'center', color: theme.textDim }}>
                  <ListTodo size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>No checklist items yet.</p>
                </div>
              ) : (
                checklistItems.map((item) => (
                  <div key={item.id} onClick={() => toggleChecklistItem(item.id, !item.is_done)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s', marginBottom: 4 }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.bgCard} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${item.is_done ? theme.accent : theme.borderLight}`, background: item.is_done ? theme.accent : 'transparent', transition: 'all 0.15s' }}>
                      {item.is_done && <Check size={14} color="#fff" />}
                    </div>
                    <span style={{ fontSize: 14, color: item.is_done ? theme.textDim : theme.text, textDecoration: item.is_done ? 'line-through' : 'none' }}>{item.text}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Documents Tab */}
          {tab === 'documents' && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>Documents</h4>
              <label style={{ display: 'block', marginBottom: 20, padding: 32, border: `2px dashed ${theme.border}`, borderRadius: 12, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                <Upload size={28} color={theme.textDim} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, color: theme.textSecondary }}>Click to upload or drag files here</div>
              </label>
              {(!deal.documents || deal.documents.length === 0) ? (
                <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 48, textAlign: 'center', color: theme.textDim }}>
                  <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>No documents uploaded yet.</p>
                </div>
              ) : (
                deal.documents.map((doc) => (
                  <div key={doc.id} onClick={() => handleDownload(doc)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 10, cursor: 'pointer' }}>
                    <div style={{ width: 40, height: 40, background: `${theme.accent}12`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent }}><FileText size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{doc.file_name}</div>
                      <div style={{ fontSize: 12, color: theme.textDim }}>{new Date(doc.created_at).toLocaleDateString()} · {(doc.file_size / 1024).toFixed(0)} KB</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Contacts Tab */}
          {tab === 'contacts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, margin: 0 }}>Deal Contacts</h4>
                <button onClick={() => setShowAddContact(!showAddContact)} style={{ padding: '8px 14px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> Add Contact
                </button>
              </div>

              {showAddContact && (
                <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>Name *</label>
                      <input style={inputStyle} value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Contact name" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>Role</label>
                      <select style={selectStyle} value={newContact.role} onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}>
                        {CONTACT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>Company</label>
                      <input style={inputStyle} value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} placeholder="Company" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>Email</label>
                      <input style={inputStyle} type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>Phone</label>
                      <input style={inputStyle} value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="(555) 123-4567" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowAddContact(false)} style={{ padding: '8px 16px', background: 'none', border: `1px solid ${theme.border}`, color: theme.textSecondary, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleAddContact} style={{ padding: '8px 16px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Add Contact</button>
                  </div>
                </div>
              )}

              {(!deal.contacts || deal.contacts.length === 0) ? (
                <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 48, textAlign: 'center', color: theme.textDim }}>
                  <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>No contacts linked to this deal yet.</p>
                </div>
              ) : (
                deal.contacts.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${theme.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: theme.accent, flexShrink: 0 }}>
                      {c.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: theme.textDim }}>{c.role}{c.company ? ` · ${c.company}` : ''}</div>
                    </div>
                    <div style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'right', marginRight: 10 }}>
                      {c.email && <div>{c.email}</div>}
                      {c.phone && <div>{c.phone}</div>}
                    </div>
                    <button onClick={() => handleUnlinkContact(c.id)} title="Remove from deal" style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', padding: 6 }}>
                      <Unlink size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Deadlines Tab */}
          {tab === 'deadlines' && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>Deadlines</h4>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Deadline description..." value={newDeadlineTitle} onChange={(e) => setNewDeadlineTitle(e.target.value)} />
                <input style={{ ...inputStyle, width: 160 }} type="date" value={newDeadlineDate} onChange={(e) => setNewDeadlineDate(e.target.value)} />
                <button onClick={handleAddDeadline} style={{ padding: '10px 16px', background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', color: theme.text }}><Plus size={18} /></button>
              </div>
              {(!deal.deadlines || deal.deadlines.length === 0) ? (
                <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 48, textAlign: 'center', color: theme.textDim }}>
                  <Calendar size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>No deadlines set for this deal.</p>
                </div>
              ) : (
                deal.deadlines.map((dl) => {
                  const days = daysUntil(dl.due_date);
                  const badgeStyle = dl.is_done ? { background: 'rgba(16,185,129,0.12)', color: '#059669' }
                    : days <= 3 ? { background: 'rgba(239,68,68,0.12)', color: '#dc2626' }
                    : days <= 7 ? { background: 'rgba(245,158,11,0.12)', color: '#d97706' }
                    : { background: 'rgba(16,185,129,0.12)', color: '#059669' };
                  return (
                    <div key={dl.id} onClick={() => toggleDeadline(dl.id, !dl.is_done)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 10, cursor: 'pointer' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${dl.is_done ? theme.accent : theme.borderLight}`, background: dl.is_done ? theme.accent : 'transparent' }}>
                        {dl.is_done && <Check size={14} color="#fff" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, textDecoration: dl.is_done ? 'line-through' : 'none', color: dl.is_done ? theme.textDim : theme.text }}>{dl.title}</div>
                        <div style={{ fontSize: 12, color: theme.textDim }}>{dl.due_date}</div>
                      </div>
                      {!dl.is_done && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, fontFamily: "'JetBrains Mono', monospace", ...badgeStyle }}>{days === 0 ? 'TODAY' : days < 0 ? 'OVERDUE' : days + 'd'}</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Violations Tab */}
          {tab === 'violations' && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>Violations (HPD / DOB / ECB)</h4>
              {(!deal.violations || deal.violations.length === 0) ? (
                <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 48, textAlign: 'center', color: theme.textDim }}>
                  <AlertTriangle size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No violations on record</p>
                  <p style={{ fontSize: 13 }}>Violation data can be added via the database.</p>
                </div>
              ) : (
                deal.violations.map((v) => {
                  const sourceColors = { HPD: { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' }, DOB: { bg: 'rgba(245,158,11,0.12)', color: '#d97706' }, ECB: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' } };
                  const sc = sourceColors[v.source] || sourceColors.HPD;
                  return (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 10 }}>
                      <span style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', ...sc }}>{v.source}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{v.description}</div>
                        <div style={{ fontSize: 12, color: theme.textDim }}>Class {v.class} · {v.date}</div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: v.status === 'open' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: v.status === 'open' ? '#dc2626' : '#059669' }}>{v.status}</span>
                    </div>
                  );
                })
              )}
              <div style={{ marginTop: 20, padding: '16px 20px', background: theme.bgElevated, borderRadius: 10, fontSize: 13, color: theme.textSecondary }}>
                💡 <strong>Tip:</strong> Check HPD Online, DOB NOW, and ECB portals for the latest violation status before closing.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
