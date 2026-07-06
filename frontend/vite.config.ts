import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Default to a Wails/static build. Only Vercel deploys opt out: VERCEL is set
// on Vercel infra, and the CI deploy job sets BUILD_TARGET=vercel explicitly.
// Keep this in sync with the adapter selection in svelte.config.js.
const isVercel = process.env.VERCEL === '1' || process.env.BUILD_TARGET === 'vercel'

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__WAILS__: JSON.stringify(!isVercel),
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ["localStorage", "preferredLanguage", "url", "baseLocale"],

			disableAsyncLocalStorage: true
		})
	],
	test: {
		expect: { requireAssertions: true },
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
})
