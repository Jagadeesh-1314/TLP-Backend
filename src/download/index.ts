import { Router } from "express"; 
import downloadRouter from "./routes";
const router = Router(); 
 
// Defining the core path from which this module should be accessed
router.use("/download", downloadRouter);

 
export default router;  
