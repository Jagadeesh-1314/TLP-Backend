import { Response, Request, NextFunction } from "express";
import md5 from "md5";
import dbQuery from "../services/db";
import * as logger from "../services/logger";
import { secret } from "../../config-local";

// Generate a token based on the username and secret
// function generateToken(username: string) {
//   return username + "@" + md5(username + secret);
  
// }

function generateToken(username: string, branch: string) {
  return `${username}@${branch}@${md5(username + branch + secret)}`;
}

// Middleware to verify the token
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const cookies = req.cookies;
  if (cookies) {
    const cookieValue = cookies.Token as string;
    if (cookieValue) {
      const [username, branch, _Token] = cookieValue.split("@");
      if (generateToken(username, branch) === cookieValue) {
        req.body.usernameInToken = username;
        req.body.branchInToken = branch; 
        // console.log(req.body.branchInToken);
        next();
        return;
      }
    }
  }
  res.status(401).send("Unauthorized");
}


// Middleware to check if the user is an admin
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.body.usernameInToken;
    const userQuery = `SELECT desg FROM users WHERE username = ?`;
    const userResult: any =  await dbQuery(userQuery, [username]);
    if (userResult[0].desg === "admin") {
      next();
    } else {
      res.status(403).json({ error: "Access denied: Admins only" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

// Example function to get designation (not used in middleware)
export async function desg(req: Request, res: Response) {
  const { username } = req.query;
  const userQuery = `SELECT desg FROM users WHERE username = ?`;
  const [userResult]: any = await dbQuery(userQuery, [username]);
  if (userResult) {
    res.json({ desg: userResult.desg });
  } else {
    res.json({ desg: 'null' });
  }
}

// Middleware to validate user login
export async function isUserValid(req: Request, res: Response) {
  const { username, password } = req.body;
  const ip = req.ip as string;
  const userDesg = `SELECT desg FROM USERS WHERE USERNAME = '${username}'`;
  
  const userQuery = `SELECT * FROM users WHERE BINARY username = ?`;
  const studentQuery = `SELECT rollno AS userName, password, Name as displayName, branch, batch FROM studentinfo WHERE BINARY rollno = ?`;

  try {
    const userResult: any = await dbQuery(userDesg);
    // console.log(userResult)
    let query;
    if (userResult.length === 0) {
      query = studentQuery;
    } else {
      query = userQuery;
    }

    const result: any = await dbQuery(query, [username]);
    // console.log(result[0])
    if (result.length !== 1) {
      res.json({
        goahead: false,
        error: `Username ${username} does not exist`,
      });
      return;
    }

    const passwordHash = md5(password);

    if (passwordHash !== result[0]["password"]) {
      res.json({ goahead: false, error: "Incorrect password" });
      return;
    }

    const designation = userResult.length > 0 ? 'admin' : 'null';

    logger.log("info", `${username} has logged in from ${ip.slice(7)}`);
    res.cookie("Token", generateToken(username, result[0]["branch"]), { httpOnly: true });

    res.json({
      goahead: true,
      username: result[0]["userName"],
      displayName: result[0]["displayName"],
      desg: designation,
      branch: result[0]["branch"],
      batch: result[0]["batch"],
    });
  } catch (err) {
    logger.log("error", err);
    res.status(500).json({
      goahead: false,
      error: "An unexpected error occurred while accessing the database.",
    });
  }
}
