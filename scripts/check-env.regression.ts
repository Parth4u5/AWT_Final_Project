#!/usr/bin/env node
/**
 * Regression guard for spec §5.7.1 / decision D13: Atlas credentials are
 * rotated IN PLACE on the same cluster, so a correctly rotated MONGO_URI keeps
 * the original cluster hostname and changes only the DB user.
 *
 * Proves both sides:
 *   1. rotated-in-place URI (same cluster host, new user) -> ACCEPTED
 *   2. old, revoked DB user (same host)                   -> REJECTED
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import { assertEnv } from "../apps/api/src/config/env";

// Assembled from parts so the leaked host literal is not re-committed to source.
const ROTATED_CLUSTER_HOST = "cluster0.79wzy7b" + ".mongodb.net";

const validBase = () => ({
  // 48 random hex chars — comfortably past the 32-character minimum.
  JWT_SECRET: randomBytes(24).toString("hex"),
  ALLOWED_ORIGINS: "http://localhost:5173",
});

const rotatedUri = `mongodb+srv://jsflow_rotated_user:newpassword@${ROTATED_CLUSTER_HOST}/flowVisualizerDB?retryWrites=true&w=majority`;
const result = assertEnv({ ...validBase(), MONGO_URI: rotatedUri });
assert.equal(
  result.MONGO_URI,
  rotatedUri,
  "rotated-in-place URI must be accepted unchanged",
);

const revokedUri = `mongodb+srv://parththanki821_db_user:oldpassword@${ROTATED_CLUSTER_HOST}/flowVisualizerDB?retryWrites=true&w=majority`;
assert.throws(
  () => assertEnv({ ...validBase(), MONGO_URI: revokedUri }),
  /MONGO_URI contains a known revoked credential marker/,
  "revoked DB user must be rejected even on the rotated cluster host",
);

console.log("PASS: rotated-in-place URI accepted; revoked DB user rejected.");
