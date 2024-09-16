import { Router } from 'express';
import { donestudents, unfilledstudents } from './controller';

const router: Router = Router();

router.get("/unfilledstudents", unfilledstudents);
router.get("/donestudents",donestudents );

export default router;