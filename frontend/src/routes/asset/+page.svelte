<script lang="ts">
	import { page } from '$app/state'
	import Editable from '$lib/components/editable.svelte'


  import {getPortfolio} from '$lib/current.svelte'
	import { AssetTypes, type Portfolio } from '$lib/portfolio'

  const index = $derived(Number(page.url.searchParams.get('index')))
const asset = $derived(getPortfolio()?.assets[index])

</script>

<h1>Asset {asset.name}</h1>
<div>{AssetTypes[asset.type]}</div>

<h2>Investments</h2>

<Editable bind:table={asset.investments} maker={()=>({
    valuta: new Date(),
  description: 'new investment',
  amount: 0,
  value: 0,
  reference: ''
})}/>

<h2>Revenues</h2>

<Editable bind:table={asset.revenues} maker={()=>({
    valuta: new Date(),
  description: 'new revenue',
  value: 0,
  reference: ''
})}/>

<h2>Commitments</h2>

<Editable bind:table={asset.commitments} maker={()=>({
    valuta: new Date(),
  description: 'new commitment',
  amount: 0,
  value: 0,
  reference: ''
})}/>



