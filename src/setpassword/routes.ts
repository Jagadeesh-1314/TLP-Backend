import { Router } from "express";
import {  requestOTP, setNewPassword, verifyOTP } from "./controller";


const router: Router = Router();

router.post("/request-otp", requestOTP);
router.post("/setpassword", setNewPassword);
router.post("/verify-otp", verifyOTP);

export default router;