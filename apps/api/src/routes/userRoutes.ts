import express from "express";

import { deleteUser, getUsers } from "../controllers/userController";
import { adminOnly, protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;
