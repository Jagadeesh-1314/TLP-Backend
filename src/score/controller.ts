import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function postScore(req: Request, res: Response) {
  try {
    const { scores } = req.body;
    const username = req.body.usernameInToken;
    const userQuery = `SELECT sem, sec, branch, batch FROM studentinfo WHERE rollno = TRIM('${username}')`;
    const userResults: any = await dbQuery(userQuery);
    const { sem, sec, branch, batch } = userResults[0];

    const countQuery = `SELECT * FROM term where branch = ?`;
    const count = await dbQuery(countQuery, [branch]);
    
    const term = count.length > 0 ? count[0].term : null;
    const status = count.length > 0 ? count[0].status : null;

    if(status !== 'active') {
      return res.json({ status: status, error: 'Feedback is inactive!' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }

    const subjectMap = new Map<string, { qtype: string; facID: string }>();

    const subjectQuery = `
      SELECT t1.subcode AS subCode, subjects.subname, t1.facID, f.facName, subjects.qtype
      FROM (SELECT * FROM timetable WHERE sem = TRIM(?) AND sec = TRIM(?) AND branch = TRIM(?)) AS t1
      INNER JOIN subjects ON TRIM(t1.subcode) = TRIM(subjects.subcode)
      INNER JOIN faculty f ON TRIM(t1.facID) = TRIM(f.facID)
      UNION
      SELECT e.subcode AS subCode, subjects.subname, e.facID, f.facName, subjects.qtype
      FROM electives e
      INNER JOIN faculty f ON TRIM(e.facID) = TRIM(f.facID)
      INNER JOIN subjects ON TRIM(e.subcode) = TRIM(subjects.subcode)
      WHERE TRIM(e.rollno) = TRIM(?)
      ORDER BY subCode;
    `;

    const subjects: any = await dbQuery(subjectQuery, [sem, sec, branch, username]);
    subjects.forEach((subject: { subCode: string; qtype: string; facID: string; }) => {
      if (subject.subCode) {
        subjectMap.set(subject.subCode, { qtype: subject.qtype, facID: subject.facID });
      } else {
        console.warn('Skipping subject with undefined subCode:', subject);
      }
    });


    const allParamsArray: { query: string, params: any[] }[] = [];

    for (let scoreData of scores) {
      const { subCode, score } = scoreData;
      const subjectInfo = subjectMap.get(subCode);
      if (!subjectInfo) {
        return res.status(400).json({ error: `Subject ${subCode} not found.` });
      }
      const { qtype, facID } = subjectInfo;

      const scoreValues: number[] = Object.values(score).map(value => Number(value));
      if (!scoreValues.every((val: number) => val >= 1 && val <= 5)) {
        return res.status(400).json("Score values must be between 1 and 5");
      }

      let totalScore: number;

      // Handle theory
      if (qtype === "theory") {
        if (scoreValues.length !== 10) {
          return res.status(400).json({ error: "Theory scores must have 10 values" });
        }
        totalScore = scoreValues.reduce((acc, val) => acc + val, 0) / scoreValues.length;

        const theoryQuery = `
          INSERT INTO theoryscore${term} (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, batch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const queryParams = [username, facID, subCode, sem, ...scoreValues, totalScore, batch];

        allParamsArray.push({ query: theoryQuery, params: queryParams });

      } else if (qtype === "lab") {
        // Handle lab
        if (scoreValues.length !== 8) {
          return res.status(400).json({ error: "Lab scores must have 8 values" });
        }
        totalScore = scoreValues.reduce((acc, val) => acc + val, 0) / scoreValues.length;

        const labQuery = `
          INSERT INTO labscore${term} (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, score, batch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const queryParams = [username, facID, subCode, sem, ...scoreValues, totalScore, batch];

        allParamsArray.push({ query: labQuery, params: queryParams });

      } else {
        return res.status(400).json({ error: "Invalid qtype" });
      }
    }

    // console.log(allParamsArray.map(({ query, params }) => ({ query, params })));

    // const substitutedQueries = allParamsArray.map(({ query, params }) => {
    //   let i = 0;
    //   const substitutedQuery = query.replace(/\?/g, () => params[i++]);
    //   return substitutedQuery;
    // });
    // console.log(substitutedQueries);



    const executeBatch = allParamsArray.map(({ query, params }) => dbQuery(query, params));
    const results: any = await Promise.all(executeBatch);
    const allProtocol41 = results.every((result: { protocol41: boolean }) => result.protocol41);
    if (allProtocol41) {
      const tokenQuery = `UPDATE studentinfo SET token${term} = 'facdone' WHERE rollno = (?)`;
      await dbQuery(tokenQuery, [username]);
      return res.json({ done: true });
    }
    return res.json({ done: false })
  } catch (err) {
    console.error("Error while inserting score:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export async function cfScore(req: Request, res: Response) {
  try {
    const { scores } = req.body;
    const username = req.body.usernameInToken;

    const userQuery = `SELECT sem, branch, batch FROM studentinfo WHERE rollno = TRIM(?)`;
    const userResults: any = await dbQuery(userQuery, [username]);
    const { sem, branch, batch } = userResults[0];

    const countQuery = `SELECT * FROM term where branch = ?`;
    const count = await dbQuery(countQuery, [branch]);
    
    const term = count.length > 0 ? count[0].term : null;
    const status = count.length > 0 ? count[0].status : null;

    if(status !== 'active') {
      return res.json({ status: status, error: 'Feedback is inactive!' });
    }

    const tokenQuery = `SELECT token${term} FROM studentinfo WHERE rollno = ?`;
    const tokenResults: any = await dbQuery(tokenQuery, [username]);
    const token = tokenResults[0][`token${term}`];

    

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }

    if (token === 'undone') {
      res.json({ done: false, error: 'You should do Subjects Feedback First' });
      return;
    }

    const scoreValues: number[] = Object.values(scores[Object.keys(scores).length - 1]).map(value => Number(value));
    if (!scoreValues.every((val: number) => val >= 1 && val <= 5)) {
      throw new Error("Score values must be between 1 and 5");
    }

    if (scoreValues.length !== 17) {
      return res.status(400).json({ error: "CF scores must have 17 values" });
    }
    const totalScore = scoreValues.reduce((acc, val) => acc + val, 0) / scoreValues.length;

    const query = `
        INSERT INTO cf${term} (rollno, branch, batch, sem, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
    const results: any = await dbQuery(query, [username, branch, batch, sem, ...scoreValues, totalScore]);
    if (results.protocol41) {
      const token = `UPDATE studentinfo SET token${term} = 'done' WHERE rollno = (?)`
      await dbQuery(token, [username]);
      return res.json({ done: true });
    }
    return res.json({ done: false });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}