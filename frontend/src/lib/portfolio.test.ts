import { describe, it, expect } from "vitest";
import {
  type Portfolio,
  type Asset,
  type Currency,
  type Investment,
  type Revenue,
  addAsset,
  deleteAsset,
  addCurrency,
  deleteCurrency,
  addRate,
  deleteRate,
  addInvestment,
  deleteInvestment,
  addRevenue,
  deleteRevenue,
  addCommitment,
  deleteCommitment,
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
    assets: [],
    baseCurrency,
    currencies: [baseCurrency],
  };
}

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    name: "Test Asset",
    type: "equity",
    unit: "shares",
    currency: { iso: "EUR", rates: [] },
    documentFolder: "/docs/test/",
    investments: [],
    revenues: [],
    valuations: [],
    commitments: [],
    ...overrides,
  };
}

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    valuta: new Date("2023-01-15"),
    description: "Test investment",
    amount: 10000,
    value: 10000,
    reference: "/docs/test/inv.pdf",
    ...overrides,
  };
}

function makeRevenue(overrides: Partial<Revenue> = {}): Revenue {
  return {
    valuta: new Date("2023-06-01"),
    description: "Test revenue",
    value: 5000,
    reference: "/docs/test/rev.pdf",
    ...overrides,
  };
}

// --- Portfolio: add/delete asset ---

describe("Portfolio: addAsset / deleteAsset", () => {
  it("adds an asset", () => {
    const p = makeEmptyPortfolio();
    const asset = addAsset(p, makeAsset());
    expect(p.assets).toHaveLength(1);
    expect(p.assets[0]).toBe(asset);
  });

  it("deletes an asset by index", () => {
    const p = makeEmptyPortfolio();
    addAsset(p, makeAsset({ name: "First" }));
    addAsset(p, makeAsset({ name: "Second" }));
    expect(deleteAsset(p, 0)).toBe(true);
    expect(p.assets).toHaveLength(1);
    expect(p.assets[0].name).toBe("Second");
  });

  it("returns false for out-of-bounds index", () => {
    const p = makeEmptyPortfolio();
    expect(deleteAsset(p, 0)).toBe(false);
    expect(deleteAsset(p, -1)).toBe(false);
  });
});

// --- Portfolio: add/delete currency ---

describe("Portfolio: addCurrency / deleteCurrency", () => {
  it("adds a currency", () => {
    const p = makeEmptyPortfolio();
    const usd: Currency = { iso: "USD", rates: [] };
    addCurrency(p, usd);
    expect(p.currencies).toHaveLength(2);
    expect(p.currencies.find(c => c.iso === "USD")).toBe(usd);
  });

  it("deletes a currency", () => {
    const p = makeEmptyPortfolio();
    addCurrency(p, { iso: "USD", rates: [] });
    expect(deleteCurrency(p, "USD")).toBe(true);
    expect(p.currencies.find(c => c.iso === "USD")).toBeUndefined();
  });

  it("returns false when deleting non-existent currency", () => {
    const p = makeEmptyPortfolio();
    expect(deleteCurrency(p, "JPY")).toBe(false);
  });
});

// --- Currency: add/delete rate ---

describe("Currency: addRate / deleteRate", () => {
  it("adds a rate", () => {
    const c: Currency = { iso: "USD", rates: [] };
    addRate(c, new Date("2024-01-01"), 1.1);
    expect(c.rates).toHaveLength(1);
    expect(c.rates[0].rate).toBe(1.1);
  });

  it("deletes a rate by index", () => {
    const c: Currency = {
      iso: "USD",
      rates: [
        { date: new Date("2024-01-01"), rate: 1.1 },
        { date: new Date("2024-06-01"), rate: 1.2 },
      ],
    };
    expect(deleteRate(c, 0)).toBe(true);
    expect(c.rates).toHaveLength(1);
    expect(c.rates[0].rate).toBe(1.2);
  });

  it("returns false for out-of-bounds index", () => {
    const c: Currency = { iso: "USD", rates: [] };
    expect(deleteRate(c, 0)).toBe(false);
    expect(deleteRate(c, -1)).toBe(false);
  });
});

// --- Asset: add/delete investment, revenue, commitment ---

describe("Asset: addInvestment / deleteInvestment", () => {
  it("adds and deletes an investment", () => {
    const asset = makeAsset();
    const inv = makeInvestment();
    addInvestment(asset, inv);
    expect(asset.investments).toHaveLength(1);
    expect(deleteInvestment(asset, 0)).toBe(true);
    expect(asset.investments).toHaveLength(0);
  });

  it("returns false for invalid index", () => {
    expect(deleteInvestment(makeAsset(), 0)).toBe(false);
  });
});

describe("Asset: addRevenue / deleteRevenue", () => {
  it("adds and deletes a revenue", () => {
    const asset = makeAsset();
    addRevenue(asset, makeRevenue());
    expect(asset.revenues).toHaveLength(1);
    expect(deleteRevenue(asset, 0)).toBe(true);
    expect(asset.revenues).toHaveLength(0);
  });

  it("returns false for invalid index", () => {
    expect(deleteRevenue(makeAsset(), 0)).toBe(false);
  });
});

describe("Asset: addCommitment / deleteCommitment", () => {
  it("adds and deletes a commitment", () => {
    const asset = makeAsset();
    const commitment = makeInvestment({ description: "Commitment tranche 1" });
    addCommitment(asset, commitment);
    expect(asset.commitments).toHaveLength(1);
    expect(deleteCommitment(asset, 0)).toBe(true);
    expect(asset.commitments).toHaveLength(0);
  });

  it("returns false for invalid index", () => {
    expect(deleteCommitment(makeAsset(), 0)).toBe(false);
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
    expect(restored.assets).toHaveLength(10);

    for (let i = 0; i < portfolio.assets.length; i++) {
      const original = portfolio.assets[i];
      const asset = restored.assets[i];
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

    const originalFirst = portfolio.assets[0];
    const firstAsset = restored.assets[0];

    for (let i = 0; i < originalFirst.investments.length; i++) {
      expect(firstAsset.investments[i].amount).toBe(originalFirst.investments[i].amount);
      expect(firstAsset.investments[i].value).toBe(originalFirst.investments[i].value);
      expect(firstAsset.investments[i].description).toBe(originalFirst.investments[i].description);
    }
  });

  it("revives date strings as Date objects", () => {
    const portfolio = createSamplePortfolio();
    const json = serializePortfolio(portfolio);
    const restored = deserializePortfolio(json);

    expect(restored.currencies.find(c => c.iso === "USD")!.rates[0].date).toBeInstanceOf(Date);
    expect(restored.assets[0].investments[0].valuta).toBeInstanceOf(Date);
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

  const assets: Asset[] = [];

  for (let i = 0; i < 10; i++) {
    const investmentCount = 1 + Math.floor(Math.random() * 10);
    const investments: Investment[] = [];
    for (let j = 0; j < investmentCount; j++) {
      const amount = Math.round((1000 + Math.random() * 99000) * 100) / 100;
      investments.push({
        valuta: randomDate(2020, 2025),
        description: `Investment round ${j + 1}`,
        amount,
        value: Math.round(amount * (0.8 + Math.random() * 0.8) * 100) / 100,
        reference: `/docs/${assetNames[i].toLowerCase().replace(/\s+/g, "-")}/inv-${j + 1}.pdf`,
      });
    }

    const revenueCount = Math.floor(Math.random() * 4);
    const revenues: Revenue[] = [];
    for (let j = 0; j < revenueCount; j++) {
      revenues.push({
        valuta: randomDate(2021, 2025),
        description: `Distribution ${j + 1}`,
        value: Math.round((500 + Math.random() * 20000) * 100) / 100,
        reference: `/docs/${assetNames[i].toLowerCase().replace(/\s+/g, "-")}/rev-${j + 1}.pdf`,
      });
    }

    const commitmentCount = Math.floor(Math.random() * 3);
    const commitments: Investment[] = [];
    for (let j = 0; j < commitmentCount; j++) {
      const amount = Math.round((5000 + Math.random() * 50000) * 100) / 100;
      commitments.push({
        valuta: randomDate(2020, 2025),
        description: `Commitment tranche ${j + 1}`,
        amount,
        value: amount,
        reference: `/docs/${assetNames[i].toLowerCase().replace(/\s+/g, "-")}/commit-${j + 1}.pdf`,
      });
    }

    assets.push({
      name: assetNames[i],
      type: assetTypes[i % assetTypes.length],
      unit: assetUnits[i % assetUnits.length],
      currency: currencies[i % currencies.length],
      documentFolder: `/docs/${assetNames[i].toLowerCase().replace(/\s+/g, "-")}/`,
      investments,
      revenues,
      valuations: [],
      commitments,
    });
  }

  return { assets, baseCurrency: eur, currencies };
}
