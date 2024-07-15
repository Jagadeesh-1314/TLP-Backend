import { Router } from 'express';
import { Connection } from 'mysql';
import {  getQuestions, getSubjects, getUserName, postScore, report, token, unfilledstudents, updateToken } from './controller';

const router: Router = Router();

router.get("/questions", getQuestions);
router.get("/subjects", getSubjects);
router.post("/score", postScore);
router.post("/token", token);
router.post("/updatetoken", updateToken);
router.get("/unfilledstudents", unfilledstudents);
router.get("/getUserName", getUserName);
router.get("/report", report)

export default router;