import { Router } from "express";
import loginRouter from "./routes";
import rateLimit from "express-rate-limit";

const router = Router();

// Defining the core path from which this module should be accessed
const limiter = rateLimit({
    windowMs: 20 * 60 * 1000,
    max: 10,
  });
router.use(limiter)
router.use("/", loginRouter)

export default router;