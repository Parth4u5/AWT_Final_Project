/**
 * Idempotent local seed. Run with `pnpm seed` after `docker compose up -d`.
 *
 * Configuration comes from the environment (SEED_ADMIN_EMAIL / PASSWORD /
 * NAME) so no credential is baked into source and no registrant's email can
 * gain admin rights. The connection is opened once and closed in `finally`.
 */
import mongoose from "mongoose";

import { applySeed, type SeedCollection, seedDocuments } from "./seed-core";

interface MongoCollectionLike {
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

function required(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required to seed`);
  }
  return value;
}

const UNIQUE_KEYS: Record<SeedCollection, Record<string, 1 | -1>> = {
  users: { email: 1 },
  examples: { title: 1 },
  challenges: { slug: 1 },
};

async function main(): Promise<void> {
  const uri = required("MONGO_URI");
  const config = {
    adminEmail: required("SEED_ADMIN_EMAIL"),
    adminPassword: required("SEED_ADMIN_PASSWORD"),
    adminName: process.env.SEED_ADMIN_NAME ?? "Seed Admin",
  };

  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const collections = new Map<SeedCollection, MongoCollectionLike>();
    for (const name of ["users", "examples", "challenges"] as const) {
      collections.set(
        name,
        connection.collection(name) as unknown as MongoCollectionLike,
      );
    }

    // Unique indexes are themselves idempotent and make natural keys authoritative.
    for (const [name, keys] of Object.entries(UNIQUE_KEYS) as [
      SeedCollection,
      Record<string, 1 | -1>,
    ][]) {
      const collection = collections.get(name);
      if (collection) await collection.createIndex(keys, { unique: true });
    }

    const stats = await applySeed(
      seedDocuments(config),
      async (name, filter, document) => {
        const collection = collections.get(name);
        if (!collection) throw new Error(`Unknown seed collection: ${name}`);
        const result = await collection.updateOne(
          filter,
          { $setOnInsert: document },
          { upsert: true },
        );
        return (result.upsertedCount ?? 0) > 0;
      },
    );

    console.log(
      `Seed complete: ${stats.inserted} inserted, ${stats.unchanged} unchanged.`,
    );
    console.log(
      "Admin: 1 | Examples: 22 | Challenges: 10 (placeholder content).",
    );
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
