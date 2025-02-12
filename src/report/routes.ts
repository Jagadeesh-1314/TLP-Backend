
import { Router } from 'express';
import { cfreport, CFReportAverage, CFReportQuestions, fetchCFReport, fetchReport, fetchReportAverage, report, ReportAverage, ReportAverageQuestions, ReportQuestions, secList } from './controller';

const router: Router = Router();


router.post("/seclist", secList);
router.post("/report", report);
router.post("/cfreport", cfreport);
router.post("/fetchreport", fetchReport);
router.post("/fetchcfreport", fetchCFReport);
router.post("/reportquestions", ReportQuestions);
router.post("/cfreportquestions", CFReportQuestions);
router.post("/reportavg", ReportAverage);
router.post("/fetchavgreport", fetchReportAverage);
router.post("/reportavgquestions", ReportAverageQuestions);
router.post("/cfreportaverage", CFReportAverage);

export default router;

