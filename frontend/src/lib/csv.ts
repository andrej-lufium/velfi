import { SaveCsvDialog, WriteFile } from '$lib/wailsjs/go/main/App'

function csvValue(v: unknown): string {
	if (v === null || v === undefined) return ''
	const s = String(v)
	if (s.includes(',') || s.includes('"') || s.includes('\n')) {
		return '"' + s.replace(/"/g, '""') + '"'
	}
	return s
}

function sanitize(name: string): string {
	return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

export async function exportCsv(defaultName: string, headers: string[], rows: Record<string, unknown>[], keys: string[]) {
	const filename = sanitize(defaultName) + '.csv'
	const path = await SaveCsvDialog(filename)
	if (!path) return

	const lines: string[] = []
	lines.push(headers.map(csvValue).join(','))
	for (const row of rows) {
		lines.push(keys.map(k => csvValue(row[k])).join(','))
	}

	await WriteFile(path, lines.join('\n'))
}
