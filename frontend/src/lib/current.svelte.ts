import { browser } from "$app/environment"
import { goto } from "$app/navigation"
//import { goto } from "$app/navigation"
import { deserializePortfolio, serializePortfolio, type Portfolio } from "./portfolio"
import { ReadFile, WriteFile, OpenFileDialog, SaveFileDialog, ConfirmDialog, DirOfFile, ResetQuit, LoadConfig, SaveConfig } from "./wailsjs/go/main/App"
import { main } from "./wailsjs/go/models"
import { EventsOn, LogInfo, Quit, WindowSetTitle } from "./wailsjs/runtime/runtime"
import { setLocale, locales } from "$lib/paraglide/runtime"
//import { tick } from "svelte"

type Locale = typeof locales[number]

const defaultPortfolio: Portfolio = {
  docroot: '',
  name: 'My Portfolio',
  entities: [],
  baseCurrency: { iso: "CHF", rates: [] },
  currencies: [{ iso: "CHF", rates: [] }],
}
defaultPortfolio.baseCurrency = defaultPortfolio.currencies[0]

let currentPortfolio: Portfolio = $state(defaultPortfolio)
let currentFile: string | undefined = $state()
let lastSavedJson: string = $state(serializePortfolio(defaultPortfolio))
let autosave: boolean = $state(true)
let currentLocale: Locale = $state("de-ch")

export function getPortfolio(): Portfolio  {
  return currentPortfolio
}

export function getFile(): string|undefined {
  return currentFile
}

export function getAutosave(): boolean {
  return autosave
}

export function setAutosave(value: boolean) {
  autosave = value
}

export function getLocale(): Locale {
  return currentLocale
}

export function setCurrentLocale(value: Locale) {
  LogInfo(`Setting locale to ${value}`)
  currentLocale = value
  setLocale(value)
}

export async function saveSettings() {
  const config = new main.Config({
    locale: currentLocale,
    autosave,
    defaultBaseCurrency: "CHF",
    defaultCurrencies: ["CHF", "USD", "EUR"],
    taxReportHiddenFields: ["irr", "committed", "totalInvested", "openCommitment", "invested", "divested"],
  })
  await SaveConfig(config)
}

export async function loadSettings() {
  try {
    const config = await LoadConfig()
    autosave = config.autosave ?? true
    currentLocale = (config.locale as Locale) || "de-ch"
    //setLocale(currentLocale)
  } catch (error) {
    console.error("Failed to load config:", error)
  }
}

export function isDirty(): boolean {
  return serializePortfolio(currentPortfolio) !== lastSavedJson
}

function markClean() {
  lastSavedJson = serializePortfolio(currentPortfolio)
}

function updateTitle(suffix?: string) {
  const name = currentFile ? currentFile.split("/").pop() : "untitled"
  WindowSetTitle(suffix ? `velfi - ${name} (${suffix})` : `velfi - ${name}`)
}

export async function open(filename: string) {
  const json = await ReadFile(filename)
  console.log("Read file:", filename, json)
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

async function quit() {
  if (isDirty()) {
    const confirmed = await ConfirmDialog(
      "Unsaved Changes",
      "You have unsaved changes. Are you sure you want to quit?"
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
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  await goto("/about")
}

// Listen for menu events from the Go backend
if (false && browser) {
  // Load settings at startup - defer to avoid initialization order issues
  //tick().then(() => loadSettings())
console.log("Setting up event listeners...")
  EventsOn("menu:open", () => { openWithDialog() })
  EventsOn("menu:save", () => { save() })
  EventsOn("menu:saveas", () => { saveAsWithDialog() })
  EventsOn("menu:quit", () => { quit() })
  EventsOn("app:beforeclose", () => { quit() })
  EventsOn("menu:about", () => { about() })

  // Autosave: check every 10 seconds
  setInterval(() => {
    if (autosave && currentFile && isDirty()) {
      LogInfo("Autosaving portfolio...")
      save()
    }
  }, 10_000)
}
