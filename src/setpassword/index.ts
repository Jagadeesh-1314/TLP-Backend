import { Router } from "express";
import setnewpassword from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/", setnewpassword);

export default router;