<script lang="ts">
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { getPortfolio } from '$lib/current.svelte'

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>


	<nav class="border-b border-gray-200 bg-white px-4 py-2">
		<div class="flex items-center justify-between">
			{#if page.url.pathname !== '/'}
			<a href="/" class="text-sm text-blue-600 hover:text-blue-800 hover:underline">&larr; back to overview</a>
{/if}
			{#if page.url.pathname !== '/settings'}
			<a href="/settings" class="text-sm text-blue-600 hover:text-blue-800 hover:underline">Settings</a>
						{/if}
		</div>
	</nav>

{@render children()}
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
<footer class="fixed inset-x-0 bottom-0 text-sm">
	
PF {JSON.stringify(getPortfolio())}
</footer>
