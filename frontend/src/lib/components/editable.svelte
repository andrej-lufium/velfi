<script lang="ts" generics="T extends Record<string, any>">
import { goto } from '$app/navigation'
import CurrencySelect from '$lib/components/currencyselect.svelte'
import FxRateInput from '$lib/components/fxrateinput.svelte'
import NavButton from '$lib/components/navbutton.svelte'
import type { Currency } from '$lib/portfolio'
import { FileExists, OpenDirectoryDialog, SelectDocumentDialog, RelativePath, CopyFile, CreateDirectory } from '$lib/wailsjs/go/main/App'
import { OnFileDrop, OnFileDropOff } from '$lib/wailsjs/runtime/runtime'

type DetailPage = { key: keyof T | undefined; path: string; indexParam?: string; extraParams?: Record<string, string> }

type Chooser = { [K in keyof T]?: 'currency' | 'doc' | 'docfolder' | Record<string, string> }

let {
  table = $bindable([]),
  maker,
  detailPages = [],
  chooser = {} as Chooser,
  currencies = [],
  docfolder = '',
  portfolioDir = '',
  currency = undefined as Currency | undefined,
  baseCurrency = undefined as Currency | undefined,
  valueColumns = [] as string[],
  displayColumns = undefined as string[] | undefined,
  narrowColumns = [] as string[],
  wideColumns = [] as string[],
  columnLabels = {} as Record<string, string>,
}: { table: T[] | undefined; maker: () => T;
  detailPages?: DetailPage[];
  chooser?: Chooser;
  currencies?: Currency[];
  docfolder?: string;
  portfolioDir?: string;
  currency?: Currency;
  baseCurrency?: Currency;
  valueColumns?: string[];
  displayColumns?: string[];
  narrowColumns?: string[];
  wideColumns?: string[];
  columnLabels?: Record<string, string>;
} = $props()

if (table === undefined) table = []

function addRow() {
  table = [...table, maker()]
}

function deleteRow(index: number) {
  table = table.filter((_, i) => i !== index)
}

function detailPageFor(col: string): DetailPage | undefined {
  return detailPages.find(d => d.key === col)
}

function goToDetail(dp: DetailPage, index: number) {
  const params = new URLSearchParams({ [dp.indexParam ?? 'index']: String(index), ...dp.extraParams })
  goto(`${dp.path}?${params}`)
}

const rawColumns = $derived(table.length > 0 ? Object.keys(table[0]) : Object.keys(maker()))
const filteredColumns = $derived(
  currency && baseCurrency && currency.iso === baseCurrency.iso
    ? rawColumns.filter(c => c !== 'fxrate')
    : rawColumns
)
const columns = $derived(
  displayColumns
    ? displayColumns.filter(c => filteredColumns.includes(c))
    : filteredColumns
)

function colWidth(col: string): string {
  if (narrowColumns.includes(col)) return 'w-16'
  if (wideColumns.includes(col)) return 'w-36'
  return ''
}

function displayValue(row: T, col: string): string {
  const v = row[col]
  if (v && typeof v === 'object' && 'name' in v) return (v as { name: string }).name
  if (Array.isArray(v)) return ''
  return ''
}

// Resolve a relative path against portfolioDir
function resolve(...parts: string[]): string {
  return parts.filter(Boolean).join('/')
}

// Resolve full absolute path for a docfolder value (relative to portfolioDir)
function resolveDocfolderPath(value: string): string {
  if (!value) return ''
  if (value.startsWith('/')) return value
  return resolve(portfolioDir, value)
}

// Resolve full absolute path for a doc value (relative to resolved docfolder)
function resolveDocPath(value: string): string {
  if (!value) return ''
  if (value.startsWith('/')) return value
  const absDocfolder = resolveDocfolderPath(docfolder)
  if (absDocfolder) return resolve(absDocfolder, value)
  return resolve(portfolioDir, value)
}

// Track file/folder existence
let existsMap: Record<string, boolean> = $state({})

$effect(() => {
  const paths: string[] = []
  for (const row of table) {
    for (const col of columns) {
      if (chooser[col] === 'docfolder' && row[col]) {
        paths.push(resolveDocfolderPath(row[col]))
      } else if (chooser[col] === 'doc' && row[col]) {
        paths.push(resolveDocPath(row[col]))
      }
    }
  }
  const unique = [...new Set(paths.filter(p => p))]
  if (unique.length === 0) { existsMap = {}; return }
  Promise.all(unique.map(p => FileExists(p).then(exists => [p, exists] as const)))
    .then(results => {
      const m: Record<string, boolean> = {}
      for (const [p, exists] of results) m[p] = exists
      existsMap = m
    })
})

// File drop support
const docCol = $derived(Object.entries(chooser).find(([_, v]) => v === 'doc')?.[0])

$effect(() => {
  if (!docCol) return

  OnFileDrop(async (_x: number, _y: number, paths: string[]) => {
    const absDocfolder = resolveDocfolderPath(docfolder)
    for (const path of paths) {
      const newRow = maker() as any
      if (absDocfolder) {
        await CreateDirectory(absDocfolder)
        const basename = path.split('/').pop() || path
        const dst = absDocfolder + '/' + basename
        await CopyFile(path, dst)
        newRow[docCol] = basename
      } else {
        newRow[docCol] = path
      }
      table = [...table, newRow]
    }
  }, true)

  return () => { OnFileDropOff() }
})
</script>

{#snippet details(dp: DetailPage, i: number)}
      <NavButton action={() => goToDetail(dp, i)} name="Details" tooltip="Open detail view" />
{/snippet}

<div data-wails-drop-target class="overflow-x-auto rounded-lg border border-gray-200">
  <table class="w-full text-sm">
    <thead>
      <tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
        {#each columns as col}
          <th class="px-3 py-2 {colWidth(col)}">{columnLabels[col] ?? col}{#if currency && valueColumns.includes(col)}<br><span class="font-normal normal-case text-gray-400">{currency.iso}</span>{/if}</th>
        {/each}
        <th class="px-3 py-2 w-0"></th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#each table as row, i}
        <tr class="hover:bg-gray-50 transition-colors">
          {#each columns as col}
            <td class="px-3 py-1.5">
              {#if chooser[col] === 'docfolder'}
                {@const absPath = resolveDocfolderPath(row[col])}
                <span class="text-sm {absPath && existsMap[absPath] === false ? 'text-red-600' : ''}">
                  {row[col] || '(not set)'}
                </span>
                <button onclick={async () => {
                  const path = await OpenDirectoryDialog()
                  if (path && portfolioDir) {
                    const rel = await RelativePath(portfolioDir, path)
                    table[i] = { ...row, [col]: rel }
                  } else if (path) {
                    table[i] = { ...row, [col]: path }
                  }
                }} class="ml-1 text-xs text-blue-600 hover:underline cursor-pointer">change</button>
              {:else if chooser[col] === 'doc'}
                {@const fullPath = resolveDocPath(row[col])}
                <span class="text-sm {fullPath && existsMap[fullPath] === false ? 'text-red-600' : ''}">
                  {row[col] || '(not set)'}
                </span>
                <button onclick={async () => {
                  const path = await SelectDocumentDialog()
                  if (!path) return
                  const absDocfolder = resolveDocfolderPath(docfolder)
                  if (absDocfolder) {
                    const rel = await RelativePath(absDocfolder, path)
                    table[i] = { ...row, [col]: rel }
                  } else {
                    table[i] = { ...row, [col]: path }
                  }
                }} class="ml-1 text-xs text-blue-600 hover:underline cursor-pointer">change</button>
              {:else if chooser[col] === 'currency'}
                <CurrencySelect bind:value={row[col]} {currencies} />
              {:else if chooser[col]}
                <select bind:value={row[col]} class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
                  {#each Object.entries(chooser[col]!) as [key, label]}
                    <option value={key}>{label}</option>
                  {/each}
                </select>
              {:else if detailPageFor(col)}
                {@render details(detailPageFor(col)!, i)}
              {:else if row[col] && typeof row[col] === 'object' && !Array.isArray(row[col]) && !(row[col] instanceof Date) && 'name' in row[col]}
                <span class="text-sm">{(row[col] as {name: string}).name}</span>
              {:else if Array.isArray(row[col])}
                <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{row[col].length}</span>
              {:else if col === 'fxrate' && currency && baseCurrency && row['valuta']}
                 
                <FxRateInput bind:value={row[col]} date={row['valuta']} {currency} {baseCurrency} />
              {:else if typeof row[col] === "number"}
                <input type="number" bind:value={row[col]} class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
              {:else if row[col] instanceof Date}
                <input type="date" value={row[col].toISOString().slice(0, 10)} oninput={(e) => { table[i] = { ...row, [col]: new Date(e.currentTarget.value) } }} class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
              {:else}
                <input type="text" bind:value={row[col]} class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
              {/if}
            </td>
          {/each}
          <td class="px-3 py-1.5">
            {#each detailPages as dp}
            {#if dp.key==undefined}
            {@render details(dp,i)}
            {/if}
            {/each}
            <NavButton action={() => deleteRow(i)} name="Delete" tooltip="Remove this row" variant="danger" />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<div class="mt-2">
  <NavButton action={addRow} name="Add" tooltip="Add a new row" variant="primary" />
</div>
