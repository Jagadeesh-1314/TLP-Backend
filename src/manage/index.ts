import { Router } from "express";
import manageRouter from "./routes";

const router = Router();

router.use("/manage", manageRouter)

export default router;