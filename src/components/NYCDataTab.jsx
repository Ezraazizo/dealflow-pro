import { useState, useEffect } from 'react';
import { getAllPropertyData, getZoningUseGroups } from '../lib/nycData';
import { Search, MapPin, Building, FileText, AlertTriangle, Shield, Hammer, Loader, ExternalLink, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
};

const fmtNum = (n) => (!n && n !== 0 ? '—' : n.toLocaleString());
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

export default function NYCDataTab({ deal, theme }) {
  const [loading, setLoading] = useState(false);
  const [propertiesData, setPropertiesData] = useState([]); // Array of property data
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('zoning');
  const [activePropertyIndex, setActivePropertyIndex] = useState(0);

  // Get addresses from deal (single or multiple)
  const addresses = deal.addresses || (deal.address ? [{ label: deal.address, bbl: deal.bbl }] : []);

  const fetchData = async () => {
    if (addresses.length === 0) {
      setError('No address set for this deal');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data for all addresses in parallel
      const results = await Promise.all(
        addresses.map(addr => getAllPropertyData(addr.label || addr.address || deal.address))
      );
      
      const validResults = results.filter(r => !r.error);
      if (validResults.length === 0) {
        setError('Could not find NYC data for any address');
      } else {
        setPropertiesData(validResults);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch NYC data');
    } finally {
      setLoading(false);
    }
  };

  // Current property data
  const data = propertiesData[activePropertyIndex] || null;

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

  const cardStyle = {
    background: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    padding: '16px 18px',
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

  const valueStyle = {
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
  };

  const subTabs = [
    { id: 'zoning', label: 'Zoning', icon: <MapPin size={14} /> },
    { id: 'property', label: 'Property', icon: <Building size={14} /> },
    { id: 'acris', label: 'ACRIS', icon: <FileText size={14} /> },
    { id: 'violations', label: 'Violations', icon: <AlertTriangle size={14} /> },
    { id: 'permits', label: 'Permits', icon: <Hammer size={14} /> },
  ];

  if (!data && !loading && !error && propertiesData.length === 0) {
    return (
      <div>
        <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>NYC Property Data</h4>
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <MapPin size={40} style={{ marginBottom: 12, opacity: 0.3, color: theme.textDim }} />
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: theme.text }}>Pull NYC Public Records</p>
          <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 20 }}>
            Fetch zoning, ACRIS (deeds/mortgages), violations, and permits for {addresses.length > 1 ? `${addresses.length} properties` : 'this address'}.
          </p>
          {addresses.length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              {addresses.map((addr, i) => (
                <p key={i} style={{ fontSize: 12, color: theme.textSecondary, margin: '4px 0', fontFamily: "'JetBrains Mono', monospace" }}>
                  {addr.label || addr.address || deal.address}
                </p>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 20 }}>No address set</p>
          )}
          <button
            onClick={fetchData}
            disabled={addresses.length === 0}
            style={{
              padding: '12px 24px',
              background: addresses.length > 0 ? theme.accent : theme.bgElevated,
              color: addresses.length > 0 ? '#fff' : theme.textDim,
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: addresses.length > 0 ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Search size={16} /> Fetch NYC Data {addresses.length > 1 ? `(${addresses.length} properties)` : ''}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 60, textAlign: 'center' }}>
        <Loader size={32} style={{ marginBottom: 16, animation: 'spin 1s linear infinite', color: theme.accent }} />
        <p style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>Fetching NYC Data...</p>
        <p style={{ fontSize: 13, color: theme.textDim }}>Querying zoning, ACRIS, HPD, DOB, and ECB databases</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
        <AlertTriangle size={32} style={{ marginBottom: 12, color: '#dc2626' }} />
        <p style={{ fontSize: 15, fontWeight: 500, color: '#dc2626', marginBottom: 8 }}>Error</p>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>{error}</p>
        <button onClick={fetchData} style={{ padding: '10px 20px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, margin: 0 }}>NYC Property Data</h4>
          {propertiesData.length > 1 && (
            <p style={{ fontSize: 12, color: theme.accent, margin: '4px 0 0' }}>
              {propertiesData.length} properties loaded
            </p>
          )}
        </div>
        <button onClick={fetchData} style={{ padding: '8px 14px', background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Property selector (for multi-property deals) */}
      {propertiesData.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {propertiesData.map((prop, i) => (
            <button
              key={prop.bbl}
              onClick={() => setActivePropertyIndex(i)}
              style={{
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                border: `1px solid ${activePropertyIndex === i ? theme.accent : theme.border}`,
                background: activePropertyIndex === i ? theme.accentDim : theme.bgCard,
                color: activePropertyIndex === i ? theme.accent : theme.textSecondary,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Building size={12} />
              {prop.address?.split(',')[0] || `Property ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Current property BBL */}
      {data && (
        <p style={{ fontSize: 12, color: theme.textSecondary, margin: '0 0 16px', fontFamily: "'JetBrains Mono', monospace" }}>
          BBL: {data.bbl} • {data.borough}
        </p>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              border: `1px solid ${activeSubTab === t.id ? theme.accent : theme.border}`,
              background: activeSubTab === t.id ? theme.accentDim : theme.bgCard,
              color: activeSubTab === t.id ? theme.accent : theme.textSecondary,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {t.icon} {t.label}
            {t.id === 'violations' && data.violations?.totalOpen > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: '#ef4444', color: 'white' }}>
                {data.violations.totalOpen}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Zoning Tab */}
      {activeSubTab === 'zoning' && data.pluto && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={cardStyle}>
              <div style={labelStyle}>Primary Zoning</div>
              <div style={{ ...valueStyle, color: theme.accent, fontSize: 20 }}>{data.pluto.zoneDist1 || '—'}</div>
              {data.pluto.zoneDist2 && <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>Also: {data.pluto.zoneDist2}</div>}
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Commercial Overlay</div>
              <div style={valueStyle}>{data.pluto.overlay1 || 'None'}</div>
              {data.pluto.overlay2 && <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>Also: {data.pluto.overlay2}</div>}
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={labelStyle}>Permitted Uses</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {getZoningUseGroups(data.pluto.zoneDist1).map((use, i) => (
                <span key={i} style={{ padding: '6px 12px', background: theme.bgElevated, borderRadius: 6, fontSize: 12, color: theme.text }}>{use}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={cardStyle}>
              <div style={labelStyle}>Max Residential FAR</div>
              <div style={valueStyle}>{data.pluto.residentialFAR || '—'}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Max Commercial FAR</div>
              <div style={valueStyle}>{data.pluto.commercialFAR || '—'}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Built FAR</div>
              <div style={valueStyle}>{data.pluto.builtFAR || '—'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={cardStyle}>
              <div style={labelStyle}>Lot Area</div>
              <div style={valueStyle}>{fmtNum(data.pluto.lotArea)} SF</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Buildable Area (at max FAR)</div>
              <div style={valueStyle}>{fmtNum(Math.round(data.pluto.lotArea * data.pluto.maxAllowableFAR))} SF</div>
            </div>
          </div>

          <a
            href={`https://zola.planning.nyc.gov/l/lot/${data.borough?.charAt(0)}/${data.block}/${data.lot}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: theme.accent, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> View in ZoLa
          </a>
        </div>
      )}

      {/* Property Tab */}
      {activeSubTab === 'property' && data.pluto && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={cardStyle}>
              <div style={labelStyle}>Year Built</div>
              <div style={valueStyle}>{data.pluto.yearBuilt || '—'}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Building Class</div>
              <div style={valueStyle}>{data.pluto.buildingClass || '—'}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Total Units</div>
              <div style={valueStyle}>{fmtNum(data.pluto.unitsTotal)}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Residential Units</div>
              <div style={valueStyle}>{fmtNum(data.pluto.unitsRes)}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Number of Floors</div>
              <div style={valueStyle}>{data.pluto.numFloors || '—'}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Building Area</div>
              <div style={valueStyle}>{fmtNum(data.pluto.buildingArea)} SF</div>
            </div>
          </div>

          <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12, marginTop: 24 }}>Assessment</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={cardStyle}>
              <div style={labelStyle}>Assessed Total</div>
              <div style={valueStyle}>{fmt(data.pluto.assessedTotal)}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Assessed Land</div>
              <div style={valueStyle}>{fmt(data.pluto.assessedLand)}</div>
            </div>
          </div>

          {data.pluto.ownerName && (
            <div style={{ ...cardStyle, marginTop: 20 }}>
              <div style={labelStyle}>Owner (per DOF)</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>{data.pluto.ownerName}</div>
            </div>
          )}
        </div>
      )}

      {/* ACRIS Tab */}
      {activeSubTab === 'acris' && (
        <div>
          <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12 }}>Recent Deeds ({data.acris?.deeds?.length || 0})</h5>
          {data.acris?.deeds?.length > 0 ? (
            data.acris.deeds.slice(0, 5).map((doc, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.documentType}</div>
                    <div style={{ fontSize: 12, color: theme.textDim }}>{fmtDate(doc.recordedDate)}</div>
                  </div>
                  {doc.amount > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theme.accent }}>{fmt(doc.amount)}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim }}>No deeds found</div>
          )}

          <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12, marginTop: 24 }}>Mortgages ({data.acris?.mortgages?.length || 0})</h5>
          {data.acris?.mortgages?.length > 0 ? (
            data.acris.mortgages.slice(0, 5).map((doc, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.documentType}</div>
                    <div style={{ fontSize: 12, color: theme.textDim }}>{fmtDate(doc.recordedDate)}</div>
                  </div>
                  {doc.amount > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theme.text }}>{fmt(doc.amount)}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim }}>No mortgages found</div>
          )}

          <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12, marginTop: 24 }}>Liens ({data.acris?.liens?.length || 0})</h5>
          {data.acris?.liens?.length > 0 ? (
            data.acris.liens.slice(0, 5).map((doc, i) => (
              <div key={i} style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{doc.documentType}</div>
                    <div style={{ fontSize: 12, color: theme.textDim }}>{fmtDate(doc.recordedDate)}</div>
                  </div>
                  {doc.amount > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#dc2626' }}>{fmt(doc.amount)}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim, background: 'rgba(16,185,129,0.06)' }}>✓ No liens found</div>
          )}

          <a
            href={`https://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${data.bbl?.substring(0,1)}&block=${data.block}&lot=${data.lot}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: theme.accent, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> View full ACRIS records
          </a>
        </div>
      )}

      {/* Violations Tab */}
      {activeSubTab === 'violations' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: data.violations?.hpd?.filter(v => v.currentStatus !== 'CLOSE').length > 0 ? '#dc2626' : '#059669' }}>
                {data.violations?.hpd?.filter(v => v.currentStatus !== 'CLOSE').length || 0}
              </div>
              <div style={{ fontSize: 11, color: theme.textDim }}>HPD Open</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: data.violations?.dob?.filter(v => !v.dispositionDate).length > 0 ? '#dc2626' : '#059669' }}>
                {data.violations?.dob?.filter(v => !v.dispositionDate).length || 0}
              </div>
              <div style={{ fontSize: 11, color: theme.textDim }}>DOB Open</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: data.violations?.ecb?.filter(v => v.status !== 'RESOLVE').length > 0 ? '#dc2626' : '#059669' }}>
                {data.violations?.ecb?.filter(v => v.status !== 'RESOLVE').length || 0}
              </div>
              <div style={{ fontSize: 11, color: theme.textDim }}>ECB Open</div>
            </div>
          </div>

          <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12 }}>HPD Violations</h5>
          {data.violations?.hpd?.length > 0 ? (
            data.violations.hpd.slice(0, 10).map((v, i) => (
              <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${v.class === 'C' ? '#dc2626' : v.class === 'B' ? '#d97706' : '#2563eb'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: v.class === 'C' ? 'rgba(239,68,68,0.12)' : v.class === 'B' ? 'rgba(245,158,11,0.12)' : 'rgba(37,99,235,0.12)',
                    color: v.class === 'C' ? '#dc2626' : v.class === 'B' ? '#d97706' : '#2563eb',
                  }}>
                    CLASS {v.class}
                  </span>
                  <span style={{ fontSize: 11, color: v.currentStatus === 'CLOSE' ? '#059669' : '#dc2626', fontWeight: 600 }}>{v.currentStatus}</span>
                </div>
                <div style={{ fontSize: 13, color: theme.text, marginBottom: 4 }}>{v.novDescription?.substring(0, 100)}...</div>
                <div style={{ fontSize: 11, color: theme.textDim }}>{fmtDate(v.inspectionDate)} • {v.apartment ? `Apt ${v.apartment}` : 'Building-wide'}</div>
              </div>
            ))
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim, background: 'rgba(16,185,129,0.06)' }}>✓ No HPD violations</div>
          )}

          <a
            href={`https://hpdonline.nyc.gov/hpdonline/building/${data.bbl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: theme.accent, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> View HPD Online
          </a>
        </div>
      )}

      {/* Permits Tab */}
      {activeSubTab === 'permits' && (
        <div>
          <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12 }}>DOB Permits ({data.permits?.length || 0})</h5>
          {data.permits?.length > 0 ? (
            data.permits.slice(0, 10).map((p, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{p.jobType}</span>
                    <span style={{ fontSize: 11, color: theme.textDim, marginLeft: 8 }}>#{p.jobNumber}</span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                    background: p.permitStatus === 'ISSUED' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    color: p.permitStatus === 'ISSUED' ? '#059669' : '#d97706',
                  }}>{p.permitStatus}</span>
                </div>
                <div style={{ fontSize: 13, color: theme.text, marginBottom: 4 }}>{p.jobDescription?.substring(0, 80)}...</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textDim }}>
                  <span>Issued: {fmtDate(p.issuanceDate)}</span>
                  {p.estimatedCost > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Est: {fmt(p.estimatedCost)}</span>}
                </div>
              </div>
            ))
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim }}>No permits found</div>
          )}

          <a
            href={`https://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${data.bbl?.substring(0,1)}&block=${data.block}&lot=${data.lot}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: theme.accent, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> View DOB BIS
          </a>
        </div>
      )}
    </div>
  );
}
