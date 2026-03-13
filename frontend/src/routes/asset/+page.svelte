<script lang="ts">
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import Editable from '$lib/components/editable.svelte'
	import NavButton from '$lib/components/navbutton.svelte'

	import AssetTypeSelect from '$lib/components/assettypeselect.svelte'
	import AssetUnitSelect from '$lib/components/assetunitselect.svelte'
	import {getPortfolio} from '$lib/current.svelte'
	import { AssetMetadataFieldDefs, AssetTypeMetadataFields } from '$lib/portfolio'
	import * as m from '$lib/paraglide/messages'

	import { getCountryData, getCountryDataList, getEmojiFlag } from 'countries-list'

	const pf = $derived(getPortfolio())
	const entityIndex = $derived(Number(page.url.searchParams.get('entityIndex')))
	const assetIndex = $derived(Number(page.url.searchParams.get('assetIndex')))
	const entity = $derived(pf?.entities[entityIndex])
	const asset = $derived(entity?.assets[assetIndex])
	const isForeignCurrency = $derived(asset && pf && entity.currency.iso !== pf.baseCurrency.iso)
	const fx = $derived(isForeignCurrency ? { fxrate: 0 as number | undefined } : {})
</script>

<div class="mb-4 flex items-center gap-3">
	<NavButton action={() => goto(`/entity?index=${entityIndex}`)} name="Back to Entity" tooltip="Return to entity detail page" />
	<h1 class="text-xl font-semibold">{asset.name}</h1>
	<NavButton action={() => goto(`/asset/report?entityIndex=${entityIndex}&assetIndex=${assetIndex}`)} name="View Report" tooltip="View periodic report for this asset" />
</div>

<div class="mb-6 grid grid-cols-2 gap-6">
	<div class="rounded-lg border border-gray-200 p-4 space-y-3">
		<label class="block text-sm">
			<span class="font-medium text-gray-700">Name</span>
			<input type="text" bind:value={asset.name} class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label class="block text-sm">
				<span class="font-medium text-gray-700">Type</span>
				<div class="mt-1"><AssetTypeSelect bind:value={asset.type} /></div>
			</label>
			<label class="block text-sm">
				<span class="font-medium text-gray-700">Unit</span>
				<div class="mt-1"><AssetUnitSelect bind:value={asset.unit} /></div>
			</label>
		</div>
	</div>
	<div class="rounded-lg border border-gray-200 p-4 space-y-3">
		<div class="flex items-center gap-2 text-sm">
			<span class="font-medium text-gray-700">Entity:</span>
			<span>{entity.name}</span>
			<NavButton action={() => goto(`/entity?index=${entityIndex}`)} name="Go to Entity" tooltip="Open entity detail page" />
		</div>
		<div class="text-sm text-gray-500">
			<span class="font-medium text-gray-700">Currency:</span> {entity.currency.iso}
		</div>
		<div class="text-sm text-gray-500">
			<span class="font-medium text-gray-700">Country:</span> {getCountryData(entity.country as keyof typeof getCountryDataList)?.name ?? entity.country} {getEmojiFlag(entity.country as keyof typeof getCountryDataList)}
		</div>
	</div>
</div>

{#if AssetTypeMetadataFields[asset.type]?.length > 0}
<details class="mb-6 rounded-lg border border-gray-200">
	<summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 select-none">{m.assetDetailsTitle()}</summary>
	<div class="grid grid-cols-2 gap-3 px-4 pb-4 pt-2">
		{#each AssetTypeMetadataFields[asset.type] as fieldKey (fieldKey)}
			{@const def = AssetMetadataFieldDefs[fieldKey]}
			{#if def}
				<label class="block text-sm">
					<span class="font-medium text-gray-700">{def.label}</span>
					{#if def.type === 'boolean'}
						<div class="mt-1">
							<input type="checkbox" bind:checked={asset.metadata[fieldKey] as boolean} class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
						</div>
					{:else if def.type === 'date'}
						<input type="date"
							value={asset.metadata[fieldKey] ? String(asset.metadata[fieldKey]).slice(0, 10) : ''}
							oninput={(e) => { asset.metadata[fieldKey] = e.currentTarget.value }}
							class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
					{:else if def.type === 'number' || def.type === 'percent' || def.type === 'currency'}
						<input type="number" step="any"
							bind:value={asset.metadata[fieldKey]}
							class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
					{:else}
						<input type="text"
							bind:value={asset.metadata[fieldKey]}
							class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
					{/if}
				</label>
			{/if}
		{/each}
	</div>
</details>
{/if}

<h2 class="text-lg font-semibold mt-6 mb-1">Investments</h2>
<p class="text-xs text-gray-500 mb-2 max-w-2xl">
	Investments represent cash flows into or out of the asset, e.g. purchases, sales, capital calls, distributions, etc. They differ from revenues in that they affect the invested capital and units of the asset, while revenues are returns generated by the asset without changing the invested capital.
	Negative values represent investment cash flows (e.g. purchases, capital calls) while positive values represent cash flows from the asset (e.g. sales, repayments).
</p>

<Editable bind:table={asset.investments} maker={()=>({
	valuta: new Date(),
	description: 'new investment',
	units: 0,
	value: 0,
	...fx,
	doc: ''
})}
chooser={{ doc: 'doc' }}
docfolder={entity.docfolder}
portfolioDir={pf.docroot}
currency={entity.currency}
baseCurrency={pf.baseCurrency}
valueColumns={['value']}
/>

<h2 class="text-lg font-semibold mt-8 mb-1">Revenues</h2>
<p class="text-xs text-gray-500 mb-2 max-w-2xl">
	Revenues represent returns generated by the asset without changing the invested capital. They differ from investments in that they do not affect the invested capital and units of the asset.
	Negative values represent expenses for the asset while positive values represent cash flows from the asset (e.g. dividends, interest payments).
</p>

<Editable bind:table={asset.revenues} maker={()=>({
	valuta: new Date(),
	description: 'new revenue',
	value: 0,
	...fx,
	doc: ''
})}
chooser={{ doc: 'doc' }}
docfolder={entity.docfolder}
portfolioDir={pf.docroot}
currency={entity.currency}
baseCurrency={pf.baseCurrency}
valueColumns={['value']}
/>

<h2 class="text-lg font-semibold mt-8 mb-1">Commitments</h2>
<p class="text-xs text-gray-500 mb-2 max-w-2xl">
	Commitments represent future cash flows related to the asset, e.g. undrawn capital commitments for private equity investments. They differ from investments in that they represent obligations for future cash flows, while investments represent actual cash flows that have already occurred.
	Negative values represent outgoing cash flow obligations (e.g. undrawn capital commitments) while positive values represent incoming cash flow obligations (e.g. expected repayments) or reduction of obligations (e.g. released commitments).
</p>
<Editable bind:table={asset.commitments} maker={()=>({
	valuta: new Date(),
	description: 'new commitment',
	units: 0,
	value: 0,
	...fx,
	doc: ''
})}
chooser={{ doc: 'doc' }}
docfolder={entity.docfolder}
portfolioDir={pf.docroot}
currency={entity.currency}
baseCurrency={pf.baseCurrency}
valueColumns={['value']}
/>

<h2 class="text-lg font-semibold mt-8 mb-1">Valuations</h2>
<p class="text-xs text-gray-500 mb-2 max-w-2xl">
	Valuations represent the value of the asset at specific points in time. They are used to track the performance of the asset and calculate returns. Valuations can be based on market prices, appraisals, or other valuation methods depending on the type of asset. If there are no valuations given, then the last purchase or sale price is used as a proxy for the asset value.
</p>
<Editable bind:table={asset.valuations} maker={()=>({
	date: new Date(),
	unitPrice: 0,
	doc: ''
})}
chooser={{ doc: 'doc' }}
docfolder={entity.docfolder}
portfolioDir={pf.docroot}
currency={entity.currency}
baseCurrency={pf.baseCurrency}
valueColumns={['unitPrice']}
/>
