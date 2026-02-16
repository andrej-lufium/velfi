import type { Asset, AssetReport, AssetReportRow, Entity, Portfolio, PortfolioReport, PortfolioReportRow } from "./portfolio"
import type { AggregateBy } from "./portfolio"

function quarter(month: number): number {
	return Math.ceil(month / 3)
}

function roundDate(date: Date, aggregateBy: keyof typeof AggregateBy): string {
	const y = date.getFullYear()
	if (aggregateBy === 'year') return `${y}`
	return `${y}-Q${quarter(date.getMonth() + 1)}`
}

/** Returns the last day of the period as a Date */
function periodEndDate(dateKey: string, aggregateBy: keyof typeof AggregateBy): Date {
	if (aggregateBy === 'year') {
		return new Date(Number(dateKey), 11, 31)
	}
	// quarter: "2024-Q2" -> end of June
	const [yStr, qStr] = dateKey.split('-Q')
	const q = Number(qStr)
	const y = Number(yStr)
	const endMonth = q * 3 // 1-based month after quarter end
	return new Date(y, endMonth, 0) // day 0 of next month = last day of endMonth
}

function emptyRow(date: string): AssetReportRow {
	return {
		date,
		invested: null,
		divested: null,
		revenue: null,
		cost: null,
		startUnits: null,
		endUnits: null,
		return: null,
		cumulativeReturn: null,
		valuation: 0,
		netAssetValue: 0,
		netRevenueInBaseCurrency: null,
		netInvestedInBaseCurrency: null,
		netAssetValueInBaseCurrency: 0,
	}
}

function add(a: number | null, b: number): number {
	return Number(a ?? 0) + Number(b)
}

function nextPeriod(dateKey: string, aggregateBy: keyof typeof AggregateBy): string {
	if (aggregateBy === 'year') {
		return String(Number(dateKey) + 1)
	}
	// quarter
	const [yStr, qStr] = dateKey.split('-Q')
	let y = Number(yStr)
	let q = Number(qStr)
	q++
	if (q > 4) { q = 1; y++ }
	return `${y}-Q${q}`
}

type ValuationPoint = { date: Date; unitPrice: number }

/** Build sorted valuation series from explicit valuations + implicit from investments */
function buildValuationSeries(asset: Asset): ValuationPoint[] {
	const points: ValuationPoint[] = []

	for (const v of asset.valuations) {
		points.push({ date: v.date, unitPrice: v.unitPrice })
	}

	for (const inv of asset.investments) {
		if (inv.units !== 0) {
			points.push({ date: inv.valuta, unitPrice: inv.value / inv.units })
		}
	}

	points.sort((a, b) => a.date.getTime() - b.date.getTime())
	return points
}

/** Find most recent valuation with date <= endDate */
function findValuation(series: ValuationPoint[], endDate: Date): number | null {
	let result: number | null = null
	for (const p of series) {
		if (p.date.getTime() <= endDate.getTime()) {
			result = p.unitPrice
		} else {
			break
		}
	}
	return result
}

export function createReport(asset: Asset, aggregateBy: keyof typeof AggregateBy, fillGaps = true): AssetReport {
	type Entry = { date: Date; kind: 'investment' | 'revenue'; value: number; units: number; fxrate: number | undefined }

	const entries: Entry[] = [
		...asset.investments.map(inv => ({ date: inv.valuta, kind: 'investment' as const, value: inv.value, units: inv.units, fxrate: inv.fxrate })),
		...asset.revenues.map(rev => ({ date: rev.valuta, kind: 'revenue' as const, value: rev.value, units: 0, fxrate: rev.fxrate })),
	]
	entries.sort((a, b) => a.date.getTime() - b.date.getTime())

	const valuationSeries = buildValuationSeries(asset)

	// Build a map of dateKey -> aggregated row from actual entries
	const rowMap = new Map<string, AssetReportRow>()

	for (const entry of entries) {
		const dateKey = roundDate(entry.date, aggregateBy)
		let row = rowMap.get(dateKey)
		if (!row) {
			row = emptyRow(dateKey)
			rowMap.set(dateKey, row)
		}

		const fxrate = entry.fxrate || 1
		const valueInBase = entry.value * fxrate

		if (entry.kind === 'investment') {
			if (entry.value >= 0) {
				row.invested = add(row.invested, entry.value)
				row.netInvestedInBaseCurrency = add(row.netInvestedInBaseCurrency, valueInBase)
				row.endUnits = add(row.endUnits, entry.units)
			} else {
				row.divested = add(row.divested, -entry.value)
				row.netInvestedInBaseCurrency = add(row.netInvestedInBaseCurrency, valueInBase)
				row.endUnits = add(row.endUnits, entry.units)
			}
		} else {
			if (entry.value >= 0) {
				row.revenue = add(row.revenue, entry.value)
				row.netRevenueInBaseCurrency = add(row.netRevenueInBaseCurrency, valueInBase)
			} else {
				row.cost = add(row.cost, -entry.value)
				row.netRevenueInBaseCurrency = add(row.netRevenueInBaseCurrency, valueInBase)
			}
		}
	}

	// Generate all period keys from min date to current date
	const rows: AssetReportRow[] = []
	const sortedKeys = [...rowMap.keys()].sort()

	const assignUnitsAndNav = (row: AssetReportRow, prevEndUnits: number, dataEndUnits: number | null): number => {
		row.startUnits = prevEndUnits
		row.endUnits = Number(dataEndUnits ?? 0) + Number(prevEndUnits)
		const endDate = periodEndDate(row.date, aggregateBy)
		const unitPrice = findValuation(valuationSeries, endDate)
		if (unitPrice != null && row.endUnits != null) {
			row.valuation = unitPrice
			row.netAssetValue = unitPrice * row.endUnits
		}
		return row.endUnits ?? 0
	}

	if (sortedKeys.length > 0 && fillGaps) {
		const nowKey = roundDate(new Date(), aggregateBy)
		let period = sortedKeys[0]
		let prevEndUnits = 0

		while (period <= nowKey) {
			const existing = rowMap.get(period)
			if (existing) {
				prevEndUnits = assignUnitsAndNav(existing, prevEndUnits, existing.endUnits)
				rows.push(existing)
			} else {
				const gap = emptyRow(period)
				prevEndUnits = assignUnitsAndNav(gap, prevEndUnits, null)
				rows.push(gap)
			}
			period = nextPeriod(period, aggregateBy)
		}
	} else {
		let prevEndUnits = 0
		for (const key of sortedKeys) {
			const row = rowMap.get(key)!
			prevEndUnits = assignUnitsAndNav(row, prevEndUnits, row.endUnits)
			rows.push(row)
		}
	}

	const totalRow = emptyRow('Total')
	for (const row of rows) {
		totalRow.invested = add(totalRow.invested, row.invested ?? 0)
		totalRow.divested = add(totalRow.divested, row.divested ?? 0)
		totalRow.revenue = add(totalRow.revenue, row.revenue ?? 0)
		totalRow.cost = add(totalRow.cost, row.cost ?? 0)
		totalRow.netInvestedInBaseCurrency = add(totalRow.netInvestedInBaseCurrency, row.netInvestedInBaseCurrency ?? 0)
		totalRow.netRevenueInBaseCurrency = add(totalRow.netRevenueInBaseCurrency, row.netRevenueInBaseCurrency ?? 0)
	}
	if (rows.length > 0) {
		totalRow.startUnits = rows[0].startUnits
		totalRow.endUnits = rows[rows.length - 1].endUnits
		totalRow.netAssetValue = rows[rows.length - 1].netAssetValue
		totalRow.valuation = rows[rows.length - 1].valuation
	}

	return {
		name: asset.name,
		aggregatedBy: aggregateBy,
		type: asset.type,
		unit: asset.unit,
		currency: asset.entity.currency,
		totalRow,
		rows,
	}
}

/** Collect all assets from all entities in the portfolio */
function allAssets(portfolio: Portfolio): Asset[] {
	return portfolio.entities.flatMap(e => e.assets)
}

/** Get the range of years covered by any asset investment/revenue in the portfolio */
export function getYearRange(portfolio: Portfolio): number[] {
	let min = new Date().getFullYear()
	let max = min
	for (const asset of allAssets(portfolio)) {
		for (const inv of asset.investments) {
			const y = inv.valuta.getFullYear()
			if (y < min) min = y
			if (y > max) max = y
		}
		for (const rev of asset.revenues) {
			const y = rev.valuta.getFullYear()
			if (y < min) min = y
			if (y > max) max = y
		}
	}
	const years: number[] = []
	for (let y = min; y <= max; y++) years.push(y)
	return years
}

export function createPortfolioReport(portfolio: Portfolio, year: number): PortfolioReport {
	const emptyPfRow = (entity: Entity, asset: Asset): PortfolioReportRow => ({
		entityName: entity.name,
		country: entity.country,
		assetName: asset.name,
		type: asset.type,
		currency: entity.currency,
		invested: null,
		divested: null,
		startUnits: null,
		endUnits: null,
		netRevenueInBaseCurrency: null,
		netInvestedInBaseCurrency: null,
		netAssetValueInBaseCurrency: 0,
	})

	const rows: PortfolioReportRow[] = []
	const yearKey = String(year)

	for (const entity of portfolio.entities) {
		for (const asset of entity.assets) {
			const assetReport = createReport(asset, 'year')
			const yearRow = assetReport.rows.find(r => r.date === yearKey)

			if (yearRow) {
				rows.push({
					entityName: entity.name,
					country: entity.country,
					assetName: asset.name,
					type: asset.type,
					currency: entity.currency,
					invested: yearRow.invested,
					divested: yearRow.divested,
					startUnits: yearRow.startUnits,
					endUnits: yearRow.endUnits,
					netRevenueInBaseCurrency: yearRow.netRevenueInBaseCurrency,
					netInvestedInBaseCurrency: yearRow.netInvestedInBaseCurrency,
					netAssetValueInBaseCurrency: yearRow.netAssetValueInBaseCurrency,
				})
			} else {
				rows.push(emptyPfRow(entity, asset))
			}
		}
	}

	const totalRow: PortfolioReportRow = {
		entityName: '',
		country: '',
		assetName: 'Total',
		type: 'other',
		currency: portfolio.baseCurrency,
		invested: null,
		divested: null,
		startUnits: null,
		endUnits: null,
		netRevenueInBaseCurrency: null,
		netInvestedInBaseCurrency: null,
		netAssetValueInBaseCurrency: 0,
	}
	for (const row of rows) {
		totalRow.netInvestedInBaseCurrency = add(totalRow.netInvestedInBaseCurrency, row.netInvestedInBaseCurrency ?? 0)
		totalRow.netRevenueInBaseCurrency = add(totalRow.netRevenueInBaseCurrency, row.netRevenueInBaseCurrency ?? 0)
		totalRow.netAssetValueInBaseCurrency = add(totalRow.netAssetValueInBaseCurrency, row.netAssetValueInBaseCurrency)
	}

	return {
		name: 'Portfolio',
		year,
		totalRow,
		rows,
	}
}
