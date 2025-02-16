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
    const branchInToken = req.body.branchInToken;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Fetch student details
    const subjectsQuery = `SELECT sem, sec, branch, batch FROM studentinfo WHERE rollno = ?`;
    const subsresults: any = await dbQuery(subjectsQuery, [username]);

    if (subsresults.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }

    const { sem, sec, branch, batch } = subsresults[0];

    // Fetch subjects
    const query =
      ` SELECT t1.subcode, subjects.subname, t1.facID, f.facName, subjects.qtype
      FROM (SELECT * FROM timetable WHERE sem = ? AND sec = ? AND branch = ? AND batch = ?) AS t1
      INNER JOIN subjects ON TRIM(t1.subcode) = TRIM(subjects.subcode)
      INNER JOIN faculty f ON TRIM(t1.facID) = TRIM(f.facID)
      UNION
      SELECT e.subcode, subjects.subname, e.facID, f.facName, subjects.qtype
      FROM electives e
      INNER JOIN faculty f ON TRIM(e.facID) = TRIM(f.facID)
      INNER JOIN subjects ON TRIM(e.subcode) = TRIM(subjects.subcode)
      WHERE TRIM(e.rollno) = TRIM(?) ORDER BY subcode;
    `;
    const subs = await dbQuery(query, [sem, sec, branch, batch, username]) as subjectTableProps;

    const isFmeActive = ((sem === 1 || sem === 2) && branch !== 'MBA') ? await (async () => {
      const fmeQuery = `SELECT status FROM term WHERE branch = 'FME'`;
      const fmeResult = await dbQuery(fmeQuery);
      return fmeResult.length > 0 && fmeResult[0].status === 'active';
    })() : false;

    const termQuery = `SELECT status FROM term WHERE branch = ?`;
    const termResult = await dbQuery(termQuery, [branchInToken]);

    const term = termResult.length > 0 ? termResult[0].status : null;
    const finalStatus = (isFmeActive ? 'active' : term);

    return res.json({ sub: subs, status: finalStatus });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


