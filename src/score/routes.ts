import { Router } from 'express';
import { cfScore, postScore } from './controller';

const router: Router = Router();

router.post("/score", postScore);
router.post("/cfscore", cfScore);


export default router;