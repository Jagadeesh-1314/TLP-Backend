import { Router } from "express";

import { desg, isUserValid } from "./controller";

const router: Router = Router();

// Registering all the login module routes
router.post("/login", isUserValid);
router.get("/desg", desg);

export default router;
