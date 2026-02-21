<script lang="ts">
	import Editable from '$lib/components/editable.svelte'
	import NavButton from '$lib/components/navbutton.svelte'
	import { goto } from '$app/navigation'
	import * as m from '$lib/paraglide/messages'

  import {getFile, getPortfolio} from '$lib/current.svelte'
	import type { Portfolio } from '$lib/portfolio'

  let pf: Portfolio = $derived(getPortfolio())
</script>

<div class="flex items-center gap-3 mb-2">
  <h1 class="text-xl font-semibold">{m.homeTitle()}</h1>
  <NavButton action={() => goto('/report')} name={m.homeViewReport()} tooltip={m.homeViewReportTooltip()} />
</div>
<div class="text-sm text-gray-500 mb-4">{getFile()??m.homeUnnamedFile()}</div>
<h2 class="text-lg font-semibold mb-2">{m.homeEntitiesTitle()}</h2>
<Editable detailPages={[{key:undefined,path:'/entity'}]} bind:table={pf.entities} maker={()=>({
  name:m.homeUnnamedFile(),
  address: '',
  country: '',
  docfolder: '',
  assets: [],
  currency: pf.baseCurrency,
})}
currencies={pf.currencies}
chooser={{ currency: 'currency', country: 'country' }}
displayColumns={['name', 'country', 'currency', 'assets']}
narrowColumns={['assets']}
wideColumns={['currency']}
columnLabels={{}}
deleteAllowed={(entity) => {
  if (entity.assets.length > 0) {
    return { allowed: false, reason: m.entityDeleteError() }
  }
  return { allowed: true }
}}
/>
