// Generates a sample portfolio file for Velfi
// Usage: cd frontend && npx tsx generate-sample.ts > ../sample.velfi

import {
  type Portfolio,
  type Entity,
  type Asset,
  type Currency,
  type Investment,
  type Revenue,
  type Valuation,
  serializePortfolio,
} from './src/lib/portfolio.ts'

// --- Helpers ---

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

function rand(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}

// --- Currencies ---

const chf: Currency = { iso: 'CHF', rates: [] }
const usd: Currency = {
  iso: 'USD',
  rates: [
    { date: d(2020, 1, 1), rate: 0.97 },
    { date: d(2021, 1, 1), rate: 0.89 },
    { date: d(2022, 1, 1), rate: 0.91 },
    { date: d(2023, 1, 1), rate: 0.92 },
    { date: d(2024, 1, 1), rate: 0.85 },
    { date: d(2025, 1, 1), rate: 0.88 },
  ],
}
const eur: Currency = {
  iso: 'EUR',
  rates: [
    { date: d(2020, 1, 1), rate: 1.08 },
    { date: d(2021, 1, 1), rate: 1.08 },
    { date: d(2022, 1, 1), rate: 1.04 },
    { date: d(2023, 1, 1), rate: 0.99 },
    { date: d(2024, 1, 1), rate: 0.94 },
    { date: d(2025, 1, 1), rate: 0.95 },
  ],
}

const currencies = [chf, usd, eur]

function currencyByIso(iso: string): Currency {
  return currencies.find(c => c.iso === iso)!
}

function fxRateForYear(currency: Currency, year: number): number {
  let rate = 1
  for (const r of currency.rates) {
    if (r.date.getFullYear() <= year) rate = r.rate
  }
  return rate
}

// --- Generators ---

function makeInvestments(type: Asset['type'], currency: Currency, startYear: number): Investment[] {
  const investments: Investment[] = []
  const count = randInt(1, 10)
  const basePrice = type === 'debt' ? 100 : rand(5, 50)
  const growth = type === 'debt' ? 0 : rand(0.02, 0.15)
  const isForeign = currency.iso !== 'CHF'

  for (let i = 0; i < count; i++) {
    const year = startYear + Math.floor((i * (2026 - startYear)) / count)
    if (year > 2025) break
    const month = randInt(1, 12)
    const day = randInt(1, 28)
    const yearsElapsed = year - startYear
    const price =
      type === 'debt' ? 100 : Math.round(basePrice * Math.pow(1 + growth, yearsElapsed) * 100) / 100
    const units = type === 'debt' ? rand(50000, 500000) : randInt(10, 500)
    const value = Math.round(units * price * 100) / 100

    investments.push({
      valuta: d(year, month, day),
      description: i === 0 ? 'Initial investment' : `Follow-on investment ${i}`,
      units: -units,
      value: -value,
      ...(isForeign ? { fxrate: fxRateForYear(currency, year) } : {}),
      doc: '',
    })
  }
  return investments
}

function makeRevenues(
  type: Asset['type'],
  currency: Currency,
  investments: Investment[]
): Revenue[] {
  const revenues: Revenue[] = []
  if (investments.length === 0) return revenues

  const firstYear = investments[0].valuta.getFullYear()
  const revenueType = type === 'debt' ? 'Interest payment' : 'Dividend'
  const totalInvested = investments.reduce((s, inv) => s + Math.abs(inv.value), 0)
  const yieldRate = type === 'debt' ? rand(0.03, 0.07) : rand(0.01, 0.04)
  const isForeign = currency.iso !== 'CHF'

  for (let year = firstYear + 1; year <= 2025; year++) {
    if (Math.random() < 0.3) continue
    const amount = Math.round(totalInvested * yieldRate * 100) / 100
    revenues.push({
      valuta: d(year, type === 'debt' ? 6 : randInt(3, 9), 15),
      description: `${revenueType} ${year}`,
      value: amount,
      ...(isForeign ? { fxrate: fxRateForYear(currency, year) } : {}),
      doc: '',
    })
  }
  return revenues
}

function makeValuations(type: Asset['type'], investments: Investment[]): Valuation[] {
  if (type === 'debt' || investments.length === 0) return []
  const valuations: Valuation[] = []
  const firstYear = investments[0].valuta.getFullYear()
  const firstPrice = Math.abs(investments[0].value / investments[0].units)
  const annualGrowth = rand(0.03, 0.12)

  for (let year = firstYear; year <= 2025; year++) {
    const elapsed = year - firstYear
    const unitPrice = Math.round(firstPrice * Math.pow(1 + annualGrowth, elapsed) * 100) / 100
    valuations.push({
      date: d(year, 12, 31),
      unitPrice,
      doc: '',
    })
  }
  return valuations
}

function makeCommitments(currency: Currency, startYear: number): Investment[] {
  if (Math.random() < 0.6) return []
  const amount = rand(100000, 1000000)
  const isForeign = currency.iso !== 'CHF'
  return [
    {
      valuta: d(startYear, 1, 15),
      description: 'Capital commitment',
      units: 0,
      value: amount,
      ...(isForeign ? { fxrate: fxRateForYear(currency, startYear) } : {}),
      doc: '',
    },
  ]
}

// --- Entity & Asset definitions ---

const entityDefs: { name: string; address: string; country: string; currencyIso: string }[] = [
  { name: 'Alpine Ventures AG', address: 'Bahnhofstrasse 42\n8001 Zurich', country: 'CH', currencyIso: 'CHF' },
  { name: 'Rhine Capital GmbH', address: 'Friedrichstrasse 100\n10117 Berlin', country: 'DE', currencyIso: 'EUR' },
  { name: 'Lakeside Partners SA', address: 'Rue du Rhône 8\n1204 Geneva', country: 'CH', currencyIso: 'CHF' },
  { name: 'Atlantic Growth Fund LP', address: '350 Park Avenue\nNew York, NY 10022', country: 'US', currencyIso: 'USD' },
  { name: 'Nordic Bridge AB', address: 'Strandvägen 7\n114 56 Stockholm', country: 'SE', currencyIso: 'EUR' },
  { name: 'Helvetia Credit Corp', address: 'Bundesplatz 3\n3003 Bern', country: 'CH', currencyIso: 'CHF' },
  { name: 'Pacific Rim Holdings', address: '1 Market Street\nSan Francisco, CA 94105', country: 'US', currencyIso: 'USD' },
  { name: 'Central Europe Fund SCA', address: 'Boulevard Royal 26\nL-2449 Luxembourg', country: 'LU', currencyIso: 'EUR' },
  { name: 'Midland Equity Partners', address: 'One Cabot Square\nLondon E14 4QJ', country: 'GB', currencyIso: 'EUR' },
  { name: 'Summit Infrastructure AG', address: 'Industriestrasse 25\n6300 Zug', country: 'CH', currencyIso: 'CHF' },
]

const assetDefs: { name: string; type: Asset['type']; unit: Asset['unit'] }[][] = [
  [
    { name: 'TechVentures Fund I', type: 'equity', unit: 'shares' },
    { name: 'Alpine Innovation Convertible', type: 'convertible', unit: 'shares' },
  ],
  [
    { name: 'Rhine Senior Secured Bond', type: 'debt', unit: 'amount' },
    { name: 'German Mittelstand Equity', type: 'equity', unit: 'shares' },
    { name: 'Rhine Mezzanine Note', type: 'convertible', unit: 'amount' },
  ],
  [
    { name: 'Lakeside Growth Equity II', type: 'equity', unit: 'shares' },
    { name: 'Swiss RE Bond 2021', type: 'debt', unit: 'amount' },
  ],
  [
    { name: 'US Tech Growth Fund', type: 'equity', unit: 'shares' },
    { name: 'Atlantic Convertible Note 2022', type: 'convertible', unit: 'shares' },
    { name: 'High Yield Credit Fund', type: 'debt', unit: 'amount' },
  ],
  [{ name: 'Nordic Green Energy Equity', type: 'equity', unit: 'shares' }],
  [
    { name: 'Swiss Corporate Bond Fund', type: 'debt', unit: 'amount' },
    { name: 'Helvetia Balanced Convertible', type: 'convertible', unit: 'shares' },
  ],
  [{ name: 'Pacific Healthcare Equity', type: 'equity', unit: 'shares' }],
  [
    { name: 'CEE Infrastructure Debt', type: 'debt', unit: 'amount' },
    { name: 'Central Europe Growth Equity', type: 'equity', unit: 'percent' },
  ],
  [
    { name: 'UK Property Equity Fund', type: 'equity', unit: 'shares' },
    { name: 'European Convertible Bond', type: 'convertible', unit: 'amount' },
  ],
  [{ name: 'Swiss Infra Senior Debt', type: 'debt', unit: 'amount' }],
]

// --- Build portfolio ---

const entities: Entity[] = entityDefs.map((eDef, eIdx) => {
  const currency = currencyByIso(eDef.currencyIso)
  const entity: Entity = {
    name: eDef.name,
    address: eDef.address,
    country: eDef.country,
    docfolder: '',
    assets: [],
    currency,
  }

  for (const aDef of assetDefs[eIdx]) {
    const startYear = randInt(2020, 2022)
    const investments = makeInvestments(aDef.type, currency, startYear)
    const revenues = makeRevenues(aDef.type, currency, investments)
    const valuations = makeValuations(aDef.type, investments)
    const commitments = makeCommitments(currency, startYear)

    const asset: Asset = {
      name: aDef.name,
      type: aDef.type,
      unit: aDef.unit,
      entity,
      investments,
      revenues,
      valuations,
      commitments,
    }
    entity.assets.push(asset)
  }

  return entity
})

const portfolio: Portfolio = {
  docroot: '',
  name: 'Sample Portfolio',
  entities,
  baseCurrency: chf,
  currencies,
}

console.log(serializePortfolio(portfolio))
