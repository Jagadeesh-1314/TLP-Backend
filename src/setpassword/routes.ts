import { Router } from "express";
import { requestOTP, scheduleEmails, setNewPassword, verifyOTP } from "./controller";


const router: Router = Router();

router.post("/setpassword", setNewPassword);
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/schedule-emails", scheduleEmails);

export default router;