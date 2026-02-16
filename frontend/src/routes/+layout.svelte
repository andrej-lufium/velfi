<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { getPortfolio } from '$lib/current.svelte'
	import NavButton from '$lib/components/navbutton.svelte'
	import { browser } from '$app/environment'
	import { GetVersion } from '$lib/wailsjs/go/main/App'

	let { children } = $props();
	let version = $state('')
	if (browser) GetVersion().then(v => version = v)
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="border-b border-gray-200 bg-white px-4 py-2">
	<div class="flex items-center justify-between">
		{#if page.url.pathname !== '/'}
			<NavButton action={() => goto('/')} name="Back to Overview" tooltip="Return to portfolio overview" />
		{:else}
			<span></span>
		{/if}
		{#if page.url.pathname !== '/settings'}
			<NavButton action={() => goto('/settings')} name="Settings" tooltip="Open application settings" />
		{/if}
	</div>
</nav>

<div class="p-6">
	{@render children()}
</div>
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
<footer class="fixed inset-x-0 bottom-0 px-4 py-1 text-xs text-gray-400 text-center">
	<a href="/about" class="hover:text-gray-600 hover:underline">Velfi</a> {version} &mdash; Copyright 2026 lufium gmbh
</footer>
