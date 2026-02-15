<script lang="ts">
	import Editable from '$lib/components/editable.svelte'


  import {getFile, getPortfolio} from '$lib/current.svelte'
	import { AssetTypes, AssetUnits, defaultAssetType, defaultAssetUnit, type Portfolio } from '$lib/portfolio'

  let pf: Portfolio = $derived(getPortfolio())
</script>

<h1>Welcome to Velfi</h1>

<h1>Portfolio</h1>
<div>{getFile()??'unnamed'}</div>
<h2>Assets</h2>
<Editable detailPages={[{key:undefined,path:'/asset'}]} bind:table={pf.assets} maker={()=>({
  name:'unnamed',
  currency: pf.baseCurrency,
  unit: defaultAssetUnit,
  type: defaultAssetType,
  documentFolder: '',
  investments: [],
  revenues: [],
  valuations: [],
  commitments: []
})}
currencies={pf.currencies}
chooser={{ type: AssetTypes, unit: AssetUnits, currency: 'currency' }}
/>
