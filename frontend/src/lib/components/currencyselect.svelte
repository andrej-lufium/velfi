<script lang="ts">
	import type { Currency } from '$lib/portfolio'
	let {
		value = $bindable(),
		currencies,
		id
	}: { value: Currency; currencies: Currency[]; id?: string } = $props()
</script>

<select {id} bind:value>
	{#each currencies as currency}
		<option value={currency}>{currency.iso}</option>
	{/each}
</select>
