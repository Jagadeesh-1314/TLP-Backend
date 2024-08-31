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
    const branch = req.body.branchInToken;
    await dbQuery(` 
              DELETE FROM studentinfo
              WHERE sem = 8 where branch = ${branch};

              UPDATE studentinfo
                 SET sem = CASE 
                      WHEN sem = 1 THEN 2
                      WHEN sem = 2 THEN 3
                      WHEN sem = 3 THEN 4
                      WHEN sem = 4 THEN 5
                      WHEN sem = 5 THEN 6
                      WHEN sem = 6 THEN 7
                      WHEN sem = 7 THEN 8
                  END
                WHERE sem BETWEEN 1 AND 7 AND branch = ${branch};

                UPDATE studentinfo
                  SET token = "undone" where branch = ${branch};

                UPDATE COUNTTERM SET COUNT = 1;

                `);
    return res.json({ done: true });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}