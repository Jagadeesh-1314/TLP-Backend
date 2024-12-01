import { Response, Request } from "express";
import dbQuery from "../services/db";
import { responses } from "../services/common";
import { questionsTableArr, subjectTableProps } from "../interfaces/manage";


// Below are the common functionalites for managing studentInfo, Print and Paid entries

// ANCHOR Getting Student Details 

export async function getQuestions(req: Request, res: Response) {
  try {
    const question = (await dbQuery(
      "SELECT * FROM questions"
    )) as questionsTableArr;
    return res.json({ questions: question });
  } catch (err) {
    console.log(err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}


export async function getSubjects(req: Request, res: Response) {
  try {
    const username = req.body.usernameInToken;
    const count = await dbQuery(`SELECT * FROM COUNTTERM;`);
    const data: any = count;
    const term = data.length > 0 ? data[0].count : null;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const subjects =
      `SELECT sem, sec, branch, token${term} FROM studentinfo WHERE rollno = ?`

    const subsresults: any = await dbQuery(subjects, [username]);

    if (subsresults.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }

    const { sem, sec, branch } = subsresults[0];
    const query =
      `SELECT t1.subcode, subjects.subname, t1.facID, f.facName, subjects.qtype
      FROM (SELECT * FROM timetable WHERE sem = TRIM(?) AND sec = TRIM(?) AND branch = TRIM(?)) AS t1
      INNER JOIN subjects ON TRIM(t1.subcode) = TRIM(subjects.subcode)
      INNER JOIN faculty f ON TRIM(t1.facID) = TRIM(f.facID)
      UNION
      SELECT e.subcode, subjects.subname, e.facID, f.facName, subjects.qtype
      FROM electives e
      INNER JOIN faculty f ON TRIM(e.facID) = TRIM(f.facID)
      INNER JOIN subjects ON TRIM(e.subcode) = TRIM(subjects.subcode)
      WHERE TRIM(e.rollno) = TRIM(?) ORDER BY subcode;`
    const subs = await dbQuery(query, [sem, sec, branch, username]) as subjectTableProps;
    return res.json({ sub: subs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


