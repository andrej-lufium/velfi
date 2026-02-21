---
title: Velfi - Simple Portfolio Management
---

![Velfi](logo.svg)

/Velfi/ is a small desktop application for managing investment portfolios. It tracks entities, assets, investments, revenues, commitments, valuations and currency exchange rates. Reports can be generated per asset or across the entire portfolio. All data are saved locally in a file.

## Download

| Platform | Link |
|----------|------|
| macOS    | [Download for Mac](https://github.com/andrej-lufium/velfi/releases/latest/download/velfi-mac.dmg) |
| Windows  | [Download for Windows](https://github.com/andrej-lufium/velfi/releases/latest/download/velfi-windows.exe) |

Older versions are available on the [Releases](https://github.com/andrej-lufium/velfi/releases) page.

## Installation

### macOS

1. Download the `.dmg` file from the link above
2. Open the DMG and drag Velfi into your Applications folder
As long as we haven't signed the app, you have to manually un-quarantine it:
`xattr -cr /Applications/velfi.app`or wherever it is

3. On first launch, right-click the app and select **Open** to bypass Gatekeeper
4. `.velfi` files will be associated with the app automatically

### Windows

1. Download the `.exe` installer from the link above
2. Run the installer and follow the on-screen instructions
3. Launch Velfi from the Start Menu or desktop shortcut

## Getting Started

### Create a Portfolio

When you launch Velfi you start with an empty portfolio. Use **File > Save As** (Cmd+Shift+S / Ctrl+Shift+S) to save it as a `.velfi` file.

### Entities

The home screen shows a list of entities. An entity represents a legal entity (company, fund, etc.) that holds assets.

Each entity has:
- **Name** -- the entity's name
- **Address** -- registered address
- **Country** -- country of incorporation
- **Currency** -- the entity's operating currency
- **Assets** -- the list of assets held by this entity

Click **Add** to create a new entity, or **Details** to open an existing one.

### Assets

Inside an entity, you manage its assets. Each asset represents an individual investment position.

Each asset has:
- **Name** -- descriptive name of the asset
- **Type** -- debt, equity, convertible, or other
- **Unit** -- shares, percent, or amount

Click **Details** on an asset to manage its transactions:
- **Investments** -- capital deployed (positive) or returned (negative values for divestments)
- **Revenues** -- distributions, dividends, interest received
- **Commitments** -- future obligations
- **Valuations** -- periodic mark-to-market prices per unit

### Currencies

Go to **Settings** to manage currencies. Velfi supports multiple currencies with historical exchange rates. The base currency is used for consolidated reporting.

Exchange rates can be fetched automatically from the [Frankfurter API](https://frankfurter.dev) via the rate settings page. Select monthly or quarterly frequency and click **Fetch Rates**.

### Reports

#### Asset Report

From any asset detail page, click **View Report** to see a periodic breakdown (yearly or quarterly) of investments, revenues, units, valuations, and net asset value.

#### Portfolio Report

From the home screen, click **View Report** to see a consolidated annual report across all entities and assets, with values converted to the base currency.

Both reports can be:

- **Exported as CSV** for use in spreadsheets
- **Printed** directly from the application

## File Format

Portfolios are saved as `.velfi` files (JSON format). They contain all entities, assets, transactions, currencies and exchange rates in a single file. Document references (investment confirmations, contracts, etc.) are stored as relative paths to a configurable document folder.

## Keyboard Shortcuts

| Action       | macOS        | Windows       |
|--------------|--------------|---------------|
| Open         | Cmd+O        | Ctrl+O        |
| Save         | Cmd+S        | Ctrl+S        |
| Save As      | Cmd+Shift+S  | Ctrl+Shift+S  |
| Quit         | Cmd+Q        | Ctrl+Q        |

## Building from Source

Velfi is built with [Wails v2](https://wails.io), using Go for the backend and SvelteKit for the frontend.

### Prerequisites

- [Go](https://go.dev) 1.21+
- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

### Development

```sh
wails dev
```

### Build

```sh
wails build
```

The built application will be in the `build/bin` directory.

### Tests

```sh
cd frontend
npx vitest run
```
