<script lang="ts">
	import Editable from '$lib/components/editable.svelte'
	import NavButton from '$lib/components/navbutton.svelte'
	import { goto } from '$app/navigation'

  import {getFile, getPortfolio} from '$lib/current.svelte'
	import type { Portfolio } from '$lib/portfolio'

  let pf: Portfolio = $derived(getPortfolio())
</script>

<div class="flex items-center gap-3 mb-2">
  <h1 class="text-xl font-semibold">Portfolio</h1>
  <NavButton action={() => goto('/report')} name="View Report" tooltip="View the annual portfolio report" />
</div>
<div class="text-sm text-gray-500 mb-4">{getFile()??'unnamed'}</div>
<h2 class="text-lg font-semibold mb-2">Entities</h2>
<Editable detailPages={[{key:undefined,path:'/entity'}]} bind:table={pf.entities} maker={()=>({
  name:'unnamed',
  address: '',
  country: '',
  assets: [],
  currency: pf.baseCurrency,
})}
currencies={pf.currencies}
chooser={{ currency: 'currency', country: 'country' }}
displayColumns={['name', 'country', 'currency', 'assets']}
narrowColumns={['assets']}
wideColumns={['currency']}
columnLabels={{}}
/>
