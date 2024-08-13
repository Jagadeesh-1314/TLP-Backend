import { Router } from "express";
import term from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/", term)

export default router;