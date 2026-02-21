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
	convertible: 'convertible',
	debt: 'debt',
	listedequity: 'listed stock',
	other: 'other'
} as const

export const AssetTypeNames: Record<keyof typeof AssetTypes, string> = {
	debt: 'Debt',
	equity: 'Equity',
	convertible: 'Convertible',
	listedequity: 'Listed Equity',
	other: 'Other'
}

export const defaultAssetType: keyof typeof AssetTypes = 'equity'

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