import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function token(req: Request, res: Response) {
  try {
    const rollno = req.body.usernameInToken;

    // Fetch student details
    const studentDetailsQuery = `SELECT sem, branch FROM studentinfo WHERE rollno = ?`;
    const studentDetailsResult: any = await dbQuery(studentDetailsQuery, [rollno]);

    if (studentDetailsResult.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { sem, branch } = studentDetailsResult[0];

    const isFmeActive = ((sem === 1 || sem === 2) && branch !== 'MBA') ? await (async () => {
      const fmeQuery = `SELECT term, status FROM term WHERE branch = 'FME'`;
      const fmeResult = await dbQuery(fmeQuery);
      return fmeResult.length > 0 ? { term: fmeResult[0].term, status: fmeResult[0].status } : null;
    })() : null;

    const termQuery = `SELECT term, status FROM term WHERE branch = ?`;
    const termResult = await dbQuery(termQuery, [req.body.branchInToken]);

    const termData = termResult.length > 0 ? { term: termResult[0].term, status: termResult[0].status } : null;

    // Determine final term and status
    const finalTerm = isFmeActive ? isFmeActive.term : termData?.term;
    const finalStatus = isFmeActive ? isFmeActive.status : termData?.status;

    const query = `SELECT token${finalTerm} FROM STUDENTINFO WHERE ROLLNO = ?`;
    const result: any = await dbQuery(query, [rollno]);

    const sendTerm = result.length > 0 ? result[0][`token${finalTerm}`] : null;

    return res.json({ token: sendTerm, status: finalStatus });
    
  } catch (err) {
    console.error("Error token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function fetchTerm(req: Request, res: Response) {
  try {

    // IF admin 
    const adminQuery = `SELECT * FROM users WHERE username = ?`;
    const adminResult = await dbQuery(adminQuery, [req.body.usernameInToken]);
    const desg = adminResult.length !== 0 ? adminResult[0].desg : null;

    if (desg === 'admin') {
      const adminTermQuery = `SELECT term FROM term WHERE branch = ?`;
      const adminTermResult = await dbQuery(adminTermQuery, [req.body.branchInToken]);

      const adminTerm = adminTermResult.length > 0 ? adminTermResult[0].term : null;
      return res.json({ done: true, term: adminTerm });
    }

    // Fetch student details
    const studentDetailsQuery = `SELECT sem, branch FROM studentinfo WHERE rollno = ?`;
    const studentDetailsResult: any = await dbQuery(studentDetailsQuery, [req.body.usernameInToken]);

    if (req.body.usernameInToken === 'admin') {
      return res.json({ done: true });
    }

    if (studentDetailsResult.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { sem, branch } = studentDetailsResult[0];

    const isFmeActive = ((sem === 1 || sem === 2) && branch !== 'MBA') ? await (async () => {
      const fmeQuery = `SELECT term FROM term WHERE branch = 'FME'`;
      const fmeResult = await dbQuery(fmeQuery);
      return fmeResult.length > 0 ? fmeResult[0].term : null;
    })() : null;

    const termQuery = `SELECT term FROM term WHERE branch = ?`;
    const termResult = await dbQuery(termQuery, [req.body.branchInToken]);

    const term = termResult.length > 0 ? termResult[0].term : null;
    const finalTerm = isFmeActive !== null ? isFmeActive : term; // Use FME term if available, else branch term

    return res.json({ done: true, term: finalTerm });


  } catch (error) {
    console.error('Error executing query:', error);
    return res.status(500).send('Error executing query');
  }
}