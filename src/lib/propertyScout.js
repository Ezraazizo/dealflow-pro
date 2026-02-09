// PropertyScout.io API Service
// Docs: https://docs.propertyscout.io
// Get API key: https://app.propertyscout.io/register/trial-api-user

const PROPERTYSCOUT_BASE = 'https://api.propertyscout.io/v1';

// Get API key from environment or localStorage
const getApiKey = () => {
  // Check localStorage first (for user-provided key)
  if (typeof window !== 'undefined') {
    const key = localStorage.getItem('propertyscout_api_key');
    if (key) return key;
  }
  // Fall back to env var
  return import.meta.env.VITE_PROPERTYSCOUT_API_KEY || null;
};

// Save API key to localStorage
export const setPropertyScoutApiKey = (key) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('propertyscout_api_key', key);
  }
};

// Check if API key is configured
export const hasPropertyScoutApiKey = () => {
  return !!getApiKey();
};

// Generic fetch wrapper
async function fetchPropertyScout(endpoint, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('PropertyScout API key not configured');
  }

  const url = new URL(`${PROPERTYSCOUT_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PropertyScout API error:', error);
    throw error;
  }
}

// Search property by address
export async function searchPropertyByAddress(address) {
  const data = await fetchPropertyScout('/property/search', {
    address: address,
  });
  return data;
}

// Get property details by APN (Assessor's Parcel Number)
export async function getPropertyByAPN(apn, state, county) {
  const data = await fetchPropertyScout('/property/apn', {
    apn: apn,
    state: state,
    county: county,
  });
  return data;
}

// Get owner information for a property
export async function getOwnerInfo(address) {
  const data = await fetchPropertyScout('/property/owner', {
    address: address,
  });
  
  if (data) {
    return {
      ownerName: data.owner_name || data.ownerName,
      ownerType: data.owner_type || data.ownerType, // Individual, Corporation, Trust, etc.
      mailingAddress: {
        street: data.mailing_address?.street || data.mailingStreet,
        city: data.mailing_address?.city || data.mailingCity,
        state: data.mailing_address?.state || data.mailingState,
        zip: data.mailing_address?.zip || data.mailingZip,
      },
      ownerOccupied: data.owner_occupied || data.ownerOccupied,
      acquisitionDate: data.acquisition_date || data.acquisitionDate,
      otherPropertiesOwned: data.other_properties || data.otherProperties || [],
    };
  }
  return null;
}

// Get Rapid Insights Report (comprehensive property data)
export async function getRapidInsightsReport(address) {
  const data = await fetchPropertyScout('/property/rapid-insights', {
    address: address,
  });

  if (data) {
    return {
      // Parcel Info
      parcel: {
        apn: data.apn,
        fips: data.fips,
        county: data.county,
        state: data.state,
      },
      
      // Address
      address: {
        street: data.address?.street || data.street,
        city: data.address?.city || data.city,
        state: data.address?.state || data.state,
        zip: data.address?.zip || data.zip,
        formatted: data.formatted_address || data.formattedAddress,
      },
      
      // Owner
      owner: {
        name: data.owner_name || data.ownerName,
        type: data.owner_type || data.ownerType,
        mailingAddress: data.mailing_address || data.mailingAddress,
        ownerOccupied: data.owner_occupied || data.ownerOccupied,
      },
      
      // Property Details
      property: {
        propertyType: data.property_type || data.propertyType,
        yearBuilt: data.year_built || data.yearBuilt,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        squareFeet: data.square_feet || data.squareFeet,
        lotSize: data.lot_size || data.lotSize,
        stories: data.stories,
        units: data.units,
        zoning: data.zoning,
      },
      
      // Tax Info
      tax: {
        assessedValue: data.assessed_value || data.assessedValue,
        assessedLand: data.assessed_land || data.assessedLand,
        assessedImprovement: data.assessed_improvement || data.assessedImprovement,
        taxAmount: data.tax_amount || data.taxAmount,
        taxYear: data.tax_year || data.taxYear,
      },
      
      // Valuation
      valuation: {
        estimatedValue: data.estimated_value || data.estimatedValue || data.avm,
        estimatedEquity: data.estimated_equity || data.estimatedEquity,
        pricePerSqFt: data.price_per_sqft || data.pricePerSqFt,
      },
      
      // Sales History
      salesHistory: (data.sales_history || data.salesHistory || []).map(sale => ({
        date: sale.date || sale.saleDate,
        price: sale.price || sale.salePrice,
        buyer: sale.buyer,
        seller: sale.seller,
        documentType: sale.document_type || sale.documentType,
      })),
      
      // Mortgage Info
      mortgage: {
        lender: data.mortgage?.lender || data.mortgageLender,
        amount: data.mortgage?.amount || data.mortgageAmount,
        date: data.mortgage?.date || data.mortgageDate,
        type: data.mortgage?.type || data.mortgageType,
        rate: data.mortgage?.rate || data.mortgageRate,
        term: data.mortgage?.term || data.mortgageTerm,
      },
      
      // Raw data for debugging
      raw: data,
    };
  }
  return null;
}

// Get sales history / chain of title
export async function getSalesHistory(address) {
  const data = await fetchPropertyScout('/property/sales-history', {
    address: address,
  });

  if (data && data.sales) {
    return data.sales.map(sale => ({
      date: sale.date || sale.sale_date,
      price: sale.price || sale.sale_price,
      pricePerSqFt: sale.price_per_sqft,
      buyer: sale.buyer || sale.grantee,
      seller: sale.seller || sale.grantor,
      documentType: sale.document_type,
      documentNumber: sale.document_number,
      titleCompany: sale.title_company,
    }));
  }
  return [];
}

// Get liens on property
export async function getLiens(address) {
  const data = await fetchPropertyScout('/property/liens', {
    address: address,
  });

  if (data && data.liens) {
    return data.liens.map(lien => ({
      type: lien.type || lien.lien_type,
      amount: lien.amount,
      date: lien.date || lien.filed_date,
      creditor: lien.creditor || lien.lienor,
      status: lien.status,
      releaseDate: lien.release_date,
      documentNumber: lien.document_number,
    }));
  }
  return [];
}

// Get mortgage info
export async function getMortgageInfo(address) {
  const data = await fetchPropertyScout('/property/mortgage', {
    address: address,
  });

  if (data) {
    return {
      currentMortgage: data.current_mortgage ? {
        lender: data.current_mortgage.lender,
        amount: data.current_mortgage.amount,
        date: data.current_mortgage.date,
        type: data.current_mortgage.type,
        rate: data.current_mortgage.rate,
        term: data.current_mortgage.term,
        maturityDate: data.current_mortgage.maturity_date,
        estimatedBalance: data.current_mortgage.estimated_balance,
      } : null,
      mortgageHistory: (data.mortgage_history || []).map(m => ({
        lender: m.lender,
        amount: m.amount,
        date: m.date,
        type: m.type,
        status: m.status,
      })),
      estimatedEquity: data.estimated_equity,
      ltv: data.ltv,
      cltv: data.cltv,
    };
  }
  return null;
}

// Get preliminary title report (PDF)
export async function getPreliminaryTitleReport(address) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('PropertyScout API key not configured');
  }

  const url = new URL(`${PROPERTYSCOUT_BASE}/property/title-report`);
  url.searchParams.append('address', address);
  url.searchParams.append('format', 'pdf');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get title report');
  }

  // Return blob for PDF download
  return await response.blob();
}

// Download title report as PDF
export async function downloadTitleReport(address, filename = 'title-report.pdf') {
  const blob = await getPreliminaryTitleReport(address);
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Get all PropertyScout data for a property (comprehensive)
export async function getAllPropertyScoutData(address) {
  try {
    const [rapidInsights, salesHistory, liens, mortgage] = await Promise.allSettled([
      getRapidInsightsReport(address),
      getSalesHistory(address),
      getLiens(address),
      getMortgageInfo(address),
    ]);

    return {
      success: true,
      address: address,
      rapidInsights: rapidInsights.status === 'fulfilled' ? rapidInsights.value : null,
      salesHistory: salesHistory.status === 'fulfilled' ? salesHistory.value : [],
      liens: liens.status === 'fulfilled' ? liens.value : [],
      mortgage: mortgage.status === 'fulfilled' ? mortgage.value : null,
      errors: [
        rapidInsights.status === 'rejected' ? rapidInsights.reason?.message : null,
        salesHistory.status === 'rejected' ? salesHistory.reason?.message : null,
        liens.status === 'rejected' ? liens.reason?.message : null,
        mortgage.status === 'rejected' ? mortgage.reason?.message : null,
      ].filter(Boolean),
    };
  } catch (error) {
    return {
      success: false,
      address: address,
      error: error.message,
    };
  }
}
