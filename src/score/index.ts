import { Router } from "express";
import score from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/", score);

export default router;