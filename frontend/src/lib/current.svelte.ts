import { browser } from '$app/environment'
import { goto } from '$app/navigation'
//import { goto } from "$app/navigation"
import {
	deserializePortfolio,
	serializePortfolio,
	defaultTaxHiddenColumns,
	type Portfolio
} from './portfolio'
import {
	ReadFile,
	WriteFile,
	OpenFileDialog,
	SaveFileDialog,
	ConfirmDialog,
	DirOfFile,
	ResetQuit,
	LoadConfig,
	SaveConfig,
	GetInitialFileName
} from './wailsjs/go/main/App'
import { main } from './wailsjs/go/models'
import { EventsOn, LogError, LogInfo, Quit, WindowSetTitle } from './wailsjs/runtime/runtime'
import { setLocale, locales, getLocale } from '$lib/paraglide/runtime'

import samplePortfolioRaw from '../../../examples/sample.velfi?raw'

type Locale = (typeof locales)[number]

const defaultPortfolio: Portfolio = {
	docroot: '',
	name: 'My Portfolio',
	issuers: [],
	baseCurrency: { iso: 'CHF', rates: [] },
	currencies: [{ iso: 'CHF', rates: [] }],
	taxHiddenColumns: [...defaultTaxHiddenColumns]
}
defaultPortfolio.baseCurrency = defaultPortfolio.currencies[0]

let currentPortfolio: Portfolio = $state(defaultPortfolio)
let currentFile: string | undefined = $state()
let lastSavedJson: string = $state(serializePortfolio(defaultPortfolio))
let autosave: boolean = $state(true)

export function isWailsEnv(): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const hasGo = browser && (window as any)['go'] && (window as any)['go']['main'] && (window as any)['go']['main']['App']
	return browser && hasGo != undefined
}
export function getPortfolio(): Portfolio {	
	return currentPortfolio
}

export function getFile(): string | undefined {
	return currentFile
}

export function getAutosave(): boolean {
	return autosave
}

export function setAutosave(value: boolean) {
	autosave = value
}

let currentLocale: Locale = $state(getLocale() as Locale)
export function setCurrentLocale(value: Locale) {
	//LogInfo(`A Setting locale to ${value}`)
	console.log(`A Setting locale to ${value}`)
	currentLocale = value
	setLocale(value, { reload: false })
}
export const currentLocaleState = () => currentLocale

export async function saveSettings() {
	const config = new main.Config({
		locale: currentLocale,
		autosave,
		defaultBaseCurrency: 'CHF',
		defaultCurrencies: ['CHF', 'USD', 'EUR'],
		taxReportHiddenFields: [
			'irr',
			'committed',
			'totalInvested',
			'openCommitment',
			'invested',
			'divested'
		]
	})
	await SaveConfig(config)
}

export async function loadSettings() {
	try {
		const config = await LoadConfig()
		autosave = config.autosave ?? true
		currentLocale = (config.locale as Locale) || 'de-ch'
		//setLocale(currentLocale)
	} catch (error) {
		console.error('Failed to load config:', error)
	}
}

export function isDirty(): boolean {
	return serializePortfolio(currentPortfolio) !== lastSavedJson
}

function markClean() {
	lastSavedJson = serializePortfolio(currentPortfolio)
}

function updateTitle(suffix?: string) {
	const name = currentFile ? currentFile.split('/').pop() : 'untitled'
	WindowSetTitle(suffix ? `velfi - ${name} (${suffix})` : `velfi - ${name}`)
}

export async function open(filename: string) {
	const json = await ReadFile(filename)
	console.log('Read file:', filename, json)
	currentPortfolio = deserializePortfolio(json)
	currentPortfolio.docroot = await DirOfFile(filename)
	currentFile = filename
	markClean()
	updateTitle()
}

export async function openWithDialog() {
	const path = await OpenFileDialog()
	if (!path) return
	await open(path)
}

export async function saveAs(filename: string) {
	if (!currentPortfolio) return
	currentPortfolio.docroot = await DirOfFile(filename)
	const json = serializePortfolio(currentPortfolio)
	await WriteFile(filename, json)
	currentFile = filename
	markClean()
	updateTitle()
}

export async function saveAsWithDialog() {
	const path = await SaveFileDialog()
	if (!path) return
	await saveAs(path)
}

export async function save() {
	if (!currentFile) {
		await saveAsWithDialog()
		return
	}
	updateTitle('saving')
	const json = serializePortfolio(currentPortfolio)
	await WriteFile(currentFile, json)
	markClean()
	updateTitle()
}

// ── Browser / localStorage mode ───────────────────────────────────────────────

const LS_PREFIX = 'velfi.portfolio.'

let browserPortfolioName: string | undefined = $state()

export function getBrowserPortfolioName(): string | undefined {
	return browserPortfolioName
}

export function lsListPortfolios(): string[] {
	if (!browser) return []
	return Object.keys(localStorage)
		.filter(k => k.startsWith(LS_PREFIX))
		.map(k => k.slice(LS_PREFIX.length))
		.sort()
}

export function lsLoad(name: string) {
	const json = localStorage.getItem(LS_PREFIX + name)
	if (!json) throw new Error(`Portfolio '${name}' not found in local storage`)
	currentPortfolio = deserializePortfolio(json)
	browserPortfolioName = name
	markClean()
}

export function lsSaveAs(name: string) {
	const json = serializePortfolio(currentPortfolio)
	localStorage.setItem(LS_PREFIX + name, json)
	browserPortfolioName = name
	markClean()
}

export function lsSave(): boolean {
	if (!browserPortfolioName) return false
	lsSaveAs(browserPortfolioName)
	return true
}

export function lsDelete(name: string) {
	localStorage.removeItem(LS_PREFIX + name)
	if (browserPortfolioName === name) browserPortfolioName = undefined
}

export function loadSample() {
	currentPortfolio = deserializePortfolio(samplePortfolioRaw)
	browserPortfolioName = undefined
	markClean()
}

export function downloadPortfolio() {
	const json = serializePortfolio(currentPortfolio)
	const blob = new Blob([json], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = (browserPortfolioName ?? 'portfolio') + '.velfi'
	a.click()
	URL.revokeObjectURL(url)
}

export async function uploadPortfolio(file: File) {
	const json = await file.text()
	currentPortfolio = deserializePortfolio(json)
	browserPortfolioName = file.name.replace(/\.velfi$/i, '')
	markClean()
}

async function quit() {
	if (isDirty()) {
		const confirmed = await ConfirmDialog(
			'Unsaved Changes',
			'You have unsaved changes. Are you sure you want to quit?'
		)
		if (!confirmed) {
			await ResetQuit()
			return
		}
	}
	Quit()
}

// import { LogPrint } from "./wailsjs/runtime/runtime"

async function about() {
	//  LogPrint("About dialog would go here")
	await goto('/about')
}

export function initialize() {
	console.log("initializing current portfolio module...", browser, isWailsEnv())
	// Listen for menu events from the Go backend
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if (isWailsEnv()) {
		GetInitialFileName().then((filename) => {
			if (filename && filename !== '') {
				open(filename).catch((err) => {
					LogError(`Failed to open initial file: ${err}`)
				})
			}
		})
		EventsOn('menu:open', () => {
			openWithDialog()
		})

		EventsOn('menu:save', () => {
			save()
		})
		EventsOn('menu:saveas', () => {
			saveAsWithDialog()
		})
		EventsOn('menu:quit', () => {
			Quit()
		})
		EventsOn('app:beforeclose', () => {
			quit()
		})
		EventsOn('menu:about', () => {
			about()
		})

		setInterval(() => {
			if (autosave && currentFile && isDirty()) {
				LogInfo('Autosaving portfolio...')
				save()
			}
		}, 10_000)
		console.log('Event listeners set up.')

		// Load settings at startup - defer to avoid initialization order issues
		loadSettings()
	} else {
		console.log('Not running in Wails environment, using localStorage mode.')
		setInterval(() => {
			if (autosave && browserPortfolioName && isDirty()) {
				lsSave()
			}
		}, 10_000)
	}
}
