import { Router } from "express";

import { isUserValid } from "./controller";
import { rateLimit } from "express-rate-limit";
import { rateLimitOn } from "../../config-local";

const router: Router = Router();

// Defining the core path from which this module should be accessed
if (rateLimitOn) {
    const limiter = rateLimit({
        windowMs: 5 * 60 * 1000,
        max: 20,
    });

    // Registering all the login module routes
    router.post("/login", limiter, isUserValid);
} else {
    router.post("/login", isUserValid);
}



export default router;
