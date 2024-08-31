import { Router } from 'express';
import { token, updateTokendone, updateTokenFacDone } from "./controller";

const router: Router = Router();

router.post("/updatetokendone", updateTokendone);
router.post("/updatetokenfacdone", updateTokenFacDone);
router.post("/token", token);


export default router;