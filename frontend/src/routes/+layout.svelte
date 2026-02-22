<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { currentLocaleState, getPortfolio, loadSettings } from '$lib/current.svelte'
	import NavButton from '$lib/components/navbutton.svelte'
	import { browser } from '$app/environment'
	import { GetVersion } from '$lib/wailsjs/go/main/App'
	import { onMount } from 'svelte'

	let { children } = $props();
	let version = $state('')

	onMount(() => {
	//if (browser) GetVersion().then(v => version = v)
		//loadSettings()

	})
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<!-- to re-render when locale changes -->
{#key currentLocaleState()}
<nav class="border-b border-gray-200 bg-white px-4 py-2">
	<div class="flex items-center justify-between">
		{#if page.url.pathname !== '/'}
			<NavButton action={() => goto('/')} name={m.navBackToOverview()} tooltip={m.navBackToOverviewTooltip()} />
		{:else}
			<span></span>
		{/if}
		{#if page.url.pathname !== '/settings'}
			<NavButton action={() => goto('/settings')} name={m.navSettings()} tooltip={m.navSettingsTooltip()} />
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
	<a href="/about" class="hover:text-gray-600 hover:underline">{m.appName()}</a> {version} &mdash; {m.appCopyright()}
</footer>
{/key}