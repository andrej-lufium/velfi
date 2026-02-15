<script lang="ts">

  import {getFile, getPortfolio} from '$lib/current.svelte'
	import Editable from "$lib/components/editable.svelte"
	import type { Portfolio } from "$lib/portfolio"


let pf: Portfolio = $state(getPortfolio())

</script>

<div>
  <label for="baseCurrency">Base Currency:</label>
  <select id="baseCurrency" bind:value={pf.baseCurrency}>
    {#each pf.currencies as currency}
      <option value={currency}>{currency.iso}</option>
    {/each}
  </select>
</div>

current File: {getFile()}

<h1>Currencies</h1>

<Editable detailPages={[{key:'rates',path:'/settings/rate'}]} bind:table={pf.currencies} maker={()=>({iso:'',rates:[]})}/>
