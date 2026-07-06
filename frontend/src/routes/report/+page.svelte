<script lang="ts">
  import {getPortfolio, isWailsEnv} from '$lib/current.svelte'
  import { AssetTypeNames, assetUnitTitle, type PortfolioReportRow } from '$lib/portfolio'
  import { createPortfolioReport, getYearRange } from '$lib/report'
  import { exportCsv } from '$lib/csv'
  import NavButton from '$lib/components/navbutton.svelte'
  import { Print } from '$lib/wailsjs/go/main/App'
  import * as m from '$lib/paraglide/messages'
  import { SvelteMap } from 'svelte/reactivity'

  const pf = $derived(getPortfolio())
  const years = $derived(pf ? getYearRange(pf) : [])
  let selectedYear = $state(new Date().getFullYear())
  const report = $derived(pf ? createPortfolioReport(pf, selectedYear) : null)

  let taxView = $state(false)
  let groupByType = $state(false)
  let showZeroRows = $state(false)

  const allColumns = $derived.by((): { key: keyof PortfolioReportRow; label: string }[] => [
    { key: 'issuerName', label: m.reportPortfolioColumnsIssuer() },
    { key: 'country', label: 'Country' },
    { key: 'assetName', label: 'Asset' },
    { key: 'type', label: 'Type' },
    { key: 'currency', label: 'Currency' },
    { key: 'invested', label: 'Invested' },
    { key: 'divested', label: 'Divested' },
    { key: 'startUnits', label: `${assetUnitTitle} 01.01.${selectedYear}` },
    { key: 'endUnits', label: `${assetUnitTitle} 31.12.${selectedYear}` },
    { key: 'nav', label: 'NAV' },
    { key: 'netInvestedInBaseCurrency', label: 'Net Invested (Base)' },
    { key: 'netRevenueInBaseCurrency', label: 'Net Revenue (Base)' },
    { key: 'whtInBaseCurrency', label: 'WHT (Base)' },
    { key: 'netAssetValueInBaseCurrency', label: 'NAV (Base)' },
    { key: 'irr', label: 'IRR' },
    { key: 'committed', label: 'Committed' },
    { key: 'totalInvested', label: 'Total Invested' },
    { key: 'openCommitment', label: 'Open' },
  ])

  const columns = $derived(allColumns.filter(c =>
    (!taxView || !(pf?.taxHiddenColumns ?? []).includes(c.key)) &&
    (!groupByType || c.key !== 'type')
  ))

  const textCols = new Set(['issuerName', 'country', 'assetName', 'type', 'currency'])
  const pctCols = new Set(['irr'])

  // Filter rows where both start and end quantities are zero
  const filteredRows = $derived(
    showZeroRows
      ? (report?.rows ?? [])
      : (report?.rows ?? []).filter(r => !((r.startUnits ?? 0) === 0 && (r.endUnits ?? 0) === 0))
  )

  type Footnote = { index: number; assetName: string; currency: string; date: string; unitPrice: string; fxRate: string | null }

  // Build valuation footnotes for rows with a valuation date
  const footnotes = $derived.by(() => {
    if (!report) return { map: new SvelteMap<PortfolioReportRow, number>(), list: [] as Footnote[] }
    const list: Footnote[] = []
    const map = new SvelteMap<PortfolioReportRow, number>()
    for (const row of filteredRows) {
      if (row.valuationDate && row.valuationUnitPrice != null) {
        const idx = list.length + 1
        map.set(row, idx)
        list.push({
          index: idx,
          assetName: row.assetName,
          currency: row.currency.iso,
          date: row.valuationDate.toISOString().slice(0, 10),
          unitPrice: row.valuationUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          fxRate: row.fxRate != null ? row.fxRate.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 }) : null,
        })
      }
    }
    return { map, list }
  })

  // Currency subtotals (only meaningful when 2+ currencies present)
  const currencySubtotals = $derived.by(() => {
    if (!report) return []
    const map = new Map<string, PortfolioReportRow>()
    for (const row of filteredRows) {
      const iso = row.currency.iso
      let sub = map.get(iso)
      if (!sub) {
        sub = {
          issuerName: '', country: '', assetName: `Subtotal ${iso}`, type: 'other',
          currency: row.currency, invested: null, divested: null, startUnits: null, endUnits: null,
          nav: null, netRevenueInBaseCurrency: null, whtInBaseCurrency: null,
          netInvestedInBaseCurrency: null, netAssetValueInBaseCurrency: 0,
          valuationDate: null, valuationUnitPrice: null, fxRate: null,
          irr: undefined, committed: null, totalInvested: null, openCommitment: null,
        }
        map.set(iso, sub)
      }
      sub.netInvestedInBaseCurrency = add(sub.netInvestedInBaseCurrency, row.netInvestedInBaseCurrency ?? 0)
      sub.netRevenueInBaseCurrency = add(sub.netRevenueInBaseCurrency, row.netRevenueInBaseCurrency ?? 0)
      sub.whtInBaseCurrency = add(sub.whtInBaseCurrency, row.whtInBaseCurrency ?? 0)
      sub.netAssetValueInBaseCurrency = add(sub.netAssetValueInBaseCurrency, row.netAssetValueInBaseCurrency)
      sub.committed = add(sub.committed, row.committed ?? 0)
      sub.totalInvested = add(sub.totalInvested, row.totalInvested ?? 0)
      sub.openCommitment = add(sub.openCommitment, row.openCommitment ?? 0)
    }
    return [...map.values()]
  })

  const showCurrencySubtotals = $derived(currencySubtotals.length > 1)

  // Group rows by asset type
  const groupedRows = $derived.by(() => {
    if (!report || !groupByType) return null
    const groups = new SvelteMap<string, { label: string; rows: PortfolioReportRow[]; subtotal: PortfolioReportRow }>()
    for (const row of filteredRows) {
      // Key by display label so distinct type spellings that map to the same
      // name (e.g. 'equity' and a stray 'Equity') merge into one section
      // instead of producing duplicate keys (each_key_duplicate).
      const label = AssetTypeNames[row.type] || row.type
      if (!groups.has(label)) {
        groups.set(label, {
          label,
          rows: [],
          subtotal: {
            issuerName: '', country: '', assetName: `Subtotal ${label}`,
            type: row.type, currency: report.totalRow.currency,
            invested: null, divested: null, startUnits: null, endUnits: null,
            nav: null, netRevenueInBaseCurrency: null, whtInBaseCurrency: null, netInvestedInBaseCurrency: null,
            netAssetValueInBaseCurrency: 0, valuationDate: null, valuationUnitPrice: null, fxRate: null,
            irr: undefined, committed: null, totalInvested: null, openCommitment: null,
          },
        })
      }
      const group = groups.get(label)!
      group.rows.push(row)
      group.subtotal.netInvestedInBaseCurrency = add(group.subtotal.netInvestedInBaseCurrency, row.netInvestedInBaseCurrency ?? 0)
      group.subtotal.netRevenueInBaseCurrency = add(group.subtotal.netRevenueInBaseCurrency, row.netRevenueInBaseCurrency ?? 0)
      group.subtotal.whtInBaseCurrency = add(group.subtotal.whtInBaseCurrency, row.whtInBaseCurrency ?? 0)
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

  // Wails triggers the native webview print dialog; in browser mode fall back
  // to window.print() (window.go is undefined outside Wails).
  function printReport() {
    if (isWailsEnv()) Print()
    else window.print()
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
      {#each columns as col (col.key)}
        <th class="px-3 py-2">{col.label}</th>
      {/each}
    </tr>
  </thead>
{/snippet}

{#snippet tableRow(row: PortfolioReportRow, bold?: boolean)}
  <tr class="{bold ? 'border-t-2 border-gray-300 bg-gray-50 font-semibold' : 'hover:bg-gray-50 transition-colors'}">
    {#each columns as col (col.key)}
      {@const v = row[col.key]}
      <td class="px-3 py-1.5 {textCols.has(col.key) ? '' : 'text-right'}">
        {fmt(v, col.key)}{#if col.key === 'nav' && footnotes.map.has(row)}<sup class="text-xs text-gray-400 ml-0.5">{footnotes.map.get(row)}</sup>{/if}
      </td>
    {/each}
  </tr>
{/snippet}

{#snippet sectionRow(label: string)}
  <tr class="border-t border-gray-200 bg-gray-100">
    <td colspan={columns.length} class="px-3 py-1.5 text-sm font-semibold text-gray-700">{label}</td>
  </tr>
{/snippet}

<h1 class="text-xl font-semibold mb-4">{pf?.name || 'Portfolio'} Report</h1>

{#if pf && report}
  <div class="mb-4 flex items-center gap-2 flex-wrap">
    <label class="text-sm font-medium text-gray-700">Year:
    <select bind:value={selectedYear} class="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
      {#each years as year (year)}
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
    <label class="inline-flex items-center gap-1 text-sm">
      <input type="checkbox" bind:checked={showZeroRows} class="rounded border-gray-300" />
      Show zero-quantity positions
    </label>
    <NavButton action={() => exportCsv(`Portfolio-Report-${selectedYear}`, columns.map(c => c.label), [...filteredRows, report.totalRow], columns.map(c => c.key))} name="Export CSV" tooltip="Export portfolio report as CSV file" />
    <NavButton action={() => printReport()} name="Print" tooltip="Print this report" />
  </div>

  <div class="overflow-x-auto rounded-lg border border-gray-200">
    <table class="w-full text-sm">
      {@render tableHeader()}
      <tbody class="divide-y divide-gray-100">
        {#if groupByType && groupedRows}
          {#each groupedRows as group (group.label)}
            {@render sectionRow(group.label)}
            {#each group.rows as row, i (group.label + '-' + i)}
              {@render tableRow(row)}
            {/each}
            {@render tableRow(group.subtotal, true)}
          {/each}
          {#if showCurrencySubtotals}
            {@render sectionRow('By Currency')}
            {#each currencySubtotals as sub (sub.assetName)}
              {@render tableRow(sub, true)}
            {/each}
          {/if}
          {@render sectionRow('Total')}
          {@render tableRow(report.totalRow, true)}
        {:else}
          {#each filteredRows as row, i (i)}
            {@render tableRow(row)}
          {/each}
          {#if showCurrencySubtotals}
            {#each currencySubtotals as sub (sub.assetName)}
              {@render tableRow(sub, true)}
            {/each}
          {/if}
          {@render tableRow(report.totalRow, true)}
        {/if}
      </tbody>
    </table>
  </div>

  {#if footnotes.list.length > 0}
    <div class="mt-4 text-xs text-gray-500 space-y-0.5">
      {#each footnotes.list as fn (fn.index)}
        <div><sup>{fn.index}</sup> {fn.assetName}: valuation as of {fn.date}, unit price {fn.unitPrice} {fn.currency}{#if fn.fxRate != null}, FX rate {fn.fxRate}{/if}</div>
      {/each}
    </div>
  {/if}
{:else}
  <p class="text-sm text-gray-500">No portfolio loaded.</p>
{/if}
