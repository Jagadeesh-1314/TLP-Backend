import { Router } from 'express';
import { getDetails, getElectiveSubjects, getFaculty, postElectivesDetails } from './controller';

const router: Router = Router();

router.get("/details", getDetails);
router.get("/electivesubjects", getElectiveSubjects);
router.get("/getfaculty", getFaculty);
router.post("/electivedetails", postElectivesDetails);
export default router;