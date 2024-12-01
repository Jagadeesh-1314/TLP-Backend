import { Router } from 'express';
import { unfilledstudents } from './controller';

const router: Router = Router();

router.get("/unfilledstudents", unfilledstudents);

export default router;