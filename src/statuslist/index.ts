import { Router } from "express";
import statuslist from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/", statuslist);

export default router;