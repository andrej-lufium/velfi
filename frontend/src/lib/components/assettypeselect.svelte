<script lang="ts">
	import { AssetTypes } from '$lib/portfolio'
	import Select from './select.svelte'

	let {
		value = $bindable(''),
	}: { value: string } = $props()

	const options = Object.entries(AssetTypes).map(([key, label]) => ({ value: key, label }))
</script>

<Select bind:value {options} />
