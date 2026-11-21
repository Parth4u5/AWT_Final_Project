import { describe, expect, it } from "vitest";

import {
  applySeed,
  type SeedConfig,
  type SeedDocument,
  seedDocuments,
  type Upsert,
} from "./seed-core";

const config: SeedConfig = {
  adminEmail: "admin@jsflow.test",
  adminPassword: "local-seed-password-with-at-least-32-chars",
  adminName: "Seed Admin",
};

function memoryUpsert() {
  const stored = new Map<string, SeedDocument>();
  let inserts = 0;

  const upsert: Upsert = async (collection, filter, document) => {
    const key = `${collection}:${JSON.stringify(filter)}`;
    if (stored.has(key)) return false;
    stored.set(key, { collection, filter, document, label: "" });
    inserts += 1;
    return true;
  };

  return {
    stored,
    upsert,
    get inserts() {
      return inserts;
    },
  };
}

async function collect(): Promise<SeedDocument[]> {
  const docs: SeedDocument[] = [];
  for await (const doc of seedDocuments(config)) docs.push(doc);
  return docs;
}

describe("seed plan", () => {
  it("contains exactly one administered account keyed by the configured email", async () => {
    const docs = await collect();
    const admins = docs.filter((doc) => doc.collection === "users");

    expect(admins).toHaveLength(1);
    expect(admins[0]?.filter).toEqual({ email: config.adminEmail });
    expect(admins[0]?.document).toMatchObject({
      email: config.adminEmail,
      name: config.adminName,
      role: "admin",
    });
  });

  it("contains at least 20 categorized examples and 10 challenges", async () => {
    const docs = await collect();
    const examples = docs.filter((doc) => doc.collection === "examples");
    const challenges = docs.filter((doc) => doc.collection === "challenges");

    expect(examples.length).toBeGreaterThanOrEqual(20);
    expect(challenges.length).toBeGreaterThanOrEqual(10);
    for (const example of examples) {
      expect(example.document["category"], example.label).toBeDefined();
      expect(example.document["difficulty"], example.label).toBeDefined();
      expect(example.document["code"], example.label).toBeDefined();
    }
    for (const challenge of challenges) {
      expect(challenge.document["slug"], challenge.label).toBeDefined();
      expect(Array.isArray(challenge.document["tests"]), challenge.label).toBe(
        true,
      );
    }
  });

  it("is idempotent: a second run inserts nothing and leaves counts unchanged", async () => {
    const store = memoryUpsert();
    const first = await applySeed(seedDocuments(config), store.upsert);
    const countsAfterFirst = new Map<string, number>();
    for (const key of store.stored.keys()) {
      const collection = key.split(":")[0] ?? "";
      countsAfterFirst.set(
        collection,
        (countsAfterFirst.get(collection) ?? 0) + 1,
      );
    }

    const second = await applySeed(seedDocuments(config), store.upsert);

    expect(first.inserted).toBeGreaterThanOrEqual(31);
    expect(second.inserted).toBe(0);
    expect(second.unchanged).toBe(first.inserted);
    expect(store.inserts).toBe(first.inserted);
    const countsAfterSecond = new Map<string, number>();
    for (const key of store.stored.keys()) {
      const collection = key.split(":")[0] ?? "";
      countsAfterSecond.set(
        collection,
        (countsAfterSecond.get(collection) ?? 0) + 1,
      );
    }
    expect(countsAfterSecond).toEqual(countsAfterFirst);
  });
});
