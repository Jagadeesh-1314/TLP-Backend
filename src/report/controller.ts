import { Response, Request } from "express";
import dbQuery from "../services/db";

export async function secList(req: Request, res: Response) {
    try {
        const { term, sem, batch, fbranch } = req.body;
        const defterm = term === 0 ? 1 : term;
        const branchControl = (req.body.branchInToken !== 'FME' && req.body.usernameInToken !== 'admin') ? req.body.branchInToken : fbranch;
        const query = (`
            SELECT DISTINCT sec FROM report${defterm} WHERE branch = ? AND batch = ? AND sem = ?;
            `);
        const secList: any = await dbQuery(query, [branchControl, batch, sem]);
        return res.json({ secList: secList });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}


//  Generate Reports
export async function report(req: Request, res: Response) {
    try {
        // TODO: fbranch check in manage db branch route
        const { fbranch, term } = req.body;
        const branch = (req.body.branchInToken !== 'FME' && req.body.usernameInToken !== 'admin') ? req.body.branchInToken : fbranch;

        if (parseInt(term) !== 0) {
            const theoryQuery = `
                SELECT COUNT(DISTINCT ts.rollno) AS completed, f.facID, ts.subcode, f.facName, si.sec, si.sem, 
                si.branch, SUM(ts.score) AS totalScore, ts.batch, st.total_students
                FROM theoryscore? ts
                JOIN faculty f ON ts.facID = f.facID
                JOIN studentinfo si ON ts.rollno = si.rollno AND ts.sem = si.sem
                JOIN (
                    SELECT batch, sem, sec, branch, COUNT(*) AS total_students
                    FROM studentinfo
                    GROUP BY batch, sem, sec, branch
                ) st ON st.batch = ts.batch 
                AND st.sem = si.sem AND st.sec = si.sec AND st.branch = si.branch
                WHERE si.branch = ?
                GROUP BY ts.facID, ts.subcode, si.sec, ts.batch, ts.sem, si.branch, st.total_students;
        `;
            // Execute the query
            const result: any = await dbQuery(theoryQuery, [term, branch]);
            if (result.length === 0) {
                return res.json({ done: false, sec: [] });
            }

            const data = result;

            for (const row of data) {
                const { facID, subcode, facName, sec, sem, totalScore, batch, branch, completed, total_students } = row;
                const report = `
                    INSERT INTO report? (facID, facname, subcode, sec, sem, percentile, batch, branch, completed, total_students) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    percentile = VALUES(percentile),
                    completed = VALUES(completed),
                    total_students = VALUES(total_students);
                `;

                await dbQuery(report, [
                    term,
                    facID,
                    facName,
                    subcode,
                    sec,
                    sem,
                    (totalScore / completed) * 20,
                    batch,
                    branch,
                    completed,
                    total_students
                ]);
            }

            const labQuery = `
                SELECT COUNT(DISTINCT ls.rollno) AS completed, f.facID, ls.subcode, f.facName, si.sec, si.sem, si.branch, 
                SUM(ls.score) AS totalScore, ls.batch, st.total_students 
                FROM labscore? ls
                JOIN faculty f ON ls.facID = f.facID
                JOIN studentinfo si ON ls.rollno = si.rollno AND ls.sem = si.sem
                JOIN (
                    SELECT batch, sem, sec, branch, COUNT(*) AS total_students
                    FROM studentinfo
                    GROUP BY batch, sem, sec, branch
                ) st ON st.batch = ls.batch 
                AND st.sem = si.sem AND st.sec = si.sec AND st.branch = si.branch
                WHERE si.branch = ?
                GROUP BY ls.facID, ls.subcode, si.sec, ls.batch, ls.sem, si.branch, st.total_students;
            `;
            // Execute the query
            const labresult: any = await dbQuery(labQuery, [term, branch]);

            // ============== IF there are no labs but theory subjects ============

            // if (labresult.length === 0) {
            //     return res.json({ done: false, sec: [] });
            // }

            const labdata = labresult;

            for (const row of labdata) {
                const { subcode, facID, facName, sec, sem, totalScore, batch, branch, completed, total_students } = row;
                const report = `
                    INSERT INTO report? (facID, facname, subcode, sec, sem, percentile, batch, branch, completed, total_students) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    percentile = VALUES(percentile),
                    completed = VALUES(completed),
                    total_students = VALUES(total_students);
                `;

                await dbQuery(report, [
                    term,
                    facID,
                    facName,
                    subcode,
                    sec,
                    sem,
                    (totalScore / completed) * 20,
                    batch,
                    branch,
                    completed,
                    total_students
                ]);
            }
            const query: string = req.body.branchInToken === 'FME'
                ? `SELECT sem, batch, branch FROM report? where sem IN (1, 2) GROUP BY sem, batch, branch;`
                : `SELECT sem, batch FROM report? GROUP BY sem, batch;`;
            const details: any = await dbQuery(query, [term])
            if (details.length === 0) {
                return res.json({ done: false });
            }
            return res.json({ done: true, details: details });
        }
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

export async function cfreport(req: Request, res: Response) {
    try {
        const { fbranch, term, sem, startYear, endYear } = req.body;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const cfquery = (req.body.usernameInToken !== 'admin') ? `
            SELECT COUNT(cf.batch) AS count, cf.branch, cf.batch, cf.sem,
            SUM(cf.score) AS totalScore
            FROM cf? cf
            JOIN studentinfo si 
            ON cf.rollno = si.rollno AND cf.sem = si.sem
            WHERE cf.branch = ?
            GROUP BY cf.branch, cf.batch, cf.sem;
      ` : `
            SELECT COUNT(cf.batch) AS count, cf.branch, cf.batch, cf.sem,
            SUM(cf.score) AS totalScore
            FROM cf? cf
            JOIN studentinfo si 
            ON cf.rollno = si.rollno AND cf.sem = si.sem
            GROUP BY cf.branch, cf.batch, cf.sem;

        `;

        // Execute the query
        const result: any = await dbQuery(cfquery, [term, branch]);
        if (result.length === 0) {
            return res.json({ done: false });
        }

        const data = result;

        for (const row of data) {
            const { count, branch, batch, sem, totalScore } = row;
            const cfreport = `
                INSERT INTO cfreport? (branch, batch, sem, percentile)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                percentile = VALUES(percentile)
        `;

            await dbQuery(cfreport, [
                term,
                branch,
                batch,
                sem,
                (totalScore / count) * 20,
            ]);
        }
        const query = (req.body.usernameInToken !== 'admin')
            ? `SELECT batch, branch, sem FROM cfreport? WHERE branch=? GROUP BY batch, branch, sem;`
            : `SELECT branch, 
                CASE 
                    WHEN sem IN (1, 3, 5, 7) THEN 'Odd'
                    ELSE 'Even'
                END AS sem_type,
                AVG(percentile) AS percentile FROM cfreport? WHERE batch BETWEEN ? AND ? AND sem IN (?) 
                GROUP BY branch, sem_type
                UNION ALL
                SELECT 'Overall' AS branch, 
                CASE 
                    WHEN sem IN (1, 3, 5, 7) THEN 'Odd'
                    ELSE 'Even'
                END AS sem_type,
                AVG(percentile) AS percentile FROM cfreport? WHERE batch BETWEEN ? AND ? AND sem IN (?)
                GROUP BY sem_type;
            `;

        const params = (req.body.usernameInToken !== 'admin')
            ? [term, branch]
            : [term, startYear, endYear, sem, term, startYear, endYear, sem];

        const details: any = await dbQuery(query, params);
        if (details.length === 0) {
            return res.json({ done: false });
        }
        return res.json({ done: true, details: details });
    } catch (err) {
        console.error("Error while inserting score:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Fetch Reports
export async function fetchReport(req: Request, res: Response) {
    try {
        const { term, batch, sec, sem, fbranch } = req.body;
        const branchControl = (req.body.branchInToken !== 'FME' && req.body.usernameInToken !== 'admin') ? req.body.branchInToken : fbranch;
        const query: string = (`
            SELECT report?.*, subjects.subname FROM report? JOIN subjects ON report?.subcode = subjects.subcode 
            WHERE batch=? AND sem=? AND sec=? AND branch=? ORDER BY subjects.subCode ;
        `);
        const report: any = await dbQuery(query, [term, term, term, batch, sem, sec, branchControl]);
        return res.json({ report: report });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

export async function fetchCFReport(req: Request, res: Response) {
    try {
        const { term, batch, fbranch, sem } = req.body;
        const branch = (req.body.branchInToken !== 'FME' && req.body.usernameInToken !== 'admin') ? req.body.branchInToken : fbranch;
        const query = (`
            SELECT * FROM cfreport? where batch=? AND branch=? AND sem = ?;
        `);
        const cfreport = await dbQuery(query, [term, batch, branch, sem]);
        return res.json({ cfreport: cfreport });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

// Questions Parameters
export async function ReportQuestions(req: Request, res: Response) {
    try {
        const { term, sem, sec, facID, subcode, batch, fbranch } = req.body;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
        const subject: string = (`SELECT qtype FROM subjects WHERE subcode = ?;`);
        const subjectType: any = await dbQuery(subject, [subcode]);

        const { qtype } = subjectType[0];

        let query: any;
        if (qtype === "theory") {
            query = (`
               SELECT 
                q.question AS question, 
                si.branch, 
                ts.sem, 
                COUNT(si.sec) AS count,
                CASE q.seq
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
                            CASE q.seq
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
            FROM theoryscore? ts
            JOIN studentinfo si ON ts.rollno = si.rollno
            JOIN questions q ON q.qtype = 'theory' AND q.seq BETWEEN 1 AND 10
            WHERE si.branch = ?
            AND ts.sem = ?
            AND si.sec = ?
            AND ts.facID = ?
            AND ts.subcode = ?
            AND si.batch = ?
            GROUP BY q.question, q.seq, si.branch, ts.sem, si.sec
            ORDER BY si.branch, q.seq;

        `);
        } else if (qtype === "lab") {
            query = (`
                SELECT 
                q.question AS question, 
                si.branch, 
                ls.sem, 
                COUNT(si.sec) AS count,
                CASE q.seq
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
                            CASE q.seq
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
            FROM labscore? ls
            JOIN studentinfo si ON ls.rollno = si.rollno
            JOIN questions q ON q.qtype = 'lab' AND q.seq BETWEEN 1 AND 8
            WHERE si.branch = ?
            AND ls.sem = ?
            AND si.sec = ?
            AND ls.facID = ?
            AND ls.subcode = ?
            AND si.batch = ?
            GROUP BY q.question, q.seq, si.branch, ls.sem, si.sec
            ORDER BY si.branch, q.seq;

          `);
        }

        const reportquestions: any = await dbQuery(query, [term, branch, sem, sec, facID, subcode, batch]);
        return res.json({ reportquestions: reportquestions });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

export async function CFReportQuestions(req: Request, res: Response) {
    try {
        const { fbranch, term, sem, startYear, endYear, batch } = req.body;
        const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;

        const query = req.body.usernameInToken !== 'admin' ?
            `WITH QuestionText AS (
            SELECT question AS qtext, seq
            FROM questions
            WHERE qtype = 'ctype'
        )
        SELECT 
            qt.qtext AS question,
            branch, sem, COUNT(*) AS count,
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
                    WHEN COUNT(*) > 0 THEN 
                        (CASE qt.seq
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
        WHERE branch = ? 
            AND sem = ? 
            AND batch = ?
        GROUP BY qt.qtext, qt.seq, branch, sem, batch
        ORDER BY branch, qt.seq;
        ` :
            `SELECT 
            q.seq AS QuestionSequence,
            q.question AS question,
            ROUND(
                AVG(
                    CASE q.seq
                        WHEN 0 THEN cf.q0
                        WHEN 1 THEN cf.q1
                        WHEN 2 THEN cf.q2
                        WHEN 3 THEN cf.q3
                        WHEN 4 THEN cf.q4
                        WHEN 5 THEN cf.q5
                        WHEN 6 THEN cf.q6
                        WHEN 7 THEN cf.q7
                        WHEN 8 THEN cf.q8
                        WHEN 9 THEN cf.q9
                        WHEN 10 THEN cf.q10
                        WHEN 11 THEN cf.q11
                        WHEN 12 THEN cf.q12
                        WHEN 13 THEN cf.q13
                        WHEN 14 THEN cf.q14
                        WHEN 15 THEN cf.q15
                        WHEN 16 THEN cf.q16
                    END
                ) * 100 / 5, 2
            ) AS adjusted_total,
            COUNT(
                CASE q.seq
                    WHEN 0 THEN cf.q0
                    WHEN 1 THEN cf.q1
                    WHEN 2 THEN cf.q2
                    WHEN 3 THEN cf.q3
                    WHEN 4 THEN cf.q4
                    WHEN 5 THEN cf.q5
                    WHEN 6 THEN cf.q6
                    WHEN 7 THEN cf.q7
                    WHEN 8 THEN cf.q8
                    WHEN 9 THEN cf.q9
                    WHEN 10 THEN cf.q10
                    WHEN 11 THEN cf.q11
                    WHEN 12 THEN cf.q12
                    WHEN 13 THEN cf.q13
                    WHEN 14 THEN cf.q14
                    WHEN 15 THEN cf.q15
                    WHEN 16 THEN cf.q16
                END
            ) AS StudentCount
        FROM cf${term} AS cf
        JOIN questions AS q
        ON q.qtype = 'ctype'
        WHERE cf.batch BETWEEN ? AND ? 
        AND cf.sem IN (?)
        GROUP BY q.seq, q.question
        ORDER BY q.seq;`;

        const cfreportquestions: any = await dbQuery(query, req.body.usernameInToken !== 'admin' ? [branch, sem, batch] : [startYear, endYear, sem]);
        return res.json({ cfreportquestions: cfreportquestions });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}


//  Average Generation
export async function ReportAverage(req: Request, res: Response) {
    try {
        const { fbranch } = req.body;
        const branch = (req.body.branchInToken !== 'FME' && req.body.usernameInToken !== 'admin') ? req.body.branchInToken : fbranch;
        const report1Check: any = await dbQuery(`
            SELECT COUNT(*) AS count 
            FROM report1;
        `);

        const report2Check: any = await dbQuery(`
            SELECT COUNT(*) AS count 
            FROM report2;
        `);

        if (report1Check[0].count === 0 || report2Check[0].count === 0) {
            return res.json({ done: false });
        }
        const query: string = (`
            SELECT DISTINCT batch, sem from report1 where branch = ?;
        `);
        const reportavg: any = await dbQuery(query, [branch])
        return res.json({ done: true, details: reportavg });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

export async function fetchReportAverage(req: Request, res: Response) {
    try {
        const { batch, sec, sem, fbranch } = req.body;
        const branch = (req.body.branchInToken !== 'FME' && req.body.usernameInToken !== 'admin') ? req.body.branchInToken : fbranch;

        const query: string = (`
            SELECT 
                r1.facID,
                f.facName,
                r1.subcode,
                s.subname,
                r1.sem,
                r1.sec,
                r1.batch,
                r1.branch,
                r1.percentile AS percentile1,
                r2.percentile AS percentile2,
                ROUND((AVG(COALESCE(r1.percentile, 0)) + AVG(COALESCE(r2.percentile, 0))) / 2, 4) AS percentile
            FROM 
                report1 r1
            JOIN 
                report2 r2
                ON r1.facID = r2.facID
                AND r1.subcode = r2.subcode
                AND r1.sec = r2.sec
                AND r1.sem = r2.sem
                AND r1.batch = r2.batch
                AND r1.branch = r2.branch
            JOIN 
                faculty f
                ON f.facID = r1.facID
            JOIN 
                subjects s
                ON s.subcode = r1.subcode            
            WHERE 
                r1.branch = ?
                AND r1.sem = ?
                AND r1.sec = ? 
                AND r1.batch = ?
            GROUP BY 
                r1.sem, r1.sec, r1.batch, r1.branch, r1.facID, r1.subcode
            ORDER BY
                r1.subcode;
        `);
        const report: any = await dbQuery(query, [branch, sem, sec, batch]);
        return res.json({ report: report });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

export async function ReportAverageQuestions(req: Request, res: Response) {
    try {
        const { sem, sec, facID, subcode, batch, fbranch } = req.body;
        const branch = (req.body.branchInToken !== 'FME' && req.body.usernameInToken !== 'admin') ? req.body.branchInToken : fbranch;
        const subjectType: any = await dbQuery(`SELECT qtype FROM subjects WHERE subcode = '${subcode}';`);
        const { qtype } = subjectType[0];
        let query: any;
        if (qtype === "theory") {
            query = (`                
                    WITH TheoryScore1Aggregates AS (
                    SELECT 
                        q.question AS question, 
                        q.seq,
                        si.branch, 
                        ts.sem, 
                        COUNT(si.sec) AS count1,
                        ROUND(AVG(
                            CASE q.seq
                                WHEN 1 THEN ts.q1
                                WHEN 2 THEN ts.q2
                                WHEN 3 THEN ts.q3
                                WHEN 4 THEN ts.q4
                                WHEN 5 THEN ts.q5
                                WHEN 6 THEN ts.q6
                                WHEN 7 THEN ts.q7
                                WHEN 8 THEN ts.q8
                                WHEN 9 THEN ts.q9
                                WHEN 10 THEN ts.q10
                            END
                        ), 2) AS total1,
                        ROUND(
                            AVG(
                                CASE q.seq
                                    WHEN 1 THEN ts.q1
                                    WHEN 2 THEN ts.q2
                                    WHEN 3 THEN ts.q3
                                    WHEN 4 THEN ts.q4
                                    WHEN 5 THEN ts.q5
                                    WHEN 6 THEN ts.q6
                                    WHEN 7 THEN ts.q7
                                    WHEN 8 THEN ts.q8
                                    WHEN 9 THEN ts.q9
                                    WHEN 10 THEN ts.q10
                                END
                            ) * 20, 2
                        ) AS adjusted_total1
                    FROM theoryscore1 ts
                    JOIN studentinfo si ON ts.rollno = si.rollno
                    JOIN questions q ON q.qtype = 'theory'
                    WHERE si.branch = ?
                    AND ts.sem = ?
                    AND si.sec = ?
                    AND ts.facID = ?
                    AND ts.subcode = ?
                    AND si.batch = ?
                    GROUP BY q.question, q.seq, si.branch, ts.sem, si.sec
                ),
                TheoryScore2Aggregates AS (
                    SELECT 
                        q.question AS question, 
                        q.seq,
                        si.branch, 
                        ts.sem, 
                        COUNT(si.sec) AS count2,
                        ROUND(AVG(
                            CASE q.seq
                                WHEN 1 THEN ts.q1
                                WHEN 2 THEN ts.q2
                                WHEN 3 THEN ts.q3
                                WHEN 4 THEN ts.q4
                                WHEN 5 THEN ts.q5
                                WHEN 6 THEN ts.q6
                                WHEN 7 THEN ts.q7
                                WHEN 8 THEN ts.q8
                                WHEN 9 THEN ts.q9
                                WHEN 10 THEN ts.q10
                            END
                        ), 2) AS total2,
                        ROUND(
                            AVG(
                                CASE q.seq
                                    WHEN 1 THEN ts.q1
                                    WHEN 2 THEN ts.q2
                                    WHEN 3 THEN ts.q3
                                    WHEN 4 THEN ts.q4
                                    WHEN 5 THEN ts.q5
                                    WHEN 6 THEN ts.q6
                                    WHEN 7 THEN ts.q7
                                    WHEN 8 THEN ts.q8
                                    WHEN 9 THEN ts.q9
                                    WHEN 10 THEN ts.q10
                                END
                            ) * 20, 2
                        ) AS adjusted_total2
                    FROM theoryscore2 ts
                    JOIN studentinfo si ON ts.rollno = si.rollno
                    JOIN questions q ON q.qtype = 'theory'
                    WHERE si.branch = ?
                    AND ts.sem = ?
                    AND si.sec = ?
                    AND ts.facID = ?
                    AND ts.subcode = ?
                    AND si.batch = ?
                    GROUP BY q.question, q.seq, si.branch, ts.sem, si.sec
                )
                SELECT 
                    COALESCE(t1.question, t2.question) AS question,
                    COALESCE(t1.seq, t2.seq) AS seq,
                    COALESCE(t1.branch, t2.branch) AS branch,
                    COALESCE(t1.sem, t2.sem) AS sem,
                    COALESCE(t1.count1, 0) AS count1,
                    COALESCE(t2.count2, 0) AS count2,
                    COALESCE(t1.total1, 0) AS total1,
                    COALESCE(t2.total2, 0) AS total2,
                    COALESCE(t1.adjusted_total1, 0) AS adjusted_total1,
                    COALESCE(t2.adjusted_total2, 0) AS adjusted_total2,
                    ROUND(
                        (COALESCE(t1.adjusted_total1, 0) + COALESCE(t2.adjusted_total2, 0)) / 2, 2
                    ) AS avg_adjusted_total
                FROM TheoryScore1Aggregates t1
                JOIN TheoryScore2Aggregates t2 ON t1.seq = t2.seq
                ORDER BY seq;

        `);
        } else if (qtype === "lab") {
            query = (`
                    WITH Labscore1Aggregates AS (
                    SELECT
                        q.question AS qtext,
                        q.seq,
                        si.branch,
                        ls1.sem,
                        COUNT(ls1.rollno) AS count1,
                        ROUND(
                            AVG(CASE q.seq
                                WHEN 1 THEN ls1.q1
                                WHEN 2 THEN ls1.q2
                                WHEN 3 THEN ls1.q3
                                WHEN 4 THEN ls1.q4
                                WHEN 5 THEN ls1.q5
                                WHEN 6 THEN ls1.q6
                                WHEN 7 THEN ls1.q7
                                WHEN 8 THEN ls1.q8
                            END), 2) AS total1,
                        ROUND(
                            AVG(CASE q.seq
                                WHEN 1 THEN ls1.q1
                                WHEN 2 THEN ls1.q2
                                WHEN 3 THEN ls1.q3
                                WHEN 4 THEN ls1.q4
                                WHEN 5 THEN ls1.q5
                                WHEN 6 THEN ls1.q6
                                WHEN 7 THEN ls1.q7
                                WHEN 8 THEN ls1.q8
                            END) * 20, 2
                        ) AS adjusted_total1
                    FROM labscore1 ls1
                    JOIN studentinfo si ON ls1.rollno = si.rollno
                    JOIN questions q ON q.qtype = 'lab' AND q.seq BETWEEN 1 AND 8
                    WHERE si.branch = ?
                    AND ls1.sem = ?
                    AND si.sec = ?
                    AND ls1.facID = ?
                    AND ls1.subcode = ?
                    AND si.batch = ?
                    GROUP BY q.question, q.seq, si.branch, ls1.sem
                ),
                Labscore2Aggregates AS (
                    SELECT
                        q.question AS qtext,
                        q.seq,
                        si.branch,
                        ls2.sem,
                        COUNT(ls2.rollno) AS count2,
                        ROUND(
                            AVG(CASE q.seq
                                WHEN 1 THEN ls2.q1
                                WHEN 2 THEN ls2.q2
                                WHEN 3 THEN ls2.q3
                                WHEN 4 THEN ls2.q4
                                WHEN 5 THEN ls2.q5
                                WHEN 6 THEN ls2.q6
                                WHEN 7 THEN ls2.q7
                                WHEN 8 THEN ls2.q8
                            END), 2) AS total2,
                        ROUND(
                            AVG(CASE q.seq
                                WHEN 1 THEN ls2.q1
                                WHEN 2 THEN ls2.q2
                                WHEN 3 THEN ls2.q3
                                WHEN 4 THEN ls2.q4
                                WHEN 5 THEN ls2.q5
                                WHEN 6 THEN ls2.q6
                                WHEN 7 THEN ls2.q7
                                WHEN 8 THEN ls2.q8
                            END) * 20, 2
                        ) AS adjusted_total2
                    FROM labscore2 ls2
                    JOIN studentinfo si ON ls2.rollno = si.rollno
                    JOIN questions q ON q.qtype = 'lab' AND q.seq BETWEEN 1 AND 8
                    WHERE si.branch = ?
                    AND ls2.sem = ?
                    AND si.sec = ?
                    AND ls2.facID = ?
                    AND ls2.subcode = ?
                    AND si.batch = ?
                    GROUP BY q.question, q.seq, si.branch, ls2.sem
                )
                SELECT 
                    COALESCE(l1.qtext, l2.qtext) AS question,
                    COALESCE(l1.branch, l2.branch) AS branch,
                    COALESCE(l1.sem, l2.sem) AS sem,
                    COALESCE(l1.count1, 0) AS count1,
                    COALESCE(l2.count2, 0) AS count2,
                    COALESCE(l1.total1, 0) AS total1,
                    COALESCE(l2.total2, 0) AS total2,
                    COALESCE(l1.adjusted_total1, 0) AS adjusted_total1,
                    COALESCE(l2.adjusted_total2, 0) AS adjusted_total2,
                    ROUND((COALESCE(l1.adjusted_total1, 0) + COALESCE(l2.adjusted_total2, 0)) / 2, 2) AS avg_adjusted_total
                FROM Labscore1Aggregates l1
                JOIN Labscore2Aggregates l2 ON l1.seq = l2.seq
                ORDER BY l1.seq;

          `);
        }

        const reportquestions: any = await dbQuery(query, [branch, sem, sec, facID, subcode, batch, branch, sem, sec, facID, subcode, batch]);

        return res.json({ reportquestions: reportquestions });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}

export async function CFReportAverage(req: Request, res: Response) {
    try {
        const { sem, startYear, endYear } = req.body;
        const cfReport1Check: any = await dbQuery(`
            SELECT COUNT(*) AS count 
            FROM cfreport1;
        `);

        const cfReport2Check: any = await dbQuery(`
            SELECT COUNT(*) AS count 
            FROM cfreport2;
        `);

        if (cfReport1Check[0].count === 0 || cfReport2Check[0].count === 0) {
            return res.json({ done: false });
        }
        const query: string = (`
            SELECT cfr1.branch, 
                CASE 
                    WHEN cfr1.sem IN (1, 3, 5, 7) THEN 'Odd'
                    ELSE 'Even'
                END AS sem_type,
                ROUND(AVG(cfr1.percentile), 2) AS percentile1, 
                ROUND(AVG(cfr2.percentile), 2) AS percentile2,
                ROUND((AVG(cfr1.percentile) + AVG(cfr2.percentile)) / 2, 2) AS avg_percentile
                FROM cfreport1 cfr1
                JOIN cfreport2 cfr2 
                    ON cfr1.branch = cfr2.branch 
                    AND cfr1.sem = cfr2.sem 
                WHERE cfr1.batch BETWEEN ? AND ? 
                    AND cfr1.sem IN (?) 
                    AND cfr2.batch BETWEEN ? AND ? 
                    AND cfr2.sem IN (?)
                GROUP BY cfr1.branch, sem_type

                UNION ALL

                SELECT 'Overall' AS branch, 
                                CASE 
                                    WHEN cfr1.sem IN (1, 3, 5, 7) THEN 'Odd'
                                    ELSE 'Even'
                                END AS sem_type,
                                ROUND(AVG(cfr1.percentile), 2) AS percentile1,
                                ROUND(AVG(cfr2.percentile), 2) AS percentile2,
                                ROUND((AVG(cfr1.percentile) + AVG(cfr2.percentile)) / 2, 2) AS avg_percentile
                FROM cfreport1 cfr1
                JOIN cfreport2 cfr2 
                    ON cfr1.sem = cfr2.sem 
                WHERE cfr1.batch BETWEEN ? AND ? 
                    AND cfr1.sem IN (?) 
                    AND cfr2.batch BETWEEN ? AND ? 
                    AND cfr2.sem IN (?)
                GROUP BY sem_type;
        `);
        const cfReportavg: any = await dbQuery(query, [startYear, endYear, sem, startYear, endYear, sem, startYear, endYear, sem, startYear, endYear, sem]);
        return res.json({ done: true, details: cfReportavg });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}
