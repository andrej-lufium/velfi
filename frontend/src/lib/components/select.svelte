<script lang="ts">
	let {
		value = $bindable(''),
		options,
		placeholder = '',
		id,
		onchange
	}: {
		value: string
		options: { value: string; label: string }[]
		placeholder?: string
		id?: string
		onchange?: (value: string) => void
	} = $props()

	function handleChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value
		if (onchange) {
			onchange(val)
		} else {
			value = val
		}
	}
</script>

<select {id} {value} onchange={handleChange} class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
	{#if placeholder}
		<option value="">{placeholder}</option>
	{/if}
	{#each options as opt}
		<option value={opt.value}>{opt.label}</option>
	{/each}
</select>
