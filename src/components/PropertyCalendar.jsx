import { useState, useMemo } from 'react';
import { Calendar, Plus, X, Check, Clock, AlertTriangle, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';

const EVENT_TYPES = [
  { id: 'deadline', label: 'Deadline', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  { id: 'inspection', label: 'Inspection', color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  { id: 'closing', label: 'Closing', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  { id: 'meeting', label: 'Meeting', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  { id: 'due_diligence', label: 'Due Diligence', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  { id: 'financing', label: 'Financing', color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
  { id: 'legal', label: 'Legal', color: '#be185d', bg: 'rgba(190,24,93,0.12)' },
  { id: 'other', label: 'Other', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PropertyCalendar({ deal, events = [], onAddEvent, onUpdateEvent, onDeleteEvent, theme }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    type: 'deadline',
    notes: '',
    reminder: true,
  });

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date click
  const handleDateClick = (day) => {
    setSelectedDate(day.date);
    setNewEvent({ ...newEvent, date: day.date.toISOString().split('T')[0] });
  };

  // Handle add event
  const handleAddEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    
    const event = {
      id: Date.now().toString(),
      ...newEvent,
      property_id: deal?.id,
      created_at: new Date().toISOString(),
    };
    
    onAddEvent && onAddEvent(event);
    setShowAddModal(false);
    setNewEvent({ title: '', date: '', time: '', type: 'deadline', notes: '', reminder: true });
  };

  // Handle edit event
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      date: event.date,
      time: event.time || '',
      type: event.type,
      notes: event.notes || '',
      reminder: event.reminder !== false,
    });
    setShowAddModal(true);
  };

  // Handle update event
  const handleUpdateEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    
    const updated = {
      ...editingEvent,
      ...newEvent,
      updated_at: new Date().toISOString(),
    };
    
    onUpdateEvent && onUpdateEvent(updated);
    setShowAddModal(false);
    setEditingEvent(null);
    setNewEvent({ title: '', date: '', time: '', type: 'deadline', notes: '', reminder: true });
  };

  // Handle delete event
  const handleDeleteEvent = (eventId) => {
    if (confirm('Delete this event?')) {
      onDeleteEvent && onDeleteEvent(eventId);
    }
  };

  // Get event type info
  const getEventType = (typeId) => EVENT_TYPES.find(t => t.id === typeId) || EVENT_TYPES[EVENT_TYPES.length - 1];

  // Upcoming events (next 14 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    
    return events
      .filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= today && eventDate <= twoWeeks;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

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

  return (
    <div>
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Calendar Grid */}
        <div style={{ flex: 1 }}>
          {/* Calendar Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={prevMonth} style={{ background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 8, cursor: 'pointer', color: theme.text, display: 'flex' }}>
                <ChevronLeft size={18} />
              </button>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, minWidth: 180, textAlign: 'center' }}>
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button onClick={nextMonth} style={{ background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 8, cursor: 'pointer', color: theme.text, display: 'flex' }}>
                <ChevronRight size={18} />
              </button>
              <button onClick={goToToday} style={{ marginLeft: 8, padding: '6px 12px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 12, color: theme.textSecondary, cursor: 'pointer' }}>
                Today
              </button>
            </div>
            <button
              onClick={() => { setShowAddModal(true); setEditingEvent(null); setNewEvent({ ...newEvent, date: new Date().toISOString().split('T')[0] }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              <Plus size={16} /> Add Event
            </button>
          </div>

          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 8 }}>
            {DAYS.map(day => (
              <div key={day} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: theme.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: theme.border, borderRadius: 12, overflow: 'hidden' }}>
            {calendarDays.map((day, i) => {
              const dayEvents = getEventsForDate(day.date);
              const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
              
              return (
                <div
                  key={i}
                  onClick={() => handleDateClick(day)}
                  style={{
                    background: isSelected ? theme.accentDim : theme.bgCard,
                    padding: 8,
                    minHeight: 80,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    opacity: day.isCurrentMonth ? 1 : 0.4,
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: isToday(day.date) ? 700 : 500,
                    background: isToday(day.date) ? theme.accent : 'transparent',
                    color: isToday(day.date) ? '#fff' : theme.text,
                    marginBottom: 4,
                  }}>
                    {day.date.getDate()}
                  </div>
                  
                  {dayEvents.slice(0, 2).map((event, j) => {
                    const type = getEventType(event.type);
                    return (
                      <div
                        key={event.id || j}
                        onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginBottom: 2,
                          background: type.bg,
                          color: type.color,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div style={{ fontSize: 10, color: theme.textDim, paddingLeft: 4 }}>+{dayEvents.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div style={{ width: 280, background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, height: 'fit-content' }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} /> Upcoming
          </h4>
          
          {upcomingEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: theme.textDim }}>
              <Calendar size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>No upcoming events</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEvents.map(event => {
                const type = getEventType(event.type);
                const eventDate = new Date(event.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((eventDate - today) / 86400000);
                
                return (
                  <div
                    key={event.id}
                    onClick={() => handleEditEvent(event)}
                    style={{
                      padding: '12px 14px',
                      background: theme.bgElevated,
                      borderRadius: 8,
                      borderLeft: `3px solid ${type.color}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{event.title}</span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontFamily: "'JetBrains Mono', monospace",
                        background: daysUntil === 0 ? 'rgba(220,38,38,0.12)' : daysUntil <= 3 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                        color: daysUntil === 0 ? '#dc2626' : daysUntil <= 3 ? '#d97706' : '#059669',
                      }}>
                        {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: theme.textDim }}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: type.bg, color: type.color, fontWeight: 500 }}>{type.label}</span>
                      {event.time && <span>{event.time}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div style={{ marginTop: 20, padding: 20, background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h4>
            <button
              onClick={() => { setShowAddModal(true); setEditingEvent(null); }}
              style={{ fontSize: 12, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} /> Add Event
            </button>
          </div>
          
          {getEventsForDate(selectedDate).length === 0 ? (
            <p style={{ fontSize: 13, color: theme.textDim, textAlign: 'center', padding: 16 }}>No events on this day</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {getEventsForDate(selectedDate).map(event => {
                const type = getEventType(event.type);
                return (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: theme.bgElevated, borderRadius: 8 }}>
                    <div style={{ width: 4, height: 40, borderRadius: 2, background: type.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{event.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: theme.textDim }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: type.bg, color: type.color, fontWeight: 500, fontSize: 10 }}>{type.label}</span>
                        {event.time && <span>{event.time}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleEditEvent(event)} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', padding: 4 }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteEvent(event.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showAddModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{editingEvent ? 'Edit Event' : 'Add Event'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingEvent(null); }} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.textDim, marginBottom: 6, display: 'block' }}>Title *</label>
                <input
                  style={inputStyle}
                  placeholder="Event title..."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: theme.textDim, marginBottom: 6, display: 'block' }}>Date *</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: theme.textDim, marginBottom: 6, display: 'block' }}>Time</label>
                  <input
                    type="time"
                    style={inputStyle}
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.textDim, marginBottom: 6, display: 'block' }}>Event Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EVENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setNewEvent({ ...newEvent, type: type.id })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: newEvent.type === type.id ? `2px solid ${type.color}` : `1px solid ${theme.border}`,
                        background: newEvent.type === type.id ? type.bg : 'transparent',
                        color: newEvent.type === type.id ? type.color : theme.textSecondary,
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.textDim, marginBottom: 6, display: 'block' }}>Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  placeholder="Additional notes..."
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div
                  onClick={() => setNewEvent({ ...newEvent, reminder: !newEvent.reminder })}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: `2px solid ${newEvent.reminder ? theme.accent : theme.border}`,
                    background: newEvent.reminder ? theme.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {newEvent.reminder && <Check size={14} color="#fff" />}
                </div>
                <span style={{ fontSize: 13, color: theme.text }}>Send reminder notification</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => { setShowAddModal(false); setEditingEvent(null); }}
                style={{ flex: 1, padding: '12px 16px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 14, color: theme.textSecondary, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
                style={{ flex: 1, padding: '12px 16px', background: theme.accent, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                {editingEvent ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
