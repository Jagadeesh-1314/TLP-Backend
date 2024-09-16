import { Router } from 'express';
import {  getQuestions, getSubjects } from './controller';

const router: Router = Router();

router.get("/questions", getQuestions);
router.get("/subjects", getSubjects);

export default router;