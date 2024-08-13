import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function postScore(req: Request, res: Response) {
    try {
      const data: any = await dbQuery(`SELECT * FROM COUNTTERM;`);
      const { count } = data[0];
      console.log(req.body)
      const { usernameInToken: stuID, facID, subCode, qtype, score, totalScore, batch } = req.body;
      console.log(req.body.usernameInToken)
      // console.log(stuID);
      if (!stuID || !facID || !subCode || !score || totalScore === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const scoreValues = Object.values(score);
      if (count === 1) {
        if (qtype === "theory") {
          const query = `
        INSERT INTO theoryscore1 (rollno, facID, subcode, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, batch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
          await dbQuery(query, [stuID, facID, subCode, ...scoreValues, totalScore, batch]);
  
          return res.json({ done: true });
        }
        else if (qtype === "lab") {
          const query = `
        INSERT INTO labscore1 (rollno, facID, subcode, q1, q2, q3, q4, q5, q6, q7, q8, score, batch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
          await dbQuery(query, [stuID, facID, subCode, ...scoreValues, totalScore, batch]);
  
          return res.json({ done: true });
        }
      } else if (count === 2) {
        if (qtype === "theory") {
          const query = `
        INSERT INTO theoryscore2 (rollno, facID, subcode, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, batch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
          await dbQuery(query, [stuID, facID, subCode, ...scoreValues, totalScore, batch]);
  
          return res.json({ done: true });
        }
        else if (qtype === "lab") {
          const query = `
        INSERT INTO labscore2 (rollno, facID, subcode, q1, q2, q3, q4, q5, q6, q7, q8, score, batch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
          await dbQuery(query, [stuID, facID, subCode, ...scoreValues, totalScore, batch]);
  
          return res.json({ done: true });
        }
      }
    } catch (err) {
      console.error("Error while inserting score:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }


  export async function cfScore(req: Request, res: Response) {
    try {
  
      const data: any = await dbQuery(`SELECT * FROM COUNTTERM;`);
      const { count } = data[0];
      const { stuID, branch, score, totalScore, batch } = req.body;
  
      if (!stuID || !branch || !score || totalScore === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const scoreValues = Object.values(score);
      if (count === 1) {
        const query = `
        INSERT INTO cf1 (rollno, branch, batch, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
        await dbQuery(query, [stuID, branch, batch, ...scoreValues, totalScore]);
        return res.json({ done: true });
      } else if (count === 2) {
        const query = `
        INSERT INTO cf2 (rollno, branch, batch, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
        await dbQuery(query, [stuID, branch, batch, ...scoreValues, totalScore]);
  
        return res.json({ done: true });
      }
    } catch (err) {
      console.error("Error while inserting score:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }