import { Response, Request } from "express";
import dbQuery from "../services/db";
import { isAnyUndefined, responses } from "../services/common";
import { UsersTableArr, facultyTableProps, questionsTableArr, subjectTableProps } from "../interfaces/manage";
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
    )) as UsersTableArr;
    return res.json({ questions: question });
  } catch (err) {
    console.log(err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}


export async function getSubjects(req: Request, res: Response) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const data = await dbQuery(
      `SELECT sem, sec, token FROM studentinfo WHERE rollno = TRIM('${username}')`
    );
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }
    const { sem, sec } = data[0];
    const subs = await dbQuery(
      `SELECT t1.subcode, subname, t1.facID, qtype, f.facName
      FROM (SELECT * FROM timetable WHERE sem = TRIM(${sem}) AND sec = TRIM('${sec}')) AS t1
      INNER JOIN subjects ON TRIM(t1.subcode) = TRIM(subjects.subcode)
      INNER JOIN faculty f ON TRIM(f.facID) = TRIM(t1.facID);`
    ) as subjectTableProps;
    return res.json({ sub: subs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function postScore(req: Request, res: Response) {
  try {
    const { stuID, facID, subCode, qtype, score, totalScore } = req.body;

    if (!stuID || !facID || !subCode || !score || totalScore === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const scoreValues = Object.values(score);

    if (qtype === "theory") {
      const query = `
      INSERT INTO theoryscore (rollno, facID, subcode, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, batch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
      await dbQuery(query, [stuID, facID, subCode, ...scoreValues, totalScore, 2021]);

      return res.json({ done: true });
    }
    else if (qtype === "lab") {
      const query = `
      INSERT INTO labscore (rollno, facID, subcode, q1, q2, q3, q4, q5, q6, q7, q8, score, batch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
      await dbQuery(query, [stuID, facID, subCode, ...scoreValues, totalScore, 2021]);

      return res.json({ done: true });
    }
  } catch (err) {
    console.error("Error while inserting score:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export async function updateToken(req: Request, res: Response) {
  const rollno = req.query.rollno as string;
  try {
    if (!rollno)
      return res.status(400).json({ error: "Missing required field: rollno" });

    const query = `UPDATE studentinfo SET token = 'done' WHERE rollno = '${rollno}';`
    await dbQuery(query);
    return res.json({ done: true });
  }catch(e){
    console.log(e);
  }
}

export async function unfilledstudents(req: Request, res: Response) {
  try {
    const unfilledstudents = await dbQuery(`SELECT rollno, name, sec, sem FROM STUDENTINFO WHERE TOKEN = 'UNDONE';`);
    return res.json({ done: true, unfilledstudents: unfilledstudents });

  } catch (err) {
    console.error("Error updating token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export async function token(req: Request, res: Response) {
  const rollno = req.query.rollno as string;
  try {
    if (!rollno)
      return res.status(400).json({ error: "Missing required field: rollno" });

    let query;

    query = `SELECT token FROM STUDENTINFO WHERE ROLLNO = '${rollno}'`;
    const result: any = await dbQuery(query);
    if (!result || result[0].token !== "done") {
      return res.json({ done: false });

    }
    return res.json({ done: true });
  } catch (err) {
    console.error("Error token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}



export async function getUserName(req: Request, res: Response) {
  try {
    const { rollno } = req.query;
    if (!rollno) {
      return res.status(400).json({ error: "rollno is required" });
    }
    const data = await dbQuery(
      `SELECT name FROM studentinfo WHERE rollno = '${rollno}'`
    );
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }
    const { name } = data[0];
    return res.json({ name: name });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export async function report(req: Request, res: Response) {
  try {

    const query = `
      SELECT COUNT(si.sec) as count, f.facID, ts.subcode, f.facName, si.sec, si.sem, SUM(ts.score) as totalScore
      FROM theoryscore ts
      JOIN faculty f ON ts.facID = f.facID
      JOIN studentinfo si ON ts.rollno = si.rollno
      GROUP BY ts.facID, ts.subcode, si.sec;
    `;

    // Execute the query
    const result: any = await dbQuery(query);
    if (result.length === 0) {
      return res.json({ done: false, sec: [] });
    }

    const data = result;

    for (const row of data) {
      const { count, facID, subcode, facName, sec, sem, totalScore } = row;
      const insertQuery = `
        INSERT INTO report (facID, facname, subcode, sec, sem, percentile)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        percentile = VALUES(percentile)
      `;

      await dbQuery(insertQuery, [
        facID,
        facName,
        subcode,
        sec,
        sem,
        (totalScore / count) * 20,
      ]);
    }

    const labquery = `
      SELECT COUNT(si.sec) as count, f.facID, ls.subcode, f.facName, si.sec, si.sem,
      SUM(ls.score) as totalScore
      FROM labscore ls 
      JOIN faculty f ON ls.facID = f.facID 
      JOIN studentinfo si ON ls.rollno = si.rollno 
      GROUP BY ls.subcode, f.facName, si.sec;
    `;

    // Execute the query
    const labresult: any = await dbQuery(labquery);
    if (labresult.length === 0) {
      return res.json({ done: false, sec: [] });
    }

    const labdata = labresult;

    for (const row of labdata) {
      const { count, subcode, facID, facName, sec, sem, totalScore } = row;
      const insertQuery = `
        INSERT INTO report (facID, facname, subcode, sec, sem, percentile)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        percentile = VALUES(percentile)
      `;

      await dbQuery(insertQuery, [
        facID,
        facName,
        subcode,
        sec,
        sem,
        (totalScore / count) * 20,
      ]);
    }

    const report: any = await dbQuery(`SELECT report.*, subjects.subname FROM report JOIN subjects ON TRIM(report.subcode) = TRIM(subjects.subcode);`);

    const sec: any = await dbQuery(`SELECT sec, sem FROM studentinfo GROUP BY sec, sem;`);
    Lstn70()
    return res.json({ done: true, sec: sec, report: report });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}

async function Lstn70() {
  try {
    for (let i = 1; i < 11; i++) {
      const theoryquery = `
        INSERT IGNORE INTO lstn70 (facID, subcode, sec, seq, avg)
        SELECT ts.facID, ts.subcode, r.sec, 'q${i}', AVG(q${i})
        FROM theoryscore ts
        JOIN report r ON ts.facID = r.facID and ts.subcode = r.subcode
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
      FROM labscore ls
      JOIN report r ON ls.facID = r.facID and ls.subcode = r.subcode
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
