import { Router } from 'express';
import { token, updateToken } from "./controller";

const router: Router = Router();

router.post("/updatetoken", updateToken);
router.post("/token", token);


export default router;