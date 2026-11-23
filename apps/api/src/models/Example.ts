import mongoose from "mongoose";

import type { IExample } from "../types/models.js";

const exampleSchema = new mongoose.Schema<IExample>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Example = mongoose.model<IExample>("Example", exampleSchema);

export default Example;
