import dotenv from "dotenv";

import app from "./app";
import connectDB from "./config/db";
import { assertEnv } from "./config/env";

dotenv.config();

try {
  assertEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const port = process.env.PORT || "5000";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
};

void startServer();
