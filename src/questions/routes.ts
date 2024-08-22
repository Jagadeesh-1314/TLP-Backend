import { Router } from 'express';
import {  getQuestions, getSubjects, unfilledstudents, getDetails, getElectiveSubjects, getFaculty } from './controller';

const router: Router = Router();

router.get("/questions", getQuestions);
router.get("/subjects", getSubjects);
router.get("/unfilledstudents", unfilledstudents);
router.get("/details", getDetails);
router.get("/electivesubjects", getElectiveSubjects);
router.get("/getfaculty", getFaculty);

export default router;