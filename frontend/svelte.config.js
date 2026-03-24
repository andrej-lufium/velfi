//import adapter from '@sveltejs/adapter-static';
import adapterVercel from '@sveltejs/adapter-vercel';
import adapterStatic from '@sveltejs/adapter-static';

const isWails = process.env.BUILD_TARGET === 'wails';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: isWails ? adapterStatic() : adapterVercel(),
		prerender: {
			crawl: false,
			handleUnseenRoutes: 'warn',
			handleHttpError: 'warn'
		}
	}
};

export default config;
