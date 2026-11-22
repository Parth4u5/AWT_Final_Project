#!/usr/bin/env node
/**
 * Thin CLI wrapper around apps/api/src/config/env.ts.
 * Used by CI and by docs/INSTALLATION.md gate G7. Exits 1 on a bad config.
 */
import { assertEnv } from "../apps/api/src/config/env";

try {
  assertEnv();
  console.log("Environment configuration is valid.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
