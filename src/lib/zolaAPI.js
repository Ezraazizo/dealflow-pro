// ZoLa NYC Integration API
// Pulls zoning, land use, and planning data directly from NYC Open Data
// Free - no API key required

const NYC_OPEN_DATA_BASE = 'https://data.cityofnewyork.us/resource';
const NYC_GEOSEARCH_BASE = 'https://geosearch.planninglabs.nyc/v2';
const NYC_ZOLA_BASE = 'https://zola.planning.nyc.gov';

// ─── Address to BBL Lookup ─────────────────────────────────
export async function addressToBBL(address) {
  const response = await fetch(
    `${NYC_GEOSEARCH_BASE}/search?text=${encodeURIComponent(address)}`
  );
  
  if (!response.ok) throw new Error('GeoSearch failed');
  
  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    throw new Error('Address not found');
  }
  
  const feature = data.features[0];
  const props = feature.properties;
  
  return {
    address: props.label,
    bbl: props.addendum?.pad?.bbl || null,
    borough: props.borough,
    borough_code: getBoroughCode(props.borough),
    block: props.addendum?.pad?.block || null,
    lot: props.addendum?.pad?.lot || null,
    bin: props.addendum?.pad?.bin || null,
    coordinates: {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    },
  };
}

// ─── BBL to Coordinates ────────────────────────────────────
export async function bblToCoordinates(bbl) {
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/64uk-42ks.json?bbl=${bbl}&$limit=1`
  );
  
  if (!response.ok) throw new Error('PLUTO lookup failed');
  
  const data = await response.json();
  
  if (data.length === 0) return null;
  
  return {
    lat: parseFloat(data[0].latitude),
    lng: parseFloat(data[0].longitude),
  };
}

// ─── Zoning Data ───────────────────────────────────────────
export async function getZoningData(bbl) {
  // Primary zoning from Zoning Tax Lot Database
  const zoningResponse = await fetch(
    `${NYC_OPEN_DATA_BASE}/fdkv-4t4z.json?bbl=${bbl}`
  );
  
  const zoningData = await zoningResponse.json();
  
  // PLUTO for additional zoning info
  const plutoResponse = await fetch(
    `${NYC_OPEN_DATA_BASE}/64uk-42ks.json?bbl=${bbl}&$limit=1`
  );
  
  const plutoData = await plutoResponse.json();
  const pluto = plutoData[0] || {};
  
  // Parse zoning districts (can have multiple)
  const zoningDistricts = [];
  if (pluto.zonedist1) zoningDistricts.push(pluto.zonedist1);
  if (pluto.zonedist2) zoningDistricts.push(pluto.zonedist2);
  if (pluto.zonedist3) zoningDistricts.push(pluto.zonedist3);
  if (pluto.zonedist4) zoningDistricts.push(pluto.zonedist4);
  
  // Parse overlays
  const overlays = [];
  if (pluto.overlay1) overlays.push(pluto.overlay1);
  if (pluto.overlay2) overlays.push(pluto.overlay2);
  
  // Parse special districts
  const specialDistricts = [];
  if (pluto.spdist1) specialDistricts.push(pluto.spdist1);
  if (pluto.spdist2) specialDistricts.push(pluto.spdist2);
  if (pluto.spdist3) specialDistricts.push(pluto.spdist3);
  
  return {
    bbl,
    primary_zone: zoningDistricts[0] || null,
    all_zones: zoningDistricts,
    overlays,
    special_districts: specialDistricts,
    commercial_overlay: pluto.overlay1 || null,
    limited_height_district: pluto.ltdheight || null,
    zoning_map: pluto.zmcode || null,
    zoning_description: getZoningDescription(zoningDistricts[0]),
    permitted_uses: getPermittedUses(zoningDistricts[0]),
    zola_link: `${NYC_ZOLA_BASE}/l/lot/${bbl.slice(0,1)}/${bbl.slice(1,6)}/${bbl.slice(6)}`,
  };
}

// ─── FAR & Building Envelope ───────────────────────────────
export async function getFARData(bbl) {
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/64uk-42ks.json?bbl=${bbl}&$limit=1`
  );
  
  const data = await response.json();
  const pluto = data[0] || {};
  
  const lotArea = parseFloat(pluto.lotarea) || 0;
  const builtFAR = parseFloat(pluto.builtfar) || 0;
  const residFAR = parseFloat(pluto.residfar) || 0;
  const commFAR = parseFloat(pluto.commfar) || 0;
  const facilFAR = parseFloat(pluto.facilfar) || 0;
  
  // Calculate max FAR (highest of the three)
  const maxFAR = Math.max(residFAR, commFAR, facilFAR);
  
  // Calculate buildable and remaining
  const maxBuildable = lotArea * maxFAR;
  const currentBuilt = lotArea * builtFAR;
  const remainingBuildable = maxBuildable - currentBuilt;
  
  return {
    bbl,
    lot_area_sf: lotArea,
    built_far: builtFAR,
    residential_far: residFAR,
    commercial_far: commFAR,
    facility_far: facilFAR,
    max_far: maxFAR,
    current_built_sf: Math.round(currentBuilt),
    max_buildable_sf: Math.round(maxBuildable),
    remaining_buildable_sf: Math.round(Math.max(0, remainingBuildable)),
    utilization_pct: maxFAR > 0 ? Math.round((builtFAR / maxFAR) * 100) : 0,
    lot_frontage: parseFloat(pluto.lotfront) || null,
    lot_depth: parseFloat(pluto.lotdepth) || null,
    lot_type: pluto.lottype || null,
    irregular_lot: pluto.irrlotcode === 'Y',
  };
}

// ─── Land Use Data ─────────────────────────────────────────
export async function getLandUseData(bbl) {
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/64uk-42ks.json?bbl=${bbl}&$limit=1`
  );
  
  const data = await response.json();
  const pluto = data[0] || {};
  
  return {
    bbl,
    land_use_code: pluto.landuse || null,
    land_use_category: getLandUseCategory(pluto.landuse),
    building_class: pluto.bldgclass || null,
    building_class_description: getBuildingClassDescription(pluto.bldgclass),
    ownership_type: getOwnershipType(pluto.ownertype),
    owner_name: pluto.ownername || null,
    condo: pluto.condession === '1',
    landmark: pluto.landmark || null,
    historic_district: pluto.histdist || null,
    interior_lot: pluto.irrlotcode !== 'Y' && !pluto.lotfront,
    corner_lot: pluto.corner === 'Y',
  };
}

// ─── Building Data ─────────────────────────────────────────
export async function getBuildingData(bbl) {
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/64uk-42ks.json?bbl=${bbl}&$limit=1`
  );
  
  const data = await response.json();
  const pluto = data[0] || {};
  
  return {
    bbl,
    year_built: parseInt(pluto.yearbuilt) || null,
    year_altered_1: parseInt(pluto.yearalter1) || null,
    year_altered_2: parseInt(pluto.yearalter2) || null,
    num_buildings: parseInt(pluto.numbldgs) || 0,
    num_floors: parseFloat(pluto.numfloors) || 0,
    units_total: parseInt(pluto.unitstotal) || 0,
    units_residential: parseInt(pluto.unitsres) || 0,
    gross_sf: parseInt(pluto.bldgarea) || 0,
    residential_sf: parseInt(pluto.resarea) || 0,
    commercial_sf: parseInt(pluto.comarea) || 0,
    office_sf: parseInt(pluto.officearea) || 0,
    retail_sf: parseInt(pluto.retailarea) || 0,
    garage_sf: parseInt(pluto.garagearea) || 0,
    storage_sf: parseInt(pluto.strgearea) || 0,
    factory_sf: parseInt(pluto.factryarea) || 0,
    other_sf: parseInt(pluto.otherarea) || 0,
    building_frontage: parseFloat(pluto.bldgfront) || null,
    building_depth: parseFloat(pluto.bldgdepth) || null,
  };
}

// ─── Tax Assessment Data ───────────────────────────────────
export async function getTaxData(bbl) {
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/64uk-42ks.json?bbl=${bbl}&$limit=1`
  );
  
  const data = await response.json();
  const pluto = data[0] || {};
  
  return {
    bbl,
    assessed_land: parseFloat(pluto.assessland) || 0,
    assessed_total: parseFloat(pluto.assesstot) || 0,
    exempt_land: parseFloat(pluto.exmptland) || 0,
    exempt_total: parseFloat(pluto.exempttot) || 0,
    tax_class: pluto.taxclass || null,
    tax_class_at_present: pluto.taxclassp || null,
    tax_map: pluto.taxmap || null,
    appbbl: pluto.appbbl || null,
    appdbl: pluto.appdbl || null,
  };
}

// ─── Environmental Constraints ─────────────────────────────
export async function getEnvironmentalData(bbl) {
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/64uk-42ks.json?bbl=${bbl}&$limit=1`
  );
  
  const data = await response.json();
  const pluto = data[0] || {};
  
  // Check flood zone (separate dataset)
  let floodZone = null;
  try {
    const floodResponse = await fetch(
      `${NYC_OPEN_DATA_BASE}/v5dn-kh3t.json?$where=bbl='${bbl}'&$limit=1`
    );
    const floodData = await floodResponse.json();
    if (floodData.length > 0) {
      floodZone = floodData[0].flood_zone || floodData[0].fld_zone;
    }
  } catch (e) {
    // Flood data not available
  }
  
  return {
    bbl,
    flood_zone: floodZone,
    coastal_zone: pluto.coastalzn === 'Y',
    waterfront: pluto.pfirm15_flag === '1',
    environmental_restrictions: pluto.edesignat || null,
    sanborn_map: pluto.sanession || null,
    fire_comp: pluto.firecomp || null,
    health_area: pluto.healtharea || null,
    police_precinct: pluto.polession || null,
    health_center_district: pluto.healthcent || null,
  };
}

// ─── Community District & Political ───────────────────────
export async function getCommunityData(bbl) {
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/64uk-42ks.json?bbl=${bbl}&$limit=1`
  );
  
  const data = await response.json();
  const pluto = data[0] || {};
  
  return {
    bbl,
    community_district: pluto.cd || null,
    community_board: pluto.cd ? `${getBoroughName(pluto.cd.slice(0,1))} CB${parseInt(pluto.cd.slice(1))}` : null,
    council_district: pluto.council || null,
    census_tract: pluto.ct2010 || pluto.ct2020 || null,
    census_block: pluto.cb2010 || pluto.cb2020 || null,
    nta: pluto.ntacode || null,
    nta_name: pluto.ntaname || null,
    school_district: pluto.schooldist || null,
    zip_code: pluto.zipcode || null,
  };
}

// ─── Zoning Actions & Changes ──────────────────────────────
export async function getZoningActions(bbl) {
  // Zoning applications
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/rvhx-8trz.json?$where=bbl='${bbl}'&$order=ulurpno DESC&$limit=10`
  );
  
  const data = await response.json();
  
  return {
    bbl,
    actions: data.map(action => ({
      ulurp_number: action.ulurpno || null,
      project_name: action.projectname || null,
      action_type: action.ulurptype || null,
      status: action.dcpstatus || null,
      certified_date: action.certifieddate || null,
      approved_date: action.approveddate || null,
      description: action.projectdesc || null,
    })),
  };
}

// ─── Nearby Rezonings ──────────────────────────────────────
export async function getNearbyRezonings(lat, lng, radiusMeters = 500) {
  // This uses the Zoning Map Amendments dataset
  const response = await fetch(
    `${NYC_OPEN_DATA_BASE}/rvhx-8trz.json?$where=within_circle(the_geom, ${lat}, ${lng}, ${radiusMeters})&$order=effective DESC&$limit=20`
  );
  
  const data = await response.json();
  
  return data.map(item => ({
    project_name: item.projectname || null,
    status: item.dcpstatus || null,
    effective_date: item.effective || null,
    from_zone: item.zoningmapf || null,
    to_zone: item.zoningmapt || null,
    description: item.projectdesc || null,
  }));
}

// ─── Complete ZoLa Report ──────────────────────────────────
export async function getCompleteZolaReport(addressOrBBL) {
  let bbl = addressOrBBL;
  let addressInfo = null;
  
  // If it looks like an address, convert to BBL
  if (addressOrBBL.length !== 10 || isNaN(addressOrBBL)) {
    addressInfo = await addressToBBL(addressOrBBL);
    bbl = addressInfo.bbl;
  }
  
  if (!bbl) throw new Error('Could not determine BBL');
  
  // Fetch all data in parallel
  const [
    zoning,
    far,
    landUse,
    building,
    tax,
    environmental,
    community,
    actions,
  ] = await Promise.all([
    getZoningData(bbl),
    getFARData(bbl),
    getLandUseData(bbl),
    getBuildingData(bbl),
    getTaxData(bbl),
    getEnvironmentalData(bbl),
    getCommunityData(bbl),
    getZoningActions(bbl),
  ]);
  
  return {
    address: addressInfo,
    bbl,
    zoning,
    far,
    land_use: landUse,
    building,
    tax,
    environmental,
    community,
    actions,
    generated_at: new Date().toISOString(),
    zola_link: `${NYC_ZOLA_BASE}/l/lot/${bbl.slice(0,1)}/${bbl.slice(1,6)}/${bbl.slice(6)}`,
  };
}

// ─── Helper Functions ──────────────────────────────────────

function getBoroughCode(borough) {
  const codes = {
    'Manhattan': '1',
    'Bronx': '2',
    'Brooklyn': '3',
    'Queens': '4',
    'Staten Island': '5',
  };
  return codes[borough] || null;
}

function getBoroughName(code) {
  const names = {
    '1': 'Manhattan',
    '2': 'Bronx',
    '3': 'Brooklyn',
    '4': 'Queens',
    '5': 'Staten Island',
  };
  return names[code] || null;
}

function getZoningDescription(zone) {
  if (!zone) return null;
  
  const prefix = zone.slice(0, 2).toUpperCase();
  const descriptions = {
    'R1': 'Single-Family Detached Residences',
    'R2': 'Single-Family Detached Residences',
    'R3': 'Low-Rise Attached & Detached Residences',
    'R4': 'Low-Rise Attached Residences',
    'R5': 'Low-Rise Apartments',
    'R6': 'Medium-Density Apartments',
    'R7': 'Medium-High Density Apartments',
    'R8': 'High-Density Apartments',
    'R9': 'High-Density Apartments (Towers)',
    'R10': 'Highest Density Residential',
    'C1': 'Local Retail (Overlay)',
    'C2': 'Local Service (Overlay)',
    'C3': 'Waterfront Recreation',
    'C4': 'General Commercial',
    'C5': 'Central Commercial',
    'C6': 'General Central Commercial',
    'C7': 'Commercial Amusement',
    'C8': 'Heavy Commercial Services',
    'M1': 'Light Manufacturing',
    'M2': 'Medium Manufacturing',
    'M3': 'Heavy Manufacturing',
    'PA': 'Park',
    'BPC': 'Battery Park City',
  };
  
  return descriptions[prefix] || descriptions[zone.slice(0, 1)] || 'Mixed Use / Special District';
}

function getPermittedUses(zone) {
  if (!zone) return [];
  
  const prefix = zone.slice(0, 1).toUpperCase();
  
  if (prefix === 'R') {
    return ['Residential', 'Community Facilities', 'Houses of Worship', 'Schools'];
  }
  if (prefix === 'C') {
    return ['Retail', 'Office', 'Residential (in most)', 'Restaurants', 'Hotels', 'Entertainment'];
  }
  if (prefix === 'M') {
    return ['Manufacturing', 'Warehousing', 'Office', 'Some Retail', 'Auto Services'];
  }
  
  return ['Mixed Use'];
}

function getLandUseCategory(code) {
  const categories = {
    '01': 'One & Two Family Buildings',
    '02': 'Multi-Family Walk-Up',
    '03': 'Multi-Family Elevator',
    '04': 'Mixed Residential & Commercial',
    '05': 'Commercial & Office',
    '06': 'Industrial & Manufacturing',
    '07': 'Transportation & Utility',
    '08': 'Public Facilities & Institutions',
    '09': 'Open Space & Recreation',
    '10': 'Parking Facilities',
    '11': 'Vacant Land',
  };
  return categories[code] || 'Unknown';
}

function getBuildingClassDescription(code) {
  if (!code) return null;
  
  const firstChar = code.charAt(0).toUpperCase();
  const classes = {
    'A': 'One Family Dwellings',
    'B': 'Two Family Dwellings',
    'C': 'Walk-Up Apartments',
    'D': 'Elevator Apartments',
    'E': 'Warehouses',
    'F': 'Factory & Industrial',
    'G': 'Garages & Gas Stations',
    'H': 'Hotels',
    'I': 'Hospitals & Health',
    'J': 'Theatres',
    'K': 'Stores',
    'L': 'Lofts',
    'M': 'Churches & Religious',
    'N': 'Asylums & Homes',
    'O': 'Office Buildings',
    'P': 'Indoor Recreation',
    'Q': 'Outdoor Recreation',
    'R': 'Condos',
    'S': 'Mixed Use',
    'T': 'Transportation',
    'U': 'Utility',
    'V': 'Vacant Land',
    'W': 'Schools',
    'Y': 'Government',
    'Z': 'Miscellaneous',
  };
  
  return classes[firstChar] || 'Unknown';
}

function getOwnershipType(code) {
  const types = {
    'C': 'City',
    'M': 'Mixed (City & Private)',
    'O': 'Other (Public Authority)',
    'P': 'Private',
    'X': 'Fully Tax Exempt',
  };
  return types[code] || 'Private';
}

// ─── Export for use in components ──────────────────────────
export const ZolaAPI = {
  addressToBBL,
  bblToCoordinates,
  getZoningData,
  getFARData,
  getLandUseData,
  getBuildingData,
  getTaxData,
  getEnvironmentalData,
  getCommunityData,
  getZoningActions,
  getNearbyRezonings,
  getCompleteZolaReport,
};

export default ZolaAPI;
