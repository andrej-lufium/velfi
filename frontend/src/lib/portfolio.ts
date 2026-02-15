type DocumentReference = string // URL or file path

export type Currency = {
	iso: string
	rates: { date: Date; rate: number }[]
}

export type Valuation = {
	date: string // ISO 8601 date string
	currency: Currency
	amount: number
	documents: DocumentReference[]
}

export type Portfolio = {
	assets: Asset[]
	baseCurrency: Currency
	currencies: Currency[]
}

export type Investment = {
	valuta: Date
	description: string
	amount: number
	value: number
	reference: DocumentReference
}

export type Revenue = {
	valuta: Date
	description: string
	value: number
	reference: DocumentReference
}

export const AssetTypes = {
	debt: 'debt',
	equity: 'equity',
	convertible: 'convertible',
	other: 'other'
} as const

export const defaultAssetType: keyof typeof AssetTypes = 'equity'

export const AssetUnits = {
	shares: 'shares',
	percent: 'percent',
	amount: 'amount'
} as const

export const defaultAssetUnit: keyof typeof AssetUnits = 'shares'

export type Asset = {
	name: string
	type: keyof typeof AssetTypes
	unit: keyof typeof AssetUnits
	currency: Currency
	documentFolder: DocumentReference
	investments: Investment[]
	revenues: Revenue[]
	valuations: Valuation[]
	commitments: Investment[]
}

// --- Portfolio functions ---

export function addAsset(portfolio: Portfolio, asset: Asset): Asset {
	portfolio.assets.push(asset)
	return asset
}

export function deleteAsset(portfolio: Portfolio, index: number): boolean {
	if (index < 0 || index >= portfolio.assets.length) return false
	portfolio.assets.splice(index, 1)
	return true
}

export function addCurrency(portfolio: Portfolio, currency: Currency): void {
	portfolio.currencies.push(currency)
}

export function deleteCurrency(portfolio: Portfolio, iso: string): boolean {
	const index = portfolio.currencies.findIndex((c) => c.iso === iso)
	if (index === -1) return false
	portfolio.currencies.splice(index, 1)
	return true
}

// --- Currency functions ---

export function addRate(currency: Currency, date: Date, rate: number): void {
	currency.rates.push({ date, rate })
}

export function deleteRate(currency: Currency, index: number): boolean {
	if (index < 0 || index >= currency.rates.length) return false
	currency.rates.splice(index, 1)
	return true
}

// --- Asset functions ---

export function addInvestment(asset: Asset, investment: Investment): void {
	asset.investments.push(investment)
}

export function deleteInvestment(asset: Asset, index: number): boolean {
	if (index < 0 || index >= asset.investments.length) return false
	asset.investments.splice(index, 1)
	return true
}

export function addRevenue(asset: Asset, revenue: Revenue): void {
	asset.revenues.push(revenue)
}

export function deleteRevenue(asset: Asset, index: number): boolean {
	if (index < 0 || index >= asset.revenues.length) return false
	asset.revenues.splice(index, 1)
	return true
}

export function addCommitment(asset: Asset, commitment: Investment): void {
	asset.commitments.push(commitment)
}

export function deleteCommitment(asset: Asset, index: number): boolean {
	if (index < 0 || index >= asset.commitments.length) return false
	asset.commitments.splice(index, 1)
	return true
}

// --- Serialization ---

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

export function serializePortfolio(portfolio: Portfolio): string {
	return JSON.stringify(portfolio, null, 2)
}

export function deserializePortfolio(json: string): Portfolio {
	return JSON.parse(json, (_key, value) => {
		if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
			return new Date(value)
		}
		return value
	}) as Portfolio
}
