import { Response, Request } from "express";
import dbQuery from "../services/db";
import { responses } from "../services/common";
import { detailsArr, detailsProps, facultyTableProps, questionsTableArr, subjectsDetailsProps, subjectTableProps } from "../interfaces/manage";
interface ReportData {
  facID: number;
  facName: string;
  sec: string;
  totalScore: number;
}


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
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const subjects =
      `SELECT sem, sec, branch, token FROM studentinfo WHERE rollno = TRIM('${username}')`

    const subsresults: any = await dbQuery(subjects);

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
      WHERE TRIM(e.rollno) = (?);`
    const subs = await dbQuery(query, [sem, sec, branch, username]) as subjectTableProps;
    return res.json({ sub: subs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}



export async function unfilledstudents(req: Request, res: Response) {
  try {
    const branch = req.body.branchInToken;
    const unfilledstudents = await dbQuery(`SELECT rollno, name, sec, sem FROM STUDENTINFO WHERE TOKEN = 'UNDONE' AND branch = '${branch}';`);
    return res.json({ done: true, unfilledstudents: unfilledstudents });

  } catch (err) {
    console.error("Error updating token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export async function donestudents(req: Request, res: Response) {
  try {
    const branch = req.body.branchInToken;
    const { batch, sec, sem, term } = req.query;
    const donestudents: any = await dbQuery(`SELECT COUNT(DISTINCT ts.rollno) AS count
          FROM theoryscore${term} ts
          JOIN STUDENTINFO si ON ts.rollno = si.rollno
          WHERE si.branch = '${branch}'
            AND ts.batch = ${batch}
            AND ts.sem = ${sem}
            AND si.sec = '${sec}';
      `);
    const donetotstudents: any = await dbQuery(`SELECT count(*) as count FROM STUDENTINFO WHERE branch = '${branch}' AND batch=${batch} AND sec='${sec}';`);
    return res.json({ done: true, donestds: donestudents[0].count, donetotstds: donetotstudents[0].count });
  } catch (err) {
    console.error("Error updating token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}



async function Lstn70() {
  try {
    for (let i = 1; i < 11; i++) {
      const theoryquery = `
        INSERT IGNORE INTO lstn70 (facID, subcode, sec, seq, avg)
        SELECT ts.facID, ts.subcode, r.sec, 'q${i}', AVG(q${i})
        FROM theoryscore1 ts
        JOIN report1 r ON ts.facID = r.facID and ts.subcode = r.subcode
        WHERE r.percentile <= 70
        GROUP BY r.sec, ts.subcode;
      `;

      // Execute the query
      const theoryresult: any = await dbQuery(theoryquery);
      if (theoryresult.length === 0) {
        return;
      }
    }
    for (let i = 1; i < 9; i++) {
      const labquery = `
      INSERT IGNORE INTO lstn70 (facID, subcode, sec, seq, avg)
      SELECT ls.facID, ls.subcode, r.sec, 'q${i}', AVG(q${i})
      FROM labscore1 ls
      JOIN report1 r ON ls.facID = r.facID and ls.subcode = r.subcode
      WHERE r.percentile <= 70
      GROUP BY r.sec, ls.subcode;
    `;

      // Execute the query
      const labresult: any = await dbQuery(labquery);
      if (labresult.length === 0) {
        return;
      }

    }
  } catch (e) {
    console.log(e);
  }
}
