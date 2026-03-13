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
	entities: Entity[]
	baseCurrency: Currency
	currencies: Currency[]
  name: string
}

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

export type Entity = {
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
  entity: Entity
}

// --- Serialization ---

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

export function serializePortfolio(portfolio: Portfolio): string {
	return JSON.stringify(portfolio, (key, value) => {
		if (key === 'docroot') return undefined
		// Skip circular back-references: asset.entity and entity/asset currency (stored as iso)
		if (key === 'entity' && value && typeof value === 'object' && 'assets' in value) return undefined
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
	// Relink entity.currency from iso string to currency object, and asset.entity back-references
	const findCurrency = (iso: string): Currency => {
		const c = pf.currencies.find(c => c.iso === iso)
		if (c) return c
		const newC: Currency = { iso, rates: [] }
		pf.currencies.push(newC)
		return newC
	}
	for (const entity of pf.entities) {
		entity.currency = findCurrency(entity.currency as unknown as string)
		for (const asset of entity.assets) {
			asset.entity = entity
			asset.metadata ??= {}
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
  revenue: number  | null
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
  entityName: string
  country: string
  assetName: string
  type: keyof typeof AssetTypes
  currency: Currency
  invested: number | null
  divested: number | null
  startUnits: number | null
  endUnits: number | null
  netRevenueInBaseCurrency: number | null
  netInvestedInBaseCurrency: number | null
  netAssetValueInBaseCurrency: number
  valuationDate: Date | null
  irr: number | undefined
  committed: number | null
  totalInvested: number | null
  openCommitment: number | null
}