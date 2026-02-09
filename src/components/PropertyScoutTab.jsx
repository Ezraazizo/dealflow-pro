import { useState } from 'react';
import { 
  getAllPropertyScoutData, 
  downloadTitleReport, 
  hasPropertyScoutApiKey, 
  setPropertyScoutApiKey 
} from '../lib/propertyScout';
import { 
  Search, User, FileText, AlertTriangle, DollarSign, Building, 
  Loader, ExternalLink, RefreshCw, Download, Key, CheckCircle, 
  XCircle, Home, Calendar, TrendingUp, Shield
} from 'lucide-react';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

export default function PropertyScoutTab({ deal, theme }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('owner');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!hasPropertyScoutApiKey());
  const [downloadingReport, setDownloadingReport] = useState(false);

  const addresses = deal.addresses || (deal.address ? [{ label: deal.address }] : []);
  const primaryAddress = addresses[0]?.label || deal.address;

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      setPropertyScoutApiKey(apiKeyInput.trim());
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  const fetchData = async () => {
    if (!primaryAddress) {
      setError('No address set for this deal');
      return;
    }

    if (!hasPropertyScoutApiKey()) {
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getAllPropertyScoutData(primaryAddress);
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch PropertyScout data');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      if (err.message?.includes('API key')) {
        setShowApiKeyInput(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTitleReport = async () => {
    if (!primaryAddress) return;
    
    setDownloadingReport(true);
    try {
      const filename = `title-report-${deal.name?.replace(/[^a-z0-9]/gi, '-') || 'property'}.pdf`;
      await downloadTitleReport(primaryAddress, filename);
    } catch (err) {
      setError('Failed to download title report: ' + err.message);
    } finally {
      setDownloadingReport(false);
    }
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

  const subTabs = [
    { id: 'owner', label: 'Owner', icon: <User size={14} /> },
    { id: 'property', label: 'Property', icon: <Building size={14} /> },
    { id: 'sales', label: 'Sales History', icon: <TrendingUp size={14} /> },
    { id: 'mortgage', label: 'Mortgage', icon: <DollarSign size={14} /> },
    { id: 'liens', label: 'Liens', icon: <AlertTriangle size={14} /> },
    { id: 'title', label: 'Title Report', icon: <FileText size={14} /> },
  ];

  // API Key setup screen
  if (showApiKeyInput) {
    return (
      <div>
        <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>
          PropertyScout.io Integration
        </h4>
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <Key size={40} style={{ marginBottom: 16, color: theme.accent }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Connect PropertyScout</h3>
          <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Get owner info, title reports, liens, and sales history. 
            Sign up for a free trial at PropertyScout.io to get your API key.
          </p>
          
          <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
            <label style={labelStyle}>API Key</label>
            <input
              type="password"
              style={inputStyle}
              placeholder="Enter your PropertyScout API key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
            />
            
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={saveApiKey}
                disabled={!apiKeyInput.trim()}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: apiKeyInput.trim() ? theme.accent : theme.bgElevated,
                  color: apiKeyInput.trim() ? '#fff' : theme.textDim,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: apiKeyInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save & Connect
              </button>
            </div>
            
            <a
              href="https://app.propertyscout.io/register/trial-api-user"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, color: theme.accent }}
            >
              Get a free API key (7-day trial) →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Initial state - prompt to fetch
  if (!data && !loading && !error) {
    return (
      <div>
        <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, marginBottom: 16 }}>
          PropertyScout.io Data
        </h4>
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <Shield size={40} style={{ marginBottom: 12, color: theme.accent }} />
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: theme.text }}>Owner & Title Information</p>
          <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 20 }}>
            Pull owner details, sales history, mortgage info, liens, and title reports.
          </p>
          <p style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 20, fontFamily: "'JetBrains Mono', monospace" }}>
            {primaryAddress || 'No address set'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={fetchData}
              disabled={!primaryAddress}
              style={{
                padding: '12px 24px',
                background: primaryAddress ? theme.accent : theme.bgElevated,
                color: primaryAddress ? '#fff' : theme.textDim,
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: primaryAddress ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Search size={16} /> Fetch PropertyScout Data
            </button>
            <button
              onClick={() => setShowApiKeyInput(true)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: `1px solid ${theme.border}`,
                color: theme.textSecondary,
                borderRadius: 10,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Key size={14} /> Change API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 60, textAlign: 'center' }}>
        <Loader size={32} style={{ marginBottom: 16, animation: 'spin 1s linear infinite', color: theme.accent }} />
        <p style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>Fetching PropertyScout Data...</p>
        <p style={{ fontSize: 13, color: theme.textDim }}>Pulling owner info, sales history, liens, and mortgage data</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
        <XCircle size={32} style={{ marginBottom: 12, color: '#dc2626' }} />
        <p style={{ fontSize: 15, fontWeight: 500, color: '#dc2626', marginBottom: 8 }}>Error</p>
        <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>{error}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={fetchData} style={{ padding: '10px 20px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Try Again
          </button>
          <button onClick={() => setShowApiKeyInput(true)} style={{ padding: '10px 20px', background: 'none', border: `1px solid ${theme.border}`, color: theme.textSecondary, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            Update API Key
          </button>
        </div>
      </div>
    );
  }

  const insights = data?.rapidInsights;
  const owner = insights?.owner;
  const property = insights?.property;
  const tax = insights?.tax;
  const valuation = insights?.valuation;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: theme.textDim, margin: 0 }}>
            PropertyScout.io Data
          </h4>
          <p style={{ fontSize: 12, color: theme.textSecondary, margin: '4px 0 0' }}>
            {primaryAddress}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowApiKeyInput(true)} style={{ padding: '6px 10px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 11, color: theme.textDim, cursor: 'pointer' }}>
            <Key size={12} />
          </button>
          <button onClick={fetchData} style={{ padding: '8px 14px', background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

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
            {t.id === 'liens' && data?.liens?.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: '#ef4444', color: 'white' }}>
                {data.liens.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Owner Tab */}
      {activeSubTab === 'owner' && (
        <div>
          {owner ? (
            <>
              <div style={cardStyle}>
                <div style={labelStyle}>Property Owner</div>
                <div style={{ ...valueStyle, fontSize: 18, color: theme.accent, marginBottom: 8 }}>{owner.name || '—'}</div>
                {owner.type && <div style={{ fontSize: 12, color: theme.textDim }}>Type: {owner.type}</div>}
                {owner.ownerOccupied !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13 }}>
                    {owner.ownerOccupied ? (
                      <><CheckCircle size={14} color="#059669" /> Owner Occupied</>
                    ) : (
                      <><Home size={14} color={theme.textDim} /> Non-Owner Occupied (Investor)</>
                    )}
                  </div>
                )}
              </div>

              {owner.mailingAddress && (
                <div style={cardStyle}>
                  <div style={labelStyle}>Mailing Address</div>
                  <div style={{ fontSize: 14 }}>
                    {owner.mailingAddress.street}<br />
                    {owner.mailingAddress.city}, {owner.mailingAddress.state} {owner.mailingAddress.zip}
                  </div>
                </div>
              )}

              {insights?.parcel && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={cardStyle}>
                    <div style={labelStyle}>APN / Parcel ID</div>
                    <div style={{ ...valueStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{insights.parcel.apn || '—'}</div>
                  </div>
                  <div style={cardStyle}>
                    <div style={labelStyle}>County</div>
                    <div style={valueStyle}>{insights.parcel.county || '—'}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim, padding: 40 }}>
              <User size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>Owner information not available</p>
            </div>
          )}
        </div>
      )}

      {/* Property Tab */}
      {activeSubTab === 'property' && (
        <div>
          {property ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={cardStyle}>
                  <div style={labelStyle}>Property Type</div>
                  <div style={valueStyle}>{property.propertyType || '—'}</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Year Built</div>
                  <div style={valueStyle}>{property.yearBuilt || '—'}</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Beds / Baths</div>
                  <div style={valueStyle}>{property.bedrooms || '—'} / {property.bathrooms || '—'}</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Square Feet</div>
                  <div style={{ ...valueStyle, fontFamily: "'JetBrains Mono', monospace" }}>{property.squareFeet?.toLocaleString() || '—'}</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Lot Size</div>
                  <div style={{ ...valueStyle, fontFamily: "'JetBrains Mono', monospace" }}>{property.lotSize?.toLocaleString() || '—'} SF</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Units</div>
                  <div style={valueStyle}>{property.units || '—'}</div>
                </div>
              </div>

              <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12 }}>Valuation & Tax</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {valuation?.estimatedValue && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>Estimated Value (AVM)</div>
                    <div style={{ ...valueStyle, color: theme.accent, fontSize: 18 }}>{fmt(valuation.estimatedValue)}</div>
                  </div>
                )}
                {valuation?.estimatedEquity && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>Estimated Equity</div>
                    <div style={{ ...valueStyle, color: '#059669', fontSize: 18 }}>{fmt(valuation.estimatedEquity)}</div>
                  </div>
                )}
                {tax?.assessedValue && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>Assessed Value</div>
                    <div style={{ ...valueStyle, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(tax.assessedValue)}</div>
                  </div>
                )}
                {tax?.taxAmount && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>Annual Taxes ({tax.taxYear || 'latest'})</div>
                    <div style={{ ...valueStyle, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(tax.taxAmount)}</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim, padding: 40 }}>
              <Building size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>Property details not available</p>
            </div>
          )}
        </div>
      )}

      {/* Sales History Tab */}
      {activeSubTab === 'sales' && (
        <div>
          <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 12 }}>Chain of Title</h5>
          {data?.salesHistory?.length > 0 ? (
            data.salesHistory.map((sale, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDate(sale.date)}</div>
                    <div style={{ fontSize: 12, color: theme.textDim }}>{sale.documentType || 'Sale'}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theme.accent }}>
                    {fmt(sale.price)}
                  </div>
                </div>
                {(sale.seller || sale.buyer) && (
                  <div style={{ fontSize: 12, color: theme.textSecondary, borderTop: `1px solid ${theme.border}`, paddingTop: 8, marginTop: 8 }}>
                    {sale.seller && <div><strong>From:</strong> {sale.seller}</div>}
                    {sale.buyer && <div><strong>To:</strong> {sale.buyer}</div>}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim, padding: 40 }}>
              <TrendingUp size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No sales history available</p>
            </div>
          )}
        </div>
      )}

      {/* Mortgage Tab */}
      {activeSubTab === 'mortgage' && (
        <div>
          {data?.mortgage?.currentMortgage ? (
            <>
              <div style={cardStyle}>
                <div style={labelStyle}>Current Mortgage</div>
                <div style={{ ...valueStyle, fontSize: 20, color: theme.accent, marginBottom: 8 }}>
                  {fmt(data.mortgage.currentMortgage.amount)}
                </div>
                <div style={{ fontSize: 13, color: theme.textSecondary }}>
                  {data.mortgage.currentMortgage.lender}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={cardStyle}>
                  <div style={labelStyle}>Originated</div>
                  <div style={valueStyle}>{fmtDate(data.mortgage.currentMortgage.date)}</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Type</div>
                  <div style={valueStyle}>{data.mortgage.currentMortgage.type || '—'}</div>
                </div>
                {data.mortgage.currentMortgage.rate && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>Rate</div>
                    <div style={valueStyle}>{data.mortgage.currentMortgage.rate}%</div>
                  </div>
                )}
                {data.mortgage.currentMortgage.term && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>Term</div>
                    <div style={valueStyle}>{data.mortgage.currentMortgage.term} years</div>
                  </div>
                )}
                {data.mortgage.estimatedEquity && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>Est. Equity</div>
                    <div style={{ ...valueStyle, color: '#059669' }}>{fmt(data.mortgage.estimatedEquity)}</div>
                  </div>
                )}
                {data.mortgage.ltv && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>LTV</div>
                    <div style={valueStyle}>{data.mortgage.ltv}%</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim, padding: 40, background: 'rgba(16,185,129,0.06)' }}>
              <CheckCircle size={32} style={{ marginBottom: 12, color: '#059669' }} />
              <p style={{ fontWeight: 500 }}>No active mortgage found</p>
              <p style={{ fontSize: 12 }}>Property may be owned free & clear</p>
            </div>
          )}
        </div>
      )}

      {/* Liens Tab */}
      {activeSubTab === 'liens' && (
        <div>
          {data?.liens?.length > 0 ? (
            <>
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertTriangle size={20} color="#dc2626" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{data.liens.length} Lien(s) Found</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>Review before proceeding with transaction</div>
                </div>
              </div>

              {data.liens.map((lien, i) => (
                <div key={i} style={{ ...cardStyle, borderLeft: '3px solid #dc2626' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{lien.type}</div>
                      <div style={{ fontSize: 12, color: theme.textDim }}>Filed: {fmtDate(lien.date)}</div>
                    </div>
                    {lien.amount && (
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#dc2626' }}>
                        {fmt(lien.amount)}
                      </div>
                    )}
                  </div>
                  {lien.creditor && <div style={{ fontSize: 12, color: theme.textSecondary }}>Creditor: {lien.creditor}</div>}
                  {lien.status && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                        background: lien.status === 'Released' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: lien.status === 'Released' ? '#059669' : '#dc2626',
                      }}>
                        {lien.status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: theme.textDim, padding: 40, background: 'rgba(16,185,129,0.06)' }}>
              <CheckCircle size={32} style={{ marginBottom: 12, color: '#059669' }} />
              <p style={{ fontWeight: 500, color: '#059669' }}>No liens found</p>
              <p style={{ fontSize: 12 }}>Property appears clear of involuntary liens</p>
            </div>
          )}
        </div>
      )}

      {/* Title Report Tab */}
      {activeSubTab === 'title' && (
        <div>
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <FileText size={40} style={{ marginBottom: 16, color: theme.accent }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Preliminary Title Report</h3>
              <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 20 }}>
                Download a comprehensive title report including ownership history, liens, encumbrances, and legal description.
              </p>
              <button
                onClick={handleDownloadTitleReport}
                disabled={downloadingReport}
                style={{
                  padding: '14px 28px',
                  background: theme.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: downloadingReport ? 'wait' : 'pointer',
                  opacity: downloadingReport ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {downloadingReport ? (
                  <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                ) : (
                  <><Download size={16} /> Download Title Report (PDF)</>
                )}
              </button>
              <p style={{ fontSize: 11, color: theme.textDim, marginTop: 12 }}>
                Uses 1 Enhanced Document credit from your PropertyScout account
              </p>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 16, background: theme.bgElevated, borderRadius: 10, fontSize: 12, color: theme.textSecondary }}>
            <strong>Note:</strong> This is a preliminary title report for informational purposes. For closing, you'll need a full title search from a licensed title company.
          </div>
        </div>
      )}
    </div>
  );
}
