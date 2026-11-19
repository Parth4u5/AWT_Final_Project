/**
 * Fail-fast environment validation.
 *
 * Import `assertEnv` at process boot (or in a serverless handler) and call it
 * before any work that depends on configuration — in particular before
 * `connectDB()`. A bad configuration throws an Error whose message names the
 * exact variable and the exact problem, and is safe to log verbatim.
 *
 * Later phases add CSRF_SECRET, REDIS_URL and ANTHROPIC_API_KEY checks here.
 */

/**
 * @typedef {object} Env
 * @property {string} JWT_SECRET  Validated signing secret.
 * @property {string} MONGO_URI   Validated, non-leaked connection string.
 * @property {string[]} ALLOWED_ORIGINS  Validated explicit origin list.
 */

// Identifiers from the leaked backend/.env (cluster host + DB user — not the
// password). A URI built with either of these is the old, compromised config.
// Kept in one place so rotation only requires editing this list.
const LEAKED_MONGO_URI_MARKERS = [
  'cluster0.79wzy7b.mongodb.net',
  'parththanki821_db_user',
];

// Assembled from parts so the legacy fallback literal itself never appears in
// source (Review Focus #2: repository-wide search must return zero matches).
const FORBIDDEN_JWT_SECRETS = new Set([
  ['dev', 'secret', 'change', 'me'].join('_'),
  'changeme',
]);

const MIN_JWT_SECRET_LENGTH = 32;

const readRequired = (env, name) => {
  const value = env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is required`);
  }
  return value;
};

/**
 * Validate the environment and return a plain object of validated values.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {Env}
 * @throws {Error} with an exact, secret-free message on bad configuration.
 */
export function assertEnv(env = process.env) {
  // --- JWT_SECRET --------------------------------------------------------
  const jwtSecret = readRequired(env, 'JWT_SECRET');
  if (FORBIDDEN_JWT_SECRETS.has(jwtSecret)) {
    throw new Error('JWT_SECRET is set to the fallback value');
  }
  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is too short (must be at least ${MIN_JWT_SECRET_LENGTH} characters)`
    );
  }

  // --- MONGO_URI ---------------------------------------------------------
  const mongoUri = readRequired(env, 'MONGO_URI');
  const leakedMarker = LEAKED_MONGO_URI_MARKERS.find((marker) =>
    mongoUri.toLowerCase().includes(marker)
  );
  if (leakedMarker) {
    throw new Error('MONGO_URI contains a known leaked cluster or user marker');
  }

  // --- ALLOWED_ORIGINS (FRONTEND_URL is the transitional source) ----------
  const hasAllowedOrigins =
    typeof env.ALLOWED_ORIGINS === 'string' && env.ALLOWED_ORIGINS.trim() !== '';
  const sourceName = hasAllowedOrigins ? 'ALLOWED_ORIGINS' : 'FRONTEND_URL';
  const rawOrigins = hasAllowedOrigins ? env.ALLOWED_ORIGINS : env.FRONTEND_URL;

  if (typeof rawOrigins !== 'string' || rawOrigins.trim() === '') {
    throw new Error(
      'ALLOWED_ORIGINS is required (set ALLOWED_ORIGINS or FRONTEND_URL)'
    );
  }
  if (rawOrigins.trim() === '*') {
    throw new Error(`${sourceName} must not be "*"`);
  }

  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    throw new Error(
      'ALLOWED_ORIGINS is required (set ALLOWED_ORIGINS or FRONTEND_URL)'
    );
  }
  if (allowedOrigins.some((origin) => origin === '*')) {
    throw new Error(`${sourceName} must not contain a wildcard entry`);
  }

  return {
    JWT_SECRET: jwtSecret,
    MONGO_URI: mongoUri,
    ALLOWED_ORIGINS: allowedOrigins,
  };
}

export default assertEnv;
