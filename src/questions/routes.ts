import { Router } from 'express';
import {  getQuestions, getSubjects, unfilledstudents } from './controller';

const router: Router = Router();

router.get("/questions", getQuestions);
router.get("/subjects", getSubjects);
router.get("/unfilledstudents", unfilledstudents);

export default router;