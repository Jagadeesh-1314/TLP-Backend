import { Router } from "express";
import loginRouter from "./login";
import { isAdmin, verifyToken } from "./login/controller";
import uploadRouter from "./upload";
import manageRouter from "./manage";
import ques from "./questions";
import download from "./download";
import token from "./token";
import term from "./term";
import report from "./report";
import score from "./score";
import electives from "./electives";

const router = Router();

router.use("/", loginRouter);

router.use(verifyToken); 


router.use("/", ques);
router.use("/", token);
router.use("/", score);

router.use(isAdmin);  
router.use("/", manageRouter);
router.use("/", report);
router.use("/", term);
router.use("/", electives);
router.use("/", uploadRouter);
router.use("/", download);

export default router;
