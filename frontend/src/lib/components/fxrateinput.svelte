<script lang="ts">
import type { Currency } from '$lib/portfolio'

let {
  value = $bindable(0),
  date,
  currency,
  baseCurrency,
}: {
  value: number
  date: Date
  currency: Currency
  baseCurrency: Currency
} = $props()

let loading = $state(false)

async function fetchRate() {
  if (!date || !currency || !baseCurrency) return
  if (currency.iso === baseCurrency.iso) { value = 1; return }
  loading = true
  try {
    const d = date.toISOString().slice(0, 10)
    const resp = await fetch(`https://api.frankfurter.dev/v1/${d}?base=${currency.iso}&symbols=${baseCurrency.iso}`)
    if (!resp.ok) throw new Error(`${resp.status}`)
    const data = await resp.json()
    const rate = data.rates?.[baseCurrency.iso]
    if (rate != null) value = rate
  } finally {
    loading = false
  }
}
</script>

<span class="inline-flex items-center gap-1">
  <input type="number" bind:value step="any" class="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
  <span class="inline-flex flex-col items-center">
    <button onclick={fetchRate} disabled={loading} class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50" title="Fetch FX rate for {date?.toISOString().slice(0,10)}">
      {loading ? '...' : 'fx'}
    </button>
    <span class="text-[10px] leading-tight text-gray-400">{currency.iso}&rarr;{baseCurrency.iso}</span>
  </span>
</span>
