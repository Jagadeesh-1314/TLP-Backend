import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function term1(req: Request, res: Response) {
  try {
    const result = await dbQuery(`
      UPDATE COUNTTERM SET COUNT = 2;
      `);

    return res.json({ done: true, term: 2 });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


export async function term2(req: Request, res: Response) {
  try {
    const result = await dbQuery(`
      UPDATE COUNTTERM SET COUNT = 1;
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
    } else if (sem === 'all') {
      const checkNextSem: any = await dbQuery(`
        SELECT sem, COUNT(*) AS count FROM studentinfo 
        WHERE sem BETWEEN 1 AND 7 AND branch = '${branch}'
        GROUP BY sem HAVING COUNT(*) > 0;
      `);

      const promotionTasks = checkNextSem.map(async (row: { sem: number }) => {
        const nextSem = row.sem + 1;
        const conflictCheck: any = await dbQuery(`
          SELECT COUNT(*) AS count FROM studentinfo 
          WHERE sem = ${nextSem} AND branch = '${branch}';
        `);

        if (conflictCheck[0].count === 0) {
          await dbQuery(`
            UPDATE studentinfo
            SET sem = sem + 1
            WHERE sem = ${row.sem} AND branch = '${branch}';
          `);
        }
      });

      await Promise.all(promotionTasks);

      await dbQuery(`
        DELETE FROM studentinfo
        WHERE sem = 8 AND branch = '${branch}';

        UPDATE studentinfo
        SET token = 'undone' WHERE branch = '${branch}';
      `);

      return res.json({ done: true });
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
      `);

      return res.json({ done: true });
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}

