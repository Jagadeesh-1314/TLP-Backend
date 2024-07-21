import { Router } from 'express';
import { Connection } from 'mysql';
import {  getQuestions, getSubjects, getUserName, postScore, report1, token, unfilledstudents, incrementCount, updateToken, decrementCount, report2, getDetails, fetchReport1, fetchReport2, cfScore, cfreport2, fetchCFReport2, cfreport1, fetchCFReport1 } from './controller';

const router: Router = Router();

router.get("/questions", getQuestions);
router.get("/subjects", getSubjects);
router.post("/score", postScore);
router.post("/token", token);
router.post("/updatetoken", updateToken);
router.get("/unfilledstudents", unfilledstudents);
router.get("/getUserName", getUserName);
router.get("/report1", report1);
router.get("/report2", report2);
router.get("/details", getDetails);
router.post("/cfscore", cfScore);
router.get("/cfreport2", cfreport2);
router.get("/fetchcfreport2", fetchCFReport2);
router.get("/cfreport1", cfreport1);
router.get("/fetchcfreport1", fetchCFReport1);
router.get("/fetchreport1", fetchReport1);
router.get("/fetchreport2", fetchReport2);
router.post("/incrementcount", incrementCount);
router.post("/decrementcount", decrementCount);

export default router;