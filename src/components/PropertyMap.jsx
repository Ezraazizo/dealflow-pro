import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building, User, FileText, DollarSign, X, Loader, ChevronRight, Home, AlertTriangle, ExternalLink } from 'lucide-react';

// PropertyScout API Service
const PROPERTYSCOUT_API_BASE = 'https://api.propertyscout.io/v1';

// You'll need to add your PropertyScout API key
const getApiKey = () => {
  return localStorage.getItem('propertyscout_api_key') || '';
};

const propertyScoutFetch = async (endpoint, params = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('PropertyScout API key not configured');
  
  const queryString = new URLSearchParams(params).toString();
  const url = `${PROPERTYSCOUT_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  
  return response.json();
};

// Search property by address
export const searchPropertyByAddress = async (address) => {
  return propertyScoutFetch('/property/search', { address });
};

// Get property details
export const getPropertyDetails = async (propertyId) => {
  return propertyScoutFetch(`/property/${propertyId}`);
};

// Get owner information
export const getOwnerInfo = async (propertyId) => {
  return propertyScoutFetch(`/property/${propertyId}/owner`);
};

// Get title report
export const getTitleReport = async (propertyId) => {
  return propertyScoutFetch(`/property/${propertyId}/title`);
};

export default function PropertyMap({ theme, onSelectProperty }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyLoading, setPropertyLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(getApiKey());
  const [showApiKeyModal, setShowApiKeyModal] = useState(!getApiKey());
  const [recentSearches, setRecentSearches] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      // Check if script already exists
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogle);
            initMap();
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        zoom: 4,
        styles: theme.name === 'dark' ? darkMapStyle : lightMapStyle,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Click handler for map
      map.addListener('click', async (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setSearchQuery(results[0].formatted_address);
            handleSearch(results[0].formatted_address, { lat, lng });
          }
        });
      });
    };

    loadGoogleMaps();

    return () => {
      // Cleanup
    };
  }, [theme]);

  // Update map style when theme changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: theme.name === 'dark' ? darkMapStyle : lightMapStyle,
      });
    }
  }, [theme]);

  const handleSearch = async (address = searchQuery, coords = null) => {
    if (!address.trim()) return;
    
    setSearching(true);
    setError(null);
    setSelectedProperty(null);

    try {
      // If we have Google Maps, geocode the address
      if (window.google && mapInstanceRef.current) {
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address }, async (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            
            // Pan map to location
            mapInstanceRef.current.setCenter(location);
            mapInstanceRef.current.setZoom(18);

            // Add/update marker
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            
            markerRef.current = new window.google.maps.Marker({
              position: location,
              map: mapInstanceRef.current,
              animation: window.google.maps.Animation.DROP,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: theme.accent,
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
              },
            });

            // Now fetch PropertyScout data
            await fetchPropertyData(results[0].formatted_address);
          } else {
            setError('Address not found');
          }
          setSearching(false);
        });
      } else {
        // Fallback: just fetch PropertyScout data
        await fetchPropertyData(address);
        setSearching(false);
      }

      // Add to recent searches
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s !== address);
        return [address, ...filtered].slice(0, 5);
      });

    } catch (err) {
      setError(err.message);
      setSearching(false);
    }
  };

  const fetchPropertyData = async (address) => {
    if (!apiKey) {
      // Demo mode - show sample data
      setSelectedProperty({
        address: address,
        demo: true,
        owner: { name: 'Demo Owner', mailingAddress: '123 Main St' },
        property: {
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1850,
          yearBuilt: 1985,
          lotSize: 0.25,
          propertyType: 'Single Family',
        },
        valuation: {
          estimatedValue: 450000,
          assessedValue: 380000,
        },
        tax: {
          annualAmount: 8500,
          year: 2024,
        },
        sales: [
          { date: '2019-06-15', price: 375000, type: 'Sale' },
          { date: '2010-03-22', price: 285000, type: 'Sale' },
        ],
      });
      return;
    }

    setPropertyLoading(true);
    try {
      const data = await searchPropertyByAddress(address);
      setSelectedProperty(data);
    } catch (err) {
      // If API fails, show demo data
      setSelectedProperty({
        address: address,
        demo: true,
        error: err.message,
        owner: { name: 'Unable to fetch', mailingAddress: 'Configure API key' },
      });
    } finally {
      setPropertyLoading(false);
    }
  };

  const saveApiKey = (key) => {
    localStorage.setItem('propertyscout_api_key', key);
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  const fmt = (n) => {
    if (!n && n !== 0) return '—';
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n.toLocaleString();
  };

  const cardStyle = {
    background: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.textDim,
    marginBottom: 4,
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: theme.bg }}>
      {/* Sidebar */}
      <div style={{ width: 380, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', background: theme.bgCard }}>
        {/* Search Header */}
        <div style={{ padding: 20, borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${theme.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent }}>
              <MapPin size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Property Search</h3>
              <p style={{ fontSize: 11, color: theme.textDim, margin: 0 }}>Powered by PropertyScout.io</p>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textDim }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search any US address..."
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                background: theme.bgElevated,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                fontSize: 14,
                color: theme.text,
                outline: 'none',
              }}
            />
            {searching && (
              <Loader size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: theme.accent, animation: 'spin 1s linear infinite' }} />
            )}
          </div>

          {/* API Key Status */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: apiKey ? '#10b981' : '#f59e0b' }} />
              <span style={{ fontSize: 11, color: theme.textDim }}>{apiKey ? 'API Connected' : 'Demo Mode'}</span>
            </div>
            <button
              onClick={() => setShowApiKeyModal(true)}
              style={{ fontSize: 11, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {apiKey ? 'Change Key' : 'Add API Key'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {error && (
            <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: 13 }}>{error}</span>
              </div>
            </div>
          )}

          {selectedProperty ? (
            <div>
              {/* Address Header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 4 }}>
                      {selectedProperty.address?.split(',')[0] || 'Property'}
                    </h4>
                    <p style={{ fontSize: 12, color: theme.textDim, margin: 0 }}>
                      {selectedProperty.address?.split(',').slice(1).join(',') || ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProperty(null)}
                    style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>
                {selectedProperty.demo && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: 6, display: 'inline-block' }}>
                    <span style={{ fontSize: 11, color: '#d97706' }}>Demo Data — Add API key for real results</span>
                  </div>
                )}
              </div>

              {/* Owner Info */}
              {selectedProperty.owner && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <User size={16} color={theme.accent} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Owner Information</span>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div>
                      <div style={labelStyle}>Owner Name</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedProperty.owner.name || '—'}</div>
                    </div>
                    {selectedProperty.owner.mailingAddress && (
                      <div>
                        <div style={labelStyle}>Mailing Address</div>
                        <div style={{ fontSize: 13, color: theme.textSecondary }}>{selectedProperty.owner.mailingAddress}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Details */}
              {selectedProperty.property && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Home size={16} color={theme.accent} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Property Details</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={labelStyle}>Type</div>
                      <div style={{ fontSize: 14 }}>{selectedProperty.property.propertyType || '—'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Year Built</div>
                      <div style={{ fontSize: 14 }}>{selectedProperty.property.yearBuilt || '—'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Bedrooms</div>
                      <div style={{ fontSize: 14 }}>{selectedProperty.property.bedrooms || '—'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Bathrooms</div>
                      <div style={{ fontSize: 14 }}>{selectedProperty.property.bathrooms || '—'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Sq Ft</div>
                      <div style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>{selectedProperty.property.sqft?.toLocaleString() || '—'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Lot Size</div>
                      <div style={{ fontSize: 14 }}>{selectedProperty.property.lotSize ? selectedProperty.property.lotSize + ' acres' : '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Valuation */}
              {selectedProperty.valuation && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <DollarSign size={16} color={theme.accent} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Valuation</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={labelStyle}>Estimated Value</div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theme.accent }}>
                        {fmt(selectedProperty.valuation.estimatedValue)}
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Assessed Value</div>
                      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(selectedProperty.valuation.assessedValue)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Info */}
              {selectedProperty.tax && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={labelStyle}>Annual Property Tax ({selectedProperty.tax.year})</div>
                      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(selectedProperty.tax.annualAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales History */}
              {selectedProperty.sales && selectedProperty.sales.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <FileText size={16} color={theme.accent} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Sales History</span>
                  </div>
                  {selectedProperty.sales.map((sale, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < selectedProperty.sales.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{sale.type}</div>
                        <div style={{ fontSize: 11, color: theme.textDim }}>{new Date(sale.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(sale.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => onSelectProperty && onSelectProperty(selectedProperty)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: theme.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Building size={16} /> Add to Deal
                </button>
                <a
                  href={`https://app.propertyscout.io/search?address=${encodeURIComponent(selectedProperty.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 16px',
                    background: theme.bgElevated,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} /> Full Report
                </a>
              </div>
            </div>
          ) : (
            /* Recent Searches / Empty State */
            <div>
              {recentSearches.length > 0 && (
                <div>
                  <h5 style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: theme.textDim, marginBottom: 12 }}>Recent Searches</h5>
                  {recentSearches.map((search, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSearchQuery(search);
                        handleSearch(search);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        background: theme.bgElevated,
                        borderRadius: 10,
                        marginBottom: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <MapPin size={14} color={theme.textDim} />
                      <span style={{ fontSize: 13, color: theme.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{search}</span>
                      <ChevronRight size={14} color={theme.textDim} />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textDim }}>
                <MapPin size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: theme.text }}>Search Any US Property</p>
                <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Enter an address or click anywhere on the map to get owner info, valuations, tax data, and sales history.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        
        {!mapLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
            <div style={{ textAlign: 'center' }}>
              <Loader size={32} style={{ marginBottom: 16, color: theme.accent, animation: 'spin 1s linear infinite' }} />
              <p style={{ color: theme.textDim }}>Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowApiKeyModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 28,
            width: 440,
            maxWidth: '90vw',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>PropertyScout API Key</h3>
            <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 20 }}>
              Get your free API key at{' '}
              <a href="https://app.propertyscout.io/register/trial-api-user" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>
                propertyscout.io
              </a>
              {' '}— 7-day trial with 100 free searches.
            </p>
            
            <input
              type="text"
              placeholder="Enter your API key..."
              defaultValue={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: theme.bgElevated,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                fontSize: 14,
                color: theme.text,
                outline: 'none',
                marginBottom: 16,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowApiKeyModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'none',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  fontSize: 14,
                  color: theme.textSecondary,
                  cursor: 'pointer',
                }}
              >
                Skip (Demo Mode)
              </button>
              <button
                onClick={() => saveApiKey(apiKey)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: theme.accent,
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Light map style
const lightMapStyle = [
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
  { featureType: 'landscape', elementType: 'all', stylers: [{ color: '#f2f2f2' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'all', stylers: [{ saturation: -100 }, { lightness: 45 }] },
  { featureType: 'road.highway', elementType: 'all', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'all', stylers: [{ color: '#c4e4ff' }, { visibility: 'on' }] },
];

// Dark map style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'land', elementType: 'geometry', stylers: [{ color: '#2c3e50' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];
