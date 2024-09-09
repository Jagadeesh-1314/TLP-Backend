import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import { isAnyUndefined, responses } from "../services/common";
import md5 from "md5";
import { UsersTableArr } from "../interfaces/manage";

// Below are the common functionalites for managing studentInfo, Print and Paid entries

// ANCHOR Getting Student Details 

export async function getTable(req: Request, res: Response) {
  const { tableName } = req.query;
  if (isAnyUndefined(tableName)) {
    res.status(400).json(responses.NotAllParamsGiven);
    return;
  }
  try {
    let query = `SELECT * FROM ${tableName}`;

    if (tableName === 'timetable') {
      query = `SELECT t.*, f.facname FROM timetable t JOIN faculty f ON t.facID = f.facID`;
    }
    if (tableName !== 'faculty' && tableName !== 'subjects') {
      query += ` WHERE branch = '${req.body.branchInToken}' ORDER BY sem, sec;`;
    }
    let timeTable: any = await dbQuery(query);
    timeTable = JSON.parse(JSON.stringify(timeTable));
    res.json({ tableData: timeTable });
  } catch (err) {
    logger.log("error", err);
    res.json(responses.ErrorWhileDBRequest);
  }
}

// ANCHOR Editing Student Details

export async function editStdDetails(req: Request, res: Response) {
  try {
    const rollNo: string = req.params.rollNo;
    const username: string = req.body.username;
    const tableName: string = req.body.tableName;
    const ip = req.ip as string;
    if (isAnyUndefined(req.body.details)) {
      return res.status(400).json(responses.BadRequest);
    }
    const acYear: number = parseInt(req.body.details.acYear)
    const sem: number = parseInt(req.body.details.sem);
    const oldSubCode: string = req.body.details.oldSubCode;
    const subCode: string = req.body.details.subCode;

    if (isAnyUndefined(rollNo, acYear, sem, tableName, oldSubCode, subCode)) {
      return res.status(400).json(responses.NotAllParamsGiven);
    }
    // Fetching the Subject Name for the Subject Code
    let subName: any = await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = '${subCode}'`
    );
    // Checking whether the given Subject Code do exists
    if (subName.length === 0)
      return res.json({ error: { message: "Invalid Subject Code" } });
    subName = subName[0].subName as string;
    let query: string;
    if (tableName === "studentInfo") {
      const grade: string = req.body.details.grade;
      const exYear: string = req.body.details.exYear;
      const exMonth: string = req.body.details.exMonth;
      if (isAnyUndefined(grade, exYear, exMonth)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      query = `UPDATE ${tableName} SET subCode = '${subCode}', subName = '${subName}', grade = '${grade}', acYear = ${acYear}, sem = ${sem}, exYear = ${exYear}, exMonth = ${exMonth} WHERE rollNo = '${rollNo}' AND subCode = '${oldSubCode}'`;
    } else if (tableName === "paidCBT") {
      let branch: string = req.body.details.branch;
      if (isAnyUndefined(username, branch)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      query = `UPDATE ${tableName} SET subCode = '${subCode}', subName = '${subName}', acYear= ${acYear}, sem = ${sem}, user = '${username}', branch = '${branch}' WHERE rollNo = '${rollNo}' AND subCode = '${oldSubCode}'`;
    } else if (tableName == "paidReEvaluation") {
      let stat: string = req.body.details.stat;
      if (isAnyUndefined(username, stat)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      query = `UPDATE ${tableName} SET subCode = '${subCode}', subName = '${subName}', acYear= ${acYear}, sem = ${sem}, user = '${username}', stat = '${stat === "R" ? `R` : ""
        }' WHERE rollNo = '${rollNo}' AND subCode = '${oldSubCode}'`;
    } else if (tableName == "paidSupply") {
      if (isAnyUndefined(username)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      query = `UPDATE ${tableName} SET subCode = '${subCode}', subName = '${subName}', acYear= ${acYear}, sem = ${sem}, user = '${username}' WHERE rollNo = '${rollNo}' AND subCode = '${oldSubCode}'`;
    }
    else {
      return res.status(400).json(responses.BadRequest);
    }

    await dbQuery(query);
    logger.log(`info`, `${req.body.usernameInToken} has updated ${rollNo} details in ${tableName} on IP ${ip?.slice(7)}`);
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
  return res.json({ updated: true });
}

// ANCHOR Adding Student Details

export async function addStdDetails(req: Request, res: Response) {
  const rollNo: string = req.params.rollNo;
  const { details } = req.body;
  const ip = req.ip as string;
  if (
    isAnyUndefined(
      rollNo,
      details.acYear,
      details.sem,
      details.subCode,
      details.exMonth,
      details.exYear,
      details.grade
    )
  ) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  const acYear: number = parseInt(details.acYear);
  const sem: number = parseInt(details.sem);
  const subCode: string = details.subCode;
  try {
    // Fetching the Subject Name for the Subject Code
    let subName: any = await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = '${subCode}'`
    );
    // Checking whether the given Subject Code do exists
    if (subName.length === 0)
      return res.json({ error: { message: "Invalid Subject Code" } });
    subName = subName[0].subName as string;

    const query: string = `INSERT IGNORE INTO studentInfo (rollNo, subCode, subName, grade, acYear, sem, exYear, exMonth) VALUES ("${rollNo}", "${subCode}", "${subName}", "${details.grade}", ${acYear}, ${sem}, "${details.exYear}", "${details.exMonth}")`;
    await dbQuery(query);
    logger.log(`info`, `${req.body.usernameInToken} has added ${rollNo} details in studentInfo on IP ${ip?.slice(7)}`);
    return res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

// ANCHOR Deleting Student Details

// Common functionalites for the print tables, paid tables and studentInfo tables

export async function deleteStdDetails(req: Request, res: Response) {
  let rollNo: string = req.query.rollNo as string;
  let subCodes: string[] = [];
  if (!isAnyUndefined(req.query.subCode)) {
    subCodes = JSON.parse(req.query.subCode as string) as string[];
  }
  let tableName: string = req.query.tableName as string;
  if (isAnyUndefined(rollNo, tableName)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  let ip = req.ip as string;
  try {
    // If subCodes is not given then it belongs to print tables
    await dbQuery(
      `DELETE FROM ${tableName} WHERE rollNo = '${rollNo}' ${subCodes.length === 0
        ? ""
        : `AND subCode IN ('${subCodes.join("','")}')`
      }`
    );
    logger.log(`info`, `${req.body.usernameInToken} has deleted ${rollNo} details in ${tableName} on IP ${ip?.slice(7)}`);
    res.json({ deleted: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}


export async function getUsers(_req: Request, res: Response) {
  try {
    const users = (await dbQuery(
      "SELECT username, displayName, branch FROM users"
    )) as UsersTableArr;
    return res.json({ users: users });
  } catch (err) {
    console.log(err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

//adding a new user
export async function addUser(req: Request, res: Response) {
  const username: string = req.body.details.username;
  const password: string = md5(req.body.details.password);
  const displayName: string = req.body.details.displayName;
  const branch: string = req.body.details.branch;
  console.log(req.body)
  if (isAnyUndefined(username, password, displayName, branch)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await dbQuery(
      `INSERT INTO users VALUES ('${username}','${password}','${displayName}', 'admin', '${branch}')`
    );
    res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

//deleting a user
export async function deleteUser(req: Request, res: Response) {
  const username = JSON.parse(req.query.username as string) as string[];
  if (isAnyUndefined(username)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await dbQuery(
      `DELETE FROM users WHERE username IN ('${username.join("','")}')`
    );
    res.json({ deleted: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

export async function updateUser(req: Request, res: Response) {
  const username: string = req.body.details.username;
  const oldUsername: string = req.body.details.oldUsername;
  const displayName: string = req.body.details.displayName;
  const password: string = req.body.details.password;
  if (isAnyUndefined(username, displayName)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }

  try {
    await dbQuery(
      `UPDATE users SET username = '${username}', displayName='${displayName}' ${Boolean(password) ? `, password='${md5(password)}'` : ""
      } WHERE username='${oldUsername}';`
    );
    res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

export async function getSubName(
  { params: { subCode } }: Request,
  res: Response
) {
  if (isAnyUndefined(subCode)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    const result = (await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = ? `,
      [subCode]
    )) as { subName: string }[];
    if (result.length == 0) return res.json(responses.InvalidParameterValue);

    res.json({ subName: result[0].subName });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}