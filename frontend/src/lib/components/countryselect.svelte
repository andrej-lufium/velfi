<script lang="ts">
	import { countries } from 'countries-list'
	import Select from './select.svelte'

	let {
		value = $bindable(''),
	}: { value: string } = $props()

	const options = Object.entries(countries)
		.map(([code, data]) => ({ value: code, label: `${code} - ${data.name}` }))
		.sort((a, b) => a.label.localeCompare(b.label))
</script>

<Select bind:value {options} placeholder="-- select --" />
