import { Router } from "express";
import loginRouter from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/upload", loginRouter)

export default router;