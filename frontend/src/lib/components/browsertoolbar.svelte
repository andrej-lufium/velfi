<script lang="ts">
	import {
		isDirty,
		lsListPortfolios,
		lsLoad,
		lsSave,
		lsSaveAs,
		lsDelete,
		loadSample,
		downloadPortfolio,
		uploadPortfolio,
		getBrowserPortfolioName,
	} from '$lib/current.svelte'

	// ── modal state ───────────────────────────────────────────────────────────
	let showLoadModal = $state(false)
	let showSaveAsModal = $state(false)
	let saveAsName = $state('')
	let uploadInput: HTMLInputElement

	// refreshed each time the load modal opens
	let lsKeys: string[] = $state([])

	function openLoadModal() {
		lsKeys = lsListPortfolios()
		showLoadModal = true
	}

	function load(name: string) {
		lsLoad(name)
		showLoadModal = false
	}

	function loadSamplePortfolio() {
		loadSample()
		showLoadModal = false
	}

	function openSaveAsModal() {
		saveAsName = getBrowserPortfolioName() ?? ''
		showSaveAsModal = true
	}

	function confirmSaveAs() {
		const name = saveAsName.trim()
		if (!name) return
		lsSaveAs(name)
		showSaveAsModal = false
	}

	function handleUpload(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0]
		if (!file) return
		uploadPortfolio(file)
		uploadInput.value = ''
	}

	const portfolioName = $derived(getBrowserPortfolioName())
	const dirty = $derived(isDirty())
</script>

<!-- ── Toolbar buttons ──────────────────────────────────────────────────────── -->
<div class="flex items-center gap-1">
	<button
		onclick={openLoadModal}
		title="Load portfolio from browser storage"
		class="rounded px-3 py-1 text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
	>Load</button>

	<button
		onclick={() => lsSave()}
		title={portfolioName ? `Save to "${portfolioName}"` : 'Save (use Save As first)'}
		disabled={!portfolioName}
		class="rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer
			{dirty && portfolioName ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
			{!portfolioName ? 'opacity-50 cursor-not-allowed' : ''}"
	>Save{dirty && portfolioName ? ' *' : ''}</button>

	<button
		onclick={openSaveAsModal}
		title="Save portfolio under a new name"
		class="rounded px-3 py-1 text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
	>Save As</button>

	<button
		onclick={downloadPortfolio}
		title="Download portfolio as .velfi file"
		class="rounded px-3 py-1 text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
	>Download</button>

	<!-- hidden file input for upload -->
	<input
		bind:this={uploadInput}
		type="file"
		accept=".velfi,application/json"
		class="hidden"
		onchange={handleUpload}
	/>
	<button
		onclick={() => uploadInput.click()}
		title="Upload a .velfi file"
		class="rounded px-3 py-1 text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
	>Upload</button>

	{#if portfolioName}
		<span class="text-xs text-gray-400 ml-1">{portfolioName}</span>
	{/if}
</div>

<!-- ── Load modal ────────────────────────────────────────────────────────────── -->
{#if showLoadModal}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		onclick={() => (showLoadModal = false)}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="bg-white rounded-lg shadow-xl w-80 p-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 class="text-sm font-semibold mb-3 text-gray-800">Load Portfolio</h2>

			{#if lsKeys.length === 0}
				<p class="text-xs text-gray-500 mb-4">No portfolios saved in browser storage yet.</p>
			{:else}
				<ul class="divide-y divide-gray-100 mb-3 max-h-60 overflow-y-auto">
					{#each lsKeys as key (key)}
						<li class="flex items-center justify-between py-1.5">
							<button
								onclick={() => load(key)}
								class="text-sm text-left text-blue-600 hover:underline flex-1 truncate cursor-pointer"
							>{key}</button>
							<button
								onclick={() => { lsDelete(key); lsKeys = lsListPortfolios() }}
								title="Delete"
								class="ml-2 text-xs text-red-400 hover:text-red-600 cursor-pointer"
							>✕</button>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="border-t border-gray-100 pt-2 mb-2">
				<button
					onclick={loadSamplePortfolio}
					class="text-sm text-left text-gray-500 hover:text-blue-600 hover:underline w-full truncate cursor-pointer italic"
				>Sample Portfolio</button>
			</div>
			<button
				onclick={() => (showLoadModal = false)}
				class="w-full rounded px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
			>Cancel</button>
		</div>
	</div>
{/if}

<!-- ── Save As modal ─────────────────────────────────────────────────────────── -->
{#if showSaveAsModal}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		onclick={() => (showSaveAsModal = false)}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="bg-white rounded-lg shadow-xl w-72 p-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 class="text-sm font-semibold mb-3 text-gray-800">Save As</h2>
			<input
				type="text"
				bind:value={saveAsName}
				placeholder="Portfolio name"
				onkeydown={(e) => { if (e.key === 'Enter') confirmSaveAs(); if (e.key === 'Escape') showSaveAsModal = false }}
				class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			/>
			<div class="flex gap-2">
				<button
					onclick={confirmSaveAs}
					disabled={!saveAsName.trim()}
					class="flex-1 rounded px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
				>Save</button>
				<button
					onclick={() => (showSaveAsModal = false)}
					class="flex-1 rounded px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
				>Cancel</button>
			</div>
		</div>
	</div>
{/if}
