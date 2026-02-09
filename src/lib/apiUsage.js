// API Usage Tracker & Caching System
// Tracks PropertyScout API calls and caches results to avoid repeat lookups

const CACHE_PREFIX = 'ps_cache_';
const USAGE_KEY = 'propertyscout_usage';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// ─── Usage Tracking ────────────────────────────────────────

export function getUsageStats() {
  const stored = localStorage.getItem(USAGE_KEY);
  if (!stored) {
    return initializeUsage();
  }
  
  const usage = JSON.parse(stored);
  
  // Reset if it's a new month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
  if (usage.month !== currentMonth) {
    return initializeUsage();
  }
  
  return usage;
}

function initializeUsage() {
  const now = new Date();
  const usage = {
    month: `${now.getFullYear()}-${now.getMonth()}`,
    monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    totalCalls: 0,
    cachedHits: 0,
    byEndpoint: {},
    byDate: {},
    lastReset: now.toISOString(),
  };
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  return usage;
}

export function trackApiCall(endpoint, cached = false) {
  const usage = getUsageStats();
  const today = new Date().toISOString().split('T')[0];
  
  if (cached) {
    usage.cachedHits++;
  } else {
    usage.totalCalls++;
  }
  
  // Track by endpoint
  if (!usage.byEndpoint[endpoint]) {
    usage.byEndpoint[endpoint] = { calls: 0, cached: 0 };
  }
  if (cached) {
    usage.byEndpoint[endpoint].cached++;
  } else {
    usage.byEndpoint[endpoint].calls++;
  }
  
  // Track by date
  if (!usage.byDate[today]) {
    usage.byDate[today] = { calls: 0, cached: 0 };
  }
  if (cached) {
    usage.byDate[today].cached++;
  } else {
    usage.byDate[today].calls++;
  }
  
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  return usage;
}

export function getUsageSummary() {
  const usage = getUsageStats();
  const today = new Date().toISOString().split('T')[0];
  
  return {
    month: usage.monthName,
    totalCalls: usage.totalCalls,
    cachedHits: usage.cachedHits,
    todayCalls: usage.byDate[today]?.calls || 0,
    todayCached: usage.byDate[today]?.cached || 0,
    savingsPercent: usage.totalCalls + usage.cachedHits > 0 
      ? Math.round((usage.cachedHits / (usage.totalCalls + usage.cachedHits)) * 100) 
      : 0,
    byEndpoint: usage.byEndpoint,
  };
}

// ─── Caching ───────────────────────────────────────────────

function getCacheKey(type, identifier) {
  return `${CACHE_PREFIX}${type}_${identifier}`;
}

export function getCached(type, identifier) {
  const key = getCacheKey(type, identifier);
  const stored = localStorage.getItem(key);
  
  if (!stored) return null;
  
  try {
    const { data, timestamp } = JSON.parse(stored);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function setCache(type, identifier, data) {
  const key = getCacheKey(type, identifier);
  const cacheEntry = {
    data,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (e) {
    // If localStorage is full, clear old cache entries
    if (e.name === 'QuotaExceededError') {
      clearOldCache();
      try {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
      } catch {
        // Still failed, ignore
      }
    }
  }
}

export function clearCache(type = null) {
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      if (!type || key.startsWith(`${CACHE_PREFIX}${type}_`)) {
        localStorage.removeItem(key);
      }
    }
  });
}

function clearOldCache() {
  const keys = Object.keys(localStorage);
  const now = Date.now();
  
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(key));
        if (now - timestamp > CACHE_DURATION) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
}

export function getCacheStats() {
  const keys = Object.keys(localStorage);
  let totalEntries = 0;
  let totalSize = 0;
  const byType = {};
  
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      totalEntries++;
      const value = localStorage.getItem(key);
      totalSize += value.length;
      
      const type = key.replace(CACHE_PREFIX, '').split('_')[0];
      byType[type] = (byType[type] || 0) + 1;
    }
  });
  
  return {
    totalEntries,
    totalSizeKB: Math.round(totalSize / 1024),
    byType,
  };
}

// ─── Wrapped API Fetch with Caching ────────────────────────

export async function cachedFetch(type, identifier, fetchFn) {
  // Check cache first
  const cached = getCached(type, identifier);
  if (cached) {
    trackApiCall(type, true);
    return { data: cached, fromCache: true };
  }
  
  // Not in cache, make API call
  try {
    const data = await fetchFn();
    
    // Cache the result
    setCache(type, identifier, data);
    trackApiCall(type, false);
    
    return { data, fromCache: false };
  } catch (error) {
    trackApiCall(type, false);
    throw error;
  }
}

// ─── Export Usage Dashboard Component ──────────────────────

export function UsageDashboard({ theme }) {
  const summary = getUsageSummary();
  const cacheStats = getCacheStats();
  
  const cardStyle = {
    background: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 16,
  };
  
  return (
    <div>
      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>API Usage - {summary.month}</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: theme.accent }}>{summary.totalCalls}</div>
          <div style={{ fontSize: 11, color: theme.textDim }}>API Calls</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>{summary.cachedHits}</div>
          <div style={{ fontSize: 11, color: theme.textDim }}>Cache Hits</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{summary.savingsPercent}%</div>
          <div style={{ fontSize: 11, color: theme.textDim }}>Savings</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>{summary.todayCalls}</div>
          <div style={{ fontSize: 11, color: theme.textDim }}>Today</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...cardStyle, flex: 1 }}>
          <h5 style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 12 }}>Cache Status</h5>
          <div style={{ fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Entries:</span>
              <span style={{ fontWeight: 600 }}>{cacheStats.totalEntries}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Size:</span>
              <span style={{ fontWeight: 600 }}>{cacheStats.totalSizeKB} KB</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => { clearCache(); window.location.reload(); }}
          style={{ padding: '12px 20px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, fontSize: 13, color: '#dc2626', cursor: 'pointer' }}
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}
