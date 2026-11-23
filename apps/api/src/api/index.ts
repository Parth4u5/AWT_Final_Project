import dotenv from "dotenv";
import type { RequestHandler } from "express";

import app from "../app.js";
import connectDB from "../config/db.js";
import { assertEnv } from "../config/env.js";

dotenv.config();

let bootstrapped = false;
let configError: Error | null = null;

try {
  assertEnv();
} catch (error) {
  configError = error instanceof Error ? error : new Error(String(error));
  console.error(configError.message);
}

type HandlerRequest = Parameters<RequestHandler>[0];
type HandlerResponse = Parameters<RequestHandler>[1];

export default async function handler(
  req: HandlerRequest,
  res: HandlerResponse,
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
