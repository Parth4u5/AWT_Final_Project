import { describe, expect, it } from "vitest";

import type { SeedCollection } from "./seed-core";
import {
  createMongoUpsert,
  ensureUniqueIndexes,
  type MongoCollectionLike,
} from "./seed-upsert";

/**
 * A tiny collection double that enforces the Mongo semantics the seed relies
 * on: `$setOnInsert` applies only on insert, and an upsert only happens when
 * `options.upsert === true`. A wrong operator or missing flag therefore makes
 * these tests fail rather than silently passing.
 */
function fakeCollection() {
  const docs = new Map<string, Record<string, unknown>>();
  const indexes: {
    keys: Record<string, 1 | -1>;
    options: { unique: boolean };
  }[] = [];

  const collection: MongoCollectionLike = {
    async createIndex(keys, options) {
      indexes.push({ keys, options });
      return "idx";
    },
    async updateOne(filter, update, options) {
      const key = JSON.stringify(filter);
      if (docs.has(key) || !options.upsert) return { upsertedCount: 0 };
      const insert = update.$setOnInsert;
      if (!insert) throw new Error("expected a $setOnInsert operator");
      docs.set(key, insert);
      return { upsertedCount: 1 };
    },
  };

  return { collection, docs, indexes };
}

function collections() {
  const users = fakeCollection();
  const examples = fakeCollection();
  const challenges = fakeCollection();
  const map = new Map<SeedCollection, MongoCollectionLike>([
    ["users", users.collection],
    ["examples", examples.collection],
    ["challenges", challenges.collection],
  ]);
  return { map, users, examples, challenges };
}

describe("Mongo seed upsert adapter", () => {
  it("inserts once through the real adapter and is a no-op on the second run", async () => {
    const store = collections();
    const upsert = createMongoUpsert(store.map);

    expect(
      await upsert("users", { email: "admin@jsflow.test" }, { role: "admin" }),
    ).toBe(true);
    expect(
      await upsert("users", { email: "admin@jsflow.test" }, { role: "admin" }),
    ).toBe(false);
    expect(store.users.docs.size).toBe(1);
    expect(store.users.docs.get('{"email":"admin@jsflow.test"}')).toEqual({
      role: "admin",
    });
  });

  it("creates unique indexes on the natural keys", async () => {
    const store = collections();
    await ensureUniqueIndexes(store.map);

    expect(store.users.indexes).toEqual([
      { keys: { email: 1 }, options: { unique: true } },
    ]);
    expect(store.examples.indexes).toEqual([
      { keys: { title: 1 }, options: { unique: true } },
    ]);
    expect(store.challenges.indexes).toEqual([
      { keys: { slug: 1 }, options: { unique: true } },
    ]);
  });

  it("rejects an unknown collection instead of silently skipping it", async () => {
    const upsert = createMongoUpsert(new Map());
    await expect(upsert("users", { email: "a" }, {})).rejects.toThrow(
      "Unknown seed collection: users",
    );
  });
});
