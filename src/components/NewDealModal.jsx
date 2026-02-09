import { useState } from 'react';
import { useStore } from '../lib/store';
import { STAGES, STATUSES, DEAL_TYPES } from '../lib/constants';
import { X, Building, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import AddressAutocomplete from './AddressAutocomplete';

export default function NewDealModal({ onClose, theme }) {
  const { createDeal } = useStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    deal_type: 'Acquisition',
    stage: 'Sourcing',
    status: 'prospective',
    notes: '',
    asking_price: '',
    units: '',
    sqft: '',
  });
  const [addresses, setAddresses] = useState([]); // Array of address objects with BBL

  const inputStyle = {
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    padding: '12px 14px',
    color: theme.text,
    fontSize: 14,
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: theme.textDim,
    marginBottom: 8,
    display: 'block',
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { 
      toast.error('Deal name is required'); 
      return; 
    }
    if (addresses.length === 0) {
      toast.error('Add at least one address');
      return;
    }

    setLoading(true);
    try {
      // Create deal with primary address (first one) and store all addresses
      const primaryAddress = addresses[0];
      
      await createDeal({
        name: form.name.trim(),
        address: primaryAddress.label, // Primary address for display
        addresses: addresses, // All addresses with BBL data (stored as JSONB)
        deal_type: form.deal_type,
        stage: form.stage,
        status: form.status,
        notes: form.notes,
        asking_price: Number(form.asking_price) || 0,
        units: Number(form.units) || 0,
        sqft: Number(form.sqft) || 0,
        // Store BBL data
        bbl: primaryAddress.bbl,
        borough: primaryAddress.borough,
        block: primaryAddress.block,
        lot: primaryAddress.lot,
      });
      toast.success('Deal created!');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate deal name from addresses
  const autoGenerateName = () => {
    if (addresses.length === 0) return;
    
    if (addresses.length === 1) {
      setForm({ ...form, name: addresses[0].address || addresses[0].label.split(',')[0] });
    } else {
      // Multiple addresses - create assemblage name
      const firstAddr = addresses[0].address || addresses[0].label.split(',')[0];
      setForm({ ...form, name: `${firstAddr} Portfolio (${addresses.length} properties)` });
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16,
        width: 600, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${theme.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent }}>
              <Building size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>New Deal</h3>
              <p style={{ fontSize: 12, color: theme.textDim, margin: 0 }}>Add one or multiple properties</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Addresses */}
          <div>
            <label style={labelStyle}>
              <MapPin size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              Property Addresses *
            </label>
            <AddressAutocomplete
              theme={theme}
              multiple={true}
              value={addresses}
              onChange={setAddresses}
              onSelect={(addrs) => {
                setAddresses(addrs);
                // Auto-suggest name if empty
                if (!form.name && addrs.length > 0) {
                  if (addrs.length === 1) {
                    setForm({ ...form, name: addrs[0].address || addrs[0].label.split(',')[0] });
                  } else {
                    const firstAddr = addrs[0].address || addrs[0].label.split(',')[0];
                    setForm({ ...form, name: `${firstAddr} + ${addrs.length - 1} more` });
                  }
                }
              }}
              placeholder="Type an NYC address..."
            />
            {addresses.length > 1 && (
              <p style={{ fontSize: 12, color: theme.accent, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building size={14} /> Assemblage: {addresses.length} properties
              </p>
            )}
          </div>

          {/* Deal Name */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={labelStyle}>Deal Name *</label>
              {addresses.length > 0 && (
                <button
                  onClick={autoGenerateName}
                  style={{ fontSize: 11, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8 }}
                >
                  Auto-generate from address
                </button>
              )}
            </div>
            <input 
              style={inputStyle} 
              placeholder="e.g. 123 Main Street or West 119th Portfolio" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Deal Type</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.deal_type} onChange={(e) => setForm({ ...form, deal_type: e.target.value })}>
                {DEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Stage</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Asking Price</label>
              <input style={inputStyle} type="number" placeholder="0" value={form.asking_price} onChange={(e) => setForm({ ...form, asking_price: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Total Units</label>
              <input style={inputStyle} type="number" placeholder="0" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Total Sq Ft</label>
              <input style={inputStyle} type="number" placeholder="0" value={form.sqft} onChange={(e) => setForm({ ...form, sqft: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Initial notes about this deal..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div style={{ padding: '20px 28px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: theme.textDim }}>
            {addresses.length > 0 && `${addresses.length} ${addresses.length === 1 ? 'property' : 'properties'} selected`}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', background: 'none', border: `1px solid ${theme.border}`,
                borderRadius: 10, color: theme.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || addresses.length === 0}
              style={{
                padding: '10px 24px', background: addresses.length > 0 ? theme.accent : theme.bgElevated, border: 'none',
                borderRadius: 10, color: addresses.length > 0 ? '#fff' : theme.textDim, fontSize: 14, fontWeight: 600, 
                cursor: addresses.length > 0 ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
