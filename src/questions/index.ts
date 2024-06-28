import { Router } from "express";
import ques from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/", ques)

export default router;