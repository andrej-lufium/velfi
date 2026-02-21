<script lang="ts">
	import { FileExists, OpenExternal, ChooseDocument, ChooseOrCreateFolder } from '$lib/wailsjs/go/main/App'

	let {
		value = $bindable(''),
		folder = false,
		docroot = '',
		docfolder = '',
		entityName = '',
	}: {
		value: string
		folder?: boolean
		docroot: string
		docfolder?: string
		entityName?: string
	} = $props()

	let exists: boolean | null = $state(null)

	function resolve(path: string): string {
		if (!path) return ''
		if (path.startsWith('/')) return path
		if (folder) return [docroot, path].filter(Boolean).join('/')
		const base = docfolder || docroot
		return base ? [base, path].filter(Boolean).join('/') : path
	}

	const resolvedPath = $derived(resolve(value))

	$effect(() => {
		if (!resolvedPath) {
			exists = null
			return
		}
		FileExists(resolvedPath).then((e) => (exists = e))
	})

	function tooltipText(): string {
		if (!value) return ''
		if (exists === false) return `not found: ${value}`
		return value
	}

	async function handleOpen() {
		if (!resolvedPath) return
		await OpenExternal(resolvedPath)
	}

	async function handleChoose() {
		if (folder) {
			const result = await ChooseOrCreateFolder(docroot, value, entityName)
			if (result !== undefined) value = result
		} else {
			const result = await ChooseDocument(docroot, docfolder)
			if (result) value = result
		}
	}
</script>

<span class="inline-flex items-center gap-1">
	{#if value}
		<button
			onclick={handleOpen}
			class="cursor-pointer text-base leading-none {exists === false ? 'grayscale opacity-50' : ''}"
			title={tooltipText()}
		>
			{folder ? '📁' : '📄'}
		</button>
	{/if}
	<button
		onclick={handleChoose}
		class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-gray-200 transition-colors cursor-pointer"
		title={value ? `Change ${folder ? 'folder' : 'document'}` : `Set ${folder ? 'folder' : 'document'}`}
	>
		{value ? 'change' : 'set'}
	</button>
</span>
