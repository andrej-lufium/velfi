import type { Currency, Portfolio } from "./portfolio"

type FrankfurterResponse = {
	base: string
	start_date: string
	end_date: string
	rates: Record<string, Record<string, number>>
}

function formatDate(d: Date): string {
	return d.toISOString().slice(0, 10)
}

function quarterKey(dateStr: string): string {
	const [y, m] = dateStr.split('-')
	const q = Math.ceil(Number(m) / 3)
	return `${y}-Q${q}`
}

function monthKey(dateStr: string): string {
	return dateStr.slice(0, 7)
}

function findDateRange(currency: Currency, portfolio: Portfolio): { min: Date; max: Date } | null {
	const dates: Date[] = []

	for (const entity of portfolio.entities) {
		if (entity.currency.iso !== currency.iso) continue
		for (const asset of entity.assets) {
			for (const inv of asset.investments) dates.push(inv.valuta)
			for (const rev of asset.revenues) dates.push(rev.valuta)
		}
	}

	for (const r of currency.rates) dates.push(r.date)

	if (dates.length === 0) return null

	let min = dates[0], max = dates[0]
	for (const d of dates) {
		if (d < min) min = d
		if (d > max) max = d
	}
	return { min, max }
}

function filterByFrequency(
	entries: { date: string; rate: number }[],
	frequency: 'monthly' | 'quarterly'
): { date: Date; rate: number }[] {
	const keyFn = frequency === 'monthly' ? monthKey : quarterKey
	const groups = new Map<string, { date: string; rate: number }>()

	for (const entry of entries) {
		const key = keyFn(entry.date)
		const existing = groups.get(key)
		if (!existing || entry.date > existing.date) {
			groups.set(key, entry)
		}
	}

	return [...groups.values()]
		.sort((a, b) => a.date.localeCompare(b.date))
		.map(e => ({ date: new Date(e.date), rate: e.rate }))
}

export async function fetchRates(
	currency: Currency,
	baseCurrency: Currency,
	portfolio: Portfolio,
	frequency: 'monthly' | 'quarterly'
): Promise<void> {
	if (currency.iso === baseCurrency.iso) return

	const range = findDateRange(currency, portfolio)
	if (!range) return

	const url = `https://api.frankfurter.dev/v1/${formatDate(range.min)}..${formatDate(range.max)}?base=${currency.iso}&symbols=${baseCurrency.iso}`
	const resp = await fetch(url)
	if (!resp.ok) throw new Error(`Frankfurter API error: ${resp.status}`)

	const data: FrankfurterResponse = await resp.json()

	const entries = Object.entries(data.rates).map(([date, rates]) => ({
		date,
		rate: rates[baseCurrency.iso],
	}))

	currency.rates = filterByFrequency(entries, frequency)
}
