import { useState, useMemo } from 'react';
import { Calculator, DollarSign, Percent, TrendingUp, Building } from 'lucide-react';

export default function UnderwritingCalculator({ theme }) {
  const [inputs, setInputs] = useState({
    purchasePrice: 3000000,
    units: 8,
    avgRent: 2000,
    vacancyRate: 5,
    opexRatio: 35,
    ltv: 75,
    rate: 6.5,
    amortization: 30,
    holdPeriod: 5,
    exitCapRate: 6.5,
  });

  const calc = useMemo(() => {
    const gpi = inputs.units * inputs.avgRent * 12;
    const vacancy = gpi * (inputs.vacancyRate / 100);
    const egi = gpi - vacancy;
    const opex = egi * (inputs.opexRatio / 100);
    const noi = egi - opex;
    const capRate = inputs.purchasePrice > 0 ? (noi / inputs.purchasePrice) * 100 : 0;

    const loanAmount = inputs.purchasePrice * (inputs.ltv / 100);
    const equity = inputs.purchasePrice - loanAmount;
    const monthlyRate = (inputs.rate / 100) / 12;
    const numPayments = inputs.amortization * 12;
    const monthlyPayment = loanAmount > 0 && monthlyRate > 0 
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;
    const annualDebtService = monthlyPayment * 12;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
    const cashFlow = noi - annualDebtService;
    const cashOnCash = equity > 0 ? (cashFlow / equity) * 100 : 0;

    const exitValue = inputs.exitCapRate > 0 
      ? noi * Math.pow(1 + 0.02, inputs.holdPeriod) / (inputs.exitCapRate / 100)
      : 0;
    let remainingLoan = loanAmount;
    for (let i = 0; i < inputs.holdPeriod * 12 && monthlyRate > 0; i++) {
      const interest = remainingLoan * monthlyRate;
      const principal = monthlyPayment - interest;
      remainingLoan -= principal;
    }
    const netProceeds = exitValue - Math.max(0, remainingLoan);
    const equityMultiple = equity > 0 ? (netProceeds + (cashFlow * inputs.holdPeriod)) / equity : 0;
    const irr = inputs.holdPeriod > 0 ? (Math.pow(Math.max(0.01, equityMultiple), 1 / inputs.holdPeriod) - 1) * 100 : 0;

    return { gpi, vacancy, egi, opex, noi, capRate, loanAmount, equity, annualDebtService, dscr, cashFlow, cashOnCash, exitValue, equityMultiple, irr };
  }, [inputs]);

  const update = (k, v) => setInputs((p) => ({ ...p, [k]: parseFloat(v) || 0 }));

  const fmt = (n) => {
    if (!n && n !== 0) return '$0';
    if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (Math.abs(n) >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n.toLocaleString();
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
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: theme.textSecondary,
    marginBottom: 6,
    display: 'block',
  };

  const sectionStyle = {
    background: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: 14,
    padding: 24,
    marginBottom: 20,
  };

  const sectionTitleStyle = {
    fontSize: 14,
    fontWeight: 600,
    color: theme.accent,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: `${theme.accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent,
        }}>
          <Calculator size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Underwriting Calculator</h2>
          <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>Analyze deal returns and financing</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Inputs Column */}
        <div>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}><Building size={18} /> Acquisition</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Purchase Price</label>
                <input style={inputStyle} type="number" value={inputs.purchasePrice} onChange={(e) => update('purchasePrice', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Units</label>
                <input style={inputStyle} type="number" value={inputs.units} onChange={(e) => update('units', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Avg Rent / Unit</label>
                <input style={inputStyle} type="number" value={inputs.avgRent} onChange={(e) => update('avgRent', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Vacancy %</label>
                <input style={inputStyle} type="number" value={inputs.vacancyRate} onChange={(e) => update('vacancyRate', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Operating Expense Ratio %</label>
                <input style={inputStyle} type="number" value={inputs.opexRatio} onChange={(e) => update('opexRatio', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}><DollarSign size={18} /> Financing</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>LTV %</label>
                <input style={inputStyle} type="number" value={inputs.ltv} onChange={(e) => update('ltv', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Interest Rate %</label>
                <input style={inputStyle} type="number" step="0.125" value={inputs.rate} onChange={(e) => update('rate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Amort (yrs)</label>
                <input style={inputStyle} type="number" value={inputs.amortization} onChange={(e) => update('amortization', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}><TrendingUp size={18} /> Exit Assumptions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Hold Period (yrs)</label>
                <input style={inputStyle} type="number" value={inputs.holdPeriod} onChange={(e) => update('holdPeriod', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Exit Cap Rate %</label>
                <input style={inputStyle} type="number" step="0.25" value={inputs.exitCapRate} onChange={(e) => update('exitCapRate', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div>
          <div style={{ ...sectionStyle, background: theme.bgElevated }}>
            <div style={sectionTitleStyle}><Percent size={18} /> Key Returns</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Cap Rate', value: calc.capRate.toFixed(2) + '%', color: theme.accent },
                { label: 'Cash-on-Cash', value: calc.cashOnCash.toFixed(2) + '%', color: calc.cashOnCash > 8 ? '#059669' : theme.text },
                { label: 'IRR', value: calc.irr.toFixed(1) + '%', color: calc.irr > 12 ? '#059669' : theme.text },
              ].map((item, i) => (
                <div key={i} style={{ background: theme.bgCard, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: item.color, marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Equity Multiple', value: calc.equityMultiple.toFixed(2) + 'x' },
                { label: 'DSCR', value: calc.dscr.toFixed(2) + 'x', color: calc.dscr >= 1.25 ? '#059669' : '#dc2626' },
              ].map((item, i) => (
                <div key={i} style={{ background: theme.bgCard, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: item.color || theme.text, marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Income Summary</div>
            {[
              ['Gross Potential Income', fmt(calc.gpi)],
              ['Less: Vacancy', `(${fmt(calc.vacancy)})`],
              ['Effective Gross Income', fmt(calc.egi)],
              ['Less: Operating Expenses', `(${fmt(calc.opex)})`],
            ].map(([label, val], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? `1px solid ${theme.border}` : 'none' }}>
                <span style={{ color: theme.textSecondary, fontSize: 14 }}>{label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', borderTop: `2px solid ${theme.accent}`, marginTop: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Net Operating Income</span>
              <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theme.accent, fontSize: 16 }}>{fmt(calc.noi)}</span>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Financing Summary</div>
            {[
              ['Loan Amount', fmt(calc.loanAmount)],
              ['Equity Required', fmt(calc.equity)],
              ['Annual Debt Service', fmt(calc.annualDebtService)],
              ['Annual Cash Flow', fmt(calc.cashFlow)],
            ].map(([label, val], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? `1px solid ${theme.border}` : 'none' }}>
                <span style={{ color: theme.textSecondary, fontSize: 14 }}>{label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
