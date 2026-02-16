<script lang="ts">
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import Editable from '$lib/components/editable.svelte'
	import CurrencySelect from '$lib/components/currencyselect.svelte'
	import CountrySelect from '$lib/components/countryselect.svelte'
	import NavButton from '$lib/components/navbutton.svelte'

	import {getPortfolio} from '$lib/current.svelte'
	import { AssetTypes, AssetUnits, defaultAssetType, defaultAssetUnit } from '$lib/portfolio'

	const pf = $derived(getPortfolio())
	const index = $derived(Number(page.url.searchParams.get('index')))
	const entity = $derived(pf?.entities[index])
</script>

<div class="mb-4 flex items-center gap-3">
	<h1 class="text-xl font-semibold">{entity.name}</h1>
</div>

<div class="mb-6 grid grid-cols-2 gap-6">
	<div class="rounded-lg border border-gray-200 p-4 space-y-3">
		<label class="block text-sm">
			<span class="font-medium text-gray-700">Name</span>
			<input type="text" bind:value={entity.name} class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
		</label>
		<label class="block text-sm">
			<span class="font-medium text-gray-700">Currency</span>
			<div class="mt-1">
				<CurrencySelect bind:value={entity.currency} currencies={pf.currencies} />
			</div>
		</label>
	</div>
	<div class="rounded-lg border border-gray-200 p-4 space-y-3">
		<label class="block text-sm">
			<span class="font-medium text-gray-700">Address</span>
			<textarea rows="3" bind:value={entity.address} class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"></textarea>
		</label>
		<label class="block text-sm">
			<span class="font-medium text-gray-700">Country</span>
			<div class="mt-1">
				<CountrySelect bind:value={entity.country} />
			</div>
		</label>
	</div>
</div>

<h2 class="text-lg font-semibold mb-2">Assets</h2>
<Editable detailPages={[{key:undefined, path:'/asset', indexParam:'assetIndex', extraParams:{entityIndex: String(index)}}]} bind:table={entity.assets} maker={()=>({
	name:'unnamed',
	type: defaultAssetType,
	unit: defaultAssetUnit,
	entity: entity,
	investments: [],
	revenues: [],
	valuations: [],
	commitments: []
})}
chooser={{ type: AssetTypes, unit: AssetUnits }}
portfolioDir={pf.docroot}
displayColumns={['name', 'type', 'unit', 'investments', 'revenues', 'valuations', 'commitments']}
narrowColumns={['investments', 'revenues', 'valuations', 'commitments']}
wideColumns={['type', 'unit']}
columnLabels={{ investments: 'Inv', revenues: 'Rev', valuations: 'Val', commitments: 'Com' }}
/>
