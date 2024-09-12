import { Router } from 'express';
import {  donestudents, getQuestions, getSubjects, unfilledstudents } from './controller';

const router: Router = Router();

router.get("/questions", getQuestions);
router.get("/subjects", getSubjects);
router.get("/unfilledstudents", unfilledstudents);
router.get("/donestudents", donestudents);

export default router;