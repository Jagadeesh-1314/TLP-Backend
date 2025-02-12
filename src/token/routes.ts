import { Router } from 'express';
import { fetchTerm, token } from "./controller";

const router: Router = Router();

router.post("/token", token);
router.get("/fetchterm", fetchTerm);


export default router;