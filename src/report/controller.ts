import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function report1(req: Request, res: Response) {
    try {

        const query = `
        SELECT COUNT(si.sec) as count, branch, f.facID, ts.subcode, f.facName, si.sec, si.sem, 
        SUM(ts.score) as totalScore, ts.batch
        FROM theoryscore1 ts
        JOIN faculty f ON ts.facID = f.facID
        JOIN studentinfo si ON ts.rollno = si.rollno
        GROUP BY ts.facID, ts.subcode, si.sec, ts.batch, si.sem, si.branch;
      `;

        // Execute the query
        const result: any = await dbQuery(query);
        if (result.length === 0) {
            return res.json({ done: false, sec: [] });
        }

        const data = result;

        for (const row of data) {
            const { count, facID, subcode, facName, sec, sem, totalScore, batch, branch } = row;
            const report1 = `
          INSERT INTO report1 (facID, facname, subcode, sec, sem, percentile, batch, branch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          percentile = VALUES(percentile)
        `;

            await dbQuery(report1, [
                facID,
                facName,
                subcode,
                sec,
                sem,
                (totalScore / count) * 20,
                batch,
                branch,
            ]);
        }

        const labquery = `
        SELECT COUNT(si.sec) as count, branch, f.facID, ls.subcode, f.facName, si.sec, si.sem,
        SUM(ls.score) as totalScore, ls.batch
        FROM labscore1 ls 
        JOIN faculty f ON ls.facID = f.facID 
        JOIN studentinfo si ON ls.rollno = si.rollno 
        GROUP BY ls.subcode, f.facID, si.sec, ls.batch, si.sem, si.branch;
      `;

        // Execute the query
        const labresult: any = await dbQuery(labquery);
        if (labresult.length === 0) {
            return res.json({ done: false, sec: [] });
        }

        const labdata = labresult;

        for (const row of labdata) {
            const { count, subcode, facID, facName, sec, sem, totalScore, batch, branch } = row;
            const report1 = `
          INSERT INTO report1 (facID, facname, subcode, sec, sem, percentile, batch, branch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          percentile = VALUES(percentile)
        `;

            await dbQuery(report1, [
                facID,
                facName,
                subcode,
                sec,
                sem,
                (totalScore / count) * 20,
                batch,
                branch,
            ]);
        }
        //   Lstn70()
        const details = await dbQuery(`SELECT sem, batch FROM report1 GROUP BY sem, batch;`);
        return res.json({ done: true, details: details });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}


export async function report2(req: Request, res: Response) {
    try {
        const query = `
        SELECT COUNT(si.sec) as count, branch, f.facID, ts.subcode, f.facName, si.sec, si.sem, ts.batch,
        SUM(ts.score) as totalScore
        FROM theoryscore2 ts 
        JOIN faculty f ON ts.facID = f.facID 
        JOIN studentinfo si ON ts.rollno = si.rollno 
        GROUP BY ts.subcode, f.facID, si.sec, ts.batch, si.sem, si.branch;
      `;

        // Execute the query
        const result: any = await dbQuery(query);
        if (result.length === 0) {
            return res.json({ done: false, sec: [] });
        }

        const data = result;

        for (const row of data) {
            const { count, facID, subcode, facName, sec, sem, totalScore, batch, branch } = row;
            const report2 = `
          INSERT INTO report2 (facID, facname, subcode, sec, sem, percentile, batch, branch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          percentile = VALUES(percentile)
        `;

            await dbQuery(report2, [
                facID,
                facName,
                subcode,
                sec,
                sem,
                (totalScore / count) * 20,
                batch,
                branch,
            ]);
        }

        const labquery = `
        SELECT COUNT(si.sec) as count, branch, f.facID, ls.subcode, f.facName, si.sec, si.sem,
        SUM(ls.score) as totalScore, ls.batch
        FROM labscore2 ls 
        JOIN faculty f ON ls.facID = f.facID 
        JOIN studentinfo si ON ls.rollno = si.rollno 
        GROUP BY ls.subcode, f.facID, si.sec, ls.batch, si.sem, si.branch;
      `;

        // Execute the query
        const labresult: any = await dbQuery(labquery);

        // ============== IF there are no labs but theory subjects ============

        // if (labresult.length === 0) {
        //   return res.json({ done: false, sec: [] });
        // }

        const labdata = labresult;

        for (const row of labdata) {
            const { count, subcode, facID, facName, sec, sem, totalScore, batch, branch } = row;
            const report2 = `
          INSERT INTO report2 (facID, facname, subcode, sec, sem, percentile, batch, branch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          percentile = VALUES(percentile)
        `;

            await dbQuery(report2, [
                facID,
                facName,
                subcode,
                sec,
                sem,
                (totalScore / count) * 20,
                batch,
                branch,
            ]);
        }

        // Lstn70()
        const details = await dbQuery(`SELECT sem, batch FROM report2 GROUP BY sem, batch;`);
        return res.json({ done: true, details: details });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}


export async function cfreport1(req: Request, res: Response) {
    try {
        const query = `
       SELECT COUNT(si.batch) as count, cf1.branch, cf1.batch,
                  SUM(cf1.score) as totalScore
                  FROM cf1 cf1
                  JOIN studentinfo si ON cf1.rollno = si.rollno
                  GROUP BY cf1.branch, cf1.batch;
      `;

        // Execute the query
        const result: any = await dbQuery(query);
        if (result.length === 0) {
            return res.json({ done: false });
        }

        const data = result;

        for (const row of data) {
            const { count, branch, batch, totalScore } = row;
            const report2 = `
          INSERT INTO cfreport1 (branch, batch, percentile)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
          percentile = VALUES(percentile)
        `;

            await dbQuery(report2, [
                branch,
                batch,
                (totalScore / count) * 20,
            ]);
        }
        const details = await dbQuery(`SELECT batch, branch FROM cfreport1 GROUP BY batch, branch;`);
        return res.json({ done: true, details: details });
    } catch (err) {
        console.error("Error while inserting score:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}



export async function cfreport2(req: Request, res: Response) {
    try {
        const query = `
       SELECT COUNT(si.batch) as count, cf2.branch, cf2.batch,
                  SUM(cf2.score) as totalScore
                  FROM cf2 cf2
                  JOIN studentinfo si ON cf2.rollno = si.rollno
                  GROUP BY cf2.branch, cf2.batch;
      `;

        // Execute the query
        const result: any = await dbQuery(query);
        if (result.length === 0) {
            return res.json({ done: false });
        }

        const data = result;

        for (const row of data) {
            const { count, branch, batch, totalScore } = row;
            const report2 = `
          INSERT INTO cfreport2 (branch, batch, percentile)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
          percentile = VALUES(percentile)
        `;

            await dbQuery(report2, [
                branch,
                batch,
                (totalScore / count) * 20,
            ]);
        }
        const details = await dbQuery(`SELECT batch, branch FROM cfreport2 GROUP BY batch, branch;`);
        return res.json({ done: true, details: details });
    } catch (err) {
        console.error("Error while inserting score:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export async function fetchReport1(req: Request, res: Response) {
    try {
        const { batch, sec, sem, branch } = req.query;
        if (sec?.length === 0) {

            const report: any = await dbQuery(`SELECT report1.*, subjects.subname FROM report1 JOIN subjects ON TRIM(report1.subcode) = TRIM(subjects.subcode) WHERE batch=${batch} AND sem=${sem}`);
            return res.json({ report: report });
        }
        const report: any = await dbQuery(`SELECT report1.*, subjects.subname FROM report1 JOIN subjects ON TRIM(report1.subcode) = TRIM(subjects.subcode) WHERE batch=${batch} AND sem=${sem} AND sec='${sec}';`);
        return res.json({ report: report });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

export async function fetchReport2(req: Request, res: Response) {
    try {
        const { batch, sec, sem } = req.query;
        const report: any = await dbQuery(`SELECT report2.*, subjects.subname FROM report2 JOIN subjects ON TRIM(report2.subcode) = TRIM(subjects.subcode) WHERE batch=${batch} AND sem=${sem} AND sec='${sec}';`);
        return res.json({ report: report });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}



export async function fetchCFReport1(req: Request, res: Response) {
    try {
        const { batch, branch } = req.query;
        const cfreport1: any = await dbQuery(`SELECT *  FROM cfreport1 where batch=${batch} AND branch='${branch}';`);
        return res.json({ cfreport1: cfreport1 });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}


export async function fetchCFReport2(req: Request, res: Response) {
    try {
        const { batch, branch } = req.query;
        const cfreport2: any = await dbQuery(`SELECT *  FROM cfreport2 where batch=${batch} AND branch='${branch}';`);
        return res.json({ cfreport2: cfreport2 });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}