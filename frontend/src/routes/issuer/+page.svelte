<script lang="ts">
	import { page } from '$app/state'
	import Doc from '$lib/components/doc.svelte'
	import Editable from '$lib/components/editable.svelte'
	import CurrencySelect from '$lib/components/currencyselect.svelte'
	import CountrySelect from '$lib/components/countryselect.svelte'
	import * as m from '$lib/paraglide/messages'

	import {getPortfolio} from '$lib/current.svelte'
	import { AssetTypes, AssetUnits, defaultAssetType, defaultAssetUnit } from '$lib/portfolio'

	const pf = $derived(getPortfolio())
	const index = $derived(Number(page.url.searchParams.get('index')))
	const issuer = $derived(pf?.issuers[index])
</script>

<div class="mb-4 flex items-center gap-3">
	<h1 class="text-xl font-semibold">{issuer.name}</h1>
</div>
<div class="mb-6 grid grid-cols-2 gap-6">
	<div class="rounded-lg border border-gray-200 p-4 space-y-3">
		<label class="block text-sm">
			<span class="font-medium text-gray-700">{m.issuerNameLabel()}</span>
			<input type="text" bind:value={issuer.name} class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
		</label>
		<label class="block text-sm">
			<span class="font-medium text-gray-700">{m.issuerCurrencyLabel()}</span>
			<div class="mt-1">
				<CurrencySelect bind:value={issuer.currency} currencies={pf.currencies} />
			</div>
		</label>
	</div>
	<div class="rounded-lg border border-gray-200 p-4 space-y-3">
		<label class="block text-sm">
			<span class="font-medium text-gray-700">{m.issuerAddressLabel()}</span>
			<textarea rows="3" bind:value={issuer.address} class="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"></textarea>
		</label>
		<label class="block text-sm">
			<span class="font-medium text-gray-700">{m.issuerCountryLabel()}</span>
			<div class="mt-1">
				<CountrySelect bind:value={issuer.country} />
			</div>
		</label>
		<div class="text-sm">
			<span class="font-medium text-gray-700">{m.issuerDocumentFolderLabel()}</span>
			<div class="mt-1">
				<Doc bind:value={issuer.docfolder} folder={true} docroot={pf.docroot} issuerName={issuer.name} />
			</div>
		</div>
	</div>
</div>

<h2 class="text-lg font-semibold mb-2">{m.issuerAssetsTitle()}</h2>
<Editable detailPages={[{key:undefined, path:'/asset', indexParam:'assetIndex', extraParams:{issuerIndex: String(index)}}]} bind:table={issuer.assets} maker={()=>({
	name:'unnamed',
	type: defaultAssetType,
	unit: defaultAssetUnit,
	issuer: issuer,
	investments: [],
	revenues: [],
	valuations: [],
	commitments: [],
	metadata: {},
	doc: '',
})}
chooser={{ type: AssetTypes, unit: AssetUnits, doc: 'doc' }}
portfolioDir={pf.docroot}
displayColumns={['name', 'type', 'unit', 'doc', 'investments', 'revenues', 'valuations', 'commitments']}
narrowColumns={['investments', 'revenues', 'valuations', 'commitments']}
wideColumns={['type', 'unit']}
columnLabels={{ investments: 'Inv', revenues: 'Rev', valuations: 'Val', commitments: 'Com' }}
deleteAllowed={(asset) => {
	if (asset.investments.length > 0 || asset.revenues.length > 0 || asset.valuations.length > 0 || asset.commitments.length > 0) {
		return { allowed: false, reason: 'Cannot delete asset with associated data' }
	}
	return { allowed: true }
}}
/>
