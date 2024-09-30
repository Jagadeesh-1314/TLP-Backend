import { Response, Request } from "express";
import dbQuery from "../services/db";
import { subjectTableProps } from "../interfaces/manage";
import { error } from "console";


// export async function postScore(req: Request, res: Response) {
//     try {
//       const data: any = await dbQuery(`SELECT * FROM COUNTTERM;`);
//       const { count } = data[0];
//       let { usernameInToken: stuID, facID, subCode, semInToken: sem , qtype, score, totalScore, batch } = req.body;
//       // console.log(req.body.usernameInToken)
//       // // console.log(stuID);
//       if (!stuID || !facID || !subCode || !score || totalScore === undefined) {
//         return res.status(400).json({ error: "Missing required fields" });
//       }
//       const scoreValues = Object.values(score);
//       subCode = subCode.trim();
//       sem = parseInt(sem)
//       if (count === 1) {
//         if (qtype === "theory") {
//           const query = `
//         INSERT INTO theoryscore1 (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, batch)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//           await dbQuery(query, [stuID, facID, subCode, sem, ...scoreValues, totalScore, batch]);

//           return res.json({ done: true });
//         }
//         else if (qtype === "lab") {
//           const query = `
//         INSERT INTO labscore1 (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, score, batch)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//           await dbQuery(query, [stuID, facID, subCode, sem, ...scoreValues, totalScore, batch]);

//           return res.json({ done: true });
//         }
//       } else if (count === 2) {
//         if (qtype === "theory") {
//           const query = `
//         INSERT INTO theoryscore2 (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, batch)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//           await dbQuery(query, [stuID, facID, subCode, sem, ...scoreValues, totalScore, batch]);

//           return res.json({ done: true });
//         }
//         else if (qtype === "lab") {
//           const query = `
//         INSERT INTO labscore2 (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, score, batch)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//           await dbQuery(query, [stuID, facID, subCode, sem, ...scoreValues, totalScore, batch]);

//           return res.json({ done: true });
//         }
//       }
//     } catch (err) {
//       console.error("Error while inserting score:", err);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//   }


// export async function postScore(req: Request, res: Response) {
//   try {
//     const { scores } = req.body;
//     const username = req.body.usernameInToken;
//     const userQuery = `SELECT sem, sec, branch, batch FROM studentinfo WHERE rollno = TRIM('${username}')`;
//     const userResults: any = await dbQuery(userQuery);

//     if (userResults.length === 0) {
//       return res.status(404).json({ error: "User not found or no data available" });
//     }

//     const { sem, sec, branch, batch } = userResults[0];
//     const subjectMap = new Map<string, { qtype: string; facID: string }>();

//     const subjectQuery = `
//       SELECT t1.subcode AS subCode, subjects.subname, t1.facID, f.facName, subjects.qtype
//       FROM (SELECT * FROM timetable WHERE sem = TRIM(?) AND sec = TRIM(?) AND branch = TRIM(?)) AS t1
//       INNER JOIN subjects ON TRIM(t1.subcode) = TRIM(subjects.subcode)
//       INNER JOIN faculty f ON TRIM(t1.facID) = TRIM(f.facID)
//       UNION
//       SELECT e.subcode AS subCode, subjects.subname, e.facID, f.facName, subjects.qtype
//       FROM electives e
//       INNER JOIN faculty f ON TRIM(e.facID) = TRIM(f.facID)
//       INNER JOIN subjects ON TRIM(e.subcode) = TRIM(subjects.subcode)
//       WHERE TRIM(e.rollno) = TRIM(?)
//       ORDER BY subCode;
//     `;
//     const subjects: any = await dbQuery(subjectQuery, [sem, sec, branch, username]);
//     subjects.forEach((subject: { subCode: string; qtype: string; facID: string; }) => {
//       if (subject.subCode) {
//         subjectMap.set(subject.subCode, { qtype: subject.qtype, facID: subject.facID });
//       } else {
//         console.warn('Skipping subject with undefined subCode:', subject);
//       }
//     });

//     const countData: any = await dbQuery(`SELECT * FROM COUNTTERM;`);
//     const { count } = countData[0];
//     let checkTheory: any;
//     let checkLab: any;

//     for (let scoreData of scores) {
//       const { subCode, score } = scoreData;
//       const subjectInfo = subjectMap.get(subCode);
//       if (!subjectInfo) {
//         return res.status(400).json({ error: `Subject ${subCode} not found.` });
//       }
//       const { qtype, facID } = subjectInfo;

//       const scoreValues: number[] = Object.values(score).map(value => Number(value));
//       if (!scoreValues.every((val: number) => val >= 1 && val <= 5)) {
//         throw new Error("Score values must be between 1 and 5");
//       }

//       // score calculation
//       let totalScore: number;
//       if (qtype === "theory") {
//         if (scoreValues.length !== 10) {
//           return res.status(400).json({ error: "Theory scores must have 10 values" });
//         }
//         totalScore = scoreValues.reduce((acc, val) => acc + val, 0) / scoreValues.length;
//       } else if (qtype === "lab") {
//         if (scoreValues.length !== 8) {
//           return res.status(400).json({ error: "Lab scores must have 8 values" });
//         }
//         totalScore = scoreValues.reduce((acc, val) => acc + val, 0) / scoreValues.length;
//       } else {
//         return res.status(400).json({ error: "Invalid qtype" });
//       }

//       if (qtype === "theory") {
//         const query = `
//             INSERT INTO theoryscore${count} (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, batch)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//           `;
//         checkTheory = await dbQuery(query, [username, facID, subCode, sem, ...scoreValues, totalScore, batch]);
//       } else if (qtype === "lab") {
//         const query = `
//             INSERT INTO labscore${count} (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, score, batch)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//           `;
//         checkLab = await dbQuery(query, [username, facID, subCode, sem, ...scoreValues, totalScore, batch]);
//       }
//     }
//     if (checkLab.protocol41 && checkTheory.protocol41) {
//       const token = `UPDATE studentinfo SET token = 'facdone' WHERE rollno = (?)`
//       await dbQuery(token, [username]);
//     }

//     return res.json({ done: true });
//   } catch (err) {
//     console.error("Error while inserting score:", err);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// }

export async function postScore(req: Request, res: Response) {
  try {
    const { scores } = req.body;
    const username = req.body.usernameInToken;
    const userQuery = `SELECT sem, sec, branch, batch FROM studentinfo WHERE rollno = TRIM('${username}')`;
    const userResults: any = await dbQuery(userQuery);
    const countData: any = await dbQuery(`SELECT * FROM COUNTTERM;`);
    const { count } = countData[0];

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }

    const { sem, sec, branch, batch } = userResults[0];
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
          INSERT INTO theoryscore${count} (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, batch)
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
          INSERT INTO labscore${count} (rollno, facID, subcode, sem, q1, q2, q3, q4, q5, q6, q7, q8, score, batch)
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
      const tokenQuery = `UPDATE studentinfo SET token = 'facdone' WHERE rollno = (?)`;
      await dbQuery(tokenQuery, [username]);  
      return res.json({ done: true });
    }
    return res.json({ done : false })
  } catch (err) {
    console.error("Error while inserting score:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export async function cfScore(req: Request, res: Response) {
  try {
    const { scores } = req.body;
    const username = req.body.usernameInToken;
    const data: any = await dbQuery(`SELECT * FROM COUNTTERM;`);
    const { count } = data[0];
    const userQuery = `SELECT sem, branch, batch, token FROM studentinfo WHERE rollno = TRIM(?)`;
    const userResults: any = await dbQuery(userQuery, [username]);

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }
    const { sem, branch, batch, token } = userResults[0];

    if(token === 'undone'){
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
        INSERT INTO cf${count} (rollno, branch, batch, sem, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
    const results: any = await dbQuery(query, [username, branch, batch, sem, ...scoreValues, totalScore]);
    if (results.protocol41) {
      const token = `UPDATE studentinfo SET token = 'done' WHERE rollno = (?)`
      await dbQuery(token, [username]);
      return res.json({ done: true });
    }
    return res.json({ done: false });
  } catch (err) {
    console.error("Error while inserting score:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}