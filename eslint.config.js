// ESLint discovers only eslint.config.* at the workspace root; the shared
// preset lives in tooling/eslint/base.js so every package inherits it.
module.exports = require("./tooling/eslint/base.js");
