import { Router } from "express";

import {
  getTable,
  addUser,
  deleteUser,
  updateUser,
  getUsers,
  branchDetails,
  editDetails,
  addDetails,
  deleteDetails,
} from "./controller";

const router: Router = Router();

// Registering all the Manage Users routes
router.get("/table", getTable);

// Getting Branches
router.get("/branchdetails", branchDetails);
router.post("/database", addDetails);
router.patch("/database", editDetails);
router.delete("/database", deleteDetails);

// Getting Users
router.get("/users", getUsers);
// Adding a User
router.post("/user", addUser);
// Deleting a User
router.delete("/user", deleteUser);
// Updating the username
router.patch("/user", updateUser);

export default router;