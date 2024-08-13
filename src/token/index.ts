import { Router } from "express";
import token from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/", token)

export default router;