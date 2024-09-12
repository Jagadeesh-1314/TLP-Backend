import { Router } from "express";

import { desg, isUserValid } from "./controller";
import { rateLimit } from "express-rate-limit";

const router: Router = Router();

// Defining the core path from which this module should be accessed
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
});

// Registering all the login module routes
router.post("/login", limiter, isUserValid);

router.get("/desg", desg);


export default router;
