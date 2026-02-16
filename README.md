# Velfi

A desktop application for managing investment portfolios. Track entities, assets, investments, revenues, commitments, valuations and currency exchange rates.

**[Documentation & Downloads](https://andrej-lufium.github.io/velfi/)**

## Features

- Manage entities (companies, funds) and their assets
- Track investments, revenues, commitments and valuations
- Multi-currency support with automatic exchange rate fetching
- Generate asset and portfolio reports (yearly / quarterly)
- Export reports as CSV or print them
- All data stored in a single `.velfi` file

## Quick Start

Download the latest release for your platform from the [Releases](https://github.com/andrej-lufium/velfi/releases) page.

## Building from Source

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

### Tests

```sh
cd frontend
npx vitest run
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

Copyright 2026 lufium gmbh
