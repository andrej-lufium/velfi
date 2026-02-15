<script lang="ts" generics="T extends Record<string, any>">
import { goto } from '$app/navigation'
import CurrencySelect from '$lib/components/currencyselect.svelte'
import type { Currency } from '$lib/portfolio'

type DetailPage = { key: keyof T | undefined; path: string }

type Chooser = { [K in keyof T]?: 'currency' | Record<string, string> }

let {
  table = $bindable([]),
  maker,
  detailPages = [],
  chooser = {} as Chooser,
  currencies = [],
}: { table: T[] | undefined; maker: () => T;
  detailPages?: DetailPage[];
  chooser?: Chooser;
  currencies?: Currency[];
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

function goToDetail(path: string, index: number) {
  goto(`${path}?index=${index}`)
}

const columns = $derived(table.length > 0 ? Object.keys(table[0]) : Object.keys(maker()))
</script>

{#snippet details(path:string, i: number)}
      <button onclick={() => goToDetail(path, i)} class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-sm font-medium">details</button>
{/snippet}

<div class="overflow-x-auto rounded-lg border border-gray-200">
  <table class="w-full text-sm">
    <thead>
      <tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
        {#each columns as col}
          <th class="px-3 py-2">{col}</th>
        {/each}
        <th class="px-3 py-2 w-0"></th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#each table as row, i}
        <tr class="hover:bg-gray-50 transition-colors">
          {#each columns as col}
            <td class="px-3 py-1.5">
              {#if chooser[col] === 'currency'}
                <CurrencySelect bind:value={row[col]} {currencies} />
              {:else if chooser[col]}
                <select bind:value={row[col]} class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
                  {#each Object.entries(chooser[col]!) as [key, label]}
                    <option value={key}>{label}</option>
                  {/each}
                </select>
              {:else if detailPageFor(col)}
                {@render details(detailPageFor(col)!.path, i)}
              {:else if Array.isArray(row[col])}
                <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{row[col].length}</span>
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
            {@render details(dp.path,i)}
            {/if}
            {/each}
            <button onclick={() => deleteRow(i)} class="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer">Delete</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<button onclick={addRow} class="mt-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer">Add</button>
