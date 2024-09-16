import { Router } from 'express';
import { token } from "./controller";

const router: Router = Router();

router.post("/token", token);

export default router;