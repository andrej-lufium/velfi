<script lang="ts">
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import Editable from '$lib/components/editable.svelte'
	import NavButton from '$lib/components/navbutton.svelte'

	import {getPortfolio} from '$lib/current.svelte'
	import { AssetTypes, AssetUnits } from '$lib/portfolio'

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
				<select bind:value={asset.type} class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
					{#each Object.entries(AssetTypes) as [key, label]}
						<option value={key}>{label}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm">
				<span class="font-medium text-gray-700">Unit</span>
				<select bind:value={asset.unit} class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
					{#each Object.entries(AssetUnits) as [key, label]}
						<option value={key}>{label}</option>
					{/each}
				</select>
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
			<span class="font-medium text-gray-700">Country:</span> {entity.country}
		</div>
	</div>
</div>

<h2 class="text-lg font-semibold mt-6 mb-2">Investments</h2>

<Editable bind:table={asset.investments} maker={()=>({
	valuta: new Date(),
	description: 'new investment',
	units: 0,
	value: 0,
	...fx,
	doc: ''
})}
chooser={{ doc: 'doc' }}

portfolioDir={pf.docroot}
currency={entity.currency}
baseCurrency={pf.baseCurrency}
valueColumns={['value']}
/>

<h2 class="text-lg font-semibold mt-8 mb-2">Revenues</h2>

<Editable bind:table={asset.revenues} maker={()=>({
	valuta: new Date(),
	description: 'new revenue',
	value: 0,
	...fx,
	doc: ''
})}
chooser={{ doc: 'doc' }}

portfolioDir={pf.docroot}
currency={entity.currency}
baseCurrency={pf.baseCurrency}
valueColumns={['value']}
/>

<h2 class="text-lg font-semibold mt-8 mb-2">Commitments</h2>

<Editable bind:table={asset.commitments} maker={()=>({
	valuta: new Date(),
	description: 'new commitment',
	units: 0,
	value: 0,
	...fx,
	doc: ''
})}
chooser={{ doc: 'doc' }}

portfolioDir={pf.docroot}
currency={entity.currency}
baseCurrency={pf.baseCurrency}
valueColumns={['value']}
/>

<h2 class="text-lg font-semibold mt-8 mb-2">Valuations</h2>

<Editable bind:table={asset.valuations} maker={()=>({
	date: new Date(),
	unitPrice: 0,
	doc: ''
})}
chooser={{ doc: 'doc' }}

portfolioDir={pf.docroot}
currency={entity.currency}
baseCurrency={pf.baseCurrency}
valueColumns={['unitPrice']}
/>
