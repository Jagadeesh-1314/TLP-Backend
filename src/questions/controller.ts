import { Response, Request } from "express";
import dbQuery from "../services/db";
import { responses } from "../services/common";
import { UsersTableArr, subjectTableProps } from "../interfaces/manage";
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
    const subjects =
      `SELECT sem, sec, branch, token FROM studentinfo WHERE rollno = TRIM('${username}')`

    const subsresults: any = await dbQuery(subjects);

    if (subsresults.length === 0) {
      return res.status(404).json({ error: "User not found or no data available" });
    }

    const { sem, sec, branch } = subsresults[0];
    const subs = await dbQuery(
      `SELECT t1.subcode, subname, t1.facID, qtype, f.facName
      FROM ( SELECT * FROM timetable WHERE sem = TRIM(${sem}) AND sec = TRIM('${sec}') AND branch = TRIM('${branch}') ) AS t1
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

    const data: any = await dbQuery(`SELECT * FROM COUNTTERM;`);
    const { count } = data[0];
    const { usernameInToken: stuID, facID, subCode, qtype, score, totalScore, batch } = req.body;
    console.log(stuID);
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


export async function updateToken(req: Request, res: Response) {
  const rollno = req.query.rollno as string;
  try {
    if (!rollno)
      return res.status(400).json({ error: "Missing required field: rollno" });

    const query = `UPDATE studentinfo SET token = 'done' WHERE rollno = '${rollno}';`
    await dbQuery(query);
    return res.json({ done: true });
  } catch (e) {
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
    Lstn70()
    const details = await dbQuery(`SELECT sem, batch FROM report1 GROUP BY sem, batch;`);
    return res.json({ done: true, details: details });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
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

    Lstn70()
    const details = await dbQuery(`SELECT sem, batch FROM report2 GROUP BY sem, batch;`);
    return res.json({ done: true, details: details });
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

async function Lstn70() {
  try {
    for (let i = 1; i < 11; i++) {
      const theoryquery = `
        INSERT IGNORE INTO lstn70 (facID, subcode, sec, seq, avg)
        SELECT ts.facID, ts.subcode, r.sec, 'q${i}', AVG(q${i})
        FROM theoryscore1 ts
        JOIN report1 r ON ts.facID = r.facID and ts.subcode = r.subcode
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
      FROM labscore1 ls
      JOIN report1 r ON ls.facID = r.facID and ls.subcode = r.subcode
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


export async function incrementCount(req: Request, res: Response) {
  try {
    const result = dbQuery(`UPDATE COUNTTERM SET COUNT = 2;`);
    return res.json({ done: true, term: 2 });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


export async function decrementCount(req: Request, res: Response) {
  try {
    const result = dbQuery(`UPDATE COUNTTERM SET COUNT = 1;`);
    return res.json({ done: true, term: 1 });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


export async function getDetails(req: Request, res: Response) {
  try {
    const { batch, sem } = req.query
    const sec = await dbQuery(`SELECT sec FROM studentinfo where batch=${batch} and sem=${sem} GROUP BY sec`);
    res.json({ sec: sec });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
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


