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
import statuslist from "./statuslist";
import setnewpassword from "./setpassword";

const router = Router();

router.use("/", loginRouter);
router.use("/", setnewpassword);

router.use(verifyToken); 

router.use("/", ques);
// In token i have added the fecch term function
router.use("/", token);
router.use("/", score);

router.use(isAdmin);  
router.use("/", manageRouter);
router.use("/", statuslist);
router.use("/", report);
router.use("/", term);
router.use("/", electives);
router.use("/", uploadRouter);
router.use("/", download);

export default router;
