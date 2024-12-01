
import { Router } from 'express';
import { cfreport, CFReportQuestions, fetchCFReport, fetchReport, fetchReportAverage, report, ReportAverage, ReportAverageQuestions, ReportQuestions, secList } from './controller';

const router: Router = Router();


router.post("/report", report);
// router.get("/report2", report2);
router.post("/reportavg", ReportAverage);
router.post("/cfreport", cfreport);
// router.get("/cfreport2", cfreport2);
router.post("/seclist", secList);
// router.post("/fetchreport1", fetchReport1);
router.post("/fetchreport", fetchReport);
router.post("/fetchavgreport", fetchReportAverage);
router.post("/fetchcfreport", fetchCFReport);
router.post("/cfreportquestions", CFReportQuestions);
router.post("/reportquestions", ReportQuestions);
router.post("/reportavgquestions", ReportAverageQuestions);

export default router;

