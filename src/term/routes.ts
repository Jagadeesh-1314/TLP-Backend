import { Router } from 'express';
import { promote, term1, term2 } from './controller';

const router: Router = Router();

router.post("/term1", term1);
router.post("/term2", term2);
router.post("/promote", promote);


export default router;