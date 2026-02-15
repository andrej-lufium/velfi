import { browser } from "$app/environment"
import { deserializePortfolio, serializePortfolio, type Portfolio } from "./portfolio"
import { ReadFile, WriteFile, OpenFileDialog, SaveFileDialog, ConfirmDialog } from "./wailsjs/go/main/App"
import { EventsOn, Quit, WindowSetTitle } from "./wailsjs/runtime/runtime"

const defaultPortfolio: Portfolio = {
  assets: [],
  baseCurrency: { iso: "CHF", rates: [] },
  currencies: [{ iso: "CHF", rates: [] }],
}
defaultPortfolio.baseCurrency = defaultPortfolio.currencies[0]

let currentPortfolio: Portfolio = $state(defaultPortfolio)
let currentFile: string | undefined = $state()
let lastSavedJson: string = $state(serializePortfolio(defaultPortfolio))

export function getPortfolio(): Portfolio  {
  return currentPortfolio
}

export function getFile(): string|undefined {
  return currentFile
}

export function isDirty(): boolean {
  return serializePortfolio(currentPortfolio) !== lastSavedJson
}

function markClean() {
  lastSavedJson = serializePortfolio(currentPortfolio)
}

function updateTitle() {
  const name = currentFile ? currentFile.split("/").pop() : "untitled"
  WindowSetTitle(`velfi - ${name}`)
}

export async function open(filename: string) {
  const json = await ReadFile(filename)
  console.log("Read file:", filename, json)
  currentPortfolio = deserializePortfolio(json)
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
  const json = serializePortfolio(currentPortfolio)
  await WriteFile(currentFile, json)
  markClean()
}

async function quit() {
  if (isDirty()) {
    const confirmed = await ConfirmDialog(
      "Unsaved Changes",
      "You have unsaved changes. Are you sure you want to quit?"
    )
    if (!confirmed) return
  }
  Quit()
}

// Listen for menu events from the Go backend
if (browser) {
  EventsOn("menu:open", () => { openWithDialog() })
  EventsOn("menu:save", () => { save() })
  EventsOn("menu:saveas", () => { saveAsWithDialog() })
  EventsOn("menu:quit", () => { quit() })
}
