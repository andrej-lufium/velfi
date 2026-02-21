<script lang="ts">
  import {getPortfolio} from '$lib/current.svelte'
  import { AssetTypeNames, assetUnitTitle, type PortfolioReportRow } from '$lib/portfolio'
  import { createPortfolioReport, getYearRange } from '$lib/report'
  import { exportCsv } from '$lib/csv'
  import NavButton from '$lib/components/navbutton.svelte'
  import { Print } from '$lib/wailsjs/go/main/App'

  const pf = $derived(getPortfolio())
  const years = $derived(pf ? getYearRange(pf) : [])
  let selectedYear = $state(new Date().getFullYear())
  const report = $derived(pf ? createPortfolioReport(pf, selectedYear) : null)

  let taxView = $state(false)
  let groupByType = $state(false)

  const allColumns = $derived.by((): { key: keyof PortfolioReportRow; label: string; taxHidden?: boolean }[] => [
    { key: 'entityName', label: 'Entity' },
    { key: 'country', label: 'Country' },
    { key: 'assetName', label: 'Asset' },
    { key: 'type', label: 'Type' },
    { key: 'invested', label: 'Invested', taxHidden: true },
    { key: 'divested', label: 'Divested', taxHidden: true },
    { key: 'startUnits', label: `${assetUnitTitle} 01.01.${selectedYear}` },
    { key: 'endUnits', label: `${assetUnitTitle} 31.12.${selectedYear}` },
    { key: 'netInvestedInBaseCurrency', label: 'Net Invested (Base)' },
    { key: 'netRevenueInBaseCurrency', label: 'Net Revenue (Base)' },
    { key: 'netAssetValueInBaseCurrency', label: 'NAV (Base)' },
    { key: 'irr', label: 'IRR', taxHidden: true },
    { key: 'committed', label: 'Committed', taxHidden: true },
    { key: 'totalInvested', label: 'Total Invested', taxHidden: true },
    { key: 'openCommitment', label: 'Open', taxHidden: true },
  ])

  const columns = $derived(allColumns.filter(c => (!taxView || !c.taxHidden) && (!groupByType || c.key !== 'type')))

  const textCols = new Set(['entityName', 'country', 'assetName', 'type'])
  const pctCols = new Set(['irr'])

  type Footnote = { index: number; assetName: string; date: string; unitPrice: string }

  // Build valuation footnotes: rows where valuation != 1 and valuationDate is set
  const footnotes = $derived.by(() => {
    if (!report) return { map: new Map<PortfolioReportRow, number>(), list: [] as Footnote[] }
    const list: Footnote[] = []
    const map = new Map<PortfolioReportRow, number>()
    for (const row of report.rows) {
      if (row.valuationDate && row.netAssetValueInBaseCurrency !== 0) {
        const idx = list.length + 1
        map.set(row, idx)
        list.push({
          index: idx,
          assetName: row.assetName,
          date: row.valuationDate.toISOString().slice(0, 10),
          unitPrice: row.netAssetValueInBaseCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        })
      }
    }
    return { map, list }
  })

  // Group rows by asset type
  const groupedRows = $derived.by(() => {
    if (!report || !groupByType) return null
    const groups = new Map<string, { label: string; rows: PortfolioReportRow[]; subtotal: PortfolioReportRow }>()
    for (const row of report.rows) {
      let group = groups.get(row.type)
      if (!group) {
        group = {
          label: AssetTypeNames[row.type] || row.type,
          rows: [],
          subtotal: {
            entityName: '', country: '', assetName: `Subtotal ${AssetTypeNames[row.type] || row.type}`,
            type: row.type, currency: report.totalRow.currency,
            invested: null, divested: null, startUnits: null, endUnits: null,
            netRevenueInBaseCurrency: null, netInvestedInBaseCurrency: null,
            netAssetValueInBaseCurrency: 0, valuationDate: null,
            irr: undefined, committed: null, totalInvested: null, openCommitment: null,
          },
        }
        groups.set(row.type, group)
      }
      group.rows.push(row)
      group.subtotal.netInvestedInBaseCurrency = add(group.subtotal.netInvestedInBaseCurrency, row.netInvestedInBaseCurrency ?? 0)
      group.subtotal.netRevenueInBaseCurrency = add(group.subtotal.netRevenueInBaseCurrency, row.netRevenueInBaseCurrency ?? 0)
      group.subtotal.netAssetValueInBaseCurrency = add(group.subtotal.netAssetValueInBaseCurrency, row.netAssetValueInBaseCurrency)
      group.subtotal.committed = add(group.subtotal.committed, row.committed ?? 0)
      group.subtotal.totalInvested = add(group.subtotal.totalInvested, row.totalInvested ?? 0)
      group.subtotal.openCommitment = add(group.subtotal.openCommitment, row.openCommitment ?? 0)
    }
    return [...groups.values()]
  })

  function add(a: number | null, b: number): number {
    return Number(a ?? 0) + Number(b)
  }

  function fmt(v: unknown, col?: string): string {
    if (v === null || v === undefined) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object' && v !== null && 'iso' in v) return (v as {iso: string}).iso
    if (typeof v === 'number') {
      if (col && pctCols.has(col)) return (v * 100).toFixed(1) + '%'
      return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return String(v)
  }
</script>

{#snippet tableHeader()}
  <thead>
    <tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
      {#each columns as col}
        <th class="px-3 py-2">{col.label}</th>
      {/each}
    </tr>
  </thead>
{/snippet}

{#snippet tableRow(row: PortfolioReportRow, bold?: boolean)}
  <tr class="{bold ? 'border-t-2 border-gray-300 bg-gray-50 font-semibold' : 'hover:bg-gray-50 transition-colors'}">
    {#each columns as col}
      {@const v = row[col.key]}
      <td class="px-3 py-1.5 {textCols.has(col.key) ? '' : 'text-right'}">
        {fmt(v, col.key)}{#if col.key === 'netAssetValueInBaseCurrency' && footnotes.map.has(row)}<sup class="text-xs text-gray-400 ml-0.5">{footnotes.map.get(row)}</sup>{/if}
      </td>
    {/each}
  </tr>
{/snippet}

<h1 class="text-xl font-semibold mb-4">{pf?.name || 'Portfolio'} Report</h1>

{#if pf && report}
  <div class="mb-4 flex items-center gap-2 flex-wrap">
    <label class="text-sm font-medium text-gray-700">Year:
    <select bind:value={selectedYear} class="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
      {#each years as year}
        <option value={year}>{year}</option>
      {/each}
    </select>
    </label>
    <label class="inline-flex items-center gap-1 text-sm">
      <input type="checkbox" bind:checked={taxView} class="rounded border-gray-300" />
      Tax view
    </label>
    <label class="inline-flex items-center gap-1 text-sm">
      <input type="checkbox" bind:checked={groupByType} class="rounded border-gray-300" />
      Group by asset type
    </label>
    <NavButton action={() => exportCsv(`Portfolio-Report-${selectedYear}`, columns.map(c => c.label), [...report.rows, report.totalRow], columns.map(c => c.key))} name="Export CSV" tooltip="Export portfolio report as CSV file" />
    <NavButton action={() => Print()} name="Print" tooltip="Print this report" />
  </div>

  {#if groupByType && groupedRows}
    {#each groupedRows as group}
      <h2 class="text-base font-semibold mt-6 mb-2">{group.label}</h2>
      <div class="overflow-x-auto rounded-lg border border-gray-200 mb-4">
        <table class="w-full text-sm">
          {@render tableHeader()}
          <tbody class="divide-y divide-gray-100">
            {#each group.rows as row}
              {@render tableRow(row)}
            {/each}
            {@render tableRow(group.subtotal, true)}
          </tbody>
        </table>
      </div>
    {/each}
    <h2 class="text-base font-semibold mt-6 mb-2">Total</h2>
    <div class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="w-full text-sm">
        {@render tableHeader()}
        <tbody>
          {@render tableRow(report.totalRow, true)}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="w-full text-sm">
        {@render tableHeader()}
        <tbody class="divide-y divide-gray-100">
          {#each report.rows as row}
            {@render tableRow(row)}
          {/each}
          {@render tableRow(report.totalRow, true)}
        </tbody>
      </table>
    </div>
  {/if}

  {#if footnotes.list.length > 0}
    <div class="mt-4 text-xs text-gray-500 space-y-0.5">
      {#each footnotes.list as fn}
        <div><sup>{fn.index}</sup> {fn.assetName}: valuation as of {fn.date}, NAV {fn.unitPrice}</div>
      {/each}
    </div>
  {/if}
{:else}
  <p class="text-sm text-gray-500">No portfolio loaded.</p>
{/if}
