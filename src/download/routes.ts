import { Router } from "express";
import { downloadHandler, manageDBdownloadHandler, backupHandler, unfilledstudents, downloadReport, downloadCFReport, downloadReportQuestion, downloadAvgReport } from "./controller";

const router: Router = Router();

// Registering all the module routes here
router.get("/table", downloadHandler);
router.get("/manage-db/:rollNo", manageDBdownloadHandler);
router.get("/backup", backupHandler);
router.post("/unfilledlist", unfilledstudents);
router.get("/downloadreport", downloadReport);
router.get("/downloadcfreport", downloadCFReport);
router.get("/downloadreportquestion",downloadReportQuestion);
router.get("/downloadavgreport", downloadAvgReport);

export default router;
