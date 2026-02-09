// NYC Open Data API Service
// Fetches zoning, ACRIS records, HPD violations, property tax data

const NYC_OPEN_DATA_BASE = 'https://data.cityofnewyork.us/resource';
const GEOSEARCH_BASE = 'https://geosearch.planninglabs.nyc/v2/search';

// Dataset IDs from NYC Open Data
const DATASETS = {
  // ACRIS
  acrisRealPropertyMaster: 'bnx9-e6tj',  // Deeds, mortgages, etc.
  acrisRealPropertyParties: '636b-3b5g', // Parties to transactions
  acrisRealPropertyLegals: '8h5j-fqxa',  // BBL linkages
  acrisRealPropertyRemarks: '9p4w-7npp', // Document remarks
  
  // HPD
  hpdViolations: 'wvxf-dwi5',            // Housing violations
  hpdComplaints: 'uwyv-629c',            // Housing complaints
  hpdRegistrations: 'tesw-yqqr',         // Building registrations
  
  // DOB
  dobViolations: '3h2n-5cm9',            // Building violations
  dobComplaints: 'eabe-havv',            // Building complaints
  dobPermits: 'ipu4-2vj7',               // Permits issued
  dobJobApplications: 'ic3t-wcy2',       // Job filings
  
  // Property
  pluto: '64uk-42ks',                    // PLUTO property data (MapPLUTO)
  zoningTaxLot: 'fdkv-4t4z',             // Zoning by tax lot
  propertyValuation: 'yjxr-fw8i',        // DOF property valuation
  
  // ECB
  ecbViolations: '6bgk-3dad',            // ECB violations
};

// Borough codes for BBL
const BOROUGH_CODES = {
  'MANHATTAN': '1', 'MN': '1', 'NEW YORK': '1',
  'BRONX': '2', 'BX': '2',
  'BROOKLYN': '3', 'BK': '3', 'KINGS': '3',
  'QUEENS': '4', 'QN': '4',
  'STATEN ISLAND': '5', 'SI': '5', 'RICHMOND': '5',
};

// Convert address to BBL using NYC GeoSearch
export async function addressToBBL(address) {
  try {
    const response = await fetch(
      `${GEOSEARCH_BASE}?text=${encodeURIComponent(address)}`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      return {
        bbl: props.addendum?.pad?.bbl || props.pad_bbl,
        borough: props.borough,
        block: props.addendum?.pad?.block || props.pad_block,
        lot: props.addendum?.pad?.lot || props.pad_lot,
        address: props.label,
        coordinates: data.features[0].geometry.coordinates,
        bin: props.addendum?.pad?.bin,
      };
    }
    return null;
  } catch (error) {
    console.error('GeoSearch error:', error);
    return null;
  }
}

// Generic NYC Open Data fetch
async function fetchNYCOpenData(datasetId, params = {}) {
  const queryParams = new URLSearchParams({
    $limit: params.limit || 100,
    ...params,
  });
  delete queryParams.limit;
  
  const url = `${NYC_OPEN_DATA_BASE}/${datasetId}.json?${queryParams}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`NYC Open Data error (${datasetId}):`, error);
    return [];
  }
}

// Get zoning info for a BBL
export async function getZoningInfo(bbl) {
  const data = await fetchNYCOpenData(DATASETS.zoningTaxLot, {
    bbl: bbl,
  });
  
  if (data.length > 0) {
    const lot = data[0];
    return {
      bbl: lot.bbl,
      borough: lot.borough,
      block: lot.block,
      lot: lot.lot,
      zoningDistrict1: lot.zonedist1,
      zoningDistrict2: lot.zonedist2,
      zoningDistrict3: lot.zonedist3,
      zoningDistrict4: lot.zonedist4,
      commercialOverlay1: lot.overlay1,
      commercialOverlay2: lot.overlay2,
      specialDistrict1: lot.spdist1,
      specialDistrict2: lot.spdist2,
      specialDistrict3: lot.spdist3,
      limitedHeightDistrict: lot.ltdheight,
      zoningMapNumber: lot.zonemap,
    };
  }
  return null;
}

// Get PLUTO data (lot info, FAR, building class, etc.)
export async function getPLUTOData(bbl) {
  const data = await fetchNYCOpenData(DATASETS.pluto, {
    bbl: bbl,
  });
  
  if (data.length > 0) {
    const lot = data[0];
    return {
      bbl: lot.bbl,
      address: lot.address,
      borough: lot.borough,
      block: lot.block,
      lot: lot.lot,
      
      // Zoning
      zoneDist1: lot.zonedist1,
      zoneDist2: lot.zonedist2,
      overlay1: lot.overlay1,
      overlay2: lot.overlay2,
      specialDistrict1: lot.spdist1,
      
      // FAR & Development
      residentialFAR: parseFloat(lot.residfar) || 0,
      commercialFAR: parseFloat(lot.commfar) || 0,
      facilityFAR: parseFloat(lot.facilfar) || 0,
      builtFAR: parseFloat(lot.builtfar) || 0,
      maxAllowableFAR: Math.max(
        parseFloat(lot.residfar) || 0,
        parseFloat(lot.commfar) || 0,
        parseFloat(lot.facilfar) || 0
      ),
      
      // Lot Info
      lotArea: parseInt(lot.lotarea) || 0,
      lotFront: parseFloat(lot.lotfront) || 0,
      lotDepth: parseFloat(lot.lotdepth) || 0,
      
      // Building Info
      buildingClass: lot.bldgclass,
      landUse: lot.landuse,
      numFloors: parseInt(lot.numfloors) || 0,
      unitsTotal: parseInt(lot.unitstotal) || 0,
      unitsRes: parseInt(lot.unitsres) || 0,
      buildingArea: parseInt(lot.bldgarea) || 0,
      residentialArea: parseInt(lot.resarea) || 0,
      commercialArea: parseInt(lot.comarea) || 0,
      officeArea: parseInt(lot.officearea) || 0,
      retailArea: parseInt(lot.retailarea) || 0,
      
      // Valuation
      assessedTotal: parseInt(lot.assesstot) || 0,
      assessedLand: parseInt(lot.assessland) || 0,
      
      // Year Built
      yearBuilt: parseInt(lot.yearbuilt) || 0,
      yearAltered1: parseInt(lot.yearalter1) || 0,
      yearAltered2: parseInt(lot.yearalter2) || 0,
      
      // Owner
      ownerName: lot.ownername,
      
      // Location
      latitude: parseFloat(lot.latitude) || 0,
      longitude: parseFloat(lot.longitude) || 0,
    };
  }
  return null;
}

// Get ACRIS records (deeds, mortgages, liens)
export async function getACRISRecords(bbl) {
  // First get document IDs linked to this BBL
  const legals = await fetchNYCOpenData(DATASETS.acrisRealPropertyLegals, {
    borough: bbl.substring(0, 1),
    block: parseInt(bbl.substring(1, 6)),
    lot: parseInt(bbl.substring(6, 10)),
    $limit: 50,
  });
  
  if (legals.length === 0) return { deeds: [], mortgages: [], liens: [] };
  
  // Get unique document IDs
  const docIds = [...new Set(legals.map(l => l.document_id))];
  
  // Fetch document details
  const documents = await fetchNYCOpenData(DATASETS.acrisRealPropertyMaster, {
    $where: `document_id in ('${docIds.slice(0, 20).join("','")}')`,
    $order: 'recorded_datetime DESC',
    $limit: 50,
  });
  
  // Categorize documents
  const deeds = [];
  const mortgages = [];
  const liens = [];
  const other = [];
  
  for (const doc of documents) {
    const record = {
      documentId: doc.document_id,
      documentType: doc.doc_type,
      documentDate: doc.document_date,
      recordedDate: doc.recorded_datetime,
      amount: parseFloat(doc.document_amt) || 0,
      crfn: doc.crfn,
      borough: doc.borough,
      // partyNames will be fetched separately if needed
    };
    
    const type = (doc.doc_type || '').toUpperCase();
    
    if (type.includes('DEED') || type.includes('RPTT')) {
      deeds.push(record);
    } else if (type.includes('MTGE') || type.includes('MORTGAGE') || type.includes('AGMT')) {
      mortgages.push(record);
    } else if (type.includes('LIEN') || type.includes('JUDGM') || type.includes('FTL')) {
      liens.push(record);
    } else {
      other.push(record);
    }
  }
  
  return { deeds, mortgages, liens, other, rawDocuments: documents };
}

// Get HPD violations
export async function getHPDViolations(bbl) {
  const data = await fetchNYCOpenData(DATASETS.hpdViolations, {
    bbl: bbl,
    $order: 'inspectiondate DESC',
    $limit: 100,
  });
  
  return data.map(v => ({
    violationId: v.violationid,
    buildingId: v.buildingid,
    bbl: v.bbl,
    address: `${v.housenumber} ${v.streetname}, ${v.boro}`,
    apartment: v.apartment,
    story: v.story,
    class: v.class,  // A, B, or C
    inspectionDate: v.inspectiondate,
    originalCertifyByDate: v.originalcertifybydate,
    currentStatus: v.currentstatus,
    currentStatusDate: v.currentstatusdate,
    novDescription: v.novdescription,
    violationStatus: v.violationstatus,
    latitude: parseFloat(v.latitude) || 0,
    longitude: parseFloat(v.longitude) || 0,
  }));
}

// Get DOB violations
export async function getDOBViolations(bbl) {
  const borough = bbl.substring(0, 1);
  const block = bbl.substring(1, 6);
  const lot = bbl.substring(6, 10);
  
  const data = await fetchNYCOpenData(DATASETS.dobViolations, {
    $where: `boro='${borough}' AND block='${block}' AND lot='${lot}'`,
    $order: 'issue_date DESC',
    $limit: 100,
  });
  
  return data.map(v => ({
    isn_dob_bis_viol: v.isn_dob_bis_viol,
    violationNumber: v.number,
    ecbNumber: v.ecb_number,
    violationType: v.violation_type,
    violationCategory: v.violation_category,
    issueDate: v.issue_date,
    dispositionDate: v.disposition_date,
    dispositionComments: v.disposition_comments,
    deviceNumber: v.device_number,
    description: v.description,
    status: v.violation_type_description,
  }));
}

// Get ECB violations
export async function getECBViolations(bbl) {
  const borough = bbl.substring(0, 1);
  const block = bbl.substring(1, 6);
  const lot = bbl.substring(6, 10);
  
  const data = await fetchNYCOpenData(DATASETS.ecbViolations, {
    $where: `boro='${borough}' AND block='${block}' AND lot='${lot}'`,
    $order: 'issue_date DESC',
    $limit: 100,
  });
  
  return data.map(v => ({
    ecbNumber: v.ecb_violation_number,
    bin: v.bin,
    issueDate: v.issue_date,
    violationType: v.violation_type,
    severity: v.severity,
    violationDescription: v.violation_description,
    penalityImposed: parseFloat(v.penality_imposed) || 0,
    amountPaid: parseFloat(v.amount_paid) || 0,
    amountBalanceDue: parseFloat(v.amount_balace_due) || 0,
    status: v.ecb_violation_status,
    hearingStatus: v.hearing_status,
    hearingDate: v.hearing_date,
  }));
}

// Get DOB permits
export async function getDOBPermits(bbl) {
  const borough = bbl.substring(0, 1);
  const block = bbl.substring(1, 6);
  const lot = bbl.substring(6, 10);
  
  const data = await fetchNYCOpenData(DATASETS.dobPermits, {
    $where: `borough='${borough}' AND block='${block}' AND lot='${lot}'`,
    $order: 'issuance_date DESC',
    $limit: 50,
  });
  
  return data.map(p => ({
    jobNumber: p.job__,
    permitNumber: p.permit_si_no,
    jobType: p.job_type,
    workType: p.work_type,
    permitStatus: p.permit_status,
    filingStatus: p.filing_status,
    issuanceDate: p.issuance_date,
    expirationDate: p.expiration_date,
    jobDescription: p.job_description,
    estimatedCost: parseFloat(p.estimated_job_cost) || 0,
    ownerName: p.owner_s_first_name ? `${p.owner_s_first_name} ${p.owner_s_last_name}` : '',
    ownerPhone: p.owner_s_phone__,
  }));
}

// Get all NYC data for a property
export async function getAllPropertyData(address) {
  // Step 1: Convert address to BBL
  const geoData = await addressToBBL(address);
  if (!geoData || !geoData.bbl) {
    return { error: 'Address not found in NYC', geoData: null };
  }
  
  const bbl = geoData.bbl;
  
  // Step 2: Fetch all data in parallel
  const [
    zoning,
    pluto,
    acris,
    hpdViolations,
    dobViolations,
    ecbViolations,
    dobPermits,
  ] = await Promise.all([
    getZoningInfo(bbl),
    getPLUTOData(bbl),
    getACRISRecords(bbl),
    getHPDViolations(bbl),
    getDOBViolations(bbl),
    getECBViolations(bbl),
    getDOBPermits(bbl),
  ]);
  
  return {
    address: geoData.address,
    bbl,
    borough: geoData.borough,
    block: geoData.block,
    lot: geoData.lot,
    coordinates: geoData.coordinates,
    bin: geoData.bin,
    
    zoning,
    pluto,
    acris,
    
    violations: {
      hpd: hpdViolations,
      dob: dobViolations,
      ecb: ecbViolations,
      totalOpen: [
        ...hpdViolations.filter(v => v.currentStatus !== 'CLOSE'),
        ...dobViolations.filter(v => !v.dispositionDate),
        ...ecbViolations.filter(v => v.status !== 'RESOLVE'),
      ].length,
    },
    
    permits: dobPermits,
  };
}

// Zoning use group helper
export function getZoningUseGroups(zoneDistrict) {
  if (!zoneDistrict) return [];
  
  const zone = zoneDistrict.toUpperCase();
  
  // Residential zones
  if (zone.startsWith('R1') || zone.startsWith('R2')) {
    return ['Use Group 1: Single-Family Detached'];
  }
  if (zone.startsWith('R3') || zone.startsWith('R4') || zone.startsWith('R5')) {
    return ['Use Group 1: Single-Family', 'Use Group 2: Multi-Family'];
  }
  if (zone.startsWith('R6') || zone.startsWith('R7') || zone.startsWith('R8') || zone.startsWith('R9') || zone.startsWith('R10')) {
    return ['Use Groups 1-4: All Residential'];
  }
  
  // Commercial zones
  if (zone.startsWith('C1') || zone.startsWith('C2')) {
    return ['Use Groups 1-6: Residential + Local Retail'];
  }
  if (zone.startsWith('C4') || zone.startsWith('C5') || zone.startsWith('C6')) {
    return ['Use Groups 1-12: Residential + Commercial'];
  }
  
  // Manufacturing zones
  if (zone.startsWith('M1')) {
    return ['Use Groups 4-14: Light Manufacturing + Commercial'];
  }
  if (zone.startsWith('M2') || zone.startsWith('M3')) {
    return ['Use Groups 6-18: Heavy Manufacturing'];
  }
  
  return ['Check NYC Zoning Resolution'];
}
