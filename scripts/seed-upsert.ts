/**
 * The real Mongo half of the seed. Kept separate from the runner so the exact
 * operator and `upsert` flag are unit-testable without a live database.
 */
import type { SeedCollection, Upsert } from "./seed-core";

export interface MongoCollectionLike {
  createIndex(
    keys: Record<string, 1 | -1>,
    options: { unique: boolean },
  ): Promise<unknown>;
  updateOne(
    filter: Record<string, unknown>,
    update: { $setOnInsert: Record<string, unknown> },
    options: { upsert: boolean },
  ): Promise<{ upsertedCount?: number }>;
}

export const UNIQUE_KEYS: Record<SeedCollection, Record<string, 1 | -1>> = {
  users: { email: 1 },
  examples: { title: 1 },
  challenges: { slug: 1 },
};

export async function ensureUniqueIndexes(
  collections: Map<SeedCollection, MongoCollectionLike>,
): Promise<void> {
  for (const [name, keys] of Object.entries(UNIQUE_KEYS) as [
    SeedCollection,
    Record<string, 1 | -1>,
  ][]) {
    const collection = collections.get(name);
    if (collection) await collection.createIndex(keys, { unique: true });
  }
}

export function createMongoUpsert(
  collections: Map<SeedCollection, MongoCollectionLike>,
): Upsert {
  return async (name, filter, document) => {
    const collection = collections.get(name);
    if (!collection) throw new Error(`Unknown seed collection: ${name}`);
    const result = await collection.updateOne(
      filter,
      { $setOnInsert: document },
      { upsert: true },
    );
    return (result.upsertedCount ?? 0) > 0;
  };
}
