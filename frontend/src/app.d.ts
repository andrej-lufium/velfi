// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	const __WAILS__: boolean
	const __APP_VERSION__: string

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			row?: Record<string, unknown>
		}
		// interface Platform {}
	}
}

export {};
