<script lang="ts" module>

	declare const __APP_VERSION__: string


</script>
<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { GetVersion } from '$lib/wailsjs/go/main/App'
	import { BrowserOpenURL, Environment } from '$lib/wailsjs/runtime/runtime'
	import favicon from '$lib/assets/favicon.svg'
	import { AssetTypeNames, AssetTypeMetadataFields, AssetMetadataFieldDefs } from '$lib/portfolio'
	import { isWailsEnv } from '$lib/current.svelte'


	let version = $state('')
	if (browser) {
		if (isWailsEnv()) {
			GetVersion().then(v => version = v)
		} else {
			version = __APP_VERSION__
		}
	}

	function openURL(url: string) {
		if (isWailsEnv()) {
			BrowserOpenURL(url)
		} else {
			goto(url)
		}
	}
</script>

<div class="flex items-center gap-3 mb-4">
	<img src={favicon} alt="Velfi" class="w-10 h-10" />
	<h1 class="text-xl font-semibold">About Velfi</h1>
</div>

<div class="max-w-md space-y-4 text-sm text-gray-700">
	<p>
		<span class="font-medium">Version:</span> {version || '...'}
	</p>
	<p>
		Velfi is a desktop application for managing investment portfolios.
	</p>
	<p>
		Copyright 2026 lufium gmbh<br />
		Licensed under the Apache License, Version 2.0
	</p>
	<p>
		<button
			onclick={() => openURL('https://github.com/andrej-lufium/velfi')}
			class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
		>
			github.com/andrej-lufium/velfi
		</button>
	</p>
</div>

<h2 class="text-lg font-semibold mt-8 mb-3">Supported Asset Types</h2>
<div class="max-w-2xl overflow-x-auto rounded-lg border border-gray-200">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
				<th class="px-4 py-2">Type</th>
				<th class="px-4 py-2">Key Fields</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			{#each Object.entries(AssetTypeNames) as [key, name] (key)}
				{@const fields = AssetTypeMetadataFields[key as keyof typeof AssetTypeMetadataFields]}
				<tr class="hover:bg-gray-50">
					<td class="px-4 py-2 font-medium text-gray-800">{name}</td>
					<td class="px-4 py-2 text-gray-500">
						{#if fields.length > 0}
							{fields.map(f => AssetMetadataFieldDefs[f]?.label).filter(Boolean).join(', ')}
						{:else}
							<span class="text-gray-400">—</span>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<h2 class="text-lg font-semibold mt-8 mb-3">Environment</h2>
{#if isWailsEnv()}
	{#await Environment() then env}
		<div class="max-w-md space-y-2 text-sm text-gray-700">
			<p><span class="font-medium">Platform:</span> {env.platform}</p>
			<p><span class="font-medium">Arch:</span> {env.arch}</p>
			<p><span class="font-medium">Build type:</span> {env.buildType}</p>
		</div>
	{:catch error}
		<p class="text-sm text-red-500">Failed to load environment info: {error.message}</p>
	{/await}
{:else}
	<div class="max-w-md space-y-2 text-sm text-gray-700">
		<p><span class="font-medium">Platform:</span> Web</p>
		<p><span class="font-medium">Build type:</span> {import.meta.env.MODE}</p>
	</div>
{/if}
