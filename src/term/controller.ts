import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function fetchTerm(req: Request, res: Response) {
  try {
    const result = await dbQuery(`SELECT * FROM COUNTTERM;`);
    const data: any = result;
    if (data.length > 0) {
      const term = data[0].count;
      return res.json({ done: true, term: term });
    } else {
      return res.json({ done: false, term: null });
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


export async function term1(req: Request, res: Response) {
  try {
    const result = dbQuery(`
      
      UPDATE COUNTTERM SET COUNT = 2;
      UPDATE STUDENTINFO SET token = "undone" where branch = '${req.body.branchInToken}';      
      `);

    return res.json({ done: true, term: 2 });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


export async function term2(req: Request, res: Response) {
  try {
    const result = dbQuery(`
      UPDATE COUNTTERM SET COUNT = 1;
      UPDATE STUDENTINFO SET token = "undone" where branch = '${req.body.branchInToken}';
    `);
    return res.json({ done: true, term: 1 });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}

export async function promote(req: Request, res: Response) {
  try {
    const { branchInToken: branch, sem } = req.body;

    if (sem === undefined) {
      const result: any = await dbQuery(`
        SELECT DISTINCT sem FROM studentinfo WHERE branch = '${branch}';
      `);

      const semesters = result.map((row: { sem: number }) => row.sem);
      return res.json({ done: true, semesters: semesters });
    } else {
      const nextSem = sem + 1;
      const checkNextSem: any = await dbQuery(`
        SELECT COUNT(*) AS count FROM studentinfo 
        WHERE sem = ${nextSem} AND branch = '${branch}';
      `);
      if (checkNextSem[0].count > 0) {
        return res.json({ done: false });
      }
      await dbQuery(`
        DELETE FROM studentinfo
        WHERE sem = 8 AND branch = '${branch}';

        UPDATE studentinfo
        SET sem = sem + 1
        WHERE sem = ${sem} AND branch = '${branch}';

        UPDATE studentinfo
        SET token = 'undone' WHERE branch = '${branch}';

        -- UPDATE COUNTTERM SET COUNT = 1;
      `);

      return res.json({ done: true });
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}

