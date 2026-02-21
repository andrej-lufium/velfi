import { describe, it, expect } from "vitest";
import {
  type Portfolio,
  type Asset,
  type Entity,
  type Currency,
  type Investment,
  type Revenue,
  serializePortfolio,
  deserializePortfolio,
} from "./portfolio";

// --- Helpers ---

function randomDate(yearFrom: number, yearTo: number): Date {
  const start = new Date(yearFrom, 0, 1).getTime();
  const end = new Date(yearTo, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

function makeEmptyPortfolio(): Portfolio {
  const baseCurrency: Currency = { iso: "EUR", rates: [] };
  return {
    docroot: '/tmp/test',
    name: 'Test Portfolio',
    entities: [],
    baseCurrency,
    currencies: [baseCurrency],
  };
}

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  const entity: Entity = {
    name: "Test Entity",
    address: "123 Test St",
    country: "CH",
    docfolder: '',
    assets: [],
    currency: { iso: "EUR", rates: [] },
    ...overrides,
  };
  return entity;
}

function makeAsset(entity: Entity, overrides: Partial<Asset> = {}): Asset {
  const asset: Asset = {
    name: "Test Asset",
    type: "equity",
    unit: "shares",
    entity,
    investments: [],
    revenues: [],
    valuations: [],
    commitments: [],
    ...overrides,
  };
  entity.assets.push(asset);
  return asset;
}

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    valuta: new Date("2023-01-15"),
    description: "Test investment",
    units: 10000,
    value: 10000,
    fxrate: 1,
    doc: "/docs/test/inv.pdf",
    ...overrides,
  };
}

function makeRevenue(overrides: Partial<Revenue> = {}): Revenue {
  return {
    valuta: new Date("2023-06-01"),
    description: "Test revenue",
    value: 5000,
    fxrate: 1,
    doc: "/docs/test/rev.pdf",
    ...overrides,
  };
}

// --- Portfolio: basic operations ---

describe("Portfolio: basic operations", () => {
  it("adds an entity with assets", () => {
    const p = makeEmptyPortfolio();
    const entity = makeEntity();
    makeAsset(entity);
    p.entities.push(entity);
    expect(p.entities).toHaveLength(1);
    expect(p.entities[0].assets).toHaveLength(1);
  });

  it("deletes an entity by index via splice", () => {
    const p = makeEmptyPortfolio();
    const e1 = makeEntity({ name: "First" });
    const e2 = makeEntity({ name: "Second" });
    p.entities.push(e1, e2);
    p.entities.splice(0, 1);
    expect(p.entities).toHaveLength(1);
    expect(p.entities[0].name).toBe("Second");
  });

  it("adds a currency", () => {
    const p = makeEmptyPortfolio();
    const usd: Currency = { iso: "USD", rates: [] };
    p.currencies.push(usd);
    expect(p.currencies).toHaveLength(2);
    expect(p.currencies.find(c => c.iso === "USD")).toBe(usd);
  });

  it("adds a rate to a currency", () => {
    const c: Currency = { iso: "USD", rates: [] };
    c.rates.push({ date: new Date("2024-01-01"), rate: 1.1 });
    expect(c.rates).toHaveLength(1);
    expect(c.rates[0].rate).toBe(1.1);
  });

  it("adds and removes investments from an asset", () => {
    const entity = makeEntity();
    const asset = makeAsset(entity);
    asset.investments.push(makeInvestment());
    expect(asset.investments).toHaveLength(1);
    asset.investments.splice(0, 1);
    expect(asset.investments).toHaveLength(0);
  });

  it("adds and removes revenues from an asset", () => {
    const entity = makeEntity();
    const asset = makeAsset(entity);
    asset.revenues.push(makeRevenue());
    expect(asset.revenues).toHaveLength(1);
    asset.revenues.splice(0, 1);
    expect(asset.revenues).toHaveLength(0);
  });

  it("adds and removes commitments from an asset", () => {
    const entity = makeEntity();
    const asset = makeAsset(entity);
    asset.commitments.push(makeInvestment({ description: "Commitment tranche 1" }));
    expect(asset.commitments).toHaveLength(1);
    asset.commitments.splice(0, 1);
    expect(asset.commitments).toHaveLength(0);
  });
});

// --- Serialization round-trip ---

describe("serializePortfolio / deserializePortfolio", () => {
  it("round-trips a portfolio through JSON", () => {
    const portfolio = createSamplePortfolio();
    const json = serializePortfolio(portfolio);
    const restored = deserializePortfolio(json);

    expect(restored.baseCurrency.iso).toBe("EUR");
    expect(restored.currencies).toHaveLength(3);
    expect(restored.entities).toHaveLength(3);

    const allOriginalAssets = portfolio.entities.flatMap(e => e.assets);
    const allRestoredAssets = restored.entities.flatMap(e => e.assets);
    expect(allRestoredAssets).toHaveLength(allOriginalAssets.length);

    for (let i = 0; i < allOriginalAssets.length; i++) {
      const original = allOriginalAssets[i];
      const asset = allRestoredAssets[i];
      expect(asset.name).toBe(original.name);
      expect(asset.type).toBe(original.type);
      expect(asset.investments).toHaveLength(original.investments.length);
      expect(asset.revenues).toHaveLength(original.revenues.length);
      expect(asset.commitments).toHaveLength(original.commitments.length);
    }
  });

  it("preserves currency rates through round-trip", () => {
    const portfolio = createSamplePortfolio();
    const json = serializePortfolio(portfolio);
    const restored = deserializePortfolio(json);

    const usd = restored.currencies.find(c => c.iso === "USD");
    expect(usd).toBeDefined();
    expect(usd!.rates).toHaveLength(3);
    expect(usd!.rates[0].rate).toBe(1.12);
  });

  it("preserves investment values through round-trip", () => {
    const portfolio = createSamplePortfolio();
    const json = serializePortfolio(portfolio);
    const restored = deserializePortfolio(json);

    const originalFirst = portfolio.entities[0].assets[0];
    const firstAsset = restored.entities[0].assets[0];

    for (let i = 0; i < originalFirst.investments.length; i++) {
      expect(firstAsset.investments[i].units).toBe(originalFirst.investments[i].units);
      expect(firstAsset.investments[i].value).toBe(originalFirst.investments[i].value);
      expect(firstAsset.investments[i].description).toBe(originalFirst.investments[i].description);
    }
  });

  it("revives date strings as Date objects", () => {
    const portfolio = createSamplePortfolio();
    const json = serializePortfolio(portfolio);
    const restored = deserializePortfolio(json);

    expect(restored.currencies.find(c => c.iso === "USD")!.rates[0].date).toBeInstanceOf(Date);
    expect(restored.entities[0].assets[0].investments[0].valuta).toBeInstanceOf(Date);
  });

  it("links baseCurrency to the same object in currencies[]", () => {
    const portfolio = createSamplePortfolio();
    const json = serializePortfolio(portfolio);
    const restored = deserializePortfolio(json);

    const match = restored.currencies.find(c => c.iso === restored.baseCurrency.iso);
    expect(match).toBeDefined();
    expect(restored.baseCurrency).toBe(match);
  });

  it("adds baseCurrency to currencies[] if missing", () => {
    const json = JSON.stringify({
      entities: [],
      baseCurrency: { iso: "JPY", rates: [] },
      currencies: [{ iso: "EUR", rates: [] }],
    });
    const restored = deserializePortfolio(json);

    expect(restored.currencies).toHaveLength(2);
    expect(restored.currencies.find(c => c.iso === "JPY")).toBe(restored.baseCurrency);
  });

  it("relinks entity.currency to currencies[] after round-trip", () => {
    const portfolio = createSamplePortfolio();
    const json = serializePortfolio(portfolio);
    const restored = deserializePortfolio(json);

    for (const entity of restored.entities) {
      const match = restored.currencies.find(c => c.iso === entity.currency.iso);
      expect(entity.currency).toBe(match);
    }
  });

  it("relinks asset.entity back-reference after round-trip", () => {
    const portfolio = createSamplePortfolio();
    const json = serializePortfolio(portfolio);
    const restored = deserializePortfolio(json);

    for (const entity of restored.entities) {
      for (const asset of entity.assets) {
        expect(asset.entity).toBe(entity);
      }
    }
  });
});

// --- Sample Portfolio generator ---

function createSamplePortfolio(): Portfolio {
  const eur: Currency = { iso: "EUR", rates: [] };
  const usd: Currency = {
    iso: "USD",
    rates: [
      { date: new Date("2020-01-01"), rate: 1.12 },
      { date: new Date("2022-06-15"), rate: 1.05 },
      { date: new Date("2024-01-01"), rate: 1.09 },
    ],
  };
  const gbp: Currency = {
    iso: "GBP",
    rates: [
      { date: new Date("2020-01-01"), rate: 0.85 },
      { date: new Date("2023-03-01"), rate: 0.88 },
    ],
  };

  const currencies = [eur, usd, gbp];

  const assetTypes: Asset["type"][] = ["debt", "equity", "convertible", "other"];
  const assetUnits: Asset["unit"][] = ["shares", "percent", "amount"];
  const assetNames = [
    "TechVentures Fund I",
    "Green Energy Bond 2021",
    "Nordic Growth Equity",
    "Asia Pacific Convertible Note",
    "Real Estate Fund Europe",
    "HealthTech Series B",
    "Infrastructure Debt Fund III",
    "Digital Media Equity",
    "Climate Impact Bond",
    "FinTech Opportunities Fund",
  ];

  const entityNames = ["Alpha Corp", "Beta Holdings", "Gamma Investments"];
  const entities: Entity[] = [];

  for (let e = 0; e < 3; e++) {
    const entity: Entity = {
      name: entityNames[e],
      address: `${e + 1} Main St`,
      country: ["CH", "US", "GB"][e],
      docfolder: '',
      assets: [],
      currency: currencies[e],
    };

    const assetCount = e === 0 ? 4 : e === 1 ? 3 : 3;
    for (let i = 0; i < assetCount; i++) {
      const idx = entities.flatMap(en => en.assets).length + i;
      const investmentCount = 1 + Math.floor(Math.random() * 10);
      const investments: Investment[] = [];
      for (let j = 0; j < investmentCount; j++) {
        const units = Math.round((1000 + Math.random() * 99000) * 100) / 100;
        investments.push({
          valuta: randomDate(2020, 2025),
          description: `Investment round ${j + 1}`,
          units,
          value: Math.round(units * (0.8 + Math.random() * 0.8) * 100) / 100,
          fxrate: 1,
          doc: `/docs/${assetNames[idx].toLowerCase().replace(/\s+/g, "-")}/inv-${j + 1}.pdf`,
        });
      }

      const revenueCount = Math.floor(Math.random() * 4);
      const revenues: Revenue[] = [];
      for (let j = 0; j < revenueCount; j++) {
        revenues.push({
          valuta: randomDate(2021, 2025),
          description: `Distribution ${j + 1}`,
          value: Math.round((500 + Math.random() * 20000) * 100) / 100,
          fxrate: 1,
          doc: `/docs/${assetNames[idx].toLowerCase().replace(/\s+/g, "-")}/rev-${j + 1}.pdf`,
        });
      }

      const commitmentCount = Math.floor(Math.random() * 3);
      const commitments: Investment[] = [];
      for (let j = 0; j < commitmentCount; j++) {
        const units = Math.round((5000 + Math.random() * 50000) * 100) / 100;
        commitments.push({
          valuta: randomDate(2020, 2025),
          description: `Commitment tranche ${j + 1}`,
          units,
          value: units,
          fxrate: 1,
          doc: `/docs/${assetNames[idx].toLowerCase().replace(/\s+/g, "-")}/commit-${j + 1}.pdf`,
        });
      }

      const asset: Asset = {
        name: assetNames[idx],
        type: assetTypes[idx % assetTypes.length],
        unit: assetUnits[idx % assetUnits.length],
        entity,
        investments,
        revenues,
        valuations: [],
        commitments,
      };
      entity.assets.push(asset);
    }

    entities.push(entity);
  }

  return { docroot: '/tmp/sample', name: 'Sample Portfolio', entities, baseCurrency: eur, currencies };
}
