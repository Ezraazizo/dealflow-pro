import { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader } from 'lucide-react';

const GEOSEARCH_BASE = 'https://geosearch.planninglabs.nyc/v2/autocomplete';

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, theme, multiple = false }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddresses, setSelectedAddresses] = useState(multiple && Array.isArray(value) ? value : []);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${GEOSEARCH_BASE}?text=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.features) {
          const results = data.features.map(f => ({
            label: f.properties.label,
            address: f.properties.name,
            borough: f.properties.borough,
            bbl: f.properties.addendum?.pad?.bbl || f.properties.pad_bbl,
            block: f.properties.addendum?.pad?.block || f.properties.pad_block,
            lot: f.properties.addendum?.pad?.lot || f.properties.pad_lot,
            bin: f.properties.addendum?.pad?.bin,
            coordinates: f.geometry.coordinates,
          }));
          setSuggestions(results);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('GeoSearch error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (suggestion) => {
    if (multiple) {
      // Check if already added
      if (!selectedAddresses.find(a => a.bbl === suggestion.bbl)) {
        const newAddresses = [...selectedAddresses, suggestion];
        setSelectedAddresses(newAddresses);
        onSelect && onSelect(newAddresses);
        onChange && onChange(newAddresses);
      }
      setQuery('');
    } else {
      setQuery(suggestion.label);
      onChange && onChange(suggestion.label);
      onSelect && onSelect(suggestion);
    }
    setShowDropdown(false);
  };

  const handleRemoveAddress = (bbl) => {
    const newAddresses = selectedAddresses.filter(a => a.bbl !== bbl);
    setSelectedAddresses(newAddresses);
    onSelect && onSelect(newAddresses);
    onChange && onChange(newAddresses);
  };

  const inputStyle = {
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    paddingLeft: 38,
    color: theme.text,
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Selected addresses (for multiple mode) */}
      {multiple && selectedAddresses.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {selectedAddresses.map((addr) => (
            <div
              key={addr.bbl}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: theme.accentDim,
                border: `1px solid ${theme.accent}30`,
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              <MapPin size={12} color={theme.accent} />
              <span style={{ color: theme.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {addr.label}
              </span>
              <span style={{ color: theme.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                {addr.bbl}
              </span>
              <button
                onClick={() => handleRemoveAddress(addr.bbl)}
                style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: theme.textDim, display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textDim }} />
        <input
          type="text"
          value={multiple ? query : (query || value || '')}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!multiple) {
              onChange && onChange(e.target.value);
            }
          }}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder || (multiple ? 'Add another address...' : 'Start typing an NYC address...')}
          style={inputStyle}
        />
        {loading && (
          <Loader size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textDim, animation: 'spin 1s linear infinite' }} />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s.bbl || i}
              onClick={() => handleSelect(s)}
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? `1px solid ${theme.border}` : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.bgElevated}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={14} color={theme.accent} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textDim, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    BBL: {s.bbl} • {s.borough}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
