<script lang="ts">
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import {getPortfolio} from '$lib/current.svelte'
	import { AggregateBy, assetUnitTitle, type AssetReportRow } from '$lib/portfolio'
	import { createReport } from '$lib/report'
	import { exportCsv } from '$lib/csv'
	import NavButton from '$lib/components/navbutton.svelte'
	import { Print } from '$lib/wailsjs/go/main/App'

	const pf = $derived(getPortfolio())
	const entityIndex = $derived(Number(page.url.searchParams.get('entityIndex')))
	const assetIndex = $derived(Number(page.url.searchParams.get('assetIndex')))
	const entity = $derived(pf?.entities[entityIndex])
	const asset = $derived(entity?.assets[assetIndex])

  let aggregatedBy: keyof typeof AggregateBy = $state('year')
  const report = $derived(createReport(asset, aggregatedBy))

  function unitLabels(agg: keyof typeof AggregateBy): { start: string; end: string } {
    if (agg === 'year') {
      return { start: `${assetUnitTitle} 01.01`, end: `${assetUnitTitle} 31.12` }
    }
    // For quarterly, dates vary per row so just use generic labels
    return { start: `${assetUnitTitle} start`, end: `${assetUnitTitle} end` }
  }

  const columns = $derived.by((): { key: keyof AssetReportRow; label: string }[] => {
    const ul = unitLabels(aggregatedBy)
    return [
      { key: 'date', label: 'Date' },
      { key: 'invested', label: 'Invested' },
      { key: 'divested', label: 'Divested' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'cost', label: 'Cost' },
      { key: 'startUnits', label: ul.start },
      { key: 'endUnits', label: ul.end },
      { key: 'valuation', label: 'Valuation' },
      { key: 'netAssetValue', label: 'Net Asset Value' },
      { key: 'netAssetValueInBaseCurrency', label: 'NAV (Base)' },
      { key: 'irr', label: 'IRR' },
      { key: 'commitments', label: 'Commitments' },
    ]
  })

  const pctCols = new Set(['irr'])

  function fmt(v: unknown, col?: string): string {
    if (v === null || v === undefined) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'number') {
      if (col && pctCols.has(col)) return (v * 100).toFixed(1) + '%'
      return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return String(v)
  }
</script>

<div class="mb-4 flex items-center gap-3">
  <NavButton action={() => goto(`/asset?entityIndex=${entityIndex}&assetIndex=${assetIndex}`)} name="Back to Asset" tooltip="Return to asset detail page" />
  <h1 class="text-xl font-semibold">Report: {asset.name}</h1>
</div>
<div class="mb-4 flex items-center gap-2">
  <label class="text-sm font-medium text-gray-700">Aggregate by:
  <select bind:value={aggregatedBy} class="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
    {#each Object.entries(AggregateBy) as [key, label]}
      <option value={key}>{label}</option>
    {/each}
  </select>
  </label>
  <NavButton action={() => exportCsv(asset.name, columns.map(c => c.label), [...report.rows, report.totalRow], columns.map(c => c.key))} name="Export CSV" tooltip="Export report data as CSV file" />
  <NavButton action={() => Print()} name="Print" tooltip="Print this report" />
</div>

<div class="overflow-x-auto rounded-lg border border-gray-200">
  <table class="w-full text-sm">
    <thead>
      <tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
        {#each columns as col}
          <th class="px-3 py-2">{col.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#each report.rows as row}
        <tr class="hover:bg-gray-50 transition-colors">
          {#each columns as col}
            <td class="px-3 py-1.5 {col.key === 'date' ? '' : 'text-right'}">{fmt(row[col.key], col.key)}</td>
          {/each}
        </tr>
      {/each}
      <tr class="border-t-2 border-gray-300 bg-gray-50 font-semibold">
        {#each columns as col}
          <td class="px-3 py-1.5 {col.key === 'date' ? '' : 'text-right'}">{fmt(report.totalRow[col.key], col.key)}</td>
        {/each}
      </tr>
    </tbody>
  </table>
</div>
