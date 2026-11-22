import dotenv from "dotenv";

import app from "./app.js";
import connectDB from "./config/db.js";
import { assertEnv } from "./config/env.js";

dotenv.config();

try {
  assertEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
