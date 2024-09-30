import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function report1(req: Request, res: Response) {
    try {
        const { fbranch, term } = req.query;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const query = `
            SELECT COUNT(*) as count, f.facID, ts.subcode, f.facName, si.sec, si.sem, si.branch,
            SUM(ts.score) as totalScore, ts.batch
            FROM theoryscore1 ts
            JOIN faculty f ON TRIM(ts.facID) = TRIM(f.facID)
            JOIN studentinfo si ON ts.rollno = si.rollno AND ts.sem = si.sem
            WHERE si.branch = '${branch}'
            GROUP BY ts.facID, ts.subcode, si.sec, ts.batch, ts.sem, si.branch;
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
            SELECT COUNT(*) as count, f.facID, ls.subcode, f.facName, si.sec, si.sem, si.branch,
            SUM(ls.score) as totalScore, ls.batch
            FROM labscore1 ls
            JOIN faculty f ON TRIM(ls.facID) = TRIM(f.facID)
            JOIN studentinfo si ON ls.rollno = si.rollno AND ls.sem = si.sem
            WHERE si.branch = '${branch}'
            GROUP BY ls.facID, ls.subcode, si.sec, ls.batch, ls.sem, si.branch;
        `;
        // Execute the query
        const labresult: any = await dbQuery(labquery);

        // ============== IF there are no labs but theory subjects ============

        // if (labresult.length === 0) {
        //     return res.json({ done: false, sec: [] });
        // }

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
        let details: any;
        if (req.body.branchInToken === 'FME') {
            details = await dbQuery(`SELECT sem, batch, sec, branch FROM report1 where sem = ${term} GROUP BY sem, batch, sec, branch;`)
        } else {
            details = await dbQuery(`SELECT sem, batch, sec FROM report1 GROUP BY sem, batch, sec;`);
        }
       if(details.length === 0){
        return res.json({ done: false });
       }
        return res.json({ done: true, details: details });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}


export async function report2(req: Request, res: Response) {
    try {
        const { fbranch, term } = req.query;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const query = `
            SELECT COUNT(*) as count, f.facID, ts.subcode, f.facName, si.sec, si.sem, si.branch,
            SUM(ts.score) as totalScore, ts.batch
            FROM theoryscore2 ts
            JOIN faculty f ON TRIM(ts.facID) = TRIM(f.facID)
            JOIN studentinfo si ON ts.rollno = si.rollno AND ts.sem = si.sem
            WHERE si.branch = '${branch}'
            GROUP BY ts.facID, ts.subcode, si.sec, ts.batch, ts.sem, si.branch;
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
            SELECT COUNT(*) as count, f.facID, ls.subcode, f.facName, si.sec, si.sem, si.branch,
            SUM(ls.score) as totalScore, ls.batch
            FROM labscore2 ls
            JOIN faculty f ON TRIM(ls.facID) = TRIM(f.facID)
            JOIN studentinfo si ON ls.rollno = si.rollno AND ls.sem = si.sem
            WHERE si.branch = '${branch}'
            GROUP BY ls.facID, ls.subcode, si.sec, ls.batch, ls.sem, si.branch;
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
        let details;
        if (branch === 'FME') {
            details = await dbQuery(`SELECT sem, batch, sec, branch FROM report2 where sem = ${term} GROUP BY sem, batch, sec, branch;`)
        } else {
            details = await dbQuery(`SELECT sem, batch, sec FROM report2 GROUP BY sem, batch, sec;`);
        }
        return res.json({ done: true, details: details });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}


export async function cfreport1(req: Request, res: Response) {
    try {
        const { fbranch } = req.query;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const query = `
       SELECT COUNT(si.batch) as count, cf1.branch, cf1.batch, si.sem,
                  SUM(cf1.score) as totalScore
                  FROM cf1 cf1
                  JOIN studentinfo si ON cf1.rollno = si.rollno AND cf1.sem = si.sem
                  WHERE cf1.branch = '${branch}'
                  GROUP BY cf1.branch, cf1.batch, cf1.sem;
      `;

        // Execute the query
        const result: any = await dbQuery(query);
        if (result.length === 0) {
            return res.json({ done: false });
        }

        const data = result;

        for (const row of data) {
            const { count, branch, batch, sem, totalScore } = row;
            const report2 = `
          INSERT INTO cfreport1 (branch, batch, sem, percentile)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          percentile = VALUES(percentile)
        `;

            await dbQuery(report2, [
                branch,
                batch,
                sem,
                (totalScore / count) * 20,
            ]);
        }
        const details = await dbQuery(`SELECT batch, branch, sem FROM cfreport1 WHERE branch='${branch}' GROUP BY batch, branch, sem;`);
        return res.json({ done: true, details: details });
    } catch (err) {
        console.error("Error while inserting score:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}



export async function cfreport2(req: Request, res: Response) {
    try {
        const { fbranch } = req.query;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const query = `
       SELECT COUNT(si.batch) as count, cf2.branch, cf2.batch, si.sem,
                  SUM(cf2.score) as totalScore
                  FROM cf2 cf2
                  JOIN studentinfo si ON cf2.rollno = si.rollno AND cf2.sem = si.sem
                  WHERE cf2.branch = '${branch}'
                  GROUP BY cf2.branch, cf2.batch, cf2.sem;
      `;

        // Execute the query
        const result: any = await dbQuery(query);
        if (result.length === 0) {
            return res.json({ done: false });
        }

        const data = result;

        for (const row of data) {
            const { count, branch, batch, sem, totalScore } = row;
            const report2 = `
          INSERT INTO cfreport2 (branch, batch, sem, percentile)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          percentile = VALUES(percentile)
        `;

            await dbQuery(report2, [
                branch,
                batch,
                sem,
                (totalScore / count) * 20,
            ]);
        }
        const details = await dbQuery(`SELECT batch, branch, sem FROM cfreport2 WHERE branch='${branch}' GROUP BY batch, branch;`);
        return res.json({ done: true, details: details });
    } catch (err) {
        console.error("Error while inserting score:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export async function fetchReport1(req: Request, res: Response) {
    try {
        const { batch, sec, sem, fbranch } = req.body;
        const branchControl = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const report: any = await dbQuery(`SELECT report1.*, subjects.subname FROM report1 JOIN subjects ON TRIM(report1.subcode) = TRIM(subjects.subcode) WHERE batch=${batch} AND sem=${sem} AND sec='${sec}' AND branch='${branchControl}' ;`);
        return res.json({ report: report });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

export async function fetchReport2(req: Request, res: Response) {
    try {
        const { batch, sec, sem, fbranch } = req.body;
        const branchControl = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const report: any = await dbQuery(`SELECT report2.*, subjects.subname FROM report2 JOIN subjects ON TRIM(report2.subcode) = TRIM(subjects.subcode) WHERE batch=${batch} AND sem=${sem} AND sec='${sec}' AND branch='${branchControl}' ;`);
        return res.json({ report: report });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}



export async function fetchCFReport(req: Request, res: Response) {
    try {
        const { term, batch, fbranch, sem } = req.body;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const cfreport: any = await dbQuery(`SELECT *  FROM cfreport${term} where batch=${batch} AND branch='${branch}' AND sem = ${sem};`);
        return res.json({ cfreport: cfreport });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}



export async function CFReportQuestions(req: Request, res: Response) {
    try {
        const { term, sem, batch, fbranch } = req.body;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const cfreportquestions: any = await dbQuery(`
                            WITH QuestionText AS (
                    SELECT 
                        'Employability Skills' AS qtext, 0 AS seq
                    UNION ALL
                    SELECT 
                        'Mentoring support', 1
                    UNION ALL
                    SELECT 
                        'Campus Placement Efforts', 2
                    UNION ALL
                    SELECT 
                        'Career and academic guidance', 3
                    UNION ALL
                    SELECT 
                        'Leadership of the college', 4
                    UNION ALL
                    SELECT 
                        'Soft skills and Personality Development', 5
                    UNION ALL
                    SELECT 
                        'Library Facilities', 6
                    UNION ALL
                    SELECT 
                        'Extracurricular activities', 7
                    UNION ALL
                    SELECT 
                        'Co-curricular activities', 8
                    UNION ALL
                    SELECT 
                        'College transport facilities', 9
                    UNION ALL
                    SELECT 
                        'Service in Academic Section', 10
                    UNION ALL
                    SELECT 
                        'Service in Exam Branch', 11
                    UNION ALL
                    SELECT 
                        'Service in Accounts Section', 12
                    UNION ALL
                    SELECT 
                        'Physical Education Facilities', 13
                    UNION ALL
                    SELECT 
                        'Quality of food in Canteen', 14
                    UNION ALL
                    SELECT 
                        'Service in the Canteen', 15
                    UNION ALL
                    SELECT 
                        'Overall opinion of GCET', 16
                )
                SELECT 
                    qt.qtext AS question, 
                    branch, 
                    sem, 
                    COUNT(*) AS count,
                    CASE qt.seq
                        WHEN 0 THEN AVG(q0)
                        WHEN 1 THEN AVG(q1)
                        WHEN 2 THEN AVG(q2)
                        WHEN 3 THEN AVG(q3)
                        WHEN 4 THEN AVG(q4)
                        WHEN 5 THEN AVG(q5)
                        WHEN 6 THEN AVG(q6)
                        WHEN 7 THEN AVG(q7)
                        WHEN 8 THEN AVG(q8)
                        WHEN 9 THEN AVG(q9)
                        WHEN 10 THEN AVG(q10)
                        WHEN 11 THEN AVG(q11)
                        WHEN 12 THEN AVG(q12)
                        WHEN 13 THEN AVG(q13)
                        WHEN 14 THEN AVG(q14)
                        WHEN 15 THEN AVG(q15)
                        WHEN 16 THEN AVG(q16)
                    END AS total,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) > 0 THEN (CASE qt.seq
                                WHEN 0 THEN AVG(q0)
                                WHEN 1 THEN AVG(q1)
                                WHEN 2 THEN AVG(q2)
                                WHEN 3 THEN AVG(q3)
                                WHEN 4 THEN AVG(q4)
                                WHEN 5 THEN AVG(q5)
                                WHEN 6 THEN AVG(q6)
                                WHEN 7 THEN AVG(q7)
                                WHEN 8 THEN AVG(q8)
                                WHEN 9 THEN AVG(q9)
                                WHEN 10 THEN AVG(q10)
                                WHEN 11 THEN AVG(q11)
                                WHEN 12 THEN AVG(q12)
                                WHEN 13 THEN AVG(q13)
                                WHEN 14 THEN AVG(q14)
                                WHEN 15 THEN AVG(q15)
                                WHEN 16 THEN AVG(q16)
                            END) * 20
                            ELSE 0 
                        END,
                    3) AS adjusted_total
                    FROM cf${term}
                    CROSS JOIN QuestionText qt
                    WHERE branch = '${branch}' AND batch = ${batch} AND sem = ${sem}
                    GROUP BY qt.qtext, qt.seq, branch, sem
                    ORDER BY branch, qt.seq;

            `);
        return res.json({ cfreportquestions: cfreportquestions });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}



export async function ReportQuestions(req: Request, res: Response) {
    try {
        const { term, sem, sec, facID, subcode, batch, fbranch } = req.body;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const subjectType: any = await dbQuery(`SELECT qtype FROM subjects WHERE subcode = '${subcode}';`);
        const { qtype } = subjectType[0];
        let reportquestions: any;
        if (qtype === "theory") {
            reportquestions = await dbQuery(`
      WITH QuestionText AS (
            SELECT 
                'Passion and enthusiasm to teach' AS qtext, 1 AS seq
            UNION ALL
            SELECT 
                'Subject knowledge', 2
            UNION ALL
            SELECT 
                'Clarity and emphasis on concepts', 3
            UNION ALL
            SELECT 
                'Motivate the student to explore the concepts in depth on his/her own', 4
            UNION ALL
            SELECT 
                'Creating interest in the subject', 5
            UNION ALL
            SELECT 
                'Quality of illustrative visuals, examples and applications', 6
            UNION ALL
            SELECT 
                'Regularity, punctuality & uniform coverage of syllabus', 7
            UNION ALL
            SELECT 
                'Discipline and control over the class', 8
            UNION ALL
            SELECT 
                'Promoting student thinking', 9
            UNION ALL
            SELECT 
                'Encouraging student effort & inviting student interaction', 10
          )
          SELECT 
            qt.qtext AS question, 
            si.branch, 
            ts.sem, 
            COUNT(si.sec) AS count,
            CASE qt.seq
                WHEN 1 THEN AVG(ts.q1)
                WHEN 2 THEN AVG(ts.q2)
                WHEN 3 THEN AVG(ts.q3)
                WHEN 4 THEN AVG(ts.q4)
                WHEN 5 THEN AVG(ts.q5)
                WHEN 6 THEN AVG(ts.q6)
                WHEN 7 THEN AVG(ts.q7)
                WHEN 8 THEN AVG(ts.q8)
                WHEN 9 THEN AVG(ts.q9)
                WHEN 10 THEN AVG(ts.q10)
            END AS total,
            ROUND(
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        CASE qt.seq
                            WHEN 1 THEN AVG(ts.q1)
                            WHEN 2 THEN AVG(ts.q2)
                            WHEN 3 THEN AVG(ts.q3)
                            WHEN 4 THEN AVG(ts.q4)
                            WHEN 5 THEN AVG(ts.q5)
                            WHEN 6 THEN AVG(ts.q6)
                            WHEN 7 THEN AVG(ts.q7)
                            WHEN 8 THEN AVG(ts.q8)
                            WHEN 9 THEN AVG(ts.q9)
                            WHEN 10 THEN AVG(ts.q10)
                        END * 20
                    ELSE 0 
                END, 3) AS adjusted_total
          FROM theoryscore${term} ts
          JOIN studentinfo si ON ts.rollno = si.rollno
          CROSS JOIN QuestionText qt
          WHERE si.branch = '${branch}'
          AND ts.sem = ${sem}
          AND si.sec = '${sec}'
          AND ts.facID = '${facID}'
          AND ts.subcode = '${subcode}'
          AND si.batch = '${batch}'
          GROUP BY qt.qtext, qt.seq, si.branch, ts.sem, si.sec
          ORDER BY si.branch, qt.seq;
        `);
        } else if (qtype === "lab") {
            reportquestions = await dbQuery(`
        WITH QuestionText AS (
              SELECT 
                  'The lab instructor explained objectives and outcomes of lab experiments clearly well before the commencement of the lab' AS qtext, 1 AS seq
              UNION ALL
              SELECT 
                  'The lab instructor explained the procedures involved to perform the lab experiments/algorithms clearly well before the commencement of the lab', 2
              UNION ALL
              SELECT 
                  'The laboratory assignments/discussion questions given after the completion of the experiment are interesting and reinforce what I have learned in the lab and its corresponding theoretical concepts', 3
              UNION ALL
              SELECT 
                  'The lab instructor is impartial in dealing with all students and was regularly available for consultation during the lab', 4
              UNION ALL
              SELECT 
                  'The lab instructor evaluated my work promptly, provided helpful feedback on my progress and offered specific advice to promote improvement', 5
              UNION ALL
              SELECT 
                  'The lab instructor encourages me to work better with others in the lab', 6
              UNION ALL
              SELECT 
                  'The lab instructor helps me learn important techniques associated with this lab course', 7
              UNION ALL
              SELECT 
                  'Experiments/Algorithms detailed in the lab course have enhanced my critical thinking ability', 8
            )
            SELECT 
              qt.qtext AS question, 
              si.branch, 
              ls.sem, 
              COUNT(si.sec) AS count,
              CASE qt.seq
                  WHEN 1 THEN AVG(ls.q1)
                  WHEN 2 THEN AVG(ls.q2)
                  WHEN 3 THEN AVG(ls.q3)
                  WHEN 4 THEN AVG(ls.q4)
                  WHEN 5 THEN AVG(ls.q5)
                  WHEN 6 THEN AVG(ls.q6)
                  WHEN 7 THEN AVG(ls.q7)
                  WHEN 8 THEN AVG(ls.q8)
              END AS total,
              ROUND(
                  CASE 
                      WHEN COUNT(*) > 0 THEN 
                          CASE qt.seq
                              WHEN 1 THEN AVG(ls.q1)
                              WHEN 2 THEN AVG(ls.q2)
                              WHEN 3 THEN AVG(ls.q3)
                              WHEN 4 THEN AVG(ls.q4)
                              WHEN 5 THEN AVG(ls.q5)
                              WHEN 6 THEN AVG(ls.q6)
                              WHEN 7 THEN AVG(ls.q7)
                              WHEN 8 THEN AVG(ls.q8)
                          END * 20
                      ELSE 0 
                  END, 3) AS adjusted_total
            FROM labscore${term} ls
            JOIN studentinfo si ON ls.rollno = si.rollno
            CROSS JOIN QuestionText qt
            WHERE si.branch = '${branch}'
            AND ls.sem = ${sem}
            AND si.sec = '${sec}'
            AND ls.facID = '${facID}'
            AND ls.subcode = '${subcode}'
            AND si.batch = '${batch}'
            GROUP BY qt.qtext, qt.seq, si.branch, ls.sem, si.sec
            ORDER BY si.branch, qt.seq;
          `);
        }
        return res.json({ reportquestions: reportquestions });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}