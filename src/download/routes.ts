import { Router } from "express";
import { downloadHandler, manageDBdownloadHandler, backupHandler } from "./controller";

const router: Router = Router();

// Registering all the module routes here
router.get("/table", downloadHandler);
router.get("/manage-db/:rollNo", manageDBdownloadHandler);
router.get("/backup", backupHandler);

export default router;
