import { Router } from 'express';
import {  getQuestions, getSubjects, unfilledstudents, getDetails } from './controller';

const router: Router = Router();

router.get("/questions", getQuestions);
router.get("/subjects", getSubjects);
router.get("/unfilledstudents", unfilledstudents);
router.get("/details", getDetails);

export default router;