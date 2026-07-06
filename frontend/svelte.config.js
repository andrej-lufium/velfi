//import adapter from '@sveltejs/adapter-static';
import adapterVercel from '@sveltejs/adapter-vercel';
import adapterStatic from '@sveltejs/adapter-static';

// Default to the static adapter (Wails / local desktop builds need a real
// index.html emitted into frontend/build). Only switch to the Vercel adapter
// when actually deploying to Vercel — VERCEL is set on Vercel infra, and the
// CI deploy job sets BUILD_TARGET=vercel explicitly.
const isVercel = process.env.VERCEL === '1' || process.env.BUILD_TARGET === 'vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: isVercel ? adapterVercel() : adapterStatic(),
		prerender: {
			crawl: false,
			handleUnseenRoutes: 'warn',
			handleHttpError: 'warn'
		}
	}
};

export default config;
