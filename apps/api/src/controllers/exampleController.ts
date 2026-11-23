import type { RequestHandler } from "express";
import type { Types } from "mongoose";

import Example from "../models/Example.js";

type CreateExampleBody = { title: string; code: string };

export const getExamples: RequestHandler = async (_req, res) => {
  try {
    const examples = await Example.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ examples });
  } catch (error) {
    console.error("GET EXAMPLES ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createExample: RequestHandler<
  Record<string, never>,
  unknown,
  CreateExampleBody
> = async (req, res) => {
  try {
    const { title, code } = req.body;

    if (!title || !code) {
      res.status(400).json({ message: "Title and code are required" });
      return;
    }

    const example = await Example.create({
      title,
      code,
      // Mongoose casts the JWT's string id to ObjectId at runtime, as before.
      createdBy: (req.user?.userId ?? "") as unknown as Types.ObjectId,
    });

    res.status(201).json({ message: "Example created", example });
  } catch (error) {
    console.error("CREATE EXAMPLE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteExample: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const example = await Example.findByIdAndDelete(id);
    if (!example) {
      res.status(404).json({ message: "Example not found" });
      return;
    }

    res.status(200).json({ message: "Example deleted successfully" });
  } catch (error) {
    console.error("DELETE EXAMPLE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
