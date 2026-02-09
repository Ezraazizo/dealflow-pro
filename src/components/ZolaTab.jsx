import { useState, useEffect } from 'react';
import { ZolaAPI } from '../lib/zolaAPI';
import { 
  MapPin, Building, Layers, Calculator, DollarSign, TreePine, Users, FileText,
  Loader, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, RefreshCw,
  Home, Factory, Store, Landmark, Map
} from 'lucide-react';

export default function ZolaTab({ deal, theme }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    zoning: true,
    far: true,
    landUse: false,
    building: false,
    tax: false,
    environmental: false,
    community: false,
    actions: false,
  });

  const addresses = deal.addresses || [];
  const primaryAddress = addresses[0]?.address || deal.address;
  const primaryBBL = addresses[0]?.bbl || deal.bbl;

  useEffect(() => {
    if (primaryAddress || primaryBBL) {
      fetchZolaData();
    }
  }, [primaryAddress, primaryBBL]);

  const fetchZolaData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const report = await ZolaAPI.getCompleteZolaReport(primaryBBL || primaryAddress);
      setData(report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fmt = (n) => {
    if (!n && n !== 0) return '—';
    return n.toLocaleString();
  };

  const fmtMoney = (n) => {
    if (!n && n !== 0) return '—';
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n.toLocaleString();
  };

  const cardStyle = {
    background: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    cursor: 'pointer',
    transition: 'background 0.15s',
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
    fontSize: 14,
    fontWeight: 500,
    color: theme.text,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  };

  if (!primaryAddress && !primaryBBL) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: theme.textDim }}>
        <MapPin size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: theme.text }}>No Address Set</p>
        <p style={{ fontSize: 13 }}>Add an address to this deal to view ZoLa data.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Loader size={32} style={{ marginBottom: 16, color: theme.accent, animation: 'spin 1s linear infinite' }} />
        <p style={{ color: theme.textDim }}>Loading ZoLa data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <AlertTriangle size={48} style={{ marginBottom: 16, color: '#dc2626', opacity: 0.5 }} />
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: theme.text }}>Error Loading Data</p>
        <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 16 }}>{error}</p>
        <button
          onClick={fetchZolaData}
          style={{ padding: '8px 16px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const Section = ({ id, icon, title, children, badge }) => (
    <div style={cardStyle}>
      <div
        onClick={() => toggleSection(id)}
        style={{ ...headerStyle, background: expandedSections[id] ? theme.bgElevated : 'transparent' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${theme.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent }}>
            {icon}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          {badge && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: badge.bg, color: badge.color }}>
              {badge.text}
            </span>
          )}
        </div>
        {expandedSections[id] ? <ChevronUp size={18} color={theme.textDim} /> : <ChevronDown size={18} color={theme.textDim} />}
      </div>
      {expandedSections[id] && (
        <div style={{ padding: 18, borderTop: `1px solid ${theme.border}` }}>
          {children}
        </div>
      )}
    </div>
  );

  const DataItem = ({ label, value, mono, highlight }) => (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={{ 
        ...valueStyle, 
        fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
        color: highlight ? theme.accent : theme.text,
        fontWeight: highlight ? 700 : 500,
      }}>
        {value || '—'}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 4 }}>ZoLa NYC Analysis</h4>
          <p style={{ fontSize: 12, color: theme.textDim, margin: 0 }}>BBL: {data.bbl}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchZolaData}
            style={{ padding: '8px 12px', background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <a
            href={data.zola_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', background: theme.accent, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> Open in ZoLa
          </a>
        </div>
      </div>

      {/* Zoning Section */}
      <Section
        id="zoning"
        icon={<Layers size={16} />}
        title="Zoning Districts"
        badge={data.zoning?.primary_zone ? { text: data.zoning.primary_zone, bg: `${theme.accent}15`, color: theme.accent } : null}
      >
        <div style={gridStyle}>
          <DataItem label="Primary Zone" value={data.zoning?.primary_zone} highlight />
          <DataItem label="Description" value={data.zoning?.zoning_description} />
          <DataItem label="Zoning Map" value={data.zoning?.zoning_map} />
        </div>
        
        {data.zoning?.all_zones?.length > 1 && (
          <div style={{ marginTop: 16 }}>
            <div style={labelStyle}>All Zoning Districts</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {data.zoning.all_zones.map((zone, i) => (
                <span key={i} style={{ padding: '4px 10px', background: theme.bgElevated, borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{zone}</span>
              ))}
            </div>
          </div>
        )}

        {data.zoning?.overlays?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={labelStyle}>Commercial Overlays</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {data.zoning.overlays.map((overlay, i) => (
                <span key={i} style={{ padding: '4px 10px', background: 'rgba(37,99,235,0.1)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#2563eb' }}>{overlay}</span>
              ))}
            </div>
          </div>
        )}

        {data.zoning?.special_districts?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={labelStyle}>Special Districts</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {data.zoning.special_districts.map((sd, i) => (
                <span key={i} style={{ padding: '4px 10px', background: 'rgba(124,58,237,0.1)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#7c3aed' }}>{sd}</span>
              ))}
            </div>
          </div>
        )}

        {data.zoning?.permitted_uses?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={labelStyle}>Permitted Uses</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {data.zoning.permitted_uses.map((use, i) => (
                <span key={i} style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#059669' }}>{use}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* FAR & Development Rights */}
      <Section id="far" icon={<Calculator size={16} />} title="FAR & Development Rights">
        <div style={gridStyle}>
          <DataItem label="Lot Area" value={fmt(data.far?.lot_area_sf) + ' SF'} mono />
          <DataItem label="Built FAR" value={data.far?.built_far?.toFixed(2)} mono />
          <DataItem label="Max FAR" value={data.far?.max_far?.toFixed(2)} mono highlight />
        </div>
        
        <div style={{ marginTop: 20, padding: 16, background: theme.bgElevated, borderRadius: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.textDim, marginBottom: 4 }}>RESIDENTIAL FAR</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>{data.far?.residential_far?.toFixed(2) || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.textDim, marginBottom: 4 }}>COMMERCIAL FAR</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>{data.far?.commercial_far?.toFixed(2) || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.textDim, marginBottom: 4 }}>FACILITY FAR</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>{data.far?.facility_far?.toFixed(2) || '—'}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={labelStyle}>Development Potential</div>
          <div style={{ marginTop: 8 }}>
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 12, background: theme.bgElevated, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${data.far?.utilization_pct || 0}%`, height: '100%', background: data.far?.utilization_pct > 90 ? '#dc2626' : data.far?.utilization_pct > 70 ? '#d97706' : '#059669', borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{data.far?.utilization_pct || 0}%</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <DataItem label="Current Built" value={fmt(data.far?.current_built_sf) + ' SF'} mono />
              <DataItem label="Max Buildable" value={fmt(data.far?.max_buildable_sf) + ' SF'} mono />
              <DataItem label="Remaining" value={fmt(data.far?.remaining_buildable_sf) + ' SF'} mono highlight />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <DataItem label="Lot Frontage" value={data.far?.lot_frontage ? data.far.lot_frontage + ' ft' : '—'} />
          <DataItem label="Lot Depth" value={data.far?.lot_depth ? data.far.lot_depth + ' ft' : '—'} />
          <DataItem label="Lot Type" value={data.far?.lot_type || 'Regular'} />
          <DataItem label="Irregular" value={data.far?.irregular_lot ? 'Yes' : 'No'} />
        </div>
      </Section>

      {/* Land Use */}
      <Section id="landUse" icon={<Map size={16} />} title="Land Use">
        <div style={gridStyle}>
          <DataItem label="Land Use Code" value={data.land_use?.land_use_code} />
          <DataItem label="Category" value={data.land_use?.land_use_category} />
          <DataItem label="Building Class" value={data.land_use?.building_class} />
        </div>
        <div style={{ marginTop: 16, ...gridStyle }}>
          <DataItem label="Class Description" value={data.land_use?.building_class_description} />
          <DataItem label="Ownership" value={data.land_use?.ownership_type} />
          <DataItem label="Owner" value={data.land_use?.owner_name} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          {data.land_use?.condo && <span style={{ padding: '4px 10px', background: 'rgba(37,99,235,0.1)', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#2563eb' }}>Condo</span>}
          {data.land_use?.corner_lot && <span style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#059669' }}>Corner Lot</span>}
          {data.land_use?.landmark && <span style={{ padding: '4px 10px', background: 'rgba(217,119,6,0.1)', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#d97706' }}>Landmark: {data.land_use.landmark}</span>}
          {data.land_use?.historic_district && <span style={{ padding: '4px 10px', background: 'rgba(124,58,237,0.1)', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#7c3aed' }}>Historic: {data.land_use.historic_district}</span>}
        </div>
      </Section>

      {/* Building */}
      <Section id="building" icon={<Building size={16} />} title="Building Information">
        <div style={gridStyle}>
          <DataItem label="Year Built" value={data.building?.year_built} />
          <DataItem label="Buildings" value={data.building?.num_buildings} />
          <DataItem label="Floors" value={data.building?.num_floors} />
        </div>
        <div style={{ marginTop: 16, ...gridStyle }}>
          <DataItem label="Total Units" value={data.building?.units_total} />
          <DataItem label="Residential Units" value={data.building?.units_residential} />
          <DataItem label="Gross SF" value={fmt(data.building?.gross_sf)} mono />
        </div>
        
        {(data.building?.residential_sf > 0 || data.building?.commercial_sf > 0 || data.building?.office_sf > 0) && (
          <div style={{ marginTop: 20, padding: 16, background: theme.bgElevated, borderRadius: 10 }}>
            <div style={labelStyle}>Area Breakdown</div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {data.building?.residential_sf > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <Home size={20} style={{ marginBottom: 4, color: '#2563eb' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(data.building.residential_sf)}</div>
                  <div style={{ fontSize: 10, color: theme.textDim }}>Residential SF</div>
                </div>
              )}
              {data.building?.commercial_sf > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <Store size={20} style={{ marginBottom: 4, color: '#d97706' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(data.building.commercial_sf)}</div>
                  <div style={{ fontSize: 10, color: theme.textDim }}>Commercial SF</div>
                </div>
              )}
              {data.building?.office_sf > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <Building size={20} style={{ marginBottom: 4, color: '#7c3aed' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(data.building.office_sf)}</div>
                  <div style={{ fontSize: 10, color: theme.textDim }}>Office SF</div>
                </div>
              )}
              {data.building?.retail_sf > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <Store size={20} style={{ marginBottom: 4, color: '#059669' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(data.building.retail_sf)}</div>
                  <div style={{ fontSize: 10, color: theme.textDim }}>Retail SF</div>
                </div>
              )}
              {data.building?.factory_sf > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <Factory size={20} style={{ marginBottom: 4, color: '#64748b' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(data.building.factory_sf)}</div>
                  <div style={{ fontSize: 10, color: theme.textDim }}>Factory SF</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Tax Assessment */}
      <Section id="tax" icon={<DollarSign size={16} />} title="Tax Assessment">
        <div style={gridStyle}>
          <DataItem label="Assessed Land" value={fmtMoney(data.tax?.assessed_land)} mono />
          <DataItem label="Assessed Total" value={fmtMoney(data.tax?.assessed_total)} mono highlight />
          <DataItem label="Tax Class" value={data.tax?.tax_class} />
        </div>
        {(data.tax?.exempt_land > 0 || data.tax?.exempt_total > 0) && (
          <div style={{ marginTop: 16, ...gridStyle }}>
            <DataItem label="Exempt Land" value={fmtMoney(data.tax?.exempt_land)} mono />
            <DataItem label="Exempt Total" value={fmtMoney(data.tax?.exempt_total)} mono />
          </div>
        )}
      </Section>

      {/* Environmental */}
      <Section id="environmental" icon={<TreePine size={16} />} title="Environmental Constraints">
        <div style={gridStyle}>
          <DataItem label="Flood Zone" value={data.environmental?.flood_zone || 'None'} />
          <DataItem label="Coastal Zone" value={data.environmental?.coastal_zone ? 'Yes' : 'No'} />
          <DataItem label="Waterfront" value={data.environmental?.waterfront ? 'Yes' : 'No'} />
        </div>
        {data.environmental?.environmental_restrictions && (
          <div style={{ marginTop: 16 }}>
            <DataItem label="Environmental Restrictions" value={data.environmental.environmental_restrictions} />
          </div>
        )}
        <div style={{ marginTop: 16, ...gridStyle }}>
          <DataItem label="Fire Company" value={data.environmental?.fire_comp} />
          <DataItem label="Police Precinct" value={data.environmental?.police_precinct} />
          <DataItem label="Health Area" value={data.environmental?.health_area} />
        </div>
      </Section>

      {/* Community */}
      <Section id="community" icon={<Users size={16} />} title="Community & Political">
        <div style={gridStyle}>
          <DataItem label="Community Board" value={data.community?.community_board} />
          <DataItem label="Council District" value={data.community?.council_district} />
          <DataItem label="School District" value={data.community?.school_district} />
        </div>
        <div style={{ marginTop: 16, ...gridStyle }}>
          <DataItem label="NTA" value={data.community?.nta_name} />
          <DataItem label="Census Tract" value={data.community?.census_tract} />
          <DataItem label="ZIP Code" value={data.community?.zip_code} />
        </div>
      </Section>

      {/* Zoning Actions */}
      <Section id="actions" icon={<FileText size={16} />} title="Zoning Actions & Applications">
        {data.actions?.actions?.length === 0 ? (
          <p style={{ fontSize: 13, color: theme.textDim, textAlign: 'center', padding: 16 }}>No zoning actions found for this property.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.actions?.actions?.map((action, i) => (
              <div key={i} style={{ padding: 16, background: theme.bgElevated, borderRadius: 10, borderLeft: `3px solid ${theme.accent}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{action.project_name || action.ulurp_number}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', background: action.status === 'Approved' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: action.status === 'Approved' ? '#059669' : '#d97706', borderRadius: 4, fontWeight: 500 }}>
                    {action.status || 'Pending'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: theme.textDim, marginBottom: 4 }}>{action.action_type}</div>
                {action.description && <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0 }}>{action.description}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: 16, fontSize: 11, color: theme.textDim }}>
        Data from NYC Open Data • Generated {new Date(data.generated_at).toLocaleString()}
      </div>
    </div>
  );
}
