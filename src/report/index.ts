import { Router } from "express";
import report from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/", report);

export default router;