import { Router } from "express";
import { downloadHandler, manageDBdownloadHandler, backupHandler, unfilledstudents, downloadReport } from "./controller";

const router: Router = Router();

// Registering all the module routes here
router.get("/table", downloadHandler);
router.get("/manage-db/:rollNo", manageDBdownloadHandler);
router.get("/backup", backupHandler);
router.post("/unfilledlist", unfilledstudents);
router.get("/downloadReport", downloadReport);

export default router;
