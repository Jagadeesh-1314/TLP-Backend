import { Router } from "express";

import loginRouter from "./login";
import { verifyToken } from "./login/controller";
import uploadRouter from "./upload";
import manageRouter from "./manage"
import ques from "./questions";
import download from "./download";

const router = Router();

router.use("/", loginRouter);
router.use(verifyToken); // comment this to bypass login
router.use("/", manageRouter);
router.use("/", ques);
router.use("/", uploadRouter)
router.use("/", download)

export default router;
