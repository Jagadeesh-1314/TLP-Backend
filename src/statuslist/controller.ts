import { Response, Request } from "express";
import dbQuery from "../services/db";

export async function unfilledstudents(req: Request, res: Response) {
  try {
    const { fbranch } = req.query;
    const countQuery = `SELECT * FROM term where branch = ?`;
    const count = await dbQuery(countQuery, [req.body.branchInToken]);
    
    const term = count.length > 0 ? count[0].term : null;

    const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
    const query: string = (`SELECT rollno, name, sec, sem, token${term} AS status FROM STUDENTINFO WHERE TOKEN${term} != 'DONE' AND branch = ?;`);
    const unfilledstudents: any = await dbQuery(query, [branch]);
    return res.json({ done: true, unfilledstudents: unfilledstudents });

  } catch (err) {
    console.error("Error updating token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
