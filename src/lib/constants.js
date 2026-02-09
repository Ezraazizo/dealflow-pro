export const STAGES = ['Sourcing', 'LOI', 'Due Diligence', 'Contract', 'Closing'];

export const STATUSES = [
  { id: 'prospective', label: 'Prospective', color: '#6366f1', bg: '#eef2ff' },
  { id: 'hot', label: 'Hot', color: '#dc2626', bg: '#fef2f2' },
  { id: 'warm', label: 'Warm', color: '#ea580c', bg: '#fff7ed' },
  { id: 'cold', label: 'Cold', color: '#2563eb', bg: '#eff6ff' },
  { id: 'on_hold', label: 'On Hold', color: '#71717a', bg: '#f4f4f5' },
  { id: 'about_to_close', label: 'About to Close', color: '#059669', bg: '#ecfdf5' },
  { id: 'dead', label: 'Dead / Passed', color: '#991b1b', bg: '#fef2f2' },
  { id: 'closed_won', label: 'Closed / Won', color: '#166534', bg: '#f0fdf4' },
];

export const DEAL_TYPES = ['Acquisition', 'Development / Ground-Up'];

export const CONTACT_ROLES = [
  'Broker',
  'Attorney',
  'Lender / Mortgage Broker',
  'Title Company',
  'Property Manager',
  'Investor / Partner',
  'Government (HPD, DOB, DOF)',
];

export const ACQUISITION_CHECKLIST = [
  'Property identified & initial research',
  'Broker contacted / NDA signed',
  'Rent roll & financials received',
  'Preliminary underwriting complete',
  'Site visit scheduled / completed',
  'LOI drafted & submitted',
  'LOI executed',
  'Environmental report ordered',
  'Title search initiated',
  'Appraisal ordered',
  'Loan application submitted',
  'Insurance quotes obtained',
  'PSA reviewed by attorney',
  'PSA executed',
  'Deposit wired to escrow',
  'Final walkthrough complete',
  'Clear to close',
  'Closing scheduled & completed',
];

export const DEVELOPMENT_CHECKLIST = [
  'Site identified & zoning verified',
  'Feasibility study complete',
  'Architect / engineer engaged',
  'Preliminary plans & budget',
  'LOI / contract for land acquisition',
  'Environmental & geotechnical reports',
  'DOB filings & permits submitted',
  'Construction financing secured',
  'GC bids received & contract signed',
  'Foundation / excavation permit',
  'Construction commencement',
  'TCO / CO obtained',
  'Punchlist & final inspections',
  'Permanent financing in place',
];

export const statusOf = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];
