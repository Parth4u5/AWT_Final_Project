import express from "express";
import {
    createExample,
    deleteExample,
    getExamples,
} from "../controllers/exampleController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getExamples);
router.post("/", protect, adminOnly, createExample);
router.delete("/:id", protect, adminOnly, deleteExample);

export default router;
