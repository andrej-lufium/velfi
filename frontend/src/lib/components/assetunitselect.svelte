<script lang="ts">
	import { AssetUnits } from '$lib/portfolio'
	import Select from './select.svelte'

	let {
		value = $bindable(''),
	}: { value: string } = $props()

	const options = Object.entries(AssetUnits).map(([key, label]) => ({ value: key, label }))
</script>

<Select bind:value {options} />
