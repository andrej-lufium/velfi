<script lang="ts">
	import { browser } from '$app/environment'
	import { GetVersion } from '$lib/wailsjs/go/main/App'
	import { BrowserOpenURL } from '$lib/wailsjs/runtime/runtime'
	import favicon from '$lib/assets/favicon.svg'

	let version = $state('')
	if (browser) GetVersion().then(v => version = v)
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
			onclick={() => BrowserOpenURL('https://github.com/andrej-lufium/velfi')}
			class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
		>
			github.com/andrej-lufium/velfi
		</button>
	</p>
</div>
