import { Router } from "express";
import loginRouter from "./routes";

const router = Router();


router.use("/", loginRouter)

export default router;