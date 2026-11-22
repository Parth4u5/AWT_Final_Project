import dotenv from "dotenv";
import type { Request, Response } from "express";

import app from "../app";
import connectDB from "../config/db";
import { assertEnv } from "../config/env";

dotenv.config();

let bootstrapped = false;
let configError: Error | null = null;

try {
  assertEnv();
} catch (error) {
  configError = error instanceof Error ? error : new Error(String(error));
  console.error(configError.message);
}

export default async function handler(
  req: Request,
  res: Response,
): Promise<unknown> {
  try {
    if (configError) {
      return res.status(500).json({ message: "Server initialization failed" });
    }

    if (!bootstrapped) {
      await connectDB();
      bootstrapped = true;
    }

    return app(req, res);
  } catch (error) {
    console.error(
      "Vercel function bootstrap failed:",
      error instanceof Error ? error.message : String(error),
    );
    return res.status(500).json({ message: "Server initialization failed" });
  }
}
