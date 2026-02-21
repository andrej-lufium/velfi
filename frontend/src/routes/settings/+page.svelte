<script lang="ts">
	import { getAutosave, getFile, getPortfolio, setAutosave, setCurrentLocale, saveSettings } from '$lib/current.svelte'
	import Editable from '$lib/components/editable.svelte'
	import type { Portfolio } from '$lib/portfolio'
	import {  locales, getLocale, setLocale } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'
	import { goto, invalidateAll } from '$app/navigation'
	import { LogInfo } from '$lib/wailsjs/runtime/runtime'
	import { page } from '$app/state'
	import { tick } from 'svelte'

	let pf: Portfolio = $state(getPortfolio())
	let locale = $state(getLocale())
	//let locale = $state('')
	let autosave = $state(getAutosave())

	async function handleSaveSettings() {
		setAutosave(autosave)
		setCurrentLocale(locale)
		await saveSettings()
	}

  $effect( () => {
    
   locale
    LogInfo(`Locale changed to ${locale}`)
    setLocale(locale)
 /*   tick().then(() => {
    })
*/  })
</script>

{#key locale}
<div>
	<label for="portfolioName" class="text-sm font-medium text-gray-700">{m.settingsPortfolioName()}</label>
	<input id="portfolioName" type="text" bind:value={pf.name} class="ml-2 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
</div>

<div class="mt-3">
	<label for="baseCurrency" class="text-sm font-medium text-gray-700">{m.settingsBaseCurrency()}</label>
	<select id="baseCurrency" bind:value={pf.baseCurrency} class="ml-2 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
		{#each pf.currencies as currency}
			<option value={currency}>{currency.iso}</option>
		{/each}
	</select>
</div>

<div class="mt-3">
  Current: {locale}

	<label for="locale" class="text-sm font-medium text-gray-700">Language:</label>
  <select bind:value={locale} class="ml-2 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
		{#each locales as loc}
			<option value={loc}>{loc}</option>
		{/each}
	</select>

</div>

<div class="mt-3">
	<label class="inline-flex items-center gap-2 text-sm">
		<input
			type="checkbox"
			bind:checked={autosave}
			class="rounded border-gray-300"
		/>
		{m.settingsAutosave()}
	</label>
</div>

<div class="mt-4">
	<button
		onclick={handleSaveSettings}
		class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
	>
		Save Settings
	</button>
</div>

<div class="mt-4 text-sm text-gray-500">
	{m.settingsCurrentFile()} {getFile()}
</div>

<h1 class="mt-6 text-lg font-semibold mb-2">{m.settingsCurrenciesTitle()}</h1>

<Editable
	detailPages={[{ key: 'rates', path: '/settings/rate' }]}
	bind:table={pf.currencies}
	maker={() => ({ iso: '', rates: [] })}
  deleteAllowed={(currency) => {
    if (currency.rates.length > 0) {
      return { allowed: false, reason: m.entityDeleteErrorRates() }
    }
    if (pf.baseCurrency.iso === currency.iso) {
      return { allowed: false, reason: m.entityDeleteErrorBaseCurrency() }
    }
    return { allowed: true }
  }}
/>

{/key}