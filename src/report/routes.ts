
import { Router } from 'express';
import { cfreport1, cfreport2, fetchCFReport1, fetchCFReport2, fetchReport1, fetchReport2, report1, report2 } from './controller';

const router: Router = Router();


router.get("/report1", report1);
router.get("/report2", report2);
router.get("/cfreport1", cfreport1);
router.get("/cfreport2", cfreport2);
router.get("/fetchreport1", fetchReport1);
router.get("/fetchreport2", fetchReport2);
router.get("/fetchcfreport1", fetchCFReport1);
router.get("/fetchcfreport2", fetchCFReport2);

export default router;

