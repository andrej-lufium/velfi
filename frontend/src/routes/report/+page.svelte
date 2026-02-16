<script lang="ts">
  import {getPortfolio} from '$lib/current.svelte'
  import type { PortfolioReportRow } from '$lib/portfolio'
  import { createPortfolioReport, getYearRange } from '$lib/report'
  import { exportCsv } from '$lib/csv'
  import NavButton from '$lib/components/navbutton.svelte'
  import { Print } from '$lib/wailsjs/go/main/App'

  const pf = $derived(getPortfolio())
  const years = $derived(pf ? getYearRange(pf) : [])
  let selectedYear = $state(new Date().getFullYear())
  const report = $derived(pf ? createPortfolioReport(pf, selectedYear) : null)

  const columns: { key: keyof PortfolioReportRow; label: string }[] = [
    { key: 'entityName', label: 'Entity' },
    { key: 'country', label: 'Country' },
    { key: 'assetName', label: 'Asset' },
    { key: 'type', label: 'Type' },
    { key: 'invested', label: 'Invested' },
    { key: 'divested', label: 'Divested' },
    { key: 'startUnits', label: 'Start Units' },
    { key: 'endUnits', label: 'End Units' },
    { key: 'netInvestedInBaseCurrency', label: 'Net Invested (Base)' },
    { key: 'netRevenueInBaseCurrency', label: 'Net Revenue (Base)' },
    { key: 'netAssetValueInBaseCurrency', label: 'NAV (Base)' },
  ]

  const textCols = new Set(['entityName', 'country', 'assetName', 'type'])

  function fmt(v: unknown): string {
    if (v === null || v === undefined) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object' && v !== null && 'iso' in v) return (v as {iso: string}).iso
    if (typeof v === 'number') return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return String(v)
  }
</script>

<h1 class="text-xl font-semibold mb-4">Portfolio Report</h1>

{#if pf && report}
  <div class="mb-4 flex items-center gap-2">
    <label class="text-sm font-medium text-gray-700">Year:
    <select bind:value={selectedYear} class="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
      {#each years as year}
        <option value={year}>{year}</option>
      {/each}
    </select>
    </label>
    <NavButton action={() => exportCsv(`Portfolio-Report-${selectedYear}`, columns.map(c => c.label), [...report.rows, report.totalRow], columns.map(c => c.key))} name="Export CSV" tooltip="Export portfolio report as CSV file" />
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
              {@const v = row[col.key]}
              <td class="px-3 py-1.5 {textCols.has(col.key) ? '' : 'text-right'}">{fmt(v)}</td>
            {/each}
          </tr>
        {/each}
        <tr class="border-t-2 border-gray-300 bg-gray-50 font-semibold">
          {#each columns as col}
            {@const v = report.totalRow[col.key]}
            <td class="px-3 py-1.5 {textCols.has(col.key) ? '' : 'text-right'}">{fmt(v)}</td>
          {/each}
        </tr>
      </tbody>
    </table>
  </div>
{:else}
  <p class="text-sm text-gray-500">No portfolio loaded.</p>
{/if}
