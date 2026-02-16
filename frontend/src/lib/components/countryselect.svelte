<script lang="ts">
	import { countries } from 'countries-list'

	let {
		value = $bindable(''),
	}: { value: string } = $props()

	const options = Object.entries(countries)
		.map(([code, data]) => ({ code, name: data.name }))
		.sort((a, b) => a.name.localeCompare(b.name))
</script>

<select bind:value class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
	<option value="">-- select --</option>
	{#each options as opt}
		<option value={opt.code}>{opt.code} - {opt.name}</option>
	{/each}
</select>
