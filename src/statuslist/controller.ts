import { Response, Request } from "express";
import dbQuery from "../services/db";

export async function unfilledstudents(req: Request, res: Response) {
  try {
    const { fbranch } = req.query;
    const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
    // console.log(branch)
    const unfilledstudents = await dbQuery(`SELECT rollno, name, sec, sem FROM STUDENTINFO WHERE TOKEN != 'DONE' AND branch = '${branch}';`);
    return res.json({ done: true, unfilledstudents: unfilledstudents });

  } catch (err) {
    console.error("Error updating token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


export async function donestudents(req: Request, res: Response) {
  try {
    const { batch, sec, sem, term, branch } = req.query;
    const branchControl = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : branch;
    const donestudents: any = await dbQuery(`SELECT COUNT(DISTINCT ts.rollno) AS count
            FROM theoryscore${term} ts
            JOIN STUDENTINFO si ON ts.rollno = si.rollno
            WHERE si.branch = '${branchControl}'
              AND ts.batch = ${batch}
              AND ts.sem = ${sem}
              AND si.sec = '${sec}';
        `);
    const donetotstudents: any = await dbQuery(`SELECT count(*) as count FROM STUDENTINFO WHERE branch = '${branchControl}' AND batch=${batch} AND sec='${sec}' AND sem = ${sem};`);
    return res.json({ done: true, donestds: donestudents[0].count, donetotstds: donetotstudents[0].count });
  } catch (err) {
    console.error("Error updating token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}