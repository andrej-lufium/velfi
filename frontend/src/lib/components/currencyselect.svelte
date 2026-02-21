<script lang="ts">
	import type { Currency } from '$lib/portfolio'
	import Select from './select.svelte'

	let {
		value = $bindable(),
		currencies,
		id
	}: { value: Currency; currencies: Currency[]; id?: string } = $props()


	const options = $derived(currencies.map(c => ({ value: c.iso, label: c.iso })))
</script>

<Select bind:value={()=>value.iso,(v)=>{
	const found = currencies.find(c => c.iso === v)
	if (found) value = found
}} {options} {id}  />
