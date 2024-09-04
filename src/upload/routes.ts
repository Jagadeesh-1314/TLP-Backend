import { Router } from "express";

import {
  // restoreStudentInfo,
  // uploadHandler,
  // uploadStudentInfo,
  // uploadCBTSubjects,
  // uploadFromLoc,
  uploadFile,
} from "./controller";
import multer from "multer";
import { isAdmin, verifyToken } from "../login/controller";


const tmpStorage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'tmp/');
  },
  filename: (req, file, cb) => {
      cb(null, `${file.fieldname}`);
  },
});

const upload = multer({ storage: tmpStorage });

const router: Router = Router();

// router.post("/results", uploadStudentInfo);

// router.post("/table/:tableName", uploadHandler);

router.post("/:tableName", upload.fields([{
  name: 'file'
}]),verifyToken, isAdmin, uploadFile);

// restoring backup file
// router.post("/studentinfo", restoreStudentInfo);

// router.post("/cbtsubjects", uploadCBTSubjects);

export default router;
