type DocumentReference = string // URL or file path

export type Currency = {
	iso: string
	rates: { date: Date; rate: number }[]
}

export type Valuation = {
	date: Date
	unitPrice: number
	doc: DocumentReference
}

export type Portfolio = {
	docroot: string
	issuers: Issuer[]
	baseCurrency: Currency
	currencies: Currency[]
  name: string
  taxHiddenColumns: string[]
}

export const reportColumnDefs: { key: keyof PortfolioReportRow; label: string }[] = [
  { key: 'issuerName', label: 'Issuer' },
  { key: 'country', label: 'Country' },
  { key: 'assetName', label: 'Asset' },
  { key: 'type', label: 'Type' },
  { key: 'invested', label: 'Invested' },
  { key: 'divested', label: 'Divested' },
  { key: 'startUnits', label: 'Units (Start)' },
  { key: 'endUnits', label: 'Units (End)' },
  { key: 'netInvestedInBaseCurrency', label: 'Net Invested (Base)' },
  { key: 'netRevenueInBaseCurrency', label: 'Net Revenue (Base)' },
  { key: 'whtInBaseCurrency', label: 'WHT (Base)' },
  { key: 'netAssetValueInBaseCurrency', label: 'NAV (Base)' },
  { key: 'irr', label: 'IRR' },
  { key: 'committed', label: 'Committed' },
  { key: 'totalInvested', label: 'Total Invested' },
  { key: 'openCommitment', label: 'Open Commitment' },
]

export const defaultTaxHiddenColumns: string[] = ['irr', 'committed', 'totalInvested', 'openCommitment']

export type Investment = {
	valuta: Date
	description: string
	units: number
	value: number
	fxrate?: number
	doc: DocumentReference
}

export type Revenue = {
	valuta: Date
	description: string
	value: number
	wht: number
	fxrate?: number
	doc: DocumentReference
}

export const AssetTypes = {
	equity: 'non-listed stock',
	preferred: 'preferred stock',
	safe: 'SAFE',
	warrant: 'warrant',
	convertible: 'convertible',
	debt: 'debt',
	bond: 'bond',
	listedequity: 'listed stock',
	fund: 'fund (LP interest)',
	other: 'other'
} as const

export const AssetTypeNames: Record<keyof typeof AssetTypes, string> = {
	equity: 'Equity',
	preferred: 'Preferred Stock',
	safe: 'SAFE',
	warrant: 'Warrant',
	convertible: 'Convertible',
	debt: 'Debt',
	bond: 'Bond',
	listedequity: 'Listed Equity',
	fund: 'Fund',
	other: 'Other'
}

export const defaultAssetType: keyof typeof AssetTypes = 'equity'

// --- Asset metadata ---

export type MetadataFieldType = 'text' | 'number' | 'percent' | 'currency' | 'date' | 'boolean'

export type MetadataFieldDef = {
	type: MetadataFieldType
	label: string
}

/** All possible metadata fields across all asset types. */
export const AssetMetadataFieldDefs: Record<string, MetadataFieldDef> = {
	// equity / preferred
	sector:           { type: 'text',     label: 'Sector' },
	foundingYear:     { type: 'number',   label: 'Founding Year' },
	ownership:        { type: 'percent',  label: 'Ownership (%)' },
	series:           { type: 'text',     label: 'Series' },
	liquidationPref:  { type: 'number',   label: 'Liquidation Preference (x)' },
	dividendRate:     { type: 'percent',  label: 'Dividend Rate (%)' },
	// safe / convertible
	valuationCap:     { type: 'currency', label: 'Valuation Cap' },
	discountRate:     { type: 'percent',  label: 'Discount Rate (%)' },
	proRataRights:    { type: 'boolean',  label: 'Pro-rata Rights' },
	// warrant
	strikePrice:      { type: 'currency', label: 'Strike Price' },
	expiryDate:       { type: 'date',     label: 'Expiry Date' },
	// convertible / debt / bond
	interestRate:     { type: 'percent',  label: 'Interest Rate (%)' },
	maturityDate:     { type: 'date',     label: 'Maturity Date' },
	seniority:        { type: 'text',     label: 'Seniority' },
	// bond / listed equity
	isin:             { type: 'text',     label: 'ISIN' },
	coupon:           { type: 'percent',  label: 'Coupon (%)' },
	ticker:           { type: 'text',     label: 'Ticker' },
	exchange:         { type: 'text',     label: 'Exchange' },
	// fund
	vintageYear:      { type: 'number',   label: 'Vintage Year' },
	strategy:         { type: 'text',     label: 'Strategy' },
	manager:          { type: 'text',     label: 'Manager' },
} as const satisfies Record<string, MetadataFieldDef>

/** Which metadata fields are relevant for each asset type (in display order). */
export const AssetTypeMetadataFields = {
	equity:      ['sector', 'ownership', 'foundingYear'],
	preferred:   ['series', 'liquidationPref', 'dividendRate', 'valuationCap'],
	safe:        ['valuationCap', 'discountRate', 'proRataRights'],
	warrant:     ['strikePrice', 'expiryDate'],
	convertible: ['valuationCap', 'discountRate', 'interestRate', 'maturityDate'],
	debt:        ['interestRate', 'maturityDate', 'seniority'],
	bond:        ['isin', 'coupon', 'maturityDate'],
	listedequity: ['isin', 'ticker', 'exchange'],
	fund:        ['vintageYear', 'strategy', 'manager'],
	other:       [],
} as const satisfies Record<keyof typeof AssetTypes, readonly string[]>

export type AssetMetadata = Partial<Record<string, string | number | boolean | null>>

export const AssetUnits = {
	shares: 'shares',
	percent: 'percent',
	amount: 'amount'
} as const

export const defaultAssetUnit: keyof typeof AssetUnits = 'shares'

export const assetUnitTitle = 'Quantity' // de: bestand, fr: quantité

export type Issuer = {
  name: string
  address: string
  country: string
  assets: Asset[]
  currency: Currency
  docfolder: DocumentReference
}
export type Asset = {
	name: string
	type: keyof typeof AssetTypes
	unit: keyof typeof AssetUnits
	investments: Investment[]
	revenues: Revenue[]
	valuations: Valuation[]
	commitments: Investment[]
	metadata: AssetMetadata
	doc: DocumentReference
  issuer: Issuer
}

// --- Serialization ---

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

export function serializePortfolio(portfolio: Portfolio): string {
	return JSON.stringify(portfolio, (key, value) => {
		if (key === 'docroot') return undefined
		// Skip circular back-references: asset.issuer and issuer/asset currency (stored as iso)
		if (key === 'issuer' && value && typeof value === 'object' && 'assets' in value) return undefined
		if (key === 'currency' && value && typeof value === 'object' && 'iso' in value) return value.iso
		return value
	}, 2)
}

export function deserializePortfolio(json: string): Portfolio {
	const pf = JSON.parse(json, (_key, value) => {
		if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
			return new Date(value)
		}
		return value
	}) as Portfolio
	// Link baseCurrency to the same object in currencies[]
	const match = pf.currencies.find(c => c.iso === pf.baseCurrency.iso)
	if (match) {
		pf.baseCurrency = match
	} else {
		pf.currencies.push(pf.baseCurrency)
	}
	// Backward compat: support old files that used 'entities' instead of 'issuers'
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pfAny = pf as any
	if (pfAny.entities && (!pf.issuers || pf.issuers.length === 0)) {
		pf.issuers = pfAny.entities
	}
	// Relink issuer.currency from iso string to currency object, and asset.issuer back-references
	const findCurrency = (iso: string): Currency => {
		const c = pf.currencies.find(c => c.iso === iso)
		if (c) return c
		const newC: Currency = { iso, rates: [] }
		pf.currencies.push(newC)
		return newC
	}
	// Fall back to defaults when missing OR empty. Older/saved files persisted an
	// empty array, which silently disabled the "Tax view" toggle (it hid nothing).
	if (!pf.taxHiddenColumns || pf.taxHiddenColumns.length === 0) {
		pf.taxHiddenColumns = [...defaultTaxHiddenColumns]
	}
	for (const issuer of pf.issuers) {
		issuer.currency = findCurrency(issuer.currency as unknown as string)
		for (const asset of issuer.assets) {
			asset.issuer = issuer
			asset.metadata ??= {}
			asset.doc ??= ''
		}
	}
	return pf
}

export const AggregateBy = {
  year: 'year',
  quarter: 'quarter',
} as const

export type AssetReport = {
  name: string
  aggregatedBy: keyof typeof AggregateBy
  type: keyof typeof AssetTypes
  unit: keyof typeof AssetUnits
  currency: Currency
  totalRow: AssetReportRow
  rows: AssetReportRow[]
}

export type AssetReportRow = {
  date: string
  invested: number | null
  divested: number | null
  revenue: number | null
  wht: number | null
  netRevenue: number | null
  cost: number | null
  startUnits: number | null
  endUnits: number | null
  return: number | null
  cumulativeReturn: number | null
  valuation: number
  valuationDate: Date | null
  netAssetValue: number
  netRevenueInBaseCurrency: number | null
  netInvestedInBaseCurrency: number | null
  netAssetValueInBaseCurrency: number
  irr: number | undefined
  commitments: number
}

export type PortfolioReport = {
  name: string
  year: number
  totalRow: PortfolioReportRow
  rows: PortfolioReportRow[]
}

export type PortfolioReportRow = {
  issuerName: string
  country: string
  assetName: string
  type: keyof typeof AssetTypes
  currency: Currency
  invested: number | null
  divested: number | null
  startUnits: number | null
  endUnits: number | null
  nav: number | null
  netRevenueInBaseCurrency: number | null
  whtInBaseCurrency: number | null
  netInvestedInBaseCurrency: number | null
  netAssetValueInBaseCurrency: number
  valuationDate: Date | null
  valuationUnitPrice: number | null
  fxRate: number | null
  irr: number | undefined
  committed: number | null
  totalInvested: number | null
  openCommitment: number | null
}