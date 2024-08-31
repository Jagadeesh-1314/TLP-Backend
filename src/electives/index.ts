import { Router } from "express";
import electives from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/", electives);

export default router;