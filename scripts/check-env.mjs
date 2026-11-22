#!/usr/bin/env node
/**
 * Thin CLI wrapper around apps/api/config/env.js.
 * Used by CI and by docs/INSTALLATION.md gate G7. Exits 1 on a bad config.
 */
import { assertEnv } from '../apps/api/config/env.js';

try {
  assertEnv();
  console.log('Environment configuration is valid.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
